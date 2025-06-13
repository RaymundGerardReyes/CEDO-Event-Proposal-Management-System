// ===================================================================
// TEST SCRIPT FOR UNIFIED PROPOSALS API
// ===================================================================
// Run this in your browser console to test the new API
// Or use it as a Node.js script to test from command line

const API_BASE_URL = 'http://localhost:5000';

// Test data for school-based proposal
const testSchoolProposal = {
    // Section 2: Organization Info
    organizationName: 'Computer Science Society TEST',
    organizationTypes: ['school-based'],
    organizationType: 'school-based',
    organizationDescription: 'Student tech organization for testing',
    contactName: 'John Doe TEST',
    contactEmail: 'john.test@university.edu',
    contactPhone: '+1234567890',

    // Section 3: School Event Details
    schoolEventName: 'Annual Hackathon 2024 TEST',
    schoolVenue: 'University Tech Center',
    schoolStartDate: '2024-03-15',
    schoolEndDate: '2024-03-17',
    schoolTimeStart: '09:00',
    schoolTimeEnd: '17:00',
    schoolEventMode: 'offline',
    schoolEventType: 'competition',
    schoolReturnServiceCredit: '2',
    schoolTargetAudience: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Faculty'],

    // Status
    proposalStatus: 'draft',
    currentSection: 'schoolEvent'
};

// Test data for community-based proposal
const testCommunityProposal = {
    // Section 2: Organization Info
    organizationName: 'Community Leaders TEST',
    organizationTypes: ['community-based'],
    organizationType: 'community-based',
    organizationDescription: 'Community organization for testing',
    contactName: 'Jane Smith TEST',
    contactEmail: 'jane.test@community.org',
    contactPhone: '+1987654321',

    // Section 4: Community Event Details
    communityEventName: 'Leadership Workshop TEST',
    communityVenue: 'Community Center Hall A',
    communityStartDate: '2024-04-10',
    communityEndDate: '2024-04-10',
    communityTimeStart: '14:00',
    communityTimeEnd: '18:00',
    communityEventMode: 'offline',
    communityEventType: 'leadership-training',
    communitySDPCredits: '1',
    communityTargetAudience: ['Leaders', 'Alumni', 'All Levels'],

    // Status
    proposalStatus: 'draft',
    currentSection: 'communityEvent'
};

// ===================================================================
// TEST FUNCTIONS
// ===================================================================

/**
 * Test creating a school-based proposal
 */
async function testCreateSchoolProposal() {
    console.log('🎓 Testing school-based proposal creation...');

    try {
        const formData = new FormData();

        // Add all the required fields
        formData.append('organization_name', testSchoolProposal.organizationName);
        formData.append('organization_type', testSchoolProposal.organizationType);
        formData.append('organization_description', testSchoolProposal.organizationDescription);
        formData.append('contact_name', testSchoolProposal.contactName);
        formData.append('contact_email', testSchoolProposal.contactEmail);
        formData.append('contact_phone', testSchoolProposal.contactPhone);

        // Event details
        formData.append('event_name', testSchoolProposal.schoolEventName);
        formData.append('event_venue', testSchoolProposal.schoolVenue);
        formData.append('event_start_date', testSchoolProposal.schoolStartDate);
        formData.append('event_end_date', testSchoolProposal.schoolEndDate);
        formData.append('event_start_time', testSchoolProposal.schoolTimeStart);
        formData.append('event_end_time', testSchoolProposal.schoolTimeEnd);
        formData.append('event_mode', testSchoolProposal.schoolEventMode);

        // School-specific fields
        formData.append('school_event_type', testSchoolProposal.schoolEventType);
        formData.append('school_return_service_credit', testSchoolProposal.schoolReturnServiceCredit);
        formData.append('school_target_audience', JSON.stringify(testSchoolProposal.schoolTargetAudience));

        // Status
        formData.append('proposal_status', testSchoolProposal.proposalStatus);
        formData.append('current_section', testSchoolProposal.currentSection);

        const response = await fetch(`${API_BASE_URL}/api/proposals`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ School proposal created successfully:', result);
            return result.id;
        } else {
            console.error('❌ Failed to create school proposal:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error testing school proposal:', error);
        return null;
    }
}

/**
 * Test creating a community-based proposal
 */
async function testCreateCommunityProposal() {
    console.log('🌍 Testing community-based proposal creation...');

    try {
        const formData = new FormData();

        // Add all the required fields
        formData.append('organization_name', testCommunityProposal.organizationName);
        formData.append('organization_type', testCommunityProposal.organizationType);
        formData.append('organization_description', testCommunityProposal.organizationDescription);
        formData.append('contact_name', testCommunityProposal.contactName);
        formData.append('contact_email', testCommunityProposal.contactEmail);
        formData.append('contact_phone', testCommunityProposal.contactPhone);

        // Event details
        formData.append('event_name', testCommunityProposal.communityEventName);
        formData.append('event_venue', testCommunityProposal.communityVenue);
        formData.append('event_start_date', testCommunityProposal.communityStartDate);
        formData.append('event_end_date', testCommunityProposal.communityEndDate);
        formData.append('event_start_time', testCommunityProposal.communityTimeStart);
        formData.append('event_end_time', testCommunityProposal.communityTimeEnd);
        formData.append('event_mode', testCommunityProposal.communityEventMode);

        // Community-specific fields
        formData.append('community_event_type', testCommunityProposal.communityEventType);
        formData.append('community_sdp_credits', testCommunityProposal.communitySDPCredits);
        formData.append('community_target_audience', JSON.stringify(testCommunityProposal.communityTargetAudience));

        // Status
        formData.append('proposal_status', testCommunityProposal.proposalStatus);
        formData.append('current_section', testCommunityProposal.currentSection);

        const response = await fetch(`${API_BASE_URL}/api/proposals`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Community proposal created successfully:', result);
            return result.id;
        } else {
            console.error('❌ Failed to create community proposal:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error testing community proposal:', error);
        return null;
    }
}

/**
 * Test fetching a proposal by ID
 */
async function testGetProposal(proposalId) {
    console.log(`📋 Testing fetch proposal ${proposalId}...`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
        const result = await response.json();

        if (response.ok) {
            console.log('✅ Proposal fetched successfully:', result.data);
            return result.data;
        } else {
            console.error('❌ Failed to fetch proposal:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching proposal:', error);
        return null;
    }
}

/**
 * Test fetching all proposals
 */
async function testGetAllProposals() {
    console.log('📊 Testing fetch all proposals...');

    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals`);
        const result = await response.json();

        if (response.ok) {
            console.log('✅ All proposals fetched successfully:', result.data);
            console.log(`Found ${result.data.length} proposals`);
            return result.data;
        } else {
            console.error('❌ Failed to fetch proposals:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching proposals:', error);
        return null;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🚀 Starting unified proposals API tests...\n');

    // Test 1: Create school proposal
    const schoolProposalId = await testCreateSchoolProposal();
    console.log('');

    // Test 2: Create community proposal
    const communityProposalId = await testCreateCommunityProposal();
    console.log('');

    // Test 3: Fetch specific proposals
    if (schoolProposalId) {
        await testGetProposal(schoolProposalId);
        console.log('');
    }

    if (communityProposalId) {
        await testGetProposal(communityProposalId);
        console.log('');
    }

    // Test 4: Fetch all proposals
    await testGetAllProposals();

    console.log('\n🎉 All tests completed!');

    return {
        schoolProposalId,
        communityProposalId
    };
}

// ===================================================================
// EXPORT FOR USE
// ===================================================================

// For browser console use:
if (typeof window !== 'undefined') {
    window.testUnifiedAPI = {
        testCreateSchoolProposal,
        testCreateCommunityProposal,
        testGetProposal,
        testGetAllProposals,
        runAllTests
    };

    console.log('🧪 Test functions available in window.testUnifiedAPI');
    console.log('Run: window.testUnifiedAPI.runAllTests()');
}

// For Node.js use:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testCreateSchoolProposal,
        testCreateCommunityProposal,
        testGetProposal,
        testGetAllProposals,
        runAllTests
    };
}

// ===================================================================
// USAGE INSTRUCTIONS
// ===================================================================

/*
BROWSER CONSOLE USAGE:
1. Make sure your backend server is running on http://localhost:5000
2. Open browser console on your frontend
3. Copy and paste this entire file
4. Run: window.testUnifiedAPI.runAllTests()

NODE.JS USAGE:
1. Save this file as test-unified-api.js
2. Run: node test-unified-api.js

WHAT TO EXPECT:
- Creates a school-based proposal in the unified proposals table
- Creates a community-based proposal in the unified proposals table  
- Fetches individual proposals by ID
- Fetches all proposals
- All data should be stored in the single 'proposals' table with proper polymorphic structure
*/ 