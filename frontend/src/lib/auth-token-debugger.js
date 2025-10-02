/**
 * Authentication Token Debugger
 * Comprehensive debugging for JWT token extraction and authentication issues
 */

class AuthTokenDebugger {
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

    async debugAuthTokenFlow() {
        console.log('🔍 DEBUGGING AUTHENTICATION TOKEN FLOW');
        console.log('=====================================');

        // Step 1: Check browser environment
        await this.checkBrowserEnvironment();

        // Step 2: Check cookie extraction
        await this.checkCookieExtraction();

        // Step 3: Test token validation
        await this.testTokenValidation();

        // Step 4: Test API request with token
        await this.testAPIRequestWithToken();

        // Step 5: Generate comprehensive report
        this.generateReport();
    }

    async checkBrowserEnvironment() {
        this.log('INFO', 'Checking browser environment...');

        if (typeof document === 'undefined') {
            this.log('ERROR', 'Not in browser environment');
            this.issues.push({
                type: 'BROWSER_ENV',
                message: 'Not running in browser environment',
                solution: 'This debugger must run in browser context'
            });
            return false;
        }

        this.log('SUCCESS', 'Browser environment detected');
        return true;
    }

    async checkCookieExtraction() {
        this.log('INFO', 'Checking cookie extraction...');

        try {
            // Get all cookies
            const allCookies = document.cookie;
            this.log('INFO', 'All cookies', { cookies: allCookies });

            // Check for cedo_token specifically
            const tokenMatch = allCookies.match(/cedo_token=([^;]+)/);
            if (tokenMatch) {
                const token = tokenMatch[1];
                this.log('SUCCESS', 'JWT token found in cookies', {
                    tokenLength: token.length,
                    tokenStart: token.substring(0, 20) + '...',
                    tokenEnd: '...' + token.substring(token.length - 10)
                });

                // Test token format (JWT has 3 parts separated by dots)
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    this.log('SUCCESS', 'Token has correct JWT format', {
                        parts: tokenParts.length,
                        headerLength: tokenParts[0].length,
                        payloadLength: tokenParts[1].length,
                        signatureLength: tokenParts[2].length
                    });
                } else {
                    this.log('WARN', 'Token does not have standard JWT format', {
                        parts: tokenParts.length
                    });
                }

                return token;
            } else {
                this.log('ERROR', 'No cedo_token found in cookies');
                this.issues.push({
                    type: 'TOKEN_MISSING',
                    message: 'No cedo_token found in cookies',
                    solution: 'Ensure user is logged in and token is set in cookies'
                });
                return null;
            }

        } catch (error) {
            this.log('ERROR', 'Cookie extraction failed', { error: error.message });
            this.issues.push({
                type: 'COOKIE_EXTRACTION_ERROR',
                message: 'Failed to extract cookies',
                solution: 'Check if document.cookie is accessible'
            });
            return null;
        }
    }

    async testTokenValidation() {
        this.log('INFO', 'Testing token validation...');

        try {
            const token = await this.checkCookieExtraction();
            if (!token) {
                this.log('ERROR', 'No token available for validation');
                return false;
            }

            // Test if token is expired
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);
                const exp = payload.exp;

                if (exp && exp > now) {
                    this.log('SUCCESS', 'Token is valid and not expired', {
                        expiresAt: new Date(exp * 1000).toISOString(),
                        timeToExpiry: Math.floor((exp - now) / 60) + ' minutes'
                    });
                } else {
                    this.log('ERROR', 'Token is expired', {
                        expiresAt: new Date(exp * 1000).toISOString(),
                        currentTime: new Date().toISOString()
                    });
                    this.issues.push({
                        type: 'TOKEN_EXPIRED',
                        message: 'JWT token is expired',
                        solution: 'User needs to log in again to get a fresh token'
                    });
                }

                // Check token payload
                this.log('INFO', 'Token payload', {
                    userId: payload.userId || payload.sub,
                    role: payload.role,
                    iat: new Date(payload.iat * 1000).toISOString(),
                    exp: new Date(payload.exp * 1000).toISOString()
                });

                return true;

            } catch (error) {
                this.log('ERROR', 'Token validation failed', { error: error.message });
                this.issues.push({
                    type: 'TOKEN_VALIDATION_ERROR',
                    message: 'Failed to validate token',
                    solution: 'Check if token is properly formatted JWT'
                });
                return false;
            }

        } catch (error) {
            this.log('ERROR', 'Token validation test failed', { error: error.message });
            return false;
        }
    }

    async testAPIRequestWithToken() {
        this.log('INFO', 'Testing API request with token...');

        try {
            const token = await this.checkCookieExtraction();
            if (!token) {
                this.log('ERROR', 'No token available for API test');
                return false;
            }

            // Test request formation
            const testRequest = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetType: 'user',
                    targetUserId: 1,
                    title: 'Test Notification',
                    message: 'This is a test notification',
                    notificationType: 'info',
                    priority: 'normal'
                })
            };

            this.log('SUCCESS', 'API request formed correctly', {
                method: testRequest.method,
                headers: testRequest.headers,
                bodyLength: testRequest.body.length
            });

            // Test actual API call (if backend is running)
            try {
                const response = await fetch('/api/notifications', testRequest);
                this.log('INFO', 'API response received', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });

                if (response.ok) {
                    this.log('SUCCESS', 'API request successful');
                } else {
                    const errorText = await response.text();
                    this.log('ERROR', 'API request failed', { error: errorText });
                    this.issues.push({
                        type: 'API_REQUEST_FAILED',
                        message: 'API request failed with status ' + response.status,
                        solution: 'Check backend server and authentication middleware'
                    });
                }

            } catch (error) {
                this.log('WARN', 'API request failed (backend may not be running)', { error: error.message });
            }

            return true;

        } catch (error) {
            this.log('ERROR', 'API request test failed', { error: error.message });
            return false;
        }
    }

    generateReport() {
        console.log('\n📊 AUTHENTICATION TOKEN DEBUG REPORT');
        console.log('=====================================');

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
        console.log('1. Ensure user is properly logged in');
        console.log('2. Check if JWT token is set in cookies');
        console.log('3. Verify token is not expired');
        console.log('4. Test API request formation');
        console.log('5. Check backend server is running');

        console.log('\n📋 Next Steps:');
        console.log('1. Fix identified issues above');
        console.log('2. Test authentication flow in browser');
        console.log('3. Verify notification creation works');
        console.log('4. Monitor network requests in dev tools');

        // Save debug log to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('auth-token-debug-log', JSON.stringify(this.debugLog));
            console.log('\n💾 Debug log saved to localStorage');
        }
    }
}

// Export for use in components
export default AuthTokenDebugger;

// Auto-run debugger in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const debugger = new AuthTokenDebugger();
    debugger.debugAuthTokenFlow().catch(console.error);
}
