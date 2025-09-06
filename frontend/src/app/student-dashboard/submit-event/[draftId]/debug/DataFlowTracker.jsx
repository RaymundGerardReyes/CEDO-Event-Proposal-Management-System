/**
 * DataFlowTracker Component
 * 
 * Purpose: Real-time debugging component for proposal data flow
 * Approach: Tracks and displays proposal state, step information, and data changes
 * Coverage: Proposal UUID, step tracking, data persistence, and error monitoring
 * 
 * Key Features:
 * - Real-time proposal state monitoring
 * - Step progression tracking
 * - Data persistence debugging
 * - Error state monitoring
 */

'use client';

import { useEffect, useState } from 'react';

export function DataFlowTracker({
    proposalUuid,
    currentStep,
    currentStepIndex = 0
}) {
    const [debugData, setDebugData] = useState({
        proposalUuid: null,
        localStorage: {},
        sessionStorage: {},
        currentStep: null,
        timestamp: null
    });

    // Update debug data when props change
    useEffect(() => {
        const updateDebugData = () => {
            const newDebugData = {
                proposalUuid,
                currentStep: currentStep?.name || 'Unknown',
                currentStepIndex,
                timestamp: new Date().toISOString(),
                localStorage: {},
                sessionStorage: {}
            };

            // Capture localStorage data
            try {
                const eventTypeData = localStorage.getItem('eventTypeSelection');
                const formData = localStorage.getItem('eventProposalFormData');

                newDebugData.localStorage = {
                    eventTypeSelection: eventTypeData ? JSON.parse(eventTypeData) : null,
                    eventProposalFormData: formData ? JSON.parse(formData) : null,
                    selectedEventType: localStorage.getItem('selectedEventType')
                };
            } catch (error) {
                newDebugData.localStorage = { error: error.message };
            }

            // Capture sessionStorage data
            try {
                newDebugData.sessionStorage = {
                    currentStep: sessionStorage.getItem('currentStep'),
                    lastUpdated: sessionStorage.getItem('lastUpdated')
                };
            } catch (error) {
                newDebugData.sessionStorage = { error: error.message };
            }

            setDebugData(newDebugData);
        };

        updateDebugData();

        // Update every 2 seconds for real-time monitoring
        const interval = setInterval(updateDebugData, 2000);
        return () => clearInterval(interval);
    }, [proposalUuid, currentStep, currentStepIndex]);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <div className="mb-4">
                <h3 className="text-green-300 font-semibold mb-2">🔍 Data Flow Tracker</h3>
                <div className="space-y-1">
                    <div>UUID: <span className="text-yellow-400">{debugData.proposalUuid || 'N/A'}</span></div>
                    <div>Step: <span className="text-blue-400">{debugData.currentStep} ({debugData.currentStepIndex + 1})</span></div>
                    <div>Time: <span className="text-gray-400">{debugData.timestamp}</span></div>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-green-300 font-semibold mb-2">📦 localStorage</h4>
                <div className="bg-black bg-opacity-50 p-2 rounded">
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugData.localStorage, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-green-300 font-semibold mb-2">💾 sessionStorage</h4>
                <div className="bg-black bg-opacity-50 p-2 rounded">
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugData.sessionStorage, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="text-xs text-gray-500">
                Auto-refresh every 2s • Development only
            </div>
        </div>
    );
}



