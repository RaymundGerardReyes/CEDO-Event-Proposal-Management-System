#!/usr/bin/env node

/**
 * Test Data Transformation
 * 
 * This script tests the frontend data transformation to ensure it works correctly
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

function testDataTransformation() {
    console.log('🔧 Testing Data Transformation...');

    const rawProposal = mockAPIResponse.proposals[0];
    console.log('📊 Raw API Data:');
    console.log('================');
    console.log('Event Name:', rawProposal.eventName);
    console.log('Organization:', rawProposal.organization);
    console.log('Contact:', rawProposal.contact);
    console.log('Status:', rawProposal.status);
    console.log('Date:', rawProposal.date);
    console.log('Type:', rawProposal.type);

    console.log('\n🔄 Transforming Data...');
    const transformedProposal = normalizeProposal(rawProposal);

    console.log('\n✅ Transformed Data:');
    console.log('====================');
    console.log('Event Name:', transformedProposal.eventName);
    console.log('Organization:', transformedProposal.organization);
    console.log('Contact Name:', transformedProposal.contact.name);
    console.log('Contact Email:', transformedProposal.contact.email);
    console.log('Contact Phone:', transformedProposal.contact.phone);
    console.log('Status:', transformedProposal.status);
    console.log('Date:', transformedProposal.date);
    console.log('Type:', transformedProposal.type);
    console.log('Description:', transformedProposal.description);

    console.log('\n🔍 Field Validation:');
    console.log('===================');
    console.log('Event Name is present:', !!transformedProposal.eventName);
    console.log('Organization is present:', !!transformedProposal.organization);
    console.log('Contact Name is present:', !!transformedProposal.contact.name);
    console.log('Contact Email is present:', !!transformedProposal.contact.email);
    console.log('Contact Phone is present:', !!transformedProposal.contact.phone);
    console.log('Status is present:', !!transformedProposal.status);
    console.log('Date is present:', !!transformedProposal.date);
    console.log('Type is present:', !!transformedProposal.type);

    console.log('\n📋 Expected vs Actual:');
    console.log('======================');
    console.log('Expected: Testingerrs → Actual:', transformedProposal.eventName);
    console.log('Expected: ISDA Iponan → Actual:', transformedProposal.organization);
    console.log('Expected: Raymund Gerard Estaca → Actual:', transformedProposal.contact.name);
    console.log('Expected: raymundgerardrestaca@gmail.com → Actual:', transformedProposal.contact.email);
    console.log('Expected: 09123123123 → Actual:', transformedProposal.contact.phone);
    console.log('Expected: pending → Actual:', transformedProposal.status);
    console.log('Expected: 2025-09-29T16:00:00.000Z → Actual:', transformedProposal.date);
    console.log('Expected: school-based → Actual:', transformedProposal.type);

    console.log('\n✅ Data Transformation Test Complete!');
}

testDataTransformation();





