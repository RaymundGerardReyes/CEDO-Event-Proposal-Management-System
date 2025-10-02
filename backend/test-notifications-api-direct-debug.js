/**
 * Test Notifications API Direct Debug
 * Purpose: Test the notifications API endpoint directly to identify authentication issues
 * Key approaches: Direct API testing, authentication debugging, response analysis
 */

require('dotenv').config();
const axios = require('axios');

async function testNotificationsAPIDirectDebug() {
    try {
        console.log('🧪 Testing Notifications API Direct Debug...\n');

        const baseURL = 'http://127.0.0.1:5000';

        // Test 1: Try to get auth token
        console.log('🔐 Test 1: Getting authentication token...');
        try {
            const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
                email: 'manager@cedo.gov.ph',
                password: 'password123'
            });

            if (loginRes.status === 200) {
                console.log('✅ Auth token obtained successfully');
                const authToken = loginRes.data.token;
                console.log(`   Token (first 20 chars): ${authToken.substring(0, 20)}...`);

                // Test 2: Try to get notifications with the token
                console.log('\n📋 Test 2: Getting notifications with auth token...');
                try {
                    const notificationsRes = await axios.get(`${baseURL}/api/notifications?limit=50`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('✅ Notifications API call successful');
                    console.log(`   Status: ${notificationsRes.status}`);
                    console.log(`   Success: ${notificationsRes.data.success}`);
                    console.log(`   Notifications count: ${notificationsRes.data.data.notifications.length}`);

                    if (notificationsRes.data.data.notifications.length > 0) {
                        console.log('\n   Recent notifications:');
                        notificationsRes.data.data.notifications.slice(0, 5).forEach((notif, index) => {
                            console.log(`   ${index + 1}. ${notif.message} (${notif.isRead ? 'Read' : 'Unread'})`);
                        });
                    } else {
                        console.log('   ⚠️ No notifications returned');
                    }

                } catch (notificationsError) {
                    console.log('❌ Notifications API call failed');
                    console.log(`   Status: ${notificationsError.response?.status}`);
                    console.log(`   Response: ${JSON.stringify(notificationsError.response?.data, null, 2)}`);
                }

                // Test 3: Try to get unread count
                console.log('\n🔢 Test 3: Getting unread count...');
                try {
                    const unreadRes = await axios.get(`${baseURL}/api/notifications/unread-count`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('✅ Unread count API call successful');
                    console.log(`   Status: ${unreadRes.status}`);
                    console.log(`   Unread count: ${unreadRes.data.data.unreadCount}`);

                } catch (unreadError) {
                    console.log('❌ Unread count API call failed');
                    console.log(`   Status: ${unreadError.response?.status}`);
                    console.log(`   Response: ${JSON.stringify(unreadError.response?.data, null, 2)}`);
                }

            } else {
                console.log('❌ Failed to get auth token');
                console.log(`   Status: ${loginRes.status}`);
                console.log(`   Response: ${JSON.stringify(loginRes.data, null, 2)}`);
            }

        } catch (loginError) {
            console.log('❌ Login failed');
            console.log(`   Error: ${loginError.message}`);
            if (loginError.response) {
                console.log(`   Status: ${loginError.response.status}`);
                console.log(`   Response: ${JSON.stringify(loginError.response.data, null, 2)}`);
            }
        }

        // Test 4: Test with different user credentials
        console.log('\n👤 Test 4: Testing with different user credentials...');
        try {
            const adminLoginRes = await axios.post(`${baseURL}/api/auth/login`, {
                email: 'admin@cedo.gov.ph',
                password: 'password123'
            });

            if (adminLoginRes.status === 200) {
                console.log('✅ Admin auth token obtained');
                const adminToken = adminLoginRes.data.token;

                const adminNotificationsRes = await axios.get(`${baseURL}/api/notifications?limit=50`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`   Admin notifications count: ${adminNotificationsRes.data.data.notifications.length}`);
            }

        } catch (adminError) {
            console.log('❌ Admin login failed');
            console.log(`   Error: ${adminError.message}`);
        }

        console.log('\n🎉 API testing completed!');
        console.log('💡 If the API works but frontend shows empty:');
        console.log('   1. Check if frontend is using the correct authentication token');
        console.log('   2. Check if the token is being sent in the Authorization header');
        console.log('   3. Check if the user ID in the token matches the recipient_id in notifications');
        console.log('   4. Check browser console for any JavaScript errors');

    } catch (error) {
        console.error('❌ API testing failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testNotificationsAPIDirectDebug();
