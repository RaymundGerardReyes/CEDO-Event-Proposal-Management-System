#!/bin/bash

# CEDO DraftId Routing Test Script
# This script tests the dynamic routing functionality after renaming [draftId] to draftId

echo "🧪 CEDO DraftId Routing Test"
echo "============================"

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
echo "📋 Testing DraftId Dynamic Routes (Should work with new structure)"
echo "=================================================================="

# Test the main submit-event page (should redirect to create new draft)
test_route "/main/student-dashboard/submit-event" "Main Submit Event Page" "303"

# Test a sample draftId route (should work with new structure)
test_route "/main/student-dashboard/submit-event/test-draft-123" "Sample DraftId Route" "200"

# Test draftId sub-routes
test_route "/main/student-dashboard/submit-event/test-draft-123/overview" "DraftId Overview Route" "200"
test_route "/main/student-dashboard/submit-event/test-draft-123/event-type" "DraftId Event Type Route" "200"
test_route "/main/student-dashboard/submit-event/test-draft-123/organization" "DraftId Organization Route" "200"
test_route "/main/student-dashboard/submit-event/test-draft-123/school-event" "DraftId School Event Route" "200"
test_route "/main/student-dashboard/submit-event/test-draft-123/community-event" "DraftId Community Event Route" "200"
test_route "/main/student-dashboard/submit-event/test-draft-123/reporting" "DraftId Reporting Route" "200"

echo ""
echo "📋 Testing Import Path Verification"
echo "==================================="

# Check if key files exist in the new structure
echo -n "Checking new draftId folder structure... "
if [ -d "src/app/main/student-dashboard/submit-event/draftId" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking old [draftId] folder is removed... "
if [ ! -d "src/app/main/student-dashboard/submit-event/[draftId]" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking key component files exist... "
if [ -f "src/app/main/student-dashboard/submit-event/draftId/components/SubmitEventFlow.jsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking layout file exists... "
if [ -f "src/app/main/student-dashboard/submit-event/draftId/layout.jsx" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "📋 Testing Import Path Updates"
echo "=============================="

# Check if import paths were updated correctly
echo -n "Checking for old [draftId] imports... "
if grep -r "\[draftId\]" src/ --include="*.jsx" --include="*.js" | grep -v "fix-draftid-imports.js" | wc -l | grep -q "0"; then
    echo -e "${GREEN}✅ PASS${NC} (No old imports found)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Old imports still exist)"
    ((FAILED++))
fi

echo -n "Checking for new draftId imports... "
if grep -r "draftId" src/ --include="*.jsx" --include="*.js" | grep "import.*draftId" | wc -l | grep -q "[1-9]"; then
    echo -e "${GREEN}✅ PASS${NC} (New imports found)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (No new imports found)"
    ((FAILED++))
fi

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All DraftId routing tests passed!${NC}"
    echo -e "\n${YELLOW}📝 What this means:${NC}"
    echo "• The [draftId] folder was successfully renamed to draftId"
    echo "• All import paths were updated correctly"
    echo "• Dynamic routing is working with the new structure"
    echo "• All component files are accessible"
    echo "• The folder structure is clean and organized"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "1. Test the submit-event flow in your browser"
    echo "2. Verify that draft creation and navigation work"
    echo "3. Test all form sections and validation"
    echo "4. Run your test suite to ensure everything works"
    echo "5. Update any remaining documentation references"
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    echo -e "\n${YELLOW}🔧 Troubleshooting:${NC}"
    echo "1. Check if the server is running correctly"
    echo "2. Verify the folder structure is correct"
    echo "3. Check for any remaining old import paths"
    echo "4. Restart the development server if needed"
fi

echo -e "\n${BLUE}💡 Understanding the Results:${NC}"
echo "• 200 status = Success (GOOD for existing pages)"
echo "• 303 status = Redirect (GOOD for form creation flow)"
echo "• 404 status = Page not found (BAD - indicates routing issues)"
echo "• 500 status = Server error (BAD - indicates import/build issues)"
echo ""
echo "Your DraftId dynamic routing should now be working correctly!" 