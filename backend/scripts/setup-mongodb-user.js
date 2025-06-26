#!/usr/bin/env node

/**
 * MongoDB User Setup Script
 * 
 * This script sets up the MongoDB user and database properly
 */

const { MongoClient } = require('mongodb');

async function setupMongoDBUser() {
    console.log('\n🔧 SETTING UP MONGODB USER');
    console.log('='.repeat(50));

    // Try connecting without authentication first
    const uriNoAuth = 'mongodb://localhost:27017/';

    try {
        console.log('🔍 Trying connection without authentication...');
        const client = new MongoClient(uriNoAuth);
        await client.connect();

        console.log('✅ Connected without authentication');

        // Check if authentication is required
        try {
            const adminDb = client.db('admin');
            await adminDb.command({ listUsers: 1 });
            console.log('✅ No authentication required - MongoDB is running in non-auth mode');

            // Test direct connection to our database
            const ceDoDb = client.db('cedo_auth');
            await ceDoDb.command({ ping: 1 });
            console.log('✅ Can access cedo_auth database directly');

            // Test proposals collection
            const proposalsCollection = ceDoDb.collection('proposals');
            const count = await proposalsCollection.countDocuments();
            console.log(`✅ Proposals collection has ${count} documents`);

            if (count > 0) {
                const sample = await proposalsCollection.findOne({});
                console.log('✅ Sample document structure:');
                console.log('   Fields:', Object.keys(sample).join(', '));
                console.log('   ID:', sample._id);
                console.log('   Title:', sample.title || 'N/A');
                console.log('   Status:', sample.status || 'N/A');
                console.log('   Email:', sample.contactEmail || 'N/A');
            }

        } catch (authError) {
            console.log('⚠️ Authentication is required');

            // Try to create user
            try {
                const adminDb = client.db('admin');

                console.log('🔧 Creating MongoDB user...');
                await adminDb.command({
                    createUser: 'cedo_admin',
                    pwd: 'Raymund-Estaca01',
                    roles: [
                        { role: 'readWrite', db: 'cedo_auth' },
                        { role: 'dbAdmin', db: 'cedo_auth' }
                    ]
                });
                console.log('✅ User created successfully');

            } catch (createError) {
                if (createError.message.includes('already exists')) {
                    console.log('ℹ️ User already exists');
                } else {
                    console.error('❌ Failed to create user:', createError.message);
                }
            }
        }

        await client.close();

        // Now try with authentication
        console.log('\n🔍 Testing with authentication...');
        const uriWithAuth = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin';

        const authClient = new MongoClient(uriWithAuth);
        await authClient.connect();

        const authDb = authClient.db('cedo_auth');
        await authDb.command({ ping: 1 });
        console.log('✅ Authentication successful');

        // Test collection operations
        const proposalsCollection = authDb.collection('proposals');
        const count = await proposalsCollection.countDocuments();
        console.log(`✅ Can query proposals collection: ${count} documents`);

        await authClient.close();

    } catch (error) {
        console.error('❌ Setup failed:', error.message);

        // Try alternative connection strings
        const alternatives = [
            'mongodb://localhost:27017/cedo_auth',
            'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth',
            'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=cedo_auth'
        ];

        console.log('\n🔍 Trying alternative connection strings...');

        for (const uri of alternatives) {
            try {
                console.log(`\nTesting: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
                const client = new MongoClient(uri);
                await client.connect();

                const db = client.db('cedo_auth');
                await db.command({ ping: 1 });
                console.log('✅ Connection successful');

                const proposalsCollection = db.collection('proposals');
                const count = await proposalsCollection.countDocuments();
                console.log(`✅ Proposals count: ${count}`);

                await client.close();
                console.log(`🎉 WORKING CONNECTION STRING: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
                break;

            } catch (altError) {
                console.log(`❌ Failed: ${altError.message}`);
            }
        }
    }
}

// Run the setup
if (require.main === module) {
    setupMongoDBUser().catch(console.error);
}

module.exports = { setupMongoDBUser }; 