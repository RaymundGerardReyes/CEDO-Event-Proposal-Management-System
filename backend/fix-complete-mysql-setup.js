#!/usr/bin/env node

/**
 * Complete MySQL Setup and Connection Fix
 * This script resolves all MySQL connection issues for the CEDO project
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function completeMyqlSetup() {
    console.log('🔧 Complete MySQL Setup and Connection Fix\n');

    // Step 1: Test basic MySQL connectivity
    console.log('Step 1: Testing MySQL connectivity...');

    const configs = [
        {
            name: 'Standard configuration',
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: ''
        },
        {
            name: 'With password',
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'root'
        },
        {
            name: 'Localhost fallback',
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: ''
        }
    ];

    let workingConnection = null;
    let workingConfig = null;

    for (const config of configs) {
        console.log(`🧪 Testing: ${config.name} (${config.host}:${config.port})`);
        try {
            const connection = await mysql.createConnection(config);
            await connection.execute('SELECT 1');
            console.log('✅ Connection successful!');
            workingConnection = connection;
            workingConfig = config;
            break;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }

    if (!workingConnection) {
        console.error('❌ Could not establish any MySQL connection.');
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Check if MySQL is running: net start mysql');
        console.log('2. Check MySQL port: netstat -an | findstr :3306');
        console.log('3. Try MySQL Workbench connection');
        console.log('4. Check Windows Services for MySQL');
        return false;
    }

    // Step 2: Check and create database
    console.log('\nStep 2: Setting up database...');
    try {
        // Check if cedo_auth exists
        const [databases] = await workingConnection.execute('SHOW DATABASES');
        const cedoExists = databases.some(db => db.Database === 'cedo_auth');

        if (!cedoExists) {
            console.log('📚 Creating cedo_auth database...');
            await workingConnection.execute('CREATE DATABASE cedo_auth');
            console.log('✅ Database created successfully');
        } else {
            console.log('✅ Database cedo_auth already exists');
        }

        // Switch to the database
        await workingConnection.execute('USE cedo_auth');

        // Check and create tables
        const [tables] = await workingConnection.execute('SHOW TABLES');
        const tableNames = tables.map(table => table.Tables_in_cedo_auth);

        console.log(`📊 Found ${tables.length} existing tables:`, tableNames);

        const requiredTables = ['users', 'proposals', 'access_logs', 'reviews'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));

        if (missingTables.length > 0) {
            console.log(`📝 Creating missing tables: ${missingTables.join(', ')}`);

            // Read and execute the SQL setup script
            const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-database-setup.sql'), 'utf8');
            const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);

            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await workingConnection.execute(statement);
                    } catch (error) {
                        // Ignore errors for statements that already exist
                        if (!error.message.includes('already exists')) {
                            console.log(`⚠️ SQL statement warning: ${error.message}`);
                        }
                    }
                }
            }
            console.log('✅ Tables created successfully');
        } else {
            console.log('✅ All required tables exist');
        }

        // Test proposals table specifically
        const [proposalsCount] = await workingConnection.execute('SELECT COUNT(*) as count FROM proposals');
        console.log(`📊 Proposals table has ${proposalsCount[0].count} records`);

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        return false;
    }

    // Step 3: Test the application configuration
    console.log('\nStep 3: Testing application configuration...');
    try {
        // Test insert operation
        const [insertResult] = await workingConnection.execute(
            'INSERT INTO proposals (title, contactPerson, contactEmail, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            ['Setup Test', 'Test User', 'test@setup.com', 'draft']
        );
        console.log(`✅ INSERT test successful - ID: ${insertResult.insertId}`);

        // Clean up test record
        await workingConnection.execute('DELETE FROM proposals WHERE id = ?', [insertResult.insertId]);
        console.log('✅ Test record cleaned up');

    } catch (error) {
        console.error('❌ Application test failed:', error.message);
        return false;
    }

    // Step 4: Create environment configuration
    console.log('\nStep 4: Creating environment configuration...');
    try {
        const envContent = `# Database Configuration (Fixed)
DB_HOST=${workingConfig.host}
DB_PORT=${workingConfig.port}
DB_USER=${workingConfig.user}
DB_PASSWORD=${workingConfig.password}
DB_NAME=cedo_auth

# Alternative environment variables (for compatibility)
MYSQL_HOST=${workingConfig.host}
MYSQL_PORT=${workingConfig.port}
MYSQL_USER=${workingConfig.user}
MYSQL_PASSWORD=${workingConfig.password}
MYSQL_DATABASE=cedo_auth

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cedo-partnership

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Email Configuration (if needed)
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=

# Google Auth Configuration (if needed)
GOOGLE_CLIENT_ID_BACKEND=
RECAPTCHA_SECRET_KEY=

# JWT Secret (if needed)
JWT_SECRET=your_jwt_secret_here_change_in_production
`;

        const envPath = path.join(__dirname, '.env');
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Environment file created/updated');

    } catch (error) {
        console.log('⚠️ Could not create .env file:', error.message);
        console.log('💡 You may need to create it manually with the working configuration');
    }

    await workingConnection.end();

    // Step 5: Display success information
    console.log('\n🎉 MySQL Setup Completed Successfully!\n');

    console.log('✅ Working Configuration:');
    console.log(`   Host: ${workingConfig.host}`);
    console.log(`   Port: ${workingConfig.port}`);
    console.log(`   User: ${workingConfig.user}`);
    console.log(`   Password: ${workingConfig.password ? '[SET]' : '[EMPTY]'}`);
    console.log(`   Database: cedo_auth`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Restart the backend server: npm run dev');
    console.log('2. Check server logs for "MySQL database connected successfully"');
    console.log('3. Test Section 2 form in the frontend');
    console.log('4. Verify data saves to MySQL proposals table');

    console.log('\n📋 Test Commands:');
    console.log('Test connection: node test-connection-fix.js');
    console.log('Test endpoint: curl -X POST http://localhost:5000/api/proposals/section2-organization \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"title":"Test","contactPerson":"John","contactEmail":"john@test.com"}\'');

    return true;
}

// Run the complete setup
completeMyqlSetup().then(success => {
    if (success) {
        console.log('\n🚀 Setup completed! The MySQL connection errors should be resolved.');
    } else {
        console.log('\n❌ Setup failed. Please check the errors above and try manual configuration.');
    }
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('🚨 Setup script error:', error);
    process.exit(1);
}); 