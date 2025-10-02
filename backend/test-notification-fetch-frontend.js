#!/usr/bin/env node

/**
 * Test Notification Fetch (Node.js Version)
 * Purpose: Test notification fetching API endpoint from Node.js
 * Key approaches: Direct API testing, authentication verification, data validation
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

class NotificationFetchTester {
    constructor() {
        this.debugLog = [];
        this.issues = [];
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        this.debugLog.push(logEntry);

        const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'SUCCESS' ? '✅' : '🔍';
        console.log(`${emoji} [${level}] ${message}`);
        if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    }

    async testNotificationFetch() {
        console.log('🧪 Testing Notification Fetch API (Node.js)');
        console.log('==========================================\n');

        // Step 1: Test server health
        await this.testServerHealth();

        // Step 2: Test API endpoint without auth
        await this.testAPIWithoutAuth();

        // Step 3: Test API endpoint with mock auth
        await this.testAPIWithMockAuth();

        // Step 4: Test database directly
        await this.testDatabaseDirectly();

        // Step 5: Generate report
        this.generateReport();
    }

    async testServerHealth() {
        this.log('INFO', 'Testing server health...');

        try {
            const response = await fetch(`${BASE_URL}/`);
            const data = await response.json();

            if (data.status === 'OK') {
                this.log('SUCCESS', 'Backend server is running', {
                    status: data.status,
                    database: data.database,
                    environment: data.environment
                });
                return true;
            } else {
                this.log('ERROR', 'Server health check failed');
                return false;
            }
        } catch (error) {
            this.log('ERROR', 'Server health check failed', { error: error.message });
            this.issues.push({
                type: 'SERVER_DOWN',
                message: 'Backend server is not running',
                solution: 'Start the backend server with: cd backend && npm start'
            });
            return false;
        }
    }

    async testAPIWithoutAuth() {
        this.log('INFO', 'Testing API endpoint without authentication...');

        try {
            const response = await fetch(`${BASE_URL}/api/notifications`);
            const data = await response.json();

            if (response.status === 401) {
                this.log('SUCCESS', 'API correctly requires authentication (401)');
                return true;
            } else {
                this.log('WARN', 'Unexpected response without auth', {
                    status: response.status,
                    data: data
                });
                return false;
            }
        } catch (error) {
            this.log('ERROR', 'API test without auth failed', { error: error.message });
            return false;
        }
    }

    async testAPIWithMockAuth() {
        this.log('INFO', 'Testing API endpoint with mock authentication...');

        try {
            const response = await fetch(`${BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': 'Bearer mock-token-123',
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.status === 401) {
                this.log('SUCCESS', 'Authentication properly validates tokens (401)');
                return true;
            } else if (response.status === 200) {
                this.log('SUCCESS', 'Mock authentication worked', {
                    notificationCount: data.data?.length || 0
                });
                return true;
            } else {
                this.log('WARN', 'Unexpected response with mock auth', {
                    status: response.status,
                    data: data
                });
                return false;
            }
        } catch (error) {
            this.log('ERROR', 'API test with mock auth failed', { error: error.message });
            return false;
        }
    }

    async testDatabaseDirectly() {
        this.log('INFO', 'Testing database directly...');

        try {
            const { Pool } = require('pg');
            const pool = new Pool({
                user: process.env.POSTGRES_USER || 'postgres',
                host: process.env.POSTGRES_HOST || 'localhost',
                database: process.env.POSTGRES_DATABASE || 'cedo_auth',
                password: process.env.POSTGRES_PASSWORD || 'password',
                port: process.env.POSTGRES_PORT || 5432,
            });

            // Check notifications count
            const countResult = await pool.query(`
                SELECT COUNT(*) as count 
                FROM notifications 
                WHERE target_user_id = 1 OR target_type = 'all'
            `);

            this.log('SUCCESS', 'Database connection successful', {
                notificationCount: countResult.rows[0].count
            });

            // Get sample notifications
            const sampleResult = await pool.query(`
                SELECT id, title, message, target_type, notification_type, priority, created_at
                FROM notifications 
                WHERE target_user_id = 1 OR target_type = 'all'
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            this.log('INFO', 'Sample notifications in database:');
            sampleResult.rows.forEach((notification, index) => {
                this.log('INFO', `   ${index + 1}. ${notification.title} (${notification.notification_type})`);
            });

            await pool.end();
            return true;

        } catch (error) {
            this.log('ERROR', 'Database test failed', { error: error.message });
            this.issues.push({
                type: 'DATABASE_ERROR',
                message: 'Database connection failed',
                solution: 'Check database configuration and connection'
            });
            return false;
        }
    }

    generateReport() {
        console.log('\n📊 NOTIFICATION FETCH TEST REPORT');
        console.log('==================================');

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

        console.log('\n🔧 Recommended Actions:');
        console.log('1. Ensure backend server is running');
        console.log('2. Check database connection');
        console.log('3. Test API endpoint accessibility');
        console.log('4. Verify authentication is working');
        console.log('5. Test frontend notification fetching');

        console.log('\n📋 Next Steps:');
        console.log('1. Start frontend server: cd frontend && npm run dev');
        console.log('2. Open browser and navigate to your app');
        console.log('3. Open browser dev tools (F12)');
        console.log('4. Check console for notification debug logs');
        console.log('5. Test notification panel functionality');
    }
}

// Run the test
const tester = new NotificationFetchTester();
tester.testNotificationFetch().catch(console.error);
