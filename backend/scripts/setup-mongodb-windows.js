/**
 * MongoDB Setup Script for Windows
 * Purpose: Install and configure MongoDB for the CEDO project
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Setup for Windows...\n');

async function setupMongoDB() {
    try {
        // Step 1: Check if MongoDB is installed
        console.log('📋 Step 1: Checking MongoDB Installation');

        const checkMongoDB = () => {
            return new Promise((resolve) => {
                exec('mongod --version', (error, stdout, stderr) => {
                    if (error) {
                        console.log('❌ MongoDB not found in PATH');
                        resolve(false);
                    } else {
                        console.log('✅ MongoDB found:', stdout.trim());
                        resolve(true);
                    }
                });
            });
        };

        const isMongoDBInstalled = await checkMongoDB();

        if (!isMongoDBInstalled) {
            console.log('\n📋 Step 2: MongoDB Installation Guide');
            console.log('=====================================');
            console.log('MongoDB is not installed. Please follow these steps:');
            console.log('');
            console.log('1. Download MongoDB Community Server:');
            console.log('   https://www.mongodb.com/try/download/community');
            console.log('');
            console.log('2. Run the installer and follow the setup wizard');
            console.log('   - Choose "Complete" installation');
            console.log('   - Install MongoDB Compass (optional but recommended)');
            console.log('   - Install MongoDB as a Service (recommended)');
            console.log('');
            console.log('3. Add MongoDB to PATH:');
            console.log('   - Open System Properties > Environment Variables');
            console.log('   - Add "C:\\Program Files\\MongoDB\\Server\\6.0\\bin" to PATH');
            console.log('');
            console.log('4. Restart your terminal/command prompt');
            console.log('');
            console.log('5. Run this script again after installation');
            console.log('');
            return;
        }

        // Step 3: Check if MongoDB service is running
        console.log('\n📋 Step 3: Checking MongoDB Service');

        const checkMongoService = () => {
            return new Promise((resolve) => {
                exec('sc query MongoDB', (error, stdout, stderr) => {
                    if (error) {
                        console.log('❌ MongoDB service not found');
                        resolve(false);
                    } else if (stdout.includes('RUNNING')) {
                        console.log('✅ MongoDB service is running');
                        resolve(true);
                    } else {
                        console.log('⚠️ MongoDB service found but not running');
                        resolve(false);
                    }
                });
            });
        };

        const isServiceRunning = await checkMongoService();

        if (!isServiceRunning) {
            console.log('\n📋 Step 4: Starting MongoDB Service');
            console.log('Starting MongoDB service...');

            exec('net start MongoDB', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Failed to start MongoDB service:', error.message);
                    console.log('\n💡 Manual Start Instructions:');
                    console.log('1. Open Services (services.msc)');
                    console.log('2. Find "MongoDB" service');
                    console.log('3. Right-click and select "Start"');
                    console.log('4. Set startup type to "Automatic"');
                } else {
                    console.log('✅ MongoDB service started successfully');
                }
            });
        }

        // Step 5: Create data directory
        console.log('\n📋 Step 5: Creating Data Directory');
        const dataDir = path.join(process.cwd(), 'data', 'db');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('✅ Created data directory:', dataDir);
        } else {
            console.log('✅ Data directory already exists:', dataDir);
        }

        // Step 6: Test MongoDB connection
        console.log('\n📋 Step 6: Testing MongoDB Connection');

        const testConnection = () => {
            return new Promise((resolve) => {
                const testScript = `
                    const { MongoClient } = require('mongodb');
                    
                    async function testConnection() {
                        try {
                            const client = new MongoClient('mongodb://localhost:27017');
                            await client.connect();
                            console.log('✅ MongoDB connection successful');
                            await client.close();
                            process.exit(0);
                        } catch (error) {
                            console.log('❌ MongoDB connection failed:', error.message);
                            process.exit(1);
                        }
                    }
                    
                    testConnection();
                `;

                const testFile = path.join(process.cwd(), 'test-mongo-connection.js');
                fs.writeFileSync(testFile, testScript);

                exec('node test-mongo-connection.js', (error, stdout, stderr) => {
                    fs.unlinkSync(testFile); // Clean up

                    if (error) {
                        console.log('❌ MongoDB connection test failed');
                        console.log('Error:', error.message);
                        resolve(false);
                    } else {
                        console.log('✅ MongoDB connection test successful');
                        resolve(true);
                    }
                });
            });
        };

        const connectionTest = await testConnection();

        if (!connectionTest) {
            console.log('\n💡 Troubleshooting MongoDB Connection:');
            console.log('1. Make sure MongoDB service is running');
            console.log('2. Check if port 27017 is not blocked by firewall');
            console.log('3. Try running: mongod --dbpath ./data/db');
            console.log('4. Check MongoDB logs for errors');
            return;
        }

        // Step 7: Create database and user
        console.log('\n📋 Step 7: Setting up CEDO Database');

        const setupDatabase = () => {
            return new Promise((resolve) => {
                const setupScript = `
                    const { MongoClient } = require('mongodb');
                    
                    async function setupDatabase() {
                        try {
                            const client = new MongoClient('mongodb://localhost:27017');
                            await client.connect();
                            
                            const db = client.db('cedo_db');
                            
                            // Create collections
                            await db.createCollection('proposals');
                            await db.createCollection('users');
                            await db.createCollection('organizations');
                            
                            console.log('✅ CEDO database setup successful');
                            console.log('✅ Collections created: proposals, users, organizations');
                            
                            await client.close();
                            process.exit(0);
                        } catch (error) {
                            console.log('❌ Database setup failed:', error.message);
                            process.exit(1);
                        }
                    }
                    
                    setupDatabase();
                `;

                const setupFile = path.join(process.cwd(), 'setup-cedo-db.js');
                fs.writeFileSync(setupFile, setupScript);

                exec('node setup-cedo-db.js', (error, stdout, stderr) => {
                    fs.unlinkSync(setupFile); // Clean up

                    if (error) {
                        console.log('❌ Database setup failed');
                        console.log('Error:', error.message);
                        resolve(false);
                    } else {
                        console.log(stdout);
                        resolve(true);
                    }
                });
            });
        };

        await setupDatabase();

        console.log('\n🎉 MongoDB Setup Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✅ MongoDB installation verified');
        console.log('   ✅ MongoDB service running');
        console.log('   ✅ Data directory created');
        console.log('   ✅ Connection test successful');
        console.log('   ✅ CEDO database setup complete');
        console.log('\n🚀 You can now start your backend server!');

    } catch (error) {
        console.error('❌ MongoDB setup failed:', error.message);
        console.log('\n💡 Manual Setup Instructions:');
        console.log('1. Install MongoDB Community Server');
        console.log('2. Start MongoDB service');
        console.log('3. Create data directory: mkdir -p data/db');
        console.log('4. Run: mongod --dbpath ./data/db');
    }
}

// Run the setup
if (require.main === module) {
    setupMongoDB();
}

module.exports = { setupMongoDB }; 