/**
 * ProposalFlow Component
 * Main wrapper for UUID-based proposal submission flow
 * 
 * Key approaches: UUID management, localStorage integration,
 * comprehensive error handling, and child component coordination
 */

'use client';

import { useParams } from 'next/navigation';
import DraftShell from './components/DraftShell';
import DataFlowTracker from './debug/DataFlowTracker';
import { useProposalFlow } from './hooks/useProposalFlow';

export default function ProposalFlow() {
    const params = useParams();
    const draftId = params.draftId;

    const {
        proposalUuid,
        proposalData,
        loading,
        error,
        initializeProposal,
        handleProposalUpdate
    } = useProposalFlow(draftId);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing proposal...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <h3 className="text-red-800 font-semibold mb-2">Error Initializing Proposal</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={initializeProposal}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Main content
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with UUID display */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Event Proposal Submission
                            </h1>
                            <p className="text-gray-600 mt-1">
                                UUID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {proposalUuid}
                                </span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-sm font-medium text-gray-900">
                                {proposalData?.status || 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main form area */}
                    <div className="lg:col-span-2">
                        <DraftShell
                            proposalUuid={proposalUuid}
                            onProposalUpdate={handleProposalUpdate}
                        />
                    </div>

                    {/* Debug panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <DataFlowTracker
                                proposalUuid={proposalUuid}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs">
                    <div>UUID: {proposalUuid}</div>
                    <div>Status: {proposalData?.status}</div>
                    <div>Section: {proposalData?.section}</div>
                </div>
            )}
        </div>
    );
}
