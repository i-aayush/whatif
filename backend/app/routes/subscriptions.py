from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any
import razorpay
from ..models.user import User
from ..utils.auth import get_current_user
from ..config import settings
import hmac
import hashlib
from pydantic import BaseModel
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..dependencies import get_db

router = APIRouter()

# Initialize Razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
# Define request models
class SubscriptionRequest(BaseModel):
    plan_name: str
    billing_type: str

class VerificationRequest(BaseModel):
    payment_id: str
    subscription_id: str
    signature: str

# Define plan IDs
PLAN_IDS = {
    "starter": {
        "monthly": "plan_PgyKhrQGGeYwIx",  # ₹1,999/month
        "yearly": "plan_PgzntyEVHPcIp4",   # ₹9,999/year
    },
    "pro": {
        "monthly": "plan_PgyLW0D6iPFGiW",  # ₹3,999/month
        "yearly": "plan_PgzomfZyYBhP4k",   # ₹19,999/year
    },
    "premium": {
        "monthly": "plan_PgyM8nXdog2O7W",  # ₹8,999/month
        "yearly": "plan_PgzpwKnYy75EJq",   # ₹49,999/year
    }
}

@router.post("/create-subscription")
async def create_subscription(
    request: SubscriptionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        print(f"Creating subscription for user: {current_user.get('email')}")
        print(f"Request data - Plan: {request.plan_name}, Billing: {request.billing_type}")
        
        print("Debug - Razorpay Configuration:")
        print(f"Key ID length: {len(settings.RAZORPAY_KEY_ID) if settings.RAZORPAY_KEY_ID else 0}")
        print(f"Key Secret length: {len(settings.RAZORPAY_KEY_SECRET) if settings.RAZORPAY_KEY_SECRET else 0}")
        print(f"Key ID: {settings.RAZORPAY_KEY_ID}")
        print(f"Key Secret: {settings.RAZORPAY_KEY_SECRET}")
        
        # Validate Razorpay credentials
        if not settings.razorpay_credentials_valid:
            print("Invalid Razorpay credentials configuration")
            raise HTTPException(
                status_code=500,
                detail="Payment service configuration error. Please contact support."
            )
        
        plan_id = PLAN_IDS.get(request.plan_name.lower(), {}).get(request.billing_type.lower())
        print(f"Selected plan_id: {plan_id}")
        
        if not plan_id:
            print(f"Invalid plan configuration - plan_name: {request.plan_name}, billing_type: {request.billing_type}")
            raise HTTPException(status_code=400, detail="Invalid plan configuration")

        subscription_data = {
            "plan_id": plan_id,
            "customer_notify": 1,
            "quantity": 1,
            "total_count": 1 if request.billing_type.lower() == "yearly" else 12,
            "notes": {
                "user_id": str(current_user.get('_id')),
                "email": current_user.get('email')
            }
        }
        print(f"Subscription data being sent to Razorpay: {subscription_data}")

        print(f"Razorpay client config - Key ID: {settings.RAZORPAY_KEY_ID}")
        print(f"Initializing Razorpay client with auth: ({settings.RAZORPAY_KEY_ID[:6]}..., {settings.RAZORPAY_KEY_SECRET[:6]}...)")
        
        # Reinitialize client with current settings
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        subscription = client.subscription.create(data=subscription_data)
        print(f"Razorpay response: {subscription}")

        return {
            "subscription_id": subscription.get('id'),
            "key_id": settings.RAZORPAY_KEY_ID,
            "user_details": {
                "name": current_user.get('full_name'),
                "email": current_user.get('email'),
                "contact": current_user.get('phone_number')
            }
        }

    except razorpay.errors.BadRequestError as e:
        print(f"Razorpay BadRequestError: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Razorpay error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error during subscription creation: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(status_code=400, detail=f"Subscription creation failed: {str(e)}")

@router.post("/verify-subscription")
async def verify_subscription(
    request: VerificationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        print(f"Verifying subscription for user: {current_user.get('email')}")
        print(f"Verification request data: {request}")
        
        # Verify the payment signature
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{request.payment_id}|{request.subscription_id}".encode(),
            hashlib.sha256
        ).hexdigest()

        if expected_signature != request.signature:
            print("Signature verification failed")
            print(f"Expected: {expected_signature}")
            print(f"Received: {request.signature}")
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        # Verify subscription status
        print("Fetching subscription details from Razorpay")
        subscription = client.subscription.fetch(request.subscription_id)
        print(f"Subscription details: {subscription}")
        
        if subscription.get('status') != "active":
            print(f"Invalid subscription status: {subscription.get('status')}")
            raise HTTPException(status_code=400, detail="Subscription is not active")

        # Get plan details from subscription
        plan_id = subscription.get('plan_id')
        plan_name = None
        billing_type = None
        
        for name, types in PLAN_IDS.items():
            for bill_type, pid in types.items():
                if pid == plan_id:
                    plan_name = name
                    billing_type = bill_type
                    break
            if plan_name:
                break

        subscription_end = datetime.fromtimestamp(subscription.get('current_end'))
        user_id = current_user.get("_id")

        print(f"Updating user {user_id} with subscription details")
        print(f"Plan: {plan_name}, Type: {billing_type}, End date: {subscription_end}")

        # Update user's subscription status in database
        result = await db["users"].update_one(
            {"_id": user_id},
            {"$set": {
                "subscription_status": "active",
                "subscription_id": request.subscription_id,
                "subscription_plan": plan_name,
                "subscription_type": billing_type,
                "subscription_end_date": subscription_end
            }}
        )

        if result.matched_count == 0:
            print(f"User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "status": "success", 
            "subscription": subscription,
            "user_id": user_id,
            "subscription_details": {
                "plan": plan_name,
                "type": billing_type,
                "end_date": subscription_end
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error during subscription verification: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(status_code=400, detail=str(e)) 