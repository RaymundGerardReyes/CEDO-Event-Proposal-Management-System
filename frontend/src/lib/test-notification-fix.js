/**
 * Test Notification Fix (Frontend)
 * Purpose: Test the fixed useNotifications hook in the browser
 * Key approaches: Browser API testing, authentication verification, data flow analysis
 */

class NotificationFixTester {
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

    async testNotificationFix() {
        console.log('🧪 Testing Notification Fix (Frontend)');
        console.log('====================================\n');

        // Step 1: Check authentication
        await this.checkAuthentication();

        // Step 2: Test useNotifications hook
        await this.testUseNotificationsHook();

        // Step 3: Test API endpoint directly
        await this.testAPIEndpoint();

        // Step 4: Test notification components
        await this.testNotificationComponents();

        // Step 5: Generate report
        this.generateReport();
    }

    async checkAuthentication() {
        this.log('INFO', 'Checking authentication...');

        try {
            // Check for JWT token in cookies
            const cookies = document.cookie;
            this.log('INFO', 'Current cookies', { cookies });

            const tokenMatch = cookies.match(/cedo_token=([^;]+)/);
            if (tokenMatch) {
                const token = tokenMatch[1];
                this.log('SUCCESS', 'JWT token found in cookies', {
                    tokenLength: token.length,
                    tokenStart: token.substring(0, 20) + '...'
                });

                // Test token validity
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const now = Math.floor(Date.now() / 1000);

                    if (payload.exp && payload.exp > now) {
                        this.log('SUCCESS', 'Token is valid and not expired', {
                            userId: payload.userId || payload.sub,
                            role: payload.role,
                            expiresAt: new Date(payload.exp * 1000).toISOString()
                        });
                        return true;
                    } else {
                        this.log('ERROR', 'Token is expired', {
                            expiresAt: new Date(payload.exp * 1000).toISOString()
                        });
                        this.issues.push({
                            type: 'TOKEN_EXPIRED',
                            message: 'JWT token is expired',
                            solution: 'User needs to log in again'
                        });
                        return false;
                    }
                } catch (error) {
                    this.log('ERROR', 'Token validation failed', { error: error.message });
                    this.issues.push({
                        type: 'TOKEN_INVALID',
                        message: 'JWT token is invalid',
                        solution: 'User needs to log in again'
                    });
                    return false;
                }
            } else {
                this.log('ERROR', 'No JWT token found in cookies');
                this.issues.push({
                    type: 'NO_TOKEN',
                    message: 'No JWT token found in cookies',
                    solution: 'User needs to log in'
                });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'Authentication check failed', { error: error.message });
            return false;
        }
    }

    async testUseNotificationsHook() {
        this.log('INFO', 'Testing useNotifications hook...');

        try {
            // Test if the hook can be imported
            const { useNotifications } = await import('@/hooks/useNotifications');
            this.log('SUCCESS', 'useNotifications hook imported successfully');

            if (typeof useNotifications === 'function') {
                this.log('SUCCESS', 'useNotifications is a function');

                // Test the getToken function logic
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('cedo_token='))
                    ?.split('=')[1];

                if (token) {
                    this.log('SUCCESS', 'Token extraction logic works', {
                        tokenLength: token.length,
                        tokenStart: token.substring(0, 20) + '...'
                    });
                } else {
                    this.log('ERROR', 'Token extraction failed');
                    this.issues.push({
                        type: 'TOKEN_EXTRACTION_FAILED',
                        message: 'Token extraction from cookies failed',
                        solution: 'Check cookie format and extraction logic'
                    });
                    return false;
                }

                return true;
            } else {
                this.log('ERROR', 'useNotifications is not a function');
                this.issues.push({
                    type: 'HOOK_ERROR',
                    message: 'useNotifications hook is not properly exported',
                    solution: 'Check hooks/useNotifications.js export'
                });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'useNotifications hook test failed', { error: error.message });
            this.issues.push({
                type: 'HOOK_IMPORT_ERROR',
                message: 'Failed to import useNotifications hook',
                solution: 'Check if hooks/useNotifications.js exists and is properly exported'
            });
            return false;
        }
    }

    async testAPIEndpoint() {
        this.log('INFO', 'Testing API endpoint...');

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            if (!token) {
                this.log('ERROR', 'No token available for API test');
                return false;
            }

            // Get backend URL
            const { getAppConfig } = await import('@/lib/utils');
            const appConfig = getAppConfig();
            const backendUrl = appConfig?.backendUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const apiUrl = `${backendUrl}/api/notifications`;
            this.log('INFO', 'Testing API endpoint', { apiUrl });

            try {
                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                this.log('INFO', 'API response received', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });

                if (response.ok) {
                    const data = await response.json();
                    this.log('SUCCESS', 'API request successful', {
                        success: data.success,
                        notificationCount: data.data?.length || 0,
                        hasData: !!data.data
                    });

                    if (data.data && data.data.length > 0) {
                        this.log('SUCCESS', 'Notifications found', {
                            count: data.data.length,
                            firstNotification: {
                                id: data.data[0].id,
                                title: data.data[0].title,
                                type: data.data[0].notification_type
                            }
                        });
                    } else {
                        this.log('WARN', 'No notifications returned from API');
                        this.issues.push({
                            type: 'NO_NOTIFICATIONS',
                            message: 'API returned empty notifications array',
                            solution: 'Check if user has notifications in database'
                        });
                    }

                    return true;
                } else {
                    const errorText = await response.text();
                    this.log('ERROR', 'API request failed', {
                        status: response.status,
                        error: errorText
                    });

                    if (response.status === 401) {
                        this.issues.push({
                            type: 'AUTH_FAILED',
                            message: 'Authentication failed',
                            solution: 'Check if JWT token is valid and not expired'
                        });
                    } else if (response.status === 404) {
                        this.issues.push({
                            type: 'ENDPOINT_NOT_FOUND',
                            message: 'API endpoint not found',
                            solution: 'Check if backend server is running and routes are configured'
                        });
                    } else {
                        this.issues.push({
                            type: 'API_ERROR',
                            message: `API request failed with status ${response.status}`,
                            solution: 'Check backend server logs for errors'
                        });
                    }

                    return false;
                }

            } catch (error) {
                this.log('ERROR', 'API request failed', { error: error.message });
                this.issues.push({
                    type: 'NETWORK_ERROR',
                    message: 'Network request failed',
                    solution: 'Check if backend server is running and accessible'
                });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'API endpoint test failed', { error: error.message });
            return false;
        }
    }

    async testNotificationComponents() {
        this.log('INFO', 'Testing notification components...');

        try {
            // Check if NotificationPanel component exists
            const notificationPanel = document.querySelector('[data-testid="notification-panel"]') ||
                document.querySelector('.notification-panel') ||
                document.querySelector('#notification-panel');

            if (notificationPanel) {
                this.log('SUCCESS', 'NotificationPanel component found');

                // Check if it shows "No notifications" or actual notifications
                const noNotificationsText = notificationPanel.textContent.includes('No notifications');
                const hasNotifications = notificationPanel.querySelector('.notification-item') ||
                    notificationPanel.querySelector('[data-testid="notification-item"]');

                if (noNotificationsText && !hasNotifications) {
                    this.log('WARN', 'NotificationPanel shows "No notifications"');
                    this.issues.push({
                        type: 'NO_NOTIFICATIONS_DISPLAYED',
                        message: 'NotificationPanel shows "No notifications"',
                        solution: 'Check if useNotifications hook is working and API is returning data'
                    });
                } else if (hasNotifications) {
                    this.log('SUCCESS', 'Notifications are displayed in the panel');
                }

                return true;
            } else {
                this.log('WARN', 'NotificationPanel component not found in DOM');
                this.issues.push({
                    type: 'COMPONENT_NOT_FOUND',
                    message: 'NotificationPanel component not found in DOM',
                    solution: 'Check if the component is rendered and has correct selectors'
                });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'Notification components test failed', { error: error.message });
            return false;
        }
    }

    generateReport() {
        console.log('\n📊 NOTIFICATION FIX TEST REPORT');
        console.log('=================================');

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
        console.log('1. Ensure user is logged in with valid JWT token');
        console.log('2. Check if backend server is running');
        console.log('3. Verify API endpoint is accessible');
        console.log('4. Test notification fetching in browser dev tools');
        console.log('5. Check network requests in browser dev tools');

        console.log('\n📋 Next Steps:');
        console.log('1. Fix identified issues above');
        console.log('2. Test authentication flow');
        console.log('3. Verify API endpoint accessibility');
        console.log('4. Test notification fetching');
        console.log('5. Monitor network requests in dev tools');

        console.log('\n🎯 Expected Result:');
        console.log('The NotificationPanel should now display notifications instead of "No notifications"');
    }
}

// Export for use in components
export default NotificationFixTester;

// Auto-run tester in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const tester = new NotificationFixTester();
    tester.testNotificationFix().catch(console.error);
}
