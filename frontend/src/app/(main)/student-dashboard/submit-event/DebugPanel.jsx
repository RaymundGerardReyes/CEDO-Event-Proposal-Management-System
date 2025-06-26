"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export const DebugPanel = ({ state, formData, disabled, clearStorageAndReload, debugFormStorage, testFormRestoration, unlockSection5, send }) => {
    const [authInfo, setAuthInfo] = useState(null)
    const [localStorageData, setLocalStorageData] = useState(null)
    const [domInfo, setDomInfo] = useState(null)

    // Test the send function directly
    const testStateMachine = () => {
        console.log('🧪 TESTING STATE MACHINE SEND FUNCTION DIRECTLY...');

        const testData = {
            organizationDescription: 'DIRECT STATE MACHINE TEST ' + Date.now(),
            organizationName: 'Direct Test Org',
            contactName: 'Direct Test Contact'
        };

        console.log('🔍 Test data being sent:', testData);
        console.log('🔍 Send function available:', !!send);

        if (send) {
            try {
                console.log('📤 Calling send() function directly...');
                send({
                    type: "UPDATE_FORM",
                    data: testData,
                });
                console.log('✅ Direct send() call completed - check state machine logs!');
            } catch (error) {
                console.error('❌ Direct send() call failed:', error);
            }
        } else {
            console.error('❌ Send function not available');
        }

        // Also test DOM manipulation as fallback
        try {
            const orgInput = document.querySelector('#organizationName');
            if (orgInput) {
                orgInput.value = 'DOM TEST ' + Date.now();
                orgInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ DOM manipulation test completed');
            }
        } catch (error) {
            console.error('❌ DOM test failed:', error);
        }
    };

    useEffect(() => {
        // Check authentication info
        const checkAuth = () => {
            const cookies = document.cookie
            const hasSession = cookies.includes('session') || cookies.includes('token')

            setAuthInfo({
                cookies: cookies || 'No cookies found',
                hasSession,
                userAgent: navigator.userAgent,
                currentUrl: window.location.href
            })
        }

        checkAuth()
    }, []) // Only run once on mount

    useEffect(() => {
        // Check localStorage
        const checkLocalStorage = () => {
            try {
                const eventData = localStorage.getItem('eventProposalFormData')
                const parsedData = eventData ? JSON.parse(eventData) : null

                setLocalStorageData({
                    raw: eventData,
                    parsed: parsedData,
                    size: eventData?.length || 0
                })
            } catch (error) {
                setLocalStorageData({
                    error: error.message,
                    raw: null,
                    parsed: null
                })
            }
        }

        checkLocalStorage()
    }, [state.value]) // Only update when state value changes

    useEffect(() => {
        // Check DOM elements
        const checkDOM = () => {
            const organizationNameInput = document.querySelector('#organizationName')
            const radioButtons = document.querySelectorAll('input[type="radio"]')

            setDomInfo({
                organizationNameExists: !!organizationNameInput,
                organizationNameDisabled: organizationNameInput?.disabled || false,
                organizationNameValue: organizationNameInput?.value || '',
                radioButtonsCount: radioButtons.length,
                radioButtonsDisabled: Array.from(radioButtons).map(rb => rb.disabled),
                formExists: !!document.querySelector('form')
            })
        }

        // Delay DOM check to ensure components are rendered
        const timer = setTimeout(checkDOM, 1000)

        return () => clearTimeout(timer)
    }, [state.value]) // Only run when state changes

    const runInputTest = () => {
        const input = document.querySelector('#organizationName')
        if (input) {
            input.focus()
            input.value = 'Test Organization'
            input.dispatchEvent(new Event('input', { bubbles: true }))
            input.dispatchEvent(new Event('change', { bubbles: true }))
            console.log('✅ Input test completed - check if value appears')
        } else {
            console.log('❌ Organization name input not found')
        }
    }

    const testRadioButtons = () => {
        const schoolRadio = document.querySelector('#school-based')
        const communityRadio = document.querySelector('#community-based')

        if (schoolRadio) {
            schoolRadio.click()
            console.log('✅ School radio clicked')
        }

        setTimeout(() => {
            if (communityRadio) {
                communityRadio.click()
                console.log('✅ Community radio clicked')
            }
        }, 1000)
    }

    // Test form functionality
    const testFormInputs = () => {
        console.log('🧪 TESTING FORM INPUTS...');

        // Test organization name input
        const orgNameInput = document.querySelector('#organizationName');
        if (orgNameInput) {
            orgNameInput.value = 'Test Organization ' + Date.now();
            orgNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Organization name input test completed');
        }

        // Test organization type selection
        const schoolRadio = document.querySelector('#school-based');
        if (schoolRadio) {
            schoolRadio.click();
            console.log('✅ School-based radio button test completed');
        }

        // Test contact name input
        const contactNameInput = document.querySelector('#contactName');
        if (contactNameInput) {
            contactNameInput.value = 'John Doe';
            contactNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Contact name input test completed');
        }

        // Test contact email input
        const contactEmailInput = document.querySelector('#contactEmail');
        if (contactEmailInput) {
            contactEmailInput.value = 'john.doe@example.com';
            contactEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Contact email input test completed');
        }

        console.log('🎯 Form input test completed - check console logs above');
    };

    // Test controlled component behavior
    const testControlledComponents = () => {
        console.log('🧪 TESTING CONTROLLED COMPONENT BEHAVIOR...');

        // Test if inputs maintain their controlled state
        const orgNameInput = document.querySelector('#organizationName');
        if (orgNameInput) {
            const initialValue = orgNameInput.value;
            console.log('📋 Initial org name value:', initialValue);

            // Set value directly
            orgNameInput.value = 'CONTROLLED TEST';
            console.log('📋 Direct value set to:', orgNameInput.value);

            // Trigger React's synthetic event
            orgNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('📋 After input event:', orgNameInput.value);

            // Check if value persists
            setTimeout(() => {
                console.log('📋 Value after timeout:', orgNameInput.value);
            }, 500);
        }

        console.log('🎯 Controlled component test completed');
    };

    if (process.env.NODE_ENV !== 'development') return null

    return (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
            <CardHeader>
                <CardTitle className="text-yellow-800 flex justify-between items-center">
                    🔍 Comprehensive Debug Panel
                    <div className="flex gap-2">
                        <Button
                            onClick={clearStorageAndReload}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                        >
                            Clear Storage & Reload
                        </Button>

                        {debugFormStorage && (
                            <Button
                                onClick={debugFormStorage}
                                size="sm"
                                variant="outline"
                                className="text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                🔍 Debug Storage
                            </Button>
                        )}
                        {testFormRestoration && (
                            <Button
                                onClick={testFormRestoration}
                                size="sm"
                                variant="outline"
                                className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            >
                                🔄 Test Restoration
                            </Button>
                        )}
                        {unlockSection5 && (
                            <Button
                                onClick={unlockSection5}
                                size="sm"
                                variant="outline"
                                className="text-xs bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                                🔓 Unlock Section 5
                            </Button>
                        )}
                        <Button
                            onClick={runInputTest}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                        >
                            Test Input
                        </Button>
                        <Button
                            onClick={testRadioButtons}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                        >
                            Test Radio
                        </Button>
                        <Button
                            onClick={testFormInputs}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                        >
                            Test Form Inputs
                        </Button>
                        <Button
                            onClick={testControlledComponents}
                            size="sm"
                            variant="outline"
                            className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                        >
                            Test Controlled Components
                        </Button>
                        <Button
                            onClick={testStateMachine}
                            size="sm"
                            variant="outline"
                            className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                        >
                            Test State Machine
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Authentication Info */}
                <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-red-700 mb-2">🔐 Authentication Status</h4>
                    {authInfo && (
                        <div className="space-y-1 text-xs">
                            <div><strong>Has Session:</strong> {authInfo.hasSession ? '✅ Yes' : '❌ No'}</div>
                            <div><strong>Current URL:</strong> {authInfo.currentUrl}</div>
                            <div><strong>Cookies:</strong> {authInfo.cookies}</div>
                        </div>
                    )}
                </div>

                {/* STATE MACHINE INFO */}
                <div className="p-4 bg-gray-800 text-white rounded-lg font-mono text-xs overflow-x-auto">
                    <h4 className="font-bold text-gray-300 mb-2">Internal State Snapshot</h4>
                    <div className="space-y-1 text-xs">
                        <div><strong>Current State:</strong> {state.value}</div>
                        <div><strong>Proposal Status:</strong> {formData?.proposalStatus}</div>
                        <div><strong>Form Disabled:</strong> {disabled ? '❌ Yes' : '✅ No'}</div>
                        <div><strong>Has Active Proposal:</strong> {formData?.hasActiveProposal ? 'Yes' : 'No'}</div>
                    </div>

                    <h4 className="font-bold text-gray-300 mt-4 mb-2">Form Data (XState Context)</h4>
                    <pre>{JSON.stringify(formData, null, 2)}</pre>
                </div>
            </CardContent>
        </Card>
    )
} 