#!/usr/bin/env node

/**
 * API Testing Script for PostgreSQL Enum Fixes
 * 
 * This script tests the proposal API endpoints to verify that
 * the enum mapping fixes are working correctly.
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
    baseUrl: 'http://localhost:3001',
    jwtToken: null, // Will be set after login
    testResults: []
};

// Test data
const testProposals = [
    {
        name: 'School Organization Test',
        uuid: 'test-school-uuid-12345',
        data: {
            proposal: {
                uuid: 'test-school-uuid-12345',
                organization_name: 'Xavier University',
                organization_type: 'school-based',
                organization_description: 'Premier educational institution',
                contact_name: 'Dr. Maria Santos',
                contact_email: 'maria.santos@xu.edu.ph',
                contact_phone: '088-999-8888',
                event_name: 'Academic Enhancement Workshop',
                event_venue: 'University Auditorium',
                event_start_date: '2024-12-10',
                event_end_date: '2024-12-10',
                event_start_time: '08:00',
                event_end_time: '17:00',
                event_mode: 'offline',
                school_event_type: 'workshop-seminar-webinar',
                school_return_service_credit: '3',
                school_target_audience: ['1st_year', '2nd_year'],
                current_section: 'schoolEvent',
                proposal_status: 'draft',
                form_completion_percentage: 90.0
            },
            files: {
                gpoa: {
                    name: 'workshop-gpoa.pdf',
                    size: 5120,
                    type: 'application/pdf',
                    hasData: true
                }
            }
        }
    },
    {
        name: 'Community Organization Test',
        uuid: 'test-community-uuid-67890',
        data: {
            proposal: {
                uuid: 'test-community-uuid-67890',
                organization_name: 'Cagayan de Oro Community Foundation',
                organization_type: 'community-based',
                organization_description: 'Non-profit community development organization',
                contact_name: 'Mr. Roberto Cruz',
                contact_email: 'roberto.cruz@cdocf.org',
                contact_phone: '088-777-6666',
                event_name: 'Leadership Training Program',
                event_venue: 'Community Center',
                event_start_date: '2024-12-20',
                event_end_date: '2024-12-22',
                event_start_time: '09:00',
                event_end_time: '16:00',
                event_mode: 'hybrid',
                community_event_type: 'leadership-training',
                community_sdp_credits: '2',
                community_target_audience: ['leaders', 'alumni'],
                current_section: 'communityEvent',
                proposal_status: 'draft',
                form_completion_percentage: 85.0
            },
            files: {
                projectProposal: {
                    name: 'leadership-proposal.pdf',
                    size: 3072,
                    type: 'application/pdf',
                    hasData: true
                }
            }
        }
    },
    {
        name: 'Invalid Enum Test (Should Fail)',
        uuid: 'test-invalid-uuid-99999',
        data: {
            proposal: {
                uuid: 'test-invalid-uuid-99999',
                organization_name: 'Error Test Org',
                organization_type: 'invalid-type',
                contact_name: 'Error User',
                contact_email: 'error@example.com',
                event_name: 'Error Event',
                event_venue: 'Error Venue',
                event_start_date: '2024-12-01',
                event_end_date: '2024-12-01',
                current_section: 'invalid-section',
                proposal_status: 'invalid-status'
            }
        },
        shouldFail: true
    }
];

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(config.baseUrl + path);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = client.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Test server health
 */
async function testServerHealth() {
    console.log('🔍 Testing server health...');
    try {
        const response = await makeRequest('GET', '/api/health');
        if (response.statusCode === 200) {
            console.log('✅ Server is running');
            return true;
        } else {
            console.log('❌ Server health check failed:', response.statusCode);
            return false;
        }
    } catch (error) {
        console.log('❌ Server is not running:', error.message);
        return false;
    }
}

/**
 * Test authentication (mock login)
 */
async function testAuthentication() {
    console.log('🔐 Testing authentication...');
    try {
        // For testing purposes, we'll skip actual login
        // In a real scenario, you would login and get a JWT token
        console.log('⚠️  Skipping authentication for testing (set JWT token manually)');
        return true;
    } catch (error) {
        console.log('❌ Authentication failed:', error.message);
        return false;
    }
}

/**
 * Test proposal creation/update
 */
async function testProposal(proposal) {
    console.log(`\n🧪 Testing: ${proposal.name}`);
    console.log(`📋 UUID: ${proposal.uuid}`);

    try {
        const headers = config.jwtToken ? { 'Authorization': `Bearer ${config.jwtToken}` } : {};
        const response = await makeRequest('PUT', `/api/proposals/${proposal.uuid}`, proposal.data, headers);

        const result = {
            name: proposal.name,
            uuid: proposal.uuid,
            statusCode: response.statusCode,
            success: response.statusCode === 200,
            shouldFail: proposal.shouldFail || false,
            response: response.data,
            timestamp: new Date().toISOString()
        };

        if (proposal.shouldFail) {
            if (response.statusCode >= 400) {
                console.log('✅ Test passed - Expected failure occurred');
                console.log(`   Status: ${response.statusCode}`);
                console.log(`   Error: ${response.data.error || 'Unknown error'}`);
            } else {
                console.log('❌ Test failed - Expected failure but got success');
                result.success = false;
            }
        } else {
            if (response.statusCode === 200) {
                console.log('✅ Test passed - Proposal created/updated successfully');
                console.log(`   Status: ${response.statusCode}`);
                console.log(`   Message: ${response.data.message || 'No message'}`);
            } else {
                console.log('❌ Test failed - Unexpected error');
                console.log(`   Status: ${response.statusCode}`);
                console.log(`   Error: ${response.data.error || 'Unknown error'}`);
                result.success = false;
            }
        }

        config.testResults.push(result);
        return result;

    } catch (error) {
        console.log('❌ Test failed with exception:', error.message);
        const result = {
            name: proposal.name,
            uuid: proposal.uuid,
            statusCode: 0,
            success: false,
            shouldFail: proposal.shouldFail || false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        config.testResults.push(result);
        return result;
    }
}

/**
 * Generate test report
 */
function generateReport() {
    console.log('\n📊 TEST REPORT');
    console.log('='.repeat(50));

    const totalTests = config.testResults.length;
    const passedTests = config.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\n📋 Detailed Results:');
    config.testResults.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.name}`);
        console.log(`   UUID: ${result.uuid}`);
        console.log(`   Status: ${result.statusCode}`);
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        console.log(`   Timestamp: ${result.timestamp}`);

        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }

        if (result.response && result.response.message) {
            console.log(`   Message: ${result.response.message}`);
        }
    });

    console.log('\n🎯 Recommendations:');
    if (failedTests > 0) {
        console.log('- Check server logs for detailed error information');
        console.log('- Verify database schema matches expected enum values');
        console.log('- Ensure all required fields are provided');
        console.log('- Check authentication token if using JWT');
    } else {
        console.log('- All tests passed! PostgreSQL enum fixes are working correctly');
        console.log('- You can now test with the frontend application');
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting API Tests for PostgreSQL Enum Fixes');
    console.log('='.repeat(60));

    // Test server health
    const serverHealthy = await testServerHealth();
    if (!serverHealthy) {
        console.log('\n❌ Cannot proceed with tests - server is not running');
        console.log('Please start the backend server first:');
        console.log('  cd backend && npm start');
        process.exit(1);
    }

    // Test authentication
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
        console.log('\n⚠️  Authentication test failed - continuing without JWT token');
    }

    // Run proposal tests
    console.log('\n🧪 Running Proposal Tests...');
    for (const proposal of testProposals) {
        await testProposal(proposal);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate report
    generateReport();
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests, testProposals, makeRequest };






