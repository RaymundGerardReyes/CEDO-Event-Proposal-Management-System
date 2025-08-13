// backend/scripts/insert-test-proposal.js

const { clientPromise } = require('../config/mongodb');

async function insertTestProposal() {
    try {
        const client = await clientPromise;
        const db = client.db('cedo_db');
        const proposals = db.collection('proposals');

        const testProposal = {
            title: 'Test MongoDB Proposal',
            description: 'A test proposal for MongoDB validation.',
            category: 'school-event',
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // +1 day
            location: 'Test Venue',
            submitter: 'raymundgerardrestaca@gmail.com',
            organizationType: 'school-based',
            contactPerson: 'Raymund Gerard Estaca',
            contactEmail: 'raymundgerardrestaca@gmail.com',
            contactPhone: '+63-912-345-6789',
            status: 'draft',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            eventDetails: {
                timeStart: '08:00',
                timeEnd: '17:00',
                eventType: 'academic',
                eventMode: 'offline',
                returnServiceCredit: 1,
                targetAudience: ['students'],
                organizationId: 'org-12345'
            },
            budget: 1000,
            objectives: 'Test objectives',
            volunteersNeeded: 5,
            adminComments: '',
            reviewComments: [],
            documents: [],
            complianceStatus: 'not_applicable',
            complianceDocuments: [],
            complianceDueDate: new Date(Date.now() + 172800000), // +2 days
        };

        const result = await proposals.insertOne(testProposal);
        console.log('✅ Test proposal inserted into MongoDB:', result.insertedId);
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to insert test proposal:', err);
        process.exit(1);
    }
}

insertTestProposal(); 