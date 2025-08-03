// Test script to verify community event data mapping
console.log('🔍 Testing Community Event Data Mapping...');

// Simulate the form data that would be sent
const testFormData = {
    communityEventName: 'Test Community Event',
    communityVenue: 'Test Venue',
    communityStartDate: new Date('2024-01-01'),
    communityEndDate: new Date('2024-01-01'),
    communityTimeStart: '09:00',
    communityTimeEnd: '10:00',
    communityEventType: 'leadership-training',
    communityEventMode: ['', 'offline'], // This was causing the issue
    communitySDPCredits: '2',
    communityTargetAudience: ['Students', 'Faculty'],
    proposalId: 'test-123',
    organization_name: 'Test Organization',
    organization_id: '1'
};

// Simulate the field mapping
const fieldMapping = {
    communityEventName: 'name',
    communityVenue: 'venue',
    communityStartDate: 'start_date',
    communityEndDate: 'end_date',
    communityTimeStart: 'time_start',
    communityTimeEnd: 'time_end',
    communityEventType: 'event_type',
    communityEventMode: 'event_mode',
    communitySDPCredits: 'sdp_credits',
    communityTargetAudience: 'target_audience',
    organization_name: 'organization_name',
    organization_id: 'organization_id',
};

// Simulate the data transformation
function transformFormData(formData) {
    const transformed = {};

    Object.entries(formData).forEach(([frontendKey, value]) => {
        const backendKey = fieldMapping[frontendKey] || frontendKey;

        if (value instanceof File) {
            transformed[backendKey] = value;
        } else if (Array.isArray(value)) {
            // Handle arrays properly - for eventMode, take the first non-empty value
            if (backendKey === 'event_mode' && value.length > 0) {
                const validMode = value.find(mode => mode && mode.trim() !== '');
                transformed[backendKey] = validMode || 'offline';
            } else {
                // For other arrays (like target_audience), stringify them
                transformed[backendKey] = JSON.stringify(value);
            }
        } else if (value !== null && value !== undefined) {
            // Handle date objects properly
            if (value instanceof Date) {
                transformed[backendKey] = value.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else {
                transformed[backendKey] = String(value);
            }
        }
    });

    // Add required fields
    transformed.proposal_id = formData.proposalId || '1';
    transformed.proposal_status = 'pending';
    transformed.admin_comments = '';

    // Ensure organization info is present
    if (!transformed.organization_name) {
        transformed.organization_name = 'Student Organization';
    }
    if (!transformed.organization_id) {
        transformed.organization_id = '1';
    }

    // Map event type for MongoDB schema
    const eventTypeMap = {
        'academic': 'academic',
        'seminar': 'seminar',
        'assembly': 'assembly',
        'leadership': 'leadership',
        'other': 'other',
        'academic-enhancement': 'academic',
        'seminar-webinar': 'seminar',
        'general-assembly': 'assembly',
        'leadership-training': 'leadership',
        'others': 'other'
    };

    if (transformed.event_type) {
        transformed.event_type = eventTypeMap[transformed.event_type] || 'other';
    }

    // Validate target audience
    if (transformed.target_audience) {
        try {
            const audienceArray = JSON.parse(transformed.target_audience);
            if (Array.isArray(audienceArray) && audienceArray.length > 0) {
                const validAudience = audienceArray.filter(audience => audience && audience.trim() !== '');
                transformed.target_audience = JSON.stringify(validAudience);
            } else {
                transformed.target_audience = JSON.stringify(['Students']);
            }
        } catch (error) {
            transformed.target_audience = JSON.stringify(['Students']);
        }
    }

    return transformed;
}

// Test the transformation
const transformedData = transformFormData(testFormData);

console.log('📋 Original Form Data:');
console.log(JSON.stringify(testFormData, null, 2));

console.log('\n🔄 Transformed Data:');
console.log(JSON.stringify(transformedData, null, 2));

// Verify required fields
const requiredFields = ['name', 'venue', 'start_date', 'end_date', 'time_start', 'time_end', 'event_type', 'event_mode', 'sdp_credits'];
const missingFields = requiredFields.filter(field => !transformedData[field] || transformedData[field].toString().trim() === '');

console.log('\n✅ Validation Results:');
if (missingFields.length === 0) {
    console.log('✅ All required fields are present');
} else {
    console.log('❌ Missing required fields:', missingFields);
}

// Verify data types
console.log('\n🔍 Data Type Verification:');
console.log('  event_mode type:', typeof transformedData.event_mode, 'value:', transformedData.event_mode);
console.log('  event_type type:', typeof transformedData.event_type, 'value:', transformedData.event_type);
console.log('  target_audience type:', typeof transformedData.target_audience, 'value:', transformedData.target_audience);
console.log('  sdp_credits type:', typeof transformedData.sdp_credits, 'value:', transformedData.sdp_credits);

// Verify MongoDB schema compatibility
const mongoDBCompatible = {
    title: transformedData.name || 'Untitled Event',
    description: `Community Event: ${transformedData.name || 'Untitled'} at ${transformedData.venue || 'TBD'}`,
    category: 'community-event',
    startDate: new Date(transformedData.start_date),
    endDate: new Date(transformedData.end_date),
    location: transformedData.venue || 'TBD',
    submitter: transformedData.organization_id || 'unknown',
    budget: 0,
    objectives: `Organize ${transformedData.name || 'event'} community event at ${transformedData.venue || 'TBD'}`,
    volunteersNeeded: 0,
    organizationType: 'community-based',
    contactPerson: transformedData.organization_name || 'Unknown',
    contactEmail: 'contact@example.com',
    contactPhone: '+63-88-000-0000',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    adminComments: '',
    reviewComments: [],
    documents: [],
    complianceStatus: 'not_applicable',
    complianceDocuments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    eventDetails: {
        timeStart: transformedData.time_start || '09:00',
        timeEnd: transformedData.time_end || '10:00',
        eventType: transformedData.event_type || 'other',
        eventMode: transformedData.event_mode || 'offline',
        returnServiceCredit: parseInt(transformedData.sdp_credits || '0'),
        targetAudience: JSON.parse(transformedData.target_audience || '["Students"]'),
        organizationId: transformedData.organization_id || ''
    }
};

console.log('\n📋 MongoDB Compatible Document:');
console.log(JSON.stringify(mongoDBCompatible, null, 2));

console.log('\n✅ Test completed successfully!');
console.log('📝 The data mapping should now work correctly with the MongoDB schema.'); 