/**
 * Test script for form persistence functionality
 * Run this in the browser console to test auto-save features
 */

// Test the auto-save system
function testFormPersistence() {
    console.log('🧪 Testing Form Persistence System...');

    // Test 1: Check if auto-save functions are available
    console.log('\n1. Checking auto-save functions...');
    if (typeof window.saveFormData === 'function') {
        console.log('✅ saveFormData function available');
    } else {
        console.log('❌ saveFormData function not found');
    }

    if (typeof window.loadFormData === 'function') {
        console.log('✅ loadFormData function available');
    } else {
        console.log('❌ loadFormData function not found');
    }

    // Test 2: Save test data
    console.log('\n2. Testing data save...');
    const testData = {
        organizationName: 'Test Organization',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        schoolEventName: 'Test School Event',
        currentSection: 'schoolEvent',
        timestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem('eventProposalFormData', JSON.stringify(testData));
        localStorage.setItem('eventProposalFormData_timestamp', Date.now().toString());
        console.log('✅ Test data saved successfully');
    } catch (error) {
        console.log('❌ Failed to save test data:', error);
    }

    // Test 3: Load test data
    console.log('\n3. Testing data load...');
    try {
        const loadedData = JSON.parse(localStorage.getItem('eventProposalFormData'));
        if (loadedData && loadedData.organizationName === 'Test Organization') {
            console.log('✅ Test data loaded successfully');
            console.log('📋 Loaded data:', loadedData);
        } else {
            console.log('❌ Failed to load test data correctly');
        }
    } catch (error) {
        console.log('❌ Failed to load test data:', error);
    }

    // Test 4: Check storage info
    console.log('\n4. Checking storage info...');
    const storageData = localStorage.getItem('eventProposalFormData');
    if (storageData) {
        console.log('📊 Storage size:', storageData.length, 'characters');
        console.log('📊 Storage size:', (storageData.length / 1024).toFixed(2), 'KB');
    }

    // Test 5: Test form inputs (if on the form page)
    console.log('\n5. Testing form inputs...');
    const orgNameInput = document.querySelector('#organizationName');
    if (orgNameInput) {
        console.log('✅ Organization name input found');
        console.log('📋 Current value:', orgNameInput.value);
    } else {
        console.log('ℹ️ Organization name input not found (may not be on form page)');
    }

    const schoolEventInput = document.querySelector('#schoolEventName');
    if (schoolEventInput) {
        console.log('✅ School event name input found');
        console.log('📋 Current value:', schoolEventInput.value);
    } else {
        console.log('ℹ️ School event name input not found (may not be on Section 3)');
    }

    console.log('\n🎯 Form persistence test completed!');
    console.log('💡 To test page refresh persistence:');
    console.log('   1. Fill out some form fields');
    console.log('   2. Refresh the page (F5)');
    console.log('   3. Check if data is restored');
}

// Test the beforeunload warning
function testBeforeUnloadWarning() {
    console.log('🧪 Testing beforeunload warning...');

    // Simulate unsaved changes
    const testEvent = new Event('beforeunload');
    testEvent.returnValue = 'Test warning';

    console.log('💡 To test beforeunload warning:');
    console.log('   1. Fill out some form fields');
    console.log('   2. Try to close the tab or navigate away');
    console.log('   3. You should see a warning dialog');
}

// Test localStorage quota
function testStorageQuota() {
    console.log('🧪 Testing localStorage quota handling...');

    try {
        // Get current usage
        let currentUsage = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                currentUsage += localStorage[key].length;
            }
        }

        console.log('📊 Current localStorage usage:', (currentUsage / 1024).toFixed(2), 'KB');

        // Test with large data
        const largeData = 'x'.repeat(1024 * 1024); // 1MB of data
        localStorage.setItem('testLargeData', largeData);
        console.log('✅ Large data test passed');

        // Clean up
        localStorage.removeItem('testLargeData');
        console.log('🧹 Cleaned up test data');

    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.log('⚠️ localStorage quota exceeded (this is expected for the test)');
        } else {
            console.log('❌ Unexpected error:', error);
        }
    }
}

// Make functions available globally for console testing
window.testFormPersistence = testFormPersistence;
window.testBeforeUnloadWarning = testBeforeUnloadWarning;
window.testStorageQuota = testStorageQuota;

console.log('🚀 Form Persistence Test Functions Loaded!');
console.log('📋 Available functions:');
console.log('   - testFormPersistence()');
console.log('   - testBeforeUnloadWarning()');
console.log('   - testStorageQuota()');
console.log('💡 Run any of these functions in the console to test functionality');

// Auto-run basic test
testFormPersistence(); 