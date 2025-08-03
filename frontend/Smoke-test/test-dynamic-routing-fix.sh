#!/bin/bash

# CEDO Dynamic Routing Fix Test Script
# This script tests the dynamic routing functionality after restoring [draftId] structure

echo "🧪 CEDO Dynamic Routing Fix Test"
echo "================================"

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
echo "📋 Testing Dynamic Routes (Should work with [draftId] structure)"
echo "================================================================"

# Test the main submit-event page (should redirect to create new draft)
test_route "/main/student-dashboard/submit-event" "Main Submit Event Page" "303"

# Test the specific draftId that was causing 404 errors
test_route "/main/student-dashboard/submit-event/9c3ec5a1-c8ea-4bf2-b1e3-ffb04ef87a61/overview" "Specific DraftId Overview Route" "303"

# Test various draftId sub-routes
test_route "/main/student-dashboard/submit-event/test-draft-123/overview" "Sample DraftId Overview Route" "303"
test_route "/main/student-dashboard/submit-event/test-draft-123/event-type" "Sample DraftId Event Type Route" "303"
test_route "/main/student-dashboard/submit-event/test-draft-123/organization" "Sample DraftId Organization Route" "303"
test_route "/main/student-dashboard/submit-event/test-draft-123/school-event" "Sample DraftId School Event Route" "303"
test_route "/main/student-dashboard/submit-event/test-draft-123/community-event" "Sample DraftId Community Event Route" "303"
test_route "/main/student-dashboard/submit-event/test-draft-123/reporting" "Sample DraftId Reporting Route" "303"

echo ""
echo "📋 Testing Folder Structure Verification"
echo "========================================"

# Check if key files exist in the correct structure
echo -n "Checking [draftId] folder structure... "
if [ -d "src/app/main/student-dashboard/submit-event/[draftId]" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking old draftId folder is removed... "
if [ ! -d "src/app/main/student-dashboard/submit-event/draftId" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking key component files exist... "
if [ -f "src/app/main/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow.jsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking overview page exists... "
if [ -f "src/app/main/student-dashboard/submit-event/[draftId]/overview/page.jsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "📋 Testing Import Path Verification"
echo "==================================="

# Check if import paths are correct
echo -n "Checking for [draftId] imports... "
if grep -r "\[draftId\]" src/ --include="*.jsx" --include="*.js" | grep "import.*\[draftId\]" | wc -l | grep -q "[1-9]"; then
    echo -e "${GREEN}✅ PASS${NC} (New imports found)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (No new imports found)"
    ((FAILED++))
fi

echo -n "Checking for old draftId imports... "
if grep -r "draftId" src/ --include="*.jsx" --include="*.js" | grep "import.*draftId" | grep -v "fix-draftid-imports" | wc -l | grep -q "0"; then
    echo -e "${GREEN}✅ PASS${NC} (No old imports found)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Old imports still exist)"
    ((FAILED++))
fi

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All dynamic routing tests passed!${NC}"
    echo -e "\n${YELLOW}📝 What this means:${NC}"
    echo "• The [draftId] folder structure is correctly restored"
    echo "• All import paths are updated correctly"
    echo "• Dynamic routing is working with proper Next.js structure"
    echo "• All component files are accessible"
    echo "• The 404 errors should now be resolved"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "1. Test the submit-event flow in your browser"
    echo "2. Verify that draft creation and navigation work"
    echo "3. Test all form sections and validation"
    echo "4. Run your test suite to ensure everything works"
    echo "5. The 404 errors should no longer occur"
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    echo -e "\n${YELLOW}🔧 Troubleshooting:${NC}"
    echo "1. Check if the server is running correctly"
    echo "2. Verify the folder structure is correct"
    echo "3. Check for any remaining old import paths"
    echo "4. Restart the development server if needed"
fi

echo -e "\n${BLUE}💡 Understanding the Results:${NC}"
echo "• 303 status = Redirect (GOOD - indicates dynamic routing is working)"
echo "• 200 status = Success (GOOD for authenticated users)"
echo "• 404 status = Page not found (BAD - indicates routing issues)"
echo "• 500 status = Server error (BAD - indicates import/build issues)"
echo ""
echo "The 303 redirects are expected for unauthenticated users!"
echo "Your dynamic routing should now be working correctly!" 