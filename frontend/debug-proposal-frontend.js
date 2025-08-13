#!/usr/bin/env node

/**
 * Frontend Proposal Status Debugging Script
 * Tests the complete frontend data flow for proposal status display
 */

console.log('🎨 FRONTEND PROPOSAL STATUS DEBUGGING');
console.log('='.repeat(50));

// Simulate the exact transformProposal function from admin dashboard
function transformProposal(proposal) {
    console.log('🔍 Input proposal data:', {
        id: proposal.id,
        proposal_status: proposal.proposal_status,
        status: proposal.status,
        event_name: proposal.event_name,
        organization_name: proposal.organization_name
    });

    const result = {
        title: proposal.event_name || 'Untitled Event',
        organization: proposal.organization_name || 'Unknown Organization',
        submittedOn: proposal.created_at
            ? new Date(proposal.created_at).toISOString().split('T')[0]
            : 'N/A',
        status: proposal.proposal_status || 'pending', // ⚠️ CRITICAL LINE
        assignedTo: proposal.reviewed_by_admin_id ? `Admin ID: ${proposal.reviewed_by_admin_id}` : 'Unassigned',
        // ... other fields
    };

    console.log('🎯 Transform result:', {
        input_proposal_status: proposal.proposal_status,
        input_status: proposal.status,
        output_status: result.status,
        fallback_triggered: !proposal.proposal_status
    });

    return result;
}

// Test with your actual data from the log
const testProposalData = {
    id: '4',
    uuid: '089dc13e-eb5e-4e7c-b7c8-fa80290ec07c',
    organization_name: 'Unknown Organization',
    organization_type: 'community-based',
    contact_name: 'Unknown Contact',
    contact_email: 'unknown@example.com',
    event_name: 'Chuvanewss',
    event_venue: 'Community Center, Downtown Plaza',
    proposal_status: 'approved', // ✅ This should be 'approved'
    report_status: 'pending',
    event_status: 'scheduled',
    created_at: '2025-08-09 19:47:56',
    updated_at: '2025-08-09 19:48:15'
};

console.log('\n📊 TESTING WITH ACTUAL DATA FROM LOG');
console.log('-'.repeat(30));

// Test the transformation
const transformed = transformProposal(testProposalData);

console.log('\n✅ FINAL RESULT:');
console.log(`Expected status: "approved"`);
console.log(`Actual status: "${transformed.status}"`);
console.log(`Status correct: ${transformed.status === 'approved'}`);

// Test edge cases
console.log('\n🧪 TESTING EDGE CASES');
console.log('-'.repeat(30));

// Case 1: Missing proposal_status
const missingStatus = { ...testProposalData, proposal_status: undefined };
const result1 = transformProposal(missingStatus);
console.log(`Missing proposal_status → status: "${result1.status}"`);

// Case 2: Null proposal_status
const nullStatus = { ...testProposalData, proposal_status: null };
const result2 = transformProposal(nullStatus);
console.log(`Null proposal_status → status: "${result2.status}"`);

// Case 3: Empty string proposal_status
const emptyStatus = { ...testProposalData, proposal_status: '' };
const result3 = transformProposal(emptyStatus);
console.log(`Empty proposal_status → status: "${result3.status}"`);

console.log('\n🎯 DEBUGGING RECOMMENDATIONS:');
console.log('='.repeat(50));

if (transformed.status !== 'approved') {
    console.log('❌ ISSUE FOUND: Status transformation failed');
    console.log('1. Check if API response includes proposal_status field');
    console.log('2. Verify proposal_status is not null/undefined in API response');
    console.log('3. Add console.log in transformProposal to trace actual values');
    console.log('4. Check if there\'s another transformation happening after this');
} else {
    console.log('✅ Transform function works correctly with test data');
    console.log('Issue likely in:');
    console.log('1. API response not including proposal_status');
    console.log('2. Backend returning wrong status value');
    console.log('3. Caching returning stale data');
}

console.log('\n🔧 ADD THESE DEBUG LOGS TO YOUR FRONTEND:');
console.log('='.repeat(50));
console.log(`
// Add to useRecentProposals hook after line 306:
console.log('📦 [DEBUG] Raw API response for proposal 4:', 
  data.proposals?.find(p => p.id == 4 || p.id == '4')
);

// Add to transformProposal function at line 98:
console.log('🎯 [DEBUG] Transform input for proposal', proposal.id, ':', {
  proposal_status: proposal.proposal_status,
  status: proposal.status,
  fallback_will_trigger: !proposal.proposal_status
});
`);

console.log('\n🎉 Frontend debugging complete!');

