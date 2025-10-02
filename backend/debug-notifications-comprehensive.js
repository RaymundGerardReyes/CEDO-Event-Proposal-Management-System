/**
 * Comprehensive Notifications Debug
 * Purpose: Debug why notifications page shows empty despite having data
 * Key approaches: Database verification, API testing, authentication debugging
 */

require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function debugNotificationsComprehensive() {
    try {
        console.log('🔍 Comprehensive Notifications Debug...\n');

        // Step 1: Check database connection and notifications
        console.log('📋 Step 1: Database Connection & Notifications Check');
        const notificationsResult = await pool.query(`
            SELECT 
                n.id,
                n.recipient_id,
                n.sender_id,
                n.notification_type,
                n.message,
                n.is_read,
                n.created_at,
                u.name as recipient_name,
                u.email as recipient_email,
                s.name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.recipient_id = u.id
            LEFT JOIN users s ON n.sender_id = s.id
            ORDER BY n.created_at DESC
            LIMIT 10
        `);

        console.log(`   Found ${notificationsResult.rows.length} notifications in database:`);
        notificationsResult.rows.forEach((notif, index) => {
            console.log(`   ${index + 1}. ID: ${notif.id}, Recipient: ${notif.recipient_name} (${notif.recipient_id})`);
            console.log(`      Message: ${notif.message}`);
            console.log(`      Type: ${notif.notification_type}, Read: ${notif.is_read}`);
            console.log(`      Created: ${notif.created_at}`);
            console.log('');
        });

        // Step 2: Check users and their notification counts
        console.log('📋 Step 2: Users and Notification Counts');
        const usersResult = await pool.query(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role,
                COUNT(n.id) as notification_count,
                COUNT(CASE WHEN n.is_read = false THEN 1 END) as unread_count
            FROM users u
            LEFT JOIN notifications n ON u.id = n.recipient_id
            GROUP BY u.id, u.name, u.email, u.role
            ORDER BY u.id
        `);

        console.log('   Users and their notification counts:');
        usersResult.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
            console.log(`     Total notifications: ${user.notification_count}, Unread: ${user.unread_count}`);
        });

        // Step 3: Test API authentication
        console.log('\n📋 Step 3: Testing API Authentication');
        try {
            // Try to get auth token for user ID 2 (admin)
            const loginResponse = await axios.post('http://127.0.0.1:5000/api/auth/login', {
                email: 'manager@cedo.gov.ph',
                password: 'password123'
            });

            if (loginResponse.status === 200) {
                console.log('✅ Login successful');
                const authToken = loginResponse.data.token;
                console.log(`   Token (first 20 chars): ${authToken.substring(0, 20)}...`);

                // Test notifications API
                console.log('\n📋 Step 4: Testing Notifications API');
                try {
                    const notificationsResponse = await axios.get('http://127.0.0.1:5000/api/notifications?page=1&limit=50', {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('✅ Notifications API call successful');
                    console.log(`   Status: ${notificationsResponse.status}`);
                    console.log(`   Success: ${notificationsResponse.data.success}`);
                    console.log(`   Notifications count: ${notificationsResponse.data.data.notifications.length}`);

                    if (notificationsResponse.data.data.notifications.length > 0) {
                        console.log('\n   Recent notifications from API:');
                        notificationsResponse.data.data.notifications.slice(0, 5).forEach((notif, index) => {
                            console.log(`   ${index + 1}. ${notif.message} (${notif.isRead ? 'Read' : 'Unread'})`);
                        });
                    } else {
                        console.log('   ⚠️ No notifications returned from API');
                    }

                } catch (apiError) {
                    console.log('❌ Notifications API call failed');
                    console.log(`   Status: ${apiError.response?.status}`);
                    console.log(`   Response: ${JSON.stringify(apiError.response?.data, null, 2)}`);
                }

                // Test unread count API
                console.log('\n📋 Step 5: Testing Unread Count API');
                try {
                    const unreadResponse = await axios.get('http://127.0.0.1:5000/api/notifications/unread-count', {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('✅ Unread count API call successful');
                    console.log(`   Status: ${unreadResponse.status}`);
                    console.log(`   Unread count: ${unreadResponse.data.data.unreadCount}`);

                } catch (unreadError) {
                    console.log('❌ Unread count API call failed');
                    console.log(`   Status: ${unreadError.response?.status}`);
                    console.log(`   Response: ${JSON.stringify(unreadError.response?.data, null, 2)}`);
                }

            } else {
                console.log('❌ Login failed');
                console.log(`   Status: ${loginResponse.status}`);
                console.log(`   Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
            }

        } catch (loginError) {
            console.log('❌ Login request failed');
            console.log(`   Error: ${loginError.message}`);
            if (loginError.response) {
                console.log(`   Status: ${loginError.response.status}`);
                console.log(`   Response: ${JSON.stringify(loginError.response.data, null, 2)}`);
            }
        }

        // Step 6: Check if there are any authentication issues
        console.log('\n📋 Step 6: Authentication Debug');
        const authCheckResult = await pool.query(`
            SELECT id, name, email, role, google_id
            FROM users 
            WHERE email = 'manager@cedo.gov.ph'
        `);

        if (authCheckResult.rows.length > 0) {
            const user = authCheckResult.rows[0];
            console.log(`   Found user: ${user.name} (ID: ${user.id})`);
            console.log(`   Email: ${user.email}, Role: ${user.role}`);
            console.log(`   Google ID: ${user.google_id || 'Not set'}`);

            // Check notifications for this specific user
            const userNotificationsResult = await pool.query(`
                SELECT COUNT(*) as count
                FROM notifications 
                WHERE recipient_id = $1
            `, [user.id]);

            console.log(`   Notifications for this user: ${userNotificationsResult.rows[0].count}`);
        } else {
            console.log('   ❌ User manager@cedo.gov.ph not found');
        }

        // Step 7: Create a test notification if needed
        console.log('\n📋 Step 7: Creating Test Notification');
        try {
            const testNotificationResult = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, sender_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, uuid, message`,
                [
                    2, // recipient_id (admin user)
                    2, // sender_id (admin user)
                    'proposal_status_change', // notification_type
                    'Test notification - This should appear in the notifications page!', // message
                    false, // is_read
                    123, // related_proposal_id
                    'test-proposal-uuid-123' // related_proposal_uuid
                ]
            );

            console.log(`   ✅ Test notification created: ${testNotificationResult.rows[0].uuid}`);
            console.log(`   Message: ${testNotificationResult.rows[0].message}`);
        } catch (insertError) {
            console.log(`   ❌ Failed to create test notification: ${insertError.message}`);
        }

        console.log('\n🎉 Comprehensive debug completed!');
        console.log('💡 If the API works but frontend shows empty:');
        console.log('   1. Check browser console for JavaScript errors');
        console.log('   2. Check if the authentication token is being sent correctly');
        console.log('   3. Check if the user ID in the token matches the recipient_id in notifications');
        console.log('   4. Check if the frontend is making the correct API call');

    } catch (error) {
        console.error('❌ Comprehensive debug failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the debug
debugNotificationsComprehensive();
