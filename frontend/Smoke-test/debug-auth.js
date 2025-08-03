/**
 * Comprehensive Authentication Debug Script
 * Run this in the browser console to debug authentication issues
 */

console.log('🔍 AUTHENTICATION DEBUG SCRIPT');
console.log('='.repeat(60));

// 1. Check if we're on the right domain
console.log('🌐 Current URL:', window.location.href);
console.log('🌐 Domain:', window.location.hostname);

// 2. Check localStorage (all possible keys)
console.log('\n📦 LOCALSTORAGE CHECK:');
const localStorageKeys = Object.keys(localStorage);
console.log('Total localStorage keys:', localStorageKeys.length);

if (localStorageKeys.length > 0) {
    console.log('All localStorage keys:');
    localStorageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
    });
} else {
    console.log('❌ No localStorage keys found');
}

// 3. Check sessionStorage
console.log('\n📦 SESSIONSTORAGE CHECK:');
const sessionStorageKeys = Object.keys(sessionStorage);
console.log('Total sessionStorage keys:', sessionStorageKeys.length);

if (sessionStorageKeys.length > 0) {
    console.log('All sessionStorage keys:');
    sessionStorageKeys.forEach(key => {
        const value = sessionStorage.getItem(key);
        console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
    });
} else {
    console.log('❌ No sessionStorage keys found');
}

// 4. Check cookies
console.log('\n🍪 COOKIES CHECK:');
const cookies = document.cookie.split(';').map(c => c.trim());
console.log('Total cookies:', cookies.length);

if (cookies.length > 0 && cookies[0] !== '') {
    console.log('All cookies:');
    cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        console.log(`  ${name}: ${value ? value.substring(0, 50) + '...' : 'empty'}`);
    });
} else {
    console.log('❌ No cookies found');
}

// 5. Check if there's a React context or state
console.log('\n⚛️ REACT STATE CHECK:');
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
} else {
    console.log('❌ React DevTools not detected');
}

// 6. Check for any global variables that might contain auth data
console.log('\n🌍 GLOBAL VARIABLES CHECK:');
const globalAuthVars = [
    'authToken', 'token', 'accessToken', 'userToken', 'auth',
    'user', 'currentUser', 'authData', 'session'
];

globalAuthVars.forEach(varName => {
    if (window[varName]) {
        console.log(`✅ Found global variable: ${varName}`, window[varName]);
    }
});

// 7. Check if there are any network requests with auth headers
console.log('\n🌐 NETWORK CHECK:');
console.log('Check the Network tab in DevTools for requests with Authorization headers');

// 8. Check if we're on a protected page
console.log('\n🔒 PAGE PROTECTION CHECK:');
const currentPath = window.location.pathname;
if (currentPath.includes('/student-dashboard') || currentPath.includes('/admin-dashboard')) {
    console.log('✅ On protected page:', currentPath);
    console.log('💡 If you can see this page, you should be authenticated');
} else {
    console.log('⚠️ Not on a protected page:', currentPath);
}

// 9. Try to make a test API call
console.log('\n🧪 API TEST:');
fetch('/api/health', {
    method: 'GET',
    credentials: 'include' // Include cookies
})
    .then(response => {
        console.log('✅ Health check response:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ Health check data:', data);
    })
    .catch(error => {
        console.log('❌ Health check failed:', error.message);
    });

// 10. Check for any auth-related errors in console
console.log('\n🚨 ERROR CHECK:');
console.log('Check the Console tab for any authentication-related errors');

// 11. Provide next steps
console.log('\n📋 NEXT STEPS:');
console.log('1. If no tokens found, try logging in again');
console.log('2. Check if you\'re redirected to login page');
console.log('3. Look for any error messages in the console');
console.log('4. Check the Network tab for failed auth requests');

// Helper function to test authentication
window.testAuth = async function () {
    console.log('\n🧪 TESTING AUTHENTICATION...');

    try {
        // Try to access a protected endpoint
        const response = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authentication successful:', data);
            return data;
        } else {
            console.log('❌ Authentication failed:', response.status);
            return null;
        }
    } catch (error) {
        console.log('❌ Authentication test error:', error.message);
        return null;
    }
};

console.log('\n💡 Run testAuth() to test authentication directly'); 