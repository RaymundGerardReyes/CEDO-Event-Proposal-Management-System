/**
 * 🔍 SUBMIT EVENT FLOW - ADVANCED DEBUG UTILITIES
 * 
 * Load this script in the browser console for powerful debugging tools:
 * 
 * Copy and paste this entire file into the browser console, then use:
 * - window.SubmitEventDebug.analyzeFlow()
 * - window.SubmitEventDebug.testTransitions()
 * - window.SubmitEventDebug.simulateUser()
 * - window.SubmitEventDebug.exportReport()
 * 
 * Created: 2024
 */

window.SubmitEventDebug = {

    // 🔍 COMPREHENSIVE FLOW ANALYSIS
    analyzeFlow() {
        console.clear()
        console.log('🔍 ===============================================')
        console.log('    SUBMIT EVENT FLOW - COMPREHENSIVE ANALYSIS')
        console.log('===============================================')

        const debug = window.__SUBMIT_EVENT_DEBUG__
        if (!debug) {
            console.error('❌ Debug object not found. Make sure to click "Log Full State" first.')
            return
        }

        // 1. Flow State Overview
        console.group('🎯 Flow State Overview')
        console.log(`Current Section: ${debug.currentSection}`)
        console.log(`State Machine: ${debug.state}`)
        console.log(`Progress: ${debug.progress}%`)
        console.log(`Has Errors: ${debug.hasError}`)
        console.log(`Validation Issues: ${Object.keys(debug.validationErrors || {}).length}`)
        console.groupEnd()

        // 2. Navigation Path Analysis
        console.group('🧭 Navigation Path Analysis')
        const possiblePaths = {
            overview: ['eventTypeSelection'],
            eventTypeSelection: ['overview', 'orgInfo'],
            orgInfo: ['eventTypeSelection', 'schoolEvent', 'communityEvent'],
            schoolEvent: ['orgInfo', 'reporting'],
            communityEvent: ['orgInfo', 'reporting'],
            reporting: ['schoolEvent', 'communityEvent']
        }

        const currentPaths = possiblePaths[debug.currentSection] || []
        console.log(`Available transitions from ${debug.currentSection}:`, currentPaths)
        console.groupEnd()

        // 3. Data Consistency Check
        console.group('📊 Data Consistency Check')
        const consistencyIssues = this.checkDataConsistency(debug)
        if (consistencyIssues.length === 0) {
            console.log('✅ No data consistency issues found')
        } else {
            console.log('⚠️ Data consistency issues:')
            consistencyIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`)
            })
        }
        console.groupEnd()

        // 4. Performance Metrics
        console.group('⚡ Performance Metrics')
        this.analyzePerformance()
        console.groupEnd()

        console.log('🎉 Flow analysis complete!')
    },

    // 🧪 TEST ALL POSSIBLE TRANSITIONS
    testTransitions() {
        console.group('🧪 Testing All State Transitions')

        const debug = window.__SUBMIT_EVENT_DEBUG__
        if (!debug || !debug.send) {
            console.error('❌ State machine not available')
            return
        }

        const transitions = [
            { from: 'overview', action: 'START_PROPOSAL', to: 'eventTypeSelection' },
            { from: 'eventTypeSelection', action: 'SELECT_EVENT_TYPE', to: 'orgInfo', data: { eventType: 'school' } },
            { from: 'eventTypeSelection', action: 'PREVIOUS', to: 'overview' },
            { from: 'orgInfo', action: 'NEXT', to: 'schoolEvent' },
            { from: 'orgInfo', action: 'NEXT_TO_COMMUNITY', to: 'communityEvent' },
            { from: 'orgInfo', action: 'PREVIOUS', to: 'eventTypeSelection' },
            { from: 'schoolEvent', action: 'NEXT', to: 'reporting' },
            { from: 'schoolEvent', action: 'PREVIOUS', to: 'orgInfo' },
            { from: 'communityEvent', action: 'NEXT', to: 'reporting' },
            { from: 'communityEvent', action: 'PREVIOUS', to: 'orgInfo' },
            { from: 'reporting', action: 'PREVIOUS', to: 'approved' }
        ]

        console.log('Available transitions:')
        console.table(transitions)

        console.log('\n🎯 To test a transition manually:')
        console.log('window.__SUBMIT_EVENT_DEBUG__.send({ type: "ACTION_NAME", data: {...} })')

        console.groupEnd()
    },

    // 🎭 SIMULATE USER INTERACTIONS
    simulateUser() {
        console.group('🎭 User Interaction Simulation')

        const debug = window.__SUBMIT_EVENT_DEBUG__
        if (!debug) {
            console.error('❌ Debug object not available')
            return
        }

        const scenarios = {
            newSchoolUser: {
                name: '🏫 New School Event User',
                steps: [
                    { action: 'Fill Organization Info', data: { organizationName: 'School Science Club', organizationTypes: ['school-based'], contactName: 'Dr. Smith', contactEmail: 'smith@school.edu' } },
                    { action: 'Select School Event Type', note: 'Would trigger navigation to school event section' },
                    { action: 'Fill School Event Details', data: { schoolEventName: 'Science Fair 2024', schoolEventDate: '2024-06-15' } }
                ]
            },
            newCommunityUser: {
                name: '🏘️ New Community Event User',
                steps: [
                    { action: 'Fill Organization Info', data: { organizationName: 'Community Center', organizationTypes: ['community-based'], contactName: 'Jane Doe', contactEmail: 'jane@community.org' } },
                    { action: 'Select Community Event Type', note: 'Would trigger navigation to community event section' },
                    { action: 'Fill Community Event Details', data: { communityEventName: 'Summer Festival', communityEventDate: '2024-07-20' } }
                ]
            },
            existingUser: {
                name: '🔄 Returning User with Draft',
                steps: [
                    { action: 'Load existing data', note: 'Data loaded from localStorage' },
                    { action: 'Continue editing', note: 'Navigate to appropriate section based on saved state' },
                    { action: 'Update fields', data: { organizationDescription: 'Updated description' } }
                ]
            }
        }

        Object.entries(scenarios).forEach(([key, scenario]) => {
            console.log(`\n${scenario.name}:`)
            scenario.steps.forEach((step, index) => {
                console.log(`   ${index + 1}. ${step.action}`)
                if (step.data) {
                    console.log('      Data:', step.data)
                    console.log(`      Execute: window.__SUBMIT_EVENT_DEBUG__.handlers.handleFormUpdate(${JSON.stringify(step.data)})`)
                }
                if (step.note) {
                    console.log(`      Note: ${step.note}`)
                }
            })
        })

        console.log('\n🚀 Quick test:')
        console.log('window.SubmitEventDebug.quickTest("school") // or "community"')

        console.groupEnd()
    },

    // ⚡ QUICK TEST FUNCTION
    quickTest(eventType = 'school') {
        console.log(`🚀 Quick testing ${eventType} event flow...`)

        const debug = window.__SUBMIT_EVENT_DEBUG__
        if (!debug || !debug.handlers) {
            console.error('❌ Debug handlers not available')
            return
        }

        // Step 1: Fill organization info
        const orgData = {
            organizationName: eventType === 'school' ? 'Test School Club' : 'Test Community Org',
            organizationTypes: [eventType === 'school' ? 'school-based' : 'community-based'],
            contactName: 'Test User',
            contactEmail: 'test@example.com',
            contactPhone: '123-456-7890'
        }

        console.log('📝 Updating organization info...')
        debug.handlers.handleFormUpdate(orgData)

        setTimeout(() => {
            console.log('✅ Organization info updated')
            console.log('📊 Current form data:', debug.formData)
        }, 100)
    },

    // 📊 DATA CONSISTENCY CHECKER
    checkDataConsistency(debug) {
        const issues = []

        // Check localStorage vs component state
        try {
            const stored = JSON.parse(localStorage.getItem('eventProposalFormData') || '{}')
            if (stored.currentSection !== debug.currentSection) {
                issues.push(`Section mismatch: localStorage(${stored.currentSection}) vs component(${debug.currentSection})`)
            }

            if (stored.organizationName !== debug.formData?.organizationName) {
                issues.push(`Organization name mismatch: localStorage(${stored.organizationName}) vs component(${debug.formData?.organizationName})`)
            }
        } catch (error) {
            issues.push(`localStorage parse error: ${error.message}`)
        }

        // Check required fields for current section
        const requiredFields = this.getRequiredFields(debug.currentSection)
        requiredFields.forEach(field => {
            const value = debug.formData?.[field]
            if (!value || (Array.isArray(value) && value.length === 0)) {
                issues.push(`Missing required field for ${debug.currentSection}: ${field}`)
            }
        })

        // Check validation errors vs actual data
        Object.keys(debug.validationErrors || {}).forEach(field => {
            const value = debug.formData?.[field]
            if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                issues.push(`Validation error exists but field has value: ${field}`)
            }
        })

        return issues
    },

    // 📋 GET REQUIRED FIELDS FOR SECTION
    getRequiredFields(section) {
        const requirements = {
            overview: [],
            eventTypeSelection: ['selectedEventType'],
            orgInfo: ['organizationName', 'organizationTypes', 'contactName', 'contactEmail'],
            schoolEvent: ['schoolEventName', 'schoolEventDate'],
            communityEvent: ['communityEventName', 'communityEventDate'],
            reporting: ['accomplishmentReport']
        }
        return requirements[section] || []
    },

    // ✅ CHECK IF REQUIRED DATA IS PRESENT
    checkRequiredData(section, formData) {
        const required = this.getRequiredFields(section)
        return required.every(field => {
            const value = formData?.[field]
            return value && value !== '' && (!Array.isArray(value) || value.length > 0)
        })
    },

    // ⚡ PERFORMANCE ANALYSIS
    analyzePerformance() {
        if (!window.performance) {
            console.log('❌ Performance API not available')
            return
        }

        const navigation = window.performance.getEntriesByType('navigation')[0]
        const resources = window.performance.getEntriesByType('resource')
        const memory = window.performance.memory

        console.log('📊 Performance Summary:')
        if (navigation) {
            console.log(`   Page Load: ${Math.round(navigation.loadEventEnd - navigation.fetchStart)}ms`)
            console.log(`   DOM Ready: ${Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)}ms`)
        }

        console.log(`   Resources: ${resources.length} loaded`)

        if (memory) {
            console.log(`   Memory Used: ${Math.round(memory.usedJSHeapSize / 1048576)}MB`)
            console.log(`   Memory Limit: ${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`)
        }

        // Check for slow resources
        const slowResources = resources.filter(r => r.duration > 1000)
        if (slowResources.length > 0) {
            console.log('⚠️ Slow resources (>1s):')
            slowResources.forEach(r => {
                console.log(`   ${r.name}: ${Math.round(r.duration)}ms`)
            })
        }
    },

    // 📤 EXPORT DEBUG REPORT
    exportReport() {
        const debug = window.__SUBMIT_EVENT_DEBUG__
        if (!debug) {
            console.error('❌ Debug data not available')
            return
        }

        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            state: {
                current: debug.currentSection,
                machine: debug.state,
                progress: debug.progress
            },
            formData: debug.formData,
            validationErrors: debug.validationErrors,
            localStorage: localStorage.getItem('eventProposalFormData'),
            consistencyIssues: this.checkDataConsistency(debug),
            performance: {
                memory: window.performance.memory ? {
                    used: Math.round(window.performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(window.performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)
                } : null
            }
        }

        console.log('📤 Debug Report Generated:')
        console.log(JSON.stringify(report, null, 2))

        // Copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(JSON.stringify(report, null, 2))
                .then(() => console.log('✅ Report copied to clipboard!'))
                .catch(() => console.log('⚠️ Could not copy to clipboard'))
        }

        return report
    },

    // 🔧 REPAIR UTILITIES
    repair: {
        // Fix section mismatch
        fixSectionMismatch() {
            const debug = window.__SUBMIT_EVENT_DEBUG__
            if (!debug) return

            console.log('🔧 Attempting to fix section mismatch...')
            const stored = JSON.parse(localStorage.getItem('eventProposalFormData') || '{}')

            // Update localStorage to match component state
            stored.currentSection = debug.currentSection
            localStorage.setItem('eventProposalFormData', JSON.stringify(stored))

            console.log('✅ Section mismatch fixed')
        },

        // Clear all validation errors
        clearValidationErrors() {
            const debug = window.__SUBMIT_EVENT_DEBUG__
            if (!debug || !debug.handlers) return

            console.log('🔧 Clearing all validation errors...')
            debug.handlers.handleFormUpdate({ validationErrors: {} })
            console.log('✅ Validation errors cleared')
        },

        // Reset to overview
        resetToOverview() {
            console.log('🔧 Resetting to overview...')
            localStorage.removeItem('eventProposalFormData')
            window.location.reload()
        }
    }
}

// 🎉 STARTUP MESSAGE
console.log('🔍 SubmitEventDebug utilities loaded!')
console.log('📚 Available commands:')
console.log('   • window.SubmitEventDebug.analyzeFlow()')
console.log('   • window.SubmitEventDebug.testTransitions()')
console.log('   • window.SubmitEventDebug.simulateUser()')
console.log('   • window.SubmitEventDebug.quickTest("school")')
console.log('   • window.SubmitEventDebug.exportReport()')
console.log('   • window.SubmitEventDebug.repair.fixSectionMismatch()')
console.log('')
console.log('💡 Start with: window.SubmitEventDebug.analyzeFlow()') 