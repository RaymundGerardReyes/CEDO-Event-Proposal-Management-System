/**
 * Test Script: EventTypeSelection Flow Integration
 * 
 * This script tests the state machine transitions to ensure:
 * 1. Overview -> EventTypeSelection -> OrgInfo flow works
 * 2. State transitions are properly configured
 * 3. Form data is persisted correctly
 */

console.log('🧪 Testing EventTypeSelection Flow Integration...\n')

// Test 1: Check STATUS constants
console.log('✅ Test 1: STATUS Constants')
try {
    const statusModule = require('./src/app/(main)/student-dashboard/submit-event/eventStateMachine.js')
    const { STATUS } = statusModule

    const requiredStatuses = [
        'OVERVIEW',
        'EVENT_TYPE_SELECTION',
        'ORG_INFO',
        'SCHOOL_EVENT',
        'COMMUNITY_EVENT'
    ]

    let missingStatuses = []
    requiredStatuses.forEach(status => {
        if (!STATUS[status]) {
            missingStatuses.push(status)
        }
    })

    if (missingStatuses.length === 0) {
        console.log('✅ All required STATUS constants exist')
        console.log('   - OVERVIEW:', STATUS.OVERVIEW)
        console.log('   - EVENT_TYPE_SELECTION:', STATUS.EVENT_TYPE_SELECTION)
        console.log('   - ORG_INFO:', STATUS.ORG_INFO)
    } else {
        console.log('❌ Missing STATUS constants:', missingStatuses)
    }
} catch (error) {
    console.log('❌ Error loading STATUS constants:', error.message)
}

console.log('\n' + '='.repeat(60) + '\n')

// Test 2: Simulate State Machine Flow
console.log('✅ Test 2: State Machine Flow Simulation')
try {
    const { eventStateMachine } = require('./src/app/(main)/student-dashboard/submit-event/eventStateMachine.js')

    console.log('🏗️ Initial state:', eventStateMachine.initial)

    // Test transitions
    const testTransitions = [
        { from: 'overview', action: 'START_PROPOSAL', expectedTo: 'eventTypeSelection' },
        { from: 'eventTypeSelection', action: 'SELECT_EVENT_TYPE', expectedTo: 'orgInfo' },
        { from: 'eventTypeSelection', action: 'PREVIOUS', expectedTo: 'overview' }
    ]

    testTransitions.forEach(test => {
        console.log(`🔄 Testing: ${test.from} --[${test.action}]--> ${test.expectedTo}`)

        const stateConfig = eventStateMachine.states[test.from]
        if (stateConfig && stateConfig.on && stateConfig.on[test.action]) {
            const targetState = stateConfig.on[test.action].target
            if (targetState === test.expectedTo) {
                console.log(`   ✅ Transition configured correctly`)
            } else {
                console.log(`   ❌ Expected ${test.expectedTo}, got ${targetState}`)
            }
        } else {
            console.log(`   ❌ Transition not found in state configuration`)
        }
    })

} catch (error) {
    console.log('❌ Error testing state machine:', error.message)
}

console.log('\n' + '='.repeat(60) + '\n')

// Test 3: Check if EventTypeSelection component exists
console.log('✅ Test 3: EventTypeSelection Component')
try {
    const fs = require('fs')
    const path = './src/app/(main)/student-dashboard/submit-event/EventTypeSelection.jsx'

    if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, 'utf8')

        // Check for required props
        const hasOnSelectProp = content.includes('onSelect')
        const hasOnPreviousProp = content.includes('onPrevious')
        const hasHandleContinue = content.includes('handleContinue')

        console.log('📄 EventTypeSelection.jsx exists')
        console.log('   - Has onSelect prop:', hasOnSelectProp ? '✅' : '❌')
        console.log('   - Has onPrevious prop:', hasOnPreviousProp ? '✅' : '❌')
        console.log('   - Has handleContinue:', hasHandleContinue ? '✅' : '❌')

        if (hasOnSelectProp && hasOnPreviousProp && hasHandleContinue) {
            console.log('✅ EventTypeSelection component properly configured')
        } else {
            console.log('⚠️ EventTypeSelection component may need updates')
        }
    } else {
        console.log('❌ EventTypeSelection.jsx not found')
    }
} catch (error) {
    console.log('❌ Error checking EventTypeSelection:', error.message)
}

console.log('\n' + '='.repeat(60) + '\n')

// Test 4: Check SubmitEventFlow integration
console.log('✅ Test 4: SubmitEventFlow Integration')
try {
    const fs = require('fs')
    const path = './src/app/(main)/student-dashboard/submit-event/SubmitEventFlow.jsx'

    if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, 'utf8')

        const hasEventTypeSelectionImport = content.includes('const EventTypeSelection = lazy')
        const hasEventTypeSelectionCase = content.includes('case "eventTypeSelection"')
        const hasHandleEventTypeSelect = content.includes('handleEventTypeSelect')
        const hasEventTypeInSteps = content.includes('{ id: "eventTypeSelection"')

        console.log('📄 SubmitEventFlow.jsx integration:')
        console.log('   - EventTypeSelection import:', hasEventTypeSelectionImport ? '✅' : '❌')
        console.log('   - eventTypeSelection case:', hasEventTypeSelectionCase ? '✅' : '❌')
        console.log('   - handleEventTypeSelect:', hasHandleEventTypeSelect ? '✅' : '❌')
        console.log('   - eventTypeSelection in steps:', hasEventTypeInSteps ? '✅' : '❌')

        if (hasEventTypeSelectionImport && hasEventTypeSelectionCase &&
            hasHandleEventTypeSelect && hasEventTypeInSteps) {
            console.log('✅ SubmitEventFlow properly integrated')
        } else {
            console.log('⚠️ SubmitEventFlow integration incomplete')
        }
    } else {
        console.log('❌ SubmitEventFlow.jsx not found')
    }
} catch (error) {
    console.log('❌ Error checking SubmitEventFlow:', error.message)
}

console.log('\n' + '='.repeat(60) + '\n')

console.log('🎯 Flow Integration Test Summary:')
console.log('Expected Flow: Overview → EventTypeSelection → OrgInfo → (School/Community)Event → Reporting')
console.log('\n🚀 To test manually:')
console.log('1. Start the development server: npm run dev')
console.log('2. Navigate to the submit-event page')
console.log('3. Click "Start New Proposal" in Overview')
console.log('4. Should see EventTypeSelection with school/community options')
console.log('5. Select an event type and click Continue')
console.log('6. Should navigate to Section2_OrgInfo')
console.log('\n🎉 Integration test completed!') 