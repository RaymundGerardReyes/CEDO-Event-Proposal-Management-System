#!/usr/bin/env node

/**
 * Fix Authentication Issue
 * 
 * This script helps fix the authentication issue that's preventing
 * the frontend from fetching proposal data properly.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
};

async function checkDatabaseUsers() {
    console.log('🔧 Checking Database Users...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Check if users table exists and has data
        const usersResult = await pool.query('SELECT id, email, role FROM users LIMIT 5');

        if (usersResult.rows.length > 0) {
            console.log('✅ Users table has data:');
            usersResult.rows.forEach(user => {
                console.log(`   ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
            });
            return usersResult.rows;
        } else {
            console.log('⚠️  No users found in database');
            return [];
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        return [];
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

async function createTestAdminUser() {
    console.log('\n🔧 Creating Test Admin User...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Check if admin user already exists
        const existingAdmin = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND role = $2',
            ['admin@test.com', 'admin']
        );

        if (existingAdmin.rows.length > 0) {
            console.log('✅ Admin user already exists');
            return existingAdmin.rows[0].id;
        }

        // Create admin user
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const result = await pool.query(`
            INSERT INTO users (email, password, role, name, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id
        `, ['admin@test.com', hashedPassword, 'admin', 'Test Admin']);

        console.log('✅ Test admin user created with ID:', result.rows[0].id);
        return result.rows[0].id;

    } catch (error) {
        console.error('❌ Failed to create admin user:', error.message);
        return null;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

async function testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');

    const axios = require('axios');

    try {
        // Test login with the admin user
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });

        if (loginResponse.data.success && loginResponse.data.token) {
            console.log('✅ Authentication successful');
            console.log('📊 Token received:', loginResponse.data.token.substring(0, 20) + '...');

            // Test API call with the token
            const proposalsResponse = await axios.get('http://localhost:5000/api/admin/proposals', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.token}`
                },
                params: {
                    page: 1,
                    limit: 3,
                    status: 'all'
                }
            });

            if (proposalsResponse.data.success) {
                console.log('✅ API call with authentication successful');
                console.log(`📊 Found ${proposalsResponse.data.proposals?.length || 0} proposals`);

                if (proposalsResponse.data.proposals?.length > 0) {
                    const proposal = proposalsResponse.data.proposals[0];
                    console.log('\n📋 Sample Proposal Data:');
                    console.log(`   Event Name: ${proposal.eventName || 'NULL'}`);
                    console.log(`   Organization: ${proposal.organization || 'NULL'}`);
                    console.log(`   Contact: ${proposal.contact?.name || 'NULL'} (${proposal.contact?.email || 'NULL'})`);
                    console.log(`   Status: ${proposal.status || 'NULL'}`);
                    console.log(`   Date: ${proposal.date || 'NULL'}`);
                    console.log(`   Type: ${proposal.type || 'NULL'}`);
                }

                return true;
            } else {
                console.log('❌ API call failed:', proposalsResponse.data.error);
                return false;
            }
        } else {
            console.log('❌ Login failed:', loginResponse.data.error);
            return false;
        }

    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        return false;
    }
}

async function generateAuthToken() {
    console.log('\n🔑 Generating Auth Token for Frontend...');

    try {
        const axios = require('axios');

        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });

        if (loginResponse.data.success && loginResponse.data.token) {
            console.log('✅ Auth token generated successfully');
            console.log('\n📋 Frontend Authentication Setup:');
            console.log('===================================');
            console.log('1. Add this token to your frontend localStorage:');
            console.log(`   localStorage.setItem('cedo_token', '${loginResponse.data.token}');`);
            console.log('\n2. Or add it to your browser cookies:');
            console.log(`   document.cookie = 'cedo_token=${loginResponse.data.token}; path=/; SameSite=Lax';`);
            console.log('\n3. Or use this in your frontend API calls:');
            console.log(`   Authorization: Bearer ${loginResponse.data.token}`);

            return loginResponse.data.token;
        } else {
            console.log('❌ Failed to generate auth token');
            return null;
        }

    } catch (error) {
        console.error('❌ Token generation failed:', error.message);
        return null;
    }
}

async function runFix() {
    console.log('🚀 Starting Authentication Fix\n');

    try {
        // Check database users
        const users = await checkDatabaseUsers();

        // Create test admin user if needed
        const adminId = await createTestAdminUser();

        if (!adminId) {
            console.log('\n❌ Failed to create admin user. Please check your database connection.');
            return;
        }

        // Test authentication flow
        const authWorking = await testAuthenticationFlow();

        if (authWorking) {
            console.log('\n✅ Authentication is working correctly!');

            // Generate token for frontend
            const token = await generateAuthToken();

            if (token) {
                console.log('\n🎯 Solution Summary:');
                console.log('===================');
                console.log('✅ Backend server is running');
                console.log('✅ Database connection is working');
                console.log('✅ Admin user exists and can authenticate');
                console.log('✅ API endpoints are working with authentication');
                console.log('✅ Auth token generated for frontend use');

                console.log('\n📋 Next Steps:');
                console.log('==============');
                console.log('1. Use the generated token in your frontend');
                console.log('2. Make sure your frontend is making authenticated requests');
                console.log('3. Check that the ProposalTable component is using the correct API service');
                console.log('4. Verify that the frontend is handling authentication properly');

                console.log('\n🔧 Frontend Fix:');
                console.log('================');
                console.log('The issue is that your frontend is not properly authenticated.');
                console.log('Make sure your frontend:');
                console.log('- Has a valid auth token in localStorage or cookies');
                console.log('- Is sending the Authorization header with API requests');
                console.log('- Is using the correct API endpoint URLs');

            } else {
                console.log('\n❌ Failed to generate auth token');
            }
        } else {
            console.log('\n❌ Authentication is not working. Please check your backend configuration.');
        }

    } catch (error) {
        console.error('\n❌ Fix failed:', error.message);
    }
}

// Run the fix if this file is executed directly
if (require.main === module) {
    runFix().catch(console.error);
}

module.exports = {
    runFix,
    checkDatabaseUsers,
    createTestAdminUser,
    testAuthenticationFlow,
    generateAuthToken
};
