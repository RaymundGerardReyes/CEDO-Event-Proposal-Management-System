const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

// Fixed MongoDB connection configuration - use the working connection string with authentication
const uri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';

// Enhanced options based on common timeout solutions
const options = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms (30 seconds)
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // How long to wait for a connection to be established
    heartbeatFrequencyMS: 10000, // How often to check the connection (10 seconds)
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    retryWrites: true, // Retry writes on network errors
    retryReads: true, // Retry reads on network errors
    // Removed deprecated options: bufferMaxEntries, bufferCommands, useUnifiedTopology
};

let client;
let clientPromise;

// Development environment - use global variable to preserve connection
if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so the connection is preserved across module reloads
    // FORCE FRESH CONNECTION - clear cache if URI changed
    const currentUri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
    if (global._mongoUri && global._mongoUri !== currentUri) {
        console.log('🔄 MongoDB: URI changed, clearing cached connection');
        delete global._mongoClientPromise;
        delete global._mongoUri;
    }

    // FORCE CLEAR CACHE FOR TESTING - remove this in production
    if (global._mongoClientPromise) {
        console.log('🔄 MongoDB: Force clearing cached connection for testing');
        delete global._mongoClientPromise;
        delete global._mongoUri;
    }

    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
        global._mongoUri = uri;
        console.log('🍃 MongoDB: Creating new client connection (development)');
        console.log('🔗 MongoDB: Using URI:', uri.replace(/\/\/.*@/, '//***:***@'));
        console.log('🔧 MongoDB: Timeout settings - Server Selection: 30s, Socket: 45s, Connect: 30s');
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, create a new connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    console.log('🍃 MongoDB: Creating new client connection (production)');
    console.log('🔧 MongoDB: Timeout settings - Server Selection: 30s, Socket: 45s, Connect: 30s');
}

// Enhanced connection wrapper with retry logic and connection reuse
let cachedClient = null;
const getClientWithRetry = async (maxRetries = 3) => {
    // Return cached client if available and connected
    if (cachedClient) {
        try {
            // Test the connection is still alive
            await cachedClient.db('cedo_auth').command({ ping: 1 });
            return cachedClient;
        } catch (error) {
            console.log('🔄 MongoDB: Cached connection failed, reconnecting...');
            cachedClient = null;
        }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Only log on first attempt to reduce spam
            if (attempt === 1) {
                console.log(`🔄 MongoDB: Establishing connection...`);
            }

            const client = await clientPromise;
            cachedClient = client; // Cache the successful connection
            console.log('✅ MongoDB: Client connection established');
            return client;
        } catch (error) {
            console.error(`❌ MongoDB: Connection attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ MongoDB: Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Main connection function called by the server, designed to be resilient.
async function connectToMongo() {
    try {
        // Attempt to connect both native client and mongoose
        await getClientWithRetry();
        await connectMongoose();
    } catch (error) {
        // The error is already logged by the individual connection functions (getClientWithRetry/connectMongoose).
        // We catch it here to prevent it from crashing the server startup process.
        console.warn('❌ MongoDB connection failed. Server will continue in demo mode.');
        // By not re-throwing the error, we allow the application to proceed.
    }
}

// Also connect mongoose for backward compatibility
async function connectMongoose() {
    try {
        if (mongoose.connection.readyState === 0) {
            console.log('🔧 Mongoose: Connecting with URI:', uri.replace(/\/\/.*@/, '//***:***@'));
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 30000,
            });
            console.log('✅ Mongoose: Connected for legacy support');

            // Test the mongoose connection
            const db = mongoose.connection.db;
            await db.admin().ping();
            console.log('✅ Mongoose: Authentication test successful');
        }
        return mongoose;
    } catch (error) {
        console.error('❌ Mongoose: Connection failed:', error.message);
        throw error; // This throw is now safely caught by connectToMongo
    }
}

// Test connection function with proper authentication and retry logic
async function testConnection() {
    try {
        const client = await getClientWithRetry();
        // Test with the specific database instead of admin
        const db = client.db('cedo_db');
        await db.command({ ping: 1 });
        console.log('✅ MongoDB: Connection test successful');
        return true;
    } catch (error) {
        console.error('❌ MongoDB: Connection test failed:', error.message);
        return false;
    }
}

// Get database instance with explicit database name and retry logic
async function getDatabase(dbName = 'cedo_db') {
    try {
        const client = await getClientWithRetry();
        return client.db(dbName);
    } catch (error) {
        console.error('❌ MongoDB: Failed to get database:', error);
        throw error;
    }
}

// Enhanced debug function with authentication handling
async function debugMongoDB() {
    try {
        const client = await getClientWithRetry();
        const db = client.db('cedo_db');

        console.log('🔍 MongoDB Debug Information:');
        console.log('🔗 Connection URI (masked):', uri.replace(/\/\/.*@/, '//***:***@'));

        // Test basic database access first
        try {
            await db.command({ ping: 1 });
            console.log('✅ Database ping successful');
        } catch (pingError) {
            console.error('❌ Database ping failed:', pingError.message);
            throw pingError;
        }

        // List all collections with proper error handling
        let collections = [];
        try {
            collections = await db.listCollections().toArray();
            console.log('📊 Available collections:', collections.map(c => c.name));
        } catch (listError) {
            console.error('❌ Failed to list collections:', listError.message);
            // Try alternative approach - check if specific collections exist
            const commonCollections = ['proposals', 'users', 'events'];
            for (const collName of commonCollections) {
                try {
                    const collExists = await db.collection(collName).findOne({});
                    console.log(`📁 Collection '${collName}': ${collExists ? 'EXISTS' : 'EMPTY/NOT_FOUND'}`);
                } catch (err) {
                    console.log(`📁 Collection '${collName}': ACCESS_DENIED`);
                }
            }
        }

        // Check proposals collection specifically
        try {
            const proposalsCollection = db.collection('proposals');
            const proposalCount = await proposalsCollection.countDocuments();
            console.log(`📝 Proposals collection: ${proposalCount} documents`);

            if (proposalCount > 0) {
                // Sample a few documents to see structure
                const sampleProposals = await proposalsCollection.find({}).limit(3).toArray();
                console.log('📄 Sample proposal structures:');
                sampleProposals.forEach((proposal, index) => {
                    console.log(`  ${index + 1}. ID: ${proposal._id}, Status: ${proposal.status}, Email: ${proposal.contactEmail || 'N/A'}`);
                });

                // Check status distribution
                const statusCounts = await proposalsCollection.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]).toArray();
                console.log('📊 Status distribution:', statusCounts);
            }
        } catch (proposalError) {
            console.error('❌ Failed to access proposals collection:', proposalError.message);
        }

        return true;
    } catch (error) {
        console.error('❌ MongoDB Debug failed:', error);
        return false;
    }
}

// Backward compatibility alias for getDatabase
async function getDb(dbName = 'cedo_db') {
    return await getDatabase(dbName);
}

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        const client = await clientPromise;
        await client.close();
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        console.log('🍃 MongoDB: Connection closed gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB: Error during graceful shutdown:', error);
        process.exit(1);
    }
});

module.exports = {
    clientPromise,
    getClientWithRetry,
    getDatabase,
    testConnection,
    debugMongoDB,
    connectToMongo,
    getDb,
    connectMongoose,
}; 