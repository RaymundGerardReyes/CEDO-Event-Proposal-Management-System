/**
 * Simple Notifications API Test
 * Purpose: Test notifications API with existing server
 * Key approaches: Direct API testing, authentication simulation
 */

const request = require('supertest');
const app = require('./server');
const jwt = require('jsonwebtoken');

async function testNotificationsSimple() {
    console.log('🧪 SIMPLE NOTIFICATIONS API TEST');
    console.log('='.repeat(50));

    try {
        // 1. Generate JWT token for admin user
        console.log('\n🔐 1. GENERATING JWT TOKEN');
        console.log('-'.repeat(30));

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const authToken = jwt.sign(
            {
                userId: 1, // CEDO Head Administrator
                email: 'admin@cedo.gov.ph',
                role: 'head_admin'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`✅ JWT token generated: ${authToken.substring(0, 20)}...`);

        // 2. Test notifications endpoint
        console.log('\n📡 2. TESTING NOTIFICATIONS ENDPOINT');
        console.log('-'.repeat(30));

        const response = await request(app)
            .get('/api/notifications?page=1&limit=10')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ Notifications endpoint working');
        console.log(`   Status: ${response.body.success}`);
        console.log(`   Notifications count: ${response.body.data?.notifications?.length || 0}`);

        if (response.body.data?.notifications?.length > 0) {
            console.log('\n🔔 Recent notifications:');
            response.body.data.notifications.slice(0, 3).forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.message.substring(0, 60)}... (Read: ${notif.isRead})`);
            });
        }

        // 3. Test unread count
        console.log('\n🔢 3. TESTING UNREAD COUNT');
        console.log('-'.repeat(30));

        const unreadResponse = await request(app)
            .get('/api/notifications/unread-count')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ Unread count endpoint working');
        console.log(`   Unread count: ${unreadResponse.body.data?.unreadCount || 0}`);

        // 4. Test mark as read
        console.log('\n✅ 4. TESTING MARK AS READ');
        console.log('-'.repeat(30));

        if (response.body.data?.notifications?.length > 0) {
            const notificationId = response.body.data.notifications[0].id;

            const markReadResponse = await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            console.log('✅ Mark as read endpoint working');
            console.log(`   Marked notification ${notificationId} as read`);
        }

        console.log('\n🎉 ALL API TESTS PASSED!');
        console.log('💡 Your notifications API is working correctly.');
        console.log('🔧 If notifications still don\'t appear in frontend:');
        console.log('   1. Check browser console for errors');
        console.log('   2. Verify frontend is using correct backend URL');
        console.log('   3. Check authentication token in browser cookies');
        console.log('   4. Test the frontend notifications component directly');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response body:', error.response.body);
        }
    }
}

// Run the test
testNotificationsSimple();
