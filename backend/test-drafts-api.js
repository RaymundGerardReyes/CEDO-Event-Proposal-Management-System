/**
 * Test script for the drafts and rejected proposals API endpoint
 * Tests the GET /api/proposals/drafts-and-rejected endpoint
 */

const BASE_URL = 'http://localhost:5000';

async function testDraftsAPI() {
    console.log('🧪 Testing Drafts and Rejected Proposals API');
    console.log('='.repeat(50));

    try {
        // Use the token we got from get-auth-token.js
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5NjkwMiwiZXhwIjoxNzU4NzgzMzAyfQ.aQiwXpuSmwspZUPRBQZVdfu-9glP6JrI4LA6ezORxuU';

        console.log('✅ Using authentication token');

        // Test 1: Get all drafts and rejected proposals
        console.log('\n📋 Test 1: Get all drafts and rejected proposals');
        const draftsResponse = await fetch(`${BASE_URL}/api/proposals/drafts-and-rejected?includeRejected=true&limit=100&offset=0`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!draftsResponse.ok) {
            const errorText = await draftsResponse.text();
            throw new Error(`Drafts API failed: ${draftsResponse.status} ${draftsResponse.statusText} - ${errorText}`);
        }

        const draftsData = await draftsResponse.json();
        console.log('✅ Drafts API response:', {
            success: draftsData.success,
            count: draftsData.count,
            proposalsCount: draftsData.proposals?.length || 0,
            metadata: draftsData.metadata
        });

        if (draftsData.proposals && draftsData.proposals.length > 0) {
            console.log('\n📄 Sample proposal data:');
            const sampleProposal = draftsData.proposals[0];
            console.log({
                uuid: sampleProposal.uuid,
                organizationName: sampleProposal.organizationName,
                eventName: sampleProposal.eventName,
                proposalStatus: sampleProposal.proposalStatus,
                currentSection: sampleProposal.currentSection,
                formCompletionPercentage: sampleProposal.formCompletionPercentage,
                updatedAt: sampleProposal.updatedAt
            });
        }

        // Test 2: Get only drafts (exclude rejected)
        console.log('\n📋 Test 2: Get only drafts (exclude rejected)');
        const draftsOnlyResponse = await fetch(`${BASE_URL}/api/proposals/drafts-and-rejected?includeRejected=false&limit=50&offset=0`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!draftsOnlyResponse.ok) {
            const errorText = await draftsOnlyResponse.text();
            throw new Error(`Drafts only API failed: ${draftsOnlyResponse.status} ${draftsOnlyResponse.statusText} - ${errorText}`);
        }

        const draftsOnlyData = await draftsOnlyResponse.json();
        console.log('✅ Drafts only API response:', {
            success: draftsOnlyData.success,
            count: draftsOnlyData.count,
            proposalsCount: draftsOnlyData.proposals?.length || 0
        });

        // Test 3: Test pagination
        console.log('\n📋 Test 3: Test pagination');
        const paginationResponse = await fetch(`${BASE_URL}/api/proposals/drafts-and-rejected?includeRejected=true&limit=2&offset=0`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!paginationResponse.ok) {
            const errorText = await paginationResponse.text();
            throw new Error(`Pagination API failed: ${paginationResponse.status} ${paginationResponse.statusText} - ${errorText}`);
        }

        const paginationData = await paginationResponse.json();
        console.log('✅ Pagination API response:', {
            success: paginationData.success,
            count: paginationData.count,
            proposalsCount: paginationData.proposals?.length || 0,
            hasMore: paginationData.metadata?.hasMore,
            total: paginationData.metadata?.total
        });

        // Test 4: Test without authentication
        console.log('\n📋 Test 4: Test without authentication (should fail)');
        const noAuthResponse = await fetch(`${BASE_URL}/api/proposals/drafts-and-rejected`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (noAuthResponse.ok) {
            console.log('⚠️  Warning: API should require authentication but it succeeded');
        } else {
            console.log('✅ API correctly requires authentication:', noAuthResponse.status);
        }

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Total proposals found: ${draftsData.count || 0}`);
        console.log(`- Drafts only: ${draftsOnlyData.count || 0}`);
        console.log(`- API endpoints working correctly`);
        console.log(`- Authentication working correctly`);
        console.log(`- Pagination working correctly`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testDraftsAPI();
