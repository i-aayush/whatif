# WhatIf - AI-Powered Image Generation

A full-stack application for AI-powered image generation and manipulation.

## Project Structure

```
whatif/
├── frontend/          # Next.js frontend application
│   ├── app/          # Frontend source code
│   ├── public/       # Static files
│   └── package.json  # Frontend dependencies
└── backend/          # FastAPI backend application
    ├── app/          # Backend source code
    └── requirements.txt  # Python dependencies
```

## Setup Instructions

### Backend Setup

1. Create and activate a Python virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
npm run backend:install
# or directly:
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-secret-key-here
DEBUG=True
```

4. Start the backend server:
```bash
npm run backend:dev
# or directly:
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
```bash
npm run install
# or directly:
cd frontend && npm install
```

2. Start the development server:
```bash
npm run frontend:dev
# or directly:
cd frontend && npm run dev
```

The frontend will be available at `http://localhost:3000`

## Available Scripts

- `npm run frontend:dev` - Start frontend development server
- `npm run frontend:build` - Build frontend for production
- `npm run frontend:start` - Start frontend production server
- `npm run backend:dev` - Start backend development server
- `npm run backend:install` - Install backend dependencies
- `npm run install` - Install frontend dependencies

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
