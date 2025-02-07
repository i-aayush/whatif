from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from ..models.user import UserCreate, UserResponse, UserInDB, User
from ..utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..dependencies import get_db
from pydantic import BaseModel
import os
from authlib.integrations.starlette_client import OAuth
from ..config.config import settings
import logging
from urllib.parse import quote, unquote
import secrets
import time
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


# Set up logging with a higher level for production
logging.basicConfig(level=logging.WARNING if settings.ENVIRONMENT == "production" else logging.INFO)
logger = logging.getLogger(__name__)

# Create a singleton Fernet key instance
class FernetKeyManager:
    _instance = None
    _key = None

    @classmethod
    def get_key(cls):
        if cls._key is None:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'oauth_state',
                iterations=50000,  # Reduced iterations for better performance
            )
            key = base64.urlsafe_b64encode(kdf.derive(settings.JWT_SECRET.encode()))
            cls._key = Fernet(key)
        return cls._key

# Replace the existing get_fernet_key function and fernet instance
fernet = FernetKeyManager.get_key()

# OAuth setup
oauth = OAuth()

# Configure OAuth with custom settings
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'prompt': 'select_account'
    },
    authorize_params={
        'access_type': 'offline',
        'include_granted_scopes': 'true'
    },
    session_cookie_name='oauth_session'
)

# Remove excessive OAuth configuration logging
if settings.ENVIRONMENT != "production":
    logger.info("OAuth Configuration:")
    logger.info(f"NEXT_PUBLIC_API_URL: {settings.NEXT_PUBLIC_API_URL}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Google Client ID configured: {'Yes' if settings.GOOGLE_CLIENT_ID else 'No'}")

# Helper function to get frontend URL from API URL
def get_frontend_url() -> str:
    api_url = settings.NEXT_PUBLIC_API_URL
    # If API URL is localhost, use port 3000 for frontend
    if "localhost" in api_url or "127.0.0.1" in api_url:
        return "http://localhost:3000"
    # For production/staging, remove /api if present and use the base URL
    base_url = api_url.split('/api')[0] if '/api' in api_url else api_url
    return base_url

class LoginRequest(BaseModel):
    username: str
    password: str

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
        full_name=user.full_name,
        age=user.age,
        gender=user.gender
    )
    
    result = await db.users.insert_one(user_in_db.dict(by_alias=True))
    
    # Generate token
    token = create_access_token(data={"sub": user.email})
    
    return UserResponse(email=user.email, token=token, full_name=user.full_name)

@router.post("/login", response_model=UserResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        user = await db['users'].find_one({"email": credentials.username})
        
        if not user or not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = create_access_token(data={"sub": credentials.username})
        return UserResponse(email=credentials.username, token=token, full_name=user["full_name"])
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise

@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user 

@router.get('/google/login')
async def google_login(request: Request):
    try:
        # Keep only essential logging in production
        if settings.ENVIRONMENT != "production":
            logger.info("Google Login Request initiated")
        
        # Get the host from headers
        host = request.headers.get('x-forwarded-host', request.headers.get('host', 'localhost'))
        scheme = request.headers.get('x-forwarded-proto', 'https')
        redirect_uri = f"{scheme}://{host}/api/auth/google/callback"
        
        # Generate state
        timestamp = int(time.time())
        state_data = f"{secrets.token_urlsafe(8)}:{timestamp}"
        encrypted_state = fernet.encrypt(state_data.encode()).decode()
        safe_state = quote(encrypted_state, safe='')
        
        # Redirect to Google
        return await oauth.google.authorize_redirect(
            request,
            redirect_uri,
            state=safe_state
        )
            
    except Exception as e:
        logger.error(f"Error in google_login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get('/google/callback')
async def google_auth(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        frontend_url = get_frontend_url()
        
        # Verify state
        encrypted_state = request.query_params.get('state', '')
        if not encrypted_state:
            return RedirectResponse(url=f"{frontend_url}/login?error=Invalid session")
        
        try:
            decoded_state = unquote(encrypted_state)
            decrypted_data = fernet.decrypt(decoded_state.encode()).decode()
            random_str, timestamp_str = decrypted_data.split(':')
            timestamp = int(timestamp_str)
            if int(time.time()) - timestamp > 900:
                return RedirectResponse(url=f"{frontend_url}/login?error=Session expired")
        except Exception as e:
            logger.error(f"State verification failed: {str(e)}")
            return RedirectResponse(url=f"{frontend_url}/login?error=Invalid session")
        
        # Get OAuth token
        try:
            token = await oauth.google.authorize_access_token(request)
            logger.info("OAuth token obtained successfully")
        except Exception as e:
            logger.error(f"OAuth token acquisition failed: {str(e)}", exc_info=True)
            return RedirectResponse(
                url=f"{frontend_url}/login?error=Authentication failed: Unable to verify OAuth state"
            )
        
        # Get user info
        try:
            resp = await oauth.google.get('https://www.googleapis.com/oauth2/v3/userinfo', token=token)
            user_info = resp.json()
        except Exception as e:
            logger.error(f"Error getting user info: {str(e)}", exc_info=True)
            return RedirectResponse(
                url=f"{frontend_url}/login?error=Authentication failed: Unable to get user info"
            )

        # Process user data and database operations
        email = user_info['email']
        full_name = user_info.get('name', '')
        
        # Check if user exists
        user = await db.users.find_one({"email": email})
        
        if not user:
            # Create new user
            user_in_db = UserInDB(
                email=email,
                hashed_password=get_password_hash(os.urandom(32).hex()),
                full_name=full_name,
                auth_provider="google",
                picture_url=user_info.get('picture', ''),
                locale=user_info.get('locale', ''),
                given_name=user_info.get('given_name', ''),
                family_name=user_info.get('family_name', '')
            )
            await db.users.insert_one(user_in_db.dict(by_alias=True))
        
        # Generate JWT token
        access_token = create_access_token(data={"sub": email})
        
        # Get user's _id
        user = await db.users.find_one({"email": email})
        user_id = str(user["_id"])
        
        return RedirectResponse(
            url=f"{frontend_url}/login/callback?token={access_token}&email={email}&full_name={full_name}&picture={user_info.get('picture', '')}&auth_provider=google&user_id={user_id}"
        )
            
    except Exception as e:
        logger.error(f"Critical OAuth error: {str(e)}", exc_info=True)
        return RedirectResponse(
            url=f"{frontend_url}/login?error=Authentication failed: {str(e)}"
        ) 
