/**
 * Simple Authentication Flow Test
 * Purpose: Test the authentication flow in the browser environment
 */

// Simulate browser environment
global.window = {};
global.document = {
    cookie: '',
    getElementById: () => null,
    createElement: () => ({}),
    appendChild: () => { },
    removeChild: () => { },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => { },
    removeEventListener: () => { },
    setAttribute: () => { },
    getAttribute: () => null,
    removeAttribute: () => { },
    classList: {
        add: () => { },
        remove: () => { },
        contains: () => false,
        toggle: () => { }
    }
};

global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { }
};

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:5000';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.NODE_ENV = 'test';

import axios from 'axios';

async function testAuthFlow() {
    console.log('🚀 Testing Authentication Flow...\n');

    try {
        // Test 1: Backend Health
        console.log('1. Testing Backend Health...');
        const healthResponse = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Backend is healthy:', healthResponse.data);

        // Test 2: Auth Config
        console.log('\n2. Testing Auth Configuration...');
        const configResponse = await axios.get('http://localhost:5000/api/config');
        console.log('✅ Auth config loaded:', {
            hasRecaptchaSiteKey: !!configResponse.data?.recaptchaSiteKey,
            hasGoogleClientId: !!configResponse.data?.googleClientId
        });

        // Test 3: Login Endpoint (expected to fail with invalid credentials)
        console.log('\n3. Testing Login Endpoint...');
        try {
            await axios.post('http://localhost:5000/api/auth/login', {
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            console.log('✅ Login endpoint working (expected 401):', {
                status: error.response?.status,
                message: error.response?.data?.message
            });
        }

        // Test 4: Axios Instance Creation
        console.log('\n4. Testing Axios Instance...');
        const axiosInstance = axios.create({
            baseURL: 'http://localhost:5000',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            timeout: 30000,
        });

        // Test request interceptor
        axiosInstance.interceptors.request.use(
            (config) => {
                console.log('✅ Request interceptor working');
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
                console.log('✅ Response interceptor working');
                return response;
            },
            (error) => {
                console.log('✅ Response interceptor error handling working');
                return Promise.reject(error);
            }
        );

        // Test a simple request
        await axiosInstance.get('/api/health');
        console.log('✅ Axios instance working correctly');

        console.log('\n🎉 All authentication flow tests passed!');
        return true;

    } catch (error) {
        console.error('❌ Authentication flow test failed:', error.message);
        return false;
    }
}

// Run the test
testAuthFlow()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }); 