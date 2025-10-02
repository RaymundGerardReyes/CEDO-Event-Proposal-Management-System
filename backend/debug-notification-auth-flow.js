#!/usr/bin/env node

/**
 * Comprehensive Notification Authentication Flow Debugger
 * Based on API debugging best practices to systematically resolve persistent issues
 */

const https = require('https');
const http = require('http');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

class NotificationAuthDebugger {
    constructor() {
        this.debugLog = [];
        this.issues = [];
        this.solutions = [];
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        this.debugLog.push(logEntry);

        const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'SUCCESS' ? '✅' : '🔍';
        console.log(`${emoji} [${level}] ${message}`);
        if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    }

    async debugAuthenticationFlow() {
        console.log('🔍 DEBUGGING NOTIFICATION AUTHENTICATION FLOW');
        console.log('==============================================');

        // Step 1: Check if backend is running
        await this.checkBackendStatus();

        // Step 2: Test authentication endpoint
        await this.testAuthEndpoint();

        // Step 3: Test notification endpoint without auth
        await this.testNotificationEndpointWithoutAuth();

        // Step 4: Test with mock authentication
        await this.testWithMockAuth();

        // Step 5: Analyze frontend token extraction
        await this.analyzeFrontendTokenFlow();

        // Step 6: Generate comprehensive report
        this.generateReport();
    }

    async checkBackendStatus() {
        this.log('INFO', 'Checking backend server status...');

        try {
            const response = await fetch(`${BASE_URL}/`);
            const data = await response.json();

            this.log('SUCCESS', 'Backend server is running', {
                status: data.status,
                database: data.database,
                environment: data.environment
            });

            return true;
        } catch (error) {
            this.log('ERROR', 'Backend server is not accessible', { error: error.message });
            this.issues.push({
                type: 'BACKEND_DOWN',
                message: 'Backend server is not running or not accessible',
                solution: 'Start the backend server with: cd backend && npm start'
            });
            return false;
        }
    }

    async testAuthEndpoint() {
        this.log('INFO', 'Testing authentication endpoint...');

        try {
            const response = await fetch(`${BASE_URL}/api/auth/status`);
            this.log('SUCCESS', 'Auth endpoint accessible', { status: response.status });
            return true;
        } catch (error) {
            this.log('WARN', 'Auth endpoint not accessible', { error: error.message });
            return false;
        }
    }

    async testNotificationEndpointWithoutAuth() {
        this.log('INFO', 'Testing notification endpoint without authentication...');

        try {
            const response = await fetch(`${BASE_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    targetType: 'user',
                    targetUserId: 1,
                    title: 'Test',
                    message: 'Test message',
                    notificationType: 'info'
                })
            });

            const responseText = await response.text();

            if (response.status === 401) {
                this.log('SUCCESS', 'Notification endpoint properly requires authentication', {
                    status: response.status,
                    response: responseText
                });
            } else {
                this.log('WARN', 'Unexpected response from notification endpoint', {
                    status: response.status,
                    response: responseText
                });
            }

            return response.status === 401;
        } catch (error) {
            this.log('ERROR', 'Failed to test notification endpoint', { error: error.message });
            this.issues.push({
                type: 'ENDPOINT_ERROR',
                message: 'Notification endpoint is not accessible',
                solution: 'Check if the notification route is properly configured'
            });
            return false;
        }
    }

    async testWithMockAuth() {
        this.log('INFO', 'Testing notification endpoint with mock authentication...');

        try {
            const response = await fetch(`${BASE_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token-123'
                },
                body: JSON.stringify({
                    targetType: 'user',
                    targetUserId: 1,
                    title: 'Test',
                    message: 'Test message',
                    notificationType: 'info'
                })
            });

            const responseText = await response.text();

            if (response.status === 401) {
                this.log('SUCCESS', 'Authentication properly validates tokens', {
                    status: response.status,
                    response: responseText
                });
            } else if (response.status === 201) {
                this.log('SUCCESS', 'Mock authentication worked', {
                    status: response.status,
                    response: responseText
                });
            } else {
                this.log('WARN', 'Unexpected response with mock auth', {
                    status: response.status,
                    response: responseText
                });
            }

            return true;
        } catch (error) {
            this.log('ERROR', 'Failed to test with mock authentication', { error: error.message });
            return false;
        }
    }

    async analyzeFrontendTokenFlow() {
        this.log('INFO', 'Analyzing frontend token extraction flow...');

        // Check if frontend notification service is properly configured
        try {
            const fs = require('fs');
            const path = require('path');

            const notificationServicePath = path.join(__dirname, '../frontend/src/services/notification-service.js');

            if (fs.existsSync(notificationServicePath)) {
                const content = fs.readFileSync(notificationServicePath, 'utf8');

                // Check for token extraction method
                if (content.includes('getAuthToken')) {
                    this.log('SUCCESS', 'Frontend has getAuthToken method');
                } else {
                    this.log('ERROR', 'Frontend missing getAuthToken method');
                    this.issues.push({
                        type: 'FRONTEND_TOKEN_METHOD',
                        message: 'Frontend notification service missing getAuthToken method',
                        solution: 'Add getAuthToken method to extract JWT from cookies'
                    });
                }

                // Check for Authorization header
                if (content.includes('Authorization')) {
                    this.log('SUCCESS', 'Frontend includes Authorization header');
                } else {
                    this.log('ERROR', 'Frontend missing Authorization header');
                    this.issues.push({
                        type: 'FRONTEND_AUTH_HEADER',
                        message: 'Frontend not sending Authorization header',
                        solution: 'Add Authorization header to fetch requests'
                    });
                }

                // Check for baseUrl configuration
                if (content.includes('baseUrl')) {
                    this.log('SUCCESS', 'Frontend has baseUrl configuration');
                } else {
                    this.log('ERROR', 'Frontend missing baseUrl configuration');
                    this.issues.push({
                        type: 'FRONTEND_BASE_URL',
                        message: 'Frontend missing baseUrl configuration',
                        solution: 'Configure proper backend URL in notification service'
                    });
                }

            } else {
                this.log('ERROR', 'Frontend notification service file not found');
                this.issues.push({
                    type: 'FRONTEND_FILE_MISSING',
                    message: 'Frontend notification service file not found',
                    solution: 'Create notification service file in frontend/src/services/'
                });
            }

        } catch (error) {
            this.log('ERROR', 'Failed to analyze frontend token flow', { error: error.message });
        }
    }

    generateReport() {
        console.log('\n📊 COMPREHENSIVE DEBUG REPORT');
        console.log('==============================');

        console.log('\n🔍 Issues Found:');
        if (this.issues.length === 0) {
            console.log('✅ No issues found!');
        } else {
            this.issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. ${issue.type}`);
                console.log(`   Problem: ${issue.message}`);
                console.log(`   Solution: ${issue.solution}`);
            });
        }

        console.log('\n🔧 Recommended Solutions:');
        console.log('1. Ensure backend server is running: cd backend && npm start');
        console.log('2. Check frontend notification service configuration');
        console.log('3. Verify JWT token extraction in frontend');
        console.log('4. Ensure Authorization header is included in requests');
        console.log('5. Test with proper authentication tokens');

        console.log('\n📋 Next Steps:');
        console.log('1. Fix identified issues above');
        console.log('2. Test authentication flow end-to-end');
        console.log('3. Verify notification creation works');
        console.log('4. Monitor for any remaining issues');

        // Save debug log to file
        const fs = require('fs');
        const debugLogPath = path.join(__dirname, 'notification-auth-debug.log');
        fs.writeFileSync(debugLogPath, JSON.stringify(this.debugLog, null, 2));
        console.log(`\n💾 Debug log saved to: ${debugLogPath}`);
    }
}

// Run debugger if this script is executed directly
if (require.main === module) {
    const authDebugger = new NotificationAuthDebugger();
    authDebugger.debugAuthenticationFlow().catch(console.error);
}

module.exports = NotificationAuthDebugger;
