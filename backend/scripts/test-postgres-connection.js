#!/usr/bin/env node

// Test PostgreSQL connection and basic functionality
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { Pool } = require('pg');

console.log("🧪 Testing PostgreSQL Connection...");

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "",
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || "cedo_auth",
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

console.log("📋 Connection Configuration:");
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '***SET***' : '❌ NOT SET'}`);

async function testConnection() {
    let pool;

    try {
        // Create connection pool
        console.log("\n🔌 Creating connection pool...");
        pool = new Pool(dbConfig);

        // Test basic connection
        console.log("🔍 Testing basic connection...");
        const client = await pool.connect();
        console.log("✅ Connection established successfully");

        // Test basic query
        console.log("🔍 Testing basic query...");
        const result = await client.query('SELECT version() as version, NOW() as current_time');
        console.log("✅ Query executed successfully");
        console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]}`);
        console.log(`   Server Time: ${result.rows[0].current_time}`);

        client.release();

        // Test database existence
        console.log("🔍 Testing database access...");
        const dbResult = await pool.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `);

        console.log("✅ Database access confirmed");
        console.log(`   Database: ${dbResult.rows[0].database_name}`);
        console.log(`   User: ${dbResult.rows[0].current_user}`);
        console.log(`   Server IP: ${dbResult.rows[0].server_ip || 'localhost'}`);
        console.log(`   Server Port: ${dbResult.rows[0].server_port || dbConfig.port}`);

        // Test table existence
        console.log("🔍 Checking for existing tables...");
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        if (tablesResult.rows.length > 0) {
            console.log("✅ Found existing tables:");
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        } else {
            console.log("ℹ️  No tables found - database is empty");
        }

        // Test extensions
        console.log("🔍 Checking for required extensions...");
        const extensionsResult = await pool.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);

        if (extensionsResult.rows.length > 0) {
            console.log("✅ Found extensions:");
            extensionsResult.rows.forEach(row => {
                console.log(`   - ${row.extname}`);
            });
        } else {
            console.log("⚠️  No required extensions found");
        }

        // Test UUID generation
        console.log("🔍 Testing UUID generation...");
        try {
            const uuidResult = await pool.query('SELECT uuid_generate_v4() as uuid');
            console.log("✅ UUID generation works");
            console.log(`   Sample UUID: ${uuidResult.rows[0].uuid}`);
        } catch (error) {
            console.log("⚠️  UUID generation not available (extension may not be installed)");
        }

        // Performance test
        console.log("🔍 Running performance test...");
        const startTime = Date.now();
        const perfResult = await pool.query('SELECT COUNT(*) as count FROM generate_series(1, 1000)');
        const endTime = Date.now();
        console.log(`✅ Performance test completed in ${endTime - startTime}ms`);
        console.log(`   Generated ${perfResult.rows[0].count} rows`);

        console.log("\n🎉 All tests passed! PostgreSQL connection is working correctly.");

    } catch (error) {
        console.error("\n❌ Connection test failed:");
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);

        if (error.code === 'ECONNREFUSED') {
            console.log("\n🔧 Troubleshooting tips:");
            console.log("   1. Make sure PostgreSQL server is running");
            console.log("   2. Check if the port (5432) is correct");
            console.log("   3. Verify the host address");
        } else if (error.code === '28P01') {
            console.log("\n🔧 Troubleshooting tips:");
            console.log("   1. Check your username and password");
            console.log("   2. Verify the user has access to the database");
        } else if (error.code === '3D000') {
            console.log("\n🔧 Troubleshooting tips:");
            console.log("   1. Make sure the database 'cedo_auth' exists");
            console.log("   2. Create the database: CREATE DATABASE cedo_auth;");
        }

        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
            console.log("\n🔌 Connection pool closed");
        }
    }
}

// Run the test
testConnection();
