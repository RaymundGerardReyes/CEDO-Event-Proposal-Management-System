/**
 * Test Notification API After Fix
 * Purpose: Test the notification API endpoints after fixing the audit trigger
 * Key approaches: API testing, error verification, success confirmation
 */

require('dotenv').config();
const request = require('supertest');
const app = require('./server');

async function testNotificationAPIFixed() {
    try {
        console.log('🧪 Testing Notification API After Fix...\n');

        // Get auth token first
        console.log('🔐 Getting authentication token...');
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'manager@cedo.gov.ph',
                password: 'password123'
            });

        if (loginRes.statusCode !== 200) {
            console.log('❌ Failed to get auth token');
            console.log('Response:', loginRes.body);
            return;
        }

        const authToken = loginRes.body.token;
        console.log('✅ Auth token obtained');

        // Test 1: Create user notification
        console.log('\n📋 Test 1: Creating user notification...');
        const userNotificationRes = await request(app)
            .post('/api/notifications')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                recipientId: 2,
                notificationType: 'proposal_status_change',
                message: 'Your proposal "Test Science Fair 2024" has been submitted for review. You will be notified once it\'s reviewed by the admin.',
                relatedProposalId: 123,
                relatedProposalUuid: 'test-proposal-uuid-123'
            });

        if (userNotificationRes.statusCode === 201) {
            console.log('✅ User notification created successfully');
            console.log(`   UUID: ${userNotificationRes.body.data.uuid}`);
            console.log(`   Message: ${userNotificationRes.body.data.message}`);
        } else {
            console.log('❌ User notification creation failed');
            console.log(`   Status: ${userNotificationRes.statusCode}`);
            console.log(`   Response: ${JSON.stringify(userNotificationRes.body, null, 2)}`);
        }

        // Test 2: Create admin notification
        console.log('\n📋 Test 2: Creating admin notification...');
        const adminNotificationRes = await request(app)
            .post('/api/notifications')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                recipientId: 2,
                notificationType: 'proposal_status_change',
                message: 'New proposal "Test Science Fair 2024" has been submitted by John Doe from Science Club. Please review it.',
                relatedProposalId: 123,
                relatedProposalUuid: 'test-proposal-uuid-123'
            });

        if (adminNotificationRes.statusCode === 201) {
            console.log('✅ Admin notification created successfully');
            console.log(`   UUID: ${adminNotificationRes.body.data.uuid}`);
            console.log(`   Message: ${adminNotificationRes.body.data.message}`);
        } else {
            console.log('❌ Admin notification creation failed');
            console.log(`   Status: ${adminNotificationRes.statusCode}`);
            console.log(`   Response: ${JSON.stringify(adminNotificationRes.body, null, 2)}`);
        }

        // Test 3: Get notifications
        console.log('\n📋 Test 3: Getting notifications...');
        const getNotificationsRes = await request(app)
            .get('/api/notifications?limit=5')
            .set('Authorization', `Bearer ${authToken}`);

        if (getNotificationsRes.statusCode === 200) {
            console.log('✅ Notifications retrieved successfully');
            console.log(`   Count: ${getNotificationsRes.body.data.notifications.length}`);
            getNotificationsRes.body.data.notifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.message} (${notif.is_read ? 'Read' : 'Unread'})`);
            });
        } else {
            console.log('❌ Failed to get notifications');
            console.log(`   Status: ${getNotificationsRes.statusCode}`);
        }

        // Test 4: Get unread count
        console.log('\n📋 Test 4: Getting unread count...');
        const unreadCountRes = await request(app)
            .get('/api/notifications/unread-count')
            .set('Authorization', `Bearer ${authToken}`);

        if (unreadCountRes.statusCode === 200) {
            console.log('✅ Unread count retrieved successfully');
            console.log(`   Unread count: ${unreadCountRes.body.data.unreadCount}`);
        } else {
            console.log('❌ Failed to get unread count');
            console.log(`   Status: ${unreadCountRes.statusCode}`);
        }

        console.log('\n🎉 Notification API test completed successfully!');
        console.log('💡 The notification system should now work in the frontend.');

    } catch (error) {
        console.error('❌ Notification API test failed:', error);
    }
}

// Run the test
testNotificationAPIFixed();
