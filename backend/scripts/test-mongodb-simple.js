#!/usr/bin/env node

/**
 * Simple MongoDB Test Script
 * 
 * This script directly queries the proposals collection without listing collections
 */

require('dotenv').config();
const { clientPromise } = require('../config/mongodb');

async function testMongoDBSimple() {
    try {
        console.log('\n🧪 TESTING MONGODB SIMPLE QUERY');
        console.log('='.repeat(50));

        // Get connection
        const client = await clientPromise;
        const db = client.db('cedo_auth');

        // Test ping
        await db.command({ ping: 1 });
        console.log('✅ MongoDB ping successful!');

        // Direct access to proposals collection
        const proposalsCollection = db.collection('proposals');

        // Count all documents
        const totalCount = await proposalsCollection.countDocuments();
        console.log(`📊 Total proposals in MongoDB: ${totalCount}`);

        if (totalCount > 0) {
            // Get all proposals without filtering
            const allProposals = await proposalsCollection.find({}).limit(10).toArray();
            console.log('\n📝 Sample proposals:');

            allProposals.forEach((proposal, index) => {
                console.log(`  ${index + 1}. ${proposal.title || 'Untitled'}`);
                console.log(`     Status: ${proposal.status}`);
                console.log(`     Email: ${proposal.contactEmail || 'N/A'}`);
                console.log(`     ID: ${proposal._id}`);
                console.log('');
            });

            // Test query for the specific user from the logs
            const userEmail = '20220025162@my.xu.edu.ph';
            console.log(`🔍 Testing query for user: ${userEmail}`);

            const userProposals = await proposalsCollection.find({
                contactEmail: userEmail
            }).toArray();

            console.log(`✅ Found ${userProposals.length} proposals for user (any status)`);

            // Test with draft/rejected filter
            const filteredProposals = await proposalsCollection.find({
                contactEmail: userEmail,
                status: { $in: ['draft', 'rejected'] }
            }).toArray();

            console.log(`✅ Found ${filteredProposals.length} draft/rejected proposals for user`);

            if (filteredProposals.length > 0) {
                console.log('   Matching proposals:');
                filteredProposals.forEach((proposal, index) => {
                    console.log(`   ${index + 1}. ${proposal.title} (${proposal.status})`);
                });
            }

            // Check if any proposals have different email formats
            const emailVariations = await proposalsCollection.find({
                $or: [
                    { contactEmail: { $regex: /20220025162/i } },
                    { contact_email: { $regex: /20220025162/i } },
                    { email: { $regex: /20220025162/i } }
                ]
            }).toArray();

            console.log(`🔍 Found ${emailVariations.length} proposals with similar email patterns`);

        } else {
            console.log('❌ No proposals found in MongoDB');
        }

        console.log('\n🎉 MongoDB simple test completed!');

    } catch (error) {
        console.error(`❌ MongoDB test failed: ${error.message}`);
        console.error(error);
    }
}

// Run the test
if (require.main === module) {
    testMongoDBSimple().catch(console.error);
}

module.exports = { testMongoDBSimple }; 