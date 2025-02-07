from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from functools import lru_cache
from ..config.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

# Global client for background tasks
_background_client = None

def get_background_db_client():
    """Get a persistent database client for background tasks"""
    global _background_client
    if _background_client is None:
        _background_client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            server_api=ServerApi('1'),
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=50000,
            connectTimeoutMS=50000,
            socketTimeoutMS=50000,
            maxPoolSize=10
        )
        # Mark this client as a background client
        setattr(_background_client, '_is_background', True)
    return _background_client

async def get_db():
    """Get a database instance for request-scoped operations"""
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        server_api=ServerApi('1'),
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=50000,
        connectTimeoutMS=50000,
        socketTimeoutMS=50000
    )
    try:
        yield client[settings.DB_NAME]
    finally:
        client.close()

def close_background_client():
    """Close the background client - should only be called on application shutdown"""
    global _background_client
    if _background_client:
        _background_client.close()
        _background_client = None 