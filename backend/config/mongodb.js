/**
 * MongoDB Configuration
 * Purpose: Robust MongoDB connection management with graceful degradation
 * Key approaches: Connection pooling, retry logic, fallback URIs, health monitoring
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env' });

const isVerbose = process.env.MONGODB_VERBOSE === 'true';

if (isVerbose) {
    console.log('🍃 MongoDB: Initializing configuration...');
}

// Enhanced MongoDB configuration with fallback options
const mongoConfig = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cedo_db',
    options: {
        // Connection timeout settings
        serverSelectionTimeoutMS: 5000, // 5 seconds
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds

        // Connection pool settings
        maxPoolSize: 10,
        minPoolSize: 1,

        // Retry settings
        retryWrites: true,
        retryReads: true,

        // Write concern
        w: 'majority',
        j: true,

        // Read preference
        readPreference: 'primary',

        // Compression
        compressors: ['zlib'],

        // SSL settings (if needed)
        ssl: process.env.NODE_ENV === 'production',

        // Authentication (if needed)
        authSource: process.env.MONGO_AUTH_SOURCE || 'admin'

        // Removed loggerLevel option as it's not supported in newer MongoDB driver versions
    }
};

if (isVerbose) {
    console.log('🔍 MongoDB Configuration:');
    console.log('   URI:', mongoConfig.uri.replace(/\/\/.*@/, '//***:***@')); // Mask credentials
    console.log('   Environment:', process.env.NODE_ENV);
    console.log('   Timeout (server selection):', mongoConfig.options.serverSelectionTimeoutMS + 'ms');
    console.log('   Timeout (connect):', mongoConfig.options.connectTimeoutMS + 'ms');
}

let mongoClient = null;
let isConnected = false;
let connectionRetries = 0;
const maxRetries = 3;

/**
 * Initialize MongoDB connection with retry logic
 */
async function initializeMongoDB() {
    console.log('🍃 MongoDB: Creating new client connection (' + process.env.NODE_ENV + ')');
    console.log('🔗 MongoDB: Using URI:', mongoConfig.uri.replace(/\/\/.*@/, '//***:***@'));
    console.log('🔧 MongoDB: Timeout settings - Server Selection:', mongoConfig.options.serverSelectionTimeoutMS + 'ms, Socket:', mongoConfig.options.socketTimeoutMS + 'ms, Connect:', mongoConfig.options.connectTimeoutMS + 'ms');

    try {
        mongoClient = new MongoClient(mongoConfig.uri, mongoConfig.options);

        // Test connection with timeout
        const connectionPromise = mongoClient.connect();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), mongoConfig.options.connectTimeoutMS);
        });

        await Promise.race([connectionPromise, timeoutPromise]);

        // Test the connection
        await mongoClient.db().admin().ping();

        isConnected = true;
        connectionRetries = 0;

        console.log('✅ MongoDB: Connection established successfully');

        // Set up connection event handlers
        mongoClient.on('close', () => {
            console.log('⚠️ MongoDB: Connection closed');
            isConnected = false;
        });

        mongoClient.on('error', (error) => {
            console.error('❌ MongoDB: Connection error:', error.message);
            isConnected = false;
        });

        return mongoClient;

    } catch (error) {
        connectionRetries++;
        console.error('❌ MongoDB: Connection failed (attempt ' + connectionRetries + '/' + maxRetries + '):', error.message);

        if (connectionRetries < maxRetries) {
            console.log('🔄 MongoDB: Retrying connection in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return initializeMongoDB();
        } else {
            console.log('⚠️ MongoDB: Max retries reached. Continuing without MongoDB...');
            console.log('💡 MongoDB will be disabled. Some features may not work properly.');
            return null;
        }
    }
}

/**
 * Get MongoDB database instance
 */
async function getDb() {
    if (!mongoClient || !isConnected) {
        console.log('⚠️ MongoDB: Client not connected, attempting to initialize...');
        await initializeMongoDB();
    }

    if (mongoClient && isConnected) {
        return mongoClient.db();
    } else {
        throw new Error('MongoDB not available');
    }
}

/**
 * Get MongoDB client instance
 */
function getClient() {
    return mongoClient;
}

/**
 * Check if MongoDB is connected
 */
function isMongoConnected() {
    return isConnected && mongoClient;
}

/**
 * Gracefully close MongoDB connection
 */
async function closeMongoDB() {
    if (mongoClient) {
        try {
            await mongoClient.close();
            console.log('✅ MongoDB: Connection closed gracefully');
        } catch (error) {
            console.error('❌ MongoDB: Error closing connection:', error.message);
        }
    }
}

/**
 * Health check for MongoDB
 */
async function mongoHealthCheck() {
    try {
        if (!isConnected || !mongoClient) {
            return { status: 'disconnected', message: 'MongoDB not connected' };
        }

        await mongoClient.db().admin().ping();
        return { status: 'healthy', message: 'MongoDB connection is healthy' };

    } catch (error) {
        return { status: 'unhealthy', message: 'MongoDB health check failed: ' + error.message };
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Closing MongoDB connection...');
    await closeMongoDB();
});

process.on('SIGTERM', async () => {
    console.log('🔄 Closing MongoDB connection...');
    await closeMongoDB();
});

module.exports = {
    initializeMongoDB,
    getDb,
    getClient,
    isMongoConnected,
    closeMongoDB,
    mongoHealthCheck,
    mongoConfig
}; 