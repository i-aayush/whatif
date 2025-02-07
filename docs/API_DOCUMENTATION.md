# API Documentation

## Base URL
```
/api
```

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Sign Up
```http
POST /auth/signup
```

Request Body:
```json
{
  "email": "string",
  "password": "string",
  "full_name": "string",
  "age": "integer?",
  "gender": "string?"
}
```

Response:
```json
{
  "email": "string",
  "full_name": "string",
  "token": "string"
}
```

#### Login
```http
POST /auth/login
```

Request Body:
```json
{
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "email": "string",
  "full_name": "string",
  "token": "string"
}
```

## User Management

#### Get Current User
```http
GET /users/me
```

Response:
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "age": "integer?",
  "gender": "string?",
  "picture_url": "string?",
  "subscription_status": "string",
  "subscription_plan": "string?",
  "subscription_type": "string?"
}
```

#### Get User's Subscription Status
```http
GET /users/me/subscription
```

Response:
```json
{
  "status": "string"
}
```

## Photo Management

#### Upload Photo
```http
POST /photos/upload
```

Request Body:
```
multipart/form-data
file: binary
```

Response:
```json
{
  "id": "string",
  "filename": "string",
  "content_type": "string",
  "user_id": "string",
  "uploaded_at": "datetime"
}
```

#### Get User's Photos
```http
GET /photos/user/{user_id}
```

Response:
```json
[
  {
    "id": "string",
    "filename": "string",
    "content_type": "string",
    "user_id": "string",
    "uploaded_at": "datetime"
  }
]
```

#### Get Photo
```http
GET /photos/{photo_id}
```

Response:
```
Binary file content
```

## Generated Images

#### Save Generated Images
```http
POST /generated-images/
```

Request Body:
```json
{
  "prompt": "string",
  "image_urls": ["string"]
}
```

Response:
```json
{
  "id": "string",
  "prompt": "string",
  "image_urls": ["string"],
  "user_id": "string",
  "created_at": "datetime"
}
```

#### Get User's Generated Images
```http
GET /generated-images/user/{user_id}
```

Response:
```json
[
  {
    "id": "string",
    "prompt": "string",
    "image_urls": ["string"],
    "user_id": "string",
    "created_at": "datetime"
  }
]
```

## Subscription Management

#### Create Subscription
```http
POST /subscriptions/create
```

Request Body:
```json
{
  "plan_name": "string",
  "billing_type": "string"
}
```

Response:
```json
{
  "subscription_id": "string",
  "payment_id": "string"
}
```

#### Verify Subscription
```http
POST /subscriptions/verify
```

Request Body:
```json
{
  "payment_id": "string",
  "subscription_id": "string",
  "signature": "string"
}
```

Response:
```json
{
  "status": "string",
  "message": "string"
}
```

## Training Management

#### Upload and Train
```http
POST /training/upload-and-train
```

Request Body:
```
multipart/form-data
files: [binary]
model_name: string
```

Response:
```json
{
  "training_id": "string",
  "status": "string",
  "model_name": "string"
}
```

#### Poll Training Status
```http
GET /training/{training_id}/status
```

Response:
```json
{
  "status": "string",
  "version": "string?",
  "weights": "string?",
  "error": "string?"
}
```

## Canvas Inference

#### Generate Image
```http
POST /canvasinference/generate
```

Request Body:
```json
{
  "prompt": "string",
  "negative_prompt": "string?",
  "num_inference_steps": "integer?",
  "guidance_scale": "number?"
}
```

Response:
```json
{
  "images": ["string"],
  "status": "string"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Error message explaining the issue"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```
