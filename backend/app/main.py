from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from .config import settings
from .routes import auth, users, photos, generated_images, subscriptions, training

app = FastAPI(title="WhatIf API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    # Create a new client and connect to the server with ServerApi version 1
    app.mongodb_client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        server_api=ServerApi('1'),
        tlsAllowInvalidCertificates=True
    )
    try:
        # Verify the connection
        await app.mongodb_client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e
    
    app.mongodb = app.mongodb_client[settings.DB_NAME]

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(photos.router, prefix="/photos", tags=["photos"])
app.include_router(generated_images.router, prefix="/generated-images", tags=["generated-images"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(training.router, prefix="/training", tags=["training"])


@app.get("/")
async def root():
    return {"message": "Welcome to WhatIf API"} 

