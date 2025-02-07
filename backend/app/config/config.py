from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
from typing import Optional
from pathlib import Path
from functools import lru_cache

# Get the absolute path to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BACKEND_DIR / '.env'

# Load the .env file from the correct location
load_dotenv(ENV_FILE)

class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MONGODB_URI: str
    DB_NAME: str = "whatif"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    
    # API Keys and Credentials
    REPLICATE_API_TOKEN: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    
    # Server Configuration
    NEXT_PUBLIC_API_URL: str = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    PORT: str = "5000"
    DEBUG: bool = False
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    @property
    def FRONTEND_URL(self) -> str:
        """Get frontend URL from API URL"""
        api_url = self.NEXT_PUBLIC_API_URL
        # If API URL is localhost, use port 3000 for frontend
        if "localhost" in api_url or "127.0.0.1" in api_url:
            return "http://localhost:3000"
        # For production/staging, remove /api if present and use the base URL
        base_url = api_url.split('/api')[0] if '/api' in api_url else api_url
        return base_url

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"  # This allows extra fields from .env file

    @property
    def razorpay_credentials_valid(self) -> bool:
        return (
            bool(self.RAZORPAY_KEY_ID)
            and bool(self.RAZORPAY_KEY_SECRET)
            and len(self.RAZORPAY_KEY_ID) > 10
            and len(self.RAZORPAY_KEY_SECRET) > 10
        )

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()