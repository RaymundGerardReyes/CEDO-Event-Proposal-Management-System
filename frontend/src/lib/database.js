import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'Raymund@Estaca01',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

let pool;

// Create connection pool
export function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
        console.log('MySQL connection pool created for frontend API');
    }
    return pool;
}

// Get user by ID from database
export async function getUserFromDatabase(userId) {
    try {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT 
        id, 
        name, 
        email, 
        role, 
        organization, 
        organization_type,
        avatar, 
        is_approved, 
        password_reset_required,
        last_login, 
        created_at, 
        updated_at 
      FROM users 
      WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Update user field in database
export async function updateUserField(userId, field, value) {
    try {
        const pool = getPool();

        // Validate allowed fields
        const allowedFields = ['organization', 'password'];
        if (!allowedFields.includes(field)) {
            throw new Error(`Field '${field}' is not allowed to be updated`);
        }

        // For password updates, hash the password
        let processedValue = value;
        if (field === 'password') {
            const bcrypt = require('bcryptjs');
            const saltRounds = 10;
            processedValue = await bcrypt.hash(value, saltRounds);
        }

        const [result] = await pool.execute(
            `UPDATE users SET ${field} = ?, updated_at = NOW() WHERE id = ?`,
            [processedValue, userId]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Database update error:', error);
        throw error;
    }
}

// Test database connection
export async function testConnection() {
    try {
        const pool = getPool();
        await pool.execute('SELECT 1');
        console.log('Database connection test successful');
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
} 