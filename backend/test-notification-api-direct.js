/**
 * Test Notification API Direct HTTP Request
 * Purpose: Test the notification API using direct HTTP requests
 * Key approaches: HTTP testing, error verification, success confirmation
 */

require('dotenv').config();
const axios = require('axios');

async function testNotificationAPIDirect() {
    try {
        console.log('🧪 Testing Notification API with Direct HTTP Requests...\n');

        const baseURL = 'http://127.0.0.1:5000';

        // Test 1: Get auth token
        console.log('🔐 Getting authentication token...');
        const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'manager@cedo.gov.ph',
            password: 'password123'
        });

        if (loginRes.status !== 200) {
            console.log('❌ Failed to get auth token');
            console.log('Response:', loginRes.data);
            return;
        }

        const authToken = loginRes.data.token;
        console.log('✅ Auth token obtained');

        // Test 2: Create user notification
        console.log('\n📋 Test 2: Creating user notification...');
        try {
            const userNotificationRes = await axios.post(`${baseURL}/api/notifications`, {
                recipientId: 2,
                notificationType: 'proposal_status_change',
                message: 'Your proposal "Test Science Fair 2024" has been submitted for review. You will be notified once it\'s reviewed by the admin.',
                relatedProposalId: 123,
                relatedProposalUuid: 'test-proposal-uuid-123'
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ User notification created successfully');
            console.log(`   Status: ${userNotificationRes.status}`);
            console.log(`   UUID: ${userNotificationRes.data.data.uuid}`);
            console.log(`   Message: ${userNotificationRes.data.data.message}`);

        } catch (userError) {
            console.log('❌ User notification creation failed');
            console.log(`   Status: ${userError.response?.status}`);
            console.log(`   Response: ${JSON.stringify(userError.response?.data, null, 2)}`);
        }

        // Test 3: Create admin notification
        console.log('\n📋 Test 3: Creating admin notification...');
        try {
            const adminNotificationRes = await axios.post(`${baseURL}/api/notifications`, {
                recipientId: 2,
                notificationType: 'proposal_status_change',
                message: 'New proposal "Test Science Fair 2024" has been submitted by John Doe from Science Club. Please review it.',
                relatedProposalId: 123,
                relatedProposalUuid: 'test-proposal-uuid-123'
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Admin notification created successfully');
            console.log(`   Status: ${adminNotificationRes.status}`);
            console.log(`   UUID: ${adminNotificationRes.data.data.uuid}`);
            console.log(`   Message: ${adminNotificationRes.data.data.message}`);

        } catch (adminError) {
            console.log('❌ Admin notification creation failed');
            console.log(`   Status: ${adminError.response?.status}`);
            console.log(`   Response: ${JSON.stringify(adminError.response?.data, null, 2)}`);
        }

        // Test 4: Get notifications
        console.log('\n📋 Test 4: Getting notifications...');
        try {
            const getNotificationsRes = await axios.get(`${baseURL}/api/notifications?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            console.log('✅ Notifications retrieved successfully');
            console.log(`   Status: ${getNotificationsRes.status}`);
            console.log(`   Count: ${getNotificationsRes.data.data.notifications.length}`);
            getNotificationsRes.data.data.notifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.message} (${notif.is_read ? 'Read' : 'Unread'})`);
            });

        } catch (getError) {
            console.log('❌ Failed to get notifications');
            console.log(`   Status: ${getError.response?.status}`);
            console.log(`   Response: ${JSON.stringify(getError.response?.data, null, 2)}`);
        }

        // Test 5: Get unread count
        console.log('\n📋 Test 5: Getting unread count...');
        try {
            const unreadCountRes = await axios.get(`${baseURL}/api/notifications/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            console.log('✅ Unread count retrieved successfully');
            console.log(`   Status: ${unreadCountRes.status}`);
            console.log(`   Unread count: ${unreadCountRes.data.data.unreadCount}`);

        } catch (unreadError) {
            console.log('❌ Failed to get unread count');
            console.log(`   Status: ${unreadError.response?.status}`);
            console.log(`   Response: ${JSON.stringify(unreadError.response?.data, null, 2)}`);
        }

        console.log('\n🎉 Notification API test completed!');
        console.log('💡 The notification system should now work in the frontend.');

    } catch (error) {
        console.error('❌ Notification API test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testNotificationAPIDirect();
