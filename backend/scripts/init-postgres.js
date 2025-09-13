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
        // 2. CREATE EXTENSIONS
        // ========================================

        console.log("\n🔧 Creating required extensions...");

        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            console.log("✅ UUID extension enabled");
        } catch (error) {
            console.warn("⚠️  UUID extension warning:", error.message);
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
        password VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'partner', 'admin', 'head_admin', 'manager', 'reviewer')),
        organization VARCHAR(255),
        organization_type VARCHAR(20) CHECK (organization_type IN ('internal', 'external', 'school-based', 'community-based')),
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
        organization_type VARCHAR(20) NOT NULL CHECK (organization_type IN ('internal', 'external', 'school-based', 'community-based')),
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
        event_mode VARCHAR(10) DEFAULT 'offline' CHECK (event_mode IN ('offline', 'online', 'hybrid')),
        
        -- Event Types
        school_event_type VARCHAR(30) CHECK (school_event_type IN ('academic-enhancement', 'workshop-seminar-webinar', 'conference', 'competition', 'cultural-show', 'sports-fest', 'other')),
        school_return_service_credit VARCHAR(15) CHECK (school_return_service_credit IN ('1', '2', '3', 'Not Applicable')),
        school_target_audience JSONB,
        community_event_type VARCHAR(30) CHECK (community_event_type IN ('academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others')),
        community_sdp_credits VARCHAR(5) CHECK (community_sdp_credits IN ('1', '2')),
        community_target_audience JSONB,
        
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
        current_section VARCHAR(20) CHECK (current_section IN ('overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting')),
        has_active_proposal BOOLEAN DEFAULT FALSE,
        proposal_status VARCHAR(20) DEFAULT 'draft' CHECK (proposal_status IN ('draft', 'pending', 'approved', 'denied', 'revision_requested')),
        report_status VARCHAR(20) DEFAULT 'draft' CHECK (report_status IN ('draft', 'pending', 'approved', 'denied', 'not_applicable')),
        event_status VARCHAR(15) DEFAULT 'scheduled' CHECK (event_status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed')),
        
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
        organization_type VARCHAR(20) NOT NULL CHECK (organization_type IN ('school-based', 'community-based')),
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
        // 5. CREATE SAMPLE DATA (PRODUCTION-READY USERS)
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
        // 6. CREATE SAMPLE ORGANIZATIONS
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

        // ========================================
        // 7. PERFORMANCE OPTIMIZATION
        // ========================================

        console.log("\n⚡ Optimizing database performance...");

        // Analyze tables for optimization
        const tables = ['users', 'proposals', 'audit_logs', 'organizations', 'sessions'];
        for (const table of tables) {
            try {
                await pool.query(`ANALYZE ${table}`);
                console.log(`✅ Table ${table} analyzed`);
            } catch (error) {
                console.warn(`⚠️  Analysis warning for ${table}:`, error.message);
            }
        }

        // ========================================
        // 8. FINAL VERIFICATION
        // ========================================

        console.log("\n🔍 Performing final verification...");

        // Verify table creation
        const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
        const tableNames = tablesResult.rows.map(t => t.table_name);
        const expectedTables = ['users', 'proposals', 'audit_logs', 'organizations', 'sessions'];

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

        console.log("\n🎉 PostgreSQL Database initialization completed successfully!");
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
