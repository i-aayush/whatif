from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from typing_extensions import Annotated
from pydantic.functional_serializers import PlainSerializer

PyObjectId = Annotated[
    ObjectId,
    PlainSerializer(lambda x: str(x), return_type=str)
]

class UserImageBase(BaseModel):
    prompt: str
    image_urls: List[str]
    user_id: str

class UserImageInDB(UserImageBase):
    class Config:
        arbitrary_types_allowed = True

    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserImageResponse(UserImageBase):
    id: str = Field(alias="_id")
    created_at: datetime 