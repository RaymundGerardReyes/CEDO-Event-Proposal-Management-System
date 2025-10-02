/**
 * Notification Authentication Fix
 * Comprehensive solution for notification authentication issues
 */

class NotificationAuthFix {
    constructor() {
        this.debugLog = [];
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        this.debugLog.push(logEntry);

        const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'SUCCESS' ? '✅' : '🔍';
        console.log(`${emoji} [${level}] ${message}`);
        if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    }

    /**
     * Enhanced token extraction with better error handling
     */
    getAuthToken() {
        try {
            // Method 1: Check cookies
            const cookies = document.cookie;
            const tokenMatch = cookies.match(/cedo_token=([^;]+)/);

            if (tokenMatch) {
                const token = tokenMatch[1];
                this.log('SUCCESS', 'Token extracted from cookies', {
                    tokenLength: token.length,
                    tokenStart: token.substring(0, 20) + '...'
                });
                return token;
            }

            // Method 2: Check localStorage
            const localToken = localStorage.getItem('cedo_token');
            if (localToken) {
                this.log('SUCCESS', 'Token extracted from localStorage', {
                    tokenLength: localToken.length,
                    tokenStart: localToken.substring(0, 20) + '...'
                });
                return localToken;
            }

            // Method 3: Check sessionStorage
            const sessionToken = sessionStorage.getItem('cedo_token');
            if (sessionToken) {
                this.log('SUCCESS', 'Token extracted from sessionStorage', {
                    tokenLength: sessionToken.length,
                    tokenStart: sessionToken.substring(0, 20) + '...'
                });
                return sessionToken;
            }

            this.log('ERROR', 'No authentication token found');
            return null;

        } catch (error) {
            this.log('ERROR', 'Token extraction failed', { error: error.message });
            return null;
        }
    }

    /**
     * Enhanced API request with comprehensive error handling
     */
    async makeNotificationRequest(url, data, options = {}) {
        try {
            const token = this.getAuthToken();

            if (!token) {
                throw new Error('No authentication token available');
            }

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    ...options.headers
                },
                body: JSON.stringify(data),
                ...options
            };

            this.log('INFO', 'Making notification request', {
                url,
                method: requestOptions.method,
                hasAuth: !!requestOptions.headers.Authorization,
                bodySize: requestOptions.body.length
            });

            const response = await fetch(url, requestOptions);

            this.log('INFO', 'Notification request response', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.log('ERROR', 'Notification request failed', {
                    status: response.status,
                    error: errorText
                });

                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('Authentication failed: Invalid or expired token');
                } else if (response.status === 404) {
                    throw new Error('API endpoint not found');
                } else if (response.status === 500) {
                    throw new Error('Server error: ' + errorText);
                } else {
                    throw new Error(`Request failed: ${response.status} - ${errorText}`);
                }
            }

            const result = await response.json();
            this.log('SUCCESS', 'Notification request successful', {
                success: result.success,
                hasData: !!result.data
            });

            return result;

        } catch (error) {
            this.log('ERROR', 'Notification request error', { error: error.message });
            throw error;
        }
    }

    /**
     * Test authentication flow
     */
    async testAuthenticationFlow() {
        this.log('INFO', 'Testing authentication flow...');

        try {
            // Test 1: Check token availability
            const token = this.getAuthToken();
            if (!token) {
                this.log('ERROR', 'No authentication token available');
                return false;
            }

            // Test 2: Validate token format
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                this.log('ERROR', 'Invalid token format');
                return false;
            }

            // Test 3: Check token expiration
            try {
                const payload = JSON.parse(atob(tokenParts[1]));
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp < now) {
                    this.log('ERROR', 'Token is expired');
                    return false;
                }
                this.log('SUCCESS', 'Token is valid and not expired');
            } catch (error) {
                this.log('ERROR', 'Token validation failed', { error: error.message });
                return false;
            }

            // Test 4: Test API endpoint
            try {
                const testData = {
                    targetType: 'user',
                    targetUserId: 1,
                    title: 'Test Notification',
                    message: 'This is a test notification',
                    notificationType: 'info',
                    priority: 'normal'
                };

                const result = await this.makeNotificationRequest('/api/notifications', testData);
                this.log('SUCCESS', 'Authentication flow test passed');
                return true;

            } catch (error) {
                this.log('ERROR', 'API test failed', { error: error.message });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'Authentication flow test failed', { error: error.message });
            return false;
        }
    }

    /**
     * Create notification with enhanced error handling
     */
    async createNotification(notificationData) {
        try {
            this.log('INFO', 'Creating notification', {
                targetType: notificationData.targetType,
                targetUserId: notificationData.targetUserId,
                notificationType: notificationData.notificationType
            });

            const result = await this.makeNotificationRequest('/api/notifications', notificationData);

            this.log('SUCCESS', 'Notification created successfully', {
                id: result.data?.id,
                uuid: result.data?.uuid
            });

            return result.data;

        } catch (error) {
            this.log('ERROR', 'Failed to create notification', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate comprehensive debug report
     */
    generateDebugReport() {
        console.log('\n📊 NOTIFICATION AUTHENTICATION DEBUG REPORT');
        console.log('===========================================');

        console.log('\n🔍 Debug Log:');
        this.debugLog.forEach((entry, index) => {
            const emoji = entry.level === 'ERROR' ? '❌' : entry.level === 'WARN' ? '⚠️' : entry.level === 'SUCCESS' ? '✅' : '🔍';
            console.log(`${index + 1}. ${emoji} [${entry.level}] ${entry.message}`);
            if (entry.data) {
                console.log(`   Data:`, JSON.stringify(entry.data, null, 2));
            }
        });

        console.log('\n🔧 Recommended Actions:');
        console.log('1. Ensure user is logged in and has valid JWT token');
        console.log('2. Check if token is expired and refresh if needed');
        console.log('3. Verify backend server is running');
        console.log('4. Test API endpoint accessibility');
        console.log('5. Monitor network requests in browser dev tools');

        // Save debug log to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('notification-auth-debug-log', JSON.stringify(this.debugLog));
            console.log('\n💾 Debug log saved to localStorage');
        }
    }
}

// Export for use in components
export default NotificationAuthFix;

// Auto-run in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const authFix = new NotificationAuthFix();
    authFix.testAuthenticationFlow().catch(console.error);
}
