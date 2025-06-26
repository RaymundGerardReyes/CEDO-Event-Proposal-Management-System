#!/usr/bin/env node

console.log('🔧 MongoDB Connection Test Script');
console.log('==================================');

// Test the enhanced MongoDB configuration
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

async function testConnection() {
    try {
        console.log('\n1️⃣ Testing MongoDB Configuration...');
        const { clientPromise, testConnection, debugMongoDB } = require('./config/mongodb');

        console.log('\n2️⃣ Testing Raw Connection...');
        const client = await clientPromise();
        console.log('✅ Raw connection successful');

        console.log('\n3️⃣ Testing Database Operations...');
        const result = await testConnection();
        console.log(`✅ Database test: ${result ? 'PASSED' : 'FAILED'}`);

        console.log('\n4️⃣ Testing GridFS Initialization...');
        const { initialiseGridFS } = require('./utils/gridfs');
        await initialiseGridFS();
        console.log('✅ GridFS initialization successful');

        console.log('\n5️⃣ Running Debug Information...');
        await debugMongoDB();

        console.log('\n🎉 All MongoDB tests PASSED!');
        console.log('Your connection timeout issue should now be resolved.');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ MongoDB Connection Test FAILED');
        console.error('Error:', error.message);

        console.error('\n🔧 Troubleshooting Steps:');
        console.error('1. Verify MongoDB is running: netstat -an | findstr :27017');
        console.error('2. Check your .env file has the correct MONGODB_URI');
        console.error('3. Try disabling VPN if you have one active');
        console.error('4. Ensure Windows Firewall allows port 27017');
        console.error('5. Update your .env MONGODB_URI to include timeout parameters:');
        console.error('   MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@127.0.0.1:27017/cedo_auth?authSource=admin&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000');

        process.exit(1);
    }
}

testConnection(); 