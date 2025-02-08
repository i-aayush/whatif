from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from ..dependencies import get_db
from ..utils.auth import get_current_user
from ..utils.credits import get_user_credit_balance, add_credits, deduct_credits
from ..models.payment import (
    PaymentInDB,
    PaymentResponse,
    CreditTransactionInDB,
    CreditTransactionResponse
)
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter()

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

@router.post("/verify-payment", response_model=PaymentResponse)
async def verify_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verify a payment and add credits"""
    # Find the payment
    payment = await db.payments.find_one({"transaction_id": payment_id})
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if payment is already processed
    if payment["status"] == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already processed"
        )
    
    # Update payment status
    await db.payments.update_one(
        {"transaction_id": payment_id},
        {"$set": {"status": "completed"}}
    )
    
    # Add credits
    await add_credits(
        db=db,
        user_id=str(current_user["_id"]),
        amount=payment["credits_purchased"],
        transaction_type="purchase",
        description=f"Credits purchased - Payment ID: {payment_id}"
    )
    
    return PaymentResponse(**payment) 