/**
 * COMPREHENSIVE SECTION 2 → SECTION 3 DATA FLOW TEST
 * 
 * This script tests the complete data flow from Section 2 completion
 * to Section 3 initialization to ensure organization data is properly preserved.
 */

console.log('🧪 TESTING: Section 2 → Section 3 Data Flow');

// Simulate Section 2 completion data (what Section 2 sends to parent)
const section2CompletionData = {
    // ✅ Essential Section 2 fields (what Section 3 expects)
    organizationName: 'Test University',
    contactEmail: 'test@university.edu',
    contactName: 'John Doe',
    contactPhone: '555-1234',
    organizationDescription: 'Test university organization',

    // ✅ Organization type (for routing)
    organizationType: 'school-based',
    organizationTypes: ['school-based'],
    eventType: 'school-based',

    // ✅ Proposal ID fields (from database save)
    id: 123,
    proposalId: 123,
    organization_id: 123,

    // ✅ Section metadata
    section2_completed: true,
    section2_timestamp: new Date().toISOString(),
    lastSavedSection: 'section2',
    currentSection: 'schoolEvent',

    // ✅ Clear validation errors
    validationErrors: {}
};

console.log('📦 STEP 1: Section 2 completion data prepared:');
console.log('  Organization Name:', section2CompletionData.organizationName);
console.log('  Contact Email:', section2CompletionData.contactEmail);
console.log('  Proposal ID:', section2CompletionData.id);
console.log('  Organization Type:', section2CompletionData.organizationType);

// Test localStorage saving (what Section 2 does)
try {
    localStorage.setItem('eventProposalFormData', JSON.stringify(section2CompletionData));
    console.log('✅ STEP 2: Data saved to localStorage successfully');

    // Verify the save
    const savedData = localStorage.getItem('eventProposalFormData');
    const parsedSavedData = JSON.parse(savedData);
    console.log('📋 STEP 3: Verification of saved data:');
    console.log('  Keys saved:', Object.keys(parsedSavedData).length);
    console.log('  Organization Name:', parsedSavedData.organizationName);
    console.log('  Contact Email:', parsedSavedData.contactEmail);
    console.log('  Proposal ID:', parsedSavedData.id);

} catch (error) {
    console.error('❌ STEP 2 FAILED: Could not save to localStorage:', error);
}

// Test the data source scoring algorithm (from SubmitEventFlow.jsx)
function testDataSourceScoring() {
    console.log('\n🔍 STEP 4: Testing data source scoring algorithm...');

    const possibleKeys = [
        'eventProposalFormData',
        'cedoFormData',
        'formData',
        'submitEventFormData'
    ];

    let bestData = null;
    let bestScore = 0;

    for (const key of possibleKeys) {
        const savedData = localStorage.getItem(key);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);

                // Score based on completeness (organization data is most important)
                let score = 0;
                if (parsedData.organizationName) score += 10;
                if (parsedData.contactEmail) score += 10;
                if (parsedData.id || parsedData.proposalId) score += 5;
                if (parsedData.currentSection) score += 1;
                score += Object.keys(parsedData).length; // Bonus for more fields

                console.log(`  🔍 Data source ${key}: score ${score}, keys: ${Object.keys(parsedData).length}`);
                console.log(`  📋 ${key} organization data:`, {
                    organizationName: parsedData.organizationName,
                    contactEmail: parsedData.contactEmail,
                    proposalId: parsedData.id || parsedData.proposalId
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestData = parsedData;
                    console.log(`  ✅ New best data source: ${key} (score: ${score})`);
                }
            } catch (parseError) {
                console.warn(`  ⚠️ Failed to parse ${key}:`, parseError);
            }
        } else {
            console.log(`  📭 No data found in ${key}`);
        }
    }

    if (bestData) {
        console.log(`\n✅ STEP 4 RESULT: Best data source found (score: ${bestScore})`);
        console.log('  Organization Name:', bestData.organizationName);
        console.log('  Contact Email:', bestData.contactEmail);
        console.log('  Proposal ID:', bestData.id || bestData.proposalId);
        console.log('  Current Section:', bestData.currentSection);
        console.log('  Total Keys:', Object.keys(bestData).length);
        return bestData;
    } else {
        console.error('❌ STEP 4 FAILED: No valid data source found');
        return null;
    }
}

const loadedData = testDataSourceScoring();

// Test Section 3 validation requirements
function testSection3Validation(data) {
    console.log('\n🔍 STEP 5: Testing Section 3 validation requirements...');

    if (!data) {
        console.error('❌ STEP 5 FAILED: No data to validate');
        return false;
    }

    const requiredFields = {
        organizationName: data.organizationName,
        contactEmail: data.contactEmail,
        proposalId: data.id || data.proposalId || data.organization_id
    };

    console.log('  📋 Required fields check:');

    const missingFields = [];
    Object.entries(requiredFields).forEach(([field, value]) => {
        const isPresent = value && value !== '';
        console.log(`    ${field}: ${isPresent ? '✅' : '❌'} (value: "${value}")`);
        if (!isPresent) {
            missingFields.push(field);
        }
    });

    if (missingFields.length === 0) {
        console.log('✅ STEP 5 RESULT: All required fields present for Section 3');
        return true;
    } else {
        console.error(`❌ STEP 5 FAILED: Missing required fields: ${missingFields.join(', ')}`);
        return false;
    }
}

const validationPassed = testSection3Validation(loadedData);

// Test state machine initialization logic
function testStateMachineLogic(data) {
    console.log('\n🔍 STEP 6: Testing state machine initialization logic...');

    if (!data) {
        console.error('❌ STEP 6 FAILED: No data for state machine');
        return 'overview';
    }

    const currentSection = data.currentSection;
    const hasOrgInfo = !!(data.organizationName && data.contactEmail);
    const hasEventType = !!(data.organizationType || data.eventType || data.selectedEventType);

    console.log('  📋 State machine inputs:');
    console.log(`    currentSection: "${currentSection}"`);
    console.log(`    hasOrgInfo: ${hasOrgInfo}`);
    console.log(`    hasEventType: ${hasEventType}`);
    console.log(`    data keys length: ${Object.keys(data).length}`);

    // Simulate the getInitialStateValue logic
    if (!data || Object.keys(data).length <= 2) {
        console.log('  🚨 SAFE START: No meaningful form data - starting at Overview');
        return 'overview';
    }

    if (data.organizationName && data.contactEmail && currentSection === 'schoolEvent') {
        console.log('  ✅ ORGANIZATION DATA FOUND: Allowing direct access to Section 3');
        return 'schoolEvent';
    }

    if (currentSection === 'schoolEvent') {
        if (!hasEventType) {
            console.log('  ❌ Section 3 requires event type - redirecting to event type selection');
            return 'eventTypeSelection';
        }
        if (!hasOrgInfo) {
            console.log('  ❌ Section 3 requires Section 2 completion - redirecting to Section 2');
            return 'orgInfo';
        }
        console.log('  ✅ Access granted to Section 3 (School Event)');
        return 'schoolEvent';
    }

    console.log('  🔧 Unknown section, defaulting to overview');
    return 'overview';
}

const finalState = testStateMachineLogic(loadedData);

// Final test results
console.log('\n🎯 FINAL TEST RESULTS:');
console.log('=====================================');
console.log(`✅ Data Source Loading: ${loadedData ? 'PASS' : 'FAIL'}`);
console.log(`✅ Section 3 Validation: ${validationPassed ? 'PASS' : 'FAIL'}`);
console.log(`✅ State Machine Logic: ${finalState === 'schoolEvent' ? 'PASS' : 'FAIL'} (result: ${finalState})`);

if (loadedData && validationPassed && finalState === 'schoolEvent') {
    console.log('\n🎉 SUCCESS: Complete data flow test PASSED!');
    console.log('   Section 2 → Section 3 data flow should work correctly.');
} else {
    console.log('\n❌ FAILURE: Data flow test FAILED!');
    console.log('   Issues need to be resolved before Section 3 will work.');

    if (!loadedData) {
        console.log('   🔧 Fix: Check localStorage saving in Section 2');
    }
    if (!validationPassed) {
        console.log('   🔧 Fix: Ensure all required fields are included in Section 2 data');
    }
    if (finalState !== 'schoolEvent') {
        console.log('   🔧 Fix: Check state machine initialization logic');
    }
}

console.log('\n🔧 TO RUN THIS TEST:');
console.log('1. Open browser console');
console.log('2. Copy and paste this entire script');
console.log('3. Review the results above');
console.log('4. If tests fail, check the specific failure reasons');

// Debug helper: Show current localStorage state
console.log('\n📊 CURRENT LOCALSTORAGE STATE:');
console.log('=====================================');
const keys = ['eventProposalFormData', 'cedoFormData', 'formData', 'submitEventFormData'];
keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            console.log(`${key}: ${Object.keys(parsed).length} keys`);
            console.log(`  organizationName: "${parsed.organizationName || 'undefined'}"`);
            console.log(`  contactEmail: "${parsed.contactEmail || 'undefined'}"`);
            console.log(`  currentSection: "${parsed.currentSection || 'undefined'}"`);
        } catch (e) {
            console.log(`${key}: Invalid JSON`);
        }
    } else {
        console.log(`${key}: Not found`);
    }
}); 