/**
 * Test Correct Credentials
 * Purpose: Find the correct login credentials for testing
 * Key approaches: Database user verification, credential testing
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

async function testCorrectCredentials() {
    try {
        console.log('🔍 Testing Correct Credentials...\n');

        // Get all users with their details
        const usersResult = await pool.query(`
            SELECT id, name, email, role, password, google_id, is_approved
            FROM users 
            ORDER BY id
        `);

        console.log('📋 All Users in Database:');
        usersResult.rows.forEach(user => {
            console.log(`   ID: ${user.id}, Name: ${user.name}`);
            console.log(`   Email: ${user.email}, Role: ${user.role}`);
            console.log(`   Password: ${user.password ? 'SET' : 'NOT SET'}`);
            console.log(`   Google ID: ${user.google_id || 'NOT SET'}`);
            console.log(`   Approved: ${user.is_approved}`);
            console.log('');
        });

        // Test different login credentials
        const testCredentials = [
            { email: 'manager@cedo.gov.ph', password: 'password123' },
            { email: 'admin@cedo.gov.ph', password: 'password123' },
            { email: 'admin@cedo.gov.ph', password: 'admin123' },
            { email: 'admin@cedo.gov.ph', password: 'admin' },
            { email: 'manager@cedo.gov.ph', password: 'manager123' },
            { email: 'manager@cedo.gov.ph', password: 'manager' },
        ];

        console.log('📋 Testing Login Credentials:');
        for (const cred of testCredentials) {
            try {
                console.log(`   Testing: ${cred.email} / ${cred.password}`);
                const loginResponse = await axios.post('http://127.0.0.1:5000/api/auth/login', {
                    email: cred.email,
                    password: cred.password
                });

                if (loginResponse.status === 200) {
                    console.log(`   ✅ SUCCESS! Token: ${loginResponse.data.token.substring(0, 20)}...`);

                    // Test notifications API with this token
                    try {
                        const notificationsResponse = await axios.get('http://127.0.0.1:5000/api/notifications?page=1&limit=50', {
                            headers: {
                                'Authorization': `Bearer ${loginResponse.data.token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        console.log(`   📧 Notifications API: ${notificationsResponse.data.data.notifications.length} notifications`);
                        if (notificationsResponse.data.data.notifications.length > 0) {
                            console.log(`   📧 First notification: ${notificationsResponse.data.data.notifications[0].message}`);
                        }
                    } catch (notifError) {
                        console.log(`   ❌ Notifications API failed: ${notifError.response?.status}`);
                    }
                    break; // Stop testing once we find working credentials
                }
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
            }
        }

        // Check if there are any users with Google authentication
        console.log('\n📋 Google Authentication Users:');
        const googleUsers = usersResult.rows.filter(user => user.google_id);
        if (googleUsers.length > 0) {
            console.log('   Users with Google ID:');
            googleUsers.forEach(user => {
                console.log(`   - ${user.name} (${user.email}): ${user.google_id}`);
            });
        } else {
            console.log('   No users with Google authentication found');
        }

        console.log('\n🎉 Credential testing completed!');

    } catch (error) {
        console.error('❌ Credential testing failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
testCorrectCredentials();
