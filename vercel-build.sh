#!/bin/bash
echo "Building project..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
fi
if [ -f "backend/requirements.txt" ]; then
    cd backend
    pip install -r requirements.txt
    cd ..
fi 