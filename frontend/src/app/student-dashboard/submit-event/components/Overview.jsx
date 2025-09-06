/**
 * Overview Landing Page — Event Submission Hub
 * 
 * 🎯 Purpose:
 * - Clear separation of two distinct user paths
 * - Primary path: Create New Event Proposal (pre-event planning)
 * - Secondary path: Submit Post-Event Report (post-event documentation)
 * - Visual hierarchy guides users to the correct action
 * - Prevents confusion between planning and reporting processes
 * 
 * 🖥️ User Experience Goals:
 * - Clarity: Clear visual distinction between the two paths
 * - Guidance: Prominent primary action for new event proposals
 * - Flow: Intuitive navigation to appropriate forms
 * - Consistency: Maintains design system and user expectations
 */

"use client";

import {
    CheckCircle,
    FileText,
    Lightbulb,
    Plus,
    Target
} from 'lucide-react';
import { useState } from 'react';

export default function Overview({ onPathSelect }) {
    const [selectedPath, setSelectedPath] = useState(null);

    const handlePathSelect = (path) => {
        setSelectedPath(path);
        if (onPathSelect) {
            onPathSelect(path);
        }
    };

    const handleEventProposalClick = () => {
        // Redirect to Organization.jsx (Step 2 of the event proposal flow)
        handlePathSelect('organization');
    };

    const handlePostEventReportClick = () => {
        // Redirect to PostEventReport component
        handlePathSelect('post-event-report');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6">
                    <Target className="h-10 w-10 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Event Submission Hub</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Choose the appropriate path based on your event status. Are you planning a new event or reporting on a completed one?
                </p>
            </div>

            {/* Path Selection Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Primary Path: Create New Event Proposal */}
                <div className="relative">
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
                        {/* Primary Badge */}
                        <div className="absolute -top-3 left-6">
                            <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                Pre-Event
                            </span>
                        </div>

                        {/* Icon and Header */}
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                                <Plus className="h-8 w-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Event Proposal</h2>
                            <p className="text-gray-600">Plan and submit a new event for approval</p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Event details and logistics planning</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Venue and date coordination</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Target audience and SDP credits</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Required documentation upload</span>
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            onClick={handleEventProposalClick}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Start Event Proposal</span>
                        </button>

                        {/* Help Text */}
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Use this for events that haven't happened yet
                        </p>
                    </div>
                </div>

                {/* Secondary Path: Submit Post-Event Report */}
                <div className="relative">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-300">
                        {/* Secondary Badge */}
                        <div className="absolute -top-3 left-6">
                            <span className="bg-gray-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                Post-Event
                            </span>
                        </div>

                        {/* Icon and Header */}
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                                <FileText className="h-8 w-8 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Post-Event Report</h2>
                            <p className="text-gray-600">Document and report on a completed event</p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Attendance and participation reports</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Event photos and documentation</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Accomplishment summaries</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Final reports and receipts</span>
                            </div>
                        </div>

                        {/* Secondary Action Button */}
                        <button
                            onClick={handlePostEventReportClick}
                            className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            <FileText className="h-5 w-5" />
                            <span>Submit Report</span>
                        </button>

                        {/* Help Text */}
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Use this for events that have already occurred
                        </p>
                    </div>
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
                <div className="flex items-start space-x-3">
                    <Lightbulb className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Need Help Choosing?</h3>
                        <div className="text-sm text-blue-800 space-y-2">
                            <p>
                                <strong>Create New Event Proposal:</strong> Choose this if you're planning a future event and need approval before it happens.
                                You'll provide event details, venue information, and required documentation.
                            </p>
                            <p>
                                <strong>Submit Post-Event Report:</strong> Choose this if your event has already taken place and you need to submit
                                attendance reports, photos, and accomplishment documentation for credit.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
