from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from ..models.user import UserCreate, UserResponse, UserInDB, User
from ..utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..dependencies import get_db

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check if user exists
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_in_db = UserInDB(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        name=user.name
    )
    
    result = await db.users.insert_one(user_in_db.dict(by_alias=True))
    
    # Generate token
    token = create_access_token(data={"sub": user.email})
    
    return UserResponse(email=user.email, token=token)

@router.post("/login", response_model=UserResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    token = create_access_token(data={"sub": form_data.username})
    
    return UserResponse(email=form_data.username, token=token)

@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user 
