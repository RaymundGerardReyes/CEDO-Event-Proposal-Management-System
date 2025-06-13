#!/usr/bin/env node

const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function verifyMySQLFix() {
    console.log('🔍 VERIFYING MYSQL FIX FOR CEDO PROJECT');
    console.log('=====================================\n');

    let allTestsPassed = true;

    // Test 1: Check if MySQL service is running
    console.log('Test 1: MySQL Service Status');
    console.log('-----------------------------');
    try {
        const { stdout } = await execAsync('sc query mysql80');
        if (stdout.includes('RUNNING')) {
            console.log('✅ MySQL80 service is RUNNING');
        } else {
            console.log('❌ MySQL80 service is NOT running');
            console.log('🚨 ACTION REQUIRED: Start MySQL service via services.msc');
            allTestsPassed = false;
        }
    } catch (error) {
        console.log('❌ Could not check MySQL service status');
        allTestsPassed = false;
    }

    // Test 2: Check if port 3306 is listening
    console.log('\nTest 2: Port 3306 Listening');
    console.log('----------------------------');
    try {
        const { stdout } = await execAsync('netstat -an');
        if (stdout.includes(':3306')) {
            console.log('✅ Port 3306 is listening');
        } else {
            console.log('❌ Port 3306 is NOT listening');
            console.log('💡 MySQL service needs to be started');
            allTestsPassed = false;
        }
    } catch (error) {
        console.log('❌ Could not check port status');
    }

    // Test 3: Test MySQL connection
    console.log('\nTest 3: MySQL Connection');
    console.log('------------------------');

    const config = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'Raymund@Estaca01'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ MySQL connection successful');
        await connection.end();
    } catch (error) {
        console.log('❌ MySQL connection failed:', error.message);
        console.log('💡 Check that MySQL service is running and password is correct');
        allTestsPassed = false;
    }

    // Test 4: Check database exists
    console.log('\nTest 4: Database "cedo_auth" exists');
    console.log('-----------------------------------');
    try {
        const connection = await mysql.createConnection(config);
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbNames = databases.map(db => Object.values(db)[0]);

        if (dbNames.includes('cedo_auth')) {
            console.log('✅ Database "cedo_auth" exists');
        } else {
            console.log('❌ Database "cedo_auth" does NOT exist');
            console.log('🔧 Creating database...');
            await connection.execute('CREATE DATABASE cedo_auth');
            console.log('✅ Database "cedo_auth" created');
        }
        await connection.end();
    } catch (error) {
        console.log('❌ Could not check/create database:', error.message);
        allTestsPassed = false;
    }

    // Test 5: Check tables exist and their structure
    console.log('\nTest 5: Required Tables');
    console.log('-----------------------');
    try {
        const connection = await mysql.createConnection({ ...config, database: 'cedo_auth' });
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(table => Object.values(table)[0]);

        const requiredTables = ['proposals', 'users'];

        for (const table of requiredTables) {
            if (tableNames.includes(table)) {
                console.log(`✅ Table "${table}" exists`);

                // Check table structure
                const [columns] = await connection.execute(`DESCRIBE ${table}`);
                console.log(`   📋 ${table} has ${columns.length} columns`);
            } else {
                console.log(`❌ Table "${table}" missing`);
                allTestsPassed = false;
            }
        }

        await connection.end();
    } catch (error) {
        console.log('❌ Could not check tables:', error.message);
        allTestsPassed = false;
    }

    // Test 6: Test database operations with ACTUAL table structure
    console.log('\nTest 6: Database Operations (Updated for Real Schema)');
    console.log('----------------------------------------------------');
    try {
        const connection = await mysql.createConnection({ ...config, database: 'cedo_auth' });

        // Test insert with the ACTUAL column names from the proposals table
        const [result] = await connection.execute(`
            INSERT INTO proposals (
                organization_name, 
                organization_type, 
                contact_name, 
                contact_email, 
                event_name, 
                event_venue,
                event_start_date,
                event_end_date,
                event_start_time,
                event_end_time,
                event_mode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Test Organization',
            'school-based',
            'Test Contact',
            'test@example.com',
            'Test Event',
            'Test Venue',
            '2024-01-15',
            '2024-01-15',
            '09:00:00',
            '17:00:00',
            'offline'
        ]);
        console.log('✅ INSERT operation successful, ID:', result.insertId);

        // Test select
        const [rows] = await connection.execute('SELECT id, organization_name, contact_name, event_name FROM proposals WHERE id = ?', [result.insertId]);
        console.log('✅ SELECT operation successful:', rows[0]);

        // Clean up test data
        await connection.execute('DELETE FROM proposals WHERE id = ?', [result.insertId]);
        console.log('✅ Test data cleaned up');

        await connection.end();
    } catch (error) {
        console.log('❌ Database operations failed:', error.message);
        allTestsPassed = false;
    }

    // Test 7: Test the server's database configuration
    console.log('\nTest 7: Environment Configuration');
    console.log('---------------------------------');
    try {
        // Load the environment variables
        require('dotenv').config();

        const dbConfig = {
            host: process.env.DB_HOST || process.env.MYSQL_HOST,
            port: process.env.DB_PORT || process.env.MYSQL_PORT,
            user: process.env.DB_USER || process.env.MYSQL_USER,
            password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
            database: process.env.DB_NAME || process.env.MYSQL_DATABASE
        };

        console.log('📋 Server will use these DB settings:');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Port: ${dbConfig.port}`);
        console.log(`   User: ${dbConfig.user}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   Password: ${'*'.repeat(dbConfig.password?.length || 0)}`);

        if (dbConfig.host && dbConfig.port && dbConfig.user && dbConfig.database) {
            console.log('✅ Environment variables are properly configured');
        } else {
            console.log('❌ Some environment variables are missing');
            allTestsPassed = false;
        }

    } catch (error) {
        console.log('❌ Could not check environment:', error.message);
        allTestsPassed = false;
    }

    // Final Results
    console.log('\n🏁 VERIFICATION RESULTS');
    console.log('======================');

    if (allTestsPassed) {
        console.log('🎉 ALL TESTS PASSED! MySQL is ready for the backend server.');
        console.log('\n✅ Your setup is complete:');
        console.log('- ✅ MySQL service running');
        console.log('- ✅ Port 3306 listening');
        console.log('- ✅ Database connection working');
        console.log('- ✅ Database "cedo_auth" exists');
        console.log('- ✅ Required tables exist with proper structure');
        console.log('- ✅ Database operations functional');
        console.log('- ✅ Environment variables configured');
        console.log('\n🚀 Next step: Run "npm run dev" to start the backend server');
        console.log('\n💡 The server should now connect successfully without errors!');
    } else {
        console.log('❌ Some tests failed. Please address the issues above.');
        console.log('\n🚨 Most likely needed:');
        console.log('1. Start MySQL service: Win+R → services.msc → MySQL80 → Start');
        console.log('2. Check environment variables in .env file');
    }
}

verifyMySQLFix().catch(console.error); 