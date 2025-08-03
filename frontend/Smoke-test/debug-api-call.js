/**
 * Debug script to test the exact API call from frontend
 */

const testFrontendApiCall = async () => {
    console.log('🧪 Testing frontend API call...');

    try {
        // Simulate the exact call from the frontend
        const backendUrl = 'http://localhost:5000';
        const apiUrl = `${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=5`;

        console.log('📍 URL:', apiUrl);

        // Simulate browser environment
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Response data:', {
            success: data.success,
            message: data.message,
            proposalCount: data.proposals?.length || 0,
            sampleProposals: data.proposals?.slice(0, 2).map(p => ({
                id: p.id,
                title: p.eventName,
                organization: p.organizationName,
                status: p.status,
                submittedOn: p.created_at
            })) || []
        });

        // Test the data transformation
        if (data.success && data.proposals) {
            const transformedProposals = data.proposals.map(proposal => ({
                id: proposal.id,
                title: proposal.eventName || proposal.event_name || 'Untitled Event',
                organization: proposal.organizationName || proposal.organization_name || 'Unknown Organization',
                submittedOn: proposal.submittedAt || proposal.created_at || new Date().toISOString().split('T')[0],
                status: proposal.status || proposal.proposal_status || 'pending',
                assignedTo: proposal.assignedTo || 'Unassigned',
            }));

            console.log('🔄 Transformed proposals:', transformedProposals.slice(0, 2));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('❌ Error stack:', error.stack);
    }
};

// Run the test
testFrontendApiCall().catch(console.error); 