#!/usr/bin/env node

/**
 * Test Profile Endpoint
 * 
 * Tests the profile endpoint to debug the authentication issues
 */

// Use built-in fetch (Node.js 18+)

async function testProfileEndpoint() {
    console.log('🧪 Testing Profile Endpoint...\n');

    try {
        // Test 1: No authentication
        console.log('📝 Test 1: No authentication');
        const response1 = await fetch('http://localhost:5000/api/profile');
        console.log('📡 Response status:', response1.status);
        const responseText1 = await response1.text();
        console.log('📡 Response body:', responseText1);

        // Test 2: Invalid token
        console.log('\n📝 Test 2: Invalid token');
        const response2 = await fetch('http://localhost:5000/api/profile', {
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });
        console.log('📡 Response status:', response2.status);
        const responseText2 = await response2.text();
        console.log('📡 Response body:', responseText2);

        // Test 3: Check if there are any users in the database
        console.log('\n📝 Test 3: Check database connectivity');
        try {
            const { query } = require('./config/database-postgresql-only');
            const result = await query('SELECT id, email, name, role FROM users LIMIT 5');
            console.log('📊 Found users:', result.rows.length);
            if (result.rows.length > 0) {
                console.log('👥 Sample users:');
                result.rows.forEach(user => {
                    console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
                });
            }
        } catch (dbError) {
            console.error('❌ Database error:', dbError.message);
        }

        console.log('\n✅ Profile endpoint test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testProfileEndpoint().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testProfileEndpoint };
