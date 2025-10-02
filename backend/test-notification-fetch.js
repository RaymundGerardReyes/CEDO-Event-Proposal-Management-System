#!/usr/bin/env node

/**
 * Test Notification Fetch
 * Purpose: Test the notification fetching API endpoint
 * Key approaches: Direct API testing, authentication verification, data validation
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function testNotificationFetch() {
    try {
        console.log('🧪 Testing Notification Fetch API');
        console.log('================================\n');

        // Step 1: Test without authentication (should fail)
        console.log('📋 Step 1: Testing without authentication...');
        try {
            const response = await fetch(`${BASE_URL}/api/notifications`);
            const data = await response.json();

            if (response.status === 401) {
                console.log('✅ Correctly requires authentication (401)');
            } else {
                console.log('❌ Should require authentication but got:', response.status);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }

        // Step 2: Test with mock authentication
        console.log('\n📋 Step 2: Testing with mock authentication...');
        try {
            const response = await fetch(`${BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': 'Bearer mock-token-123',
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📊 Response status:', response.status);
            console.log('📊 Response data:', JSON.stringify(data, null, 2));

            if (response.status === 401) {
                console.log('✅ Authentication properly validates tokens');
            } else if (response.status === 200) {
                console.log('✅ Mock authentication worked');
                console.log('📊 Notifications found:', data.data?.length || 0);
            } else {
                console.log('⚠️ Unexpected response:', response.status);
            }
        } catch (error) {
            console.log('❌ Mock auth test failed:', error.message);
        }

        // Step 3: Test server health
        console.log('\n📋 Step 3: Testing server health...');
        try {
            const response = await fetch(`${BASE_URL}/`);
            const data = await response.json();

            if (data.status === 'OK') {
                console.log('✅ Backend server is running');
                console.log('📊 Database:', data.database);
                console.log('📊 Environment:', data.environment);
            } else {
                console.log('❌ Server health check failed');
            }
        } catch (error) {
            console.log('❌ Server health check failed:', error.message);
        }

        // Step 4: Test notification service directly
        console.log('\n📋 Step 4: Testing notification service directly...');
        try {
            const { Pool } = require('pg');
            const pool = new Pool({
                user: process.env.POSTGRES_USER || 'postgres',
                host: process.env.POSTGRES_HOST || 'localhost',
                database: process.env.POSTGRES_DATABASE || 'cedo_auth',
                password: process.env.POSTGRES_PASSWORD || 'password',
                port: process.env.POSTGRES_PORT || 5432,
            });

            // Check if notifications exist in database
            const result = await pool.query(`
                SELECT COUNT(*) as count 
                FROM notifications 
                WHERE target_user_id = 1 OR target_type = 'all'
            `);

            console.log('📊 Notifications in database:', result.rows[0].count);

            // Get sample notifications
            const sampleResult = await pool.query(`
                SELECT id, title, message, target_type, notification_type, priority, created_at
                FROM notifications 
                WHERE target_user_id = 1 OR target_type = 'all'
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            console.log('📊 Sample notifications:');
            sampleResult.rows.forEach((notification, index) => {
                console.log(`   ${index + 1}. ${notification.title} (${notification.notification_type})`);
            });

            await pool.end();

        } catch (error) {
            console.log('❌ Database test failed:', error.message);
        }

        console.log('\n🎉 Notification fetch test completed!');
        console.log('\n📋 Summary:');
        console.log('1. Check if backend server is running');
        console.log('2. Verify authentication is working');
        console.log('3. Check if notifications exist in database');
        console.log('4. Test API endpoint accessibility');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testNotificationFetch();
