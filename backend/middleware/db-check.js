// backend/middleware/db-check.js

const { pool, query } = require("../config/database-postgresql-only");
const ROLES = require("../constants/roles");

// =============================
// Constants for Table/Column Names & Types
// =============================
const TABLES = {
    USERS: "users",
    AUDIT_LOGS: "audit_logs",
    PROPOSALS: "proposals",
    REVIEWS: "reviews",
};

const USER_COLUMNS = {
    ID: "id SERIAL PRIMARY KEY",
    NAME: "name VARCHAR(255) NOT NULL",
    EMAIL: "email VARCHAR(255) NOT NULL UNIQUE",
    PASSWORD: "password VARCHAR(255)",
    ROLE: `role VARCHAR(20) NOT NULL DEFAULT '${ROLES.STUDENT}' CHECK (role IN ('${ROLES.STUDENT}','${ROLES.HEAD_ADMIN}','${ROLES.MANAGER}','${ROLES.PARTNER}','${ROLES.REVIEWER}'))`,
    ORGANIZATION: "organization VARCHAR(255)",
    ORGANIZATION_TYPE: "organization_type VARCHAR(20) CHECK (organization_type IN ('internal', 'external'))",
    AVATAR: "avatar VARCHAR(255)",
    GOOGLE_ID: "google_id VARCHAR(255)",
    IS_APPROVED: "is_approved BOOLEAN DEFAULT FALSE",
    APPROVED_BY: "approved_by INT",
    APPROVED_AT: "approved_at TIMESTAMP",
    CREATED_AT: "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    UPDATED_AT: "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    FK_APPROVED_BY: "FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL",
};

const AUDIT_LOGS_COLUMNS = {
    ID: "id BIGSERIAL PRIMARY KEY",
    USER_ID: "user_id INTEGER",
    ACTION_TYPE: "action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'))",
    TABLE_NAME: "table_name VARCHAR(50) NOT NULL",
    RECORD_ID: "record_id BIGINT",
    OLD_VALUES: "old_values JSONB",
    NEW_VALUES: "new_values JSONB",
    IP_ADDRESS: "ip_address VARCHAR(45)",
    USER_AGENT: "user_agent TEXT",
    SESSION_ID: "session_id VARCHAR(255)",
    ADDITIONAL_INFO: "additional_info JSONB",
    CREATED_AT: "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    FK_USER_ID: "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL",
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
    event_status: "VARCHAR(20) CHECK (event_status IN ('completed','cancelled','postponed'))",
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
        // ✅ FIX: Use 'public' schema for PostgreSQL instead of database name
        const result = await query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
            [tableName],
        );
        if (!result.rows || result.rows.length < 1) {
            return false;
        }
        const count = result.rows[0] && typeof result.rows[0].count === 'number' ? result.rows[0].count : 0;
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
    // ✅ FIX: Use PostgreSQL's CREATE TABLE IF NOT EXISTS to avoid conflicts
    const allColumns = columns.concat(foreignKeys);
    const createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${allColumns.join(",\n  ")}\n)`;
    try {
        console.log(`Creating ${tableName} table if it doesn't exist...`);
        await query(createSQL);
        console.log(`${tableName} table created successfully or already exists`);
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
        // ✅ FIX: Use PostgreSQL syntax instead of postgresql SHOW COLUMNS
        const result = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);

        const existing = result.rows.map(row => row.column_name);
        const missing = Object.entries(neededColumns).filter(([name]) => !existing.includes(name));

        if (missing.length) {
            const alterClauses = missing.map(([name, type]) => `ADD COLUMN "${name}" ${type}`);
            const alterSQL = `ALTER TABLE ${tableName} ${alterClauses.join(', ')}`;
            console.log(`🛠️  Updating ${tableName} table:`, alterSQL);
            await query(alterSQL);
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

async function createAuditLogsTable() {
    await createTableIfNotExists(
        TABLES.AUDIT_LOGS,
        [
            AUDIT_LOGS_COLUMNS.ID,
            AUDIT_LOGS_COLUMNS.USER_ID,
            AUDIT_LOGS_COLUMNS.ACTION_TYPE,
            AUDIT_LOGS_COLUMNS.TABLE_NAME,
            AUDIT_LOGS_COLUMNS.RECORD_ID,
            AUDIT_LOGS_COLUMNS.OLD_VALUES,
            AUDIT_LOGS_COLUMNS.NEW_VALUES,
            AUDIT_LOGS_COLUMNS.IP_ADDRESS,
            AUDIT_LOGS_COLUMNS.USER_AGENT,
            AUDIT_LOGS_COLUMNS.SESSION_ID,
            AUDIT_LOGS_COLUMNS.ADDITIONAL_INFO,
            AUDIT_LOGS_COLUMNS.CREATED_AT,
        ],
        [AUDIT_LOGS_COLUMNS.FK_USER_ID]
    );
}

async function createProposalsTable(tableExistsFn = tableExists) {
    const exists = await tableExistsFn(TABLES.PROPOSALS);
    if (exists) {
        try {
            // ✅ FIX: Use PostgreSQL syntax instead of postgresql SHOW COLUMNS
            const result = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'proposals'
            `);

            const existing = result.rows.map(row => row.column_name);
            const missing = Object.entries(PROPOSALS_SECTION5_COLUMNS)
                .filter(([name]) => !existing.includes(name));
            if (missing.length) {
                const alterClauses = missing.map(([name, type]) => `ADD COLUMN "${name}" ${type}`);
                const alterSQL = `ALTER TABLE proposals ${alterClauses.join(', ')}`;
                console.log('🛠️  Updating proposals table:', alterSQL);
                await query(alterSQL);
                console.log('✅  Proposals table updated with missing Section-5 columns');
            } else {
                console.log('✅  All Section-5 columns present');
            }
        } catch (colErr) {
            console.error('❌  Failed to verify/add Section-5 columns:', colErr && colErr.message ? colErr.message : colErr);
        }
        return;
    }
    // ✅ FIX: Use CREATE TABLE IF NOT EXISTS to avoid conflicts
    const createSQL = `CREATE TABLE IF NOT EXISTS ${TABLES.PROPOSALS} (\n  id BIGSERIAL PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  description TEXT NOT NULL,\n  category VARCHAR(100) NOT NULL,\n  start_date DATE NOT NULL,\n  end_date DATE NOT NULL,\n  location VARCHAR(255) NOT NULL,\n  budget DECIMAL(10, 2) NOT NULL,\n  objectives TEXT NOT NULL,\n  volunteers_needed INT NOT NULL,\n  submitter_id INT NOT NULL,\n  organization_type VARCHAR(100) NOT NULL,\n  contact_person VARCHAR(255) NOT NULL,\n  contact_email VARCHAR(255) NOT NULL,\n  contact_phone VARCHAR(20) NOT NULL,\n  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected')),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE\n)`;
    try {
        console.log("Creating proposals table if it doesn't exist...");
        await query(createSQL);
        console.log("Proposals table created successfully or already exists");
    } catch (error) {
        console.error("Error creating proposals table:", error && error.message ? error.message : error);
        throw error;
    }
}

async function createReviewsTable() {
    await createTableIfNotExists(
        TABLES.REVIEWS,
        [
            "id SERIAL PRIMARY KEY",
            "proposal_id BIGINT NOT NULL",
            "reviewer_id INT NOT NULL",
            "comments TEXT NOT NULL",
            "rating INT NOT NULL",
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", // ✅ FIX: Removed postgresql-specific ON UPDATE
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
        await query('SELECT 1');
    } catch (err) {
        console.warn('⚠️  Skipping table creation: No database connection available.');
        return;
    }

    try {
        // ✅ FIX: Add individual error handling for each table creation
        try {
            await createUsersTable();
        } catch (err) {
            console.error('❌ Failed to create users table:', err.message);
            // Continue with other tables
        }

        try {
            await createAuditLogsTable();
        } catch (err) {
            console.error('❌ Failed to create audit_logs table:', err.message);
            // Continue with other tables
        }

        try {
            await createProposalsTable();
        } catch (err) {
            console.error('❌ Failed to create proposals table:', err.message);
            // Continue with other tables
        }

        // Ensure Postgres enum values exist for roles
        try {
            await query(`DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_type' AND e.enumlabel = 'head_admin') THEN
                ALTER TYPE role_type ADD VALUE 'head_admin';
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_type' AND e.enumlabel = 'manager') THEN
                ALTER TYPE role_type ADD VALUE 'manager';
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role_type' AND e.enumlabel = 'reviewer') THEN
                ALTER TYPE role_type ADD VALUE 'reviewer';
              END IF;
            END$$;`);
            console.log('✅ Ensured role_type enum has required values');
        } catch (err) {
            console.warn('⚠️  Skipped enum extension (role_type may not exist or values already present):', err.message);
        }

        try {
            await createReviewsTable();
        } catch (err) {
            console.error('❌ Failed to create reviews table:', err.message);
            // Continue with other tables
        }

        // Check if admin user already exists specifically
        console.log("Creating default admin user...");
        try {
            // First check if admin user already exists
            const adminCheck = await query("SELECT id FROM users WHERE email = $1", ["admin@example.com"]);

            if (adminCheck.rows.length > 0) {
                console.log("✅ Admin user already exists, skipping creation.");
            } else {
                // Create admin user if it doesn't exist
                const bcrypt = require("bcryptjs");
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash("admin123", salt);

                await query(
                    "INSERT INTO users (name, email, password, role, is_approved) VALUES ($1, $2, $3, $4, $5)",
                    ["Admin User", "admin@example.com", hashedPassword, ROLES.HEAD_ADMIN, true]
                );
                console.log("✅ Default admin user created successfully");
            }
        } catch (error) {
            if (error.code === '23505' && error.constraint === 'users_email_key') {
                console.log("✅ Admin user already exists, skipping creation.");
            } else {
                console.error("❌ Error creating admin user:", error.message);
                // Don't throw error - just log it and continue
                console.log("⚠️ Continuing server startup despite admin user creation error...");
            }
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
    createAuditLogsTable,
    createProposalsTable,
    createReviewsTable,
    ensureTablesExist,
};
