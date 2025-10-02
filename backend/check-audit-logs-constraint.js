/**
 * Check Audit Logs Constraint
 * Purpose: Check what action_type values are allowed in audit_logs table
 * Key approaches: Database constraint analysis, error resolution
 */

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkAuditLogsConstraint() {
    try {
        console.log('🔍 Checking audit_logs table constraints...\n');

        // Check the constraint on action_type
        const constraintResult = await pool.query(`
            SELECT 
                conname as constraint_name,
                pg_get_constraintdef(oid) as constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'audit_logs'::regclass 
            AND conname LIKE '%action_type%'
        `);

        console.log('📋 Audit logs constraints:');
        constraintResult.rows.forEach(constraint => {
            console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_definition}`);
        });

        // Check if there's an enum for action_type
        const enumResult = await pool.query(`
            SELECT 
                t.typname as enum_name,
                e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname LIKE '%action%'
            ORDER BY e.enumsortorder
        `);

        if (enumResult.rows.length > 0) {
            console.log('\n📋 Action type enum values:');
            enumResult.rows.forEach(row => {
                console.log(`   - ${row.enum_value}`);
            });
        }

        // Check existing audit_logs entries to see what action_types are used
        const existingResult = await pool.query(`
            SELECT DISTINCT action_type, COUNT(*) as count
            FROM audit_logs 
            GROUP BY action_type 
            ORDER BY count DESC
        `);

        console.log('\n📋 Existing action_type values in audit_logs:');
        existingResult.rows.forEach(row => {
            console.log(`   - ${row.action_type}: ${row.count} records`);
        });

        // Try to find the exact constraint definition
        const detailedConstraint = await pool.query(`
            SELECT 
                conname,
                contype,
                pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'audit_logs'::regclass
        `);

        console.log('\n📋 All constraints on audit_logs table:');
        detailedConstraint.rows.forEach(constraint => {
            console.log(`   - ${constraint.conname} (${constraint.contype}): ${constraint.definition}`);
        });

    } catch (error) {
        console.error('❌ Error checking constraints:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkAuditLogsConstraint();
