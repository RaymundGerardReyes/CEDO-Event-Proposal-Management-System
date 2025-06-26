#!/usr/bin/env node

/**
 * Test Connection Strings Script
 * 
 * This script tests both connection strings to see which one actually works for operations
 */

const { MongoClient } = require('mongodb');

async function testConnectionStrings() {
    console.log('\n🧪 TESTING CONNECTION STRINGS');
    console.log('='.repeat(50));

    const connectionStrings = [
        'mongodb://localhost:27017/cedo_auth',
        'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin'
    ];

    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
        console.log(`\n🔍 Testing connection ${i + 1}: ${uri.replace(/\/\/.*@/, '//***:***@')}`);

        try {
            const client = new MongoClient(uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 10000,
            });

            await client.connect();
            console.log('✅ Connection successful');

            const db = client.db('cedo_auth');
            await db.command({ ping: 1 });
            console.log('✅ Ping successful');

            // Test actual operations
            const proposalsCollection = db.collection('proposals');

            try {
                const count = await proposalsCollection.countDocuments();
                console.log(`✅ Count operation successful: ${count} documents`);

                const sample = await proposalsCollection.findOne({});
                console.log(`✅ Find operation successful: ${sample ? 'Found sample document' : 'No documents'}`);

                if (sample) {
                    console.log(`   Sample document ID: ${sample._id}`);
                    console.log(`   Sample document title: ${sample.title || 'N/A'}`);
                    console.log(`   Sample document status: ${sample.status || 'N/A'}`);
                    console.log(`   Sample document email: ${sample.contactEmail || 'N/A'}`);
                }

                console.log(`🎉 CONNECTION STRING ${i + 1} WORKS FULLY!`);

            } catch (opError) {
                console.log(`❌ Operations failed: ${opError.message}`);
            }

            await client.close();

        } catch (error) {
            console.log(`❌ Connection failed: ${error.message}`);
        }
    }
}

// Run the test
if (require.main === module) {
    testConnectionStrings().catch(console.error);
}

module.exports = { testConnectionStrings }; 