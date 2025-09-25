#!/usr/bin/env node

/**
 * Test API Endpoint Script
 * 
 * This script tests the /api/proposals/drafts-and-rejected endpoint with proper authentication
 */

const jwt = require('jsonwebtoken');

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

// Create a test JWT token
function createTestToken() {
    const payload = {
        id: 33,
        email: '20220025162@my.xu.edu.ph',
        role: 'student',
        name: 'RAYMUND GERARD REYES ESTACA',
        organization: 'Raymund Gerard Estaca',
        is_approved: true
    };

    // Load environment variables
    require('dotenv').config();
    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_DEV || 'e08f28c3166266b76e70198e8ed7bf50';
    console.log(`Using JWT secret: ${secret.substring(0, 8)}...`);

    return jwt.sign(payload, secret, { expiresIn: '1h' });
}

async function testApiEndpoint() {
    try {
        log('\n🧪 TESTING API ENDPOINT', 'blue');
        log('='.repeat(50), 'blue');

        // Create test token
        const token = createTestToken();
        log('✅ Test JWT token created', 'green');

        // Test health endpoint first
        log('\n📋 Testing health endpoint...', 'blue');
        const healthResponse = await fetch('http://localhost:5000/health');

        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            log(`✅ Health check passed: ${healthData.status}`, 'green');
        } else {
            log(`❌ Health check failed: ${healthResponse.status}`, 'red');
            return;
        }

        // Test main API endpoint
        log('\n📋 Testing drafts-and-rejected endpoint...', 'blue');
        const apiResponse = await fetch('http://localhost:5000/api/proposals/drafts-and-rejected?includeRejected=true&limit=100&offset=0', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (apiResponse.ok) {
            const data = await apiResponse.json();
            log('✅ API request successful!', 'green');

            // Analyze the response
            log('\n📊 Response Analysis:', 'blue');
            log(`Total proposals: ${data.total || 0}`, 'blue');
            log(`postgresql proposals: ${data.postgresql?.length || 0}`, 'blue');
            log(`postgresql proposals: ${data.postgresql?.length || 0}`, 'blue');
            log(`Sources used: ${data.sources?.join(', ') || 'none'}`, 'blue');

            // Check debug info
            if (data.debug) {
                log('\n🔧 Debug Information:', 'yellow');

                if (data.debug.postgresql) {
                    const postgresql = data.debug.postgresql;
                    log(`postgresql - Attempted: ${postgresql.attempted}, Success: ${postgresql.success}`, postgresql.success ? 'green' : 'red');
                    if (postgresql.error) log(`postgresql Error: ${postgresql.error}`, 'red');
                }

                if (data.debug.postgresql) {
                    const postgresql = data.debug.postgresql;
                    log(`postgresql - Attempted: ${postgresql.attempted}, Success: ${postgresql.success}`, postgresql.success ? 'green' : 'red');
                    if (postgresql.error) log(`postgresql Error: ${postgresql.error}`, 'red');
                    if (postgresql.collections) log(`postgresql Collections: ${postgresql.collections.join(', ')}`, 'blue');
                    if (postgresql.sampleData) {
                        log('postgresql Sample Data:', 'blue');
                        postgresql.sampleData.forEach((sample, index) => {
                            log(`  ${index + 1}. ID: ${sample.id}, Status: ${sample.status}, Email: ${sample.email}`, 'blue');
                        });
                    }
                }
            }

            // Show some sample proposals
            if (data.postgresql && data.postgresql.length > 0) {
                log('\n📝 Sample postgresql Proposals:', 'green');
                data.postgresql.slice(0, 3).forEach((proposal, index) => {
                    log(`  ${index + 1}. ${proposal.name} (${proposal.status})`, 'green');
                });
            }

            if (data.postgresql && data.postgresql.length > 0) {
                log('\n📝 Sample postgresql Proposals:', 'green');
                data.postgresql.slice(0, 3).forEach((proposal, index) => {
                    log(`  ${index + 1}. ${proposal.name} (${proposal.status})`, 'green');
                });
            }

            // Final verdict
            if (data.postgresql && data.postgresql.length > 0) {
                log('\n🎉 SUCCESS: postgresql integration is working!', 'green');
                log(`✅ Found ${data.postgresql.length} postgresql proposals`, 'green');
            } else {
                log('\n⚠️ postgresql integration issue detected', 'yellow');
                log('No postgresql proposals found in response', 'yellow');
            }

        } else {
            log(`❌ API request failed: ${apiResponse.status}`, 'red');
            const errorText = await apiResponse.text();
            log(`Error details: ${errorText}`, 'red');
        }

    } catch (error) {
        log(`❌ Test failed: ${error.message}`, 'red');
        console.error(error);
    }
}

// Run the test
if (require.main === module) {
    testApiEndpoint().catch(console.error);
}

module.exports = { testApiEndpoint }; 