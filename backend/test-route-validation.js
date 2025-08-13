const { MongoClient } = require('mongodb');

// Mock the helper functions
const mapEventTypeToSchema = (frontendEventType, eventCategory = 'school') => {
    const schoolEventTypeMap = {
        'academic': 'academic',
        'workshop': 'workshop',
        'seminar': 'seminar',
        'assembly': 'assembly',
        'leadership': 'leadership',
        'other': 'other',
        'academic-enhancement': 'academic',
        'workshop-seminar-webinar': 'workshop',
        'cultural-show': 'other',
        'sports-fest': 'other',
        'competition': 'other',
        'conference': 'seminar'
    };

    const communityEventTypeMap = {
        'academic': 'other',
        'workshop': 'workshop',
        'seminar': 'seminar',
        'assembly': 'assembly',
        'leadership': 'leadership',
        'other': 'other',
        'education': 'other',
        'health': 'other',
        'environment': 'other',
        'community': 'other',
        'technology': 'other',
        'academic-enhancement': 'other',
        'seminar-webinar': 'seminar',
        'general-assembly': 'assembly',
        'leadership-training': 'leadership',
        'others': 'other'
    };

    const eventTypeMap = eventCategory === 'school' ? schoolEventTypeMap : communityEventTypeMap;
    const mappedType = eventTypeMap[frontendEventType];
    if (!mappedType) {
        console.warn(`⚠️ Unknown ${eventCategory} event type: ${frontendEventType}, defaulting to 'other'`);
        return 'other';
    }
    return mappedType;
};

const parseTargetAudience = (audience) => {
    if (typeof audience === 'string') {
        try {
            return JSON.parse(audience);
        } catch (e) {
            console.warn('⚠️ Failed to parse target audience string:', audience, e);
            return [];
        }
    } else if (Array.isArray(audience)) {
        return audience;
    }
    return [];
};

const createMongoDBProposal = (reqBody, orgName, mysqlProposalId, fileMetadata, eventType) => {
    const baseProposal = {
        title: reqBody.name || 'Untitled Event',
        description: `${eventType === 'school' ? 'School Event' : 'Community Event'}: ${reqBody.name || 'Untitled'} at ${reqBody.venue || 'TBD'}`,
        category: eventType === 'school' ? 'school-event' : 'community-event',
        startDate: new Date(reqBody.start_date),
        endDate: new Date(reqBody.end_date),
        location: reqBody.venue || 'TBD',
        submitter: reqBody.organization_id || 'unknown',
        budget: 0,
        objectives: `Organize ${reqBody.name || 'event'} ${eventType === 'school' ? 'school event' : 'community event'} at ${reqBody.venue || 'TBD'}`,
        volunteersNeeded: 0,
        organizationType: eventType === 'school' ? 'school-based' : 'community-based',
        contactPerson: orgName || 'Unknown',
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
        updatedAt: new Date()
    };

    baseProposal.eventDetails = {
        timeStart: reqBody.time_start || '09:00',
        timeEnd: reqBody.time_end || '10:00',
        eventType: mapEventTypeToSchema(reqBody.event_type, eventType),
        eventMode: reqBody.event_mode || 'offline',
        returnServiceCredit: parseInt(reqBody.return_service_credit || reqBody.sdp_credits || '0'),
        targetAudience: parseTargetAudience(reqBody.target_audience),
        organizationId: reqBody.organization_id || ''
    };

    if (fileMetadata && Object.keys(fileMetadata).length > 0) {
        baseProposal.documents = Object.entries(fileMetadata).map(([key, fileData]) => {
            const fileId = fileData.fileId || fileData.gridFsId;
            const filename = fileData.filename || fileData.originalName || 'unknown';
            const size = fileData.size || 0;
            const mimetype = fileData.mimetype || 'application/octet-stream';

            return {
                name: filename,
                path: `gridfs://${fileId}`,
                mimetype: mimetype,
                size: size,
                type: key === 'gpoa' ? 'gpoa' : 'proposal',
                uploadedAt: new Date()
            };
        });
    }

    return baseProposal;
};

// Test with exact same data as the curl request
async function testRouteValidation() {
    const uri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('cedo_db');
        const collection = db.collection('proposals');

        // Exact same request body as the curl test
        const reqBody = {
            name: "Test Event",
            venue: "Test Venue",
            start_date: "2024-01-01",
            end_date: "2024-01-01",
            time_start: "09:00",
            time_end: "10:00",
            event_type: "academic-enhancement",
            event_mode: "offline",
            target_audience: "[\"students\"]"
        };

        const orgName = 'Test Organization';
        const mysqlProposalId = 123;
        const fileMetadata = {}; // No files
        const eventType = 'school';

        const testDoc = createMongoDBProposal(reqBody, orgName, mysqlProposalId, fileMetadata, eventType);

        console.log('Testing route document insertion...');
        console.log('Document:', JSON.stringify(testDoc, null, 2));

        const result = await collection.insertOne(testDoc);
        console.log('✅ Success! Inserted ID:', result.insertedId);

    } catch (error) {
        console.error('❌ Validation error:', error.message);
        if (error.code === 121) {
            console.error('Document validation failed. Details:', error.errInfo);
        }
    } finally {
        await client.close();
    }
}

testRouteValidation(); 