require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// ========================================
// CEDO MySQL Database Initializer
// Based on CEDO_ERD_Data_Model.md
// Production-ready with comprehensive error handling
// ========================================

console.log("🛠️  CEDO MySQL Database Initializer starting...");
console.log("📋 Based on CEDO_ERD_Data_Model.md specifications");

// Environment variables with fallbacks
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
  user: process.env.DB_USER || process.env.MYSQL_USER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
  charset: "utf8mb4",
  timezone: "+00:00",
  multipleStatements: true
};

const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || "cedo_auth";

console.log(`🔗 Connecting to MySQL at ${dbConfig.host} with user ${dbConfig.user}`);
console.log(`📊 Target database: ${dbName}`);

// Utility function for safe table creation
async function createTableIfNotExists(connection, tableName, createSQL) {
  try {
    const [tables] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
    if (tables.length === 0) {
      console.log(`📝 Creating table: ${tableName}`);
      await connection.query(createSQL);
      console.log(`✅ Table '${tableName}' created successfully`);
    } else {
      console.log(`ℹ️  Table '${tableName}' already exists`);
    }
  } catch (error) {
    console.error(`❌ Error creating table '${tableName}':`, error.message);
    throw error;
  }
}

// Utility function for safe column addition
async function addColumnIfNotExists(connection, tableName, columnName, columnDefinition) {
  try {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`);
    if (columns.length === 0) {
      console.log(`📝 Adding column '${columnName}' to table '${tableName}'`);
      await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`✅ Column '${columnName}' added successfully`);
    }
  } catch (error) {
    console.error(`❌ Error adding column '${columnName}' to '${tableName}':`, error.message);
    throw error;
  }
}

// Utility function for safe index creation
async function createIndexIfNotExists(connection, tableName, indexName, indexDefinition) {
  try {
    const [indexes] = await connection.query(`SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'`);
    if (indexes.length === 0) {
      console.log(`📝 Creating index '${indexName}' on table '${tableName}'`);
      await connection.query(`CREATE INDEX ${indexName} ON ${tableName} ${indexDefinition}`);
      console.log(`✅ Index '${indexName}' created successfully`);
    }
  } catch (error) {
    console.error(`❌ Error creating index '${indexName}' on '${tableName}':`, error.message);
    throw error;
  }
}

// Main initialization function
async function initializeDatabase() {
  let connection;

  try {
    // ========================================
    // 1. ESTABLISH DATABASE CONNECTION
    // ========================================

    console.log("\n🔌 Establishing database connection...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    // ========================================
    // 2. CREATE DATABASE IF NOT EXISTS
    // ========================================

    console.log(`\n📊 Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
      CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' ready`);

    // Use the target database
    await connection.query(`USE \`${dbName}\``);

    // ========================================
    // 3. CREATE CORE TABLES (Based on ERD Model)
    // ========================================

    console.log("\n📋 Creating core tables based on ERD model...");

    // 3.1 USERS TABLE - Core user management
    await createTableIfNotExists(connection, "users", `
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) COMMENT 'Hashed with bcrypt, nullable for OAuth',
        role ENUM('student', 'partner', 'admin', 'head_admin', 'manager', 'reviewer') NOT NULL DEFAULT 'student',
        organization VARCHAR(255),
        organization_type ENUM('internal', 'external', 'school-based', 'community-based'),
        organization_description TEXT,
        phone_number VARCHAR(20),
        avatar VARCHAR(255) COMMENT 'URL to avatar image',
        google_id VARCHAR(255) UNIQUE COMMENT 'Google OAuth identifier',
        reset_token VARCHAR(255) COMMENT 'Password reset token',
        reset_token_expires DATETIME COMMENT 'Reset token expiration',
        is_approved BOOLEAN DEFAULT FALSE,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        password_reset_required BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_google_id (google_id),
        INDEX idx_role (role),
        INDEX idx_is_approved (is_approved),
        INDEX idx_organization_type (organization_type),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 3.2 PROPOSALS TABLE - Simplified metadata as per ERD
    await createTableIfNotExists(connection, "proposals", `
      CREATE TABLE proposals (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE COMMENT 'UUID for cross-database sync',
        
        -- Organization Information
        organization_name VARCHAR(255) NOT NULL,
        organization_type ENUM('internal', 'external', 'school-based', 'community-based') NOT NULL,
        organization_description TEXT,
        
        -- Contact Information
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(20),
        
        -- Event Information
        event_name VARCHAR(255) NOT NULL,
        event_venue VARCHAR(500),
        event_start_date DATE NOT NULL,
        event_end_date DATE NOT NULL,
        event_start_time TIME,
        event_end_time TIME,
        event_mode ENUM('offline', 'online', 'hybrid') DEFAULT 'offline',
        
        -- Event Types
        school_event_type ENUM('academic-enhancement', 'workshop-seminar-webinar', 'conference', 'competition', 'cultural-show', 'sports-fest', 'other'),
        school_return_service_credit ENUM('1', '2', '3', 'Not Applicable'),
        school_target_audience JSON,
        community_event_type ENUM('academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others'),
        community_sdp_credits ENUM('1', '2'),
        community_target_audience JSON,
        
        -- File References
        school_gpoa_file_name VARCHAR(255),
        school_gpoa_file_path VARCHAR(500),
        school_proposal_file_name VARCHAR(255),
        school_proposal_file_path VARCHAR(500),
        community_gpoa_file_name VARCHAR(255),
        community_gpoa_file_path VARCHAR(500),
        community_proposal_file_name VARCHAR(255),
        community_proposal_file_path VARCHAR(500),
        accomplishment_report_file_name VARCHAR(255),
        accomplishment_report_file_path VARCHAR(500),
        pre_registration_file_name VARCHAR(255),
        pre_registration_file_path VARCHAR(500),
        final_attendance_file_name VARCHAR(255),
        final_attendance_file_path VARCHAR(500),
        
        -- Status Management
        current_section ENUM('overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting'),
        has_active_proposal TINYINT(1) DEFAULT 0,
        proposal_status ENUM('draft', 'pending', 'approved', 'denied', 'revision_requested') DEFAULT 'draft',
        report_status ENUM('draft', 'pending', 'approved', 'denied', 'not_applicable') DEFAULT 'draft',
        event_status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed') DEFAULT 'scheduled',
        
        -- Additional Information
        attendance_count INT DEFAULT 0,
        objectives TEXT,
        budget DECIMAL(10,2) DEFAULT 0.00,
        volunteers_needed INT DEFAULT 0,
        digital_signature LONGTEXT,
        report_description TEXT,
        admin_comments TEXT,
        
        -- Audit Information
        reviewed_by_admin_id INT,
        reviewed_at TIMESTAMP NULL,
        submitted_at TIMESTAMP NULL,
        approved_at TIMESTAMP NULL,
        validation_errors JSON,
        form_completion_percentage DECIMAL(5,2) DEFAULT 0.00,
        
        -- Meta Information
        is_deleted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- User Relationship
        user_id INT,
        
        -- Indexes for performance
        INDEX idx_organization_name (organization_name),
        INDEX idx_contact_email (contact_email),
        INDEX idx_proposal_status (proposal_status),
        INDEX idx_event_status (event_status),
        INDEX idx_organization_type (organization_type),
        INDEX idx_event_dates (event_start_date, event_end_date),
        INDEX idx_is_deleted (is_deleted),
        INDEX idx_user_id (user_id),
        INDEX idx_uuid (uuid),
        INDEX idx_current_section (current_section),
        INDEX idx_has_active_proposal (has_active_proposal),
        
        -- Composite indexes for common queries
        INDEX idx_status_type (proposal_status, organization_type),
        INDEX idx_active_proposals (is_deleted, proposal_status, created_at),
        INDEX idx_user_status (user_id, proposal_status),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 3.3 AUDIT_LOGS TABLE - Comprehensive audit trail
    await createTableIfNotExists(connection, "audit_logs", `
      CREATE TABLE audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT') NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        record_id BIGINT,
        old_values JSON COMMENT 'Previous values before change',
        new_values JSON COMMENT 'New values after change',
        ip_address VARCHAR(45),
        user_agent TEXT,
        session_id VARCHAR(255),
        additional_info JSON COMMENT 'Extra context data',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_table_record (table_name, record_id),
        INDEX idx_created_at (created_at),
        INDEX idx_ip_address (ip_address),
        INDEX idx_session_id (session_id),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 3.4 ORGANIZATIONS TABLE - Organization management
    await createTableIfNotExists(connection, "organizations", `
      CREATE TABLE organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(32),
        organization_type ENUM('school-based', 'community-based') NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_name (name),
        INDEX idx_type (organization_type),
        INDEX idx_is_active (is_active),
        INDEX idx_contact_email (contact_email)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // 3.5 SESSIONS TABLE - Session management
    await createTableIfNotExists(connection, "sessions", `
      CREATE TABLE sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INT,
        expires_at TIMESTAMP NOT NULL,
        data JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        INDEX idx_is_active (is_active),
        INDEX idx_ip_address (ip_address),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    // ========================================
    // 4. CREATE DATABASE VIEWS FOR COMMON QUERIES
    // ========================================

    console.log("\n📊 Creating database views...");

    // 4.1 Active Users View
    await connection.query(`
      CREATE OR REPLACE VIEW active_users AS
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.organization,
        u.organization_type,
        u.is_approved,
        u.last_login,
        u.created_at
      FROM users u
      WHERE u.is_approved = TRUE
      ORDER BY u.last_login DESC
    `);

    // 4.2 Proposal Summary View
    await connection.query(`
      CREATE OR REPLACE VIEW proposal_summary AS
      SELECT 
        p.id,
        p.uuid,
        p.organization_name,
        p.event_name,
        p.proposal_status,
        p.event_status,
        p.event_start_date,
        p.event_end_date,
        u.name as submitter_name,
        u.email as submitter_email,
        p.created_at,
        p.updated_at
      FROM proposals p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.is_deleted = FALSE
      ORDER BY p.created_at DESC
    `);

    // 4.3 Audit Activity View
    await connection.query(`
      CREATE OR REPLACE VIEW recent_audit_activity AS
      SELECT 
        a.id,
        u.name as user_name,
        u.email as user_email,
        a.action_type,
        a.table_name,
        a.record_id,
        a.ip_address,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY a.created_at DESC
    `);

    // ========================================
    // 5. CREATE STORED PROCEDURES
    // ========================================

    console.log("\n🔧 Creating stored procedures...");

    // 5.1 User Approval Procedure
    await connection.query(`
      DROP PROCEDURE IF EXISTS ApproveUser;
      
      CREATE PROCEDURE ApproveUser(
        IN p_user_id INT,
        IN p_approved_by INT,
        IN p_admin_ip VARCHAR(45)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;
        
        START TRANSACTION;
        
        UPDATE users 
        SET is_approved = TRUE, 
            approved_by = p_approved_by, 
            approved_at = NOW()
        WHERE id = p_user_id;
        
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, new_values)
        VALUES (p_approved_by, 'APPROVE', 'users', p_user_id, p_admin_ip, 
                JSON_OBJECT('approved', TRUE, 'approved_at', NOW()));
        
        COMMIT;
      END
    `);

    // 5.2 Proposal Review Procedure
    await connection.query(`
      DROP PROCEDURE IF EXISTS ReviewProposal;
      
      CREATE PROCEDURE ReviewProposal(
        IN p_proposal_id BIGINT,
        IN p_reviewer_id INT,
        IN p_status ENUM('approved', 'denied', 'revision_requested'),
        IN p_comments TEXT,
        IN p_reviewer_ip VARCHAR(45)
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;
        
        START TRANSACTION;
        
        UPDATE proposals 
        SET proposal_status = p_status,
            admin_comments = p_comments,
            reviewed_by_admin_id = p_reviewer_id,
            reviewed_at = NOW(),
            approved_at = CASE WHEN p_status = 'approved' THEN NOW() ELSE NULL END
        WHERE id = p_proposal_id;
        
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, new_values)
        VALUES (p_reviewer_id, 'UPDATE', 'proposals', p_proposal_id, p_reviewer_ip,
                JSON_OBJECT('status', p_status, 'comments', p_comments, 'reviewed_at', NOW()));
        
        COMMIT;
      END
    `);

    // 5.3 Dashboard Statistics Procedure
    await connection.query(`
      DROP PROCEDURE IF EXISTS GetDashboardStats;
      
      CREATE PROCEDURE GetDashboardStats()
      BEGIN
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_approved = TRUE) as approved_users,
          (SELECT COUNT(*) FROM users WHERE is_approved = FALSE) as pending_users,
          (SELECT COUNT(*) FROM proposals WHERE is_deleted = FALSE) as total_proposals,
          (SELECT COUNT(*) FROM proposals WHERE proposal_status = 'pending' AND is_deleted = FALSE) as pending_proposals,
          (SELECT COUNT(*) FROM proposals WHERE proposal_status = 'approved' AND is_deleted = FALSE) as approved_proposals,
          (SELECT COUNT(*) FROM proposals WHERE proposal_status = 'denied' AND is_deleted = FALSE) as denied_proposals,
          (SELECT COUNT(*) FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_activities,
          (SELECT COUNT(DISTINCT user_id) FROM sessions WHERE is_active = TRUE AND expires_at > NOW()) as active_sessions;
      END
    `);

    // ========================================
    // 6. CREATE TRIGGERS FOR AUDIT LOGGING
    // ========================================

    console.log("\n🔔 Creating audit triggers...");

    // 6.1 Users Table Audit Trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS users_audit_trigger;
      
      CREATE TRIGGER users_audit_trigger
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (NEW.id, 'UPDATE', 'users', NEW.id,
                JSON_OBJECT('name', OLD.name, 'email', OLD.email, 'role', OLD.role, 'is_approved', OLD.is_approved),
                JSON_OBJECT('name', NEW.name, 'email', NEW.email, 'role', NEW.role, 'is_approved', NEW.is_approved));
      END
    `);

    // 6.2 Proposals Table Audit Trigger
    await connection.query(`
      DROP TRIGGER IF EXISTS proposals_audit_trigger;
      
      CREATE TRIGGER proposals_audit_trigger
      AFTER UPDATE ON proposals
      FOR EACH ROW
      BEGIN
        INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (NEW.user_id, 'UPDATE', 'proposals', NEW.id,
                JSON_OBJECT('proposal_status', OLD.proposal_status, 'event_status', OLD.event_status),
                JSON_OBJECT('proposal_status', NEW.proposal_status, 'event_status', NEW.event_status));
      END
    `);

    // ========================================
    // 7. CREATE SAMPLE DATA (PRODUCTION-READY USERS)
    // ========================================

    console.log("\n👥 Creating production-ready user accounts...");

    // Check if head admin exists
    const [adminRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["admin@cedo.gov.ph"]);
    let adminId = null;

    if (adminRows.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("CEDOAdmin2024!@#", salt);

      const [result] = await connection.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_at) 
        VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())
      `, [
        "CEDO Head Administrator",
        "admin@cedo.gov.ph",
        hashedPassword,
        "head_admin",
        "City Economic Development Office",
        "internal"
      ]);

      adminId = result.insertId;
      console.log("✅ Head Admin user created");
    } else {
      adminId = adminRows[0].id;
      console.log("ℹ️  Head Admin user already exists");
    }

    // Create system manager
    const [managerRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["manager@cedo.gov.ph"]);
    if (managerRows.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("CEDOManager2024!@#", salt);

      await connection.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) 
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW())
      `, [
        "CEDO System Manager",
        "manager@cedo.gov.ph",
        hashedPassword,
        "manager",
        "City Economic Development Office",
        "internal",
        adminId
      ]);

      console.log("✅ System Manager user created");
    } else {
      console.log("ℹ️  System Manager user already exists");
    }

    // Create sample reviewer
    const [reviewerRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["reviewer@cedo.gov.ph"]);
    if (reviewerRows.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("CEDOReviewer2024!@#", salt);

      await connection.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) 
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW())
      `, [
        "CEDO Proposal Reviewer",
        "reviewer@cedo.gov.ph",
        hashedPassword,
        "reviewer",
        "CEDO Review Department",
        "internal",
        adminId
      ]);

      console.log("✅ Reviewer user created");
    } else {
      console.log("ℹ️  Reviewer user already exists");
    }

    // Create sample student account
    const [studentRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["student@xu.edu.ph"]);
    if (studentRows.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("StudentDemo2024!", salt);

      await connection.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) 
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW())
      `, [
        "Demo Student User",
        "student@xu.edu.ph",
        hashedPassword,
        "student",
        "Xavier University",
        "external",
        adminId
      ]);

      console.log("✅ Demo Student user created");
    } else {
      console.log("ℹ️  Demo Student user already exists");
    }

    // Create sample pending user for testing approval workflow
    const [pendingRows] = await connection.query("SELECT * FROM users WHERE email = ?", ["pending@example.com"]);
    if (pendingRows.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("PendingUser2024!", salt);

      await connection.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved) 
        VALUES (?, ?, ?, ?, ?, ?, FALSE)
      `, [
        "Pending Approval User",
        "pending@example.com",
        hashedPassword,
        "student",
        "Test Organization",
        "external"
      ]);

      console.log("✅ Pending approval user created (for testing)");
    } else {
      console.log("ℹ️  Pending approval user already exists");
    }

    // ========================================
    // 8. CREATE SAMPLE ORGANIZATIONS
    // ========================================

    console.log("\n🏢 Creating sample organizations...");

    const sampleOrganizations = [
      {
        name: "City Economic Development Office",
        description: "Main government office for economic development initiatives",
        contact_name: "CEDO Administrator",
        contact_email: "admin@cedo.gov.ph",
        contact_phone: "+63-88-123-4567",
        organization_type: "school-based"
      },
      {
        name: "Xavier University",
        description: "Premier educational institution in Cagayan de Oro",
        contact_name: "University Coordinator",
        contact_email: "coordinator@xu.edu.ph",
        contact_phone: "+63-88-999-8888",
        organization_type: "school-based"
      },
      {
        name: "Cagayan de Oro Community Foundation",
        description: "Non-profit organization supporting community development",
        contact_name: "Foundation Director",
        contact_email: "director@cdocf.org",
        contact_phone: "+63-88-777-6666",
        organization_type: "community-based"
      }
    ];

    for (const org of sampleOrganizations) {
      const [existingOrg] = await connection.query("SELECT id FROM organizations WHERE name = ?", [org.name]);
      if (existingOrg.length === 0) {
        await connection.query(`
          INSERT INTO organizations (name, description, contact_name, contact_email, contact_phone, organization_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [org.name, org.description, org.contact_name, org.contact_email, org.contact_phone, org.organization_type]);
        console.log(`✅ Organization '${org.name}' created`);
      } else {
        console.log(`ℹ️  Organization '${org.name}' already exists`);
      }
    }

    // ========================================
    // 9. PERFORMANCE OPTIMIZATION
    // ========================================

    console.log("\n⚡ Optimizing database performance...");

    // Analyze tables for optimization
    await connection.query("ANALYZE TABLE users, proposals, audit_logs, organizations, sessions");
    console.log("✅ Table analysis completed");

    // ========================================
    // 10. FINAL VERIFICATION
    // ========================================

    console.log("\n🔍 Performing final verification...");

    // Verify table creation
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    const expectedTables = ['users', 'proposals', 'audit_logs', 'organizations', 'sessions'];

    for (const table of expectedTables) {
      if (tableNames.includes(table)) {
        console.log(`✅ Table '${table}' verified`);
      } else {
        console.error(`❌ Table '${table}' missing`);
      }
    }

    // Verify user accounts
    const [userCount] = await connection.query("SELECT COUNT(*) as count FROM users WHERE is_approved = TRUE");
    console.log(`✅ ${userCount[0].count} approved users in system`);

    // Verify organizations
    const [orgCount] = await connection.query("SELECT COUNT(*) as count FROM organizations");
    console.log(`✅ ${orgCount[0].count} organizations in system`);

    console.log("\n🎉 MySQL Database initialization completed successfully!");
    console.log("\n📋 Summary of created accounts:");
    console.log("1. Head Admin      - admin@cedo.gov.ph (Password: CEDOAdmin2024!@#)");
    console.log("2. System Manager  - manager@cedo.gov.ph (Password: CEDOManager2024!@#)");
    console.log("3. Reviewer        - reviewer@cedo.gov.ph (Password: CEDOReviewer2024!@#)");
    console.log("4. Demo Student    - student@xu.edu.ph (Password: StudentDemo2024!)");
    console.log("5. Pending User    - pending@example.com (Password: PendingUser2024!) - NEEDS APPROVAL");
    console.log("\n⚠️  IMPORTANT: Change these default passwords in production!");
    console.log("📊 Database is now ready for the CEDO Event Management System");

  } catch (error) {
    console.error("\n❌ Database initialization failed:", error.message);
    console.error("🔧 Error details:", error);

    // Troubleshooting guidance
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Verify MySQL server is running");
    console.log("2. Check database credentials in environment variables");
    console.log("3. Ensure MySQL user has sufficient privileges");
    console.log("4. Check network connectivity to MySQL server");
    console.log("5. Verify MySQL version compatibility (5.7+ recommended)");

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 MySQL connection closed");
    }
  }
}

// Execute if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
