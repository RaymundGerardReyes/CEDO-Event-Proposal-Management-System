/**
 * Test script to verify Section 5 data recovery fix
 * This tests the specific fix for handling API response with 'proposals' field instead of 'data'
 */

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function testDataRecoveryFix() {
    console.log('🔧 Testing Section 5 Data Recovery Fix...\n');

    try {
        // Test 1: Check API response structure
        console.log('📡 Test 1: Checking API response structure');
        const searchUrl = `${backendUrl}/api/mongodb-proposals/admin/proposals-hybrid?page=1&limit=10&status=approved`;

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const searchResult = await response.json();
        console.log('✅ API Response received');
        console.log('📊 Response structure:');
        console.log(`   - success: ${searchResult.success}`);
        console.log(`   - proposals: ${Array.isArray(searchResult.proposals) ? `Array(${searchResult.proposals.length})` : 'Not found'}`);
        console.log(`   - data: ${Array.isArray(searchResult.data) ? `Array(${searchResult.data.length})` : 'Not found'}`);

        // Test 2: Verify our fix logic
        console.log('\n🔍 Test 2: Testing our fix logic');
        const proposals = searchResult.proposals || searchResult.data || [];

        if (proposals && proposals.length > 0) {
            console.log(`✅ Found ${proposals.length} proposals using fallback logic`);

            const latestProposal = proposals[0];
            console.log('📋 Latest proposal fields:');
            console.log(`   - id: ${latestProposal.id || latestProposal._id || 'Missing'}`);
            console.log(`   - organization_name: ${latestProposal.organization_name || 'Missing'}`);
            console.log(`   - title: ${latestProposal.title || 'Missing'}`);
            console.log(`   - contact_email: ${latestProposal.contact_email || 'Missing'}`);
            console.log(`   - proposal_status: ${latestProposal.proposal_status || latestProposal.status || 'Missing'}`);

            // Test 3: Simulate the recovery data construction
            console.log('\n🛠️ Test 3: Testing recovery data construction');
            const recoveredData = {
                id: latestProposal.id || latestProposal._id,
                proposalId: latestProposal.id || latestProposal._id,
                organization_id: latestProposal.id || latestProposal._id,
                organizationName: latestProposal.organization_name || latestProposal.title || latestProposal.organizationName,
                contactEmail: latestProposal.contact_email || latestProposal.contactEmail,
                contactName: latestProposal.contact_person || latestProposal.contactName,
                contactPhone: latestProposal.contact_phone || latestProposal.contactPhone,
                organizationType: latestProposal.organizationType || latestProposal.organization_type || 'school-based',
                proposalStatus: latestProposal.proposal_status || latestProposal.status,
                currentSection: 'reporting',
                recoveredFromDatabase: true,
                recoveryTimestamp: new Date().toISOString()
            };

            console.log('✅ Recovery data constructed:');
            console.log(`   - ID: ${recoveredData.id}`);
            console.log(`   - Organization: ${recoveredData.organizationName}`);
            console.log(`   - Email: ${recoveredData.contactEmail}`);
            console.log(`   - Status: ${recoveredData.proposalStatus}`);

            // Test 4: Validate required fields
            console.log('\n✔️ Test 4: Validating required fields');
            const hasRequiredFields = !!(recoveredData.organizationName && recoveredData.contactEmail);

            if (hasRequiredFields) {
                console.log('✅ All required fields present - recovery would succeed');

                // Find ISDA Iponan proposal specifically
                const isdaProposal = proposals.find(p =>
                    (p.organization_name || p.title || '').toLowerCase().includes('isda') ||
                    (p.contact_email || '').includes('raymundgerardrestaca')
                );

                if (isdaProposal) {
                    console.log('\n🎯 ISDA Iponan proposal found:');
                    console.log(`   - ID: ${isdaProposal.id || isdaProposal._id}`);
                    console.log(`   - Organization: ${isdaProposal.organization_name || isdaProposal.title}`);
                    console.log(`   - Email: ${isdaProposal.contact_email}`);
                    console.log(`   - Status: ${isdaProposal.proposal_status || isdaProposal.status}`);
                } else {
                    console.log('\n⚠️ ISDA Iponan proposal not found in current results');
                }

            } else {
                console.log('❌ Missing required fields - recovery would fail');
                console.log(`   - organizationName: ${recoveredData.organizationName || 'MISSING'}`);
                console.log(`   - contactEmail: ${recoveredData.contactEmail || 'MISSING'}`);
            }

        } else {
            console.log('❌ No proposals found in API response');
        }

        console.log('\n🎉 Data Recovery Fix Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testDataRecoveryFix(); 