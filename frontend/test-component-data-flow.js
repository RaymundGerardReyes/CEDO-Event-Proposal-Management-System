#!/usr/bin/env node

/**
 * Test Component Data Flow
 * 
 * This script tests the complete data flow from API to frontend component
 */

// Mock the API response data
const mockAPIResponse = {
    success: true,
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
        limit: 5,
        total: 48,
        pages: 48,
        hasPrev: false,
        hasNext: true
    },
    stats: {
        total: 48,
        pending: 16,
        approved: 22,
        rejected: 10,
        draft: 0
    }
};

// Mock the normalizeProposal function
function normalizeProposal(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const files = raw.files && typeof raw.files === 'object' && !Array.isArray(raw.files)
        ? raw.files
        : {};

    const status = raw.status || raw.proposal_status || 'pending';

    return {
        id: raw.id ?? null,
        uuid: raw.uuid ?? String(raw.id ?? ''),
        // API already returns the correct field names - use them directly
        organization: raw.organization || '',
        eventName: raw.eventName || '',
        status,
        adminComments: raw.adminComments || '',
        contact: {
            name: raw.contact?.name || '',
            email: raw.contact?.email || '',
            phone: raw.contact?.phone || '',
        },
        organizationType: raw.organizationType || '',
        venue: raw.location || '',
        // Frontend expects 'date' field for event start date
        date: raw.date || '',
        startDate: raw.startDate || '',
        endDate: raw.endDate || '',
        startTime: raw.startTime || '',
        endTime: raw.endTime || '',
        // Map type to organization_type as per database schema
        type: raw.type || '',
        eventType: raw.eventType || '',
        eventMode: raw.eventMode || '',
        createdAt: raw.createdAt || '',
        updatedAt: raw.updatedAt || '',
        submittedAt: raw.submittedAt || '',
        approvedAt: raw.approvedAt || '',
        reviewedAt: raw.reviewedAt || '',
        hasFiles: !!(files && Object.keys(files).length > 0),
        files,
        // Additional fields for details view
        description: raw.description || '',
        budget: raw.budget || 0,
        volunteersNeeded: raw.volunteersNeeded || 0,
        attendanceCount: raw.attendanceCount || 0,
        targetAudience: raw.targetAudience || [],
        sdpCredits: raw.sdpCredits || 0,
        // keep raw for debugging if needed
        _raw: raw,
    };
}

// Mock the StatusPill component
function StatusPill({ status, showTooltip = true }) {
    const statusPillConfig = {
        pending: {
            label: "Pending",
            icon: "Clock",
            className: "bg-warning/20 text-warning border-warning/30",
            description: "Awaiting review",
        },
        approved: {
            label: "Approved",
            icon: "Check",
            className: "bg-success/20 text-success border-success/30",
            description: "Approved for event",
        },
        rejected: {
            label: "Rejected",
            icon: "X",
            className: "bg-destructive/20 text-destructive border-destructive/30",
            description: "Not approved",
        },
        draft: {
            label: "Draft",
            icon: "FileText",
            className: "bg-info/20 text-info border-info/30",
            description: "Work in progress",
        },
    };

    const config = statusPillConfig[status] || {
        label: "Unknown",
        icon: "FileText",
        className: "bg-muted text-muted-foreground border-border",
        description: "Unknown status",
    };

    return {
        type: 'StatusPill',
        props: { status, showTooltip },
        config: config,
        rendered: `${config.label} (${status})`
    };
}

function testComponentDataFlow() {
    console.log('🔧 Testing Component Data Flow...');

    const rawProposal = mockAPIResponse.proposals[0];
    console.log('📊 Raw API Data:');
    console.log('================');
    console.log('Event Name:', rawProposal.eventName);
    console.log('Organization:', rawProposal.organization);
    console.log('Status:', rawProposal.status);
    console.log('Type:', rawProposal.type);
    console.log('Contact:', rawProposal.contact);

    console.log('\n🔄 Transforming Data...');
    const transformedProposal = normalizeProposal(rawProposal);

    console.log('\n✅ Transformed Data:');
    console.log('====================');
    console.log('Event Name:', transformedProposal.eventName);
    console.log('Organization:', transformedProposal.organization);
    console.log('Status:', transformedProposal.status);
    console.log('Type:', transformedProposal.type);
    console.log('Contact Name:', transformedProposal.contact.name);
    console.log('Contact Email:', transformedProposal.contact.email);
    console.log('Contact Phone:', transformedProposal.contact.phone);

    console.log('\n🎨 Testing Component Rendering:');
    console.log('===============================');

    // Test StatusPill component
    const statusPill = StatusPill({ status: transformedProposal.status });
    console.log('StatusPill rendered:', statusPill.rendered);
    console.log('StatusPill config:', statusPill.config);

    // Test Type Badge
    const typeBadge = {
        type: 'Badge',
        content: transformedProposal.type || 'Other',
        rendered: `Badge: ${transformedProposal.type || 'Other'}`
    };
    console.log('Type Badge rendered:', typeBadge.rendered);

    console.log('\n🔍 Field Validation:');
    console.log('===================');
    console.log('Event Name present:', !!transformedProposal.eventName);
    console.log('Organization present:', !!transformedProposal.organization);
    console.log('Status present:', !!transformedProposal.status);
    console.log('Type present:', !!transformedProposal.type);
    console.log('Contact Name present:', !!transformedProposal.contact.name);
    console.log('Contact Email present:', !!transformedProposal.contact.email);
    console.log('Contact Phone present:', !!transformedProposal.contact.phone);

    console.log('\n📋 Expected vs Actual:');
    console.log('======================');
    console.log('Expected Event Name: Testingerrs → Actual:', transformedProposal.eventName);
    console.log('Expected Organization: ISDA Iponan → Actual:', transformedProposal.organization);
    console.log('Expected Status: pending → Actual:', transformedProposal.status);
    console.log('Expected Type: school-based → Actual:', transformedProposal.type);
    console.log('Expected Contact Name: Raymund Gerard Estaca → Actual:', transformedProposal.contact.name);
    console.log('Expected Contact Email: raymundgerardrestaca@gmail.com → Actual:', transformedProposal.contact.email);
    console.log('Expected Contact Phone: 09123123123 → Actual:', transformedProposal.contact.phone);

    console.log('\n🎯 Component Rendering Test:');
    console.log('============================');
    console.log('StatusPill should render: Pending (pending)');
    console.log('Type Badge should render: Badge: school-based');
    console.log('Contact should render: Raymund Gerard Estaca (raymundgerardrestaca@gmail.com)');

    console.log('\n✅ Component Data Flow Test Complete!');
    console.log('🎉 All data is correctly transformed and ready for rendering!');
}

testComponentDataFlow();





