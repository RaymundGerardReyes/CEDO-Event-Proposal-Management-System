/**
 * Config Loading Debugger
 * Comprehensive debugging utilities for config loading issues
 */

/**
 * Debug configuration loading process
 * @param {string} baseUrl - Base URL to test
 * @returns {Promise<Object>} Debug information
 */
export async function debugConfigLoading(baseUrl = null) {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            API_URL: process.env.API_URL,
            BACKEND_URL: process.env.BACKEND_URL,
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY ? 'SET' : 'NOT SET',
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? 'SET' : 'NOT SET'
        },
        network: {
            online: navigator.onLine,
            userAgent: navigator.userAgent
        },
        tests: []
    };

    // Test 1: Environment variable resolution
    const resolvedBase = baseUrl || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000';
    const cleanBase = resolvedBase.endsWith('/api') ? resolvedBase.replace(/\/api$/, '') : resolvedBase;
    const configUrl = cleanBase.endsWith('/') ? cleanBase + 'api/config' : cleanBase + '/api/config';

    debugInfo.tests.push({
        name: 'Environment Resolution',
        status: 'PASS',
        details: {
            resolvedBase,
            cleanBase,
            configUrl
        }
    });

    // Test 2: URL construction
    try {
        new URL(configUrl);
        debugInfo.tests.push({
            name: 'URL Construction',
            status: 'PASS',
            details: { configUrl }
        });
    } catch (error) {
        debugInfo.tests.push({
            name: 'URL Construction',
            status: 'FAIL',
            error: error.message,
            details: { configUrl }
        });
    }

    // Test 3: Network connectivity
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(configUrl, {
            signal: controller.signal,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include'
        });

        clearTimeout(timeoutId);

        debugInfo.tests.push({
            name: 'Network Connectivity',
            status: 'PASS',
            details: {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            }
        });

        // Test 4: Response parsing
        if (response.ok) {
            try {
                const data = await response.json();
                debugInfo.tests.push({
                    name: 'Response Parsing',
                    status: 'PASS',
                    details: { data }
                });
            } catch (parseError) {
                debugInfo.tests.push({
                    name: 'Response Parsing',
                    status: 'FAIL',
                    error: parseError.message
                });
            }
        } else {
            debugInfo.tests.push({
                name: 'HTTP Response',
                status: 'FAIL',
                error: `HTTP ${response.status}: ${response.statusText}`
            });
        }

    } catch (networkError) {
        debugInfo.tests.push({
            name: 'Network Connectivity',
            status: 'FAIL',
            error: networkError.message,
            errorType: networkError.name
        });
    }

    // Test 5: CORS preflight
    try {
        const corsResponse = await fetch(configUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });

        debugInfo.tests.push({
            name: 'CORS Preflight',
            status: corsResponse.ok ? 'PASS' : 'FAIL',
            details: {
                status: corsResponse.status,
                headers: Object.fromEntries(corsResponse.headers.entries())
            }
        });
    } catch (corsError) {
        debugInfo.tests.push({
            name: 'CORS Preflight',
            status: 'FAIL',
            error: corsError.message
        });
    }

    return debugInfo;
}

/**
 * Test backend health endpoint
 * @param {string} baseUrl - Base URL to test
 * @returns {Promise<Object>} Health check result
 */
export async function testBackendHealth(baseUrl = null) {
    const resolvedBase = baseUrl || process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000';
    const cleanBase = resolvedBase.endsWith('/api') ? resolvedBase.replace(/\/api$/, '') : resolvedBase;
    const healthUrl = cleanBase.endsWith('/') ? cleanBase : cleanBase + '/';

    try {
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });

        if (response.ok) {
            const data = await response.json();
            return {
                status: 'HEALTHY',
                data,
                url: healthUrl
            };
        } else {
            return {
                status: 'UNHEALTHY',
                error: `HTTP ${response.status}: ${response.statusText}`,
                url: healthUrl
            };
        }
    } catch (error) {
        return {
            status: 'UNREACHABLE',
            error: error.message,
            url: healthUrl
        };
    }
}

/**
 * Generate comprehensive debug report
 * @returns {Promise<Object>} Complete debug report
 */
export async function generateDebugReport() {
    console.log('🔍 Starting comprehensive config loading debug...');

    const debugInfo = await debugConfigLoading();
    const healthCheck = await testBackendHealth();

    const report = {
        ...debugInfo,
        healthCheck,
        recommendations: generateRecommendations(debugInfo, healthCheck)
    };

    console.log('📊 Debug Report Generated:', report);
    return report;
}

/**
 * Generate recommendations based on debug results
 * @param {Object} debugInfo - Debug information
 * @param {Object} healthCheck - Health check results
 * @returns {Array} List of recommendations
 */
function generateRecommendations(debugInfo, healthCheck) {
    const recommendations = [];

    // Check environment variables
    if (!process.env.API_URL && !process.env.BACKEND_URL) {
        recommendations.push({
            type: 'ENVIRONMENT',
            priority: 'HIGH',
            message: 'Set API_URL or BACKEND_URL environment variable',
            action: 'Add NEXT_PUBLIC_API_URL=http://localhost:5000 to .env.local'
        });
    }

    // Check reCAPTCHA configuration
    if (!process.env.RECAPTCHA_SITE_KEY && !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        recommendations.push({
            type: 'CONFIGURATION',
            priority: 'HIGH',
            message: 'reCAPTCHA site key not configured',
            action: 'Set RECAPTCHA_SITE_KEY in backend .env and NEXT_PUBLIC_RECAPTCHA_SITE_KEY in frontend .env.local'
        });
    }

    // Check network connectivity
    const networkTest = debugInfo.tests.find(t => t.name === 'Network Connectivity');
    if (networkTest && networkTest.status === 'FAIL') {
        recommendations.push({
            type: 'NETWORK',
            priority: 'HIGH',
            message: 'Backend server not reachable',
            action: 'Ensure backend server is running on port 5000'
        });
    }

    // Check CORS
    const corsTest = debugInfo.tests.find(t => t.name === 'CORS Preflight');
    if (corsTest && corsTest.status === 'FAIL') {
        recommendations.push({
            type: 'CORS',
            priority: 'MEDIUM',
            message: 'CORS configuration issue',
            action: 'Check backend CORS settings in server.js'
        });
    }

    // Check backend health
    if (healthCheck.status === 'UNREACHABLE') {
        recommendations.push({
            type: 'BACKEND',
            priority: 'HIGH',
            message: 'Backend server is not running',
            action: 'Start the backend server with: cd backend && npm start'
        });
    }

    return recommendations;
}

/**
 * Quick diagnostic function for console debugging
 */
export function quickDiagnostic() {
    console.group('🔍 Config Loading Quick Diagnostic');

    console.log('Environment Variables:');
    console.log('- API_URL:', process.env.API_URL || 'NOT SET');
    console.log('- BACKEND_URL:', process.env.BACKEND_URL || 'NOT SET');
    console.log('- RECAPTCHA_SITE_KEY:', process.env.RECAPTCHA_SITE_KEY ? 'SET' : 'NOT SET');
    console.log('- NEXT_PUBLIC_RECAPTCHA_SITE_KEY:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? 'SET' : 'NOT SET');

    console.log('Network Status:');
    console.log('- Online:', navigator.onLine);
    console.log('- User Agent:', navigator.userAgent);

    console.log('Current URL:', window.location.href);

    console.groupEnd();

    return {
        environment: {
            API_URL: process.env.API_URL,
            BACKEND_URL: process.env.BACKEND_URL,
            RECAPTCHA_SITE_KEY: !!process.env.RECAPTCHA_SITE_KEY,
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
        },
        network: {
            online: navigator.onLine,
            userAgent: navigator.userAgent
        },
        location: window.location.href
    };
}
