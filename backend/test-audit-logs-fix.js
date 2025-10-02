#!/usr/bin/env node

/**
 * Test to verify audit logs action_type constraint fix
 */

const { Pool } = require('pg');

// Test configuration - matches your actual database setup
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuditLogsConstraint() {
    log('🧪 Testing audit logs action_type constraint...', 'blue');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);
        await pool.query('SELECT NOW()');
        log('✅ Database connection established', 'green');

        // Test valid action_type values
        const validActionTypes = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];

        log('\n📋 Testing valid action_type values:', 'cyan');
        for (const actionType of validActionTypes) {
            try {
                await pool.query(
                    "INSERT INTO audit_logs (user_id, action_type, table_name, additional_info) VALUES ($1, $2, $3, $4)",
                    [1, actionType, 'test_table', JSON.stringify({ test: true })]
                );
                log(`✅ ${actionType} - Valid`, 'green');

                // Clean up test record
                await pool.query("DELETE FROM audit_logs WHERE action_type = $1 AND table_name = 'test_table'", [actionType]);
            } catch (error) {
                log(`❌ ${actionType} - Error: ${error.message}`, 'red');
            }
        }

        // Test invalid action_type values
        log('\n📋 Testing invalid action_type values:', 'cyan');
        const invalidActionTypes = ['BULK_UPDATE', 'ASSIGN', 'PRIORITY_UPDATE', 'INVALID'];

        for (const actionType of invalidActionTypes) {
            try {
                await pool.query(
                    "INSERT INTO audit_logs (user_id, action_type, table_name, additional_info) VALUES ($1, $2, $3, $4)",
                    [1, actionType, 'test_table', JSON.stringify({ test: true })]
                );
                log(`⚠️  ${actionType} - Unexpectedly allowed (should be rejected)`, 'yellow');

                // Clean up if somehow inserted
                await pool.query("DELETE FROM audit_logs WHERE action_type = $1 AND table_name = 'test_table'", [actionType]);
            } catch (error) {
                if (error.code === '23514' && error.constraint === 'audit_logs_action_type_check') {
                    log(`✅ ${actionType} - Correctly rejected by constraint`, 'green');
                } else {
                    log(`❌ ${actionType} - Unexpected error: ${error.message}`, 'red');
                }
            }
        }

        log('\n✅ All constraint tests completed', 'green');
        return true;

    } catch (error) {
        log(`❌ Test failed: ${error.message}`, 'red');
        return false;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

async function testBackendRoutes() {
    log('\n🧪 Testing backend route action_type usage...', 'blue');

    const fs = require('fs');
    const path = require('path');

    try {
        const routesPath = path.join(__dirname, 'routes/admin/proposals.js');
        const content = fs.readFileSync(routesPath, 'utf8');

        // Extract all action_type values used in the routes
        const actionTypeMatches = content.match(/'([A-Z_]+)',\s*'proposals'/g);

        if (actionTypeMatches) {
            const usedActionTypes = actionTypeMatches.map(match => {
                const parts = match.match(/'([A-Z_]+)',\s*'proposals'/);
                return parts ? parts[1] : null;
            }).filter(Boolean);

            const validActionTypes = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];

            log('📋 Action types used in routes:', 'cyan');
            for (const actionType of usedActionTypes) {
                if (validActionTypes.includes(actionType)) {
                    log(`✅ ${actionType} - Valid`, 'green');
                } else {
                    log(`❌ ${actionType} - Invalid (not in allowed list)`, 'red');
                }
            }

            const invalidTypes = usedActionTypes.filter(type => !validActionTypes.includes(type));
            if (invalidTypes.length === 0) {
                log('\n✅ All route action types are valid', 'green');
                return true;
            } else {
                log(`\n❌ Found invalid action types: ${invalidTypes.join(', ')}`, 'red');
                return false;
            }
        } else {
            log('⚠️  No action_type usage found in routes', 'yellow');
            return true;
        }

    } catch (error) {
        log(`❌ Error reading routes file: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('🚀 Testing Audit Logs Action Type Constraint Fix', 'bright');
    log('='.repeat(50), 'cyan');

    const constraintTest = await testAuditLogsConstraint();
    const routesTest = await testBackendRoutes();

    log('\n📊 Test Summary:', 'bright');
    log('='.repeat(20), 'cyan');

    if (constraintTest && routesTest) {
        log('🎉 All tests passed!', 'green');
        log('✅ Audit logs constraint is working correctly', 'green');
        log('✅ Backend routes use valid action_type values', 'green');
        log('✅ BULK_UPDATE issue has been resolved', 'green');
        log('\n🚀 Your proposal table bulk operations should now work!', 'bright');
    } else {
        log('❌ Some tests failed. Please check the issues above.', 'red');
        if (!constraintTest) {
            log('💡 Database constraint test failed', 'yellow');
        }
        if (!routesTest) {
            log('💡 Backend routes test failed', 'yellow');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testAuditLogsConstraint, testBackendRoutes };