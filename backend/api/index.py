from fastapi import FastAPI
from mangum import Mangum
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes only when needed
from app.routes import auth, users, photos, generated_images

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(photos.router, prefix="/api/photos", tags=["photos"])
app.include_router(generated_images.router, prefix="/api/generated-images", tags=["generated-images"])

# Create handler for AWS Lambda / Vercel
handler = Mangum(app, lifespan="off") 