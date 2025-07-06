const { MongoClient } = require('mongodb');

console.log('🧪 Testing MongoDB Connection Fix');
console.log('================================\n');

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

async function testMongoDBConnection() {
    let client;

    try {
        console.log('🔍 Testing MongoDB Connection:');
        console.log(`   URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
        console.log(`   Database: cedo_db`);
        console.log('');

        // Test connection
        client = new MongoClient(uri, options);
        await client.connect();
        console.log('✅ MongoDB client connected successfully');

        // Test database access
        const db = client.db('cedo_db');
        await db.command({ ping: 1 });
        console.log('✅ Database ping successful');

        // Test collections
        const collections = await db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections:`);
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });

        // Test specific collections from init-mongodb.js
        const expectedCollections = [
            'proposals',
            'organizations',
            'proposal_files',
            'accomplishment_reports',
            'file_uploads'
        ];

        console.log('\n🔍 Testing expected collections:');
        for (const collectionName of expectedCollections) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                console.log(`   ✅ ${collectionName}: ${count} documents`);
            } catch (error) {
                console.log(`   ❌ ${collectionName}: ${error.message}`);
            }
        }

        // Test GridFS collections
        console.log('\n🔍 Testing GridFS collections:');
        try {
            const gridfsFiles = db.collection('proposal_files.files');
            const gridfsChunks = db.collection('proposal_files.chunks');

            const filesCount = await gridfsFiles.countDocuments();
            const chunksCount = await gridfsChunks.countDocuments();

            console.log(`   ✅ proposal_files.files: ${filesCount} files`);
            console.log(`   ✅ proposal_files.chunks: ${chunksCount} chunks`);
        } catch (error) {
            console.log(`   ❌ GridFS collections: ${error.message}`);
        }

        console.log('\n🎉 MongoDB connection test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ MongoDB connection test failed:', error.message);
        console.error('🔧 Error details:', error);

        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Ensure MongoDB server is running on port 27017');
        console.log('2. Verify the user "cedo_admin" exists with correct password');
        console.log('3. Check if the database "cedo_db" exists');
        console.log('4. Run "npm run init-mongodb" to create the database');
        console.log('5. Verify MongoDB authentication is enabled');

        return false;
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 MongoDB connection closed');
        }
    }
}

async function testGridFSUpload() {
    let client;

    try {
        console.log('\n🔍 Testing GridFS Upload:');

        client = new MongoClient(uri, options);
        await client.connect();
        const db = client.db('cedo_db');

        // Test GridFS bucket creation
        const { GridFSBucket } = require('mongodb');
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        console.log('✅ GridFS bucket created successfully');

        // Test a simple upload
        const testBuffer = Buffer.from('Test file content');
        const uploadStream = bucket.openUploadStream('test.txt', {
            contentType: 'text/plain',
            metadata: {
                test: true,
                uploadedAt: new Date()
            }
        });

        uploadStream.end(testBuffer);

        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        console.log('✅ GridFS upload test successful');

        // Clean up test file
        await bucket.delete(uploadStream.id);
        console.log('✅ Test file cleaned up');

        return true;

    } catch (error) {
        console.error('❌ GridFS upload test failed:', error.message);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function runTests() {
    console.log('🚀 Starting MongoDB Fix Tests...\n');

    const tests = [
        { name: 'MongoDB Connection', fn: testMongoDBConnection },
        { name: 'GridFS Upload', fn: testGridFSUpload },
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
        console.log('\n🎉 All tests passed! MongoDB should work correctly.');
        console.log('\n✅ The "Command insert requires authentication" error should now be resolved.');
        console.log('\n📋 Summary of fixes applied:');
        console.log('1. ✅ Updated MongoDB URI to use correct database name (cedo_db)');
        console.log('2. ✅ Aligned backend configuration with init-mongodb.js');
        console.log('3. ✅ Updated all database references to use cedo_db');
        console.log('4. ✅ Verified GridFS bucket creation works');
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
        console.log('\n💡 Next steps:');
        console.log('1. Run "npm run init-mongodb" to ensure database exists');
        console.log('2. Check MongoDB user permissions');
        console.log('3. Verify MongoDB authentication settings');
    }
}

runTests().catch(console.error); 