#!/usr/bin/env node

/**
 * Quick MySQL Fix for CEDO Project
 * Handles authentication issues and creates missing database
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

async function quickMySQLFix() {
    console.log('🚀 Quick MySQL Fix for CEDO Project\n');

    // Step 1: Test MySQL command line access
    console.log('Step 1: Testing MySQL command line access...');
    try {
        const result = await runCommand('mysql -u root -e "SELECT 1 as test"');
        console.log('✅ MySQL command line access successful');
    } catch (error) {
        console.log('❌ MySQL command line access failed');
        console.log('💡 Trying to fix authentication method...');

        try {
            // Try to fix authentication method
            await runCommand('mysql -u root -e "ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';"');
            await runCommand('mysql -u root -e "FLUSH PRIVILEGES;"');
            console.log('✅ Authentication method updated');
        } catch (authError) {
            console.log('⚠️ Could not update authentication automatically');
            console.log('💡 Manual steps required:');
            console.log('1. Open MySQL Command Line Client');
            console.log('2. Run: ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'\';');
            console.log('3. Run: FLUSH PRIVILEGES;');
            console.log('4. Run this script again');
            return false;
        }
    }

    // Step 2: Create database
    console.log('\nStep 2: Setting up database...');
    try {
        await runCommand('mysql -u root -e "CREATE DATABASE IF NOT EXISTS cedo_auth"');
        console.log('✅ Database cedo_auth created/verified');
    } catch (error) {
        console.log('❌ Could not create database:', error.stderr);
        return false;
    }

    // Step 3: Create tables
    console.log('\nStep 3: Creating tables...');
    try {
        const sqlFile = path.join(__dirname, 'fix-database-setup.sql');
        await runCommand(`mysql -u root cedo_auth < "${sqlFile}"`);
        console.log('✅ Tables created/verified');
    } catch (error) {
        console.log('⚠️ Table creation had issues, but continuing...');
        // Create essential tables manually
        try {
            const createProposalsTable = `mysql -u root -e "USE cedo_auth; CREATE TABLE IF NOT EXISTS proposals (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, contactPerson VARCHAR(255) NOT NULL, contactEmail VARCHAR(255) NOT NULL, status VARCHAR(50) DEFAULT 'draft', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);"`;
            await runCommand(createProposalsTable);
            console.log('✅ Essential proposals table created');
        } catch (tableError) {
            console.log('❌ Could not create proposals table:', tableError.stderr);
            return false;
        }
    }

    // Step 4: Test the setup
    console.log('\nStep 4: Testing setup...');
    try {
        const result = await runCommand('mysql -u root -e "USE cedo_auth; SELECT COUNT(*) as count FROM proposals;"');
        console.log('✅ Database and tables verified');
        console.log('📊 Proposals table is ready');
    } catch (error) {
        console.log('❌ Database test failed:', error.stderr);
        return false;
    }

    // Step 5: Create environment file
    console.log('\nStep 5: Creating environment configuration...');
    const envContent = `# Database Configuration (Fixed)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cedo_auth

# Alternative environment variables
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=cedo_auth

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cedo-partnership

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
`;

    try {
        fs.writeFileSync(path.join(__dirname, '.env'), envContent);
        console.log('✅ Environment file created');
    } catch (error) {
        console.log('⚠️ Could not create .env file:', error.message);
    }

    console.log('\n🎉 MySQL Fix Completed Successfully!\n');
    console.log('✅ Configuration:');
    console.log('   Host: 127.0.0.1');
    console.log('   Port: 3306');
    console.log('   User: root');
    console.log('   Password: [EMPTY]');
    console.log('   Database: cedo_auth');

    console.log('\n🎯 Next Steps:');
    console.log('1. Restart the backend server: npm run dev');
    console.log('2. Look for "MySQL database connected successfully" in logs');
    console.log('3. Test the Section 2 form in your frontend');

    console.log('\n📋 Quick Test:');
    console.log('Run: curl -X POST http://localhost:5000/api/proposals/section2-organization \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"title":"Test","contactPerson":"John","contactEmail":"john@test.com"}\'');

    return true;
}

// Run the fix
quickMySQLFix().then(success => {
    if (success) {
        console.log('\n🚀 The MySQL connection errors should now be resolved!');
        console.log('💡 If you still see errors, restart your terminal and try again.');
    } else {
        console.log('\n❌ Fix incomplete. Please follow the manual steps above.');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('🚨 Fix script error:', error);
    process.exit(1);
}); 