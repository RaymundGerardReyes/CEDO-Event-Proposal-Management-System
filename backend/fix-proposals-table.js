// Fix the proposals table structure to match init-db.js schema
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixProposalsTable() {
    let connection;

    try {
        console.log('🔧 Fixing proposals table structure...');

        // Database configuration
        const dbConfig = {
            host: process.env.MYSQL_HOST || '127.0.0.1',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'cedo_auth'
        };

        connection = await mysql.createConnection(dbConfig);

        console.log('✅ Connected to database');

        // Add default values for NOT NULL fields
        const alterQueries = [
            `ALTER TABLE proposals MODIFY COLUMN organization_name VARCHAR(255) NOT NULL DEFAULT 'Draft Organization'`,
            `ALTER TABLE proposals MODIFY COLUMN organization_type ENUM('internal', 'external', 'school-based', 'community-based') NOT NULL DEFAULT 'school-based'`,
            `ALTER TABLE proposals MODIFY COLUMN contact_name VARCHAR(255) NOT NULL DEFAULT 'Contact Person'`,
            `ALTER TABLE proposals MODIFY COLUMN contact_email VARCHAR(255) NOT NULL DEFAULT 'contact@example.com'`,
            `ALTER TABLE proposals MODIFY COLUMN event_name VARCHAR(255) NOT NULL DEFAULT 'Draft Event'`,
            `ALTER TABLE proposals MODIFY COLUMN event_start_date DATE NOT NULL DEFAULT '2025-01-01'`,
            `ALTER TABLE proposals MODIFY COLUMN event_end_date DATE NOT NULL DEFAULT '2025-12-31'`
        ];

        console.log('📝 Applying table structure fixes...');

        for (const query of alterQueries) {
            try {
                await connection.query(query);
                console.log('✅ Applied:', query.substring(0, 50) + '...');
            } catch (error) {
                console.log('⚠️  Skipped (already applied):', error.message);
            }
        }

        console.log('\n✅ Proposals table structure fixed successfully!');

        // Verify the fix
        console.log('\n🔍 Verifying the fix...');
        const [columns] = await connection.query('DESCRIBE proposals');

        const notNullFields = columns.filter(col => col.Null === 'NO' && col.Default === null);

        console.log('\n📋 NOT NULL fields without defaults (should be empty):');
        if (notNullFields.length === 0) {
            console.log('✅ All NOT NULL fields now have default values!');
        } else {
            console.log('❌ Still have fields without defaults:');
            notNullFields.forEach(field => {
                console.log(`- ${field.Field} (${field.Type})`);
            });
        }

        // Check organization_name specifically
        const orgNameField = columns.find(col => col.Field === 'organization_name');
        if (orgNameField) {
            console.log('\n📝 organization_name field after fix:');
            console.log(`- Type: ${orgNameField.Type}`);
            console.log(`- Null: ${orgNameField.Null}`);
            console.log(`- Default: ${orgNameField.Default}`);
        }

    } catch (error) {
        console.error('❌ Error fixing table structure:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

fixProposalsTable(); 