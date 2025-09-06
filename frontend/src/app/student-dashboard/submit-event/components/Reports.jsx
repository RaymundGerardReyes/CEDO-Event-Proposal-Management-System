/**
 * Documentation and Accomplishment Reports Component
 * Post-Event Documentation and Accomplishment Reports Form
 * 
 * 🎯 Purpose:
 * - Capture comprehensive post-event documentation
 * - Upload accomplishment reports and supporting materials
 * - Provide structured data collection for event completion
 * 
 * 🖥️ User Experience Goals:
 * - Clear organization of documentation requirements
 * - Easy file upload and management
 * - Comprehensive reporting structure
 * - Visual feedback for completion status
 */

"use client";

import {
    AlertCircle,
    Building2,
    CheckCircle,
    FileText,
    Image,
    Mail,
    Phone,
    Upload,
    Users,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

const ORGANIZATION_TYPES = [
    { value: 'school-based', label: 'School-based' },
    { value: 'community-based', label: 'Community-based' }
];

export default function Reports({ methods, onNext, onPrevious, isLastStep, onReportsSubmitted }) {
    const { register, formState: { errors }, watch, setValue } = useFormContext();
    const [uploadedFiles, setUploadedFiles] = useState({
        accomplishmentReport: [],
        eventPhotos: [],
        attendanceSheet: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const watchedValues = watch();

    // File upload handlers
    const handleFileUpload = (category, event) => {
        const files = Array.from(event.target.files);
        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            uploadDate: new Date().toISOString()
        }));

        setUploadedFiles(prev => ({
            ...prev,
            [category]: [...prev[category], ...newFiles]
        }));
    };

    const removeFile = (category, fileId) => {
        setUploadedFiles(prev => ({
            ...prev,
            [category]: prev[category].filter(file => file.id !== fileId)
        }));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isStepValid = () => {
        return watchedValues.organizationName &&
            watchedValues.eventName &&
            watchedValues.venue &&
            watchedValues.startDate &&
            watchedValues.startTime &&
            watchedValues.endDate &&
            watchedValues.endTime &&
            watchedValues.registeredParticipants &&
            watchedValues.actualParticipants &&
            watchedValues.organizationType &&
            uploadedFiles.accomplishmentReport.length > 0 &&
            uploadedFiles.eventPhotos.length > 0 &&
            uploadedFiles.attendanceSheet.length > 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!isStepValid()) {
            alert('Please complete all required fields and upload all required documents before submitting.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API submission
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mark as submitted
            setIsSubmitted(true);

            // Notify parent component that reports have been submitted
            if (onReportsSubmitted) {
                onReportsSubmitted(true);
            }

            // In a real app, you would send the data to your API here
            console.log('Report submitted successfully:', {
                ...watchedValues,
                uploadedFiles
            });

        } catch (error) {
            console.error('Submission failed:', error);
            alert('Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show success message if submitted
    if (isSubmitted) {
        return (
            <div className="space-y-8">
                {/* Success Message */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full mr-4">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Submission Successful!</h1>
                                <p className="text-green-100 mt-1">Your documentation has been received</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Thank you for submitting your Documentation and Accomplishment Reports
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Your submission has been successfully received and is now under review.
                            </p>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                What happens next?
                            </h3>
                            <div className="space-y-3 text-blue-800">
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>
                                        <strong>Review Process:</strong> The CEDO (Community Engagement and Development Office) will review your event accomplishment form within <strong>3 to 5 business days</strong> to validate the credits as SDP (Service Development Program).
                                    </p>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>
                                        <strong>Credit Validation:</strong> Your SDP credits will be verified and approved based on the documentation provided and event outcomes.
                                    </p>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>
                                        <strong>Notification:</strong> You will receive an email notification once the review is complete with the final credit approval status.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Phone className="h-5 w-5 mr-2" />
                                Need Help?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                                <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>Email: cedo@university.edu</span>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>Phone: (555) 123-4567</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-3">
                                If you have any questions about your submission or the review process, please don't hesitate to contact us.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setIsSubmitted(false);
                                    // Notify parent component that reports submission is reset
                                    if (onReportsSubmitted) {
                                        onReportsSubmitted(false);
                                    }
                                }}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Submit Another Report
                            </button>
                            <button
                                onClick={() => window.location.href = '/student-dashboard'}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6">
                    <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Documentation and Accomplishment Reports</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Complete the post-event documentation and upload required reports and materials
                </p>
            </div>

            {/* 1. Core Event Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Building2 className="h-6 w-6 mr-2" />
                    1. Core Event Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Organization Name */}
                    <div className="space-y-2">
                        <label htmlFor="organizationName" className="block text-sm font-semibold text-gray-700">
                            Name of Organization (Do not abbreviate) *
                        </label>
                        <input
                            id="organizationName"
                            type="text"
                            {...register('organizationName')}
                            placeholder="Enter full organization name"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.organizationName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.organizationName && (
                            <div className="flex items-center text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.organizationName.message}
                            </div>
                        )}
                    </div>

                    {/* Event Name */}
                    <div className="space-y-2">
                        <label htmlFor="eventName" className="block text-sm font-semibold text-gray-700">
                            Name of Event/Activity Implemented *
                        </label>
                        <input
                            id="eventName"
                            type="text"
                            {...register('eventName')}
                            placeholder="Enter event/activity name"
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

                    {/* Venue */}
                    <div className="space-y-2">
                        <label htmlFor="venue" className="block text-sm font-semibold text-gray-700">
                            Venue *
                        </label>
                        <input
                            id="venue"
                            type="text"
                            {...register('venue')}
                            placeholder="Enter venue or platform"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.venue ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.venue && (
                            <div className="flex items-center text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.venue.message}
                            </div>
                        )}
                    </div>

                    {/* Start Date & Time */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Start Date & Time *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="date"
                                    {...register('startDate')}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            <div>
                                <input
                                    type="time"
                                    {...register('startTime')}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.startTime ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* End Date & Time */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            End Date & Time *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="date"
                                    {...register('endDate')}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            <div>
                                <input
                                    type="time"
                                    {...register('endTime')}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endTime ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Participant Data */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Users className="h-6 w-6 mr-2" />
                    2. Participant Data
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registered Participants */}
                    <div className="space-y-2">
                        <label htmlFor="registeredParticipants" className="block text-sm font-semibold text-gray-700">
                            Total Number of Registered Participants *
                        </label>
                        <input
                            id="registeredParticipants"
                            type="number"
                            {...register('registeredParticipants', { valueAsNumber: true })}
                            placeholder="Enter number of registered participants"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.registeredParticipants ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.registeredParticipants && (
                            <div className="flex items-center text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.registeredParticipants.message}
                            </div>
                        )}
                    </div>

                    {/* Actual Participants */}
                    <div className="space-y-2">
                        <label htmlFor="actualParticipants" className="block text-sm font-semibold text-gray-700">
                            Total Number of Actual Participants *
                        </label>
                        <input
                            id="actualParticipants"
                            type="number"
                            {...register('actualParticipants', { valueAsNumber: true })}
                            placeholder="Enter number of actual participants"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.actualParticipants ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.actualParticipants && (
                            <div className="flex items-center text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.actualParticipants.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Report Contents and File Uploads */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="h-6 w-6 mr-2" />
                    3. Report Contents and File Uploads
                </h2>

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        rows={4}
                        {...register('description')}
                        placeholder="Provide a summary of the event's outcomes and accomplishments..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>



                {/* Accomplishment Report Upload */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Attach Documentation and Accomplishment Reports *</h3>
                    <p className="text-sm text-gray-600">
                        Must be in PDF or DOCS file format
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                        File Name Format: OrganizationName_AR
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600 mb-2">
                                Upload Documentation and Accomplishment Reports (PDF, DOC, DOCX)
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileUpload('accomplishmentReport', e)}
                                className="hidden"
                                id="accomplishment-upload"
                            />
                            <label
                                htmlFor="accomplishment-upload"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add file
                            </label>
                        </div>
                    </div>

                    {uploadedFiles.accomplishmentReport.length > 0 && (
                        <div className="space-y-2">
                            {uploadedFiles.accomplishmentReport.map((file) => (
                                <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile('accomplishmentReport', file.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Event Photos Upload */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Photo Documentation of the Event</h3>
                    <p className="text-sm text-gray-600">
                        Upload a maximum of 5 clear photos of the event in action (e.g., speakers, attendees, activities).
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                        Acceptable formats: .jpg, .png
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600 mb-2">
                                Upload Event Photos (JPG, PNG)
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload('eventPhotos', e)}
                                className="hidden"
                                id="photos-upload"
                            />
                            <label
                                htmlFor="photos-upload"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add file
                            </label>
                        </div>
                    </div>

                    {uploadedFiles.eventPhotos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {uploadedFiles.eventPhotos.map((file) => (
                                <div key={file.id} className="relative bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Image className="h-4 w-4 text-gray-400" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile('eventPhotos', file.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Attendance Sheet Upload */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Photo of Handwritten Attendance Sheet</h3>
                    <p className="text-sm text-gray-600">
                        Please upload a clear picture or scan of the official handwritten attendance sheet.
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                        Acceptable formats: .jpg, .png, .pdf
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600 mb-2">
                                Upload Attendance Sheet (JPG, PNG, PDF)
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileUpload('attendanceSheet', e)}
                                className="hidden"
                                id="attendance-upload"
                            />
                            <label
                                htmlFor="attendance-upload"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add file
                            </label>
                        </div>
                    </div>

                    {uploadedFiles.attendanceSheet.length > 0 && (
                        <div className="space-y-2">
                            {uploadedFiles.attendanceSheet.map((file) => (
                                <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile('attendanceSheet', file.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Completion Status and Submit Button */}
            <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        {isStepValid() ? (
                            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                        ) : (
                            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                        )}
                        <div>
                            <h4 className="font-semibold text-gray-900">Report Completion Status</h4>
                            <p className="text-sm text-gray-600">
                                {isStepValid()
                                    ? "All required documentation has been provided. Ready to submit."
                                    : "Complete all required fields and upload required documents."
                                }
                            </p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${isStepValid()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isStepValid() ? 'Complete' : 'Incomplete'}
                    </div>
                </div>

                {/* Submit Button */}
                {isStepValid() && (
                    <div className="text-center">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center mx-auto ${isSubmitting
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-6 w-6 mr-3" />
                                    Submit Documentation & Accomplishment Reports
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-500 mt-3">
                            By submitting, you confirm that all information provided is accurate and complete.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
