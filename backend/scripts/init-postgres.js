require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { Pool } = require('pg');
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// ========================================
// CEDO PostgreSQL Database Initializer
// Based on CEDO_ERD_Data_Model.md
// Production-ready with comprehensive error handling
// 
// Recent Changes (2025-07-19):
// - Added indexes for proposal status transition optimization
// - Added TransitionProposalStatus function for status management
// - Added pending_proposals_for_review view for admin workflow
// - Enhanced audit logging for status transitions
// ========================================

console.log("🛠️  CEDO PostgreSQL Database Initializer starting...");
console.log("📋 Based on CEDO_ERD_Data_Model.md specifications");

// Environment variables with fallbacks
const dbConfig = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "",
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || "cedo_auth",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

console.log(`🔗 Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port} with user ${dbConfig.user}`);
console.log(`📊 Target database: ${dbConfig.database}`);

// Utility function for safe table creation
async function createTableIfNotExists(pool, tableName, createSQL) {
    try {
        const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);

        if (!result.rows[0].exists) {
            console.log(`📝 Creating table: ${tableName}`);
            await pool.query(createSQL);
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
async function addColumnIfNotExists(pool, tableName, columnName, columnDefinition) {
    try {
        const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      );
    `, [tableName, columnName]);

        if (!result.rows[0].exists) {
            console.log(`📝 Adding column '${columnName}' to table '${tableName}'`);
            await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            console.log(`✅ Column '${columnName}' added successfully`);
        }
    } catch (error) {
        console.error(`❌ Error adding column '${columnName}' to '${tableName}':`, error.message);
        throw error;
    }
}

// Utility function for safe index creation
async function createIndexIfNotExists(pool, tableName, indexName, indexDefinition) {
    try {
        const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = $1 
        AND indexname = $2
      );
    `, [tableName, indexName]);

        if (!result.rows[0].exists) {
            console.log(`📝 Creating index '${indexName}' on table '${tableName}'`);
            await pool.query(`CREATE INDEX ${indexName} ON ${tableName} ${indexDefinition}`);
            console.log(`✅ Index '${indexName}' created successfully`);
        }
    } catch (error) {
        console.error(`❌ Error creating index '${indexName}' on '${tableName}':`, error.message);
        throw error;
    }
}

// Main initialization function
async function initializeDatabase() {
    let pool;

    try {
        // ========================================
        // 1. ESTABLISH DATABASE CONNECTION
        // ========================================

        console.log("\n🔌 Establishing database connection...");
        pool = new Pool(dbConfig);

        // Test connection
        const client = await pool.connect();
        console.log("✅ Connected to PostgreSQL server");
        client.release();

        // ========================================
        // 2. CREATE EXTENSIONS AND ENUM TYPES
        // ========================================

        console.log("\n🔧 Creating required extensions and enum types...");

        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            console.log("✅ UUID extension enabled");
        } catch (error) {
            console.warn("⚠️  UUID extension warning:", error.message);
        }

        // Create enum types
        const enumTypes = [
            { name: 'role_type', values: "'student','partner','admin','head_admin','manager','reviewer'" },
            { name: 'organization_type_enum', values: "'internal','external','school-based','community-based'" },
            { name: 'event_mode_enum', values: "'offline','online','hybrid'" },
            { name: 'proposal_status_enum', values: "'draft','pending','approved','denied','revision_requested'" },
            { name: 'report_status_enum', values: "'draft','pending','approved','denied','not_applicable'" },
            { name: 'event_status_enum', values: "'scheduled','ongoing','completed','cancelled','postponed'" },
            { name: 'file_type_enum', values: "'gpoa','proposal','accomplishment','attendance','other'" },
            { name: 'notification_type_enum', values: "'proposal_status_change'" }
        ];

        for (const enumType of enumTypes) {
            try {
                await pool.query(`
                    DO $$ BEGIN
                        CREATE TYPE ${enumType.name} AS ENUM (${enumType.values});
                    EXCEPTION WHEN duplicate_object THEN NULL; 
                    END $$;
                `);
                console.log(`✅ Enum type '${enumType.name}' created`);
            } catch (error) {
                console.warn(`⚠️  Enum type '${enumType.name}' warning:`, error.message);
            }
        }

        // ========================================
        // 3. CREATE CORE TABLES (Based on ERD Model)
        // ========================================

        console.log("\n📋 Creating core tables based on ERD model...");

        // 3.1 USERS TABLE - Core user management
        await createTableIfNotExists(pool, "users", `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT,
        role role_type NOT NULL DEFAULT 'student',
        organization VARCHAR(255),
        organization_type organization_type_enum,
        organization_description TEXT,
        phone_number VARCHAR(20),
        avatar VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        is_approved BOOLEAN DEFAULT FALSE,
        approved_by INTEGER,
        approved_at TIMESTAMP NULL,
        password_reset_required BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for users table
        await createIndexIfNotExists(pool, "users", "idx_users_email", "(email)");
        await createIndexIfNotExists(pool, "users", "idx_users_google_id", "(google_id)");
        await createIndexIfNotExists(pool, "users", "idx_users_role", "(role)");
        await createIndexIfNotExists(pool, "users", "idx_users_is_approved", "(is_approved)");
        await createIndexIfNotExists(pool, "users", "idx_users_organization_type", "(organization_type)");
        await createIndexIfNotExists(pool, "users", "idx_users_created_at", "(created_at)");

        // Add foreign key constraint
        try {
            await pool.query(`
        ALTER TABLE users ADD CONSTRAINT fk_users_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      `);
            console.log("✅ Foreign key constraint added to users table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraint warning:", error.message);
        }

        // 3.2 PROPOSALS TABLE - Simplified metadata as per ERD
        await createTableIfNotExists(pool, "proposals", `
      CREATE TABLE proposals (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        
        -- Organization Information
        organization_name VARCHAR(255) NOT NULL,
        organization_type organization_type_enum NOT NULL,
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
        event_mode event_mode_enum DEFAULT 'offline',
        
        -- Event Types
        school_event_type VARCHAR(30) CHECK (school_event_type IN ('academic-enhancement', 'workshop-seminar-webinar', 'conference', 'competition', 'cultural-show', 'sports-fest', 'other')),
        school_return_service_credit VARCHAR(15) CHECK (school_return_service_credit IN ('1', '2', '3', 'Not Applicable')),
        school_target_audience JSONB,
        community_event_type VARCHAR(30) CHECK (community_event_type IN ('academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others')),
        community_sdp_credits VARCHAR(5) CHECK (community_sdp_credits IN ('1', '2')),
        community_target_audience JSONB,
        
        -- Status Management
        current_section VARCHAR(20) CHECK (current_section IN ('overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting')),
        has_active_proposal BOOLEAN DEFAULT FALSE,
        proposal_status proposal_status_enum DEFAULT 'draft',
        report_status report_status_enum DEFAULT 'draft',
        event_status event_status_enum DEFAULT 'scheduled',
        
        -- Additional Information
        attendance_count INTEGER DEFAULT 0,
        objectives TEXT,
        budget DECIMAL(10,2) DEFAULT 0.00,
        volunteers_needed INTEGER DEFAULT 0,
        digital_signature TEXT,
        report_description TEXT,
        admin_comments TEXT,
        
        -- Audit Information
        reviewed_by_admin_id INTEGER,
        reviewed_at TIMESTAMP NULL,
        submitted_at TIMESTAMP NULL,
        approved_at TIMESTAMP NULL,
        validation_errors JSONB,
        form_completion_percentage DECIMAL(5,2) DEFAULT 0.00,
        
        -- Meta Information
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- User Relationship
        user_id INTEGER
      )
    `);

        // Create indexes for proposals table
        const proposalIndexes = [
            { name: "idx_proposals_organization_name", definition: "(organization_name)" },
            { name: "idx_proposals_contact_email", definition: "(contact_email)" },
            { name: "idx_proposals_proposal_status", definition: "(proposal_status)" },
            { name: "idx_proposals_event_status", definition: "(event_status)" },
            { name: "idx_proposals_organization_type", definition: "(organization_type)" },
            { name: "idx_proposals_event_dates", definition: "(event_start_date, event_end_date)" },
            { name: "idx_proposals_is_deleted", definition: "(is_deleted)" },
            { name: "idx_proposals_user_id", definition: "(user_id)" },
            { name: "idx_proposals_uuid", definition: "(uuid)" },
            { name: "idx_proposals_current_section", definition: "(current_section)" },
            { name: "idx_proposals_has_active_proposal", definition: "(has_active_proposal)" },
            { name: "idx_proposals_status_type", definition: "(proposal_status, organization_type)" },
            { name: "idx_proposals_active_proposals", definition: "(is_deleted, proposal_status, created_at)" },
            { name: "idx_proposals_user_status", definition: "(user_id, proposal_status)" },
            { name: "idx_proposals_submitted_at", definition: "(submitted_at)" },
            { name: "idx_proposals_form_completion", definition: "(form_completion_percentage)" },
            { name: "idx_proposals_status_completion", definition: "(proposal_status, form_completion_percentage)" }
        ];

        for (const index of proposalIndexes) {
            await createIndexIfNotExists(pool, "proposals", index.name, index.definition);
        }

        // Add foreign key constraints for proposals
        try {
            await pool.query(`
        ALTER TABLE proposals ADD CONSTRAINT fk_proposals_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
            await pool.query(`
        ALTER TABLE proposals ADD CONSTRAINT fk_proposals_reviewed_by_admin_id 
        FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
      `);
            console.log("✅ Foreign key constraints added to proposals table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraints warning:", error.message);
        }

        // 3.3 AUDIT_LOGS TABLE - Comprehensive audit trail
        await createTableIfNotExists(pool, "audit_logs", `
      CREATE TABLE audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER,
        action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT')),
        table_name VARCHAR(50) NOT NULL,
        record_id BIGINT,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        session_id VARCHAR(255),
        additional_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for audit_logs table
        const auditIndexes = [
            { name: "idx_audit_logs_user_id", definition: "(user_id)" },
            { name: "idx_audit_logs_action_type", definition: "(action_type)" },
            { name: "idx_audit_logs_table_record", definition: "(table_name, record_id)" },
            { name: "idx_audit_logs_created_at", definition: "(created_at)" },
            { name: "idx_audit_logs_ip_address", definition: "(ip_address)" },
            { name: "idx_audit_logs_session_id", definition: "(session_id)" }
        ];

        for (const index of auditIndexes) {
            await createIndexIfNotExists(pool, "audit_logs", index.name, index.definition);
        }

        // Add foreign key constraint for audit_logs
        try {
            await pool.query(`
        ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
            console.log("✅ Foreign key constraint added to audit_logs table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraint warning:", error.message);
        }

        // 3.4 ORGANIZATIONS TABLE - Organization management
        await createTableIfNotExists(pool, "organizations", `
      CREATE TABLE organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(32),
        organization_type organization_type_enum NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for organizations table
        const orgIndexes = [
            { name: "idx_organizations_name", definition: "(name)" },
            { name: "idx_organizations_type", definition: "(organization_type)" },
            { name: "idx_organizations_is_active", definition: "(is_active)" },
            { name: "idx_organizations_contact_email", definition: "(contact_email)" }
        ];

        for (const index of orgIndexes) {
            await createIndexIfNotExists(pool, "organizations", index.name, index.definition);
        }

        // 3.5 SESSIONS TABLE - Session management
        await createTableIfNotExists(pool, "sessions", `
      CREATE TABLE sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INTEGER,
        expires_at TIMESTAMP NOT NULL,
        data JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for sessions table
        const sessionIndexes = [
            { name: "idx_sessions_user_id", definition: "(user_id)" },
            { name: "idx_sessions_expires_at", definition: "(expires_at)" },
            { name: "idx_sessions_is_active", definition: "(is_active)" },
            { name: "idx_sessions_ip_address", definition: "(ip_address)" }
        ];

        for (const index of sessionIndexes) {
            await createIndexIfNotExists(pool, "sessions", index.name, index.definition);
        }

        // Add foreign key constraint for sessions
        try {
            await pool.query(`
        ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
            console.log("✅ Foreign key constraint added to sessions table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraint warning:", error.message);
        }

        // 3.6 PROPOSAL_FILES TABLE - File metadata for proposals
        await createTableIfNotExists(pool, "proposal_files", `
      CREATE TABLE proposal_files (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        proposal_id BIGINT,
        uploaded_by INTEGER,
        file_type file_type_enum NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mimetype VARCHAR(127),
        size BIGINT CHECK (size >= 0),
        gridfs_id VARCHAR(24),
        organization_id VARCHAR(64),
        section VARCHAR(64),
        purpose VARCHAR(255),
        is_deleted BOOLEAN DEFAULT FALSE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for proposal_files
        const proposalFileIndexes = [
            { name: "idx_proposal_files_proposal_id", definition: "(proposal_id)" },
            { name: "idx_proposal_files_uploaded_by", definition: "(uploaded_by)" },
            { name: "idx_proposal_files_file_type", definition: "(file_type)" },
            { name: "idx_proposal_files_gridfs_id", definition: "(gridfs_id)" },
            { name: "idx_proposal_files_organization_id", definition: "(organization_id)" },
            { name: "idx_proposal_files_active_files", definition: "(is_deleted, uploaded_at DESC)" }
        ];

        for (const index of proposalFileIndexes) {
            await createIndexIfNotExists(pool, "proposal_files", index.name, index.definition);
        }

        // Add foreign key constraints for proposal_files
        try {
            await pool.query(`
        ALTER TABLE proposal_files ADD CONSTRAINT fk_proposal_files_proposal_id 
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
      `);
            await pool.query(`
        ALTER TABLE proposal_files ADD CONSTRAINT fk_proposal_files_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      `);
            console.log("✅ Foreign key constraints added to proposal_files table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraints warning:", error.message);
        }

        // 3.7 ACCOMPLISHMENT_REPORTS TABLE - Post-event reporting
        await createTableIfNotExists(pool, "accomplishment_reports", `
      CREATE TABLE accomplishment_reports (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        proposal_id BIGINT UNIQUE,
        status proposal_status_enum NOT NULL,
        report_data JSONB,
        submitted_at TIMESTAMP NULL,
        reviewed_at TIMESTAMP NULL,
        admin_comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for accomplishment_reports
        const accomplishmentIndexes = [
            { name: "idx_accomplishment_reports_status", definition: "(status)" },
            { name: "idx_accomplishment_reports_submitted_at", definition: "(submitted_at DESC)" }
        ];

        for (const index of accomplishmentIndexes) {
            await createIndexIfNotExists(pool, "accomplishment_reports", index.name, index.definition);
        }

        // Add foreign key constraint for accomplishment_reports
        try {
            await pool.query(`
        ALTER TABLE accomplishment_reports ADD CONSTRAINT fk_accomplishment_reports_proposal_id 
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
      `);
            console.log("✅ Foreign key constraint added to accomplishment_reports table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraint warning:", error.message);
        }

        // 3.8 FILE_UPLOADS TABLE - File action audit log
        await createTableIfNotExists(pool, "file_uploads", `
      CREATE TABLE file_uploads (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        proposal_id BIGINT,
        uploaded_by INTEGER,
        action VARCHAR(16) NOT NULL CHECK (action IN ('upload', 'delete', 'replace', 'view', 'download')),
        file_name VARCHAR(255),
        file_type VARCHAR(64),
        file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
        gridfs_id VARCHAR(24),
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for file_uploads
        const fileUploadIndexes = [
            { name: "idx_file_uploads_proposal_id", definition: "(proposal_id)" },
            { name: "idx_file_uploads_uploaded_by", definition: "(uploaded_by)" },
            { name: "idx_file_uploads_action", definition: "(action)" },
            { name: "idx_file_uploads_timestamp_desc", definition: "(timestamp DESC)" },
            { name: "idx_file_uploads_proposal_action_time", definition: "(proposal_id, action, timestamp DESC)" }
        ];

        for (const index of fileUploadIndexes) {
            await createIndexIfNotExists(pool, "file_uploads", index.name, index.definition);
        }

        // Add foreign key constraints for file_uploads
        try {
            await pool.query(`
        ALTER TABLE file_uploads ADD CONSTRAINT fk_file_uploads_proposal_id 
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
      `);
            await pool.query(`
        ALTER TABLE file_uploads ADD CONSTRAINT fk_file_uploads_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      `);
            console.log("✅ Foreign key constraints added to file_uploads table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraints warning:", error.message);
        }

        // 3.9 EMAIL_SMTP_CONFIG TABLE - Outbound email settings
        await createTableIfNotExists(pool, "email_smtp_config", `
      CREATE TABLE email_smtp_config (
        id SERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        smtp_server VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL CHECK (smtp_port > 0),
        use_ssl BOOLEAN NOT NULL DEFAULT TRUE,
        username VARCHAR(255) NOT NULL,
        password TEXT,
        encrypted_password BYTEA,
        from_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (password IS NOT NULL OR encrypted_password IS NOT NULL)
      )
    `);

        // Create indexes for email_smtp_config
        const emailSmtpIndexes = [
            { name: "idx_email_smtp_config_server", definition: "(smtp_server)" },
            { name: "idx_email_smtp_config_from_email", definition: "(from_email)" }
        ];

        for (const index of emailSmtpIndexes) {
            await createIndexIfNotExists(pool, "email_smtp_config", index.name, index.definition);
        }

        // Add unique constraint for from_email
        try {
            await pool.query(`
        ALTER TABLE email_smtp_config ADD CONSTRAINT uq_email_smtp_config_from_email UNIQUE (from_email)
      `);
            console.log("✅ Unique constraint added to email_smtp_config table");
        } catch (error) {
            console.warn("⚠️  Unique constraint warning:", error.message);
        }

        // 3.10 NOTIFICATIONS TABLE - In-app/user notifications
        await createTableIfNotExists(pool, "notifications", `
      CREATE TABLE notifications (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        recipient_id INTEGER NOT NULL,
        sender_id INTEGER,
        notification_type notification_type_enum NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        related_proposal_id BIGINT,
        related_proposal_uuid VARCHAR(36)
      )
    `);

        // Create indexes for notifications
        const notificationIndexes = [
            { name: "idx_notifications_recipient_id", definition: "(recipient_id)" },
            { name: "idx_notifications_is_read", definition: "(is_read)" },
            { name: "idx_notifications_type", definition: "(notification_type)" },
            { name: "idx_notifications_created_at", definition: "(created_at)" },
            { name: "idx_notifications_related_proposal", definition: "(related_proposal_id)" }
        ];

        for (const index of notificationIndexes) {
            await createIndexIfNotExists(pool, "notifications", index.name, index.definition);
        }

        // Add foreign key constraints for notifications
        try {
            await pool.query(`
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_recipient_id 
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
      `);
            await pool.query(`
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sender_id 
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
      `);
            await pool.query(`
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_related_proposal_id 
        FOREIGN KEY (related_proposal_id) REFERENCES proposals(id) ON DELETE SET NULL
      `);
            console.log("✅ Foreign key constraints added to notifications table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraints warning:", error.message);
        }

        // 3.11 PROPOSAL_COMMENTS TABLE - Minimal chatbox for proposals
        await createTableIfNotExists(pool, "proposal_comments", `
      CREATE TABLE proposal_comments (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        proposal_id BIGINT NOT NULL,
        author_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create indexes for proposal_comments
        const proposalCommentIndexes = [
            { name: "idx_proposal_comments_proposal_id", definition: "(proposal_id)" },
            { name: "idx_proposal_comments_author_id", definition: "(author_id)" },
            { name: "idx_proposal_comments_created_at", definition: "(created_at)" }
        ];

        for (const index of proposalCommentIndexes) {
            await createIndexIfNotExists(pool, "proposal_comments", index.name, index.definition);
        }

        // Add foreign key constraints for proposal_comments
        try {
            await pool.query(`
        ALTER TABLE proposal_comments ADD CONSTRAINT fk_proposal_comments_proposal_id 
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
      `);
            await pool.query(`
        ALTER TABLE proposal_comments ADD CONSTRAINT fk_proposal_comments_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      `);
            console.log("✅ Foreign key constraints added to proposal_comments table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraints warning:", error.message);
        }

        // 3.12 EMAIL_OUTBOX TABLE - Email queue restricted to admin roles
        await createTableIfNotExists(pool, "email_outbox", `
      CREATE TABLE email_outbox (
        id BIGSERIAL PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE DEFAULT uuid_generate_v4()::text,
        sender_user_id INTEGER NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        to_email VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed')),
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP NULL
      )
    `);

        // Create indexes for email_outbox
        const emailOutboxIndexes = [
            { name: "idx_email_outbox_status_created_at", definition: "(status, created_at DESC)" },
            { name: "idx_email_outbox_sender_user_id", definition: "(sender_user_id)" },
            { name: "idx_email_outbox_from_email", definition: "(from_email)" }
        ];

        for (const index of emailOutboxIndexes) {
            await createIndexIfNotExists(pool, "email_outbox", index.name, index.definition);
        }

        // Add foreign key constraints for email_outbox
        try {
            await pool.query(`
        ALTER TABLE email_outbox ADD CONSTRAINT fk_email_outbox_sender_user_id
        FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
            await pool.query(`
        ALTER TABLE email_outbox ADD CONSTRAINT fk_email_outbox_from_email
        FOREIGN KEY (from_email) REFERENCES email_smtp_config(from_email) ON DELETE RESTRICT
      `);
            console.log("✅ Foreign key constraints added to email_outbox table");
        } catch (error) {
            console.warn("⚠️  Foreign key constraints warning:", error.message);
        }

        // Add SMTP linkage constraint for organizations
        try {
            await pool.query(`
        ALTER TABLE organizations ADD CONSTRAINT fk_organizations_contact_email_smtp
        FOREIGN KEY (contact_email) REFERENCES email_smtp_config(from_email) ON DELETE RESTRICT
      `);
            console.log("✅ SMTP linkage constraint added to organizations table");
        } catch (error) {
            console.warn("⚠️  SMTP linkage constraint warning:", error.message);
        }

        // ========================================
        // 4. CREATE TRIGGERS FOR UPDATED_AT
        // ========================================

        console.log("\n🔔 Creating updated_at triggers...");

        // Function to update updated_at timestamp
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);
            console.log("✅ Updated_at trigger function created");

            // Create triggers for updated_at
            const triggerTables = ['users', 'proposals', 'organizations', 'sessions'];
            for (const table of triggerTables) {
                try {
                    await pool.query(`
            DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}
          `);
                    await pool.query(`
            CREATE TRIGGER update_${table}_updated_at BEFORE UPDATE ON ${table} 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
          `);
                    console.log(`✅ Updated_at trigger created for ${table}`);
                } catch (error) {
                    console.warn(`⚠️  Trigger warning for ${table}:`, error.message);
                }
            }
        } catch (error) {
            console.warn("⚠️  Trigger function warning:", error.message);
        }

        // ========================================
        // 5. CREATE DATABASE VIEWS
        // ========================================

        console.log("\n📊 Creating database views...");

        // 5.1 Active Users View
        try {
            await pool.query(`
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
            console.log("✅ Active users view created");
        } catch (error) {
            console.warn("⚠️  Active users view warning:", error.message);
        }

        // 5.2 Proposal Summary View
        try {
            await pool.query(`
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
            console.log("✅ Proposal summary view created");
        } catch (error) {
            console.warn("⚠️  Proposal summary view warning:", error.message);
        }

        // 5.3 Audit Activity View
        try {
            await pool.query(`
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
        WHERE a.created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
        ORDER BY a.created_at DESC
      `);
            console.log("✅ Recent audit activity view created");
        } catch (error) {
            console.warn("⚠️  Recent audit activity view warning:", error.message);
        }

        // 5.4 Pending Proposals for Review View
        try {
            await pool.query(`
        CREATE OR REPLACE VIEW pending_proposals_for_review AS
        SELECT 
          p.id,
          p.uuid,
          p.organization_name,
          p.organization_type,
          p.event_name,
          p.event_venue,
          p.event_start_date,
          p.event_end_date,
          p.proposal_status,
          p.form_completion_percentage,
          p.submitted_at,
          p.current_section,
          u.name as submitter_name,
          u.email as submitter_email,
          p.created_at,
          p.updated_at,
          CASE 
            WHEN p.organization_type = 'school-based' THEN p.school_event_type
            WHEN p.organization_type = 'community-based' THEN p.community_event_type
            ELSE NULL
          END as event_type
        FROM proposals p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.proposal_status = 'pending' 
          AND p.is_deleted = FALSE
          AND p.form_completion_percentage >= 100.00
        ORDER BY p.submitted_at ASC, p.created_at ASC
      `);
            console.log("✅ Pending proposals for review view created");
        } catch (error) {
            console.warn("⚠️  Pending proposals for review view warning:", error.message);
        }

        // ========================================
        // 6. CREATE FUNCTIONS
        // ========================================

        console.log("\n⚙️  Creating database functions...");

        // 6.1 User Approval Function
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION approve_user(
          p_user_id INTEGER,
          p_approved_by INTEGER,
          p_admin_ip VARCHAR(45)
        )
        RETURNS VOID AS $$
        BEGIN
          UPDATE users 
          SET is_approved = TRUE, 
              approved_by = p_approved_by, 
              approved_at = CURRENT_TIMESTAMP
          WHERE id = p_user_id;
          
          INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, new_values)
          VALUES (p_approved_by, 'APPROVE', 'users', p_user_id, p_admin_ip, 
                  json_build_object('approved', TRUE, 'approved_at', CURRENT_TIMESTAMP));
        END;
        $$ LANGUAGE plpgsql
      `);
            console.log("✅ User approval function created");
        } catch (error) {
            console.warn("⚠️  User approval function warning:", error.message);
        }

        // 6.2 Proposal Review Function
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION review_proposal(
          p_proposal_id BIGINT,
          p_reviewer_id INTEGER,
          p_status proposal_status_enum,
          p_comments TEXT,
          p_reviewer_ip VARCHAR(45)
        )
        RETURNS VOID AS $$
        BEGIN
          UPDATE proposals 
          SET proposal_status = p_status,
              admin_comments = p_comments,
              reviewed_by_admin_id = p_reviewer_id,
              reviewed_at = CURRENT_TIMESTAMP,
              approved_at = CASE WHEN p_status = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END
          WHERE id = p_proposal_id;
          
          INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, new_values)
          VALUES (p_reviewer_id, 'UPDATE', 'proposals', p_proposal_id, p_reviewer_ip,
                  json_build_object('status', p_status, 'comments', p_comments, 'reviewed_at', CURRENT_TIMESTAMP));

          INSERT INTO notifications (
            recipient_id,
            sender_id,
            notification_type,
            message,
            related_proposal_id,
            related_proposal_uuid
          )
          SELECT 
            user_id AS recipient_id,
            p_reviewer_id AS sender_id,
            'proposal_status_change'::notification_type_enum AS notification_type,
            ('Your proposal status has been updated to ' || p_status)::TEXT AS message,
            id AS related_proposal_id,
            uuid AS related_proposal_uuid
          FROM proposals
          WHERE id = p_proposal_id;

          PERFORM pg_notify(
            'proposal_events',
            json_build_object(
              'event', 'proposal_status_change',
              'proposal_id', p_proposal_id,
              'new_status', p_status,
              'reviewer_id', p_reviewer_id,
              'timestamp', to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD"T"HH24:MI:SS.MS')
            )::text
          );
        END;
        $$ LANGUAGE plpgsql
      `);
            console.log("✅ Proposal review function created");
        } catch (error) {
            console.warn("⚠️  Proposal review function warning:", error.message);
        }

        // 6.3 Proposal Status Transition Function
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION transition_proposal_status(
          p_proposal_id BIGINT,
          p_new_status proposal_status_enum,
          p_completion_percentage DECIMAL(5,2),
          p_user_id INTEGER,
          p_user_ip VARCHAR(45)
        )
        RETURNS VOID AS $$
        DECLARE
          current_status proposal_status_enum;
        BEGIN
          SELECT proposal_status INTO current_status FROM proposals WHERE id = p_proposal_id;
          
          IF p_new_status = 'pending' AND current_status = 'draft' THEN
            UPDATE proposals 
            SET proposal_status = 'pending',
                submitted_at = CURRENT_TIMESTAMP,
                form_completion_percentage = p_completion_percentage,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_proposal_id;
            
          ELSIF p_new_status = 'pending' AND current_status = 'pending' THEN
            UPDATE proposals 
            SET form_completion_percentage = p_completion_percentage,
                submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_proposal_id;
            
          ELSIF current_status IN ('approved', 'denied') THEN
            UPDATE proposals 
            SET form_completion_percentage = p_completion_percentage,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_proposal_id;
            
          ELSE
            UPDATE proposals 
            SET proposal_status = p_new_status,
                form_completion_percentage = p_completion_percentage,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_proposal_id;
          END IF;
          
          INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, old_values, new_values)
          VALUES (p_user_id, 'UPDATE', 'proposals', p_proposal_id, p_user_ip,
                  json_build_object('old_status', current_status, 'old_completion', (SELECT form_completion_percentage FROM proposals WHERE id = p_proposal_id)),
                  json_build_object('new_status', p_new_status, 'new_completion', p_completion_percentage, 'transition_at', CURRENT_TIMESTAMP));
        END;
        $$ LANGUAGE plpgsql
      `);
            console.log("✅ Proposal status transition function created");
        } catch (error) {
            console.warn("⚠️  Proposal status transition function warning:", error.message);
        }

        // 6.4 Dashboard Statistics Function
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION get_dashboard_stats()
        RETURNS TABLE(
          approved_users BIGINT,
          pending_users BIGINT,
          total_proposals BIGINT,
          pending_proposals BIGINT,
          approved_proposals BIGINT,
          denied_proposals BIGINT,
          recent_activities BIGINT,
          active_sessions BIGINT
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            (SELECT COUNT(*) FROM users WHERE is_approved = TRUE)::BIGINT as approved_users,
            (SELECT COUNT(*) FROM users WHERE is_approved = FALSE)::BIGINT as pending_users,
            (SELECT COUNT(*) FROM proposals WHERE is_deleted = FALSE)::BIGINT as total_proposals,
            (SELECT COUNT(*) FROM proposals WHERE proposal_status = 'pending' AND is_deleted = FALSE)::BIGINT as pending_proposals,
            (SELECT COUNT(*) FROM proposals WHERE proposal_status = 'approved' AND is_deleted = FALSE)::BIGINT as approved_proposals,
            (SELECT COUNT(*) FROM proposals WHERE proposal_status = 'denied' AND is_deleted = FALSE)::BIGINT as denied_proposals,
            (SELECT COUNT(*) FROM audit_logs WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL '24 hours'))::BIGINT as recent_activities,
            (SELECT COUNT(DISTINCT user_id) FROM sessions WHERE is_active = TRUE AND expires_at > CURRENT_TIMESTAMP)::BIGINT as active_sessions;
        END;
        $$ LANGUAGE plpgsql
      `);
            console.log("✅ Dashboard statistics function created");
        } catch (error) {
            console.warn("⚠️  Dashboard statistics function warning:", error.message);
        }

        // ========================================
        // 7. CREATE AUDIT TRIGGERS
        // ========================================

        console.log("\n🔍 Creating audit triggers...");

        // 7.1 Users Table Audit Trigger
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION users_audit_trigger_function()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values)
          VALUES (NEW.id, 'UPDATE', 'users', NEW.id,
                  json_build_object('name', OLD.name, 'email', OLD.email, 'role', OLD.role, 'is_approved', OLD.is_approved),
                  json_build_object('name', NEW.name, 'email', NEW.email, 'role', NEW.role, 'is_approved', NEW.is_approved));
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
            await pool.query(`
        DROP TRIGGER IF EXISTS users_audit_trigger ON users
      `);
            await pool.query(`
        CREATE TRIGGER users_audit_trigger
        AFTER UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION users_audit_trigger_function()
      `);
            console.log("✅ Users audit trigger created");
        } catch (error) {
            console.warn("⚠️  Users audit trigger warning:", error.message);
        }

        // 7.2 Proposals Table Audit Trigger
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION proposals_audit_trigger_function()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values)
          VALUES (NEW.user_id, 'UPDATE', 'proposals', NEW.id,
                  json_build_object('proposal_status', OLD.proposal_status, 'event_status', OLD.event_status),
                  json_build_object('proposal_status', NEW.proposal_status, 'event_status', NEW.event_status));
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
            await pool.query(`
        DROP TRIGGER IF EXISTS proposals_audit_trigger ON proposals
      `);
            await pool.query(`
        CREATE TRIGGER proposals_audit_trigger
        AFTER UPDATE ON proposals
        FOR EACH ROW
        EXECUTE FUNCTION proposals_audit_trigger_function()
      `);
            console.log("✅ Proposals audit trigger created");
        } catch (error) {
            console.warn("⚠️  Proposals audit trigger warning:", error.message);
        }

        // 7.3 Email Outbox Role Guard Trigger
        try {
            await pool.query(`
        CREATE OR REPLACE FUNCTION email_outbox_role_guard()
        RETURNS TRIGGER AS $$
        DECLARE
          user_role role_type;
        BEGIN
          SELECT role INTO user_role FROM users WHERE id = NEW.sender_user_id;
          IF user_role IS NULL THEN
            RAISE EXCEPTION 'Sender user % does not exist or has no role', NEW.sender_user_id;
          END IF;
          IF user_role NOT IN ('admin','head_admin','manager') THEN
            RAISE EXCEPTION 'User % with role % is not permitted to send emails', NEW.sender_user_id, user_role;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
            await pool.query(`
        DROP TRIGGER IF EXISTS email_outbox_role_guard_trigger ON email_outbox
      `);
            await pool.query(`
        CREATE TRIGGER email_outbox_role_guard_trigger
        BEFORE INSERT ON email_outbox
        FOR EACH ROW
        EXECUTE FUNCTION email_outbox_role_guard()
      `);
            console.log("✅ Email outbox role guard trigger created");
        } catch (error) {
            console.warn("⚠️  Email outbox role guard trigger warning:", error.message);
        }

        // ========================================
        // 8. CREATE SAMPLE DATA (PRODUCTION-READY USERS)
        // ========================================

        console.log("\n👥 Creating production-ready user accounts...");

        // Check if head admin exists
        const adminResult = await pool.query("SELECT * FROM users WHERE email = $1", ["admin@cedo.gov.ph"]);
        let adminId = null;

        if (adminResult.rows.length === 0) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash("CEDOAdmin2024!@#", salt);

            const result = await pool.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
        RETURNING id
      `, [
                "CEDO Head Administrator",
                "admin@cedo.gov.ph",
                hashedPassword,
                "head_admin",
                "City Economic Development Office",
                "internal"
            ]);

            adminId = result.rows[0].id;
            console.log("✅ Head Admin user created");
        } else {
            adminId = adminResult.rows[0].id;
            console.log("ℹ️  Head Admin user already exists");
        }

        // Create system manager
        const managerResult = await pool.query("SELECT * FROM users WHERE email = $1", ["manager@cedo.gov.ph"]);
        if (managerResult.rows.length === 0) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash("CEDOManager2024!@#", salt);

            await pool.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NOW())
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
        const reviewerResult = await pool.query("SELECT * FROM users WHERE email = $1", ["reviewer@cedo.gov.ph"]);
        if (reviewerResult.rows.length === 0) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash("CEDOReviewer2024!@#", salt);

            await pool.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NOW())
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
        const studentResult = await pool.query("SELECT * FROM users WHERE email = $1", ["student@xu.edu.ph"]);
        if (studentResult.rows.length === 0) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash("StudentDemo2024!", salt);

            await pool.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved, approved_by, approved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NOW())
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
        const pendingResult = await pool.query("SELECT * FROM users WHERE email = $1", ["pending@example.com"]);
        if (pendingResult.rows.length === 0) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash("PendingUser2024!", salt);

            await pool.query(`
        INSERT INTO users (name, email, password, role, organization, organization_type, is_approved) 
        VALUES ($1, $2, $3, $4, $5, $6, FALSE)
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
        // 9. CREATE SAMPLE ORGANIZATIONS AND SMTP CONFIG
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
            const existingOrg = await pool.query("SELECT id FROM organizations WHERE name = $1", [org.name]);
            if (existingOrg.rows.length === 0) {
                await pool.query(`
          INSERT INTO organizations (name, description, contact_name, contact_email, contact_phone, organization_type)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [org.name, org.description, org.contact_name, org.contact_email, org.contact_phone, org.organization_type]);
                console.log(`✅ Organization '${org.name}' created`);
            } else {
                console.log(`ℹ️  Organization '${org.name}' already exists`);
            }
        }

        // Create SMTP configurations for organization emails
        console.log("\n📧 Creating SMTP configurations...");

        const smtpConfigs = [
            {
                smtp_server: 'smtp.gmail.com',
                smtp_port: 587,
                use_ssl: true,
                username: 'admin@cedo.gov.ph',
                password: 'PLACEHOLDER_PASSWORD',
                from_email: 'admin@cedo.gov.ph'
            },
            {
                smtp_server: 'smtp.gmail.com',
                smtp_port: 587,
                use_ssl: true,
                username: 'coordinator@xu.edu.ph',
                password: 'PLACEHOLDER_PASSWORD',
                from_email: 'coordinator@xu.edu.ph'
            },
            {
                smtp_server: 'smtp.gmail.com',
                smtp_port: 587,
                use_ssl: true,
                username: 'director@cdocf.org',
                password: 'PLACEHOLDER_PASSWORD',
                from_email: 'director@cdocf.org'
            },
            {
                smtp_server: 'smtp.gmail.com',
                smtp_port: 587,
                use_ssl: true,
                username: 'coordinator@must.edu.ph',
                password: 'PLACEHOLDER_PASSWORD',
                from_email: 'coordinator@must.edu.ph'
            }
        ];

        for (const smtp of smtpConfigs) {
            const existingSmtp = await pool.query("SELECT id FROM email_smtp_config WHERE from_email = $1", [smtp.from_email]);
            if (existingSmtp.rows.length === 0) {
                await pool.query(`
          INSERT INTO email_smtp_config (smtp_server, smtp_port, use_ssl, username, password, from_email)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [smtp.smtp_server, smtp.smtp_port, smtp.use_ssl, smtp.username, smtp.password, smtp.from_email]);
                console.log(`✅ SMTP config for '${smtp.from_email}' created`);
            } else {
                console.log(`ℹ️  SMTP config for '${smtp.from_email}' already exists`);
            }
        }

        // ========================================
        // 10. PERFORMANCE OPTIMIZATION
        // ========================================

        console.log("\n⚡ Optimizing database performance...");

        // Analyze tables for optimization
        const tables = [
            'users', 'proposals', 'audit_logs', 'organizations', 'sessions',
            'proposal_files', 'accomplishment_reports', 'file_uploads',
            'email_smtp_config', 'notifications', 'proposal_comments', 'email_outbox'
        ];
        for (const table of tables) {
            try {
                await pool.query(`ANALYZE ${table}`);
                console.log(`✅ Table ${table} analyzed`);
            } catch (error) {
                console.warn(`⚠️  Analysis warning for ${table}:`, error.message);
            }
        }

        // ========================================
        // 11. FINAL VERIFICATION
        // ========================================

        console.log("\n🔍 Performing final verification...");

        // Verify table creation
        const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
        const tableNames = tablesResult.rows.map(t => t.table_name);
        const expectedTables = [
            'users', 'proposals', 'audit_logs', 'organizations', 'sessions',
            'proposal_files', 'accomplishment_reports', 'file_uploads',
            'email_smtp_config', 'notifications', 'proposal_comments', 'email_outbox'
        ];

        for (const table of expectedTables) {
            if (tableNames.includes(table)) {
                console.log(`✅ Table '${table}' verified`);
            } else {
                console.error(`❌ Table '${table}' missing`);
            }
        }

        // Verify user accounts
        const userCountResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_approved = TRUE");
        console.log(`✅ ${userCountResult.rows[0].count} approved users in system`);

        // Verify organizations
        const orgCountResult = await pool.query("SELECT COUNT(*) as count FROM organizations");
        console.log(`✅ ${orgCountResult.rows[0].count} organizations in system`);

        // Verify SMTP configurations
        const smtpCountResult = await pool.query("SELECT COUNT(*) as count FROM email_smtp_config");
        console.log(`✅ ${smtpCountResult.rows[0].count} SMTP configurations in system`);

        console.log("\n🎉 PostgreSQL Database initialization completed successfully!");
        console.log("\n📋 Summary of created accounts:");
        console.log("1. Head Admin      - admin@cedo.gov.ph (Password: CEDOAdmin2024!@#)");
        console.log("2. System Manager  - manager@cedo.gov.ph (Password: CEDOManager2024!@#)");
        console.log("3. Reviewer        - reviewer@cedo.gov.ph (Password: CEDOReviewer2024!@#)");
        console.log("4. Demo Student    - student@xu.edu.ph (Password: StudentDemo2024!)");
        console.log("5. Pending User    - pending@example.com (Password: PendingUser2024!) - NEEDS APPROVAL");
        console.log("\n⚠️  IMPORTANT: Change these default passwords in production!");
        console.log("📧 SMTP configurations created with placeholder passwords - update in production!");
        console.log("🔒 Email sending restricted to admin, head_admin, and manager roles only");
        console.log("📊 Database is now ready for the CEDO Event Management System");

    } catch (error) {
        console.error("\n❌ Database initialization failed:", error.message);
        console.error("🔧 Error details:", error);

        // Troubleshooting guidance
        console.log("\n🔧 Troubleshooting tips:");
        console.log("1. Verify PostgreSQL server is running");
        console.log("2. Check database credentials in environment variables");
        console.log("3. Ensure PostgreSQL user has sufficient privileges");
        console.log("4. Check network connectivity to PostgreSQL server");
        console.log("5. Verify PostgreSQL version compatibility (12+ recommended)");

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
    initializeDatabase();
}

module.exports = { initializeDatabase };
