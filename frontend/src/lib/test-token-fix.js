/**
 * Test Token Fix (Frontend)
 * Purpose: Test the fixed useNotifications hook to ensure token extraction works
 * Key approaches: Browser testing, token validation, error checking
 */

class TokenFixTester {
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

    async testTokenFix() {
        console.log('🧪 Testing Token Fix (Frontend)');
        console.log('===============================\n');

        // Step 1: Test token extraction
        await this.testTokenExtraction();

        // Step 2: Test useNotifications hook
        await this.testUseNotificationsHook();

        // Step 3: Test API call
        await this.testAPICall();

        // Step 4: Generate report
        this.generateReport();
    }

    async testTokenExtraction() {
        this.log('INFO', 'Testing token extraction...');

        try {
            // Test the getToken function logic
            const getToken = () => {
                if (typeof document === 'undefined') return null;

                const cookieValue = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('cedo_token='))
                    ?.split('=')[1];

                return cookieValue || null;
            };

            const token = getToken();

            if (token) {
                this.log('SUCCESS', 'Token extracted successfully', {
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
                this.log('ERROR', 'No token found in cookies');
                this.issues.push({
                    type: 'NO_TOKEN',
                    message: 'No JWT token found in cookies',
                    solution: 'User needs to log in'
                });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'Token extraction test failed', { error: error.message });
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

    async testAPICall() {
        this.log('INFO', 'Testing API call...');

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
            this.log('ERROR', 'API call test failed', { error: error.message });
            return false;
        }
    }

    generateReport() {
        console.log('\n📊 TOKEN FIX TEST REPORT');
        console.log('========================');

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
        console.log('1. Restart the frontend server to clear cache');
        console.log('2. Clear browser cache and reload the page');
        console.log('3. Check if the token extraction is working');
        console.log('4. Verify API endpoint is accessible');
        console.log('5. Test notification fetching in browser dev tools');

        console.log('\n📋 Next Steps:');
        console.log('1. Stop the frontend server (Ctrl+C)');
        console.log('2. Start the frontend server again: npm run dev');
        console.log('3. Clear browser cache (Ctrl+Shift+R)');
        console.log('4. Test the notification panel');
        console.log('5. Check console for any remaining errors');

        console.log('\n🎯 Expected Result:');
        console.log('The "token is not defined" error should be resolved and notifications should display properly.');
    }
}

// Export for use in components
export default TokenFixTester;

// Auto-run tester in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const tester = new TokenFixTester();
    tester.testTokenFix().catch(console.error);
}
