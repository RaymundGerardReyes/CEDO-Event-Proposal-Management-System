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

    // Test 5: Check tables exist
    console.log('\nTest 5: Required Tables');
    console.log('-----------------------');
    try {
        const connection = await mysql.createConnection({ ...config, database: 'cedo_auth' });
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(table => Object.values(table)[0]);

        const requiredTables = ['proposals', 'users'];
        let missingTables = [];

        for (const table of requiredTables) {
            if (tableNames.includes(table)) {
                console.log(`✅ Table "${table}" exists`);
            } else {
                console.log(`❌ Table "${table}" missing`);
                missingTables.push(table);
            }
        }

        if (missingTables.length > 0) {
            console.log('🔧 Creating missing tables...');

            if (missingTables.includes('proposals')) {
                await connection.execute(`
                    CREATE TABLE proposals (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        contactPerson VARCHAR(255) NOT NULL,
                        contactEmail VARCHAR(255) NOT NULL,
                        contactPhone VARCHAR(50),
                        description TEXT,
                        organizationType VARCHAR(100),
                        status VARCHAR(50) DEFAULT 'draft',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ "proposals" table created');
            }

            if (missingTables.includes('users')) {
                await connection.execute(`
                    CREATE TABLE users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        password_hash VARCHAR(255),
                        google_id VARCHAR(255) UNIQUE,
                        role ENUM('student', 'admin') DEFAULT 'student',
                        status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ "users" table created');
            }
        }

        await connection.end();
    } catch (error) {
        console.log('❌ Could not check/create tables:', error.message);
        allTestsPassed = false;
    }

    // Test 6: Test insert/select operation
    console.log('\nTest 6: Database Operations');
    console.log('---------------------------');
    try {
        const connection = await mysql.createConnection({ ...config, database: 'cedo_auth' });

        // Test insert
        const [result] = await connection.execute(
            'INSERT INTO proposals (title, contactPerson, contactEmail, status) VALUES (?, ?, ?, ?)',
            ['Test Proposal', 'Test User', 'test@example.com', 'draft']
        );
        console.log('✅ INSERT operation successful');

        // Test select
        const [rows] = await connection.execute('SELECT * FROM proposals WHERE id = ?', [result.insertId]);
        console.log('✅ SELECT operation successful');

        // Clean up test data
        await connection.execute('DELETE FROM proposals WHERE id = ?', [result.insertId]);
        console.log('✅ Test data cleaned up');

        await connection.end();
    } catch (error) {
        console.log('❌ Database operations failed:', error.message);
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
        console.log('- ✅ Required tables created');
        console.log('- ✅ Database operations functional');
        console.log('\n🚀 Next step: Run "npm run dev" to start the backend server');
    } else {
        console.log('❌ Some tests failed. Please address the issues above.');
        console.log('\n🚨 Most likely needed:');
        console.log('1. Start MySQL service: Win+R → services.msc → MySQL80 → Start');
        console.log('2. Then run this script again: node verify-fix.js');
    }
}

verifyMySQLFix().catch(console.error);