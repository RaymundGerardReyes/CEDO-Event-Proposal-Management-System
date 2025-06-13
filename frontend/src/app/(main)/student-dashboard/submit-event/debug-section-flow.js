/**
 * Comprehensive debugging utility for Section Flow issues
 * 
 * Usage: Add this to your browser console or call from React DevTools
 */

window.debugSectionFlow = function () {
    console.log('🔍 === COMPREHENSIVE SECTION FLOW DIAGNOSTIC ===');

    // 1. Check localStorage data
    console.log('\n📦 LOCALSTORAGE ANALYSIS:');
    const storageKeys = ['eventProposalFormData', 'cedoFormData', 'formData', 'submitEventFormData'];
    let bestStorageData = null;
    let bestScore = 0;

    storageKeys.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                let score = 0;
                if (parsed.organizationName?.trim()) score += 15;
                if (parsed.contactEmail?.includes('@')) score += 15;
                if (parsed.id || parsed.proposalId) score += 10;
                if (parsed.section2_completed || parsed.lastSavedSection === 'section2') score += 5;

                console.log(`  ${key}:`, {
                    score,
                    organizationName: parsed.organizationName || 'MISSING',
                    contactEmail: parsed.contactEmail || 'MISSING',
                    proposalId: parsed.id || parsed.proposalId || 'MISSING',
                    currentSection: parsed.currentSection || 'MISSING',
                    section2_completed: parsed.section2_completed || false,
                    lastSavedSection: parsed.lastSavedSection || 'none',
                    totalKeys: Object.keys(parsed).length
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestStorageData = parsed;
                }
            }
        } catch (error) {
            console.log(`  ${key}: ERROR parsing -`, error.message);
        }
    });

    console.log('\n🏆 BEST STORAGE DATA (score:', bestScore, '):', bestStorageData ? {
        organizationName: bestStorageData.organizationName,
        contactEmail: bestStorageData.contactEmail,
        currentSection: bestStorageData.currentSection,
        hasProposalId: !!(bestStorageData.id || bestStorageData.proposalId)
    } : 'NONE FOUND');

    // 2. Check current React state (if available)
    console.log('\n⚛️ REACT STATE ANALYSIS:');
    try {
        // Try to access React DevTools hook
        const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (reactDevTools) {
            console.log('  React DevTools available - check formData in Components tab');
        } else {
            console.log('  React DevTools not available');
        }
    } catch (error) {
        console.log('  Could not access React state:', error.message);
    }

    // 3. Validate Section 2 completion requirements
    console.log('\n✅ SECTION 2 COMPLETION VALIDATION:');
    if (bestStorageData) {
        const hasOrgName = !!(bestStorageData.organizationName?.trim());
        const hasEmail = !!(bestStorageData.contactEmail?.includes('@'));
        const hasProposalId = !!(bestStorageData.id || bestStorageData.proposalId);
        const hasCompletionFlag = !!(bestStorageData.section2_completed || bestStorageData.lastSavedSection === 'section2');

        console.log('  Organization Name:', hasOrgName ? '✅ VALID' : '❌ MISSING');
        console.log('  Contact Email:', hasEmail ? '✅ VALID' : '❌ MISSING/INVALID');
        console.log('  Proposal ID:', hasProposalId ? '✅ PRESENT' : '❌ MISSING');
        console.log('  Completion Flag:', hasCompletionFlag ? '✅ PRESENT' : '❌ MISSING');

        const canAccessSection3 = hasOrgName && hasEmail && (hasProposalId || hasCompletionFlag);
        console.log('\n🎯 SECTION 3 ACCESS:', canAccessSection3 ? '✅ SHOULD BE ALLOWED' : '❌ BLOCKED');

        if (!canAccessSection3) {
            console.log('🔧 REQUIRED ACTIONS:');
            if (!hasOrgName) console.log('  - Complete organization name in Section 2');
            if (!hasEmail) console.log('  - Provide valid email in Section 2');
            if (!hasProposalId && !hasCompletionFlag) console.log('  - Ensure Section 2 saves properly (proposal ID or completion flag)');
        }
    } else {
        console.log('  ❌ NO DATA FOUND - Complete Section 2 first');
    }

    // 4. Current URL and routing info
    console.log('\n🌐 CURRENT CONTEXT:');
    console.log('  URL:', window.location.href);
    console.log('  Pathname:', window.location.pathname);
    console.log('  Hash:', window.location.hash || 'none');

    // 5. Provide actionable recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (bestStorageData && bestStorageData.organizationName && bestStorageData.contactEmail) {
        if (bestStorageData.currentSection === 'schoolEvent') {
            console.log('  1. ✅ You have Section 2 data and want Section 3 - this should work');
            console.log('  2. 🔄 Try refreshing the page');
            console.log('  3. 🧹 If still failing, clear localStorage with: localStorage.clear()');
        } else {
            console.log('  1. 🔄 Your data is complete but currentSection is wrong');
            console.log('  2. 📝 Try navigating through the flow normally');
        }
    } else {
        console.log('  1. 📝 Complete Section 2 (Organization Info) first');
        console.log('  2. ✅ Ensure all required fields are filled');
        console.log('  3. 💾 Click "Save & Continue" to proceed');
    }

    console.log('\n🔍 === DIAGNOSTIC COMPLETE ===');

    return {
        bestStorageData,
        bestScore,
        canAccessSection3: bestStorageData ?
            !!(bestStorageData.organizationName?.trim() &&
                bestStorageData.contactEmail?.includes('@') &&
                (bestStorageData.id || bestStorageData.proposalId ||
                    bestStorageData.section2_completed || bestStorageData.lastSavedSection === 'section2')) : false
    };
};

// Auto-run on page load for immediate debugging
if (typeof window !== 'undefined') {
    setTimeout(() => {
        console.log('🎯 Auto-running section flow diagnostic...');
        window.debugSectionFlow();
    }, 2000);
}

// Also make it available globally for manual debugging
console.log('🛠️ Debugging utility loaded. Run window.debugSectionFlow() anytime to diagnose section flow issues.'); 