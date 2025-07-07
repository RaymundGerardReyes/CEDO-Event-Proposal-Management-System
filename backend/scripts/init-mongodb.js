require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ========================================
// CEDO MongoDB Database Initializer
// Based on CEDO_ERD_Data_Model.md
// Production-ready with comprehensive error handling
// ========================================

console.log('\n🛠️  CEDO MongoDB Database Initializer starting...');
console.log('📋 Based on CEDO_ERD_Data_Model.md specifications');

// Environment configuration with fallbacks
const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'cedo_db';
const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES) || 5;
const retryDelay = parseInt(process.env.DB_CONNECT_DELAY_MS) || 3000;

// MongoDB authentication configuration
const mongoUser = process.env.MONGODB_USER || process.env.MONGO_USER;
const mongoPassword = process.env.MONGODB_PASSWORD || process.env.MONGO_PASSWORD;
const mongoAuthDb = process.env.MONGODB_AUTH_DB || process.env.MONGO_AUTH_DB || 'admin';

// Build connection URI with authentication if credentials are provided
let finalMongoUri = mongoUri;
if (mongoUser && mongoPassword) {
    // If URI doesn't contain credentials, add them
    if (!mongoUri.includes('@')) {
        const [protocol, rest] = mongoUri.split('://');
        finalMongoUri = `${protocol}://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${rest}`;
        if (!finalMongoUri.includes('authSource=')) {
            finalMongoUri += finalMongoUri.includes('?') ? '&' : '?';
            finalMongoUri += `authSource=${mongoAuthDb}`;
        }
    }
}

// Ensure the database name is not in the connection string (we'll specify it separately)
if (finalMongoUri.includes('/' + dbName)) {
    finalMongoUri = finalMongoUri.replace('/' + dbName, '');
}

// Mask password in connection string for logging
const maskedUri = finalMongoUri.replace(/:([^:@]*?)@/, ':*****@');
console.log('🔗 Using connection string:', maskedUri);
console.log('📊 Target database:', dbName);

// Connection options for production readiness
const clientOptions = {
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
    readPreference: 'primary',
    writeConcern: { w: 'majority', j: true },
    readConcern: { level: 'majority' }
};

// Utility function for safe index creation
async function safeCreateIndex(collection, keys, options = {}) {
    const indexName = options.name || Object.entries(keys).map(([k, v]) => `${k}_${v}`).join('_');
    try {
        const existingIndexes = await collection.listIndexes().toArray();
        const indexExists = existingIndexes.some(idx => idx.name === indexName);

        if (!indexExists) {
            await collection.createIndex(keys, { ...options, name: indexName });
            console.log(`  ✅ Index '${indexName}' created on collection '${collection.collectionName}'`);
        } else {
            console.log(`  ℹ️  Index '${indexName}' already exists on collection '${collection.collectionName}'`);
        }
    } catch (err) {
        console.error(`  ❌ Failed to create index '${indexName}' on '${collection.collectionName}':`, err.message);
        throw err;
    }
}

// Utility function for safe collection creation with validation
async function createCollectionWithValidation(db, collectionName, validationSchema, indexes = []) {
    try {
        const collections = await db.listCollections({ name: collectionName }).toArray();

        if (collections.length === 0) {
            console.log(`📝 Creating collection: ${collectionName}`);
            await db.createCollection(collectionName, {
                validator: validationSchema,
                validationLevel: 'strict',
                validationAction: 'error'
            });
            console.log(`✅ Collection '${collectionName}' created with validation`);
        } else {
            console.log(`ℹ️  Collection '${collectionName}' already exists`);
        }

        const collection = db.collection(collectionName);

        // Create indexes
        for (const indexDef of indexes) {
            await safeCreateIndex(collection, indexDef.keys, indexDef.options || {});
        }

        return collection;
    } catch (error) {
        console.error(`❌ Error creating collection '${collectionName}':`, error.message);
        throw error;
    }
}

// Retry connection with exponential backoff
async function connectWithRetry() {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔌 Connection attempt ${attempt}/${maxRetries}...`);
            const client = new MongoClient(finalMongoUri, clientOptions);
            await client.connect();

            // Test the connection
            await client.db('admin').admin().ping();
            console.log('✅ Connected to MongoDB successfully');
            return client;
        } catch (error) {
            console.error(`❌ Connection attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
            }

            const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Main initialization function
async function initializeDatabase() {
    let client;

    try {
        // ========================================
        // 1. ESTABLISH DATABASE CONNECTION
        // ========================================

        console.log('\n🔌 Establishing MongoDB connection...');
        client = await connectWithRetry();
        const db = client.db(dbName);

        // ========================================
        // 2. CREATE COLLECTIONS WITH VALIDATION SCHEMAS
        // ========================================

        console.log('\n📋 Creating collections based on ERD model...');

        // 2.1 PROPOSALS COLLECTION - Complex document structure
        const proposalsValidation = {
            $jsonSchema: {
                bsonType: 'object',
                required: ['title', 'description', 'category', 'startDate', 'endDate', 'location', 'submitter'],
                properties: {
                    title: { bsonType: 'string', maxLength: 100 },
                    description: { bsonType: 'string', maxLength: 2000 },
                    category: {
                        bsonType: 'string',
                        enum: ['education', 'health', 'environment', 'community', 'technology', 'other', 'school-event', 'community-event']
                    },
                    startDate: { bsonType: 'date' },
                    endDate: { bsonType: 'date' },
                    location: { bsonType: 'string', maxLength: 255 },
                    eventDetails: {
                        bsonType: 'object',
                        properties: {
                            timeStart: { bsonType: 'string' },
                            timeEnd: { bsonType: 'string' },
                            eventType: {
                                bsonType: 'string',
                                enum: ['academic', 'workshop', 'seminar', 'assembly', 'leadership', 'other']
                            },
                            eventMode: {
                                bsonType: 'string',
                                enum: ['offline', 'online', 'hybrid']
                            },
                            returnServiceCredit: { bsonType: 'number' },
                            targetAudience: { bsonType: 'array', items: { bsonType: 'string' } },
                            organizationId: { bsonType: 'string' }
                        }
                    },
                    budget: { bsonType: 'number', minimum: 0 },
                    objectives: { bsonType: 'string', maxLength: 1000 },
                    volunteersNeeded: { bsonType: 'number', minimum: 0 },
                    submitter: { bsonType: 'string' },
                    organizationType: {
                        bsonType: 'string',
                        enum: ['internal', 'external', 'school-based', 'community-based']
                    },
                    contactPerson: { bsonType: 'string', maxLength: 255 },
                    contactEmail: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
                    contactPhone: { bsonType: 'string', maxLength: 20 },
                    status: {
                        bsonType: 'string',
                        enum: ['draft', 'pending', 'approved', 'rejected']
                    },
                    priority: {
                        bsonType: 'string',
                        enum: ['low', 'medium', 'high']
                    },
                    assignedTo: { bsonType: 'string' },
                    adminComments: { bsonType: 'string', maxLength: 1000 },
                    reviewComments: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['reviewer', 'comment', 'decision', 'createdAt'],
                            properties: {
                                reviewer: { bsonType: 'string' },
                                comment: { bsonType: 'string', maxLength: 500 },
                                decision: { bsonType: 'string', enum: ['approve', 'reject', 'revise'] },
                                createdAt: { bsonType: 'date' }
                            }
                        }
                    },
                    documents: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['name', 'path', 'type', 'uploadedAt'],
                            properties: {
                                name: { bsonType: 'string', maxLength: 255 },
                                path: { bsonType: 'string', maxLength: 500 },
                                mimetype: { bsonType: 'string' },
                                size: { bsonType: 'number', minimum: 0 },
                                type: { bsonType: 'string', enum: ['gpoa', 'proposal', 'accomplishment', 'other'] },
                                uploadedAt: { bsonType: 'date' }
                            }
                        }
                    },
                    complianceStatus: {
                        bsonType: 'string',
                        enum: ['not_applicable', 'pending', 'compliant', 'overdue']
                    },
                    complianceDocuments: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            properties: {
                                name: { bsonType: 'string', maxLength: 255 },
                                path: { bsonType: 'string', maxLength: 500 },
                                required: { bsonType: 'bool' },
                                submitted: { bsonType: 'bool' },
                                submittedAt: { bsonType: 'date' }
                            }
                        }
                    },
                    complianceDueDate: { bsonType: 'date' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        };

        const proposalsIndexes = [
            { keys: { submitter: 1 }, options: { name: 'idx_submitter' } },
            { keys: { status: 1 }, options: { name: 'idx_status' } },
            { keys: { category: 1 }, options: { name: 'idx_category' } },
            { keys: { organizationType: 1 }, options: { name: 'idx_organization_type' } },
            { keys: { assignedTo: 1 }, options: { name: 'idx_assigned_to' } },
            { keys: { priority: 1 }, options: { name: 'idx_priority' } },
            { keys: { startDate: 1, endDate: 1 }, options: { name: 'idx_event_dates' } },
            { keys: { createdAt: -1 }, options: { name: 'idx_created_at_desc' } },
            { keys: { updatedAt: -1 }, options: { name: 'idx_updated_at_desc' } },
            { keys: { 'eventDetails.organizationId': 1 }, options: { name: 'idx_event_org_id' } },
            { keys: { complianceStatus: 1, complianceDueDate: 1 }, options: { name: 'idx_compliance' } },
            { keys: { status: 1, priority: 1, createdAt: -1 }, options: { name: 'idx_status_priority_date' } }
        ];

        const proposalsCollection = await createCollectionWithValidation(db, 'proposals', proposalsValidation, proposalsIndexes);

        // 2.2 ORGANIZATIONS COLLECTION
        const organizationsValidation = {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'contactPerson', 'contactEmail', 'organizationType'],
                properties: {
                    name: { bsonType: 'string', maxLength: 255 },
                    description: { bsonType: 'string', maxLength: 1000 },
                    organizationType: {
                        bsonType: 'string',
                        enum: ['school-based', 'community-based']
                    },
                    contactPerson: { bsonType: 'string', maxLength: 255 },
                    contactEmail: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
                    contactPhone: { bsonType: 'string', maxLength: 20 },
                    isActive: { bsonType: 'bool' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        };

        const organizationsIndexes = [
            { keys: { name: 1 }, options: { name: 'idx_name', unique: true } },
            { keys: { organizationType: 1 }, options: { name: 'idx_type' } },
            { keys: { isActive: 1 }, options: { name: 'idx_is_active' } },
            { keys: { contactEmail: 1 }, options: { name: 'idx_contact_email' } }
        ];

        const organizationsCollection = await createCollectionWithValidation(db, 'organizations', organizationsValidation, organizationsIndexes);

        // 2.3 PROPOSAL_FILES COLLECTION - File metadata
        const proposalFilesValidation = {
            $jsonSchema: {
                bsonType: 'object',
                required: ['proposalId', 'uploadedBy', 'fileType', 'originalName'],
                properties: {
                    proposalId: { bsonType: 'string' },
                    uploadedBy: { bsonType: 'string' },
                    fileType: {
                        bsonType: 'string',
                        enum: ['gpoa', 'proposal', 'accomplishment', 'attendance', 'other']
                    },
                    originalName: { bsonType: 'string', maxLength: 255 },
                    mimetype: { bsonType: 'string' },
                    size: { bsonType: 'number', minimum: 0 },
                    gridfsId: { bsonType: 'objectId' },
                    organizationId: { bsonType: 'string' },
                    section: { bsonType: 'string' },
                    purpose: { bsonType: 'string', maxLength: 255 },
                    isDeleted: { bsonType: 'bool' },
                    uploadedAt: { bsonType: 'date' }
                }
            }
        };

        const proposalFilesIndexes = [
            { keys: { proposalId: 1 }, options: { name: 'idx_proposal_id' } },
            { keys: { uploadedBy: 1 }, options: { name: 'idx_uploaded_by' } },
            { keys: { fileType: 1 }, options: { name: 'idx_file_type' } },
            { keys: { gridfsId: 1 }, options: { name: 'idx_gridfs_id' } },
            { keys: { organizationId: 1 }, options: { name: 'idx_organization_id' } },
            { keys: { isDeleted: 1, uploadedAt: -1 }, options: { name: 'idx_active_files' } }
        ];

        const proposalFilesCollection = await createCollectionWithValidation(db, 'proposal_files', proposalFilesValidation, proposalFilesIndexes);

        // 2.4 ACCOMPLISHMENT_REPORTS COLLECTION
        const accomplishmentReportsValidation = {
            $jsonSchema: {
                bsonType: 'object',
                required: ['proposalId', 'status'],
                properties: {
                    proposalId: { bsonType: 'string' },
                    status: {
                        bsonType: 'string',
                        enum: ['draft', 'pending', 'approved', 'denied']
                    },
                    reportData: {
                        bsonType: 'object',
                        properties: {
                            eventSummary: { bsonType: 'string', maxLength: 2000 },
                            actualAttendance: { bsonType: 'number', minimum: 0 },
                            objectives: { bsonType: 'array', items: { bsonType: 'string' } },
                            outcomes: { bsonType: 'array', items: { bsonType: 'string' } },
                            challenges: { bsonType: 'string', maxLength: 1000 },
                            recommendations: { bsonType: 'string', maxLength: 1000 },
                            financialSummary: {
                                bsonType: 'object',
                                properties: {
                                    budgetAllocated: { bsonType: 'number', minimum: 0 },
                                    actualExpenses: { bsonType: 'number', minimum: 0 },
                                    variance: { bsonType: 'number' }
                                }
                            }
                        }
                    },
                    submittedAt: { bsonType: 'date' },
                    reviewedAt: { bsonType: 'date' },
                    adminComments: { bsonType: 'string', maxLength: 1000 },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        };

        const accomplishmentReportsIndexes = [
            { keys: { proposalId: 1 }, options: { name: 'idx_proposal_id', unique: true } },
            { keys: { status: 1 }, options: { name: 'idx_status' } },
            { keys: { submittedAt: -1 }, options: { name: 'idx_submitted_at_desc' } }
        ];

        const accomplishmentReportsCollection = await createCollectionWithValidation(db, 'accomplishment_reports', accomplishmentReportsValidation, accomplishmentReportsIndexes);

        // 2.5 FILE_UPLOADS AUDIT COLLECTION
        const fileUploadsValidation = {
            $jsonSchema: {
                bsonType: 'object',
                required: ['proposalId', 'uploadedBy', 'action', 'timestamp'],
                properties: {
                    proposalId: { bsonType: 'string' },
                    uploadedBy: { bsonType: 'string' },
                    action: {
                        bsonType: 'string',
                        enum: ['upload', 'delete', 'replace', 'view', 'download']
                    },
                    fileInfo: {
                        bsonType: 'object',
                        properties: {
                            fileName: { bsonType: 'string' },
                            fileType: { bsonType: 'string' },
                            fileSize: { bsonType: 'number' },
                            gridfsId: { bsonType: 'objectId' }
                        }
                    },
                    ipAddress: { bsonType: 'string' },
                    userAgent: { bsonType: 'string' },
                    timestamp: { bsonType: 'date' }
                }
            }
        };

        const fileUploadsIndexes = [
            { keys: { proposalId: 1 }, options: { name: 'idx_proposal_id' } },
            { keys: { uploadedBy: 1 }, options: { name: 'idx_uploaded_by' } },
            { keys: { action: 1 }, options: { name: 'idx_action' } },
            { keys: { timestamp: -1 }, options: { name: 'idx_timestamp_desc' } },
            { keys: { proposalId: 1, action: 1, timestamp: -1 }, options: { name: 'idx_proposal_action_time' } }
        ];

        const fileUploadsCollection = await createCollectionWithValidation(db, 'file_uploads', fileUploadsValidation, fileUploadsIndexes);

        // ========================================
        // 3. CREATE GRIDFS BUCKET COLLECTIONS
        // ========================================

        console.log('\n🗄️  Setting up GridFS bucket collections...');

        // Create GridFS bucket collections for file storage
        const gridfsCollections = [
            'proposal_files.files',
            'proposal_files.chunks'
        ];

        for (const collectionName of gridfsCollections) {
            const collections = await db.listCollections({ name: collectionName }).toArray();
            if (collections.length === 0) {
                await db.createCollection(collectionName);
                console.log(`✅ GridFS collection '${collectionName}' created`);
            } else {
                console.log(`ℹ️  GridFS collection '${collectionName}' already exists`);
            }
        }

        // Create GridFS-specific indexes
        const gridfsFilesCollection = db.collection('proposal_files.files');
        const gridfsChunksCollection = db.collection('proposal_files.chunks');

        await safeCreateIndex(gridfsFilesCollection, { filename: 1, uploadDate: 1 }, { name: 'gridfs_files_filename_date' });
        await safeCreateIndex(gridfsFilesCollection, { 'metadata.proposalId': 1 }, { name: 'gridfs_files_proposal_id' });
        await safeCreateIndex(gridfsFilesCollection, { 'metadata.uploadedBy': 1 }, { name: 'gridfs_files_uploaded_by' });
        await safeCreateIndex(gridfsChunksCollection, { files_id: 1, n: 1 }, { name: 'gridfs_chunks_files_id_n', unique: true });

        // ========================================
        // 4. SEED SAMPLE DATA
        // ========================================

        console.log('\n🌱 Seeding sample data...');

        // 4.1 Seed Organizations
        const sampleOrganizations = [
            {
                name: 'City Economic Development Office',
                description: 'Main government office for economic development initiatives in Cagayan de Oro',
                organizationType: 'school-based',
                contactPerson: 'CEDO Administrator',
                contactEmail: 'admin@cedo.gov.ph',
                contactPhone: '+63-88-123-4567',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Xavier University',
                description: 'Premier educational institution in Cagayan de Oro offering quality education',
                organizationType: 'school-based',
                contactPerson: 'University Coordinator',
                contactEmail: 'coordinator@xu.edu.ph',
                contactPhone: '+63-88-999-8888',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Cagayan de Oro Community Foundation',
                description: 'Non-profit organization supporting community development and social programs',
                organizationType: 'community-based',
                contactPerson: 'Foundation Director',
                contactEmail: 'director@cdocf.org',
                contactPhone: '+63-88-777-6666',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Mindanao University of Science and Technology',
                description: 'State university focusing on science and technology education',
                organizationType: 'school-based',
                contactPerson: 'MUST Coordinator',
                contactEmail: 'coordinator@must.edu.ph',
                contactPhone: '+63-88-555-4444',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const org of sampleOrganizations) {
            try {
                const existingOrg = await organizationsCollection.findOne({ name: org.name });
                if (!existingOrg) {
                    await organizationsCollection.insertOne(org);
                    console.log(`✅ Organization '${org.name}' created`);
                } else {
                    console.log(`ℹ️  Organization '${org.name}' already exists`);
                }
            } catch (error) {
                if (error.code === 11000) { // Duplicate key error
                    console.log(`ℹ️  Organization '${org.name}' already exists (duplicate key)`);
                } else {
                    throw error;
                }
            }
        }

        // 4.2 Seed Sample Proposals
        const sampleProposals = [
            {
                title: 'Digital Literacy Workshop for Senior Citizens',
                description: 'A comprehensive workshop aimed at teaching senior citizens basic digital skills including email, social media, and online banking safety.',
                category: 'education',
                startDate: new Date('2024-03-15'),
                endDate: new Date('2024-03-15'),
                location: 'CEDO Community Center',
                eventDetails: {
                    timeStart: '09:00',
                    timeEnd: '16:00',
                    eventType: 'workshop',
                    eventMode: 'offline',
                    returnServiceCredit: 2,
                    targetAudience: ['senior-citizens', 'community-members'],
                    organizationId: 'cedo-main'
                },
                budget: 15000,
                objectives: 'Improve digital literacy among senior citizens in Cagayan de Oro',
                volunteersNeeded: 5,
                submitter: 'admin@cedo.gov.ph',
                organizationType: 'school-based',
                contactPerson: 'Maria Santos',
                contactEmail: 'maria.santos@cedo.gov.ph',
                contactPhone: '+63-88-123-4567',
                status: 'approved',
                priority: 'high',
                assignedTo: 'reviewer@cedo.gov.ph',
                adminComments: 'Excellent proposal addressing community needs',
                reviewComments: [
                    {
                        reviewer: 'reviewer@cedo.gov.ph',
                        comment: 'Well-structured proposal with clear objectives',
                        decision: 'approve',
                        createdAt: new Date('2024-02-15')
                    }
                ],
                documents: [],
                complianceStatus: 'compliant',
                complianceDocuments: [],
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date('2024-02-15')
            },
            {
                title: 'Environmental Awareness Campaign',
                description: 'Community-wide campaign to promote environmental awareness and sustainable practices among residents.',
                category: 'environment',
                startDate: new Date('2024-04-22'),
                endDate: new Date('2024-04-22'),
                location: 'Centrio Mall Cagayan de Oro',
                eventDetails: {
                    timeStart: '08:00',
                    timeEnd: '18:00',
                    eventType: 'assembly',
                    eventMode: 'offline',
                    returnServiceCredit: 3,
                    targetAudience: ['students', 'families', 'community-members'],
                    organizationId: 'cdocf-main'
                },
                budget: 25000,
                objectives: 'Raise awareness about environmental issues and promote sustainable living',
                volunteersNeeded: 15,
                submitter: 'director@cdocf.org',
                organizationType: 'community-based',
                contactPerson: 'Juan Dela Cruz',
                contactEmail: 'juan.delacruz@cdocf.org',
                contactPhone: '+63-88-777-6666',
                status: 'pending',
                priority: 'medium',
                assignedTo: 'reviewer@cedo.gov.ph',
                adminComments: '',
                reviewComments: [],
                documents: [],
                complianceStatus: 'pending',
                complianceDocuments: [],
                createdAt: new Date('2024-02-20'),
                updatedAt: new Date('2024-02-20')
            },
            {
                title: 'Youth Leadership Training Program',
                description: 'Intensive leadership training program for young professionals and students to develop leadership skills and civic engagement.',
                category: 'education',
                startDate: new Date('2024-05-10'),
                endDate: new Date('2024-05-12'),
                location: 'Xavier University Conference Center',
                eventDetails: {
                    timeStart: '08:00',
                    timeEnd: '17:00',
                    eventType: 'leadership',
                    eventMode: 'offline',
                    returnServiceCredit: 3,
                    targetAudience: ['students', 'young-professionals'],
                    organizationId: 'xu-main'
                },
                budget: 35000,
                objectives: 'Develop leadership capabilities among youth and promote civic engagement',
                volunteersNeeded: 8,
                submitter: 'coordinator@xu.edu.ph',
                organizationType: 'school-based',
                contactPerson: 'Dr. Anna Rodriguez',
                contactEmail: 'anna.rodriguez@xu.edu.ph',
                contactPhone: '+63-88-999-8888',
                status: 'draft',
                priority: 'medium',
                assignedTo: '',
                adminComments: '',
                reviewComments: [],
                documents: [],
                complianceStatus: 'not_applicable',
                complianceDocuments: [],
                createdAt: new Date('2024-02-25'),
                updatedAt: new Date('2024-02-25')
            }
        ];

        for (const proposal of sampleProposals) {
            try {
                const existingProposal = await proposalsCollection.findOne({ title: proposal.title });
                if (!existingProposal) {
                    await proposalsCollection.insertOne(proposal);
                    console.log(`✅ Sample proposal '${proposal.title}' created`);
                } else {
                    console.log(`ℹ️  Sample proposal '${proposal.title}' already exists`);
                }
            } catch (error) {
                console.error(`❌ Error creating proposal '${proposal.title}':`, error.message);
            }
        }

        // ========================================
        // 5. CREATE SAMPLE ACCOMPLISHMENT REPORT
        // ========================================

        const sampleReport = {
            proposalId: 'digital-literacy-workshop-001',
            status: 'approved',
            reportData: {
                eventSummary: 'Successfully conducted digital literacy workshop with 45 senior citizen participants. The workshop covered basic computer skills, email usage, and online safety.',
                actualAttendance: 45,
                objectives: [
                    'Teach basic computer skills to senior citizens',
                    'Improve digital literacy in the community',
                    'Promote safe online practices'
                ],
                outcomes: [
                    '45 senior citizens trained in basic digital skills',
                    '90% of participants can now send emails independently',
                    'Increased confidence in using digital devices'
                ],
                challenges: 'Some participants had difficulty with fine motor skills for mouse usage',
                recommendations: 'Consider using tablets for future workshops to accommodate participants with motor skill challenges',
                financialSummary: {
                    budgetAllocated: 15000,
                    actualExpenses: 13500,
                    variance: 1500
                }
            },
            submittedAt: new Date('2024-03-20'),
            reviewedAt: new Date('2024-03-22'),
            adminComments: 'Excellent execution and outcomes. Recommend continuing this program.',
            createdAt: new Date('2024-03-16'),
            updatedAt: new Date('2024-03-22')
        };

        try {
            const existingReport = await accomplishmentReportsCollection.findOne({ proposalId: sampleReport.proposalId });
            if (!existingReport) {
                await accomplishmentReportsCollection.insertOne(sampleReport);
                console.log('✅ Sample accomplishment report created');
            } else {
                console.log('ℹ️  Sample accomplishment report already exists');
            }
        } catch (error) {
            console.error('❌ Error creating sample accomplishment report:', error.message);
        }

        // ========================================
        // 6. PERFORMANCE OPTIMIZATION
        // ========================================

        console.log('\n⚡ Optimizing database performance...');

        // Compact collections to optimize storage
        const collections = [
            'proposals',
            'organizations',
            'proposal_files',
            'accomplishment_reports',
            'file_uploads'
        ];

        for (const collectionName of collections) {
            try {
                await db.command({ compact: collectionName });
                console.log(`✅ Collection '${collectionName}' compacted`);
            } catch (error) {
                console.log(`ℹ️  Compact not available for '${collectionName}' (normal in some environments)`);
            }
        }

        // ========================================
        // 7. FINAL VERIFICATION
        // ========================================

        console.log('\n🔍 Performing final verification...');

        // Verify collections
        const allCollections = await db.listCollections().toArray();
        const collectionNames = allCollections.map(c => c.name);
        const expectedCollections = [
            'proposals',
            'organizations',
            'proposal_files',
            'accomplishment_reports',
            'file_uploads',
            'proposal_files.files',
            'proposal_files.chunks'
        ];

        for (const collection of expectedCollections) {
            if (collectionNames.includes(collection)) {
                console.log(`✅ Collection '${collection}' verified`);
            } else {
                console.error(`❌ Collection '${collection}' missing`);
            }
        }

        // Verify document counts
        const stats = {
            organizations: await organizationsCollection.countDocuments(),
            proposals: await proposalsCollection.countDocuments(),
            accomplishmentReports: await accomplishmentReportsCollection.countDocuments(),
            proposalFiles: await proposalFilesCollection.countDocuments(),
            fileUploads: await fileUploadsCollection.countDocuments()
        };

        console.log('\n📊 Database Statistics:');
        for (const [collection, count] of Object.entries(stats)) {
            console.log(`  ${collection}: ${count} documents`);
        }

        // Verify indexes
        console.log('\n📋 Index Verification:');
        for (const collection of ['proposals', 'organizations', 'proposal_files']) {
            const indexes = await db.collection(collection).listIndexes().toArray();
            console.log(`  ${collection}: ${indexes.length} indexes created`);
        }

        console.log('\n🎉 MongoDB Database initialization completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ All collections created with validation schemas');
        console.log('✅ Comprehensive indexes created for performance');
        console.log('✅ GridFS bucket configured for file storage');
        console.log('✅ Sample organizations and proposals seeded');
        console.log('✅ Production-ready configuration applied');
        console.log('\n📊 Database is now ready for the CEDO Event Management System');

        return true;

    } catch (error) {
        console.error('\n❌ MongoDB initialization failed:', error.message);
        console.error('🔧 Error details:', error);

        // Troubleshooting guidance
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Verify MongoDB server is running and accessible');
        console.log('2. Check MongoDB connection string and credentials');
        console.log('3. For authentication errors, set these environment variables:');
        console.log('   - MONGODB_USER=your_username');
        console.log('   - MONGODB_PASSWORD=your_password');
        console.log('   - MONGODB_AUTH_DB=admin (or your auth database)');
        console.log('4. Or use a complete connection string with credentials:');
        console.log('   - MONGODB_URI=mongodb://username:password@localhost:27017/cedo_db?authSource=admin');
        console.log('5. Ensure MongoDB version 4.4+ for validation schema support');
        console.log('6. Check network connectivity and firewall settings');
        console.log('7. Verify sufficient disk space and memory');
        console.log('8. Check MongoDB logs for detailed error information');

        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 MongoDB connection closed');
        }
    }
}

// Health check function
async function checkDatabaseHealth() {
    let client;
    try {
        client = new MongoClient(finalMongoUri, { ...clientOptions, serverSelectionTimeoutMS: 5000 });
        await client.connect();
        await client.db(dbName).admin().ping();
        console.log('✅ MongoDB health check passed');
        return true;
    } catch (error) {
        console.error('❌ MongoDB health check failed:', error.message);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Execute if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('\n✅ Initialization completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Initialization failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    initializeDatabase,
    checkDatabaseHealth
}; 