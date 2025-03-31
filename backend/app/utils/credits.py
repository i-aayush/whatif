from typing import Optional, Literal, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.payment import CreditTransactionInDB
from fastapi import HTTPException, status
from bson import ObjectId
from pymongo.errors import PyMongoError
from datetime import datetime

# Define valid transaction types
TransactionType = Literal["purchase", "usage", "refund", "bonus", "expiry"]

async def calculate_balance_from_transactions(db: AsyncIOMotorDatabase, user_id: str) -> int:
    """Calculate user's credit balance from transactions collection"""
    try:
        pipeline = [
            {"$match": {"user_id": str(user_id)}},
            {"$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }}
        ]
        result = await db.credit_transactions.aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while calculating balance: {str(e)}"
        )

async def get_user_credit_balance(db: AsyncIOMotorDatabase, user_id: str) -> int:
    """Get user's current credit balance from users collection"""
    try:
        user = await db.users.find_one({"_id": user_id}, {"credits_balance": 1})
        if user is None or "credits_balance" not in user:
            # Initialize credits only if user exists but credits aren't initialized
            if await db.users.find_one({"_id": user_id}):
                await initialize_user_credits(db, user_id)
                return 0
            return 0
        return user.get("credits_balance", 0)
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching credit balance: {str(e)}"
        )

async def reconcile_credit_balance(db: AsyncIOMotorDatabase, user_id: str) -> Tuple[int, bool]:
    """
    Reconcile credit balance between transactions and user collection.
    Returns tuple of (correct_balance, was_reconciled)
    """
    try:
        calculated_balance = await calculate_balance_from_transactions(db, user_id)
        stored_balance = await get_user_credit_balance(db, user_id)

        if calculated_balance != stored_balance:
            # Update the user's balance to match transaction history
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "credits_balance": calculated_balance,
                        "last_balance_reconciliation": datetime.utcnow()
                    }
                }
            )
            return calculated_balance, True
        return stored_balance, False
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during reconciliation: {str(e)}"
        )

async def initialize_user_credits(db: AsyncIOMotorDatabase, user_id: str, initial_credits: int = 0) -> None:
    """Initialize credits_balance for a new user"""
    try:
        await db.users.update_one(
            {"_id": user_id},
            {
                "$setOnInsert": {
                    "credits_balance": initial_credits,
                    "last_balance_reconciliation": datetime.utcnow()
                }
            },
            upsert=True
        )
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while initializing credits: {str(e)}"
        )

async def check_sufficient_credits(db: AsyncIOMotorDatabase, user_id: str, required_credits: int) -> bool:
    """Check if user has sufficient credits"""
    if required_credits <= 0:
        raise ValueError("Required credits must be positive")
    
    # First check stored balance
    balance = await get_user_credit_balance(db, user_id)
    
    # If balance is negative or seems incorrect, reconcile
    if balance < 0:
        balance, was_reconciled = await reconcile_credit_balance(db, user_id)
    
    return balance >= required_credits

async def create_credit_transaction(
    db: AsyncIOMotorDatabase,
    user_id: str,
    amount: int,
    transaction_type: TransactionType,
    description: str,
    run_id: Optional[str] = None
) -> CreditTransactionInDB:
    """Create a new credit transaction and update user's balance"""
    # Validate inputs
    if amount == 0:
        raise ValueError("Transaction amount cannot be zero")
        
    transaction = CreditTransactionInDB(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        description=description,
        run_id=run_id
    )
    
    try:
        # Start a transaction to ensure atomicity
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                # Verify user exists and get current balance
                user = await db.users.find_one(
                    {"_id": ObjectId(user_id)},
                    {"credits_balance": 1},
                    session=session
                )
                
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found"
                    )
                
                # Insert the transaction
                await db.credit_transactions.insert_one(
                    transaction.dict(by_alias=True),
                    session=session
                )
                
                # Update user's balance
                new_balance = user.get("credits_balance", 0) + amount
                result = await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {
                            "credits_balance": new_balance,
                            "last_balance_update": datetime.utcnow()
                        }
                    },
                    session=session
                )
                
                if result.matched_count == 0:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found"
                    )
        
        return transaction
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating credit transaction: {str(e)}"
        )

async def deduct_credits(
    db: AsyncIOMotorDatabase,
    user_id: str,
    amount: int,
    description: str,
    run_id: Optional[str] = None
) -> CreditTransactionInDB:
    """Deduct credits from user's balance"""
    if amount <= 0:
        raise ValueError("Deduction amount must be positive")
        
    # Reconcile balance before checking if sufficient credits
    balance, was_reconciled = await reconcile_credit_balance(db, user_id)
    if not balance >= amount:
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
    transaction_type: TransactionType,
    description: str
) -> CreditTransactionInDB:
    """Add credits to user's balance"""
    if amount <= 0:
        raise ValueError("Credit amount must be positive")
        
    if transaction_type not in ["purchase", "refund", "bonus"]:
        raise ValueError(f"Invalid transaction type for credit addition: {transaction_type}")
    
    return await create_credit_transaction(
        db=db,
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        description=description
    ) 