/**
 * Database Issues Fix Script
 * Purpose: Fix all database connection and schema issues
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function fixDatabaseIssues() {
    console.log('🔧 Starting Database Issues Fix...\n');

    // Step 1: Test basic MySQL connection
    console.log('📋 Step 1: Testing MySQL Connection');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
        });

        console.log('✅ MySQL connection established successfully');

        // Step 2: Create database if it doesn't exist
        console.log('\n📋 Step 2: Creating Database');
        const databaseName = process.env.MYSQL_DATABASE || 'cedo_db';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
        console.log(`✅ Database '${databaseName}' created/verified`);

        // Step 3: Use the database
        await connection.execute(`USE ${databaseName}`);
        console.log(`✅ Using database '${databaseName}'`);

        // Step 4: Create proposals table with correct structure
        console.log('\n📋 Step 4: Creating Proposals Table');
        const createProposalsTable = `
            CREATE TABLE IF NOT EXISTS proposals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uuid VARCHAR(36) UNIQUE NOT NULL,
                organization_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Organization',
                organization_type ENUM('school-based', 'community-based') NOT NULL,
                organization_description TEXT,
                contact_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Contact',
                contact_email VARCHAR(255) NOT NULL DEFAULT 'unknown@example.com',
                contact_phone VARCHAR(20) NOT NULL DEFAULT '0000000000',
                event_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Event',
                event_venue TEXT,
                event_start_date DATE,
                event_end_date DATE,
                event_start_time TIME,
                event_end_time TIME,
                event_mode ENUM('online', 'offline', 'hybrid') DEFAULT 'offline',
                
                -- School event specific fields
                school_event_type ENUM('academic', 'seminar', 'assembly', 'leadership', 'other') NULL,
                school_return_service_credit VARCHAR(10) NULL,
                school_target_audience JSON NULL,
                school_gpoa_file_name VARCHAR(255) NULL,
                school_gpoa_file_path VARCHAR(500) NULL,
                school_proposal_file_name VARCHAR(255) NULL,
                school_proposal_file_path VARCHAR(500) NULL,
                
                -- Community event specific fields
                community_event_type ENUM('academic', 'seminar', 'assembly', 'leadership', 'other') NULL,
                community_sdp_credits VARCHAR(10) NULL,
                community_target_audience JSON NULL,
                community_gpoa_file_name VARCHAR(255) NULL,
                community_gpoa_file_path VARCHAR(500) NULL,
                community_proposal_file_name VARCHAR(255) NULL,
                community_proposal_file_path VARCHAR(500) NULL,
                
                -- Status and tracking fields
                current_section ENUM('overview', 'organization', 'school-event', 'community-event', 'reporting') DEFAULT 'overview',
                has_active_proposal BOOLEAN DEFAULT TRUE,
                proposal_status ENUM('draft', 'pending', 'approved', 'denied', 'submitted') DEFAULT 'draft',
                report_status ENUM('draft', 'submitted', 'approved', 'denied') DEFAULT 'draft',
                event_status ENUM('scheduled', 'completed', 'cancelled', 'postponed') DEFAULT 'scheduled',
                
                -- Event details
                attendance_count INT DEFAULT 0,
                objectives TEXT,
                budget DECIMAL(10,2) DEFAULT 0.00,
                volunteers_needed INT DEFAULT 0,
                form_completion_percentage DECIMAL(5,2) DEFAULT 0.00,
                
                -- System fields
                is_deleted BOOLEAN DEFAULT FALSE,
                user_id INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Indexes for performance
                INDEX idx_uuid (uuid),
                INDEX idx_user_id (user_id),
                INDEX idx_proposal_status (proposal_status),
                INDEX idx_organization_type (organization_type),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.execute(createProposalsTable);
        console.log('✅ Proposals table created/verified');

        // Step 5: Create users table if it doesn't exist
        console.log('\n📋 Step 5: Creating Users Table');
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                google_id VARCHAR(255) UNIQUE,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                picture VARCHAR(500),
                role ENUM('student', 'admin', 'super_admin') DEFAULT 'student',
                organization_type ENUM('school-based', 'community-based') NULL,
                organization_name VARCHAR(255) NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_google_id (google_id),
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.execute(createUsersTable);
        console.log('✅ Users table created/verified');

        // Step 6: Insert default user if not exists
        console.log('\n📋 Step 6: Creating Default User');
        const insertDefaultUser = `
            INSERT IGNORE INTO users (id, email, name, role, is_verified, is_active) 
            VALUES (1, 'default@cedo.com', 'Default User', 'student', TRUE, TRUE)
        `;
        await connection.execute(insertDefaultUser);
        console.log('✅ Default user created/verified');

        // Step 7: Test the proposals table structure
        console.log('\n📋 Step 7: Testing Table Structure');
        const [columns] = await connection.execute('DESCRIBE proposals');
        console.log('✅ Proposals table columns:');
        columns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Step 8: Test insert operation
        console.log('\n📋 Step 8: Testing Insert Operation');
        const testInsert = `
            INSERT INTO proposals (
                uuid, organization_name, organization_type, event_name, 
                proposal_status, user_id
            ) VALUES (
                'test-uuid-123', 'Test Organization', 'community-based', 'Test Event',
                'draft', 1
            )
        `;
        const [insertResult] = await connection.execute(testInsert);
        console.log(`✅ Test insert successful, ID: ${insertResult.insertId}`);

        // Step 9: Clean up test data
        console.log('\n📋 Step 9: Cleaning Test Data');
        await connection.execute("DELETE FROM proposals WHERE uuid = 'test-uuid-123'");
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 Database Issues Fix Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✅ MySQL connection established');
        console.log('   ✅ Database created/verified');
        console.log('   ✅ Tables created with correct structure');
        console.log('   ✅ Default user created');
        console.log('   ✅ Insert operations working');
        console.log('   ✅ Ready for application use');

    } catch (error) {
        console.error('❌ Database fix failed:', error.message);
        console.error('Error details:', error);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Solution: Check your MySQL credentials in .env file');
            console.log('   - MYSQL_USER');
            console.log('   - MYSQL_PASSWORD');
            console.log('   - MYSQL_HOST');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Solution: Make sure MySQL server is running');
            console.log('   - Start MySQL service');
            console.log('   - Check if port 3306 is available');
        }

        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the fix
if (require.main === module) {
    fixDatabaseIssues()
        .then(() => {
            console.log('\n✅ Database fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database fix failed:', error.message);
            process.exit(1);
        });
}

module.exports = { fixDatabaseIssues }; 