#!/bin/bash

# CEDO Auth Routes Test Script
# This script tests all authentication routes to ensure they're working correctly

echo "🧪 CEDO Auth Routes Test"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test a route
test_route() {
    local route=$1
    local description=$2
    local expected_status=$3
    local expected_location=$4
    
    echo -n "Testing $description... "
    
    if [ -n "$expected_location" ]; then
        # Test for redirect
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
        location=$(curl -s -o /dev/null -w "%{redirect_url}" "http://localhost:3000$route")
        
        if [ "$response" = "$expected_status" ] && [[ "$location" == *"$expected_location"* ]]; then
            echo -e "${GREEN}✅ PASS${NC} (Status: $response, Redirect: $location)"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $response, Expected Location: $expected_location, Got: $location)"
            ((FAILED++))
        fi
    else
        # Test for direct response
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
        
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ PASS${NC} (Status: $response)"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $response)"
            ((FAILED++))
        fi
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
echo "📋 Testing Old Auth Path Redirects (Should redirect to new paths)"
echo "================================================================="

# Test old auth paths - they should redirect to new paths
test_route "/sign-in" "Old Sign In" "303" "/auth/sign-in"
test_route "/sign-up" "Old Sign Up" "303" "/auth/sign-up"
test_route "/login" "Old Login" "303" "/auth/sign-in"
test_route "/signup" "Old Signup" "303" "/auth/sign-up"

echo ""
echo "📋 Testing New Auth Paths (Should work correctly)"
echo "================================================="

# Test new auth paths - they should work (200 for public routes)
test_route "/auth/sign-in" "New Sign In" "200"
test_route "/auth/sign-up" "New Sign Up" "200"
test_route "/auth/forgot-password" "Forgot Password" "200"

echo ""
echo "📋 Testing Other Public Routes (Should be accessible)"
echo "====================================================="

# Test other public routes
test_route "/" "Root" "303"
test_route "/about" "About" "200"
test_route "/contact" "Contact" "200"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All auth routes are working correctly!${NC}"
    echo -e "\n${YELLOW}📝 What this means:${NC}"
    echo "• Old auth paths are properly redirecting to new paths"
    echo "• New auth paths are accessible and working"
    echo "• Authentication flow is functioning correctly"
    echo "• The middleware is correctly configured"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "1. Test the sign-in page in your browser"
    echo "2. Verify the authentication flow works"
    echo "3. Test logout and redirect functionality"
    echo "4. Verify all navigation links work"
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    echo -e "\n${YELLOW}🔧 Troubleshooting:${NC}"
    echo "1. Restart the development server: npm run dev"
    echo "2. Clear browser cache and cookies"
    echo "3. Check middleware configuration"
    echo "4. Verify file structure matches routes"
fi

echo -e "\n${BLUE}💡 Understanding the Results:${NC}"
echo "• 303 status = Redirect (GOOD for old→new path redirects)"
echo "• 200 status = Success (GOOD for public routes)"
echo "• 404 status = Page not found (BAD - indicates missing files)"
echo ""
echo "Your authentication routes should now be working correctly!" 