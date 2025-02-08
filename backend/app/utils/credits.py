from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from ..models.payment import CreditTransactionInDB
from fastapi import HTTPException, status

async def get_user_credit_balance(db: AsyncIOMotorDatabase, user_id: str) -> int:
    """Calculate user's current credit balance"""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total": {"$sum": "$amount"}
        }}
    ]
    
    result = await db.credit_transactions.aggregate(pipeline).to_list(1)
    return result[0]["total"] if result else 0

async def check_sufficient_credits(db: AsyncIOMotorDatabase, user_id: str, required_credits: int) -> bool:
    """Check if user has sufficient credits"""
    balance = await get_user_credit_balance(db, user_id)
    return balance >= required_credits

async def create_credit_transaction(
    db: AsyncIOMotorDatabase,
    user_id: str,
    amount: int,
    transaction_type: str,
    description: str,
    run_id: Optional[str] = None
) -> CreditTransactionInDB:
    """Create a new credit transaction"""
    transaction = CreditTransactionInDB(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        description=description,
        run_id=run_id
    )
    
    await db.credit_transactions.insert_one(transaction.dict(by_alias=True))
    return transaction

async def deduct_credits(
    db: AsyncIOMotorDatabase,
    user_id: str,
    amount: int,
    description: str,
    run_id: Optional[str] = None
) -> CreditTransactionInDB:
    """Deduct credits from user's balance"""
    if not await check_sufficient_credits(db, user_id, amount):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits"
        )
    
    return await create_credit_transaction(
        db=db,
        user_id=user_id,
        amount=-amount,  # Negative amount for deduction
        transaction_type="usage",
        description=description,
        run_id=run_id
    )

async def add_credits(
    db: AsyncIOMotorDatabase,
    user_id: str,
    amount: int,
    transaction_type: str,
    description: str
) -> CreditTransactionInDB:
    """Add credits to user's balance"""
    return await create_credit_transaction(
        db=db,
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        description=description
    ) 