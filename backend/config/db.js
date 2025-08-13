// backend/config/db.js
const mysql = require('mysql2/promise');
require("dotenv").config({ path: './.env' }); // Load from current directory

const isVerbose = process.env.DB_VERBOSE === 'true';

if (isVerbose) {
  console.log("Attempting to setup MySQL connection pool...");
}

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
    port: process.env.MYSQL_PORT || '3306',
    user: process.env.MYSQL_USER || 'root',
    database: process.env.MYSQL_DATABASE,
  });
} else {
  // Just check if we have the essentials
  if (!actualPassword) {
    console.error('❌ MySQL password not configured');
  }
}

// Enhanced connection pool configuration for production performance
const poolConfig = {
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
const pool = mysql.createPool(poolConfig);

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
async function testConnection() {
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
    console.log(`   - Pool size: ${poolConfig.connectionLimit}`);

    return true;
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error.message);
    return false;
  }
}

// Connection pool status monitoring
function getPoolStatus() {
  return {
    totalConnections: pool._allConnections ? pool._allConnections.length : 0,
    acquiringConnections: pool._acquiringConnections ? pool._acquiringConnections.length : 0,
    freeConnections: pool._freeConnections ? pool._freeConnections.length : 0,
    connectionLimit: poolConfig.connectionLimit,
    queueLimit: poolConfig.queueLimit || 0
  };
}

// Graceful shutdown handler
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

module.exports = {
  pool,
  testConnection,
  getPoolStatus,
  poolConfig
};
