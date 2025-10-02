/**
 * Comprehensive Notifications API Test
 * Purpose: Test the complete notifications API flow from authentication to data retrieval
 * Key approaches: Full API testing, authentication simulation, error handling
 */

const request = require('supertest');
const app = require('./server');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function testNotificationsAPIComprehensive() {
    console.log('🧪 COMPREHENSIVE NOTIFICATIONS API TEST');
    console.log('='.repeat(60));

    try {
        // 1. Test server health
        console.log('\n🏥 1. SERVER HEALTH CHECK');
        console.log('-'.repeat(40));
        try {
            const healthResponse = await request(app).get('/api/health');
            console.log(`✅ Server health: ${healthResponse.status}`);
        } catch (error) {
            console.log('❌ Server not responding, trying to start...');
            console.log('💡 Run: npm run dev (in backend directory)');
            return;
        }

        // 2. Find or create test user
        console.log('\n👤 2. USER AUTHENTICATION SETUP');
        console.log('-'.repeat(40));
        let testUser;
        try {
            const userResult = await pool.query(`
                SELECT id, name, email, role 
                FROM users 
                WHERE role IN ('head_admin', 'admin') 
                LIMIT 1
            `);

            if (userResult.rows.length === 0) {
                console.log('❌ No admin users found, creating test user...');
                const newUser = await pool.query(`
                    INSERT INTO users (name, email, role, is_approved, organization)
                    VALUES ('Test Admin', 'admin@test.com', 'head_admin', true, 'Test Organization')
                    RETURNING id, name, email, role
                `);
                testUser = newUser.rows[0];
            } else {
                testUser = userResult.rows[0];
            }

            console.log(`👤 Test user: ${testUser.name} (${testUser.email}) - ID: ${testUser.id}`);
        } catch (error) {
            console.error('❌ User setup failed:', error.message);
            return;
        }

        // 3. Generate JWT token
        console.log('\n🔐 3. JWT TOKEN GENERATION');
        console.log('-'.repeat(40));
        let authToken;
        try {
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

            authToken = jwt.sign(
                {
                    userId: testUser.id,
                    email: testUser.email,
                    role: testUser.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log(`✅ JWT token generated: ${authToken.substring(0, 20)}...`);
        } catch (error) {
            console.error('❌ JWT generation failed:', error.message);
            return;
        }

        // 4. Test notifications endpoints
        console.log('\n📡 4. NOTIFICATIONS API ENDPOINTS TEST');
        console.log('-'.repeat(40));

        // Test 1: Get all notifications
        console.log('\n📋 Test 1: GET /api/notifications');
        try {
            const notificationsResponse = await request(app)
                .get('/api/notifications?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            console.log('✅ Notifications endpoint working');
            console.log(`   Status: ${notificationsResponse.body.success}`);
            console.log(`   Notifications count: ${notificationsResponse.body.data?.notifications?.length || 0}`);

            if (notificationsResponse.body.data?.notifications?.length > 0) {
                console.log('   Recent notifications:');
                notificationsResponse.body.data.notifications.slice(0, 3).forEach((notif, index) => {
                    console.log(`     ${index + 1}. ${notif.message.substring(0, 50)}... (Read: ${notif.isRead})`);
                });
            }
        } catch (error) {
            console.log(`❌ Notifications endpoint failed: ${error.message}`);
        }

        // Test 2: Get unread count
        console.log('\n🔢 Test 2: GET /api/notifications/unread-count');
        try {
            const unreadResponse = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            console.log('✅ Unread count endpoint working');
            console.log(`   Unread count: ${unreadResponse.body.data?.unreadCount || 0}`);
        } catch (error) {
            console.log(`❌ Unread count endpoint failed: ${error.message}`);
        }

        // Test 3: Mark notification as read
        console.log('\n✅ Test 3: PATCH /api/notifications/{id}/read');
        try {
            // First get a notification to mark as read
            const notificationsResponse = await request(app)
                .get('/api/notifications?page=1&limit=1')
                .set('Authorization', `Bearer ${authToken}`);

            if (notificationsResponse.body.data?.notifications?.length > 0) {
                const notificationId = notificationsResponse.body.data.notifications[0].id;

                const markReadResponse = await request(app)
                    .patch(`/api/notifications/${notificationId}/read`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                console.log('✅ Mark as read endpoint working');
                console.log(`   Marked notification ${notificationId} as read`);
            } else {
                console.log('⚠️ No notifications to mark as read');
            }
        } catch (error) {
            console.log(`❌ Mark as read endpoint failed: ${error.message}`);
        }

        // Test 4: Mark all as read
        console.log('\n✅ Test 4: PATCH /api/notifications/mark-all-read');
        try {
            const markAllReadResponse = await request(app)
                .patch('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            console.log('✅ Mark all as read endpoint working');
        } catch (error) {
            console.log(`❌ Mark all as read endpoint failed: ${error.message}`);
        }

        // 5. Test without authentication
        console.log('\n🔒 5. AUTHENTICATION TEST');
        console.log('-'.repeat(40));
        try {
            const noAuthResponse = await request(app)
                .get('/api/notifications')
                .expect(401);

            console.log('✅ Authentication required (401) - Security working');
        } catch (error) {
            console.log(`❌ Authentication test failed: ${error.message}`);
        }

        // 6. Test with invalid token
        console.log('\n🚫 Test 6: Invalid token');
        try {
            const invalidTokenResponse = await request(app)
                .get('/api/notifications')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            console.log('✅ Invalid token rejected (401) - Security working');
        } catch (error) {
            console.log(`❌ Invalid token test failed: ${error.message}`);
        }

        // 7. Database verification
        console.log('\n📊 7. DATABASE VERIFICATION');
        console.log('-'.repeat(40));
        try {
            const dbCheck = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
                    COUNT(CASE WHEN is_read = true THEN 1 END) as read
                FROM notifications 
                WHERE recipient_id = $1
            `, [testUser.id]);

            console.log(`📈 Database stats for user ${testUser.id}:`);
            console.log(`   Total notifications: ${dbCheck.rows[0].total}`);
            console.log(`   Unread: ${dbCheck.rows[0].unread}`);
            console.log(`   Read: ${dbCheck.rows[0].read}`);
        } catch (error) {
            console.log(`❌ Database verification failed: ${error.message}`);
        }

        console.log('\n🎉 COMPREHENSIVE API TEST COMPLETED!');
        console.log('💡 If all tests passed, your notifications API is working correctly.');
        console.log('🔧 If notifications still don\'t appear in frontend, check:');
        console.log('   1. Frontend is making requests to correct backend URL');
        console.log('   2. Authentication token is being sent correctly');
        console.log('   3. Browser console for JavaScript errors');
        console.log('   4. Network tab for failed API requests');

    } catch (error) {
        console.error('❌ Comprehensive test failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the comprehensive test
testNotificationsAPIComprehensive();
