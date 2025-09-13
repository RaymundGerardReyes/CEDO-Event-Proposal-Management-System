// backend/config/database.js
// Universal database connection manager supporting both MySQL and PostgreSQL

require("dotenv").config({ path: './.env' });

const isVerbose = process.env.DB_VERBOSE === 'true';

// Determine which database to use
const DB_TYPE = process.env.DB_TYPE || 'postgresql'; // 'mysql' or 'postgresql'

let dbConfig, pool, testConnection, getPoolStatus;

if (DB_TYPE === 'postgresql') {
    console.log("🐘 Using PostgreSQL database");
    const postgresConfig = require('./postgres');
    dbConfig = postgresConfig.poolConfig;
    pool = postgresConfig.pool;
    testConnection = postgresConfig.testConnection;
    getPoolStatus = postgresConfig.getPoolStatus;
} else {
    console.log("🐬 Using MySQL database");

    // MySQL configuration (merged from db.js)
    const mysql = require('mysql2/promise');

    // Determine the correct host. For local development, always use 127.0.0.1.
    // For Docker or other environments, use the environment variable.
    const dbHost = process.env.NODE_ENV === 'development'
        ? '127.0.0.1'
        : (process.env.MYSQL_HOST || 'mysql');

    const actualPassword = process.env.MYSQL_PASSWORD;

    // Only show password debugging if explicitly requested
    if (isVerbose) {
        console.log('\n🔍 MYSQL PASSWORD DEBUG:');
        console.log('========================');
        console.log(`DB_PASSWORD env var: ${process.env.DB_PASSWORD ? 'SET (length: ' + process.env.DB_PASSWORD.length + ')' : '❌ UNDEFINED'}`);
        console.log(`MYSQL_PASSWORD env var: ${process.env.MYSQL_PASSWORD ? 'SET (length: ' + process.env.MYSQL_PASSWORD.length + ')' : '❌ UNDEFINED'}`);
        console.log(`Final password being used: ${actualPassword ? 'SET (length: ' + actualPassword.length + ')' : '❌ NO PASSWORD'}`);
        console.log(`Password starts with: ${actualPassword ? actualPassword.substring(0, 3) + '***' : 'N/A'}`);
        console.log('========================\n');

        console.log("Database connection parameters:", {
            host: dbHost,
            port: process.env.MYSQL_PORT || process.env.POSTGRES_PORT,
            user: process.env.MYSQL_USER || process.env.POSTGRES_USER,
            database: process.env.MYSQL_DATABASE,
        });
    } else {
        // Only show MySQL password error when MySQL is actually being used
        if (!actualPassword) {
            console.error('❌ MySQL password not configured');
        }
    }

    // Enhanced connection pool configuration for production performance
    dbConfig = {
        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
        port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
        user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth',

        // PRODUCTION CONNECTION POOLING
        connectionLimit: process.env.NODE_ENV === 'production' ? 50 : 10, // Higher limit for production

        // PERFORMANCE OPTIMIZATIONS
        charset: 'utf8mb4',
        timezone: '+00:00',

        // Connection management
        idleTimeout: 300000, // 5 minutes

        // SSL configuration for production
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false,

        // Query optimizations
        supportBigNumbers: true,
        bigNumberStrings: true,

        // Enable compression for better network performance
        compress: true,

        // Advanced performance settings
        typeCast: function (field, next) {
            if (field.type === 'TINY' && field.length === 1) {
                return (field.string() === '1'); // Convert TINYINT(1) to boolean
            }
            return next();
        }
    };

    // Create connection pool
    pool = mysql.createPool(dbConfig);

    // Connection monitoring and health check
    pool.on('connection', function (connection) {
        console.log('✅ New MySQL connection established as id ' + connection.threadId);
    });

    pool.on('error', function (err) {
        console.error('❌ MySQL Pool Error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('🔄 Attempting to reconnect to MySQL...');
        }
    });

    // Enhanced connection testing with performance metrics
    testConnection = async function () {
        const startTime = Date.now();
        try {
            const connection = await pool.getConnection();
            const queryStartTime = Date.now();

            await connection.query('SELECT 1 as test, CONNECTION_ID() as connection_id, NOW() as server_time');

            const queryTime = Date.now() - queryStartTime;
            const totalTime = Date.now() - startTime;

            connection.release();

            console.log(`✅ MySQL connection test successful:`);
            console.log(`   - Connection time: ${totalTime}ms`);
            console.log(`   - Query time: ${queryTime}ms`);
            console.log(`   - Pool size: ${dbConfig.connectionLimit}`);

            return true;
        } catch (error) {
            console.error('❌ MySQL connection test failed:', error.message);
            return false;
        }
    };

    // Connection pool status monitoring
    getPoolStatus = function () {
        return {
            totalConnections: pool._allConnections ? pool._allConnections.length : 0,
            acquiringConnections: pool._acquiringConnections ? pool._acquiringConnections.length : 0,
            freeConnections: pool._freeConnections ? pool._freeConnections.length : 0,
            connectionLimit: dbConfig.connectionLimit,
            queueLimit: dbConfig.queueLimit || 0
        };
    };

    // Graceful shutdown handler for MySQL
    process.on('SIGINT', async () => {
        console.log('🔄 Closing MySQL connection pool...');
        try {
            await pool.end();
            console.log('✅ MySQL connection pool closed successfully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error closing MySQL pool:', error);
            process.exit(1);
        }
    });

    console.log("MySQL pool setup attempt finished.") // Log setup completion attempt
}

// Validate database credentials on startup
if (!validateDatabaseCredentials()) {
    console.warn('⚠️ Database credentials validation failed. Some features may not work properly.');
}

// Database type detection
function getDatabaseType() {
    return DB_TYPE;
}

// Universal password validation for both databases
function validateDatabaseCredentials() {
    const errors = [];

    if (DB_TYPE === 'mysql') {
        // Only validate MySQL credentials when MySQL is being used
        const mysqlPassword = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
        if (!mysqlPassword) {
            errors.push('❌ MySQL password not configured');
        }

        const mysqlUser = process.env.MYSQL_USER || process.env.DB_USER;
        if (!mysqlUser) {
            errors.push('❌ MySQL user not configured');
        }

        const mysqlDatabase = process.env.MYSQL_DATABASE || process.env.DB_NAME;
        if (!mysqlDatabase) {
            errors.push('❌ MySQL database name not configured');
        }

        if (errors.length > 0) {
            console.error('MySQL configuration errors:');
            errors.forEach(error => console.error(error));
            return false;
        }

    } else if (DB_TYPE === 'postgresql') {
        // Only validate PostgreSQL credentials when PostgreSQL is being used
        const postgresPassword = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD;
        if (!postgresPassword) {
            errors.push('❌ PostgreSQL password not configured');
        }

        const postgresUser = process.env.POSTGRES_USER || process.env.DB_USER;
        if (!postgresUser) {
            errors.push('❌ PostgreSQL user not configured');
        }

        const postgresDatabase = process.env.POSTGRES_DATABASE || process.env.DB_NAME;
        if (!postgresDatabase) {
            errors.push('❌ PostgreSQL database name not configured');
        }

        if (errors.length > 0) {
            console.error('PostgreSQL configuration errors:');
            errors.forEach(error => console.error(error));
            return false;
        }
    }

    return true;
}

// Universal query function that works with both databases
async function query(text, params = []) {
    try {
        if (DB_TYPE === 'postgresql') {
            // PostgreSQL uses parameterized queries with $1, $2, etc.
            const result = await pool.query(text, params);
            return {
                rows: result.rows,
                rowCount: result.rowCount,
                fields: result.fields
            };
        } else {
            // MySQL uses ? placeholders and execute method for prepared statements
            const [rows, fields] = await pool.execute(text, params);
            return {
                rows: rows,
                rowCount: rows.length,
                fields: fields
            };
        }
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Universal transaction function
async function transaction(callback) {
    let client;
    try {
        if (DB_TYPE === 'postgresql') {
            client = await pool.connect();
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } else {
            // MySQL uses getConnection() instead of connect()
            client = await pool.getConnection();
            await client.beginTransaction();
            const result = await callback(client);
            await client.commit();
            return result;
        }
    } catch (error) {
        if (client) {
            if (DB_TYPE === 'postgresql') {
                await client.query('ROLLBACK');
            } else {
                await client.rollback();
            }
        }
        throw error;
    } finally {
        if (client) {
            if (DB_TYPE === 'postgresql') {
                client.release();
            } else {
                client.release();
            }
        }
    }
}

// Health check function
async function healthCheck() {
    try {
        let healthQuery;
        if (DB_TYPE === 'postgresql') {
            healthQuery = 'SELECT 1 as health_check';
        } else {
            healthQuery = 'SELECT 1 as health_check, CONNECTION_ID() as connection_id, NOW() as server_time';
        }

        const result = await query(healthQuery);
        return {
            status: 'healthy',
            database: DB_TYPE,
            timestamp: new Date().toISOString(),
            poolStatus: getPoolStatus(),
            connectionInfo: DB_TYPE === 'mysql' ? {
                connectionId: result.rows[0]?.connection_id,
                serverTime: result.rows[0]?.server_time
            } : undefined
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            database: DB_TYPE,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Database migration helper
async function runMigration(migrationSQL) {
    try {
        console.log(`🔄 Running migration for ${DB_TYPE}...`);
        await query(migrationSQL);
        console.log(`✅ Migration completed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Migration failed:`, error.message);
        return false;
    }
}

// Connection monitoring
if (isVerbose) {
    console.log(`📊 Database Configuration:`);
    console.log(`   - Type: ${DB_TYPE}`);
    console.log(`   - Host: ${dbConfig.host}`);
    console.log(`   - Port: ${dbConfig.port}`);
    console.log(`   - Database: ${dbConfig.database}`);
    console.log(`   - User: ${dbConfig.user}`);

    // Database-specific configuration details
    if (DB_TYPE === 'mysql') {
        console.log(`   - Connection Limit: ${dbConfig.connectionLimit}`);
        console.log(`   - Charset: ${dbConfig.charset}`);
        console.log(`   - Timezone: ${dbConfig.timezone}`);
        console.log(`   - SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
    } else if (DB_TYPE === 'postgresql') {
        console.log(`   - Max Connections: ${dbConfig.max || 'Default'}`);
        console.log(`   - SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
    }
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    getPoolStatus,
    healthCheck,
    runMigration,
    getDatabaseType,
    validateDatabaseCredentials,
    dbConfig
};
