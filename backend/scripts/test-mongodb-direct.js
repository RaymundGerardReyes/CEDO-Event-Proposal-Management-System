#!/usr/bin/env node

/**
 * Direct MongoDB Test Script
 * 
 * This script directly tests MongoDB connection and queries to verify the fix
 */

require('dotenv').config();
const { clientPromise } = require('../config/mongodb');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMongoDBDirect() {
    try {
        log('\n🧪 TESTING MONGODB DIRECTLY', 'blue');
        log('='.repeat(50), 'blue');

        // Test connection
        log('\n📋 Testing MongoDB connection...', 'blue');
        const client = await clientPromise;
        const db = client.db('cedo_auth');

        // Test ping
        await db.command({ ping: 1 });
        log('✅ MongoDB connection successful!', 'green');

        // List collections
        const collections = await db.listCollections().toArray();
        log(`✅ Collections found: ${collections.length}`, 'green');
        collections.forEach(coll => {
            log(`   📁 ${coll.name}`, 'blue');
        });

        // Test proposals collection
        const proposalsCollection = db.collection('proposals');
        const totalCount = await proposalsCollection.countDocuments();
        log(`\n📊 Total proposals in MongoDB: ${totalCount}`, 'blue');

        if (totalCount > 0) {
            // Get all proposals
            const allProposals = await proposalsCollection.find({}).toArray();
            log('\n📝 All proposals:', 'green');

            allProposals.forEach((proposal, index) => {
                log(`  ${index + 1}. ${proposal.title || 'Untitled'} (Status: ${proposal.status})`, 'green');
                log(`     Email: ${proposal.contactEmail || 'N/A'}`, 'blue');
                log(`     ID: ${proposal._id}`, 'blue');
            });

            // Test query for specific user (the one used in frontend)
            const userEmail = '20220025162@my.xu.edu.ph';
            log(`\n🔍 Testing query for user: ${userEmail}`, 'yellow');

            const userProposals = await proposalsCollection.find({
                contactEmail: userEmail,
                status: { $in: ['draft', 'rejected'] }
            }).toArray();

            log(`✅ Found ${userProposals.length} proposals for user`, 'green');

            if (userProposals.length > 0) {
                userProposals.forEach((proposal, index) => {
                    log(`  ${index + 1}. ${proposal.title} (${proposal.status})`, 'green');
                });
            }

            // Test status distribution
            const statusCounts = await proposalsCollection.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray();

            log('\n📊 Status distribution:', 'blue');
            statusCounts.forEach(status => {
                log(`   ${status._id}: ${status.count}`, 'blue');
            });

            // Test different status queries
            log('\n🔍 Testing different status queries:', 'yellow');

            const draftCount = await proposalsCollection.countDocuments({ status: 'draft' });
            const rejectedCount = await proposalsCollection.countDocuments({ status: 'rejected' });
            const deniedCount = await proposalsCollection.countDocuments({ status: 'denied' });

            log(`   Draft proposals: ${draftCount}`, 'blue');
            log(`   Rejected proposals: ${rejectedCount}`, 'blue');
            log(`   Denied proposals: ${deniedCount}`, 'blue');

            // Test the exact query used in the API
            log('\n🔍 Testing exact API query conditions:', 'yellow');
            const apiQuery = {
                contactEmail: userEmail,
                status: { $in: ['draft', 'rejected'] }
            };

            const apiResults = await proposalsCollection.find(apiQuery).toArray();
            log(`✅ API query would return ${apiResults.length} proposals`, 'green');

            if (apiResults.length > 0) {
                log('   Proposals that would be returned:', 'green');
                apiResults.forEach((proposal, index) => {
                    log(`   ${index + 1}. ${proposal.title} (${proposal.status}) - ${proposal.contactEmail}`, 'green');
                });
            }
        }

        log('\n🎉 MongoDB direct test completed successfully!', 'green');

    } catch (error) {
        log(`❌ MongoDB direct test failed: ${error.message}`, 'red');
        console.error(error);
    }
}

// Run the test
if (require.main === module) {
    testMongoDBDirect().catch(console.error);
}

module.exports = { testMongoDBDirect }; 