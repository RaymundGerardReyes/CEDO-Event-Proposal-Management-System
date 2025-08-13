const { MongoClient } = require('mongodb');

// Test MongoDB validation
async function testMongoDBValidation() {
    const uri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('cedo_db');
        const collection = db.collection('proposals');

        // Test document that should match the schema
        const testDoc = {
            title: 'Test Event',
            description: 'School Event: Test Event at Test Venue',
            category: 'school-event',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-01'),
            location: 'Test Venue',
            submitter: 'unknown',
            budget: 0,
            objectives: 'Organize Test Event school event at Test Venue',
            volunteersNeeded: 0,
            organizationType: 'school-based',
            contactPerson: 'Test Org',
            contactEmail: 'contact@example.com',
            contactPhone: '+63-88-000-0000',
            status: 'pending',
            priority: 'medium',
            assignedTo: '',
            adminComments: '',
            reviewComments: [],
            documents: [],
            complianceStatus: 'not_applicable',
            complianceDocuments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            eventDetails: {
                timeStart: '09:00',
                timeEnd: '10:00',
                eventType: 'academic',
                eventMode: 'offline',
                returnServiceCredit: 0,
                targetAudience: ['students'],
                organizationId: ''
            }
        };

        console.log('Testing document insertion...');
        console.log('Document:', JSON.stringify(testDoc, null, 2));

        const result = await collection.insertOne(testDoc);
        console.log('✅ Success! Inserted ID:', result.insertedId);

    } catch (error) {
        console.error('❌ Validation error:', error.message);
        if (error.code === 121) {
            console.error('Document validation failed. Details:', error.errInfo);
        }
    } finally {
        await client.close();
    }
}

testMongoDBValidation(); 