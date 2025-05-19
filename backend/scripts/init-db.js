require("dotenv").config() // Load environment variables from .env
const mysql = require("mysql2/promise") // Import the promise-based version of mysql2
const bcrypt = require("bcryptjs") // For hashing dummy user passwords
const fs = require("fs") // For checking if .env file exists
const path = require("path") // For resolving file paths

// At the beginning of the file, add:
console.log("Database initialization script starting...")
console.log("Environment variables loaded:", {
  MYSQL_HOST: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || process.env.DB_NAME || "cedo_auth",
  MYSQL_USER: process.env.MYSQL_USER || process.env.DB_USER || "root",
  // Don't log passwords
})

// Database configuration object using environment variables
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost", // Try both env var names
  user: process.env.MYSQL_USER || process.env.DB_USER || "root", // Try both env var names
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "", // Try both env var names
  waitForConnections: true, // Wait for connections when the limit is reached
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0, // Unlimited queueing when connectionLimit is reached
}

// Main asynchronous function to handle database initialization steps
async function main() {
  let connection // Variable to hold the database connection

  try {
    console.log("Initializing database...")

    // Check if .env file exists and warn if not (useful for reminding users to set it up)
    const envPath = path.join(__dirname, "..", ".env")
    if (!fs.existsSync(envPath)) {
      console.warn(
        "\x1b[33m%s\x1b[0m",
        "Warning: .env file not found. Using environment variables or default database credentials.",
      )
    }

    // --- Connect to MySQL Server (without specifying database initially) ---
    // This allows us to create the database if it doesn't exist
    const host = process.env.MYSQL_HOST || process.env.DB_HOST || "localhost"
    const user = process.env.MYSQL_USER || process.env.DB_USER || "root"
    const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || ""

    console.log(`Connecting to MySQL at ${host} with user ${user}`)
    connection = await mysql.createConnection({
      host: host,
      user: user,
      password: password,
    })

    console.log("Connected to MySQL server")

    // --- Create Database if it Doesn't Exist ---
    const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || "cedo_auth" // Get database name from .env or use default
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``) // Use backticks around dbName to handle potential special characters
    console.log(`Database '${dbName}' created or already exists`)

    // --- Use the Target Database ---
    await connection.query(`USE \`${dbName}\``) // Use backticks around dbName again

    // --- Create Tables if They Don't Exist ---

    // 1. Create users table
    const [usersTables] = await connection.query(`SHOW TABLES LIKE 'users'`)

    if (usersTables.length === 0) {
      console.log("Creating users table...")
      await connection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255),
          role ENUM('student', 'head_admin', 'manager', 'partner', 'reviewer') NOT NULL DEFAULT 'student', -- Added 'partner', 'reviewer' based on other code
          organization VARCHAR(255),
          organization_type ENUM('internal', 'external'),
          google_id VARCHAR(255),
          avatar VARCHAR(255),
          reset_token VARCHAR(255),
          reset_token_expires DATETIME,
          is_approved BOOLEAN DEFAULT FALSE,
          approved_by INT,
          approved_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `)
      console.log("Users table created")
    } else {
      console.log("Users table already exists. Checking for updates...")

      // --- Alter Users Table if Needed (Adding columns) ---
      // Check if organization_type column exists
      const [orgTypeColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'organization_type'`)
      if (orgTypeColumns.length === 0) {
        await connection.query(
          `ALTER TABLE users ADD COLUMN organization_type ENUM('internal', 'external') AFTER organization`,
        )
        console.log("Added organization_type column to users table")
      }

      // Check if google_id column exists
      const [googleIdColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'google_id'`)
      if (googleIdColumns.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN google_id VARCHAR(255) AFTER organization_type`)
        console.log("Added google_id column to users table")
      }

      // Check if avatar column exists (Added based on user/auth code)
      const [avatarColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'avatar'`)
      if (avatarColumns.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(255) AFTER google_id`)
        console.log("Added avatar column to users table")
      }

      // Check if is_approved column exists (Added based on user/auth code)
      const [isApprovedColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'is_approved'`)
      if (isApprovedColumns.length === 0) {
        await connection.query(
          `ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE AFTER reset_token_expires`,
        )
        console.log("Added is_approved column to users table")
      }

      // Check if approved_by column exists (Added based on user/auth code)
      const [approvedByColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'approved_by'`)
      if (approvedByColumns.length === 0) {
        await connection.query(
          `ALTER TABLE users ADD COLUMN approved_by INT AFTER is_approved, ADD CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL`,
        )
        console.log("Added approved_by column and foreign key to users table")
      } else {
        // Check if foreign key exists, if column was added earlier without it
        const [fkExists] = await connection.query(
          `
                 SELECT CONSTRAINT_NAME
                 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = ?
                   AND TABLE_NAME = 'users'
                   AND COLUMN_NAME = 'approved_by'
                   AND REFERENCED_TABLE_NAME IS NOT NULL
            `,
          [dbName],
        )
        if (fkExists.length === 0) {
          await connection.query(
            `ALTER TABLE users ADD CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL`,
          )
          console.log("Added fk_approved_by foreign key to users table")
        }
      }

      // Check if approved_at column exists (Added based on user/auth code)
      const [approvedAtColumns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'approved_at'`)
      if (approvedAtColumns.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by`)
        console.log("Added approved_at column to users table")
      }

      // Optional: Check and update ENUM values if needed (more complex alter)
      // For example, if you decide to officially add 'partner' and 'reviewer' to the ENUM
      // You might need to check the current ENUM values and run an ALTER TABLE MODIFY COLUMN users.role ENUM(...)
      const [roleEnum] = await connection.query(`SHOW COLUMNS FROM users LIKE 'role'`)
      const currentEnum = roleEnum[0].Type // e.g., "enum('student','head_admin','manager')"
      const requiredEnum = "enum('student','head_admin','manager','partner','reviewer')"
      if (!currentEnum.includes("'partner'") || !currentEnum.includes("'reviewer'")) {
        console.log("Updating 'role' ENUM to include 'partner' and 'reviewer'...")
        // WARNING: Changing ENUM values can be complex with existing data.
        // Ensure new values are compatible or handle data migration.
        try {
          await connection.query(`ALTER TABLE users MODIFY COLUMN role ${requiredEnum} NOT NULL DEFAULT 'student'`)
          console.log("'role' ENUM updated.")
        } catch (enumErr) {
          console.error("Failed to update 'role' ENUM. This might require manual migration.", enumErr.message)
        }
      }
    }

    // 2. Create access_logs table (Added based on auth.js logAccess helper)
    const [accessLogsTables] = await connection.query(`SHOW TABLES LIKE 'access_logs'`)

    if (accessLogsTables.length === 0) {
      console.log("Creating access_logs table...")
      await connection.query(`
            CREATE TABLE access_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT, -- User who performed the action (can be null if user is deleted)
                role VARCHAR(255), -- Role of the user at the time of action (store as string for historical accuracy)
                action VARCHAR(255) NOT NULL, -- Description of the action (e.g., 'login', 'register')
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the action occurred
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL -- Link to users table
            )
        `)
      console.log("Access_logs table created")
    } else {
      console.log("Access_logs table already exists.")
    }

    // 3. Create proposals table
    const [proposalsTables] = await connection.query(`SHOW TABLES LIKE 'proposals'`)

    if (proposalsTables.length === 0) {
      console.log("Creating proposals table...")
      await connection.query(`
            CREATE TABLE proposals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                userId INT, -- Foreign key to the users table (the submitter)
                category VARCHAR(255), -- Added based on proposals.js
                startDate DATE, -- Added based on proposals.js
                endDate DATE, -- Added based on proposals.js
                location VARCHAR(255), -- Added based on proposals.js
                budget DECIMAL(10, 2), -- Added based on proposals.js (assuming currency)
                objectives TEXT, -- Added based on proposals.js
                volunteersNeeded INT, -- Added based on proposals.js
                organizationType ENUM('internal', 'external'), -- Added based on proposals.js
                contactPerson VARCHAR(255), -- Added based on proposals.js
                contactEmail VARCHAR(255), -- Added based on proposals.js
                contactPhone VARCHAR(255), -- Added based on proposals.js
                status ENUM('draft', 'pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending', -- Added more statuses based on developed proposals.js
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )
         `)
      console.log("Proposals table created")
    } else {
      console.log("Proposals table already exists. Checking for updates...")
      // --- Alter Proposals Table if Needed (Adding/Modifying columns based on proposals.js) ---
      // Check if columns from proposals.js are missing and add them
      const [proposalColumns] = await connection.query(`SHOW COLUMNS FROM proposals`)
      const columnNames = proposalColumns.map((col) => col.Field)

      const columnsToAdd = {
        category: `VARCHAR(255) AFTER userId`,
        startDate: `DATE AFTER category`,
        endDate: `DATE AFTER startDate`,
        location: `VARCHAR(255) AFTER endDate`,
        budget: `DECIMAL(10, 2) AFTER location`,
        objectives: `TEXT AFTER budget`,
        volunteersNeeded: `INT AFTER objectives`,
        organizationType: `ENUM('internal', 'external') AFTER volunteersNeeded`,
        contactPerson: `VARCHAR(255) AFTER organizationType`,
        contactEmail: `VARCHAR(255) AFTER contactPerson`,
        contactPhone: `VARCHAR(255) AFTER contactEmail`,
      }

      for (const colName in columnsToAdd) {
        if (!columnNames.includes(colName)) {
          console.log(`Adding column '${colName}' to proposals table...`)
          await connection.query(`ALTER TABLE proposals ADD COLUMN ${colName} ${columnsToAdd[colName]}`)
          console.log(`Column '${colName}' added.`)
        }
      }

      // Check/Update status ENUM if needed
      const [statusEnum] = await connection.query(`SHOW COLUMNS FROM proposals LIKE 'status'`)
      const currentStatusEnum = statusEnum[0].Type // e.g., "enum('pending','approved','rejected')"
      const requiredStatusEnum = "enum('draft', 'pending', 'under_review', 'approved', 'rejected')"
      if (!currentStatusEnum.includes("'draft'") || !currentStatusEnum.includes("'under_review'")) {
        console.log("Updating 'status' ENUM to include 'draft' and 'under_review'...")
        try {
          await connection.query(`ALTER TABLE proposals MODIFY COLUMN status ${requiredStatusEnum} DEFAULT 'pending'`)
          console.log("'status' ENUM updated.")
        } catch (enumErr) {
          console.error("Failed to update 'status' ENUM. This might require manual migration.", enumErr.message)
        }
      }
      // Note: Handling changes like converting TEXT to JSON for 'documents' would be more complex ALTER TABLE or migration scripts
    }

    // 4. Create reviews table
    const [reviewsTables] = await connection.query(`SHOW TABLES LIKE 'reviews'`)

    if (reviewsTables.length === 0) {
      console.log("Creating reviews table...")
      await connection.query(`
            CREATE TABLE reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proposalId INT, -- Foreign key to the proposals table
                reviewerId INT, -- Foreign key to the users table (the reviewer)
                comments TEXT,
                rating INT, -- Assuming rating is an integer
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (proposalId) REFERENCES proposals(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE SET NULL
            )
        `)
      console.log("Reviews table created")
    } else {
      console.log("Reviews table already exists")
    }

    // Note: The proposals.js code also uses a 'documents' field which looks like
    // an array of embedded objects. In a relational DB like MySQL, this would
    // typically be a separate 'proposal_documents' table with a foreign key
    // back to the proposals table. This script does NOT create such a table
    // as it was not in your original init-db.js structure.

    // --- Create Dummy Users if They Don't Exist ---
    // This section remains largely as you provided, ensuring at least one admin exists
    // to approve others, and providing test accounts.

    // Check if admin user exists
    const [adminRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["admin@cedo.gov.ph"])
    let adminId = null
    if (adminRows.length === 0) {
      console.log("Creating Head Admin user...")
      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      // Insert admin user, already approved
      const [result] = await connection.query(
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved) VALUES (?, ?, ?, ?, ?, ?, TRUE)",
        [
          "Head Admin",
          "admin@cedo.gov.ph",
          hashedPassword,
          "head_admin",
          "City Economic Development Office",
          "internal",
          true,
        ],
      )
      adminId = result.insertId
      console.log("Head Admin user created")
    } else {
      console.log("Head Admin user already exists")
      adminId = adminRows[0].id // Get the existing admin's ID
      // Ensure the existing admin is marked as approved (migration for older DBs)
      if (!adminRows[0].is_approved) {
        console.log("Marking existing Head Admin as approved...")
        await connection.query(
          "UPDATE users SET is_approved = TRUE, approved_by = ?, approved_at = NOW() WHERE id = ?",
          [adminId, adminId],
        )
      }
    }

    // Create manager user if not exists
    const [managerRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["manager@cedo.gov.ph"])
    if (managerRows.length === 0) {
      console.log("Creating Manager user...")
      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("manager123", salt)

      // Insert manager user, approved by the admin
      await connection.query(
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW())",
        [
          "System Manager",
          "manager@cedo.gov.ph",
          hashedPassword,
          "manager",
          "City Economic Development Office",
          "internal",
          true,
          adminId,
        ], // Approved by adminId
      )
      console.log("Manager user created")
    } else {
      console.log("Manager user already exists")
      // Ensure existing manager is marked as approved
      if (!managerRows[0].is_approved) {
        console.log("Marking existing Manager as approved...")
        await connection.query(
          "UPDATE users SET is_approved = TRUE, approved_by = ?, approved_at = NOW() WHERE id = ?",
          [adminId, managerRows[0].id],
        )
      }
    }

    // Create dummy student account if not exists
    // Using 'student' role here for consistency with auth.js ROLES
    const [studentRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["student@example.com"])
    if (studentRows.length === 0) {
      console.log("Creating Dummy Student user...")
      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("student123", salt)

      // Insert student user, approved by the admin
      await connection.query(
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW())",
        [
          "Sample Student",
          "student@example.com",
          hashedPassword,
          "student",
          "Xavier University",
          "external",
          true,
          adminId,
        ], // Approved by adminId
      )
      console.log("Dummy student account created")
    } else {
      console.log("Dummy student account already exists")
      // Ensure existing student is marked as approved
      if (!studentRows[0].is_approved) {
        console.log("Marking existing Student as approved...")
        await connection.query(
          "UPDATE users SET is_approved = TRUE, approved_by = ?, approved_at = NOW() WHERE id = ?",
          [adminId, studentRows[0].id],
        )
      }
    }

    // Optional: Create a dummy user pending approval for testing the approval flow
    const [pendingUserRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["pending@example.com"])
    if (pendingUserRows.length === 0) {
      console.log("Creating Dummy Pending user...")
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("pending123", salt)
      await connection.query(
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved) VALUES (?, ?, ?, ?, ?, ?, FALSE)",
        ["Pending Account", "pending@example.com", hashedPassword, "student", "Pending Org", "external", false],
      )
      console.log("Dummy Pending user created (requires admin/manager approval)")
    } else {
      console.log("Dummy Pending user already exists")
    }

    // Optional: Create a dummy reviewer user if 'reviewer' role is used
    const [reviewerRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["reviewer@cedo.gov.ph"])
    if (reviewerRows.length === 0) {
      console.log("Creating Dummy Reviewer user...")
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("reviewer123", salt)
      await connection.query(
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW())",
        [
          "Proposal Reviewer",
          "reviewer@cedo.gov.ph",
          hashedPassword,
          "reviewer",
          "CEDO Department",
          "internal",
          true,
          adminId,
          new Date(),
        ], // Approved by adminId
      )
      console.log("Dummy Reviewer user created")
    } else {
      console.log("Dummy Reviewer user already exists")
    }

    console.log("\nDatabase initialization completed successfully")
    console.log("\nDummy accounts created (passwords: admin123, manager123, student123, pending123, reviewer123):")
    console.log("1. Head Admin   - admin@cedo.gov.ph (Approved)")
    console.log("2. System Manager - manager@cedo.gov.ph (Approved)")
    console.log("3. Student      - student@example.com (Approved)")
    console.log("4. Pending Account - pending@example.com (PENDING APPROVAL)")
    console.log("5. Reviewer     - reviewer@cedo.gov.ph (Approved)")

    // Exit with success code
    process.exit(0)
  } catch (error) {
    // --- Error Handling ---
    // Log the specific error message
    console.error("\nError initializing database:", error.message)
    // Log the full error object for debugging
    console.error(error)

    // Provide troubleshooting tips
    console.log("\nTroubleshooting tips:")
    console.log("1. Make sure MySQL server is running.")
    console.log(
      "2. Check your MySQL credentials (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD) in the environment variables.",
    )
    console.log("3. If using 'localhost', try using '127.0.0.1' instead.")
    const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || "cedo_auth"
    console.log(
      `4. Make sure your MySQL user (${process.env.MYSQL_USER || process.env.DB_USER || "root"}) has privileges to CREATE DATABASES, CREATE TABLES, and INSERT data on the '${dbName}' database (or globally if creating the DB).`,
    )
    console.log("5. Check the error details above for specific MySQL error codes (e.g., ER_ACCESS_DENIED_ERROR).")

    // Exit with error code
    process.exit(1)
  } finally {
    // --- Close Connection ---
    // Ensure the connection is closed even if errors occur
    if (connection) {
      await connection.end()
      console.log("\nMySQL connection closed")
    }
  }
}

// Replace the direct call to main() with:
// Execute the main initialization function if called directly
if (require.main === module) {
  main()
}

// Export the main function for use in other modules
module.exports = { main }
