from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from bson import ObjectId
from typing_extensions import Annotated
from pydantic.functional_serializers import PlainSerializer

# Define a custom type for ObjectId with a plain serializer
PyObjectId = Annotated[
    ObjectId,
    PlainSerializer(lambda x: str(x), return_type=str)
]

class PaymentBase(BaseModel):
    user_id: str
    amount: float
    currency: str = "USD"
    payment_method: str
    credits_purchased: int
    transaction_id: str

class PaymentInDB(PaymentBase):
    class Config:
        arbitrary_types_allowed = True

    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    status: str = "pending"  # pending, completed, failed, refunded
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentResponse(PaymentBase):
    id: str = Field(alias="_id")
    status: str
    created_at: datetime

class CreditTransactionBase(BaseModel):
    user_id: str
    amount: int  # Positive for purchases, negative for usage
    transaction_type: Literal["purchase", "usage", "refund", "bonus", "expiry"]
    description: str

class CreditTransactionInDB(CreditTransactionBase):
    class Config:
        arbitrary_types_allowed = True

    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    run_id: Optional[str] = None  # Foreign key to Run (nullable)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CreditTransactionResponse(CreditTransactionBase):
    id: str = Field(alias="_id")
    run_id: Optional[str] = None
    created_at: datetime 