#!/usr/bin/env node

/**
 * MySQL Connection Test Script
 * Tests the database connection configuration and helps diagnose authentication issues
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testMySQLConnection() {
    console.log('🧪 Testing MySQL Connection Configuration...\n');

    // Test configuration that matches the working connection
    const configs = [
        {
            name: 'Config 1: Default environment variables',
            config: {
                host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
                port: process.env.DB_PORT || process.env.MYSQL_PORT || 3307,
                user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
                password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
                database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth'
            }
        },
        {
            name: 'Config 2: Force port 3307 (working port)',
            config: {
                host: 'localhost',
                port: 3307,
                user: 'root',
                password: '',
                database: 'cedo_auth'
            }
        },
        {
            name: 'Config 3: Default port 3306',
            config: {
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
                database: 'cedo_auth'
            }
        },
        {
            name: 'Config 4: Try with password',
            config: {
                host: 'localhost',
                port: 3307,
                user: 'root',
                password: 'root', // Common default password
                database: 'cedo_auth'
            }
        }
    ];

    for (const testConfig of configs) {
        console.log(`\n📋 Testing ${testConfig.name}:`);
        console.log(`   Host: ${testConfig.config.host}`);
        console.log(`   Port: ${testConfig.config.port}`);
        console.log(`   User: ${testConfig.config.user}`);
        console.log(`   Password: ${testConfig.config.password ? '[SET]' : '[EMPTY]'}`);
        console.log(`   Database: ${testConfig.config.database}`);

        try {
            const connection = await mysql.createConnection(testConfig.config);

            // Test basic query
            const [rows] = await connection.execute('SELECT 1 as test');
            console.log('   ✅ Connection successful!');
            console.log('   ✅ Test query successful:', rows[0]);

            // Test database access
            try {
                const [tables] = await connection.execute('SHOW TABLES');
                console.log(`   ✅ Database access successful - Found ${tables.length} tables`);

                // Test proposals table specifically
                const [proposalsCheck] = await connection.execute(
                    "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'proposals'",
                    [testConfig.config.database]
                );
                console.log(`   ✅ Proposals table exists: ${proposalsCheck[0].count > 0 ? 'YES' : 'NO'}`);

            } catch (dbError) {
                console.log('   ⚠️  Connection OK but database access failed:', dbError.message);
            }

            await connection.end();
            console.log('   ✅ This configuration works! Use this one.');
            break; // Use the first working configuration

        } catch (error) {
            console.log('   ❌ Connection failed:', error.message);
            console.log('   📋 Error code:', error.code);

            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('   💡 This is an authentication error - check username/password');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   💡 Connection refused - check if MySQL is running on this port');
            } else if (error.code === 'ER_BAD_DB_ERROR') {
                console.log('   💡 Database does not exist - check database name');
            }
        }
    }

    console.log('\n🔧 MySQL Authentication Fix (if needed):');
    console.log('If you see ER_NOT_SUPPORTED_AUTH_MODE, run this in MySQL:');
    console.log('   ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';');
    console.log('   FLUSH PRIVILEGES;');
    console.log('\nIf you see ER_ACCESS_DENIED_ERROR, try:');
    console.log('   1. Check if MySQL root password is set');
    console.log('   2. Try connecting with MySQL Workbench first');
    console.log('   3. Check if MySQL is running on the expected port');
}

// Run the test
testMySQLConnection().catch(error => {
    console.error('🚨 Test script failed:', error);
    process.exit(1);
}); 