/**
 * Status Verification Panel
 * Helps users understand if their proposal status is correct
 */

"use client";

import { useState } from 'react';

export function StatusVerificationPanel({ proposalStatus, mysqlId, userRole }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return {
                    color: 'yellow',
                    icon: '⏳',
                    title: 'Proposal Under Review',
                    description: 'Your proposal is waiting for administrator approval.',
                    nextSteps: [
                        'Wait for administrator review',
                        'Check back periodically for updates',
                        'Contact admin if urgent'
                    ],
                    isCorrect: true
                };
            case 'approved':
                return {
                    color: 'green',
                    icon: '✅',
                    title: 'Proposal Approved',
                    description: 'Your proposal has been approved! You can now proceed with reporting.',
                    nextSteps: [
                        'Submit accomplishment report',
                        'Upload required documents',
                        'Complete final requirements'
                    ],
                    isCorrect: true
                };
            case 'denied':
                return {
                    color: 'red',
                    icon: '❌',
                    title: 'Proposal Denied',
                    description: 'Your proposal was not approved.',
                    nextSteps: [
                        'Review admin feedback',
                        'Make necessary changes',
                        'Resubmit if possible'
                    ],
                    isCorrect: true
                };
            case 'revision_requested':
                return {
                    color: 'orange',
                    icon: '📝',
                    title: 'Revisions Requested',
                    description: 'Administrator has requested changes to your proposal.',
                    nextSteps: [
                        'Review admin comments',
                        'Make requested changes',
                        'Resubmit proposal'
                    ],
                    isCorrect: true
                };
            default:
                return {
                    color: 'gray',
                    icon: '❓',
                    title: 'Unknown Status',
                    description: 'The proposal status is unclear.',
                    nextSteps: [
                        'Contact administrator',
                        'Check system status'
                    ],
                    isCorrect: false
                };
        }
    };

    const statusInfo = getStatusInfo(proposalStatus);

    return (
        <div className="bg-white border rounded-lg p-4 mb-6">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <span className="text-2xl mr-3">{statusInfo.icon}</span>
                    <div>
                        <h3 className="font-semibold text-gray-900">{statusInfo.title}</h3>
                        <p className="text-sm text-gray-600">Status: {proposalStatus || 'Unknown'}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    {statusInfo.isCorrect && (
                        <span className="text-green-600 text-sm mr-2">✅ Status is correct</span>
                    )}
                    <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t">
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">What this means:</h4>
                        <p className="text-gray-700 text-sm">{statusInfo.description}</p>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Next steps:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {statusInfo.nextSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gray-50 rounded p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Technical Details:</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div>Proposal ID: {mysqlId || 'Not available'}</div>
                            <div>User Role: {userRole || 'Not available'}</div>
                            <div>Status Source: MySQL Database</div>
                            <div>Last Checked: {new Date().toLocaleString()}</div>
                        </div>
                    </div>

                    {proposalStatus === 'pending' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h5 className="font-medium text-blue-900 mb-1">Why is my status "Pending"?</h5>
                                    <p className="text-sm text-blue-700">
                                        Your proposal is in the review queue. This is normal and expected.
                                        Administrators need to review and approve proposals before you can proceed to the reporting phase.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

