#!/usr/bin/env node

/**
 * Quick MySQL Connection Test with Corrected Configuration
 * Tests the exact configuration that should work
 */

const mysql = require('mysql2/promise');

async function testCorrectConnection() {
    console.log('🧪 Testing MySQL Connection with Corrected Configuration...\n');

    // Test the exact configuration that should work
    const workingConfig = {
        host: '127.0.0.1',  // Use 127.0.0.1 instead of localhost
        port: 3306,         // Use correct port
        user: 'root',
        password: '',       // Empty password
        database: 'cedo_auth'
    };

    console.log('📋 Testing configuration:');
    console.log(`   Host: ${workingConfig.host}`);
    console.log(`   Port: ${workingConfig.port}`);
    console.log(`   User: ${workingConfig.user}`);
    console.log(`   Password: [EMPTY]`);
    console.log(`   Database: ${workingConfig.database}\n`);

    try {
        console.log('🔄 Creating connection...');
        const connection = await mysql.createConnection(workingConfig);

        console.log('✅ Connection successful!');

        console.log('🔄 Testing basic query...');
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
        console.log('✅ Query successful:', rows[0]);

        console.log('🔄 Testing database access...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables in cedo_auth`);

        const proposalsExists = tables.some(table =>
            table.Tables_in_cedo_auth === 'proposals'
        );
        console.log(`📊 proposals table exists: ${proposalsExists ? 'YES' : 'NO'}`);

        if (proposalsExists) {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM proposals');
            console.log(`📊 proposals table has ${count[0].count} records`);

            // Test a simple insert to proposals table
            console.log('🔄 Testing INSERT operation...');
            const [insertResult] = await connection.execute(
                'INSERT INTO proposals (title, contactPerson, contactEmail, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                ['Connection Test', 'Test User', 'test@connection.com', 'draft']
            );
            console.log(`✅ INSERT successful - ID: ${insertResult.insertId}`);

            // Clean up the test record
            await connection.execute('DELETE FROM proposals WHERE id = ?', [insertResult.insertId]);
            console.log('✅ Test record cleaned up');
        }

        await connection.end();
        console.log('✅ Connection closed');

        console.log('\n🎉 MySQL connection test PASSED!');
        console.log('✅ Configuration is working correctly');
        console.log('✅ The Section 2 endpoint should now work');

        return true;

    } catch (error) {
        console.error('❌ Connection test FAILED:', error.message);
        console.error('📋 Error code:', error.code);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Authentication error solutions:');
            console.log('1. Run: mysql -u root -e "ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';"');
            console.log('2. Run: mysql -u root -e "FLUSH PRIVILEGES;"');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Connection refused solutions:');
            console.log('1. Check if MySQL is running: mysql -u root -e "SELECT 1"');
            console.log('2. Check MySQL port: netstat -an | findstr :3306');
            console.log('3. Try connecting manually: mysql -u root -h 127.0.0.1 -P 3306');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database error solutions:');
            console.log('1. Create database: mysql -u root -e "CREATE DATABASE cedo_auth;"');
            console.log('2. Check existing databases: mysql -u root -e "SHOW DATABASES;"');
        }

        return false;
    }
}

// Run the test
testCorrectConnection().then(success => {
    if (success) {
        console.log('\n🎯 Next steps:');
        console.log('1. Restart the backend server (npm run dev)');
        console.log('2. Test the Section 2 form in the frontend');
        console.log('3. Verify data saves to MySQL');
    } else {
        console.log('\n🔧 Fix the connection issue above, then restart the server');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('🚨 Test script error:', error);
    process.exit(1);
}); 