#!/usr/bin/env node

/**
 * MongoDB Development Setup Helper
 * This script helps configure MongoDB for development without authentication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️  MongoDB Development Setup Helper');
console.log('📋 This script will help you configure MongoDB for development\n');

// Check if MongoDB is running
function checkMongoDBStatus() {
    try {
        execSync('mongosh --eval "db.adminCommand(\'ping\')" --quiet', { stdio: 'pipe' });
        console.log('✅ MongoDB is running and accessible without authentication');
        return true;
    } catch (error) {
        console.log('❌ MongoDB is not accessible without authentication');
        return false;
    }
}

// Check if MongoDB service is running
function checkMongoDBService() {
    try {
        if (process.platform === 'win32') {
            execSync('sc query MongoDB', { stdio: 'pipe' });
            console.log('✅ MongoDB service is running (Windows)');
        } else {
            execSync('systemctl is-active mongod', { stdio: 'pipe' });
            console.log('✅ MongoDB service is running (Linux)');
        }
        return true;
    } catch (error) {
        console.log('❌ MongoDB service is not running');
        return false;
    }
}

// Create a development MongoDB configuration file
function createDevConfig() {
    const configContent = `# MongoDB Development Configuration
# This disables authentication for development purposes
# DO NOT USE IN PRODUCTION

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

# Security section commented out for development
# security:
#   authorization: enabled
`;

    const configPath = path.join(__dirname, '..', 'config', 'mongod-dev.conf');

    // Create config directory if it doesn't exist
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, configContent);
    console.log(`✅ Development MongoDB config created at: ${configPath}`);

    return configPath;
}

// Create environment file with MongoDB settings
function createEnvFile() {
    const envPath = path.join(__dirname, '..', '.env.mongodb');
    const envContent = `# MongoDB Development Configuration
# Use these settings for development without authentication

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=cedo_db

# Leave these empty for no authentication
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_AUTH_DB=admin

# Connection settings
DB_CONNECT_RETRIES=3
DB_CONNECT_DELAY_MS=2000
`;

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ MongoDB environment file created at: ${envPath}`);
    console.log('📝 You can copy these settings to your main .env file');

    return envPath;
}

// Main setup function
async function setupMongoDB() {
    console.log('🔍 Checking MongoDB status...\n');

    const serviceRunning = checkMongoDBService();
    const accessible = checkMongoDBStatus();

    if (!serviceRunning) {
        console.log('\n❌ MongoDB service is not running.');
        console.log('🔧 Please start MongoDB service:');
        if (process.platform === 'win32') {
            console.log('   net start MongoDB');
        } else {
            console.log('   sudo systemctl start mongod');
        }
        return;
    }

    if (accessible) {
        console.log('\n🎉 MongoDB is ready for development!');
        console.log('✅ You can run: npm run init-mongodb');
        return;
    }

    console.log('\n🔧 MongoDB requires authentication. Setting up development configuration...\n');

    // Create development configuration
    const configPath = createDevConfig();
    const envPath = createEnvFile();

    console.log('\n📋 Next steps:');
    console.log('1. Stop MongoDB service');
    console.log('2. Start MongoDB with development config:');

    if (process.platform === 'win32') {
        console.log(`   mongod --config "${configPath}"`);
    } else {
        console.log(`   sudo mongod --config "${configPath}"`);
    }

    console.log('3. Or copy the environment settings to your .env file');
    console.log('4. Then run: npm run init-mongodb');

    console.log('\n⚠️  WARNING: This configuration disables authentication.');
    console.log('   Only use this for development purposes!');
}

// Run if called directly
if (require.main === module) {
    setupMongoDB().catch(console.error);
}

module.exports = { setupMongoDB }; 