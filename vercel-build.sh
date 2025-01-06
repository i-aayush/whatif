#!/bin/bash
echo "Building project..."

# Debug info
echo "Checking directory sizes before build:"
du -sh *

if [ -f "frontend/package.json" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
fi
if [ -f "backend/requirements.txt" ]; then
    cd backend
    # Install with --no-deps to avoid unnecessary dependencies
    pip install --no-deps -r requirements.txt --target .
    # Install only critical dependencies manually
    pip install --no-deps typing_extensions==4.7.1 --target .
    pip install --no-deps starlette==0.27.0 --target .
    pip install --no-deps click==8.1.7 --target .
    cd ..
fi 

# Debug info after installation
echo "Checking directory sizes after installation:"
du -sh *

# Aggressive cleanup
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type d -name "*.dist-info" -exec rm -r {} +
find . -type d -name "*.egg-info" -exec rm -r {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.pyd" -delete
find . -type d -name "tests" -exec rm -r {} +
find . -type d -name "test" -exec rm -r {} +
find . -type f -name "*.so" -delete

# Debug info after cleanup
echo "Checking directory sizes after cleanup:"
du -sh *