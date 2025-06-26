#!/usr/bin/env node

/**
 * Update MongoDB Data Script
 * 
 * This script updates the MongoDB proposals to include data for the specific user
 */

const { MongoClient } = require('mongodb');

async function updateMongoDBData() {
    console.log('\n🔧 UPDATING MONGODB DATA');
    console.log('='.repeat(50));

    try {
        // Create fresh connection
        const uri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin';
        const client = new MongoClient(uri);

        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('cedo_auth');
        const proposalsCollection = db.collection('proposals');

        // Check current data
        const currentCount = await proposalsCollection.countDocuments();
        console.log(`📊 Current proposals: ${currentCount}`);

        // Get current proposals
        const currentProposals = await proposalsCollection.find({}).toArray();
        console.log('\n📝 Current proposals:');
        currentProposals.forEach((proposal, index) => {
            console.log(`  ${index + 1}. ${proposal.title} - ${proposal.contactEmail} (${proposal.status})`);
        });

        // Target user email
        const targetEmail = '20220025162@my.xu.edu.ph';

        // Check if user already has proposals
        const userProposals = await proposalsCollection.find({ contactEmail: targetEmail }).toArray();
        console.log(`\n🔍 Current proposals for ${targetEmail}: ${userProposals.length}`);

        if (userProposals.length === 0) {
            console.log('\n🔧 Adding proposals for target user...');

            // Add 2 proposals for the target user
            const newProposals = [
                {
                    title: 'Student Leadership Summit',
                    organizationName: 'Raymund Gerard Estaca',
                    organizationType: 'Student Organization',
                    contactEmail: targetEmail,
                    contactPerson: 'RAYMUND GERARD REYES ESTACA',
                    location: 'Xavier University - Ateneo de Cagayan',
                    startDate: new Date('2024-12-15'),
                    endDate: new Date('2024-12-15'),
                    status: 'draft',
                    complianceStatus: 'pending',
                    adminComments: 'Please complete the required documentation.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    description: 'A leadership development summit for student leaders.',
                    expectedParticipants: 150,
                    budget: 25000
                },
                {
                    title: 'Community Outreach Program',
                    organizationName: 'Raymund Gerard Estaca',
                    organizationType: 'Student Organization',
                    contactEmail: targetEmail,
                    contactPerson: 'RAYMUND GERARD REYES ESTACA',
                    location: 'Cagayan de Oro City',
                    startDate: new Date('2024-11-20'),
                    endDate: new Date('2024-11-20'),
                    status: 'rejected',
                    complianceStatus: 'not_compliant',
                    adminComments: 'Proposal needs revision. Budget allocation unclear and venue not confirmed.',
                    createdAt: new Date('2024-11-01'),
                    updatedAt: new Date('2024-11-05'),
                    description: 'Community service program for underprivileged families.',
                    expectedParticipants: 100,
                    budget: 15000
                }
            ];

            const result = await proposalsCollection.insertMany(newProposals);
            console.log(`✅ Added ${result.insertedCount} proposals for target user`);

            // Verify the addition
            const updatedUserProposals = await proposalsCollection.find({ contactEmail: targetEmail }).toArray();
            console.log(`✅ Target user now has ${updatedUserProposals.length} proposals`);

            updatedUserProposals.forEach((proposal, index) => {
                console.log(`  ${index + 1}. ${proposal.title} (${proposal.status})`);
            });

        } else {
            console.log('ℹ️ Target user already has proposals');
        }

        // Final summary
        const finalCount = await proposalsCollection.countDocuments();
        const finalUserCount = await proposalsCollection.countDocuments({ contactEmail: targetEmail });

        console.log(`\n📊 Final summary:`);
        console.log(`   Total proposals: ${finalCount}`);
        console.log(`   Proposals for ${targetEmail}: ${finalUserCount}`);

        // Test the query that the API uses
        const apiQuery = {
            contactEmail: targetEmail,
            status: { $in: ['draft', 'rejected'] }
        };

        const apiResults = await proposalsCollection.find(apiQuery).toArray();
        console.log(`   API query results: ${apiResults.length} matching proposals`);

        if (apiResults.length > 0) {
            console.log('   API would return:');
            apiResults.forEach((proposal, index) => {
                console.log(`     ${index + 1}. ${proposal.title} (${proposal.status})`);
            });
        }

        await client.close();
        console.log('\n🎉 MongoDB data update completed!');

    } catch (error) {
        console.error('❌ Update failed:', error);
    }
}

// Run the update
if (require.main === module) {
    updateMongoDBData().catch(console.error);
}

module.exports = { updateMongoDBData }; 