// backend/middleware/db-check.js

const { pool } = require("../config/db");
const ROLES = require("../constants/roles");

// =============================
// Constants for Table/Column Names & Types
// =============================
const TABLES = {
    USERS: "users",
    ACCESS_LOGS: "access_logs",
    PROPOSALS: "proposals",
    REVIEWS: "reviews",
};

const USER_COLUMNS = {
    ID: "id INT AUTO_INCREMENT PRIMARY KEY",
    NAME: "name VARCHAR(255) NOT NULL",
    EMAIL: "email VARCHAR(255) NOT NULL UNIQUE",
    PASSWORD: "password VARCHAR(255)",
    ROLE: `role ENUM('${ROLES.STUDENT}','${ROLES.HEAD_ADMIN}','${ROLES.MANAGER}','${ROLES.PARTNER}','${ROLES.REVIEWER}') NOT NULL DEFAULT '${ROLES.STUDENT}'`,
    ORGANIZATION: "organization VARCHAR(255)",
    ORGANIZATION_TYPE: "organization_type ENUM('internal', 'external')",
    AVATAR: "avatar VARCHAR(255)",
    GOOGLE_ID: "google_id VARCHAR(255)",
    IS_APPROVED: "is_approved BOOLEAN DEFAULT FALSE",
    APPROVED_BY: "approved_by INT",
    APPROVED_AT: "approved_at DATETIME",
    CREATED_AT: "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    UPDATED_AT: "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    FK_APPROVED_BY: "FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL",
};

const ACCESS_LOGS_COLUMNS = {
    ID: "id INT AUTO_INCREMENT PRIMARY KEY",
    USER_ID: "user_id INT NOT NULL",
    ACTION: "action VARCHAR(50) NOT NULL",
    IP_ADDRESS: "ip_address VARCHAR(45)",
    USER_AGENT: "user_agent VARCHAR(255)",
    TIMESTAMP: "timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    FK_USER_ID: "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
};

const PROPOSALS_SECTION5_COLUMNS = {
    digital_signature: 'LONGTEXT',
    accomplishment_report_file_name: 'VARCHAR(255)',
    accomplishment_report_file_path: 'VARCHAR(500)',
    pre_registration_file_name: 'VARCHAR(255)',
    pre_registration_file_path: 'VARCHAR(500)',
    final_attendance_file_name: 'VARCHAR(255)',
    final_attendance_file_path: 'VARCHAR(500)',
    attendance_count: 'INT',
    event_status: "ENUM('completed','cancelled','postponed')",
    report_description: 'TEXT',
};

// =============================
// Utility Functions
// =============================

/**
 * Check if a table exists in the database
 * @param {string} tableName
 * @returns {Promise<boolean>}
 */
async function tableExists(tableName) {
    try {
        const dbName = process.env.MYSQL_DATABASE || "cedo_auth";
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
            [dbName, tableName],
        );
        if (!Array.isArray(result) || result.length < 1 || !Array.isArray(result[0]) || result[0].length < 1) {
            return false;
        }
        const rows = result[0];
        const count = rows[0] && typeof rows[0].count === 'number' ? rows[0].count : 0;
        return count > 0;
    } catch (error) {
        console.error(`Error checking if table ${tableName} exists:`, error && error.message ? error.message : error);
        return false;
    }
}

/**
 * Create a table if it does not exist
 * @param {string} tableName
 * @param {string[]} columns - Array of column definitions
 * @param {string[]} [foreignKeys] - Array of foreign key definitions
 */
async function createTableIfNotExists(tableName, columns, foreignKeys = []) {
    const exists = await tableExists(tableName);
    if (exists) {
        console.log(`${tableName} table already exists`);
        return;
    }
    const allColumns = columns.concat(foreignKeys);
    const createSQL = `CREATE TABLE ${tableName} (\n  ${allColumns.join(",\n  ")}\n)`;
    try {
        console.log(`Creating ${tableName} table...`);
        await pool.query(createSQL);
        console.log(`${tableName} table created successfully`);
    } catch (error) {
        console.error(`Error creating ${tableName} table:`, error && error.message ? error.message : error);
        throw error;
    }
}

/**
 * Add missing columns to a table
 * @param {string} tableName
 * @param {Object} neededColumns - { columnName: columnType }
 */
async function addMissingColumns(tableName, neededColumns) {
    try {
        const result = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        let cols = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : [];
        const existing = cols.map(c => c && c.Field).filter(Boolean);
        const missing = Object.entries(neededColumns).filter(([name]) => !existing.includes(name));
        if (missing.length) {
            const alterClauses = missing.map(([name, type]) => `ADD COLUMN \`${name}\` ${type}`);
            const alterSQL = `ALTER TABLE ${tableName} ${alterClauses.join(', ')}`;
            console.log(`🛠️  Updating ${tableName} table:`, alterSQL);
            await pool.query(alterSQL);
            console.log(`✅  ${tableName} table updated with missing columns`);
        } else {
            console.log(`✅  All required columns present in ${tableName}`);
        }
    } catch (error) {
        console.error(`❌  Failed to verify/add columns in ${tableName}:`, error && error.message ? error.message : error);
    }
}

// =============================
// Table Creation Functions
// =============================

async function createUsersTable() {
    await createTableIfNotExists(
        TABLES.USERS,
        [
            USER_COLUMNS.ID,
            USER_COLUMNS.NAME,
            USER_COLUMNS.EMAIL,
            USER_COLUMNS.PASSWORD,
            USER_COLUMNS.ROLE,
            USER_COLUMNS.ORGANIZATION,
            USER_COLUMNS.ORGANIZATION_TYPE,
            USER_COLUMNS.AVATAR,
            USER_COLUMNS.GOOGLE_ID,
            USER_COLUMNS.IS_APPROVED,
            USER_COLUMNS.APPROVED_BY,
            USER_COLUMNS.APPROVED_AT,
            USER_COLUMNS.CREATED_AT,
            USER_COLUMNS.UPDATED_AT,
        ],
        [USER_COLUMNS.FK_APPROVED_BY]
    );
}

async function createAccessLogsTable() {
    await createTableIfNotExists(
        TABLES.ACCESS_LOGS,
        [
            ACCESS_LOGS_COLUMNS.ID,
            ACCESS_LOGS_COLUMNS.USER_ID,
            ACCESS_LOGS_COLUMNS.ACTION,
            ACCESS_LOGS_COLUMNS.IP_ADDRESS,
            ACCESS_LOGS_COLUMNS.USER_AGENT,
            ACCESS_LOGS_COLUMNS.TIMESTAMP,
        ],
        [ACCESS_LOGS_COLUMNS.FK_USER_ID]
    );
}

async function createProposalsTable(tableExistsFn = tableExists) {
    const exists = await tableExistsFn(TABLES.PROPOSALS);
    if (exists) {
        try {
            const result = await pool.query('SHOW COLUMNS FROM proposals');
            let cols = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : [];
            const existing = cols.map(c => c && c.Field).filter(Boolean);
            const missing = Object.entries(PROPOSALS_SECTION5_COLUMNS)
                .filter(([name]) => !existing.includes(name));
            if (missing.length) {
                const alterClauses = missing.map(([name, type]) => `ADD COLUMN \`${name}\` ${type}`);
                const alterSQL = `ALTER TABLE proposals ${alterClauses.join(', ')}`;
                console.log('🛠️  Updating proposals table:', alterSQL);
                await pool.query(alterSQL);
                console.log('✅  Proposals table updated with missing Section-5 columns');
            } else {
                console.log('✅  All Section-5 columns present');
            }
        } catch (colErr) {
            console.error('❌  Failed to verify/add Section-5 columns:', colErr && colErr.message ? colErr.message : colErr);
        }
        return;
    }
    // Table does not exist: create it
    const createSQL = `CREATE TABLE ${TABLES.PROPOSALS} (\n  id BIGINT AUTO_INCREMENT PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  description TEXT NOT NULL,\n  category VARCHAR(100) NOT NULL,\n  start_date DATE NOT NULL,\n  end_date DATE NOT NULL,\n  location VARCHAR(255) NOT NULL,\n  budget DECIMAL(10, 2) NOT NULL,\n  objectives TEXT NOT NULL,\n  volunteers_needed INT NOT NULL,\n  submitter_id INT NOT NULL,\n  organization_type VARCHAR(100) NOT NULL,\n  contact_person VARCHAR(255) NOT NULL,\n  contact_email VARCHAR(255) NOT NULL,\n  contact_phone VARCHAR(20) NOT NULL,\n  status ENUM('draft', 'pending', 'under_review', 'approved', 'rejected') NOT NULL DEFAULT 'draft',\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE\n)`;
    try {
        console.log("Creating proposals table...");
        await pool.query(createSQL);
        console.log("Proposals table created successfully");
    } catch (error) {
        console.error("Error creating proposals table:", error && error.message ? error.message : error);
        throw error;
    }
}

async function createReviewsTable() {
    await createTableIfNotExists(
        TABLES.REVIEWS,
        [
            "id INT AUTO_INCREMENT PRIMARY KEY",
            "proposal_id BIGINT NOT NULL",
            "reviewer_id INT NOT NULL",
            "comments TEXT NOT NULL",
            "rating INT NOT NULL",
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ],
        [
            "FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE",
            "FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE",
        ]
    );
}

// =============================
// Main Ensure Function
// =============================

async function ensureTablesExist() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.warn('⚠️  Skipping table creation: No database connection available.');
    return;
  }

  try {
    await createUsersTable();
    await createAccessLogsTable();
    await createProposalsTable();
    await createReviewsTable();

    const result = await pool.query("SELECT COUNT(*) as count FROM users");
    let users = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : [];
    let userCount = users[0] && typeof users[0].count === 'number' ? users[0].count : 0;

    if (userCount === 0) {
      console.log("Creating default admin user...");
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await pool.query(
        "INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)",
        ["Admin User", "admin@example.com", hashedPassword, ROLES.HEAD_ADMIN, true]
      );
      console.log("Default admin user created successfully");
    } else {
      console.log("✅ Skipped creating default admin; users already exist.");
    }

    return true;
  } catch (err) {
    console.error('Error during table creation:', err.message || err);
    console.error('Stack Trace:', err.stack || 'No stack trace');
    return false;
  }
}

// =============================
// Exports
// =============================
module.exports = {
  tableExists,
  createUsersTable,
  createAccessLogsTable,
  createProposalsTable,
  createReviewsTable,
  ensureTablesExist,
};
