#!/usr/bin/env node

/**
 * MongoDB Setup Script for CEDO Backend
 * 
 * This script helps users set up MongoDB for the CEDO application:
 * 1. Checks if MongoDB is installed
 * 2. Provides installation instructions
 * 3. Creates database and user
 * 4. Tests connection
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if MongoDB is installed
function checkMongoInstalled() {
    try {
        execSync('mongod --version', { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

// Check if MongoDB service is running
function checkMongoService() {
    try {
        // Try to connect to MongoDB
        execSync('mongosh --eval "db.runCommand({ping: 1})"', {
            stdio: 'pipe',
            timeout: 5000
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Get installation instructions based on OS
function getInstallInstructions() {
    const platform = process.platform;

    logStep('1', 'MongoDB Installation Instructions');

    switch (platform) {
        case 'win32':
            logInfo('Windows Installation:');
            log('   1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community');
            log('   2. Run the installer and follow the setup wizard');
            log('   3. Choose "Complete" installation');
            log('   4. Install MongoDB Compass (optional but recommended)');
            log('   5. Start MongoDB service:');
            log('      - Open Services (services.msc)');
            log('      - Find "MongoDB" service');
            log('      - Right-click and select "Start"');
            log('      - Set startup type to "Automatic"');
            break;

        case 'darwin':
            logInfo('macOS Installation:');
            log('   1. Install using Homebrew:');
            log('      brew tap mongodb/brew');
            log('      brew install mongodb-community');
            log('   2. Start MongoDB service:');
            log('      brew services start mongodb/brew/mongodb-community');
            break;

        case 'linux':
            logInfo('Linux Installation:');
            log('   1. Follow official guide: https://docs.mongodb.com/manual/administration/install-on-linux/');
            log('   2. For Ubuntu/Debian:');
            log('      sudo apt-get install mongodb');
            log('   3. Start MongoDB service:');
            log('      sudo systemctl start mongod');
            log('      sudo systemctl enable mongod');
            break;

        default:
            logInfo('Please visit: https://docs.mongodb.com/manual/installation/');
    }
}

// Create database and user
async function setupDatabase() {
    logStep('2', 'Setting up CEDO database and user');

    try {
        // Create database and user
        const setupScript = `
      use cedo_db
      
      // Create admin user
      db.createUser({
        user: "cedo_admin",
        pwd: "Raymund-Estaca01",
        roles: [
          { role: "readWrite", db: "cedo_db" },
          { role: "dbAdmin", db: "cedo_db" }
        ]
      })
      
      // Create collections
      db.createCollection("proposals")
      db.createCollection("users")
      db.createCollection("events")
      db.createCollection("files")
      
      print("Database and user created successfully!")
    `;

        // Write script to temporary file
        const scriptPath = path.join(__dirname, 'temp-setup.js');
        fs.writeFileSync(scriptPath, setupScript);

        // Execute the script
        execSync(`mongosh --file "${scriptPath}"`, { stdio: 'inherit' });

        // Clean up
        fs.unlinkSync(scriptPath);

        logSuccess('Database and user created successfully!');
        return true;
    } catch (error) {
        logError('Failed to setup database:');
        logError(error.message);
        return false;
    }
}

// Test connection
function testConnection() {
    logStep('3', 'Testing MongoDB connection');

    try {
        const testScript = `
      use cedo_db
      db.runCommand({ping: 1})
      print("Connection test successful!")
    `;

        const scriptPath = path.join(__dirname, 'temp-test.js');
        fs.writeFileSync(scriptPath, testScript);

        execSync(`mongosh "mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin" --file "${scriptPath}"`, {
            stdio: 'inherit'
        });

        fs.unlinkSync(scriptPath);
        logSuccess('Connection test passed!');
        return true;
    } catch (error) {
        logError('Connection test failed:');
        logError(error.message);
        return false;
    }
}

// Update environment file
function updateEnvironment() {
    logStep('4', 'Updating environment configuration');

    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `
# MongoDB Configuration
MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin

# Other environment variables...
NODE_ENV=development
PORT=5000
JWT_SECRET=your-development-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
  `.trim();

    try {
        fs.writeFileSync(envPath, envContent);
        logSuccess('Environment file updated!');
        return true;
    } catch (error) {
        logError('Failed to update environment file:');
        logError(error.message);
        return false;
    }
}

// Main setup function
async function main() {
    log('🚀 CEDO MongoDB Setup Script', 'bright');
    log('==============================', 'bright');

    // Check if MongoDB is installed
    logStep('1', 'Checking MongoDB installation');
    if (checkMongoInstalled()) {
        logSuccess('MongoDB is installed');
    } else {
        logWarning('MongoDB is not installed');
        getInstallInstructions();
        log('\nPlease install MongoDB and run this script again.', 'yellow');
        process.exit(1);
    }

    // Check if MongoDB service is running
    logStep('2', 'Checking MongoDB service');
    if (checkMongoService()) {
        logSuccess('MongoDB service is running');
    } else {
        logWarning('MongoDB service is not running');
        logInfo('Please start MongoDB service and run this script again.');
        process.exit(1);
    }

    // Setup database
    const dbSetup = await setupDatabase();
    if (!dbSetup) {
        logError('Database setup failed. Please check the error messages above.');
        process.exit(1);
    }

    // Test connection
    const connectionTest = testConnection();
    if (!connectionTest) {
        logError('Connection test failed. Please check the error messages above.');
        process.exit(1);
    }

    // Update environment
    const envUpdate = updateEnvironment();
    if (!envUpdate) {
        logError('Environment update failed. Please check the error messages above.');
        process.exit(1);
    }

    log('\n🎉 MongoDB setup completed successfully!', 'green');
    log('\nNext steps:', 'bright');
    log('1. Start your backend server: npm run dev');
    log('2. Test the connection in your application');
    log('3. MongoDB features (GridFS, file storage) are now available');
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        logError('Setup failed:');
        logError(error.message);
        process.exit(1);
    });
}

module.exports = {
    checkMongoInstalled,
    checkMongoService,
    setupDatabase,
    testConnection,
    updateEnvironment
}; 