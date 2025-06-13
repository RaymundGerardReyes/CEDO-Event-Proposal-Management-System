// 🔧 SIMPLE SECTION2 DEBUG SCRIPT
// Copy and paste this into your browser's Developer Console

console.log('🔧 Installing Section2_OrgInfo Bug Detector...');

let updateCount = 0;
const originalLog = console.log;

console.log = function (...args) {
    if (args[0] && args[0].includes('📤 Sending')) {
        updateCount++;
        console.group(`🚨 FORM UPDATE #${updateCount}`);
        originalLog(...args);

        if (args[1] && args[1].currentSection) {
            console.error('❌ CRITICAL BUG: currentSection sent:', args[1].currentSection);
            console.error('❌ This is the source of the navigation bug!');
            console.trace('Call stack:');
        } else {
            console.log('✅ Clean update - no currentSection interference');
        }
        console.groupEnd();
    } else {
        originalLog(...args);
    }
};

// Monitor localStorage for section changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
    if (key === 'eventProposalFormData') {
        try {
            const data = JSON.parse(value);
            if (data.currentSection === 'overview' && window.location.href.includes('submit-event')) {
                console.error('❌ SECTION REVERTED TO OVERVIEW!');
                console.trace('Reversion call stack:');
            }
        } catch (e) {
            // Ignore parsing errors
        }
    }
    return originalSetItem.apply(this, arguments);
};

console.log('✅ Bug detector installed!');
console.log('📋 Now test these actions:');
console.log('1. Type in Organization Name');
console.log('2. Select organization type');
console.log('3. Type in other fields');
console.log('4. Watch for ❌ CRITICAL BUG messages'); 