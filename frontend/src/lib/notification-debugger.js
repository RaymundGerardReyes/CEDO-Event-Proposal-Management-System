/**
 * Frontend Notification Debugger
 * Comprehensive debugging for notification authentication and file upload issues
 */

class NotificationDebugger {
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

    async debugNotificationFlow() {
        console.log('🔍 DEBUGGING FRONTEND NOTIFICATION FLOW');
        console.log('=======================================');

        // Step 1: Check environment configuration
        await this.checkEnvironmentConfig();

        // Step 2: Test token extraction
        await this.testTokenExtraction();

        // Step 3: Test notification service configuration
        await this.testNotificationServiceConfig();

        // Step 4: Test API request formation
        await this.testAPIRequestFormation();

        // Step 5: Check file upload configuration
        await this.checkFileUploadConfig();

        // Step 6: Generate comprehensive report
        this.generateReport();
    }

    async checkEnvironmentConfig() {
        this.log('INFO', 'Checking environment configuration...');

        const config = {
            NODE_ENV: process.env.NODE_ENV,
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
            NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
        };

        this.log('INFO', 'Environment variables', config);

        if (!config.NEXT_PUBLIC_API_URL && !config.NEXT_PUBLIC_BACKEND_URL) {
            this.log('WARN', 'No backend URL configured in environment variables');
            this.issues.push({
                type: 'ENV_CONFIG',
                message: 'No backend URL configured',
                solution: 'Set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL in .env.local'
            });
        }
    }

    async testTokenExtraction() {
        this.log('INFO', 'Testing JWT token extraction...');

        try {
            // Check if we're in browser environment
            if (typeof document === 'undefined') {
                this.log('WARN', 'Not in browser environment, skipping token test');
                return;
            }

            // Test token extraction from cookies
            const cookies = document.cookie;
            this.log('INFO', 'Current cookies', { cookies });

            const tokenMatch = cookies.match(/cedo_token=([^;]+)/);
            if (tokenMatch) {
                this.log('SUCCESS', 'JWT token found in cookies', {
                    tokenLength: tokenMatch[1].length,
                    tokenStart: tokenMatch[1].substring(0, 10) + '...'
                });
            } else {
                this.log('ERROR', 'No JWT token found in cookies');
                this.issues.push({
                    type: 'TOKEN_MISSING',
                    message: 'No JWT token found in cookies',
                    solution: 'Ensure user is logged in and token is set in cookies'
                });
            }

            // Test token extraction method
            try {
                const { getAppConfig } = await import('@/lib/utils');
                const appConfig = getAppConfig();
                this.log('INFO', 'App config loaded', {
                    hasBackendUrl: !!appConfig?.backendUrl,
                    backendUrl: appConfig?.backendUrl
                });
            } catch (error) {
                this.log('ERROR', 'Failed to load app config', { error: error.message });
                this.issues.push({
                    type: 'APP_CONFIG_ERROR',
                    message: 'Failed to load app configuration',
                    solution: 'Check utils.js and ensure getAppConfig is working'
                });
            }

        } catch (error) {
            this.log('ERROR', 'Token extraction test failed', { error: error.message });
        }
    }

    async testNotificationServiceConfig() {
        this.log('INFO', 'Testing notification service configuration...');

        try {
            const { notificationService } = await import('@/services/notification-service');

            // Check baseUrl
            if (notificationService.baseUrl) {
                this.log('SUCCESS', 'Notification service has baseUrl', {
                    baseUrl: notificationService.baseUrl
                });
            } else {
                this.log('ERROR', 'Notification service missing baseUrl');
                this.issues.push({
                    type: 'SERVICE_BASE_URL',
                    message: 'Notification service missing baseUrl',
                    solution: 'Configure baseUrl in notification service constructor'
                });
            }

            // Check getAuthToken method
            if (typeof notificationService.getAuthToken === 'function') {
                this.log('SUCCESS', 'Notification service has getAuthToken method');

                // Test token extraction
                const token = notificationService.getAuthToken();
                if (token) {
                    this.log('SUCCESS', 'Token extracted successfully', {
                        tokenLength: token.length,
                        tokenStart: token.substring(0, 10) + '...'
                    });
                } else {
                    this.log('WARN', 'No token returned from getAuthToken');
                }
            } else {
                this.log('ERROR', 'Notification service missing getAuthToken method');
                this.issues.push({
                    type: 'SERVICE_AUTH_METHOD',
                    message: 'Notification service missing getAuthToken method',
                    solution: 'Add getAuthToken method to extract JWT from cookies'
                });
            }

        } catch (error) {
            this.log('ERROR', 'Failed to test notification service', { error: error.message });
            this.issues.push({
                type: 'SERVICE_IMPORT_ERROR',
                message: 'Failed to import notification service',
                solution: 'Check notification service file exists and is properly exported'
            });
        }
    }

    async testAPIRequestFormation() {
        this.log('INFO', 'Testing API request formation...');

        try {
            const { notificationService } = await import('@/services/notification-service');

            // Test request URL formation
            const testUrl = `${notificationService.baseUrl}/api/notifications`;
            this.log('INFO', 'Test request URL', { url: testUrl });

            // Test request headers
            const testHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${notificationService.getAuthToken() || 'test-token'}`
            };
            this.log('INFO', 'Test request headers', testHeaders);

            // Test request body
            const testBody = {
                targetType: 'user',
                targetUserId: 1,
                title: 'Test Notification',
                message: 'This is a test notification',
                notificationType: 'info',
                priority: 'normal'
            };
            this.log('INFO', 'Test request body', testBody);

            this.log('SUCCESS', 'API request formation test completed');

        } catch (error) {
            this.log('ERROR', 'API request formation test failed', { error: error.message });
        }
    }

    async checkFileUploadConfig() {
        this.log('INFO', 'Checking file upload configuration...');

        try {
            // Check Next.js configuration for body size limit
            const nextConfig = await import('../../next.config.js');
            this.log('INFO', 'Next.js config loaded', {
                hasServerActions: !!nextConfig.default?.serverActions,
                hasBodySizeLimit: !!nextConfig.default?.serverActions?.bodySizeLimit
            });

            if (nextConfig.default?.serverActions?.bodySizeLimit) {
                this.log('SUCCESS', 'Body size limit configured', {
                    limit: nextConfig.default.serverActions.bodySizeLimit
                });
            } else {
                this.log('WARN', 'No body size limit configured');
                this.issues.push({
                    type: 'BODY_SIZE_LIMIT',
                    message: 'No body size limit configured in Next.js',
                    solution: 'Add bodySizeLimit to serverActions in next.config.js'
                });
            }

        } catch (error) {
            this.log('ERROR', 'Failed to check file upload config', { error: error.message });
        }
    }

    generateReport() {
        console.log('\n📊 FRONTEND DEBUG REPORT');
        console.log('=========================');

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
        console.log('1. Ensure JWT token is properly set in cookies after login');
        console.log('2. Configure backend URL in environment variables');
        console.log('3. Add body size limit to Next.js configuration');
        console.log('4. Test notification service with proper authentication');
        console.log('5. Monitor network requests in browser dev tools');

        console.log('\n📋 Next Steps:');
        console.log('1. Fix identified issues above');
        console.log('2. Test authentication flow in browser');
        console.log('3. Verify notification creation works');
        console.log('4. Check file upload size limits');

        // Save debug log to localStorage if in browser
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('notification-debug-log', JSON.stringify(this.debugLog));
            console.log('\n💾 Debug log saved to localStorage');
        }
    }
}

// Export for use in components
export default NotificationDebugger;

// Auto-run debugger in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const debugger = new NotificationDebugger();
    debugger.debugNotificationFlow().catch(console.error);
}
