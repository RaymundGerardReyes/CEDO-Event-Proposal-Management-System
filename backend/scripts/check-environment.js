#!/usr/bin/env node

/**
 * Comprehensive Environment and Database Connection Checker
 * Based on Next.js postgresql Connection Best Practices
 * 
 * This script helps diagnose connection issues with both postgresql and postgresql
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
        'postgresql_URI',
        'postgresql_URI_PROD',
        'postgresql_DB_NAME',
        'postgresql_HOST',
        'postgresql_USER',
        'postgresql_PASSWORD',
        'postgresql_DATABASE',
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

    // Test postgresql Connection
    log('\n🍃 postgresql CONNECTION TEST', 'magenta');
    try {
        const { postgresqlClient } = require('postgresql');
        const uri = process.env.postgresql_URI || 'postgresql://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';

        log(`🔗 Connection URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`, 'blue');

        const client = new postgresqlClient(uri, {
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        await client.connect();
        log('✅ postgresql: Connection successful!', 'green');

        // Test database access
        const db = client.db('cedo_auth');
        await db.command({ ping: 1 });
        log('✅ postgresql: Database ping successful!', 'green');

        // List collections
        const collections = await db.listCollections().toArray();
        log(`📊 postgresql: Found ${collections.length} collections`, 'blue');
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

    } catch (postgresqlError) {
        log(`❌ postgresql: Connection failed - ${postgresqlError.message}`, 'red');
        log(`   Possible causes:`, 'yellow');
        log(`   - Wrong connection string`, 'yellow');
        log(`   - Database server not running`, 'yellow');
        log(`   - Network/firewall issues`, 'yellow');
        log(`   - Authentication problems`, 'yellow');
    }

    // Test postgresql Connection
    log('\n🐬 postgresql CONNECTION TEST', 'magenta');
    try {
        const postgresql = require('postgresql2/promise');

        const connection = await postgresql.createConnection({
            host: process.env.postgresql_HOST || process.env.POSTGRES_HOST,
            user: process.env.postgresql_USER || process.env.POSTGRES_USER,
            password: process.env.postgresql_PASSWORD || process.env.POSTGRES_PASSWORD,
            database: process.env.postgresql_DATABASE || process.env.POSTGRES_DATABASE,
            port: process.env.postgresql_PORT || process.env.POSTGRES_PORT
        });

        log('✅ postgresql: Connection successful!', 'green');

        // Test database access
        const [rows] = await connection.execute('SELECT 1 as test');
        log('✅ postgresql: Query test successful!', 'green');

        // Check proposals table
        try {
            const [proposalRows] = await connection.execute('SELECT COUNT(*) as count FROM proposals');
            const count = proposalRows[0].count;
            log(`📊 postgresql: Proposals table has ${count} records`, count > 0 ? 'green' : 'yellow');

            if (count > 0) {
                const [sampleRows] = await connection.execute('SELECT id, organization_name, proposal_status, contact_email FROM proposals LIMIT 3');
                log('📄 postgresql: Sample records:', 'blue');
                sampleRows.forEach((row, index) => {
                    log(`   ${index + 1}. ID: ${row.id}, Status: ${row.proposal_status}, Email: ${row.contact_email}`, 'blue');
                });
            }
        } catch (tableErr) {
            log(`❌ postgresql: Proposals table error - ${tableErr.message}`, 'red');
        }

        await connection.end();

    } catch (postgresqlError) {
        log(`❌ postgresql: Connection failed - ${postgresqlError.message}`, 'red');
        log(`   Possible causes:`, 'yellow');
        log(`   - Wrong credentials`, 'yellow');
        log(`   - postgresql server not running`, 'yellow');
        log(`   - Network/port issues`, 'yellow');
        log(`   - Database doesn't exist`, 'yellow');
    }

    // Summary and recommendations
    log('\n📋 RECOMMENDATIONS', 'cyan');

    if (missingVars.length > 0) {
        log('1. Set missing environment variables in your .env file', 'yellow');
        log('   Example .env file:', 'blue');
        log('   postgresql_URI=postgresql://username:password@localhost:27017/database', 'blue');
        log('   postgresql_HOST=localhost', 'blue');
        log('   postgresql_USER=your_user', 'blue');
        log('   postgresql_PASSWORD=your_password', 'blue');
        log('   postgresql_DATABASE=cedo_auth', 'blue');
    }

    log('2. Ensure both database servers are running', 'yellow');
    log('3. Check firewall and network settings', 'yellow');
    log('4. Verify database credentials and permissions', 'yellow');
    log('5. Test the debug endpoint: GET /api/proposals/debug-postgresql', 'yellow');

    log('\n✨ Environment check complete!', 'green');
}

// Run the check
if (require.main === module) {
    checkEnvironment().catch(console.error);
}

module.exports = { checkEnvironment }; 