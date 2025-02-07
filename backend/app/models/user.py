from datetime import datetime
from typing import Optional, Any, Literal
from pydantic import BaseModel, EmailStr, Field
from pydantic.functional_serializers import PlainSerializer
from bson import ObjectId
from typing_extensions import Annotated

# Define a custom type for ObjectId with a plain serializer
PyObjectId = Annotated[
    ObjectId,
    PlainSerializer(lambda x: str(x), return_type=str)
]

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    age: Optional[int] = Field(ge=0, le=120, default=None)
    gender: Optional[Literal["male", "female", "other", "not_specified"]] = "not_specified"
    auth_provider: Optional[Literal["email", "google"]] = "email"
    picture_url: Optional[str] = None
    locale: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    class Config:
        arbitrary_types_allowed = True  # Allow arbitrary types like ObjectId

    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    subscription_status: str = Field(default="inactive")  # Can be "inactive", "active", "cancelled"
    subscription_id: Optional[str] = None
    subscription_plan: Optional[str] = None  # "starter", "pro", "premium"
    subscription_type: Optional[str] = None  # "monthly", "yearly"
    subscription_end_date: Optional[datetime] = None

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime
    subscription_status: str
    subscription_plan: Optional[str] = None
    subscription_type: Optional[str] = None
    subscription_end_date: Optional[datetime] = None

class UserResponse(BaseModel):
    email: str
    full_name: str
    token: str
    auth_provider: Optional[str] = None
    picture_url: Optional[str] = None