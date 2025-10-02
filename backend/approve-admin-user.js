#!/usr/bin/env node

/**
 * Approve Admin User
 * 
 * This script approves the test admin user so it can authenticate
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

async function approveAdminUser() {
    console.log('🔧 Approving Admin User...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Update the admin user to be approved
        const result = await pool.query(`
            UPDATE users 
            SET is_approved = true, updated_at = NOW()
            WHERE email = $1 AND role = $2
            RETURNING id, email, role, is_approved
        `, ['admin@test.com', 'admin']);

        if (result.rows.length > 0) {
            console.log('✅ Admin user approved successfully');
            console.log('📊 User details:', result.rows[0]);
            return true;
        } else {
            console.log('⚠️  No admin user found to approve');
            return false;
        }

    } catch (error) {
        console.error('❌ Failed to approve admin user:', error.message);
        return false;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    const axios = require('axios');

    try {
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

                console.log('\n🎯 SUCCESS! Your authentication is now working!');
                console.log('\n📋 Frontend Authentication Setup:');
                console.log('===================================');
                console.log('1. Add this token to your frontend localStorage:');
                console.log(`   localStorage.setItem('cedo_token', '${loginResponse.data.token}');`);
                console.log('\n2. Or add it to your browser cookies:');
                console.log(`   document.cookie = 'cedo_token=${loginResponse.data.token}; path=/; SameSite=Lax';`);
                console.log('\n3. Or use this in your frontend API calls:');
                console.log(`   Authorization: Bearer ${loginResponse.data.token}`);

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

async function runApproval() {
    console.log('🚀 Starting Admin User Approval\n');

    try {
        const approved = await approveAdminUser();

        if (approved) {
            const authWorking = await testAuthentication();

            if (authWorking) {
                console.log('\n✅ Authentication is now working correctly!');
                console.log('\n🎯 Your frontend should now be able to fetch proposal data properly.');
                console.log('   The "TBD" and empty values issue should be resolved.');
            } else {
                console.log('\n❌ Authentication is still not working. Please check your backend configuration.');
            }
        } else {
            console.log('\n❌ Failed to approve admin user.');
        }

    } catch (error) {
        console.error('\n❌ Approval failed:', error.message);
    }
}

// Run the approval if this file is executed directly
if (require.main === module) {
    runApproval().catch(console.error);
}

module.exports = {
    runApproval,
    approveAdminUser,
    testAuthentication
};





