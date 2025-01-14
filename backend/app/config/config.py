from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = "whatif"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REPLICATE_KEY: str = os.getenv("REPLICATE_API_TOKEN", "your-replicate-key")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "your-razorpay-key-id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "your-razorpay-key-secret")

settings = Settings() 