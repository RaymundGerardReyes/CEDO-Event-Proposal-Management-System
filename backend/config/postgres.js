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
const poolConfig = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || process.env.POSTGRES_HOSTNAME || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    user: process.env.DB_USER || process.env.POSTGRES_USER || process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || process.env.POSTGRES_DB || 'cedo_auth',

    // PRODUCTION CONNECTION POOLING
    max: process.env.NODE_ENV === 'production' ? 50 : 10, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established

    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,

    // Query optimizations
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
    application_name: 'cedo-backend',

    // Connection management
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
};

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
