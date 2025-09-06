/**
 * StepRenderer Component
 * 
 * Purpose: Dynamically renders step content based on current step index
 * Approach: Conditional rendering of step-specific components and forms
 * Coverage: All step types (overview, event-type, organization, school-event, community-event, reporting)
 * 
 * Key Features:
 * - Dynamic step content rendering
 * - Step-specific form components
 * - Progress tracking integration
 * - Error handling for invalid steps
 */

'use client';

import { useParams, usePathname } from 'next/navigation';
import { STEPS } from '../utils';

export default function StepRenderer({ currentStepIndex = 0 }) {
    const params = useParams();
    const pathname = usePathname();
    const draftId = params?.draftId;

    // Validate step index
    if (currentStepIndex < 0 || currentStepIndex >= STEPS.length) {
        return (
            <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-semibold mb-2">Invalid Step</h3>
                    <p className="text-red-600 text-sm">
                        Step {currentStepIndex + 1} is not available. Please navigate to a valid step.
                    </p>
                </div>
            </div>
        );
    }

    const currentStep = STEPS[currentStepIndex];

    // Render step-specific content
    const renderStepContent = () => {
        switch (currentStepIndex) {
            case 0: // Overview
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Event Proposal Overview
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Welcome to the event proposal submission process. This step will guide you through
                                creating a comprehensive event proposal for your academic or community event.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-blue-800 font-semibold mb-2">What you'll need:</h3>
                            <ul className="text-blue-700 text-sm space-y-1">
                                <li>• Event details and purpose</li>
                                <li>• Organization information</li>
                                <li>• Event type selection (school-based or community-based)</li>
                                <li>• Venue and scheduling details</li>
                                <li>• Supporting documents (if required)</li>
                            </ul>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => window.location.href = `/student-dashboard/submit-event/${draftId}/event-type`}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Start Proposal
                            </button>
                        </div>
                    </div>
                );

            case 1: // Event Type
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Select Event Type
                            </h2>
                            <p className="text-gray-600">
                                Choose the type of event you're proposing. This will determine the specific
                                requirements and forms you'll need to complete.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">School-Based Event</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Academic events, workshops, seminars, or educational activities organized
                                    within the school context.
                                </p>
                                <button
                                    onClick={() => window.location.href = `/student-dashboard/submit-event/${draftId}/organization`}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Select School-Based
                                </button>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community-Based Event</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Community service, outreach programs, or events that benefit the wider
                                    community beyond the school.
                                </p>
                                <button
                                    onClick={() => window.location.href = `/student-dashboard/submit-event/${draftId}/organization`}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Select Community-Based
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 2: // Organization
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Organization Information
                            </h2>
                            <p className="text-gray-600">
                                Provide details about your organization and contact information.
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 text-sm">
                                <strong>Note:</strong> This step will be automatically populated based on your
                                user profile. You can review and update the information as needed.
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => window.location.href = `/student-dashboard/submit-event/${draftId}/school-event`}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Continue to Event Details
                            </button>
                        </div>
                    </div>
                );

            case 3: // School Event or Community Event
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Event Details
                            </h2>
                            <p className="text-gray-600">
                                Provide comprehensive details about your event, including venue, scheduling,
                                and target audience information.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 text-sm">
                                <strong>Tip:</strong> Be as detailed as possible to help reviewers understand
                                your event's purpose and requirements.
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => window.location.href = `/student-dashboard/submit-event/${draftId}/reporting`}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Continue to Reporting
                            </button>
                        </div>
                    </div>
                );

            case 4: // Reporting
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Reporting & Submission
                            </h2>
                            <p className="text-gray-600">
                                Review your proposal and submit it for approval. You can also upload
                                supporting documents if required.
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 text-sm">
                                <strong>Almost done!</strong> Review your proposal carefully before submission.
                                You can still make changes before final submission.
                            </p>
                        </div>

                        <div className="text-center space-x-4">
                            <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                Save Draft
                            </button>
                            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                Submit Proposal
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-gray-800 font-semibold mb-2">Step Not Available</h3>
                            <p className="text-gray-600 text-sm">
                                This step is not yet implemented or is not available.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Step header */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {currentStep?.name || 'Step'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Step {currentStepIndex + 1} of {STEPS.length}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="text-sm font-medium text-gray-900">
                            {Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Step content */}
            {renderStepContent()}
        </div>
    );
}
