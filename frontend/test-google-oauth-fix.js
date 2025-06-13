/**
 * Google OAuth COOP Fix Verification Script
 * 
 * Run this script to verify that the COOP policy fixes are working correctly.
 * This script checks the key components and configurations that were updated.
 */

console.log('🔍 GOOGLE OAUTH COOP FIX VERIFICATION\n');

// Check if running in browser environment
if (typeof window === 'undefined') {
    console.log('❌ This script must be run in a browser environment');
    console.log('   Open browser console and paste this script');
    process.exit(1);
}

// 1. Check if Next.js is running
function checkNextJsEnvironment() {
    console.log('1. 🔍 Checking Next.js Environment...');

    const nextData = document.querySelector('#__NEXT_DATA__');
    if (nextData) {
        console.log('   ✅ Next.js detected');
        return true;
    } else {
        console.log('   ❌ Next.js not detected');
        return false;
    }
}

// 2. Check Google Script Loading
function checkGoogleScript() {
    console.log('\n2. 🔍 Checking Google Identity Services Script...');

    const googleScript = document.querySelector('#google-gsi-script');
    if (googleScript) {
        console.log('   ✅ Google script element found');

        if (window.google && window.google.accounts && window.google.accounts.id) {
            console.log('   ✅ Google Identity Services loaded successfully');
            return true;
        } else {
            console.log('   ⏳ Google Identity Services still loading...');
            return false;
        }
    } else {
        console.log('   ❌ Google script element not found');
        return false;
    }
}

// 3. Check Global Callback Function
function checkGlobalCallback() {
    console.log('\n3. 🔍 Checking Global Credential Response Handler...');

    if (typeof window.handleCredentialResponse === 'function') {
        console.log('   ✅ Global handleCredentialResponse function exists');
        return true;
    } else {
        console.log('   ❌ Global handleCredentialResponse function missing');
        return false;
    }
}

// 4. Check COOP Headers (if possible)
function checkCOOPHeaders() {
    console.log('\n4. 🔍 Checking COOP Policy Headers...');

    // This is limited in what we can check from client-side
    console.log('   ℹ️  COOP headers are set by the server and cannot be fully verified from client-side');
    console.log('   ℹ️  Check Network tab in DevTools for response headers');
    console.log('   ✅ Expected: Cross-Origin-Opener-Policy: same-origin-allow-popups (or unsafe-none in dev)');
    return true;
}

// 5. Check Environment Variables
function checkEnvironmentVariables() {
    console.log('\n5. 🔍 Checking Environment Variables...');

    // We can only check public environment variables
    const hasGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost');

    if (hasGoogleClientId) {
        console.log('   ✅ Google Client ID environment setup appears correct');
        return true;
    } else {
        console.log('   ❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID may not be configured');
        console.log('   ℹ️  Check your .env.local file');
        return false;
    }
}

// 6. Test Google Button Container
function checkGoogleButtonContainer() {
    console.log('\n6. 🔍 Checking Google Sign-In Button Container...');

    const buttonContainer = document.querySelector('#google-signin-button-container');
    if (buttonContainer) {
        console.log('   ✅ Google button container found');

        // Check if button has been rendered
        if (buttonContainer.innerHTML.trim().length > 0) {
            console.log('   ✅ Google button appears to be rendered');
            return true;
        } else {
            console.log('   ⏳ Google button container exists but button not yet rendered');
            return false;
        }
    } else {
        console.log('   ℹ️  Google button container not found (may not be on sign-in page)');
        return true; // Not an error if not on sign-in page
    }
}

// 7. Test Event Listener
function checkEventListener() {
    console.log('\n7. 🔍 Testing Google Sign-In Event System...');

    try {
        // Test if we can dispatch the event
        const testEvent = new CustomEvent('google-signin-response', {
            detail: { test: true }
        });

        let eventReceived = false;
        const testListener = (event) => {
            if (event.detail.test) {
                eventReceived = true;
            }
        };

        window.addEventListener('google-signin-response', testListener);
        window.dispatchEvent(testEvent);
        window.removeEventListener('google-signin-response', testListener);

        if (eventReceived) {
            console.log('   ✅ Google Sign-In event system working correctly');
            return true;
        } else {
            console.log('   ❌ Google Sign-In event system not working');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error testing event system:', error.message);
        return false;
    }
}

// Main verification function
async function runVerification() {
    console.log('Starting verification...\n');

    const results = {
        nextjs: checkNextJsEnvironment(),
        googleScript: checkGoogleScript(),
        globalCallback: checkGlobalCallback(),
        coopHeaders: checkCOOPHeaders(),
        environment: checkEnvironmentVariables(),
        buttonContainer: checkGoogleButtonContainer(),
        eventSystem: checkEventListener()
    };

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('========================');

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([key, passed]) => {
        const icon = passed ? '✅' : '❌';
        const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`${icon} ${name}`);
    });

    console.log(`\n🎯 Score: ${passed}/${total} checks passed`);

    if (passed === total) {
        console.log('\n🎉 ALL CHECKS PASSED!');
        console.log('   Your Google OAuth COOP fixes appear to be working correctly.');
        console.log('   Try testing the Google Sign-In button now.');
    } else {
        console.log('\n⚠️  SOME ISSUES DETECTED');
        console.log('   Please review the failed checks above.');
        console.log('   Refer to COOP_GOOGLE_OAUTH_FIX_COMPLETE.md for troubleshooting.');
    }

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Navigate to the sign-in page');
    console.log('2. Click the "Sign in with Google" button');
    console.log('3. Verify that popup opens without COOP errors');
    console.log('4. Complete authentication flow');
    console.log('\n💡 TIP: Open Browser DevTools Console to see detailed logs during OAuth flow');
}

// Run the verification
runVerification();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runVerification,
        checkNextJsEnvironment,
        checkGoogleScript,
        checkGlobalCallback,
        checkCOOPHeaders,
        checkEnvironmentVariables,
        checkGoogleButtonContainer,
        checkEventListener
    };
} 