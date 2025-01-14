from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from mangum import Mangum
from http.server import BaseHTTPRequestHandler
from contextlib import asynccontextmanager
from datetime import datetime
from urllib.parse import parse_qs, unquote
import sys
import os
import json
import asyncio

# ============= MongoDB Configuration =============
mongodb_client = None
mongodb = None

@asynccontextmanager
async def get_db_context():
    """Async context manager for MongoDB connection"""
    global mongodb_client, mongodb
    try:
        if mongodb_client is None:
            mongodb_client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                server_api=ServerApi('1'),
                tlsAllowInvalidCertificates=True
            )
            await mongodb_client.admin.command('ping')
            mongodb = mongodb_client[settings.DB_NAME]
        yield mongodb
    except Exception as e:
        raise
    finally:
        pass

# ============= Backend Setup =============
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
from backend.app.config import settings
from backend.app.routes import auth, users, photos, generated_images, subscriptions, training

# ============= FastAPI Application =============
app = FastAPI(title="WhatIf API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    async with get_db_context() as db:
        request.state.mongodb = db
        response = await call_next(request)
        return response

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

# ============= Vercel Handler =============
class Handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Type", "application/json")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self): self._handle_request()
    def do_POST(self): self._handle_request()
    def do_PUT(self): self._handle_request()
    def do_DELETE(self): self._handle_request()

    def _handle_request(self):
        try:
            # Parse request
            path_parts = self.path.split('?', 1)
            path = path_parts[0]
            query_string = path_parts[1] if len(path_parts) > 1 else ""
            query_params = parse_qs(query_string)

            # Read and parse body
            content_length = int(self.headers.get("content-length", 0))
            body = self.rfile.read(content_length).decode() if content_length > 0 else ""
            
            content_type = self.headers.get("content-type", "")
            if content_type == "application/json" and body:
                try:
                    body = json.loads(body)
                except json.JSONDecodeError:
                    body = {}
            elif content_type == "application/x-www-form-urlencoded" and body:
                form_data = {}
                form_pairs = body.split('&')
                for pair in form_pairs:
                    if '=' in pair:
                        key, value = pair.split('=', 1)
                        form_data[unquote(key)] = unquote(value)
                body = form_data

            # Construct API Gateway event
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
                "queryStringParameters": query_params if query_params else None,
                "body": json.dumps(body) if body else None,
                "isBase64Encoded": False
            }

            # Create new event loop for each request
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                response = loop.run_until_complete(mangum_handler(event, {}))
            finally:
                loop.close()

            # Send response
            status_code = response.get("statusCode", 200)
            self.send_response(status_code)
            
            # Send headers
            headers = response.get("headers", {})
            for key, value in headers.items():
                self.send_header(key, value)
            self._send_cors_headers()
            self.end_headers()

            # Send body
            body = response.get("body", "")
            if body:
                if isinstance(body, str):
                    try:
                        json_body = json.loads(body)
                        response_str = json.dumps(json_body)
                    except json.JSONDecodeError:
                        response_str = json.dumps({"message": body})
                else:
                    response_str = json.dumps(body)
                self.wfile.write(response_str.encode())

        except Exception as e:
            error_response = {"detail": str(e)}
            self.send_response(500)
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())

# Initialize handlers
mangum_handler = Mangum(app, lifespan="off")
handler = Handler