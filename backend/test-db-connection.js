// Test database connection with environment variables
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cedo_auth'
};

console.log('Testing database connection with config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    passwordProvided: !!dbConfig.password
});

async function testConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Database connection successful:', rows);
        await connection.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure MySQL is running on port', dbConfig.port);
        console.log('2. Check if user', dbConfig.user, 'exists and has the right password');
        console.log('3. Verify database', dbConfig.database, 'exists');
    }
}

testConnection(); 