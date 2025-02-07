#!/bin/bash

# Deploy the frontend
cd ../frontend
npm run build

git add .
git commit -m "Deploying changes"
git push origin master

# Deploy the backend
cd ..
vercel --prod
