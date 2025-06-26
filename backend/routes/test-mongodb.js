const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

/**
 * Test MongoDB connection without authentication - creates fresh connection
 * This is for debugging purposes only
 */
router.get('/test-mongodb-direct', async (req, res) => {
    try {
        console.log('🧪 Testing MongoDB direct access with fresh connection...');

        // Create a completely fresh connection, bypassing any cached connections
        const uri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin';
        const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });

        console.log('🔗 Connecting with URI:', uri.replace(/\/\/.*@/, '//***:***@'));

        // Connect
        await client.connect();
        console.log('✅ Fresh MongoDB connection successful');

        // Get database
        const db = client.db('cedo_auth');

        // Test ping
        await db.command({ ping: 1 });
        console.log('✅ MongoDB ping successful');

        // Test proposals collection
        const proposalsCollection = db.collection('proposals');
        const totalCount = await proposalsCollection.countDocuments();
        console.log(`📊 Total proposals: ${totalCount}`);

        // Get sample data
        const sampleProposals = await proposalsCollection.find({}).limit(5).toArray();

        // Test specific user query
        const userEmail = '20220025162@my.xu.edu.ph';
        const userProposals = await proposalsCollection.find({
            contactEmail: userEmail,
            status: { $in: ['draft', 'rejected'] }
        }).toArray();

        const response = {
            success: true,
            mongodb: {
                connected: true,
                connectionString: uri.replace(/\/\/.*@/, '//***:***@'),
                totalDocuments: totalCount,
                sampleData: sampleProposals.map(doc => ({
                    id: doc._id?.toString(),
                    title: doc.title,
                    status: doc.status,
                    contactEmail: doc.contactEmail
                })),
                userQuery: {
                    email: userEmail,
                    matchingProposals: userProposals.length,
                    proposals: userProposals.map(doc => ({
                        id: doc._id?.toString(),
                        title: doc.title,
                        status: doc.status,
                        contactEmail: doc.contactEmail
                    }))
                }
            }
        };

        // Close the fresh connection
        await client.close();
        console.log('✅ MongoDB test completed successfully, connection closed');

        res.json(response);

    } catch (error) {
        console.error('❌ MongoDB test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            mongodb: {
                connected: false,
                error: error.message
            }
        });
    }
});

module.exports = router; 