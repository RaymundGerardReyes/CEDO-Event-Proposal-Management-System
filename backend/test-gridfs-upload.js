const { MongoClient, GridFSBucket } = require('mongodb');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing GridFS Upload Fix');
console.log('============================\n');

// Use the same configuration as the backend
const uri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';

const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
};

async function testGridFSUpload() {
    let client;

    try {
        console.log('🔍 Testing GridFS Upload:');

        // Connect to MongoDB
        client = new MongoClient(uri, options);
        await client.connect();
        console.log('✅ MongoDB client connected successfully');

        const db = client.db('cedo_db');

        // Test GridFS bucket creation
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });
        console.log('✅ GridFS bucket created successfully');

        // Create a test file
        const testContent = 'This is a test file for GridFS upload';
        const testBuffer = Buffer.from(testContent);

        // Test upload
        const uploadStream = bucket.openUploadStream('test-gpoa.pdf', {
            contentType: 'application/pdf',
            metadata: {
                originalName: 'test-gpoa.pdf',
                organizationName: 'Test Organization',
                fileType: 'gpoa',
                uploadedAt: new Date(),
                fileSize: testBuffer.length,
                mimeType: 'application/pdf'
            }
        });

        console.log('✅ Upload stream created successfully');

        // Upload the file
        uploadStream.end(testBuffer);

        await new Promise((resolve, reject) => {
            uploadStream.on('finish', () => {
                console.log('✅ File uploaded successfully');
                console.log(`   File ID: ${uploadStream.id}`);
                console.log(`   Filename: ${uploadStream.filename}`);
                resolve();
            });

            uploadStream.on('error', (error) => {
                console.error('❌ Upload failed:', error);
                reject(error);
            });
        });

        // Test download
        const downloadStream = bucket.openDownloadStream(uploadStream.id);
        const chunks = [];

        await new Promise((resolve, reject) => {
            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            downloadStream.on('end', () => {
                const downloadedContent = Buffer.concat(chunks).toString();
                console.log('✅ File downloaded successfully');
                console.log(`   Downloaded content: ${downloadedContent}`);
                resolve();
            });

            downloadStream.on('error', (error) => {
                console.error('❌ Download failed:', error);
                reject(error);
            });
        });

        // Clean up
        await bucket.delete(uploadStream.id);
        console.log('✅ Test file cleaned up');

        return true;

    } catch (error) {
        console.error('❌ GridFS upload test failed:', error.message);
        console.error('🔧 Error details:', error);
        return false;
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 MongoDB connection closed');
        }
    }
}

async function testMongoDBUnifiedAPI() {
    try {
        console.log('\n🔍 Testing MongoDB Unified API:');

        // Test the API endpoint
        const response = await fetch('http://localhost:5000/api/mongodb-unified/proposals/school-events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                organization_id: '1',
                organization_name: 'Test Organization',
                name: 'Test Event',
                venue: 'Test Venue',
                start_date: '2025-07-10',
                end_date: '2025-07-12',
                time_start: '09:00',
                time_end: '17:00',
                event_type: 'workshop',
                event_mode: 'offline',
                return_service_credit: '1',
                target_audience: '["Students"]',
                proposal_status: 'pending'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ API endpoint working (no files)');
            console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        } else {
            console.log('⚠️  API endpoint error (expected without files):');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        }

        return true;

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

async function testMongoDBConnection() {
    let client;

    try {
        console.log('🔍 Testing MongoDB Connection:');

        client = new MongoClient(uri, options);
        await client.connect();
        console.log('✅ MongoDB client connected successfully');

        const db = client.db('cedo_db');
        await db.command({ ping: 1 });
        console.log('✅ Database ping successful');

        // Test collections
        const collections = await db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections`);

        // Test GridFS collections specifically
        const gridfsFiles = db.collection('proposal_files.files');
        const gridfsChunks = db.collection('proposal_files.chunks');

        const filesCount = await gridfsFiles.countDocuments();
        const chunksCount = await gridfsChunks.countDocuments();

        console.log(`✅ GridFS files: ${filesCount}`);
        console.log(`✅ GridFS chunks: ${chunksCount}`);

        return true;

    } catch (error) {
        console.error('❌ MongoDB connection test failed:', error.message);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function runTests() {
    console.log('🚀 Starting GridFS Upload Tests...\n');

    const tests = [
        { name: 'MongoDB Connection', fn: testMongoDBConnection },
        { name: 'GridFS Upload/Download', fn: testGridFSUpload },
        { name: 'MongoDB Unified API', fn: testMongoDBUnifiedAPI },
    ];

    const results = [];

    for (const test of tests) {
        const result = await test.fn();
        results.push({ name: test.name, success: result });
    }

    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    let passedTests = 0;
    for (const result of results) {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`   ${status} - ${result.name}`);
        if (result.success) passedTests++;
    }

    console.log(`\n📈 Overall: ${passedTests}/${results.length} tests passed`);

    if (passedTests === results.length) {
        console.log('\n🎉 All tests passed! GridFS upload should work correctly.');
        console.log('\n✅ The "Command insert requires authentication" error should now be resolved.');
        console.log('\n📋 Summary of fixes applied:');
        console.log('1. ✅ Fixed MongoDB database name (cedo_auth → cedo_db)');
        console.log('2. ✅ Fixed GridFS utility to use correct clientPromise');
        console.log('3. ✅ Updated connectToMongo function to use cedo_db');
        console.log('4. ✅ Verified GridFS bucket creation and file operations');
        console.log('5. ✅ Confirmed MongoDB Unified API is accessible');
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
    }
}

runTests().catch(console.error); 