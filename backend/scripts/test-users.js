require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const postgresql = require("postgresql2/promise");

// Test script to verify user creation and password storage
async function testUserCreation() {
    const dbConfig = {
        host: process.env.DB_HOST || process.env.postgresql_HOST || "localhost",
        user: process.env.DB_USER || process.env.postgresql_USER || "root",
        password: process.env.DB_PASSWORD || process.env.postgresql_PASSWORD || "",
        database: process.env.DB_NAME || process.env.postgresql_DATABASE || "cedo_auth",
        charset: "utf8mb4",
        timezone: "+00:00"
    };

    let connection;

    try {
        console.log("🧪 Testing user creation and password storage...");

        connection = await postgresql.createConnection(dbConfig);
        console.log("✅ Connected to database");

        // Check existing users
        const [users] = await connection.query(`
            SELECT id, name, email, role, organization, 
                   CASE WHEN password IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status,
                   is_approved, created_at
            FROM users 
            ORDER BY created_at DESC
        `);

        console.log("\n📊 Current users in database:");
        console.table(users);

        // Check for manager users specifically
        const [managerUsers] = await connection.query(`
            SELECT id, name, email, role, 
                   CASE WHEN password IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status,
                   is_approved, created_at
            FROM users 
            WHERE role = 'manager'
            ORDER BY created_at DESC
        `);

        if (managerUsers.length > 0) {
            console.log("\n👥 Manager users found:");
            console.table(managerUsers);
        } else {
            console.log("\n⚠️ No manager users found in database");
        }

        // Test password hashing
        const bcrypt = require('bcryptjs');
        const testPassword = "TestPassword123!@#";
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        console.log("\n🔐 Password hashing test:");
        console.log(`Original password: ${testPassword}`);
        console.log(`Hashed password: ${hashedPassword.substring(0, 20)}...`);

        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        console.log(`Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

        console.log("\n✅ User creation and password storage test completed");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log("🔌 Database connection closed");
        }
    }
}

// Run the test
if (require.main === module) {
    testUserCreation();
}

module.exports = { testUserCreation }; 