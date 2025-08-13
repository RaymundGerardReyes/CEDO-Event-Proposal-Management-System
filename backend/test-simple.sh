#!/bin/bash

echo "🧪 CEDO API Endpoint Testing Suite"
echo "==================================="

BASE_URL="http://localhost:5000"

# Function to test an endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local auth_header="$3"
    
    echo ""
    echo "🔍 Testing: $name"
    echo "📡 URL: $url"
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "$auth_header" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    response_body=$(echo "$response" | head -n -1)
    
    echo "📊 Status: $status_code"
    
    if [ "$status_code" -eq 200 ]; then
        echo "✅ Success: $response_body"
    else
        echo "❌ Error ($status_code): $response_body"
    fi
}

echo "⏳ Waiting for server to start..."
sleep 8

echo ""
echo "🔍 Testing Basic Health Endpoints..."

# Basic health checks
test_endpoint "Basic Health Check" "$BASE_URL/health"
test_endpoint "API Health Check" "$BASE_URL/api/health"

echo ""
echo "🔍 Testing MySQL-Only Endpoints..."

# MySQL-only endpoints
test_endpoint "MySQL Health Check" "$BASE_URL/api/mongodb-unified/mysql-health"
test_endpoint "MySQL Test Endpoint" "$BASE_URL/api/mongodb-unified/mysql-test"

echo ""
echo "🔍 Testing Authentication Endpoints..."

# Generate a test JWT token for student user
JWT_SECRET=${JWT_SECRET:-"fallback-secret"}
STUDENT_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
    id: 17,
    email: 'raymundgerardrestaca@gmail.com',
    role: 'student'
}, '$JWT_SECRET');
console.log(token);
")

# Authentication-required endpoints
test_endpoint "User Proposals (with auth)" "$BASE_URL/api/mongodb-unified/user-proposals" "Authorization: Bearer $STUDENT_TOKEN"
test_endpoint "User Proposals (without auth)" "$BASE_URL/api/mongodb-unified/user-proposals"

echo ""
echo "🔍 Testing DraftId Mapping Endpoints..."

# DraftId lookup endpoints
test_endpoint "DraftId Lookup (MongoDB ObjectId)" "$BASE_URL/api/mongodb-unified/find-proposal-by-draftid/689724bf8dda6373c70358d8" "Authorization: Bearer $STUDENT_TOKEN"

echo ""
echo "🎯 Test Complete!"
echo "================"
echo "✅ Check the results above to see which endpoints are working"
