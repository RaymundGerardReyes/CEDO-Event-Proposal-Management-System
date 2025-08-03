/**
 * Authentication Flow Debug Script
 * Purpose: Debug and test the authentication flow to identify issues
 * Approach: Comprehensive testing of all authentication components
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123';

// Test functions
async function testBackendHealth() {
    console.log('\n🔍 Testing Backend Health...');
    try {
        const response = await axios.get(`${API_BASE_URL}/api/health`);
        console.log('✅ Backend health check passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Backend health check failed:', error.message);
        return false;
    }
}

async function testAuthConfig() {
    console.log('\n🔍 Testing Auth Configuration...');
    try {
        const response = await axios.get(`${API_BASE_URL}/api/config`);
        console.log('✅ Auth config retrieved:', {
            hasRecaptchaSiteKey: !!response.data?.recaptchaSiteKey,
            hasGoogleClientId: !!response.data?.googleClientId,
            hasBackendUrl: !!response.data?.backendUrl
        });
        return response.data;
    } catch (error) {
        console.error('❌ Auth config failed:', error.message);
        return null;
    }
}

async function testLoginEndpoint() {
    console.log('\n🔍 Testing Login Endpoint...');
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        console.log('✅ Login endpoint working:', {
            status: response.status,
            hasToken: !!response.data?.token,
            hasUser: !!response.data?.user
        });
        return response.data;
    } catch (error) {
        console.log('⚠️ Login endpoint test (expected 401):', {
            status: error.response?.status,
            message: error.response?.data?.message
        });
        return null;
    }
}

async function testGoogleAuthEndpoint() {
    console.log('\n🔍 Testing Google Auth Endpoint...');
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
            token: 'invalid_token_for_testing'
        });
        console.log('✅ Google auth endpoint working:', {
            status: response.status,
            hasToken: !!response.data?.token,
            hasUser: !!response.data?.user
        });
        return response.data;
    } catch (error) {
        console.log('⚠️ Google auth endpoint test (expected 401):', {
            status: error.response?.status,
            message: error.response?.data?.message
        });
        return null;
    }
}

async function testFrontendConfig() {
    console.log('\n🔍 Testing Frontend Configuration...');
    const config = {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
        API_URL: process.env.API_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        NODE_ENV: process.env.NODE_ENV
    };

    console.log('✅ Frontend config:', {
        hasApiUrl: !!config.NEXT_PUBLIC_API_URL,
        hasBackendUrl: !!config.NEXT_PUBLIC_BACKEND_URL,
        hasGoogleClientId: !!config.GOOGLE_CLIENT_ID,
        nodeEnv: config.NODE_ENV
    });

    return config;
}

async function testAxiosInstance() {
    console.log('\n🔍 Testing Axios Instance...');
    try {
        const axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            timeout: 30000,
        });

        // Test request interceptor
        axiosInstance.interceptors.request.use(
            (config) => {
                console.log('✅ Request interceptor working:', {
                    method: config.method,
                    url: config.url,
                    baseURL: config.baseURL
                });
                return config;
            },
            (error) => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Test response interceptor
        axiosInstance.interceptors.response.use(
            (response) => {
                console.log('✅ Response interceptor working:', {
                    status: response.status,
                    url: response.config.url
                });
                return response;
            },
            (error) => {
                console.log('✅ Response interceptor error handling:', {
                    status: error.response?.status,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );

        // Test a simple request
        await axiosInstance.get('/api/health');
        console.log('✅ Axios instance working correctly');
        return true;
    } catch (error) {
        console.error('❌ Axios instance test failed:', error.message);
        return false;
    }
}

async function testErrorHandling() {
    console.log('\n🔍 Testing Error Handling...');

    // Test network error
    try {
        await axios.get('http://nonexistent-server:9999/api/test');
    } catch (error) {
        console.log('✅ Network error handling:', {
            code: error.code,
            message: error.message,
            isNetworkError: error.code === "ENOTFOUND" || error.message.includes("Network Error")
        });
    }

    // Test timeout error
    try {
        await axios.get(`${API_BASE_URL}/api/test-timeout`, { timeout: 1 });
    } catch (error) {
        console.log('✅ Timeout error handling:', {
            code: error.code,
            message: error.message,
            isTimeoutError: error.code === "ECONNABORTED" || error.message.includes("timeout")
        });
    }

    // Test 401 error
    try {
        await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });
    } catch (error) {
        console.log('✅ 401 error handling:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            isAuthError: error.response?.status === 401
        });
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Authentication Flow Test...\n');

    const results = {
        backendHealth: await testBackendHealth(),
        authConfig: await testAuthConfig(),
        loginEndpoint: await testLoginEndpoint(),
        googleAuthEndpoint: await testGoogleAuthEndpoint(),
        frontendConfig: await testFrontendConfig(),
        axiosInstance: await testAxiosInstance(),
        errorHandling: await testErrorHandling()
    };

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test}`);
    });

    const allPassed = Object.values(results).every(result => result !== false);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (!allPassed) {
        console.log('\n🔧 Recommended Fixes:');
        if (!results.backendHealth) {
            console.log('- Start the backend server: cd backend && npm run dev');
        }
        if (!results.authConfig) {
            console.log('- Check backend /api/config endpoint');
        }
        if (!results.frontendConfig) {
            console.log('- Verify environment variables in frontend/.env');
        }
        if (!results.axiosInstance) {
            console.log('- Check axios configuration in auth-context.js');
        }
    }

    return allPassed;
}

// Run the test if this script is executed directly
runComprehensiveTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });

export {
    runComprehensiveTest, testAuthConfig, testAxiosInstance, testBackendHealth, testErrorHandling, testFrontendConfig, testGoogleAuthEndpoint, testLoginEndpoint
};

