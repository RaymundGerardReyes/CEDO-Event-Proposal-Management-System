#!/bin/bash

# CEDO API Testing Script
# This script runs Newman tests for the CEDO API

echo "🚀 Starting CEDO API Tests..."

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo "❌ Newman is not installed. Please install it first:"
    echo "npm install -g newman"
    exit 1
fi

# Check if files exist
if [ ! -f "cedo-api-tests.postman_collection.json" ]; then
    echo "❌ Collection file not found: cedo-api-tests.postman_collection.json"
    exit 1
fi

if [ ! -f "cedo-api-environment.json" ]; then
    echo "❌ Environment file not found: cedo-api-environment.json"
    exit 1
fi

# Create results directory
mkdir -p test-results

echo "📋 Running API tests..."

# Run the collection with environment
newman run "cedo-api-tests.postman_collection.json" \
    -e "cedo-api-environment.json" \
    --reporters cli,json \
    --reporter-json-export "test-results/api-test-results.json" \
    --reporter-cli-no-summary \
    --reporter-cli-no-console

echo "✅ Tests completed! Check test-results/api-test-results.json for detailed results."
