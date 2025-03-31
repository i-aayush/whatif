from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from pydantic import BaseModel
import razorpay
import logging
from ..dependencies import get_db
from ..utils.auth import get_current_user
from ..utils.credits import get_user_credit_balance, add_credits, deduct_credits
from ..utils.credit_constants import CREDIT_PACKAGES
from ..config import settings
from ..models.payment import (
    PaymentInDB,
    PaymentResponse,
    CreditTransactionInDB,
    CreditTransactionResponse
)

# Configure logging
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

router = APIRouter()

# Initialize Razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CreditPurchaseRequest(BaseModel):
    package_type: str
    amount: float
    credits: int

class PaymentVerificationRequest(BaseModel):
    payment_id: str
    order_id: str
    signature: str

@router.get("/balance", response_model=dict)
async def get_credits_balance(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current user's credit balance"""
    balance = await get_user_credit_balance(db, str(current_user["_id"]))
    return {"balance": balance}

@router.get("/transactions", response_model=List[CreditTransactionResponse])
async def get_credit_transactions(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user's credit transaction history"""
    transactions = await db.credit_transactions.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return [CreditTransactionResponse(**t) for t in transactions]

@router.get("/payments", response_model=List[PaymentResponse])
async def get_payment_history(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user's payment history"""
    payments = await db.payments.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return [PaymentResponse(**p) for p in payments]

@router.post("/purchase", response_model=dict)
async def create_credit_purchase(
    request: CreditPurchaseRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a Razorpay order for credit purchase"""
    try:
        # Validate package type and amount
        package = CREDIT_PACKAGES.get(request.package_type.lower())
        if not package:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid package type"
            )
        
        if request.amount != package["price_usd"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid amount for package"
            )
        
        if request.credits != package["credits"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid credits for package"
            )

        # Convert USD to INR (using a fixed conversion rate for now)
        # TODO: Use a real-time conversion rate in production
        USD_TO_INR_RATE = 83  # Current approximate rate
        amount_inr = int(request.amount * USD_TO_INR_RATE * 100)  # Convert to paise

        # Create Razorpay order
        order_data = {
            "amount": amount_inr,  # Amount in paise
            "currency": "INR",     # Razorpay primarily works with INR
            "notes": {
                "user_id": str(current_user["_id"]),
                "package_type": request.package_type,
                "credits": request.credits,
                "amount_usd": request.amount
            }
        }
        
        order = client.order.create(data=order_data)

        # Create pending payment record
        payment = PaymentInDB(
            user_id=str(current_user["_id"]),
            amount=request.amount,
            currency="USD",
            payment_method="razorpay",
            credits_purchased=request.credits,
            transaction_id=order["id"],
            status="pending"
        )
        
        await db.payments.insert_one(payment.dict(by_alias=True))

        return {
            "order_id": order["id"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "amount": amount_inr,  # Send INR amount to frontend
            "currency": "INR",     # Send currency to frontend
            "user_details": {
                "name": current_user.get("full_name"),
                "email": current_user.get("email")
            }
        }

    except razorpay.errors.BadRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment", response_model=PaymentResponse)
async def verify_payment(
    request: PaymentVerificationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verify a payment and add credits"""
    try:
        logger.info("=== Starting Payment Verification ===")
        logger.info(f"Payment ID: {request.payment_id}")
        logger.info(f"Order ID: {request.order_id}")
        logger.info(f"User ID: {current_user.get('_id')}")
        
        # Find the payment
        payment = await db.payments.find_one({"transaction_id": request.order_id})
        if not payment:
            logger.error(f"Payment record not found in database for order_id: {request.order_id}")
            # Let's check what payments exist for this user
            all_payments = await db.payments.find({"user_id": str(current_user["_id"])}).to_list(length=10)
            logger.info(f"Recent payments for user: {all_payments}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        logger.info(f"Found payment record: {payment}")
        
        # Check if payment is already processed
        if payment.get("status") == "completed":
            logger.warning(f"Payment already processed: {request.order_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already processed"
            )
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': request.order_id,
            'razorpay_payment_id': request.payment_id,
            'razorpay_signature': request.signature
        }
        logger.info(f"Attempting signature verification with params: {params_dict}")
        
        try:
            # Fetch order from Razorpay to verify it exists
            order = client.order.fetch(request.order_id)
            logger.info(f"Razorpay order details: {order}")
            
            # Verify signature
            client.utility.verify_payment_signature(params_dict)
            logger.info("Signature verification successful")
        except razorpay.errors.SignatureVerificationError as sve:
            logger.error(f"Signature verification failed: {str(sve)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payment signature: {str(sve)}"
            )
        except Exception as e:
            logger.error(f"Error during Razorpay verification: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment verification failed: {str(e)}"
            )
        
        logger.info("Updating payment status in database...")
        # Update payment status and add payment_id
        update_result = await db.payments.update_one(
            {"transaction_id": request.order_id},
            {
                "$set": {
                    "status": "completed",
                    "payment_id": request.payment_id
                }
            }
        )
        logger.info(f"Update result: {update_result.modified_count} document(s) modified")
        
        if update_result.modified_count == 0:
            logger.error("Failed to update payment status in database")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update payment status"
            )
        
        credits_to_add = payment.get("credits_purchased", 0)
        user_id = str(current_user["_id"])
        logger.info(f"Adding {credits_to_add} credits to user {user_id}")
        
        # Add credits
        try:
            await add_credits(
                db=db,
                user_id=user_id,
                amount=credits_to_add,
                transaction_type="purchase",
                description=f"Credits purchased - {credits_to_add} credits"
            )
            logger.info("Credits added successfully")
        except Exception as credit_error:
            logger.error(f"Failed to add credits: {str(credit_error)}")
            logger.error(f"Credit error type: {type(credit_error)}")
            # Rollback payment status
            await db.payments.update_one(
                {"transaction_id": request.order_id},
                {"$set": {"status": "failed"}}
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add credits: {str(credit_error)}"
            )
        
        # Get updated payment record
        updated_payment = await db.payments.find_one({"transaction_id": request.order_id})
        if not updated_payment:
            logger.error("Failed to fetch updated payment record")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch updated payment record"
            )
            
        logger.info(f"Payment verification completed successfully")
        logger.info(f"Final payment record: {updated_payment}")
        return PaymentResponse(**updated_payment)

    except HTTPException as he:
        logger.error(f"HTTP Exception in payment verification: {str(he)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in payment verification: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        ) 