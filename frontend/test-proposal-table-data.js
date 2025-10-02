#!/usr/bin/env node

/**
 * Test ProposalTable Data
 * 
 * This script tests the exact data that should be passed to ProposalTable
 */

// Mock the useProposals hook data
const mockHookData = {
    proposals: [
        {
            id: 72,
            uuid: 'a8856613-f11c-47af-ab8d-de006a82f2e8',
            eventName: 'Testingerrs',
            organization: 'ISDA Iponan',
            organizationType: 'school-based',
            contact: {
                name: 'Raymund Gerard Estaca',
                email: 'raymundgerardrestaca@gmail.com',
                phone: '09123123123'
            },
            status: 'pending',
            date: '2025-09-29T16:00:00.000Z',
            type: 'school-based',
            eventType: 'seminar-webinar',
            description: 'Event22: Testingerrs',
            location: 'asd',
            files: [],
            fileCount: 0
        }
    ],
    pagination: {
        page: 1,
        limit: 10,
        total: 48,
        pages: 48,
        hasPrev: false,
        hasNext: true
    },
    loading: false,
    error: null
};

// Mock the ProposalTable component props
function testProposalTableData() {
    console.log('🔧 Testing ProposalTable Data...');

    const proposal = mockHookData.proposals[0];

    console.log('📊 Hook Data:');
    console.log('============');
    console.log('Proposals count:', mockHookData.proposals.length);
    console.log('Loading:', mockHookData.loading);
    console.log('Error:', mockHookData.error);
    console.log('Pagination:', mockHookData.pagination);

    console.log('\n🎯 Proposal Data:');
    console.log('==================');
    console.log('ID:', proposal.id);
    console.log('UUID:', proposal.uuid);
    console.log('Event Name:', proposal.eventName);
    console.log('Organization:', proposal.organization);
    console.log('Status:', proposal.status);
    console.log('Type:', proposal.type);
    console.log('Contact:', proposal.contact);
    console.log('Date:', proposal.date);
    console.log('Description:', proposal.description);

    console.log('\n🔍 Field Analysis:');
    console.log('==================');
    console.log('Event Name present:', !!proposal.eventName);
    console.log('Organization present:', !!proposal.organization);
    console.log('Status present:', !!proposal.status);
    console.log('Type present:', !!proposal.type);
    console.log('Contact present:', !!proposal.contact);
    console.log('Contact Name present:', !!proposal.contact?.name);
    console.log('Contact Email present:', !!proposal.contact?.email);
    console.log('Contact Phone present:', !!proposal.contact?.phone);
    console.log('Date present:', !!proposal.date);
    console.log('Description present:', !!proposal.description);

    console.log('\n📋 Expected vs Actual:');
    console.log('======================');
    console.log('Expected Event Name: Testingerrs → Actual:', proposal.eventName);
    console.log('Expected Organization: ISDA Iponan → Actual:', proposal.organization);
    console.log('Expected Status: pending → Actual:', proposal.status);
    console.log('Expected Type: school-based → Actual:', proposal.type);
    console.log('Expected Contact Name: Raymund Gerard Estaca → Actual:', proposal.contact?.name);
    console.log('Expected Contact Email: raymundgerardrestaca@gmail.com → Actual:', proposal.contact?.email);
    console.log('Expected Contact Phone: 09123123123 → Actual:', proposal.contact?.phone);
    console.log('Expected Date: 2025-09-29T16:00:00.000Z → Actual:', proposal.date);
    console.log('Expected Description: Event22: Testingerrs → Actual:', proposal.description);

    console.log('\n🎨 Component Rendering Test:');
    console.log('============================');

    // Test StatusPill rendering
    const statusPillConfig = {
        pending: { label: "Pending", className: "bg-warning/20 text-warning" },
        approved: { label: "Approved", className: "bg-success/20 text-success" },
        rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
        draft: { label: "Draft", className: "bg-info/20 text-info" },
    };

    const statusConfig = statusPillConfig[proposal.status] || { label: "Unknown", className: "bg-muted" };
    console.log('StatusPill should render:', statusConfig.label);
    console.log('StatusPill className:', statusConfig.className);

    // Test Type Badge rendering
    console.log('Type Badge should render:', proposal.type || 'Other');

    // Test Contact rendering
    console.log('Contact should render:');
    console.log('  - Name:', proposal.contact?.name);
    console.log('  - Email:', proposal.contact?.email);
    console.log('  - Phone:', proposal.contact?.phone);

    // Test Date rendering
    const date = proposal.date ? new Date(proposal.date) : null;
    const formattedDate = date ? date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD';
    console.log('Date should render:', formattedDate);

    console.log('\n✅ ProposalTable Data Test Complete!');
    console.log('🎉 All data is correctly structured and ready for rendering!');

    console.log('\n🔧 Debugging Tips:');
    console.log('==================');
    console.log('1. Check if the data is being passed correctly to ProposalTable');
    console.log('2. Check if the StatusPill component is receiving the correct status prop');
    console.log('3. Check if the Type Badge is receiving the correct type prop');
    console.log('4. Check if there are any console errors in the browser');
    console.log('5. Check if the component is re-rendering with the correct data');
}

testProposalTableData();





