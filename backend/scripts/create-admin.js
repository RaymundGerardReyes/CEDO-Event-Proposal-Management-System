#!/usr/bin/env node

/**
 * Admin User Creation Script
 * Creates admin users in the CEDO system
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.MYSQL_HOST || 'mysql',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'cedo_auth'
};

async function createAdminUser() {
    let connection;

    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL database');

        // Admin user data
        const adminUser = {
            email: 'raymundgerardrestaca@gmail.com',
            name: 'Raymund Gerard Estaca',
            google_id: '106723330217510040853', // From your logs
            role: 'head_admin', // Match the enum values from the schema
            is_approved: true
        };

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id, email FROM users WHERE email = ? OR google_id = ?',
            [adminUser.email, adminUser.google_id]
        );

        if (existingUsers.length > 0) {
            console.log(`⚠️  User ${adminUser.email} already exists in the system`);
            console.log('✅ User details:', existingUsers[0]);
            return;
        }

        // Create the admin user
        const [result] = await connection.execute(`
            INSERT INTO users (
                email, 
                name, 
                google_id, 
                role, 
                is_approved, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            adminUser.email,
            adminUser.name,
            adminUser.google_id,
            adminUser.role,
            adminUser.is_approved
        ]);

        console.log('🎉 Admin user created successfully!');
        console.log(`📧 Email: ${adminUser.email}`);
        console.log(`👤 Name: ${adminUser.name}`);
        console.log(`🔑 Role: ${adminUser.role}`);
        console.log(`🆔 User ID: ${result.insertId}`);
        console.log('');
        console.log('✅ You can now sign in with your Google account!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('🔧 Troubleshooting:');
            console.log('1. Make sure MySQL is running (Docker: docker compose up mysql -d)');
            console.log('2. Check your .env file database credentials');
            console.log('3. Ensure the database "cedo_auth" exists');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
createAdminUser().catch(console.error); 