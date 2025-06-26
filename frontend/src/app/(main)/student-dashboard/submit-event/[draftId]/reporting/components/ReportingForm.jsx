/**
 * Main Reporting Form Component
 * Combines all sub-forms and handles overall form logic
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/student/ui/alert";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle, LockIcon, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AttendanceForm from "./AttendanceForm.jsx";
import EventDetailsForm from "./EventDetailsForm.jsx";
import { ConnectionStatus, ProgressBar, StatusBadge } from "./StatusBadge.jsx";

/**
 * Main reporting form component
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onFieldChange - Field change handler
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.onPrevious - Previous button handler
 * @param {boolean} props.disabled - Whether form is disabled
 * @param {boolean} props.isSubmitting - Whether form is being submitted
 * @param {boolean} props.submitSuccess - Whether submission was successful
 * @param {Object} props.autoSaveState - Auto-save state
 * @param {string} props.proposalId - Proposal ID
 * @returns {JSX.Element} Main reporting form
 */
export const ReportingForm = ({
    formData = {},
    onFieldChange,
    onSubmit,
    onPrevious,
    disabled = false,
    isSubmitting = false,
    submitSuccess = false,
    autoSaveState = {},
    proposalId = null
}) => {
    // Local state for form validation and file handling
    const [errors, setErrors] = useState({});
    const [isValid, setIsValid] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({
        accomplishmentReport: null,
        preRegistrationList: null,
        finalAttendanceList: null
    });
    const [uploadProgress, setUploadProgress] = useState({});
    const [formProgress, setFormProgress] = useState(0);

    // Extract auto-save state
    const {
        isSaving: isAutoSaving = false,
        lastSaved = null,
        saveError = null,
        clearSaveError = () => { },
        retrySave = () => { }
    } = autoSaveState;

    /**
     * Validate the form data
     */
    const validateForm = useCallback((dataToValidate) => {
        const newErrors = {};
        let completedFields = 0;
        const totalRequiredFields = 8;

        const data = dataToValidate;

        // File validation
        if (!uploadedFiles.accomplishmentReport && !data.accomplishment_report_file_path) {
            newErrors.accomplishmentReport = "Please upload your Accomplishment Report";
        } else {
            completedFields++;
        }

        if (!uploadedFiles.preRegistrationList && !data.pre_registration_file_path) {
            newErrors.preRegistrationList = "Please upload the Pre-Registration Attendee List";
        } else {
            completedFields++;
        }

        if (!uploadedFiles.finalAttendanceList && !data.final_attendance_file_path) {
            newErrors.finalAttendanceList = "Please upload the Final Attendance List";
        } else {
            completedFields++;
        }

        // Required field validation
        if (!data.organizationName?.trim()) {
            newErrors.organizationName = "Organization name is required";
        } else {
            completedFields++;
        }

        // Event name validation (depends on organization type)
        const eventName = data.organizationTypes?.includes("school-based")
            ? data.schoolEventName
            : data.communityEventName;
        if (!eventName?.trim()) {
            newErrors.eventName = "Event name is required";
        } else {
            completedFields++;
        }

        // Event venue validation
        const eventVenue = data.event_venue ?? (
            data.organizationTypes?.includes("school-based")
                ? data.schoolVenue
                : data.communityVenue
        );
        if (!eventVenue?.trim()) {
            newErrors.eventVenue = "Event venue is required";
        } else {
            completedFields++;
        }

        // Event status validation
        if (!data.event_status?.trim()) {
            newErrors.eventStatus = "Event status is required";
        } else {
            completedFields++;
        }

        // Date validation
        const startDate = data.organizationTypes?.includes("school-based")
            ? data.schoolStartDate
            : data.communityStartDate;
        const endDate = data.organizationTypes?.includes("school-based")
            ? data.schoolEndDate
            : data.communityEndDate;

        if (!startDate || !endDate) {
            newErrors.eventDates = "Both start and end dates are required.";
        } else if (new Date(startDate) > new Date(endDate)) {
            newErrors.eventDates = "End date cannot be earlier than the start date.";
        } else {
            completedFields++;
        }

        const progress = Math.round((completedFields / totalRequiredFields) * 100);

        return {
            errors: newErrors,
            isValid: Object.keys(newErrors).length === 0,
            progress
        };
    }, [uploadedFiles]);

    /**
     * Handle file upload with progress simulation
     */
    const handleFileUpload = useCallback((fileType, file, error) => {
        if (error) {
            setErrors(prev => ({ ...prev, [fileType]: error }));
            return;
        }

        if (!file) {
            setUploadedFiles(prev => ({ ...prev, [fileType]: null }));
            setErrors(prev => ({ ...prev, [fileType]: null }));
            return;
        }

        // Simulate upload progress
        setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                const currentProgress = prev[fileType] || 0;
                if (currentProgress >= 100) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return { ...prev, [fileType]: Math.min(currentProgress + 10, 100) };
            });
        }, 100);

        // Update file state and form data
        setUploadedFiles(prev => ({ ...prev, [fileType]: file }));
        onFieldChange(fileType, file.name);
        setErrors(prev => ({ ...prev, [fileType]: null }));

        setTimeout(() => {
            setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));
        }, 1000);
    }, [onFieldChange]);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();

        if (!isValid) {
            const { errors } = validateForm(formData);
            console.warn('Form validation failed:', errors);
            return;
        }

        if (onSubmit) {
            await onSubmit(uploadedFiles);
        }
    }, [isValid, validateForm, formData, onSubmit, uploadedFiles]);

    // Update validation when data changes
    useEffect(() => {
        const { errors, isValid, progress } = validateForm(formData);
        setErrors(errors);
        setIsValid(isValid);
        setFormProgress(progress);
    }, [formData, validateForm]);

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Section 5 of 5: Post-Event Reporting & Documentation
                            </CardTitle>
                            <CardDescription>
                                Update event details, upload attendance records, and submit your comprehensive report
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Progress indicator */}
                            <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                                <div className="w-4 h-4 mr-2">
                                    <svg className="w-full h-full" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">{formProgress}% Complete</span>
                            </div>

                            {/* Approval status badge */}
                            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Proposal Approved</span>
                            </div>

                            {disabled && (
                                <div className="flex items-center text-amber-600">
                                    <LockIcon className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-medium">Read-only</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced status info with progress bar and auto-save feedback */}
                    <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-green-700">✅ Proposal approved! Complete your post-event report below.</span>

                            <div className="flex items-center gap-2">
                                {/* Auto-save status indicators */}
                                {isAutoSaving && (
                                    <StatusBadge
                                        variant="saving"
                                        text="Auto-saving..."
                                        animate={true}
                                    />
                                )}

                                {lastSaved && !isAutoSaving && !saveError && (
                                    <StatusBadge
                                        variant="saved"
                                        text={`Saved ${new Date(lastSaved).toLocaleTimeString()}`}
                                    />
                                )}

                                {saveError && (
                                    <StatusBadge
                                        variant="error"
                                        text="Save failed - Click to retry"
                                        onClick={() => {
                                            clearSaveError();
                                            retrySave(formData);
                                        }}
                                        title={saveError}
                                    />
                                )}

                                {/* Connection status */}
                                <ConnectionStatus />

                                {submitSuccess && (
                                    <StatusBadge
                                        variant="saved"
                                        text="✅ Final Submission Complete"
                                    />
                                )}

                                {proposalId && (
                                    <span className="text-xs text-gray-500">ID: {proposalId}</span>
                                )}
                            </div>
                        </div>

                        {/* Progress bar with enhanced styling */}
                        <ProgressBar progress={formProgress} isComplete={formProgress === 100} />

                        {/* Save error alert */}
                        {saveError && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Auto-save Failed</AlertTitle>
                                <AlertDescription className="flex items-center justify-between">
                                    <span>{saveError}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            clearSaveError();
                                            retrySave(formData);
                                        }}
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Retry Save
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Event Details Form */}
                    <EventDetailsForm
                        formData={formData}
                        errors={errors}
                        onFieldChange={onFieldChange}
                        disabled={disabled}
                        isSaving={isAutoSaving}
                        lastSaved={lastSaved}
                        saveError={saveError}
                    />

                    {/* Attendance Form */}
                    <AttendanceForm
                        formData={formData}
                        errors={errors}
                        uploadedFiles={uploadedFiles}
                        uploadProgress={uploadProgress}
                        onFieldChange={onFieldChange}
                        onFileUpload={handleFileUpload}
                        disabled={disabled}
                        proposalId={proposalId}
                    />
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={onPrevious} disabled={disabled} type="button">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>

                    <Button
                        type="submit"
                        disabled={!isValid || disabled || isSubmitting}
                        className={
                            !isValid || disabled || isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : submitSuccess
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-blue-600 hover:bg-blue-700"
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : submitSuccess ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Submitted Successfully!
                            </>
                        ) : (
                            <>
                                Submit Post-Event Report <CheckCircle className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default ReportingForm; 