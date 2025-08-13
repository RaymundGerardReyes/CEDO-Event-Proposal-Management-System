#!/usr/bin/env node

/**
 * Test script to verify all our recent endpoint fixes are working
 * Tests the MySQL-only routes and draftId mapping functionality
 */

// Use native fetch (Node.js 18+) or fallback to simple HTTP testing
const https = require('https');
const http = require('http');

const jwt = require('jsonwebtoken');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Create test tokens
const studentToken = jwt.sign({
    id: 17,
    email: 'raymundgerardrestaca@gmail.com',
    role: 'student'
}, JWT_SECRET);

const adminToken = jwt.sign({
    id: 1,
    email: 'admin@cedo.gov.ph',
    role: 'head_admin'
}, JWT_SECRET);

console.log('🧪 CEDO API Endpoint Testing Suite');
console.log('===================================');

async function testEndpoint(name, url, options = {}) {
    try {
        console.log(`\n🔍 Testing: ${name}`);
        console.log(`📡 URL: ${url}`);

        const response = await fetch(url, {
            ...options,
            timeout: 10000
        });

        const status = response.status;
        const statusText = response.statusText;

        console.log(`📊 Status: ${status} ${statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success:`, JSON.stringify(data, null, 2));
            return { success: true, data };
        } else {
            const errorText = await response.text();
            console.log(`❌ Error:`, errorText);
            return { success: false, error: errorText };
        }
    } catch (error) {
        console.log(`💥 Network Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const tests = [
        // Basic health checks
        {
            name: 'Basic Health Check',
            url: `${BASE_URL}/health`
        },
        {
            name: 'API Health Check',
            url: `${BASE_URL}/api/health`
        },

        // MySQL-only endpoints
        {
            name: 'MySQL Health Check',
            url: `${BASE_URL}/api/mongodb-unified/mysql-health`
        },
        {
            name: 'MySQL Test Endpoint',
            url: `${BASE_URL}/api/mongodb-unified/mysql-test`
        },

        // Authentication-required endpoints
        {
            name: 'User Proposals (with auth)',
            url: `${BASE_URL}/api/mongodb-unified/user-proposals`,
            options: {
                headers: {
                    'Authorization': `Bearer ${studentToken}`
                }
            }
        },
        {
            name: 'User Proposals (without auth)',
            url: `${BASE_URL}/api/mongodb-unified/user-proposals`
        },

        // DraftId lookup endpoints
        {
            name: 'DraftId Lookup (MongoDB ObjectId)',
            url: `${BASE_URL}/api/mongodb-unified/find-proposal-by-draftid/689724bf8dda6373c70358d8`,
            options: {
                headers: {
                    'Authorization': `Bearer ${studentToken}`
                }
            }
        },

        // Direct proposal lookup
        {
            name: 'Student Proposal (UUID)',
            url: `${BASE_URL}/api/mongodb-unified/student-proposal/eb9237fb-04f7-47d9-b4a1-0c7cbfbb3575`,
            options: {
                headers: {
                    'Authorization': `Bearer ${studentToken}`
                }
            }
        }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        const result = await testEndpoint(test.name, test.url, test.options);
        if (result.success) {
            passed++;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎯 Test Summary');
    console.log('===============');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
        console.log('🎉 All tests passed! Your API is working perfectly.');
    } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
    }
}

// Handle the case where node-fetch is not available
if (typeof fetch === 'undefined') {
    console.log('❌ This script requires node-fetch or Node.js 18+ with native fetch');
    console.log('💡 Install with: npm install node-fetch');
    process.exit(1);
}

runTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});
