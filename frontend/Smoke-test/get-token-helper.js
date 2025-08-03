/**
 * Helper script to extract authentication token from browser
 * Run this in the browser console to get your token
 */

console.log('🔐 Token Extraction Helper');
console.log('='.repeat(50));

// Check localStorage for tokens
const localStorageTokens = {
    'cedo_token': localStorage.getItem('cedo_token'),
    'token': localStorage.getItem('token'),
    'auth_token': localStorage.getItem('auth_token'),
    'access_token': localStorage.getItem('access_token'),
    'jwt_token': localStorage.getItem('jwt_token'),
    'user_token': localStorage.getItem('user_token')
};

console.log('📋 LocalStorage Tokens:');
Object.entries(localStorageTokens).forEach(([key, value]) => {
    if (value) {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`❌ ${key}: Not found`);
    }
});

// Check sessionStorage for tokens
const sessionStorageTokens = {
    'cedo_token': sessionStorage.getItem('cedo_token'),
    'token': sessionStorage.getItem('token'),
    'auth_token': sessionStorage.getItem('auth_token'),
    'access_token': sessionStorage.getItem('access_token'),
    'jwt_token': sessionStorage.getItem('jwt_token'),
    'user_token': sessionStorage.getItem('user_token')
};

console.log('\n📋 SessionStorage Tokens:');
Object.entries(sessionStorageTokens).forEach(([key, value]) => {
    if (value) {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`❌ ${key}: Not found`);
    }
});

// Check cookies for tokens
console.log('\n📋 Cookies:');
document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && (name.includes('token') || name.includes('auth') || name.includes('cedo'))) {
        console.log(`✅ ${name}: ${value ? value.substring(0, 20) + '...' : 'empty'}`);
    }
});

// Find the most likely token
const allTokens = { ...localStorageTokens, ...sessionStorageTokens };
const foundTokens = Object.entries(allTokens).filter(([key, value]) => value);

if (foundTokens.length > 0) {
    console.log('\n🎯 Most likely token found:');
    const [key, value] = foundTokens[0];
    console.log(`Key: ${key}`);
    console.log(`Value: ${value}`);
    console.log('\n📋 Copy this token and replace "YOUR_TOKEN_HERE" in the test script');
} else {
    console.log('\n❌ No tokens found in browser storage');
    console.log('💡 Try logging in again or check if you\'re authenticated');
}

// Helper function to copy token to clipboard
function copyTokenToClipboard() {
    const foundTokens = Object.entries(allTokens).filter(([key, value]) => value);
    if (foundTokens.length > 0) {
        const [key, value] = foundTokens[0];
        navigator.clipboard.writeText(value).then(() => {
            console.log('✅ Token copied to clipboard!');
        }).catch(() => {
            console.log('❌ Could not copy to clipboard, copy manually');
        });
    }
}

// Make the function available globally
window.copyTokenToClipboard = copyTokenToClipboard;
console.log('\n💡 Run copyTokenToClipboard() to copy the token to clipboard'); 