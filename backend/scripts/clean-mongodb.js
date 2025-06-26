#!/usr/bin/env node
/**
 * clean-mongodb.js – Purge data from MongoDB collections used by the project
 * -------------------------------------------------------------------------
 * This **does not** drop the database; it only removes documents from the
 * collections listed in COLLECTIONS_TO_CLEAN.  GridFS files/chunks are also
 * deleted so that the bucket stays in sync.
 *
 * Usage:
 *   node backend/scripts/clean-mongodb.js            # non-interactive dry-run
 *   node backend/scripts/clean-mongodb.js --apply    # actually delete data
 *
 * The script reads the connection string from the same env vars as the app
 * (MONGODB_URI_PROD | MONGODB_URI).  If neither is set it falls back to
 * mongodb://localhost:27017/cedo_db.
 */

require('dotenv').config();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI || 'mongodb://localhost:27017/cedo_db';
const dbName = mongoUri.split('/').pop().split('?')[0] || 'cedo_db';

const COLLECTIONS_TO_CLEAN = [
    'proposals',
    'proposal_files',
    'accomplishment_reports',
    'organizations',
    'file_uploads'
];

const isApply = process.argv.includes('--apply');

(async () => {
    let client;
    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log(`Connected to MongoDB – database: ${dbName}`);

        const db = client.db(dbName);

        // --- Handle regular collections --------------------------------------------------
        for (const colName of COLLECTIONS_TO_CLEAN) {
            const exists = await db.listCollections({ name: colName }).hasNext();
            if (!exists) {
                console.log(`• Collection ${colName} – not found (skipped)`);
                continue;
            }
            const col = db.collection(colName);
            const count = await col.estimatedDocumentCount();
            if (count === 0) {
                console.log(`• Collection ${colName} – already empty`);
                continue;
            }

            if (isApply) {
                await col.deleteMany({});
                console.log(`✓ Emptied ${colName} (removed ${count} docs)`);
            } else {
                console.log(`› Would delete ${count} docs from ${colName}`);
            }
        }

        // --- Handle GridFS bucket --------------------------------------------------------
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        if (isApply) {
            // Delete files and chunks via bucket API
            const cursor = bucket.find({});
            let deleted = 0;
            for await (const file of cursor) {
                await bucket.delete(file._id);
                deleted += 1;
            }
            console.log(`✓ Removed ${deleted} file(s) from GridFS bucket proposal_files`);
        } else {
            const gridCount = await bucket.find({}).count();
            console.log(`› Would delete ${gridCount} file(s) from GridFS bucket proposal_files`);
        }

        console.log(isApply ? '\n🎯 Clean-up completed.' : '\n(Dry-run finished – re-run with --apply to commit)');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during clean-up:', err.message);
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
})(); 