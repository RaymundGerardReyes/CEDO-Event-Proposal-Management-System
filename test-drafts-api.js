#!/usr/bin/env node

/**
 * Test Script for Comprehensive Drafts & Rejected Proposals API
 * 
 * This script tests the new API endpoint to ensure it's working correctly
 * with proper authentication and data fetching from both databases.
 */

const axios = require('axios');

// Configuration
const API_BASE = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthentication() {
    log('\n🔐 Testing Authentication...', 'blue');

    try {
        const response = await axios.post(`${API_BASE}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (response.data.token && response.data.user) {
            log('✅ Authentication successful', 'green');
            return {
                token: response.data.token,
                user: response.data.user
            };
        } else {
            throw new Error('No token or user in response');
        }
    } catch (error) {
        log(`❌ Authentication failed: ${error.response?.data?.message || error.message}`, 'red');
        return null;
    }
}

async function testDraftsAPI(token) {
    log('\n📊 Testing Drafts & Rejected API...', 'blue');

    try {
        const response = await axios.get(`${API_BASE}/api/proposals/drafts-and-rejected`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: {
                status: 'all',
                includeRejected: 'true',
                limit: 10
            }
        });

        if (response.data.success) {
            log('✅ API endpoint working correctly', 'green');
            log(`📈 Total proposals: ${response.data.total}`, 'yellow');
            log(`🗄️ MySQL results: ${response.data.mysql?.length || 0}`, 'yellow');
            log(`🍃 MongoDB results: ${response.data.mongodb?.length || 0}`, 'yellow');
            log(`👤 User role: ${response.data.metadata?.userRole}`, 'yellow');
            log(`📧 User email: ${response.data.metadata?.userEmail}`, 'yellow');

            return response.data;
        } else {
            throw new Error('API returned success: false');
        }
    } catch (error) {
        log(`❌ API test failed: ${error.response?.data?.message || error.message}`, 'red');
        return null;
    }
}

async function testAPIEndpoint(token) {
    log('\n🧪 Testing API Configuration...', 'blue');

    try {
        const response = await axios.get(`${API_BASE}/api/proposals/test-drafts-api`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            log('✅ Test endpoint working', 'green');
            log(`👤 User ID: ${response.data.user?.id}`, 'yellow');
            log(`📧 User Email: ${response.data.user?.email}`, 'yellow');
            log(`🔐 User Role: ${response.data.user?.role}`, 'yellow');

            return response.data;
        } else {
            throw new Error('Test endpoint returned success: false');
        }
    } catch (error) {
        log(`❌ Test endpoint failed: ${error.response?.data?.message || error.message}`, 'red');
        return null;
    }
}

async function testDifferentStatuses(token) {
    log('\n🎯 Testing Different Status Filters...', 'blue');

    const statuses = ['all', 'draft', 'rejected'];

    for (const status of statuses) {
        try {
            const response = await axios.get(`${API_BASE}/api/proposals/drafts-and-rejected`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    status: status,
                    limit: 5
                }
            });

            if (response.data.success) {
                log(`✅ Status '${status}': ${response.data.total} results`, 'green');
            } else {
                log(`❌ Status '${status}': Failed`, 'red');
            }
        } catch (error) {
            log(`❌ Status '${status}': ${error.response?.data?.message || error.message}`, 'red');
        }
    }
}

async function runTests() {
    log('🚀 Starting Comprehensive Drafts API Tests', 'blue');
    log(`🌐 Testing against: ${API_BASE}`, 'yellow');
    log(`👤 Test user: ${TEST_EMAIL}`, 'yellow');

    // Test authentication
    const auth = await testAuthentication();
    if (!auth) {
        log('\n❌ Tests failed: Could not authenticate', 'red');
        return;
    }

    // Test main API
    const apiResult = await testDraftsAPI(auth.token);

    // Test configuration endpoint
    await testAPIEndpoint(auth.token);

    // Test different status filters
    await testDifferentStatuses(auth.token);

    // Summary
    log('\n📋 Test Summary:', 'blue');
    if (apiResult) {
        log('✅ All tests passed successfully!', 'green');
        log('🎉 The comprehensive drafts API is working correctly', 'green');
    } else {
        log('❌ Some tests failed', 'red');
        log('🔧 Please check the implementation and try again', 'yellow');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(error => {
        log(`\n💥 Unexpected error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    runTests,
    testAuthentication,
    testDraftsAPI,
    testAPIEndpoint,
    testDifferentStatuses
}; 