const { MongoClient } = require('mongodb');
const mysql = require('mysql2/promise');

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

    const eventTypeMap = eventCategory === 'school' ? schoolEventTypeMap : {};
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

// Test the full route process
async function testFullRoute() {
    const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
    const mongoClient = new MongoClient(mongoUri);

    // MySQL connection
    const mysqlPool = mysql.createPool({
        host: '127.0.0.1',
        port: '3306',
        user: 'root',
        password: 'Raymund-Estaca01',
        database: 'cedo_auth',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        await mongoClient.connect();
        const mongoDb = mongoClient.db('cedo_db');
        const collection = mongoDb.collection('proposals');

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
        const eventType = 'school';

        // STEP 1: Create MySQL proposal (simplified)
        console.log('📝 Creating MySQL proposal...');
        const mysqlProposalData = {
            organization_name: orgName,
            organization_description: `Event: ${reqBody.name} at ${reqBody.venue}`,
            organization_type: 'school-based',
            contact_name: orgName,
            contact_email: 'contact@example.com',
            contact_phone: '+63-88-000-0000',
            event_name: reqBody.name,
            event_venue: reqBody.venue,
            event_start_date: reqBody.start_date,
            event_end_date: reqBody.end_date,
            event_start_time: reqBody.time_start,
            event_end_time: reqBody.time_end,
            school_event_type: 'other',
            event_mode: reqBody.event_mode,
            proposal_status: 'pending',
            attendance_count: 0,
            objectives: `Organize ${reqBody.name} event at ${reqBody.venue}`,
            budget: 0
        };

        const insertQuery = `
            INSERT INTO proposals (
                organization_name, organization_description, organization_type,
                contact_name, contact_email, contact_phone,
                event_name, event_venue, event_start_date, event_end_date,
                event_start_time, event_end_time, school_event_type, event_mode,
                proposal_status, attendance_count, objectives, budget,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const insertValues = [
            mysqlProposalData.organization_name,
            mysqlProposalData.organization_description,
            mysqlProposalData.organization_type,
            mysqlProposalData.contact_name,
            mysqlProposalData.contact_email,
            mysqlProposalData.contact_phone,
            mysqlProposalData.event_name,
            mysqlProposalData.event_venue,
            mysqlProposalData.event_start_date,
            mysqlProposalData.event_end_date,
            mysqlProposalData.event_start_time,
            mysqlProposalData.event_end_time,
            mysqlProposalData.school_event_type,
            mysqlProposalData.event_mode,
            mysqlProposalData.proposal_status,
            mysqlProposalData.attendance_count,
            mysqlProposalData.objectives,
            mysqlProposalData.budget
        ];

        const [mysqlResult] = await mysqlPool.query(insertQuery, insertValues);
        const mysqlProposalId = mysqlResult.insertId;
        console.log('✅ MySQL proposal created with ID:', mysqlProposalId);

        // STEP 2: Upload files (simplified - no files)
        const fileMetadata = {};
        console.log('📁 No files to upload');

        // STEP 3: Create MongoDB proposal document
        const proposalData = createMongoDBProposal(reqBody, orgName, mysqlProposalId, fileMetadata, eventType);
        console.log('🔍 Final document structure:', JSON.stringify(proposalData, null, 2));

        // STEP 4: Insert into MongoDB
        console.log('💾 Inserting into MongoDB...');
        const result = await collection.insertOne(proposalData);
        console.log('✅ Success! MongoDB ID:', result.insertedId);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 121) {
            console.error('Document validation failed. Details:', error.errInfo);
        }
    } finally {
        await mongoClient.close();
        await mysqlPool.end();
    }
}

testFullRoute(); 