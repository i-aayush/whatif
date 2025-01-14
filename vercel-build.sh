#!/bin/bash
set -e  # Exit on error

echo "Building project..."

# Frontend build
if [ -f "frontend/package.json" ]; then
    cd frontend
    echo "Installing frontend dependencies..."
    npm ci --production || { echo "Frontend dependency installation failed"; exit 1; }
    echo "Building frontend..."
    npm run build || { echo "Frontend build failed"; exit 1; }
    cd ..
else
    echo "Warning: frontend/package.json not found"
fi

# Backend build
if [ -f "requirements.txt" ]; then
    echo "Installing backend dependencies..."
    python -m pip install -r requirements.txt || { echo "Backend dependency installation failed"; exit 1; }
    
    # Copy requirements.txt to backend/api for Vercel
    cp requirements.txt backend/api/
    
else
    echo "Warning: requirements.txt not found"
fi

echo "Build completed successfully"