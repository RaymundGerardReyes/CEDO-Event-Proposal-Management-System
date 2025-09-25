// backend/config/database.js
// PostgreSQL-only database connection manager

require("dotenv").config({ path: './.env' });

const isVerbose = process.env.DB_VERBOSE === 'true';

console.log("🐘 Using PostgreSQL database exclusively");
const postgresConfig = require('./postgres');
const dbConfig = postgresConfig.poolConfig;
const pool = postgresConfig.pool;
const testConnection = postgresConfig.testConnection;
const getPoolStatus = postgresConfig.getPoolStatus;

// Query function for PostgreSQL
const query = async (sql, params = []) => {
    const startTime = Date.now();
    try {
        const result = await pool.query(sql, params);
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (isVerbose) {
            console.log(`🔍 Query executed in ${duration}ms:`, sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
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
const getDatabaseType = () => 'PostgreSQL';

// Export PostgreSQL-only functions
module.exports = {
    pool,
    query,
    testConnection,
    getPoolStatus,
    getDatabaseType,
    dbConfig
};