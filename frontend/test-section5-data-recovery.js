/**
* Section 5 Data Recovery Test Script
* 
* This script simulates the data recovery process that Section 5 uses
* to find your approved proposal when formData is incomplete.
*/

const BACKEND_URL = 'http://localhost:5000';

async function testDataRecovery() {
    console.log('🧪 Testing Section 5 Data Recovery Process...\n');

    // Test 1: Check if backend is accessible
    console.log('📋 Test 1: Backend Health Check');
    try {
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Backend is accessible:', healthData);
    } catch (error) {
        console.error('❌ Backend not accessible:', error.message);
        return;
    }

    // Test 2: Check localStorage for existing data
    console.log('\n📋 Test 2: LocalStorage Data Check');
    const possibleKeys = [
        'eventProposalFormData',
        'cedoFormData',
        'formData',
        'submitEventFormData'
    ];

    let bestLocalData = null;
    let bestScore = 0;

    for (const key of possibleKeys) {
        try {
            const savedData = localStorage.getItem(key);
            if (savedData) {
                const parsedData = JSON.parse(savedData);

                // Score based on data completeness
                let score = 0;
                if (parsedData.organizationName) score += 10;
                if (parsedData.contactEmail) score += 10;
                if (parsedData.id || parsedData.proposalId) score += 5;
                score += Object.keys(parsedData).length;

                console.log(`🔍 localStorage ${key}: score ${score}`, {
                    organizationName: parsedData.organizationName,
                    contactEmail: parsedData.contactEmail,
                    proposalId: parsedData.id || parsedData.proposalId,
                    totalKeys: Object.keys(parsedData).length
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestLocalData = parsedData;
                }
            } else {
                console.log(`⚪ localStorage ${key}: No data`);
            }
        } catch (error) {
            console.warn(`⚠️ localStorage ${key}: Parse error`, error.message);
        }
    }

    // Test 3: Database recovery check
    console.log('\n📋 Test 3: Database Recovery Check');
    try {
        const searchUrl = `${BACKEND_URL}/api/mongodb-proposals/admin/proposals-hybrid?page=1&limit=10&status=approved`;
        console.log('🔍 Searching for approved proposals:', searchUrl);

        const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            console.log('✅ Database search successful:', {
                success: searchResult.success,
                count: searchResult.proposalsCount || 0,
                hasData: !!(searchResult.data && searchResult.data.length > 0)
            });

            if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
                const latestProposal = searchResult.data[0];
                console.log('✅ Latest approved proposal found:', {
                    id: latestProposal.id,
                    organizationName: latestProposal.organization_name || latestProposal.title,
                    contactEmail: latestProposal.contact_email,
                    status: latestProposal.proposal_status,
                    eventName: latestProposal.event_name
                });

                console.log('\n🔧 Recovery would construct this data:');
                const recoveredData = {
                    id: latestProposal.id,
                    proposalId: latestProposal.id,
                    organizationName: latestProposal.organization_name || latestProposal.title,
                    contactEmail: latestProposal.contact_email,
                    proposalStatus: latestProposal.proposal_status,
                    schoolEventName: latestProposal.event_name,
                    schoolVenue: latestProposal.venue,
                    schoolStartDate: latestProposal.start_date,
                    schoolEndDate: latestProposal.end_date
                };
                console.log('📊 Recovered data preview:', recoveredData);
            } else {
                console.log('⚠️ No approved proposals found in database');
            }
        } else {
            console.error('❌ Database search failed:', searchResponse.status, await searchResponse.text());
        }
    } catch (error) {
        console.error('❌ Database recovery test failed:', error.message);
    }

    // Test 4: Status check simulation
    console.log('\n📋 Test 4: Status Check Simulation');
    if (bestLocalData && bestLocalData.organizationName && bestLocalData.contactEmail) {
        console.log('🔍 Testing status check with localStorage data...');
        await testStatusCheck(bestLocalData);
    } else {
        console.log('⚠️ Cannot test status check - no complete localStorage data');
        console.log('💡 Tip: Complete Section 2 first to generate data for testing');
    }

    console.log('\n✅ Data Recovery Test Complete');
    console.log('🔄 If Section 5 is still having issues, use the "Emergency Bypass" button in the UI');
}

async function testStatusCheck(testData) {
    try {
        // Simulate the status check process
        let proposalId = testData.id || testData.proposalId || testData.organization_id;

        if (!proposalId && testData.organizationName && testData.contactEmail) {
            console.log('🔍 No direct ID, searching by organization details...');

            const searchResponse = await fetch(`${BACKEND_URL}/api/proposals/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organization_name: testData.organizationName,
                    contact_email: testData.contactEmail
                })
            });

            if (searchResponse.ok) {
                const searchResult = await searchResponse.json();
                if (searchResult.id) {
                    proposalId = searchResult.id;
                    console.log('✅ Found proposal ID from search:', proposalId);
                }
            }
        }

        if (proposalId) {
            console.log('🔍 Checking status for proposal ID:', proposalId);

            const statusResponse = await fetch(`${BACKEND_URL}/api/proposals/debug/${proposalId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (statusResponse.ok) {
                const proposalData = await statusResponse.json();
                const proposalStatus = proposalData.proposal_status || proposalData.status || 'draft';
                const isApproved = proposalStatus === 'approved';

                console.log('✅ Status check result:', {
                    proposalId: proposalId,
                    status: proposalStatus,
                    isApproved: isApproved,
                    organizationName: proposalData.organization_name
                });

                if (isApproved) {
                    console.log('🎉 SUCCESS: Proposal is approved! Section 5 should unlock.');
                } else {
                    console.log('⏳ Proposal status is:', proposalStatus, '- Section 5 will remain locked until approved.');
                }
            } else {
                console.error('❌ Status check failed:', statusResponse.status);
            }
        } else {
            console.error('❌ No proposal ID available for status check');
        }
    } catch (error) {
        console.error('❌ Status check simulation failed:', error.message);
    }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    testDataRecovery().catch(console.error);
} else {
    console.log('Run this script in the browser console on your frontend page');
}

console.log('🔧 Section 5 Data Recovery Test Script Loaded');
console.log('📝 Run testDataRecovery() to check your data recovery setup');