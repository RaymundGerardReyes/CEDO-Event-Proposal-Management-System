#!/usr/bin/env node

/**
 * MongoDB Data Setup Script
 * 
 * This script populates MongoDB with sample rejected proposals
 * to fix the empty collection issue identified in the environment check.
 */

const { MongoClient } = require('mongodb');

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

// Sample rejected proposals data
const sampleRejectedProposals = [
    {
        title: "Community Garden Initiative",
        organizationName: "Green Thumb Society",
        organizationType: "Non-profit",
        contactEmail: "test@example.com",
        contactPerson: "John Doe",
        location: "Downtown Community Center",
        startDate: new Date("2024-03-15"),
        endDate: new Date("2024-03-15"),
        status: "rejected",
        complianceStatus: "not_applicable",
        adminComments: "Budget allocation not approved for this quarter. Please resubmit with revised budget.",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-15"),
        description: "A community event to establish a neighborhood garden",
        expectedParticipants: 50,
        budget: 2500
    },
    {
        title: "Youth Tech Workshop",
        organizationName: "Digital Future Academy",
        organizationType: "Educational",
        contactEmail: "test@example.com",
        contactPerson: "Jane Smith",
        location: "Tech Hub",
        startDate: new Date("2024-04-10"),
        endDate: new Date("2024-04-10"),
        status: "rejected",
        complianceStatus: "pending",
        adminComments: "Venue not available on requested date. Consider alternative dates.",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-05"),
        description: "Technology workshop for underprivileged youth",
        expectedParticipants: 30,
        budget: 1800
    },
    {
        title: "Environmental Awareness Campaign",
        organizationName: "EcoWarriors",
        organizationType: "Advocacy Group",
        contactEmail: "test@example.com",
        contactPerson: "Mike Johnson",
        location: "City Park",
        startDate: new Date("2024-06-05"),
        endDate: new Date("2024-06-05"),
        status: "draft",
        complianceStatus: "not_applicable",
        adminComments: "",
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-15"),
        description: "Environmental awareness and cleanup campaign",
        expectedParticipants: 100,
        budget: 3200
    },
    {
        title: "Senior Citizens Health Fair",
        organizationName: "Golden Years Association",
        organizationType: "Health Organization",
        contactEmail: "admin@example.com",
        contactPerson: "Sarah Wilson",
        location: "Community Hall",
        startDate: new Date("2024-05-20"),
        endDate: new Date("2024-05-20"),
        status: "rejected",
        complianceStatus: "rejected",
        adminComments: "Health permits not in compliance with local regulations. Please obtain proper certifications.",
        createdAt: new Date("2024-04-01"),
        updatedAt: new Date("2024-04-20"),
        description: "Free health screening and wellness fair for seniors",
        expectedParticipants: 75,
        budget: 4500
    }
];

async function setupMongoDBData() {
    try {
        log('\n🍃 MONGODB DATA SETUP', 'blue');
        log('='.repeat(40), 'blue');

        const uri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
        const client = new MongoClient(uri);

        await client.connect();
        log('✅ Connected to MongoDB', 'green');

        const db = client.db('cedo_auth');
        const proposalsCollection = db.collection('proposals');

        // Check existing data
        const existingCount = await proposalsCollection.countDocuments();
        log(`📊 Existing proposals: ${existingCount}`, 'yellow');

        if (existingCount === 0) {
            log('📝 Inserting sample rejected proposals...', 'yellow');

            const result = await proposalsCollection.insertMany(sampleRejectedProposals);
            log(`✅ Inserted ${result.insertedCount} sample proposals`, 'green');

            // Verify insertion
            const newCount = await proposalsCollection.countDocuments();
            log(`📊 Total proposals now: ${newCount}`, 'green');

            // Show status distribution
            const statusCounts = await proposalsCollection.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray();

            log('📈 Status distribution:', 'blue');
            statusCounts.forEach(item => {
                log(`   ${item._id}: ${item.count}`, 'blue');
            });

        } else {
            log('⚠️  Collection already has data. Skipping insertion.', 'yellow');
            log('   Use --force flag to clear and recreate data', 'yellow');

            // Show current status distribution
            const statusCounts = await proposalsCollection.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray();

            log('📈 Current status distribution:', 'blue');
            statusCounts.forEach(item => {
                log(`   ${item._id}: ${item.count}`, 'blue');
            });
        }

        await client.close();
        log('✅ MongoDB setup complete!', 'green');

    } catch (error) {
        log(`❌ MongoDB setup failed: ${error.message}`, 'red');
        throw error;
    }
}

// Handle command line arguments
const forceFlag = process.argv.includes('--force');

if (forceFlag) {
    log('⚠️  Force flag detected. Will clear existing data.', 'yellow');
}

// Run the setup
if (require.main === module) {
    setupMongoDBData().catch(console.error);
}

module.exports = { setupMongoDBData }; 