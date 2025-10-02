/**
 * Comprehensive Notifications Debug Analysis
 * Purpose: Debug why notifications aren't loading/fetching data from database
 * Key approaches: Database analysis, API testing, authentication verification, data flow tracing
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function comprehensiveNotificationsAnalysis() {
    console.log('🔍 COMPREHENSIVE NOTIFICATIONS DEBUG ANALYSIS');
    console.log('='.repeat(60));

    try {
        // 1. Database Connection Test
        console.log('\n📊 1. DATABASE CONNECTION TEST');
        console.log('-'.repeat(40));
        const connectionTest = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✅ Database connected successfully');
        console.log(`   Current time: ${connectionTest.rows[0].current_time}`);
        console.log(`   PostgreSQL version: ${connectionTest.rows[0].postgres_version.split(' ')[0]}`);

        // 2. Check Notifications Table Structure
        console.log('\n📋 2. NOTIFICATIONS TABLE STRUCTURE');
        console.log('-'.repeat(40));
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            ORDER BY ordinal_position
        `);

        console.log('📝 Notifications table columns:');
        tableStructure.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });

        // 3. Check Enum Types
        console.log('\n🏷️ 3. ENUM TYPES CHECK');
        console.log('-'.repeat(40));
        const enumTypes = await pool.query(`
            SELECT t.typname, e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            WHERE t.typname IN ('notification_type_enum', 'role_type', 'organization_type_enum')
            ORDER BY t.typname, e.enumsortorder
        `);

        const enumGroups = {};
        enumTypes.rows.forEach(row => {
            if (!enumGroups[row.typname]) {
                enumGroups[row.typname] = [];
            }
            enumGroups[row.typname].push(row.enumlabel);
        });

        Object.entries(enumGroups).forEach(([typeName, values]) => {
            console.log(`   ${typeName}: [${values.join(', ')}]`);
        });

        // 4. Check Users Table
        console.log('\n👥 4. USERS TABLE ANALYSIS');
        console.log('-'.repeat(40));
        const usersCount = await pool.query('SELECT COUNT(*) as total_users FROM users');
        const activeUsers = await pool.query(`
            SELECT id, name, email, role, is_approved, created_at 
            FROM users 
            WHERE is_approved = true 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log(`📊 Total users: ${usersCount.rows[0].total_users}`);
        console.log('👤 Recent active users:');
        activeUsers.rows.forEach(user => {
            console.log(`   ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Approved: ${user.is_approved}`);
        });

        // 5. Check Notifications Data
        console.log('\n🔔 5. NOTIFICATIONS DATA ANALYSIS');
        console.log('-'.repeat(40));
        const notificationsCount = await pool.query('SELECT COUNT(*) as total_notifications FROM notifications');
        const recentNotifications = await pool.query(`
            SELECT n.id, n.recipient_id, n.sender_id, n.notification_type, n.message, n.is_read, n.created_at,
                   u.name as recipient_name, s.name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.recipient_id = u.id
            LEFT JOIN users s ON n.sender_id = s.id
            ORDER BY n.created_at DESC
            LIMIT 10
        `);

        console.log(`📊 Total notifications: ${notificationsCount.rows[0].total_notifications}`);
        console.log('🔔 Recent notifications:');
        if (recentNotifications.rows.length === 0) {
            console.log('   ❌ NO NOTIFICATIONS FOUND IN DATABASE');
        } else {
            recentNotifications.rows.forEach(notif => {
                console.log(`   ID: ${notif.id}, Recipient: ${notif.recipient_name} (${notif.recipient_id}), Type: ${notif.notification_type}, Read: ${notif.is_read}`);
                console.log(`      Message: ${notif.message.substring(0, 50)}...`);
                console.log(`      Created: ${notif.created_at}`);
            });
        }

        // 6. Check Specific User Notifications
        console.log('\n🎯 6. SPECIFIC USER NOTIFICATIONS CHECK');
        console.log('-'.repeat(40));
        const userNotifications = await pool.query(`
            SELECT n.id, n.recipient_id, n.notification_type, n.message, n.is_read, n.created_at,
                   u.name as recipient_name, u.email as recipient_email
            FROM notifications n
            JOIN users u ON n.recipient_id = u.id
            WHERE u.role = 'head_admin' OR u.role = 'admin'
            ORDER BY n.created_at DESC
            LIMIT 5
        `);

        console.log('👑 Admin user notifications:');
        if (userNotifications.rows.length === 0) {
            console.log('   ❌ NO NOTIFICATIONS FOR ADMIN USERS');
        } else {
            userNotifications.rows.forEach(notif => {
                console.log(`   ID: ${notif.id}, Recipient: ${notif.recipient_name} (${notif.recipient_email}), Read: ${notif.is_read}`);
                console.log(`      Message: ${notif.message.substring(0, 60)}...`);
            });
        }

        // 7. Check Foreign Key Constraints
        console.log('\n🔗 7. FOREIGN KEY CONSTRAINTS CHECK');
        console.log('-'.repeat(40));
        const foreignKeys = await pool.query(`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'notifications'
        `);

        console.log('🔗 Notifications foreign keys:');
        foreignKeys.rows.forEach(fk => {
            console.log(`   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });

        // 8. Check Indexes
        console.log('\n📇 8. INDEXES CHECK');
        console.log('-'.repeat(40));
        const indexes = await pool.query(`
            SELECT indexname, indexdef
            FROM pg_indexes 
            WHERE tablename = 'notifications'
        `);

        console.log('📇 Notifications indexes:');
        indexes.rows.forEach(idx => {
            console.log(`   ${idx.indexname}: ${idx.indexdef}`);
        });

        // 9. Test API Endpoints (if server is running)
        console.log('\n🌐 9. API ENDPOINTS TEST');
        console.log('-'.repeat(40));
        try {
            const fetch = require('node-fetch');
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

            console.log(`🔗 Testing API endpoints at: ${backendUrl}`);

            // Test if server is running
            const healthCheck = await fetch(`${backendUrl}/api/health`, { timeout: 5000 });
            if (healthCheck.ok) {
                console.log('✅ Backend server is running');

                // Test notifications endpoint
                const notificationsResponse = await fetch(`${backendUrl}/api/notifications`, { timeout: 5000 });
                console.log(`📡 Notifications API status: ${notificationsResponse.status}`);

                if (notificationsResponse.status === 401) {
                    console.log('❌ Authentication required - need valid JWT token');
                } else if (notificationsResponse.status === 200) {
                    const data = await notificationsResponse.json();
                    console.log(`✅ Notifications API working, found ${data.data?.notifications?.length || 0} notifications`);
                } else {
                    console.log(`❌ Notifications API error: ${notificationsResponse.status}`);
                }
            } else {
                console.log('❌ Backend server not responding');
            }
        } catch (error) {
            console.log(`❌ API test failed: ${error.message}`);
            console.log('💡 Make sure backend server is running on port 5000');
        }

        // 10. Recommendations
        console.log('\n💡 10. RECOMMENDATIONS');
        console.log('-'.repeat(40));

        if (notificationsCount.rows[0].total_notifications === 0) {
            console.log('🔧 ISSUE: No notifications in database');
            console.log('   Solution: Create test notifications using the script below');
        }

        if (userNotifications.rows.length === 0) {
            console.log('🔧 ISSUE: No notifications for admin users');
            console.log('   Solution: Create notifications for admin users');
        }

        console.log('\n📝 NEXT STEPS:');
        console.log('1. Run: node create-test-notifications-for-admin.js');
        console.log('2. Start backend server: npm run dev');
        console.log('3. Test frontend notifications dropdown');
        console.log('4. Check browser console for API errors');

    } catch (error) {
        console.error('❌ Analysis failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the analysis
comprehensiveNotificationsAnalysis();
