// backend/config/postgres.js
const { Pool } = require('pg');
require("dotenv").config({ path: './.env' }); // Load from current directory

const isVerbose = process.env.DB_VERBOSE === 'true';

if (isVerbose) {
    console.log("Attempting to setup PostgreSQL connection pool...");
}

// Determine the correct host. For local development, always use 127.0.0.1.
// For Docker or other environments, use the environment variable.
const dbHost = process.env.NODE_ENV === 'development'
    ? '127.0.0.1'
    : (process.env.POSTGRES_HOST || 'postgres');

const actualPassword = process.env.POSTGRES_PASSWORD;

// Only show password debugging if explicitly requested
if (isVerbose) {
    console.log('\n🔍 POSTGRESQL PASSWORD DEBUG:');
    console.log('=============================');
    console.log(`DB_PASSWORD env var: ${process.env.DB_PASSWORD ? 'SET (length: ' + process.env.DB_PASSWORD.length + ')' : '❌ UNDEFINED'}`);
    console.log(`POSTGRES_PASSWORD env var: ${process.env.POSTGRES_PASSWORD ? 'SET (length: ' + process.env.POSTGRES_PASSWORD.length + ')' : '❌ UNDEFINED'}`);
    console.log(`Final password being used: ${actualPassword ? 'SET (length: ' + actualPassword.length + ')' : '❌ NO PASSWORD'}`);
    console.log(`Password starts with: ${actualPassword ? actualPassword.substring(0, 3) + '***' : 'N/A'}`);
    console.log('=============================\n');

    console.log("Database connection parameters:", {
        host: dbHost,
        port: process.env.POSTGRES_PORT || '5432',
        user: process.env.POSTGRES_USER || 'postgres',
        database: process.env.POSTGRES_DATABASE || 'cedo_auth',
    });
} else {
    // Just check if we have the essentials
    if (!actualPassword) {
        console.error('❌ PostgreSQL password not configured');
    }
}

// Enhanced connection pool configuration for production performance
// Prefer DATABASE_URL first, then POSTGRES_* variables, then DB_* variables
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_CONNECTION_URL || process.env.POSTGRES_URL;

// Debug: Log the final connection configuration
console.log('\n🔍 PostgreSQL Connection Configuration:');
if (dbUrl) {
    console.log(`Using DATABASE_URL: ${dbUrl.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`SSL from URL: ${/sslmode=require/i.test(dbUrl) ? 'required' : 'not required'}`);
} else {
    console.log(`Host: ${process.env.POSTGRES_HOST || process.env.POSTGRES_HOSTNAME || process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.POSTGRES_PORT || process.env.DB_PORT || 5432}`);
    console.log(`User: ${process.env.POSTGRES_USER || process.env.POSTGRES_USERNAME || process.env.DB_USER || 'postgres'}`);
    console.log(`Database: ${process.env.POSTGRES_DATABASE || process.env.POSTGRES_DB || process.env.DB_NAME || 'cedo_auth'}`);
    console.log(`Password: ${process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD ? 'SET' : 'NOT_SET'}`);
    console.log(`SSL: ${(process.env.POSTGRES_SSL === 'true' || process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production') ? 'enabled' : 'disabled'}`);
}
console.log(`NODE_ENV: ${process.env.NODE_ENV}\n`);

let poolConfig;

if (dbUrl) {
    // Use full connection string if provided (preferred for Render)
    console.log('🔗 Using DATABASE_URL for PostgreSQL connection');

    // For Render PostgreSQL, ensure SSL is enabled
    let connectionString = dbUrl;
    if (!connectionString.includes('sslmode=')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }

    poolConfig = {
        connectionString: connectionString,
        // Enable SSL for Render PostgreSQL (required for external connections)
        ssl: {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined // Disable hostname verification for self-signed certs
        },

        // PRODUCTION CONNECTION POOLING
        max: process.env.NODE_ENV === 'production' ? 50 : 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased timeout for external connections

        // Query optimizations
        statement_timeout: 30000,
        query_timeout: 30000,
        application_name: 'cedo-backend',

        // Connection management
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    };
} else {
    // Fallback to individual variables - prefer POSTGRES_* over DB_*
    console.log('🔗 Using individual environment variables for PostgreSQL connection');

    // URL encode password if it contains special characters
    const password = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '';
    const encodedPassword = encodeURIComponent(password);

    poolConfig = {
        host: process.env.POSTGRES_HOST || process.env.POSTGRES_HOSTNAME || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432, 10),
        user: process.env.POSTGRES_USER || process.env.POSTGRES_USERNAME || process.env.DB_USER || 'postgres',
        password: password, // Use original password, not encoded
        database: process.env.POSTGRES_DATABASE || process.env.POSTGRES_DB || process.env.DB_NAME || 'cedo_auth',

        // PRODUCTION CONNECTION POOLING
        max: process.env.NODE_ENV === 'production' ? 50 : 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased timeout for external connections

        // SSL configuration - enable for Render PostgreSQL
        ssl: (process.env.POSTGRES_SSL === 'true' || process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production') ? {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined // Disable hostname verification for self-signed certs
        } : false,

        // Query optimizations
        statement_timeout: 30000,
        query_timeout: 30000,
        application_name: 'cedo-backend',

        // Connection management
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    };
}

// Create connection pool
const pool = new Pool(poolConfig);

// Connection monitoring and health check
pool.on('connect', (client) => {
    console.log('✅ New PostgreSQL connection established');
    if (isVerbose) {
        console.log(`   - Process ID: ${client.processID}`);
        console.log(`   - Database: ${client.database}`);
    }
});

pool.on('error', (err, client) => {
    console.error('❌ PostgreSQL Pool Error:', err);
    if (err.code === 'ECONNREFUSED') {
        console.log('🔄 Attempting to reconnect to PostgreSQL...');
    }
});

// Enhanced connection testing with performance metrics
async function testConnection() {
    const startTime = Date.now();
    try {
        const client = await pool.connect();
        const queryStartTime = Date.now();

        const result = await client.query('SELECT 1 as test, pg_backend_pid() as process_id, NOW() as server_time');

        const queryTime = Date.now() - queryStartTime;
        const totalTime = Date.now() - startTime;

        client.release();

        console.log(`✅ PostgreSQL connection test successful:`);
        console.log(`   - Connection time: ${totalTime}ms`);
        console.log(`   - Query time: ${queryTime}ms`);
        console.log(`   - Process ID: ${result.rows[0].process_id}`);
        console.log(`   - Server time: ${result.rows[0].server_time}`);
        console.log(`   - Pool size: ${poolConfig.max}`);

        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection test failed:', error.message);
        return false;
    }
}

// Connection pool status monitoring
function getPoolStatus() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        maxConnections: poolConfig.max,
        minConnections: poolConfig.min
    };
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
    console.log('🔄 Closing PostgreSQL connection pool...');
    try {
        await pool.end();
        console.log('✅ PostgreSQL connection pool closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error closing PostgreSQL pool:', error);
        process.exit(1);
    }
});

console.log("PostgreSQL pool setup attempt finished.") // Log setup completion attempt

module.exports = {
    pool,
    testConnection,
    getPoolStatus,
    poolConfig
};
