#!/usr/bin/env node

/**
 * Comprehensive Environment and Database Connection Checker
 * Based on Next.js MongoDB Connection Best Practices
 * 
 * This script helps diagnose connection issues with both MySQL and MongoDB
 */

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironment() {
    log('\n🔍 COMPREHENSIVE ENVIRONMENT & DATABASE CHECK', 'cyan');
    log('='.repeat(50), 'cyan');

    // Check Node.js version
    log(`\n📋 Node.js Version: ${process.version}`, 'blue');
    log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');

    // Check required environment variables
    log('\n🔧 ENVIRONMENT VARIABLES', 'yellow');
    const requiredEnvVars = [
        'MONGODB_URI',
        'MONGODB_URI_PROD',
        'MONGODB_DB_NAME',
        'MYSQL_HOST',
        'MYSQL_USER',
        'MYSQL_PASSWORD',
        'MYSQL_DATABASE',
        'JWT_SECRET'
    ];

    let missingVars = [];
    requiredEnvVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            log(`✅ ${varName}: SET (${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : value.substring(0, 20)}...)`, 'green');
        } else {
            log(`❌ ${varName}: NOT SET`, 'red');
            missingVars.push(varName);
        }
    });

    if (missingVars.length > 0) {
        log(`\n⚠️  Missing ${missingVars.length} environment variables`, 'yellow');
    }

    // Test MongoDB Connection
    log('\n🍃 MONGODB CONNECTION TEST', 'magenta');
    try {
        const { MongoClient } = require('mongodb');
        const uri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';

        log(`🔗 Connection URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`, 'blue');

        const client = new MongoClient(uri, {
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        await client.connect();
        log('✅ MongoDB: Connection successful!', 'green');

        // Test database access
        const db = client.db('cedo_auth');
        await db.command({ ping: 1 });
        log('✅ MongoDB: Database ping successful!', 'green');

        // List collections
        const collections = await db.listCollections().toArray();
        log(`📊 MongoDB: Found ${collections.length} collections`, 'blue');
        collections.forEach(collection => {
            log(`   📁 ${collection.name}`, 'blue');
        });

        // Test sample queries
        for (const collectionName of ['proposals', 'Proposals', 'users', 'Users']) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                const hasData = count > 0;

                log(`${hasData ? '✅' : '⚠️'} Collection '${collectionName}': ${count} documents`, hasData ? 'green' : 'yellow');

                if (hasData && count <= 5) {
                    const samples = await collection.find({}).limit(2).toArray();
                    samples.forEach((doc, index) => {
                        log(`    Sample ${index + 1}: ${Object.keys(doc).join(', ')}`, 'blue');
                    });
                }
            } catch (collErr) {
                log(`❌ Collection '${collectionName}': ${collErr.message}`, 'red');
            }
        }

        await client.close();

    } catch (mongoError) {
        log(`❌ MongoDB: Connection failed - ${mongoError.message}`, 'red');
        log(`   Possible causes:`, 'yellow');
        log(`   - Wrong connection string`, 'yellow');
        log(`   - Database server not running`, 'yellow');
        log(`   - Network/firewall issues`, 'yellow');
        log(`   - Authentication problems`, 'yellow');
    }

    // Test MySQL Connection
    log('\n🐬 MYSQL CONNECTION TEST', 'magenta');
    try {
        const mysql = require('mysql2/promise');

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || process.env.POSTGRES_HOST,
            user: process.env.MYSQL_USER || process.env.POSTGRES_USER,
            password: process.env.MYSQL_PASSWORD || process.env.POSTGRES_PASSWORD,
            database: process.env.MYSQL_DATABASE || process.env.POSTGRES_DATABASE,
            port: process.env.MYSQL_PORT || process.env.POSTGRES_PORT
        });

        log('✅ MySQL: Connection successful!', 'green');

        // Test database access
        const [rows] = await connection.execute('SELECT 1 as test');
        log('✅ MySQL: Query test successful!', 'green');

        // Check proposals table
        try {
            const [proposalRows] = await connection.execute('SELECT COUNT(*) as count FROM proposals');
            const count = proposalRows[0].count;
            log(`📊 MySQL: Proposals table has ${count} records`, count > 0 ? 'green' : 'yellow');

            if (count > 0) {
                const [sampleRows] = await connection.execute('SELECT id, organization_name, proposal_status, contact_email FROM proposals LIMIT 3');
                log('📄 MySQL: Sample records:', 'blue');
                sampleRows.forEach((row, index) => {
                    log(`   ${index + 1}. ID: ${row.id}, Status: ${row.proposal_status}, Email: ${row.contact_email}`, 'blue');
                });
            }
        } catch (tableErr) {
            log(`❌ MySQL: Proposals table error - ${tableErr.message}`, 'red');
        }

        await connection.end();

    } catch (mysqlError) {
        log(`❌ MySQL: Connection failed - ${mysqlError.message}`, 'red');
        log(`   Possible causes:`, 'yellow');
        log(`   - Wrong credentials`, 'yellow');
        log(`   - MySQL server not running`, 'yellow');
        log(`   - Network/port issues`, 'yellow');
        log(`   - Database doesn't exist`, 'yellow');
    }

    // Summary and recommendations
    log('\n📋 RECOMMENDATIONS', 'cyan');

    if (missingVars.length > 0) {
        log('1. Set missing environment variables in your .env file', 'yellow');
        log('   Example .env file:', 'blue');
        log('   MONGODB_URI=mongodb://username:password@localhost:27017/database', 'blue');
        log('   MYSQL_HOST=localhost', 'blue');
        log('   MYSQL_USER=your_user', 'blue');
        log('   MYSQL_PASSWORD=your_password', 'blue');
        log('   MYSQL_DATABASE=cedo_auth', 'blue');
    }

    log('2. Ensure both database servers are running', 'yellow');
    log('3. Check firewall and network settings', 'yellow');
    log('4. Verify database credentials and permissions', 'yellow');
    log('5. Test the debug endpoint: GET /api/proposals/debug-mongodb', 'yellow');

    log('\n✨ Environment check complete!', 'green');
}

// Run the check
if (require.main === module) {
    checkEnvironment().catch(console.error);
}

module.exports = { checkEnvironment }; 