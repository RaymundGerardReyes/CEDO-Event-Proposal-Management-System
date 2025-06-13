#!/usr/bin/env node

/**
 * MySQL Authentication Fix Script
 * Fixes the "ER_NOT_SUPPORTED_AUTH_MODE" and "Access denied" errors
 * Based on: https://blog.csdn.net/weixin_43932098/article/details/99300769
 */

const mysql = require('mysql2/promise');

async function fixMySQLAuth() {
    console.log('🔧 MySQL Authentication Fix Script\n');

    // First, try to connect with different configurations to find working one
    const testConfigs = [
        {
            name: 'Standard root (no password)',
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: ''
        },
        {
            name: 'Root with common password',
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root'
        },
        {
            name: 'Root with empty password (mysql_native_password)',
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            authPlugin: 'mysql_native_password'
        }
    ];

    let workingConnection = null;

    for (const config of testConfigs) {
        console.log(`🧪 Testing connection: ${config.name}`);
        try {
            const connection = await mysql.createConnection(config);
            console.log('✅ Connection successful!');
            workingConnection = connection;
            break;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
            console.log(`   Error code: ${error.code}\n`);
        }
    }

    if (!workingConnection) {
        console.log('❌ Could not establish any MySQL connection.');
        console.log('\n💡 Manual steps to fix MySQL authentication:');
        console.log('1. Open MySQL Command Line Client or MySQL Workbench');
        console.log('2. Connect as root (try with and without password)');
        console.log('3. Run these commands:');
        console.log('   ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';');
        console.log('   FLUSH PRIVILEGES;');
        console.log('4. Restart MySQL service');
        console.log('5. Run this script again');
        return;
    }

    console.log('\n🔧 Fixing MySQL authentication...');

    try {
        // Fix the authentication method for root user
        console.log('🔄 Setting mysql_native_password for root@localhost...');
        await workingConnection.execute(
            "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''"
        );
        console.log('✅ Authentication method updated');

        // Flush privileges to ensure changes take effect
        console.log('🔄 Flushing privileges...');
        await workingConnection.execute('FLUSH PRIVILEGES');
        console.log('✅ Privileges flushed');

        // Test the database and table access
        console.log('🔄 Testing database access...');

        // Check if cedo_auth database exists
        const [databases] = await workingConnection.execute('SHOW DATABASES');
        const cedoAuthExists = databases.some(db => db.Database === 'cedo_auth');
        console.log(`📊 cedo_auth database exists: ${cedoAuthExists ? 'YES' : 'NO'}`);

        if (cedoAuthExists) {
            // Switch to cedo_auth database
            await workingConnection.execute('USE cedo_auth');

            // Check tables
            const [tables] = await workingConnection.execute('SHOW TABLES');
            console.log(`📊 Found ${tables.length} tables in cedo_auth`);

            const proposalsExists = tables.some(table => table.Tables_in_cedo_auth === 'proposals');
            console.log(`📊 proposals table exists: ${proposalsExists ? 'YES' : 'NO'}`);

            if (proposalsExists) {
                const [count] = await workingConnection.execute('SELECT COUNT(*) as count FROM proposals');
                console.log(`📊 proposals table has ${count[0].count} records`);
            }
        } else {
            console.log('⚠️  cedo_auth database does not exist');
            console.log('💡 You may need to run the database initialization script');
        }

        await workingConnection.end();

        console.log('\n✅ MySQL authentication fix completed successfully!');
        console.log('✅ Node.js should now be able to connect to MySQL without password');
        console.log('\n📋 Recommended configuration for Node.js:');
        console.log('   host: localhost');
        console.log('   port: 3306');
        console.log('   user: root');
        console.log('   password: "" (empty string)');
        console.log('   database: cedo_auth');

    } catch (error) {
        console.error('❌ Error fixing authentication:', error.message);
        console.log('\n💡 If you see "Access denied", try these manual steps:');
        console.log('1. Stop MySQL service');
        console.log('2. Start MySQL with --skip-grant-tables');
        console.log('3. Connect and run: ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';');
        console.log('4. Run: FLUSH PRIVILEGES;');
        console.log('5. Restart MySQL normally');
    }
}

// Run the fix
fixMySQLAuth().catch(error => {
    console.error('🚨 Script failed:', error);
    process.exit(1);
}); 