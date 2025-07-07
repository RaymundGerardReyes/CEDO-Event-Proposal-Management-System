#!/bin/bash

# CEDO Google Auth - Quick Setup Script
# This script will help you get the authentication system running

echo "🚀 CEDO Google Auth - Quick Setup"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Installing dependencies..."
echo "Installing backend dependencies..."
cd backend
npm install

echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo "📋 Step 2: Checking environment files..."
cd ../backend
if [ ! -f ".env" ]; then
    echo "❌ Backend .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

cd ../frontend
if [ ! -f ".env.local" ]; then
    echo "❌ Frontend .env.local file not found. Please copy env.example to .env.local and configure it."
    exit 1
fi

echo "📋 Step 3: Initializing databases..."
cd ../backend
echo "Initializing MySQL database..."
npm run init-db

echo "Initializing MongoDB..."
npm run init-mongodb

echo "📋 Step 4: Creating admin user..."
node scripts/create-admin.js

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Add your Google OAuth credentials to both .env files"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Test authentication at http://localhost:3000"
echo ""
echo "📖 For detailed instructions, see SETUP_GUIDE.md" 