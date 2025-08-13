/**
 * MongoDB Connection Test
 * Purpose: Test MongoDB connection and provide setup instructions
 */

require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');

async function testMongoDBConnection() {
    console.log('🔍 Testing MongoDB Connection...');
    console.log('=====================================');

    // Check environment variables
    const mongoUri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
    console.log(`🔗 MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

    try {
        console.log('🔄 Attempting to connect to MongoDB...');

        const client = new MongoClient(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 10000
        });

        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');

        // Test database access
        const db = client.db('cedo_db');
        await db.command({ ping: 1 });
        console.log('✅ Database ping successful!');

        // List collections
        const collections = await db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections:`);
        collections.forEach(col => console.log(`   - ${col.name}`));

        await client.close();
        console.log('✅ Connection test completed successfully!');

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('1. Install MongoDB Community Server:');
        console.log('   - Download from: https://www.mongodb.com/try/download/community');
        console.log('   - Install with default settings');
        console.log('');
        console.log('2. Start MongoDB service:');
        console.log('   - Windows: Start MongoDB service from Services');
        console.log('   - Or run: mongod --dbpath C:\\data\\db');
        console.log('');
        console.log('3. Create MongoDB user:');
        console.log('   - Connect to MongoDB: mongo');
        console.log('   - Switch to admin: use admin');
        console.log('   - Create user:');
        console.log('     db.createUser({');
        console.log('       user: "cedo_admin",');
        console.log('       pwd: "Raymund-Estaca01",');
        console.log('       roles: [{ role: "readWrite", db: "cedo_db" }]');
        console.log('     })');
        console.log('');
        console.log('4. Create database:');
        console.log('   - Switch to database: use cedo_db');
        console.log('   - Create a test collection: db.createCollection("test")');
        console.log('');
        console.log('5. Update environment variables:');
        console.log('   - MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin');
        console.log('');
        console.log('6. Run initialization script:');
        console.log('   - node scripts/init-mongodb.js');
    }
}

// Run the test
testMongoDBConnection()
    .then(() => {
        console.log('\n🎉 Test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }); 