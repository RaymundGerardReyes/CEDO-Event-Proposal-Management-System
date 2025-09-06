/**
 * EventTypeDebugger Component
 * 
 * Purpose: Debugging component for event type selection process
 * Approach: Monitors event type selection state and provides debugging information
 * Coverage: Event type selection, localStorage state, API calls, and error tracking
 * 
 * Key Features:
 * - Event type selection monitoring
 * - localStorage state tracking
 * - API call debugging
 * - Error state monitoring
 */

'use client';

import { useEffect, useState } from 'react';

export function EventTypeDebugger() {
    const [debugState, setDebugState] = useState({
        selectedEventType: null,
        localStorageData: {},
        apiCalls: [],
        errors: [],
        timestamp: null
    });

    // Monitor event type selection state
    useEffect(() => {
        const updateDebugState = () => {
            const newState = {
                selectedEventType: null,
                localStorageData: {},
                apiCalls: [],
                errors: [],
                timestamp: new Date().toISOString()
            };

            // Get selected event type
            try {
                const eventTypeSelection = localStorage.getItem('eventTypeSelection');
                const selectedEventType = localStorage.getItem('selectedEventType');

                newState.selectedEventType = selectedEventType;
                newState.localStorageData = {
                    eventTypeSelection: eventTypeSelection ? JSON.parse(eventTypeSelection) : null,
                    selectedEventType,
                    eventProposalFormData: localStorage.getItem('eventProposalFormData')
                };
            } catch (error) {
                newState.errors.push(`localStorage error: ${error.message}`);
            }

            setDebugState(newState);
        };

        updateDebugState();

        // Update every 1 second for real-time monitoring
        const interval = setInterval(updateDebugState, 1000);
        return () => clearInterval(interval);
    }, []);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="bg-blue-900 text-blue-200 p-4 rounded-lg font-mono text-xs">
            <div className="mb-4">
                <h3 className="text-blue-100 font-semibold mb-2">🎯 Event Type Debugger</h3>
                <div className="space-y-1">
                    <div>Selected: <span className="text-yellow-300">{debugState.selectedEventType || 'None'}</span></div>
                    <div>Time: <span className="text-gray-400">{debugState.timestamp}</span></div>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-blue-100 font-semibold mb-2">📦 localStorage State</h4>
                <div className="bg-black bg-opacity-50 p-2 rounded">
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugState.localStorageData, null, 2)}
                    </pre>
                </div>
            </div>

            {debugState.errors.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-red-300 font-semibold mb-2">❌ Errors</h4>
                    <div className="bg-red-900 bg-opacity-50 p-2 rounded">
                        {debugState.errors.map((error, index) => (
                            <div key={index} className="text-red-200 text-xs">
                                {error}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-xs text-blue-400">
                Auto-refresh every 1s • Development only
            </div>
        </div>
    );
}



