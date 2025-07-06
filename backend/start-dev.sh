#!/bin/bash

# CEDO Backend Development Startup Script
# This script sets the correct environment variables to prevent TLS deprecation warnings

echo "🚀 Starting CEDO Backend Development Server"
echo "=========================================="

# Set NODE_ENV to development to enable TLS warning fixes
export NODE_ENV=development

# Optional: Set other development environment variables
# export MYSQL_HOST=127.0.0.1
# export MONGODB_URI=mongodb://127.0.0.1:27017/cedo_auth

echo "✅ Environment: $NODE_ENV"
echo "✅ TLS warnings suppressed for local development"
echo "✅ Starting server..."
echo ""

# Start the development server
npm run dev 