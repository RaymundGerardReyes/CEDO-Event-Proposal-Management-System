#!/bin/bash

# CEDO Route Testing Script
# This script tests all the routes to ensure they're working correctly

echo "🧪 CEDO Route Testing Script"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test a route
test_route() {
    local route=$1
    local description=$2
    local expected_status=$3
    local cookie_header=$4
    
    echo -n "Testing $description... "
    
    if [ -n "$cookie_header" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -H "$cookie_header" "http://localhost:3000$route")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $response)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

# Check if server is running
echo "🔍 Checking if frontend server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|303\|500"; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start it with: npm run dev${NC}"
    exit 1
fi

echo ""
echo "📋 Testing Public Routes (No Auth Required)"
echo "-------------------------------------------"

# Test public routes
test_route "/" "Home Page" "303"
test_route "/auth/sign-in" "Sign In Page" "200"
test_route "/auth/sign-up" "Sign Up Page" "200"
test_route "/auth/forgot-password" "Forgot Password Page" "200"

echo ""
echo "🔐 Testing Protected Routes (Auth Required)"
echo "-------------------------------------------"

# Test protected routes without auth (should redirect to sign-in)
test_route "/main" "Main Route (No Auth)" "303"
test_route "/main/student-dashboard" "Student Dashboard (No Auth)" "303"
test_route "/main/admin-dashboard" "Admin Dashboard (No Auth)" "303"

# Test protected routes with invalid token (should redirect to sign-in)
test_route "/main" "Main Route (Invalid Token)" "303" "Cookie: cedo_token=invalid_token"
test_route "/main/student-dashboard" "Student Dashboard (Invalid Token)" "303" "Cookie: cedo_token=invalid_token"
test_route "/main/admin-dashboard" "Admin Dashboard (Invalid Token)" "303" "Cookie: cedo_token=invalid_token"

echo ""
echo "🎯 Testing API Routes"
echo "-------------------"

# Test API routes
test_route "/api/health" "Health API" "200"
test_route "/api/user" "User API (No Auth)" "401"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Routes are working correctly.${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Use the Postman collection for detailed API testing"
echo "2. Test with real authentication tokens"
echo "3. Verify role-based access control"
echo "4. Check the comprehensive testing guide: CEDO_POSTMAN_TESTING_GUIDE.md" 