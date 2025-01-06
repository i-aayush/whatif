import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from ..dependencies import get_db
from ..utils.auth import get_current_user
from ..models.user import User
from ..models.photo import PhotoInDB, PhotoResponse
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson import ObjectId


router = APIRouter()

@router.post("/upload", response_model=PhotoResponse)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Upload a new photo"""
    contents = await file.read()
    
    # Create GridFS bucket
    fs = AsyncIOMotorGridFSBucket(db)
    
    # Upload file to GridFS
    file_id = await fs.upload_from_stream(
        file.filename,
        contents,
        metadata={"content_type": file.content_type, "user_id": current_user.id}
    )
    
    # Create photo document
    photo_data = PhotoInDB(
        filename=file.filename,
        content_type=file.content_type,
        user_id=current_user.id,
        file_id=file_id
    )
    
    # Save photo metadata
    result = await db["photos"].insert_one(photo_data.dict(by_alias=True))
    
    # Fetch the created photo
    created_photo = await db["photos"].find_one({"_id": result.inserted_id})
    return created_photo

@router.get("/user/{user_id}", response_model=list[PhotoResponse])
async def get_user_photos(
    user_id: str,
    db = Depends(get_db)
):
    """Get all photos for a specific user"""
    photos = await db["photos"].find({"user_id": user_id}).to_list(length=None)
    return photos

@router.get("/{photo_id}")
async def get_photo(
    photo_id: str,
    db = Depends(get_db)
):
    """Get a specific photo"""
    # Find photo metadata
    photo = await db["photos"].find_one({"_id": ObjectId(photo_id)})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Create GridFS bucket
    fs = AsyncIOMotorGridFSBucket(db)
    
    try:
        # Get file from GridFS
        grid_out = await fs.open_download_stream(photo["file_id"])
        contents = await grid_out.read()
        
        return StreamingResponse(
            io.BytesIO(contents),
            media_type=photo["content_type"]
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Photo file not found") 