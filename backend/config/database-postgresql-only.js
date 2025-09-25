// backend/config/database-postgresql-only.js
// PostgreSQL-only database connection manager

require("dotenv").config({ path: './.env' });

const isVerbose = process.env.DB_VERBOSE === 'true';

console.log("🐘 Using PostgreSQL database exclusively");

const postgresConfig = require('./postgres');
const dbConfig = postgresConfig.poolConfig;
const pool = postgresConfig.pool;
const testConnection = postgresConfig.testConnection;
const getPoolStatus = postgresConfig.getPoolStatus;

// Universal query function for PostgreSQL
const query = async (sql, params = []) => {
    try {
        if (isVerbose) {
            console.log('🔍 Executing query:', sql);
            console.log('🔍 Parameters:', params);
        }

        const result = await pool.query(sql, params);

        if (isVerbose) {
            console.log('✅ Query result:', result.rows ? result.rows.length : 'no rows', 'rows returned');
        }

        return result;
    } catch (error) {
        console.error('❌ Database query error:', error.message);
        console.error('📋 Query:', sql);
        console.error('📋 Parameters:', params);
        throw error;
    }
};

// Get database type
const getDatabaseType = () => 'postgresql';

// Test database connection
const testDatabaseConnection = async () => {
    try {
        const result = await query('SELECT NOW() as current_time, version() as version');
        console.log('✅ PostgreSQL connection successful');
        console.log('🕐 Current time:', result.rows[0].current_time);
        console.log('📊 PostgreSQL version:', result.rows[0].version.split(' ')[0]);
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
};

// Get connection pool status
const getConnectionStatus = () => {
    const status = getPoolStatus();
    return {
        type: 'postgresql',
        ...status
    };
};

// Graceful shutdown
const closeConnections = async () => {
    try {
        console.log('🔄 Closing PostgreSQL connection pool...');
        await pool.end();
        console.log('✅ PostgreSQL connection pool closed successfully');
    } catch (error) {
        console.error('❌ Error closing PostgreSQL connection pool:', error.message);
    }
};

module.exports = {
    pool,
    query,
    getDatabaseType,
    testConnection: testDatabaseConnection,
    getPoolStatus: getConnectionStatus,
    closeConnections,
    dbConfig
};

