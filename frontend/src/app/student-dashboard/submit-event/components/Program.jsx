/**
 * Event Review & Confirmation Component
 * Section 4 - Review and confirm all event information before submission
 * 
 * This step allows users to review all entered information and make final adjustments
 */

"use client";

import {
    AlertCircle,
    Calendar,
    CheckCircle,
    FileText,
    MapPin
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useEventForm } from '../contexts/EventFormContext';

export default function StepProgram({ methods, onNext, onPrevious, isLastStep }) {
    const { watch } = useFormContext();
    const { eventUuid, getShortUuid, getFormAge } = useEventForm();
    const watchedValues = watch();

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get event type label
    const getEventTypeLabel = (value) => {
        const types = {
            'academic-enhancement': 'Academic Enhancement',
            'seminar-webinar': 'Seminar/Webinar',
            'general-assembly': 'General Assembly',
            'leadership-training': 'Leadership Training',
            'others': 'Others'
        };
        return types[value] || value;
    };

    // Get target audience label
    const getTargetAudienceLabel = (value) => {
        const audiences = {
            '1st-year': '1st Year',
            '2nd-year': '2nd Year',
            '3rd-year': '3rd Year',
            '4th-year': '4th Year',
            'all-levels': 'All Levels',
            'leaders': 'Leaders',
            'alumni': 'Alumni'
        };
        return audiences[value] || value;
    };

    const isStepValid = () => {
        return watchedValues.eventName &&
            watchedValues.venue &&
            watchedValues.startDate &&
            watchedValues.endDate &&
            watchedValues.eventType &&
            watchedValues.targetAudience &&
            watchedValues.sdpCredits &&
            watchedValues.gpoaFile &&
            watchedValues.projectProposalFile;
    };

    return (
        <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
                <p className="text-gray-600">Review all event information before submission</p>

                {/* UUID Display */}
                {eventUuid && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Event ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">{getShortUuid()}</code>
                            <span className="ml-2 text-blue-600">• Created {getFormAge()}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Review Content */}
            <div className="space-y-6">
                {/* Event Overview */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Event Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Event/Activity Name</label>
                            <p className="text-gray-900 font-medium">{watchedValues.eventName || 'Not specified'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Type of Event</label>
                            <p className="text-gray-900 font-medium">{getEventTypeLabel(watchedValues.eventType)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Target Audience</label>
                            <p className="text-gray-900 font-medium">{getTargetAudienceLabel(watchedValues.targetAudience)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">SDP Credits</label>
                            <p className="text-gray-900 font-medium">{watchedValues.sdpCredits || 'Not specified'}</p>
                        </div>
                    </div>
                </div>

                {/* Event Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Event Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Venue</label>
                            <p className="text-gray-900 font-medium">{watchedValues.venue || 'Not specified'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Start Date</label>
                            <p className="text-gray-900 font-medium">{formatDate(watchedValues.startDate)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">End Date</label>
                            <p className="text-gray-900 font-medium">{formatDate(watchedValues.endDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Attached Documents */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Attached Documents
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">General Plans of Action (GPOA)</p>
                                    <p className="text-xs text-gray-500">
                                        {watchedValues.gpoaFile ?
                                            `${watchedValues.gpoaFile.name} (${formatFileSize(watchedValues.gpoaFile.size)})` :
                                            'No file uploaded'
                                        }
                                    </p>
                                </div>
                            </div>
                            {watchedValues.gpoaFile && (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span className="text-sm">Uploaded</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Project Proposal</p>
                                    <p className="text-xs text-gray-500">
                                        {watchedValues.projectProposalFile ?
                                            `${watchedValues.projectProposalFile.name} (${formatFileSize(watchedValues.projectProposalFile.size)})` :
                                            'No file uploaded'
                                        }
                                    </p>
                                </div>
                            </div>
                            {watchedValues.projectProposalFile && (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span className="text-sm">Uploaded</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirmation Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-2">Ready to Submit</h4>
                            <p className="text-sm text-blue-800">
                                Please review all information above carefully. Once submitted, your event application will be sent for review.
                                You will receive a confirmation email and can track the status of your application.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Validation Status */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {isStepValid() ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        )}
                        <div>
                            <h4 className="font-medium text-gray-900">Review Complete</h4>
                            <p className="text-sm text-gray-600">
                                {isStepValid()
                                    ? "All information is complete and ready for submission."
                                    : "Please complete all required fields in previous steps."
                                }
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isStepValid()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isStepValid() ? 'Ready to Submit' : 'Incomplete'}
                    </div>
                </div>
            </div>
        </div>
    );
}
