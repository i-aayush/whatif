from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from typing_extensions import Annotated
from pydantic.functional_serializers import PlainSerializer

PyObjectId = Annotated[
    ObjectId,
    PlainSerializer(lambda x: str(x), return_type=str)
]

class PhotoBase(BaseModel):
    filename: str
    content_type: str
    user_id: str

class PhotoInDB(PhotoBase):
    class Config:
        arbitrary_types_allowed = True

    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    file_id: PyObjectId
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class PhotoResponse(PhotoBase):
    id: str = Field(alias="_id")
    uploaded_at: datetime 