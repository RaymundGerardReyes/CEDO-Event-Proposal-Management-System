#!/usr/bin/env node

/**
 * Test the database pool from config/db.js
 */

const { pool } = require('./config/db');

async function testPoolConnection() {
    console.log('🧪 Testing database pool from config/db.js...\n');

    try {
        console.log('🔄 Getting connection from pool...');
        const connection = await pool.getConnection();
        console.log('✅ Pool connection successful!');

        console.log('🔄 Testing basic query...');
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
        console.log('✅ Query successful:', rows[0]);

        console.log('🔄 Testing database access...');
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log(`✅ Found ${databases.length} databases`);

        const cedoAuthExists = databases.some(db => db.Database === 'cedo_auth');
        console.log(`📊 cedo_auth database exists: ${cedoAuthExists ? 'YES' : 'NO'}`);

        if (cedoAuthExists) {
            console.log('🔄 Testing cedo_auth database...');
            await connection.execute('USE cedo_auth');

            const [tables] = await connection.execute('SHOW TABLES');
            console.log(`📊 Found ${tables.length} tables in cedo_auth`);

            const proposalsExists = tables.some(table => table.Tables_in_cedo_auth === 'proposals');
            console.log(`📊 proposals table exists: ${proposalsExists ? 'YES' : 'NO'}`);

            if (proposalsExists) {
                const [count] = await connection.execute('SELECT COUNT(*) as count FROM proposals');
                console.log(`📊 proposals table has ${count[0].count} records`);

                // Test a simple insert (then delete it)
                console.log('🔄 Testing insert operation...');
                const [insertResult] = await connection.execute(
                    'INSERT INTO proposals (title, contactPerson, contactEmail, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                    ['Test Pool Connection', 'Test User', 'test@pool.com', 'draft']
                );
                console.log(`✅ Insert successful - ID: ${insertResult.insertId}`);

                // Clean up the test record
                await connection.execute('DELETE FROM proposals WHERE id = ?', [insertResult.insertId]);
                console.log('✅ Test record cleaned up');
            }
        }

        connection.release();
        console.log('✅ Connection released back to pool');

        console.log('\n🎉 Database pool test completed successfully!');
        console.log('✅ The pool configuration is working correctly');

    } catch (error) {
        console.error('❌ Pool test failed:', error.message);
        console.error('📋 Error code:', error.code);
        console.error('📋 Error details:', error);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Authentication error - try running: node fix-mysql-auth.js');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Connection refused - check if MySQL is running');
        }
    }
}

// Run the test
testPoolConnection().catch(error => {
    console.error('🚨 Test script failed:', error);
    process.exit(1);
}); 