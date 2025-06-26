#!/usr/bin/env node

/**
 * MongoDB Authentication Test Script
 * 
 * This script tests different MongoDB connection strings to find the correct authentication method
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

// Different connection string variations to test
const connectionStrings = [
    // Original with authSource=admin
    'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin',

    // Without authSource (authenticate against target database)
    'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth',

    // With authSource=cedo_auth
    'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=cedo_auth',

    // No authentication (if MongoDB is running without auth)
    'mongodb://localhost:27017/cedo_auth',

    // Default database
    'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin',
];

async function testConnection(uri, description) {
    log(`\n🧪 Testing: ${description}`, 'blue');
    log(`🔗 URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`, 'blue');

    try {
        const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });

        await client.connect();
        log('✅ Connection successful!', 'green');

        // Test database access
        const db = client.db('cedo_auth');
        await db.command({ ping: 1 });
        log('✅ Database ping successful!', 'green');

        // Test collection listing
        try {
            const collections = await db.listCollections().toArray();
            log(`✅ Collections listed: ${collections.length} found`, 'green');
            collections.forEach(coll => {
                log(`   📁 ${coll.name}`, 'blue');
            });
        } catch (listError) {
            log(`⚠️ Collection listing failed: ${listError.message}`, 'yellow');
        }

        // Test proposals collection access
        try {
            const proposalsCollection = db.collection('proposals');
            const count = await proposalsCollection.countDocuments();
            log(`✅ Proposals collection: ${count} documents`, 'green');

            if (count > 0) {
                const sample = await proposalsCollection.findOne({});
                log(`✅ Sample document found with keys: ${Object.keys(sample).join(', ')}`, 'green');
            }
        } catch (propError) {
            log(`⚠️ Proposals collection access failed: ${propError.message}`, 'yellow');
        }

        await client.close();
        log('✅ Connection closed successfully', 'green');
        return true;

    } catch (error) {
        log(`❌ Connection failed: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('\n🔍 MONGODB AUTHENTICATION TEST', 'blue');
    log('='.repeat(50), 'blue');

    let successfulConnection = null;

    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
        const description = `Option ${i + 1}`;

        const success = await testConnection(uri, description);

        if (success && !successfulConnection) {
            successfulConnection = uri;
            log(`\n🎉 FOUND WORKING CONNECTION STRING!`, 'green');
            log(`🔗 Use this URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`, 'green');
        }

        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!successfulConnection) {
        log('\n❌ No working connection found. Possible issues:', 'red');
        log('1. MongoDB server is not running', 'yellow');
        log('2. Username/password is incorrect', 'yellow');
        log('3. Database/user does not exist', 'yellow');
        log('4. Authentication is required but not configured', 'yellow');
        log('5. Network/firewall issues', 'yellow');

        log('\n💡 Try these commands to check MongoDB:', 'blue');
        log('mongosh --eval "db.runCommand({connectionStatus: 1})"', 'blue');
        log('mongosh admin --eval "db.auth(\'cedo_admin\', \'Raymund-Estaca01\')"', 'blue');
    } else {
        log('\n✨ Test completed successfully!', 'green');
    }
}

// Run the test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testConnection }; 