/**
 * Test script to verify proposal status API is working correctly
 * This will help debug why Section 5 is showing "draft" when proposal 7 is approved
 */

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function testProposalStatusAPI() {
    console.log('🧪 Testing Proposal Status API for ISDA Iponan...\n');

    try {
        // Test 1: Search for ISDA Iponan proposal
        console.log('📡 Test 1: Searching for ISDA Iponan proposal');
        const searchUrl = `${backendUrl}/api/proposals/search`;

        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                organization_name: 'ISDA Iponan',
                contact_email: 'raymundgerardrestaca@gmail.com'
            })
        });

        if (!searchResponse.ok) {
            throw new Error(`Search API failed: ${searchResponse.status} ${searchResponse.statusText}`);
        }

        const searchResult = await searchResponse.json();
        console.log('✅ Search result:', searchResult);

        if (!searchResult.id) {
            throw new Error('No proposal ID found in search result');
        }

        const proposalId = searchResult.id;
        console.log(`✅ Found proposal ID: ${proposalId}`);

        // Test 2: Get detailed status using debug API (same as Section 5)
        console.log('\n📡 Test 2: Getting detailed proposal status');
        const statusUrl = `${backendUrl}/api/proposals/debug/${proposalId}?t=${Date.now()}`;
        console.log('Status URL:', statusUrl);

        const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!statusResponse.ok) {
            throw new Error(`Status API failed: ${statusResponse.status} ${statusResponse.statusText}`);
        }

        const proposalData = await statusResponse.json();
        console.log('✅ Proposal data:', proposalData);

        // Test 3: Extract status (same logic as Section 5 - FIXED VERSION)
        console.log('\n🔍 Test 3: Status extraction analysis');
        let proposalStatus = 'draft';

        // Try different possible locations for the status (matching Section 5 fix)
        if (proposalData.proposal_status) {
            proposalStatus = proposalData.proposal_status;
        } else if (proposalData.status) {
            proposalStatus = proposalData.status;
        } else if (proposalData.mysql?.data?.proposal_status) {
            // Handle hybrid architecture response structure
            proposalStatus = proposalData.mysql.data.proposal_status;
        } else if (proposalData.mysql?.found && proposalData.mysql?.data?.status) {
            proposalStatus = proposalData.mysql.data.status;
        } else if (proposalData.mongodb?.data?.proposal_status) {
            proposalStatus = proposalData.mongodb.data.proposal_status;
        } else if (proposalData.mongodb?.data?.status) {
            proposalStatus = proposalData.mongodb.data.status;
        }

        const isApproved = proposalStatus === 'approved';

        console.log('📊 Status Analysis:');
        console.log(`  - proposalData.proposal_status: ${proposalData.proposal_status}`);
        console.log(`  - proposalData.status: ${proposalData.status}`);
        console.log(`  - Final extracted status: ${proposalStatus}`);
        console.log(`  - Is approved: ${isApproved}`);

        // Test 4: Simulate Section 5 logic
        console.log('\n🧩 Test 4: Simulating Section 5 logic');
        const statusResult = {
            success: true,
            proposalId: proposalId,
            proposalStatus: proposalStatus,
            proposalData: proposalData,
            lastUpdated: new Date().toISOString()
        };

        const proposalStatusData = {
            status: statusResult.proposalStatus,
            isApproved: statusResult.proposalStatus === 'approved',
            proposalId: statusResult.proposalId,
            lastChecked: statusResult.lastUpdated,
            error: null,
            proposalData: statusResult.proposalData
        };

        console.log('✅ Section 5 would set this state:', proposalStatusData);

        // Test 5: Final approval check
        console.log('\n✔️ Test 5: Final approval determination');
        const isProposalApproved = proposalStatusData.isApproved;

        console.log(`🎯 Final Result: isProposalApproved = ${isProposalApproved}`);

        if (isProposalApproved) {
            console.log('✅ SUCCESS: Proposal should be unlocked in Section 5');
        } else {
            console.log('❌ ISSUE: Proposal would still be locked in Section 5');
            console.log('🔍 Debugging info:');
            console.log('  - Check if proposal_status field is exactly "approved"');
            console.log('  - Verify no leading/trailing spaces in status');
            console.log('  - Confirm database shows status as "approved"');
        }

        // Test 6: Check current time vs last updated
        console.log('\n⏰ Test 6: Timing analysis');
        const lastUpdated = new Date(proposalData.updated_at || proposalData.created_at);
        const now = new Date();
        const timeDiff = (now - lastUpdated) / 1000; // seconds

        console.log(`  - Proposal last updated: ${lastUpdated.toLocaleString()}`);
        console.log(`  - Current time: ${now.toLocaleString()}`);
        console.log(`  - Time difference: ${timeDiff.toFixed(1)} seconds ago`);

        if (timeDiff < 300) { // 5 minutes
            console.log('✅ Recent update - should be reflected in frontend');
        } else {
            console.log('⚠️ Older update - might be caching issue');
        }

        console.log('\n🎉 Proposal Status Verification Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testProposalStatusAPI(); 