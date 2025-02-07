from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import sys
import os
import logging
from http.server import BaseHTTPRequestHandler
from mangum import Mangum
import asyncio
import traceback
from datetime import datetime
from contextlib import asynccontextmanager
from backend.app.routes import auth, users, photos, generated_images, subscriptions, training, canvas_inference
from backend.app.config.config import settings
from starlette.middleware.sessions import SessionMiddleware
import secrets
from backend.app.utils.db import get_background_db_client, close_background_client

# Set up file logging
log_file = '/tmp/api.log'
os.makedirs(os.path.dirname(log_file), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def log_exception(e: Exception, context: str = ""):
    """Helper function to log exceptions with full details"""
    logger.error(f"Exception in {context}: {str(e)}")
    logger.error(f"Exception type: {type(e)}")
    logger.error(f"Exception args: {e.args}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")

# Log startup information
try:
    logger.info("="*50)
    logger.info(f"Starting application at {datetime.now()}")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Directory contents: {os.listdir('.')}")
    logger.info(f"Environment variables: {dict(os.environ)}")
except Exception as e:
    log_exception(e, "startup logging")

try:
    # Add the backend directory to Python path
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.append(backend_dir)
    logger.info(f"Added {backend_dir} to Python path")
    logger.info(f"Current Python path: {sys.path}")
    
    from backend.app.config import settings
    logger.info("Successfully imported backend modules")
except Exception as e:
    log_exception(e, "backend imports")
    raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the FastAPI app"""
    # Startup: nothing special needed as background client is created on demand
    yield
    # Shutdown: close the background client
    close_background_client()

# Initialize FastAPI with lifespan manager
app = FastAPI(
    title="WhatIf API",
    root_path="/api",
    lifespan=lifespan
)

# Generate a secure session key if not provided in environment
SESSION_SECRET = os.environ.get('SESSION_SECRET', secrets.token_urlsafe(32))

# Add SessionMiddleware with secure configuration
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="whatif_session",
    max_age=3600,
    same_site="lax",
    https_only=settings.ENVIRONMENT == "production",
    path="/api/",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to inject MongoDB into requests
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        server_api=ServerApi('1'),
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=50000,
        connectTimeoutMS=50000,
        socketTimeoutMS=50000
    )
    
    try:
        # Verify the connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        
        request.state.mongodb = client[settings.DB_NAME]
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        raise
    finally:
        client.close()
        logger.info("Closed request-scoped MongoDB connection")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(photos.router, prefix="/photos", tags=["photos"])
app.include_router(generated_images.router, prefix="/generated-images", tags=["generated-images"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(training.router, prefix="/training", tags=["training"])
app.include_router(canvas_inference.router, prefix="/canvasinference", tags=["canvasinference"])

@app.get("/")
async def root():
    logger.info("Handling root request")
    return {"message": "Welcome to WhatIf API"}

@app.get("/debug/logs")
async def get_logs():
    """Endpoint to retrieve application logs"""
    logger.info("Retrieving application logs")
    try:
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = f.read()
            logger.info(f"Successfully read logs, size: {len(logs)} bytes")
            return {"logs": logs}
        else:
            logger.warning(f"Log file not found at {log_file}")
            return {"error": "Log file not found", "path": log_file}
    except Exception as e:
        log_exception(e, "retrieving logs")
        return {"error": str(e), "traceback": traceback.format_exc()}

# Create Mangum handler with custom settings
try:
    mangum_handler = Mangum(app, lifespan="off")
    logger.info("Created Mangum handler successfully")
except Exception as e:
    log_exception(e, "creating Mangum handler")
    raise

# Create Vercel handler
class Handler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        try:
            logger.info("Starting handler initialization")
            super().__init__(*args, **kwargs)
            logger.info("Handler initialization completed successfully")
        except Exception as e:
            log_exception(e, "handler initialization")
            raise

    def _send_cors_headers(self):
        try:
            logger.debug("Sending CORS headers")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Access-Control-Max-Age", "600")
            self.send_header("Content-Type", "application/json")
            logger.debug("CORS headers sent successfully")
        except Exception as e:
            log_exception(e, "sending CORS headers")
            raise

    def do_OPTIONS(self):
        try:
            logger.info(f"Handling OPTIONS request to {self.path}")
            self.send_response(200)
            self._send_cors_headers()
            self.end_headers()
            logger.info("OPTIONS request handled successfully")
        except Exception as e:
            log_exception(e, "handling OPTIONS request")
            raise

    def do_GET(self):
        try:
            logger.info(f"Handling GET request to {self.path}")
            self._handle_request()
        except Exception as e:
            log_exception(e, "handling GET request")
            raise

    def do_POST(self):
        try:
            logger.info(f"Handling POST request to {self.path}")
            self._handle_request()
        except Exception as e:
            log_exception(e, "handling POST request")
            raise

    def do_PUT(self):
        try:
            logger.info(f"Handling PUT request to {self.path}")
            self._handle_request()
        except Exception as e:
            log_exception(e, "handling PUT request")
            raise

    def do_DELETE(self):
        try:
            logger.info(f"Handling DELETE request to {self.path}")
            self._handle_request()
        except Exception as e:
            log_exception(e, "handling DELETE request")
            raise

    def _handle_request(self):
        request_id = datetime.now().strftime('%Y%m%d%H%M%S%f')
        logger.info(f"[{request_id}] ===== Starting {self.command} request to {self.path} =====")
        try:
            # Read request details
            content_length = int(self.headers.get("content-length", 0))
            body = self.rfile.read(content_length).decode() if content_length > 0 else ""
            path_parts = self.path.split('?', 1)
            path = path_parts[0]
            query_string = path_parts[1] if len(path_parts) > 1 else ""
            
            # Log request details
            logger.info(f"[{request_id}] Path: {path}")
            logger.info(f"[{request_id}] Body: {body}")

            # Construct event for Mangum
            raw_path = path[4:] if path.startswith('/api') else path
            event = {
                "version": "2.0",
                "routeKey": f"{self.command} {raw_path}",
                "rawPath": raw_path,
                "rawQueryString": query_string,
                "headers": dict(self.headers),
                "requestContext": {
                    "http": {
                        "method": self.command,
                        "path": raw_path,
                        "protocol": "HTTP/1.1",
                        "sourceIp": self.headers.get("x-forwarded-for", "").split(",")[0].strip(),
                        "userAgent": self.headers.get("user-agent", "")
                    }
                },
                "body": body,
                "isBase64Encoded": False
            }

            # Call the Mangum handler
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                response = mangum_handler(event, {})
                if asyncio.iscoroutine(response):
                    response = loop.run_until_complete(response)
            finally:
                loop.close()
                asyncio.set_event_loop(None)

            # Send response
            self.send_response(response.get("statusCode", 200))
            
            # Send headers
            for key, value in response.get("headers", {}).items():
                self.send_header(key, value)
            self._send_cors_headers()
            self.end_headers()

            # Send body
            if "body" in response:
                self.wfile.write(response["body"].encode())

        except Exception as e:
            logger.error(f"Error handling request: {str(e)}")
            logger.error(traceback.format_exc())
            self.send_error(500, str(e))

# Create the handler instance
handler = Handler 