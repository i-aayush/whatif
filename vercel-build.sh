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
    # Create a virtual environment
    python -m venv .venv
    source .venv/bin/activate
    
    # Install packages with minimal dependencies
    pip install --no-cache-dir --no-deps -r requirements.txt
    
    # Cleanup unnecessary files
    find . -type d -name "__pycache__" -exec rm -r {} +
    find . -type d -name "*.dist-info" -exec rm -r {} +
    find . -type d -name "*.egg-info" -exec rm -r {} +
    find . -type f -name "*.pyc" -delete
    find . -type f -name "*.pyo" -delete
    find . -type f -name "*.pyd" -delete
    
    deactivate
    cd ..
fi