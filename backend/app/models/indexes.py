from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

async def ensure_indexes(db: AsyncIOMotorDatabase):
    """Ensures all required indexes exist in the database"""
    
    # Payments indexes
    await db.payments.create_index([
        ("user_id", 1),
        ("created_at", -1)
    ])
    await db.payments.create_index([
        ("transaction_id", 1)
    ], unique=True)
    await db.payments.create_index([
        ("status", 1),
        ("created_at", -1)
    ])

    # Credit transactions indexes
    await db.credit_transactions.create_index([
        ("user_id", 1),
        ("created_at", -1)
    ])
    await db.credit_transactions.create_index([
        ("run_id", 1)
    ])
    await db.credit_transactions.create_index([
        ("transaction_type", 1),
        ("created_at", -1)
    ])

    # Compound index for credit balance calculation
    await db.credit_transactions.create_index([
        ("user_id", 1),
        ("transaction_type", 1),
        ("created_at", -1)
    ]) 