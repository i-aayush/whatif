from datetime import datetime
from typing import Optional, Any
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
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    class Config:
        arbitrary_types_allowed = True  # Allow arbitrary types like ObjectId

    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime

class UserResponse(BaseModel):
    email: str
    token: str