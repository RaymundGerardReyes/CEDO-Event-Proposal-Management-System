"use client"
import { useEffect, useState } from 'react';

export const DebugXStateStatus = ({ service, state, formData }) => {
    const [machineStatus, setMachineStatus] = useState(null);
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        if (!service) return;

        const updateStatus = () => {
            const snapshot = service.getSnapshot();
            setMachineStatus({
                status: snapshot.status,
                value: snapshot.value,
                context: snapshot.context,
                timestamp: new Date().toLocaleTimeString()
            });
        };

        // Update status immediately
        updateStatus();

        // Subscribe to state changes
        const subscription = service.subscribe((state) => {
            console.log('🔧 XState Status Update:', {
                status: state.status,
                value: state.value,
                timestamp: new Date().toLocaleTimeString()
            });
            updateStatus();
        });

        // Listen for events (if supported)
        if (service.onEvent) {
            service.onEvent((event) => {
                console.log('🔧 XState Event Received:', event);
                setLastEvent({
                    type: event.type,
                    data: event.data,
                    timestamp: new Date().toLocaleTimeString()
                });
            });
        }

        return () => {
            subscription?.unsubscribe();
        };
    }, [service]);

    if (process.env.NODE_ENV !== 'development') {
        return null; // Only show in development
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-xs max-w-sm z-50">
            <h3 className="font-bold text-sm mb-2">🔧 XState Debug</h3>

            <div className="space-y-2">
                <div>
                    <strong>Status:</strong>
                    <span className={`ml-1 px-2 py-1 rounded ${machineStatus?.status === 'running' ? 'bg-green-100 text-green-800' :
                        machineStatus?.status === 'stopped' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {machineStatus?.status || 'unknown'}
                    </span>
                </div>

                <div>
                    <strong>Current State:</strong> {machineStatus?.value || 'unknown'}
                </div>

                <div>
                    <strong>Form Section:</strong> {formData?.currentSection || 'unknown'}
                </div>

                <div>
                    <strong>Last Update:</strong> {machineStatus?.timestamp || 'never'}
                </div>

                {lastEvent && (
                    <div>
                        <strong>Last Event:</strong> {lastEvent.type} ({lastEvent.timestamp})
                    </div>
                )}

                <div>
                    <strong>Has Proposal ID:</strong> {
                        formData?.id || formData?.proposalId || formData?.organization_id ? '✅' : '❌'
                    }
                </div>

                <div>
                    <strong>Organization:</strong> {formData?.organizationName || 'none'}
                </div>
            </div>
        </div>
    );
}; 