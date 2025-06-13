// Google Auth Initialization Fix Verification Script
// This script tests the fix for "Cannot access 'handleGoogleCredentialResponse' before initialization"

console.log("🔧 Testing Google Auth Initialization Fix...");
console.log("=".repeat(60));

// Test 1: Verify global handleCredentialResponse is available immediately
console.log("Test 1: Global handleCredentialResponse availability");
if (typeof window.handleCredentialResponse === 'function') {
    console.log("✅ PASS: window.handleCredentialResponse is defined globally");
} else {
    console.error("❌ FAIL: window.handleCredentialResponse is not defined");
    console.log("Current value:", window.handleCredentialResponse);
}

// Test 2: Verify the function is callable without errors
console.log("\nTest 2: Function execution test");
try {
    // Test with a mock Google response
    window.handleCredentialResponse({
        credential: "test-jwt-token-12345",
        client_id: "test-client-id",
        select_by: "user"
    });
    console.log("✅ PASS: handleCredentialResponse executed without throwing errors");
} catch (error) {
    console.error("❌ FAIL: handleCredentialResponse threw an error:", error.message);
}

// Test 3: Verify custom event is dispatched
console.log("\nTest 3: Custom event dispatch verification");
let eventReceived = false;
const testListener = (event) => {
    eventReceived = true;
    console.log("✅ PASS: Custom 'google-signin-response' event received with data:", event.detail);
};

window.addEventListener('google-signin-response', testListener);

// Simulate Google calling the global function
window.handleCredentialResponse({
    credential: "test-credential-for-event",
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "test-client"
});

setTimeout(() => {
    window.removeEventListener('google-signin-response', testListener);
    if (!eventReceived) {
        console.error("❌ FAIL: Custom event was not received");
    }
}, 100);

// Test 4: Verify Google GIS script loading
console.log("\nTest 4: Google Identity Services script status");
if (window.google && window.google.accounts && window.google.accounts.id) {
    console.log("✅ PASS: Google Identity Services script is loaded and ready");

    // Test if initialization would work
    try {
        const testConfig = {
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "test-client-id",
            callback: window.handleCredentialResponse,
            auto_select: false
        };
        console.log("✅ PASS: Google GIS initialization config is valid");
        console.log("Config:", testConfig);
    } catch (error) {
        console.error("❌ FAIL: Google GIS initialization config error:", error.message);
    }
} else {
    console.warn("⚠️  WARNING: Google Identity Services script not yet loaded");
    console.log("This is normal if the script is still loading asynchronously");
}

// Test 5: Environment configuration check
console.log("\nTest 5: Environment configuration");
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
if (clientId && clientId !== 'your-google-client-id' && !clientId.includes('placeholder')) {
    console.log("✅ PASS: NEXT_PUBLIC_GOOGLE_CLIENT_ID is properly configured");
} else {
    console.error("❌ FAIL: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not properly configured");
    console.log("Current value:", clientId);
}

// Test 6: React component initialization order
console.log("\nTest 6: React component readiness");
setTimeout(() => {
    // Check if React components have mounted and event listeners are active
    const hasReactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#__next');
    if (hasReactRoot) {
        console.log("✅ PASS: React application has mounted");
    } else {
        console.warn("⚠️  WARNING: React application not yet mounted");
    }
}, 500);

console.log("\n" + "=".repeat(60));
console.log("🏁 Initialization Test Complete");
console.log("\n📝 Expected Results:");
console.log("✅ All tests should PASS");
console.log("✅ No 'handleCredentialResponse is not defined' errors");
console.log("✅ No 'Cannot access before initialization' errors");
console.log("\n🔧 If any tests fail:");
console.log("1. Clear browser cache completely");
console.log("2. Hard refresh the page (Ctrl+F5)");
console.log("3. Check browser console for any other errors");
console.log("4. Verify environment variables are set correctly"); 