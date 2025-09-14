#!/usr/bin/env node

/**
 * CEDO PostgreSQL Database Creator
 * Creates the database before running the initialization script
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { Pool } = require('pg');

console.log("🛠️  CEDO PostgreSQL Database Creator starting...");

// Database configuration for connecting to PostgreSQL server (without specific database)
const serverConfig = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "",
    database: 'postgres', // Connect to default 'postgres' database to create our database
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const targetDatabase = process.env.DB_NAME || process.env.POSTGRES_DATABASE || "cedo_auth";

console.log(`🔗 Connecting to PostgreSQL server at ${serverConfig.host}:${serverConfig.port}`);
console.log(`👤 Using user: ${serverConfig.user}`);
console.log(`🎯 Target database: ${targetDatabase}`);

async function createDatabase() {
    let pool;

    try {
        // Connect to PostgreSQL server (using default 'postgres' database)
        console.log("\n🔌 Connecting to PostgreSQL server...");
        pool = new Pool(serverConfig);

        const client = await pool.connect();
        console.log("✅ Connected to PostgreSQL server");

        // Check if database already exists
        console.log(`\n🔍 Checking if database '${targetDatabase}' exists...`);
        const dbExistsResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [targetDatabase]
        );

        if (dbExistsResult.rows.length > 0) {
            console.log(`ℹ️  Database '${targetDatabase}' already exists`);
            console.log("✅ Database is ready for initialization");
        } else {
            console.log(`📝 Creating database '${targetDatabase}'...`);

            // Create the database
            await client.query(`CREATE DATABASE "${targetDatabase}"`);
            console.log(`✅ Database '${targetDatabase}' created successfully`);
        }

        client.release();

        console.log("\n🎉 Database creation completed successfully!");
        console.log(`📊 Database '${targetDatabase}' is now ready for initialization`);
        console.log("\n🚀 Next steps:");
        console.log("1. Run: npm run init-postgres");
        console.log("2. Or run: node backend/scripts/init-postgres.js");

    } catch (error) {
        console.error("\n❌ Database creation failed:", error.message);
        console.error("🔧 Error details:", error);

        // Troubleshooting guidance
        console.log("\n🔧 Troubleshooting tips:");
        console.log("1. Verify PostgreSQL server is running");
        console.log("2. Check database credentials in environment variables");
        console.log("3. Ensure PostgreSQL user has CREATEDB privilege");
        console.log("4. Check network connectivity to PostgreSQL server");
        console.log("5. Verify PostgreSQL version compatibility (12+ recommended)");

        if (error.code === 'ECONNREFUSED') {
            console.log("\n🚨 Connection refused - PostgreSQL server is not running");
            console.log("💡 Start PostgreSQL server first:");
            console.log("   - Windows: Start PostgreSQL service");
            console.log("   - Linux/Mac: sudo systemctl start postgresql");
        }

        if (error.code === '28P01') {
            console.log("\n🚨 Authentication failed - Check username/password");
            console.log("💡 Verify your PostgreSQL credentials in .env file");
        }

        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
            console.log("\n🔌 PostgreSQL connection closed");
        }
    }
}

// Execute if called directly
if (require.main === module) {
    createDatabase();
}

module.exports = { createDatabase };
