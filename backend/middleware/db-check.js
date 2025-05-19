// backend/middleware/db-check.js
const { pool } = require("../config/db")

/**
 * Check if a table exists in the database
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<boolean>} - True if the table exists, false otherwise
 */
async function tableExists(tableName) {
    try {
        // Get the database name from environment variables
        const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || "cedo_auth"

        // Query to check if the table exists
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = ? 
       AND table_name = ?`,
            [dbName, tableName],
        )

        return rows[0].count > 0
    } catch (error) {
        console.error(`Error checking if table ${tableName} exists:`, error.message)
        return false
    }
}

/**
 * Create the users table if it doesn't exist
 */
async function createUsersTable() {
    try {
        const exists = await tableExists("users")
        if (!exists) {
            console.log("Creating users table...")
            await pool.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255),
          role ENUM('student', 'head_admin', 'manager', 'partner', 'reviewer') NOT NULL DEFAULT 'student',
          organization VARCHAR(255),
          organization_type ENUM('internal', 'external'),
          avatar VARCHAR(255),
          google_id VARCHAR(255),
          is_approved BOOLEAN DEFAULT FALSE,
          approved_by INT,
          approved_at DATETIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `)
            console.log("Users table created successfully")
        } else {
            console.log("Users table already exists")
        }
    } catch (error) {
        console.error("Error creating users table:", error.message)
        throw error
    }
}

/**
 * Create the access_logs table if it doesn't exist
 */
async function createAccessLogsTable() {
    try {
        const exists = await tableExists("access_logs")
        if (!exists) {
            console.log("Creating access_logs table...")
            await pool.query(`
        CREATE TABLE access_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          action VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45),
          user_agent VARCHAR(255),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
            console.log("Access_logs table created successfully")
        } else {
            console.log("Access_logs table already exists")
        }
    } catch (error) {
        console.error("Error creating access_logs table:", error.message)
        throw error
    }
}

/**
 * Create the proposals table if it doesn't exist
 */
async function createProposalsTable() {
    try {
        const exists = await tableExists("proposals")
        if (!exists) {
            console.log("Creating proposals table...")
            await pool.query(`
        CREATE TABLE proposals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          location VARCHAR(255) NOT NULL,
          budget DECIMAL(10, 2) NOT NULL,
          objectives TEXT NOT NULL,
          volunteers_needed INT NOT NULL,
          submitter_id INT NOT NULL,
          organization_type VARCHAR(100) NOT NULL,
          contact_person VARCHAR(255) NOT NULL,
          contact_email VARCHAR(255) NOT NULL,
          contact_phone VARCHAR(20) NOT NULL,
          status ENUM('draft', 'pending', 'under_review', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
            console.log("Proposals table created successfully")
        } else {
            console.log("Proposals table already exists")
        }
    } catch (error) {
        console.error("Error creating proposals table:", error.message)
        throw error
    }
}

/**
 * Create the reviews table if it doesn't exist
 */
async function createReviewsTable() {
    try {
        const exists = await tableExists("reviews")
        if (!exists) {
            console.log("Creating reviews table...")
            await pool.query(`
        CREATE TABLE reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          proposal_id INT NOT NULL,
          reviewer_id INT NOT NULL,
          comments TEXT NOT NULL,
          rating INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
            console.log("Reviews table created successfully")
        } else {
            console.log("Reviews table already exists")
        }
    } catch (error) {
        console.error("Error creating reviews table:", error.message)
        throw error
    }
}

/**
 * Ensure all required tables exist
 */
async function ensureTablesExist() {
    try {
        // Create tables in order of dependencies
        await createUsersTable()
        await createAccessLogsTable()
        await createProposalsTable()
        await createReviewsTable()

        // Add a default admin user if no users exist
        const [users] = await pool.query("SELECT COUNT(*) as count FROM users")
        if (users[0].count === 0) {
            console.log("Creating default admin user...")
            const bcrypt = require("bcryptjs")
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash("admin123", salt)

            await pool.query("INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)", [
                "Admin User",
                "admin@example.com",
                hashedPassword,
                "head_admin",
                true,
            ])
            console.log("Default admin user created successfully")
        }

        return true
    } catch (error) {
        console.error("Error ensuring tables exist:", error.message)
        throw error
    }
}

module.exports = {
    tableExists,
    createUsersTable,
    createAccessLogsTable,
    createProposalsTable,
    createReviewsTable,
    ensureTablesExist,
}
