// 🔧 GOOGLE AUTH CLEANUP SCRIPT
// Run this in browser console if Google Sign-In gets stuck

console.log('🔧 STARTING GOOGLE AUTH COMPREHENSIVE CLEANUP...');

// 1. Clear all Google-related operations
if (typeof window !== 'undefined') {
    console.log('🔧 Step 1: Clearing Google operations...');

    // Cancel any ongoing Google operations
    if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
            window.google.accounts.id.cancel();
            console.log('✅ Called google.accounts.id.cancel()');
        } catch (error) {
            console.warn('⚠️ Error calling google.accounts.id.cancel():', error);
        }
    }

    // Clear Google script loading state
    const googleScript = document.getElementById('google-identity-services-script');
    if (googleScript) {
        googleScript.setAttribute('data-loaded', 'false');
        console.log('✅ Reset Google script loaded state');
    }
}

// 2. Clear all localStorage data
console.log('🔧 Step 2: Clearing localStorage...');
const localStorageKeys = [
    'eventProposalFormData',
    'cedoFormData',
    'formData',
    'submitEventFormData',
    'cedo_user',
    'google_auth_state',
    'google_signin_state'
];

localStorageKeys.forEach(key => {
    try {
        localStorage.removeItem(key);
        console.log(`✅ Cleared localStorage: ${key}`);
    } catch (error) {
        console.warn(`⚠️ Error clearing ${key}:`, error);
    }
});

// 3. Clear all cookies
console.log('🔧 Step 3: Clearing auth cookies...');
document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
document.cookie = "g_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
console.log('✅ Cleared auth cookies');

// 4. Clear Google button containers
console.log('🔧 Step 4: Clearing Google button containers...');
const googleContainers = document.querySelectorAll('[id*="google"], .g_id_signin, .g-signin2, [data-client_id]');
googleContainers.forEach((container, index) => {
    try {
        if (container.parentNode) {
            container.innerHTML = '';
            console.log(`✅ Cleared Google container ${index + 1}`);
        }
    } catch (error) {
        console.warn(`⚠️ Error clearing container ${index + 1}:`, error);
    }
});

// 5. Force reload auth context (if available)
console.log('🔧 Step 5: Attempting to reset auth context...');
if (typeof window.location !== 'undefined') {
    // Check if we can trigger a context reset without full page reload
    const event = new CustomEvent('auth-cleanup-requested', {
        detail: {
            timestamp: new Date().toISOString(),
            reason: 'manual-cleanup-script'
        }
    });
    window.dispatchEvent(event);
    console.log('✅ Dispatched auth cleanup event');
}

// 6. Show completion message
console.log('🎉 GOOGLE AUTH CLEANUP COMPLETED!');
console.log('📝 Next steps:');
console.log('   1. Refresh the page (F5 or Ctrl+R)');
console.log('   2. Try Google Sign-In again');
console.log('   3. If still stuck, contact support');

// 7. Optional: Auto-refresh after 2 seconds
setTimeout(() => {
    const shouldRefresh = confirm('🔄 Cleanup complete! Refresh the page now to apply changes?');
    if (shouldRefresh) {
        window.location.reload();
    }
}, 2000); 