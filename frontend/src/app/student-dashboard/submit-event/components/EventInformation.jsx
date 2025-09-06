/**
 * Event Information Form Component
 * Section 3 - Event Information with precise form structure
 * 
 * Form Fields:
 * - Event/Activity Name* (Short answer text)
 * - Venue (Platform or Address)* (Short answer text)
 * - Start Date* (Month, day, year)
 * - End Date* (Month, day, year)
 * - Type of Event* (Academic Enhancement, Seminar/Webinar, General Assembly, Leadership Training, Others)
 * - Target Audience* (1st Year, 2nd Year, 3rd Year, 4th Year, All Levels, Leaders, Alumni)
 * - Number of SDP Credits* (1, 2)
 * - Attach General Plans of Action (GPOA)* (File upload with specific naming)
 * - Attach Project Proposal* (File upload with specific naming)
 */

"use client";

import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    Upload,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

const EVENT_TYPES = [
    { value: 'academic-enhancement', label: 'Academic Enhancement' },
    { value: 'seminar-webinar', label: 'Seminar/Webinar' },
    { value: 'general-assembly', label: 'General Assembly' },
    { value: 'leadership-training', label: 'Leadership Training' },
    { value: 'others', label: 'Others' }
];

const TARGET_AUDIENCES = [
    { value: '1st-year', label: '1st Year' },
    { value: '2nd-year', label: '2nd Year' },
    { value: '3rd-year', label: '3rd Year' },
    { value: '4th-year', label: '4th Year' },
    { value: 'all-levels', label: 'All Levels' },
    { value: 'leaders', label: 'Leaders' },
    { value: 'alumni', label: 'Alumni' }
];

const SDP_CREDITS = [
    { value: 1, label: '1' },
    { value: 2, label: '2' }
];

export default function StepLogistics({ methods, onNext, onPrevious, isLastStep }) {
    const { register, formState: { errors }, watch, setValue, trigger } = useFormContext();
    const [gpoaFile, setGpoaFile] = useState(null);
    const [projectProposalFile, setProjectProposalFile] = useState(null);
    const [selectedTargetAudiences, setSelectedTargetAudiences] = useState([]);

    const watchedValues = watch();

    // Handle target audience selection
    const handleTargetAudienceToggle = (audienceValue) => {
        const newSelection = selectedTargetAudiences.includes(audienceValue)
            ? selectedTargetAudiences.filter(aud => aud !== audienceValue)
            : [...selectedTargetAudiences, audienceValue];

        setSelectedTargetAudiences(newSelection);
        setValue('targetAudience', newSelection);
    };

    // Handle GPOA file upload
    const handleGpoaUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setGpoaFile(file);
            setValue('gpoaFile', file);
        }
    };

    // Handle Project Proposal file upload
    const handleProjectProposalUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProjectProposalFile(file);
            setValue('projectProposalFile', file);
        }
    };

    // Remove uploaded files
    const removeGpoaFile = () => {
        setGpoaFile(null);
        setValue('gpoaFile', null);
    };

    const removeProjectProposalFile = () => {
        setProjectProposalFile(null);
        setValue('projectProposalFile', null);
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Date validation
    const validateDates = () => {
        const startDate = watchedValues.startDate;
        const endDate = watchedValues.endDate;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const now = new Date();

            if (start < now) {
                return 'Start date cannot be in the past';
            }
            if (end <= start) {
                return 'End date must be after start date';
            }
        }
        return null;
    };

    const dateError = validateDates();

    const isStepValid = () => {
        return watchedValues.eventName &&
            watchedValues.venue &&
            watchedValues.startDate &&
            watchedValues.endDate &&
            watchedValues.startTime &&
            watchedValues.endTime &&
            watchedValues.eventType &&
            selectedTargetAudiences.length > 0 &&
            watchedValues.sdpCredits &&
            gpoaFile &&
            projectProposalFile &&
            !dateError;
    };

    return (
        <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Information</h2>
                <p className="text-gray-600">Provide event details and required documentation</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                {/* Event/Activity Name */}
                <div className="space-y-2">
                    <label htmlFor="eventName" className="block text-sm font-semibold text-gray-700">
                        Event/Activity Name *
                    </label>
                    <input
                        id="eventName"
                        type="text"
                        {...register('eventName')}
                        placeholder="Enter the name of your event or activity"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.eventName ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.eventName && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.eventName.message}
                        </div>
                    )}
                </div>

                {/* Venue (Platform or Address) */}
                <div className="space-y-2">
                    <label htmlFor="venue" className="block text-sm font-semibold text-gray-700">
                        Venue (Platform or Address) *
                    </label>
                    <div className="relative">
                        <input
                            id="venue"
                            type="text"
                            {...register('venue')}
                            placeholder="Enter venue name, platform, or full address"
                            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.venue ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.venue && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.venue.message}
                        </div>
                    )}
                </div>

                {/* Date and Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date and Time */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700">
                                Start Date *
                            </label>
                            <div className="relative">
                                <input
                                    id="startDate"
                                    type="date"
                                    {...register('startDate')}
                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.startDate || dateError ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            </div>
                            {errors.startDate && (
                                <div className="flex items-center text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.startDate.message}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700">
                                Start Time *
                            </label>
                            <div className="relative">
                                <input
                                    id="startTime"
                                    type="time"
                                    {...register('startTime')}
                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.startTime ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            </div>
                            {errors.startTime && (
                                <div className="flex items-center text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.startTime.message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* End Date and Time */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700">
                                End Date *
                            </label>
                            <div className="relative">
                                <input
                                    id="endDate"
                                    type="date"
                                    {...register('endDate')}
                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endDate || dateError ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            </div>
                            {errors.endDate && (
                                <div className="flex items-center text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.endDate.message}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700">
                                End Time *
                            </label>
                            <div className="relative">
                                <input
                                    id="endTime"
                                    type="time"
                                    {...register('endTime')}
                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endTime ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            </div>
                            {errors.endTime && (
                                <div className="flex items-center text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.endTime.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {dateError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <p className="text-red-800">{dateError}</p>
                        </div>
                    </div>
                )}

                {/* Type of Event */}
                <div className="space-y-2">
                    <label htmlFor="eventType" className="block text-sm font-semibold text-gray-700">
                        Type of Event *
                    </label>
                    <select
                        id="eventType"
                        {...register('eventType')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.eventType ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select event type</option>
                        {EVENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.eventType && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.eventType.message}
                        </div>
                    )}
                </div>

                {/* Target Audience */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Target Audience *
                    </label>
                    <p className="text-sm text-gray-500">Select all applicable audience types</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {TARGET_AUDIENCES.map((audience) => (
                            <label
                                key={audience.value}
                                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTargetAudiences.includes(audience.value)}
                                    onChange={() => handleTargetAudienceToggle(audience.value)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-900">{audience.label}</span>
                            </label>
                        ))}
                    </div>

                    {selectedTargetAudiences.length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2">Selected audiences:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedTargetAudiences.map((audience) => (
                                    <span
                                        key={audience}
                                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                    >
                                        {TARGET_AUDIENCES.find(a => a.value === audience)?.label}
                                        <button
                                            type="button"
                                            onClick={() => handleTargetAudienceToggle(audience)}
                                            className="ml-2 hover:text-blue-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {errors.targetAudience && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.targetAudience.message}
                        </div>
                    )}
                </div>

                {/* Number of SDP Credits */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Number of SDP Credits *
                    </label>
                    <p className="text-sm text-gray-500">Select the number of SDP credits for this event</p>

                    <div className="flex space-x-3">
                        {SDP_CREDITS.map((credit) => (
                            <button
                                key={credit.value}
                                type="button"
                                onClick={() => setValue('sdpCredits', credit.value)}
                                className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-all duration-200 ${watchedValues.sdpCredits === credit.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{credit.label}</div>
                                    <div className="text-sm opacity-75">Credit{credit.value > 1 ? 's' : ''}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {watchedValues.sdpCredits && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                                <span className="text-sm text-blue-800">
                                    Selected: <strong>{watchedValues.sdpCredits} SDP Credit{watchedValues.sdpCredits > 1 ? 's' : ''}</strong>
                                </span>
                            </div>
                        </div>
                    )}

                    {errors.sdpCredits && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.sdpCredits.message}
                        </div>
                    )}
                </div>

                {/* Attach General Plans of Action (GPOA) */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                        Attach General Plans of Action (GPOA) *
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                        File name format: OrganizationName_GPOA
                    </p>

                    {!gpoaFile ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-600 mb-2">
                                    Upload GPOA document (PDF, DOC, DOCX)
                                </p>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleGpoaUpload}
                                    className="hidden"
                                    id="gpoa-upload"
                                />
                                <label
                                    htmlFor="gpoa-upload"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add file
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{gpoaFile.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(gpoaFile.size)}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeGpoaFile}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Attach Project Proposal */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                        Attach Project Proposal *
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                        File name format: OrganizationName_PP<br />
                        Must contain: summary of project, objectives, goals, timeline, detailed program flow, and budget
                    </p>

                    {!projectProposalFile ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-600 mb-2">
                                    Upload Project Proposal document (PDF, DOC, DOCX)
                                </p>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleProjectProposalUpload}
                                    className="hidden"
                                    id="project-proposal-upload"
                                />
                                <label
                                    htmlFor="project-proposal-upload"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add file
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{projectProposalFile.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(projectProposalFile.size)}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeProjectProposalFile}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
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
                            <h4 className="font-medium text-gray-900">Event Information Complete</h4>
                            <p className="text-sm text-gray-600">
                                {isStepValid()
                                    ? "All required information and documents have been provided."
                                    : "Complete all required fields and upload required documents."
                                }
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isStepValid()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isStepValid() ? 'Complete' : 'Incomplete'}
                    </div>
                </div>
            </div>
        </div>
    );
}
