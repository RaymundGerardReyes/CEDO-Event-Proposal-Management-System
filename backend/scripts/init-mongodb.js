require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// -------------------------------------------------------------
// MongoDB INITIALISATION SCRIPT
// -------------------------------------------------------------
// This script mirrors the purpose of init-db.js but for MongoDB.
// It connects using MONGODB_URI(_PROD) and ensures that the
// collections required by mongodb-unified-api.js exist with the
// necessary indexes.  It is SAFE to run multiple times –
// operations are idempotent.
// -------------------------------------------------------------

console.log('\n🛠  MongoDB initialisation script starting…');

const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'cedo_db';

console.log('Using connection string:', mongoUri.replace(/:(?:[^:@]*?)@/, ':*****@')); // hide password
console.log('Target database:        ', dbName);

// Helper – idempotent createIndex
async function safeCreateIndex(col, keys, options = {}) {
    const idxName = options.name || Object.entries(keys).map(([k, v]) => `${k}_${v}`).join('_');
    try {
        await col.createIndex(keys, { ...options, name: idxName });
        console.log(`  • Ensured index ${idxName} on ${col.collectionName}`);
    } catch (err) {
        console.error(`  ✖ Failed to create index ${idxName} on ${col.collectionName}:`, err.message);
    }
}

async function main() {
    let client;
    try {
        client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(dbName);

        // 1. Organisations
        const orgs = db.collection('organizations');
        await safeCreateIndex(orgs, { name: 1 }, { unique: true });

        // 2. Proposals
        const proposals = db.collection('proposals');
        await safeCreateIndex(proposals, { organizationId: 1 });
        await safeCreateIndex(proposals, { proposalStatus: 1 });

        // 3. Proposal files (metadata separate from GridFS files)
        const propFiles = db.collection('proposal_files');
        await safeCreateIndex(propFiles, { proposalId: 1 });

        // 4. Accomplishment reports
        const accReports = db.collection('accomplishment_reports');
        await safeCreateIndex(accReports, { proposalId: 1 });

        // 5. File uploads audit (used by mongodb-unified-api)
        const fileUploads = db.collection('file_uploads');
        await safeCreateIndex(fileUploads, { proposalId: 1 });

        // 6. GridFS bucket indexes – created automatically on first use, but we
        //    explicitly ensure them so the DB is ready even before uploads.
        const filesCollectionExists = await db.listCollections({ name: 'proposal_files.files' }).hasNext();
        if (!filesCollectionExists) {
            // Create empty GridFS bucket; driver will build the compsite _id index.
            await db.createCollection('proposal_files.files');
            await db.createCollection('proposal_files.chunks');
            console.log('  • Created empty GridFS bucket collections proposal_files.*');
        }

        console.log('\n🎉 MongoDB initialisation completed successfully');

        // ---------------------------------------------------------
        // Optional – Seed an organisation if none exist so that the
        // frontend selector isn't empty on first launch.
        // ---------------------------------------------------------
        const orgCount = await orgs.countDocuments();
        if (orgCount === 0) {
            await orgs.insertOne({
                name: 'Sample Organisation',
                description: 'A default organisation created by init-mongodb.js',
                organizationType: 'school-based',
                contactPerson: 'Admin',
                contactEmail: 'admin@cedo.gov.ph',
                contactPhone: 'N/A',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('  • Inserted Sample Organisation');
        }

        process.exit(0);
    } catch (err) {
        console.error('\n❌ MongoDB initialisation failed:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

// Execute when run directly
if (require.main === module) {
    main();
}

module.exports = { main }; 