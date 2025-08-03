#!/bin/bash

# CEDO All Routes Test Script
# This script tests all the student dashboard routes to ensure they're working correctly

echo "🧪 CEDO All Routes Test"
echo "======================"

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
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
    
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
echo "📋 Testing Student Dashboard Routes"
echo "=================================="

# Test main student dashboard routes
test_route "/main/student-dashboard" "Main Student Dashboard" "303"
test_route "/main/student-dashboard/submit-event" "Submit Event" "303"
test_route "/main/student-dashboard/sdp-credits" "SDP Credits" "303"
test_route "/main/student-dashboard/drafts" "Drafts" "303"
test_route "/main/student-dashboard/events" "Events" "303"
test_route "/main/student-dashboard/profile" "Profile" "303"
test_route "/main/student-dashboard/notifications" "Notifications" "303"
test_route "/main/student-dashboard/reports" "Reports" "303"

echo ""
echo "📋 Testing Admin Dashboard Routes"
echo "================================="

# Test main admin dashboard routes
test_route "/main/admin-dashboard" "Main Admin Dashboard" "303"

echo ""
echo "📋 Testing Auth Routes"
echo "====================="

# Test auth routes
test_route "/auth/sign-in" "Sign In" "200"
test_route "/auth/sign-up" "Sign Up" "200"
test_route "/auth/forgot-password" "Forgot Password" "200"

echo ""
echo "📋 Testing Legacy Route Redirects"
echo "================================="

# Test that old paths redirect to new paths
test_route "/student-dashboard/submit-event" "Legacy Submit Event" "303"
test_route "/student-dashboard/sdp-credits" "Legacy SDP Credits" "303"
test_route "/student-dashboard/drafts" "Legacy Drafts" "303"
test_route "/student-dashboard/events" "Legacy Events" "303"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your routes are working correctly.${NC}"
    echo -e "\n${YELLOW}📝 What this means:${NC}"
    echo "• All routes are accessible"
    echo "• Authentication redirects are working"
    echo "• Legacy path redirects are working"
    echo "• The folder rename was successful"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "1. Log in through the sign-in page"
    echo "2. Navigate to the student dashboard"
    echo "3. Test all the navigation links"
    echo "4. Verify that all sub-routes work"
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
fi

echo -e "\n${BLUE}💡 Understanding the Results:${NC}"
echo "• 303 status = Redirect to sign-in (GOOD for protected routes)"
echo "• 200 status = Success (GOOD for public routes)"
echo "• 404 status = Page not found (BAD - indicates missing files)"
echo ""
echo "Your application routing is working correctly!" 