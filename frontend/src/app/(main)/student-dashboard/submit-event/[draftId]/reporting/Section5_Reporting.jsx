"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowLeft, CheckCircle, LockIcon, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatePickerComponent from "../../DatePickerComponent";

// Helper to build a normalised API base URL that ends with "/api" exactly once.
const getApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

// Universal helper – convert Date objects or ISO strings to MySQL-friendly YYYY-MM-DD
const toMysqlDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.split('T')[0];
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return String(value);
  }
};

// Custom hook for debounced auto-save functionality
const useAutoSave = (saveFunction, delay = 1000) => {
  const timeoutRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const debouncedSave = useCallback((data) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setSaveError(null);
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveFunction(data);
        setLastSaved(new Date().toISOString());
        setSaveError(null);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveError(error.message || 'Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    }, delay);
  }, [saveFunction, delay]);

  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSaving(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    cancelSave,
    isSaving,
    lastSaved,
    saveError,
    setSaveError
  };
};

export const Section5_Reporting = ({
  formData,
  updateFormData = () => { },
  onSubmit,
  onPrevious,
  disabled = false,
  sectionsComplete,
}) => {
  // 🔧 SIMPLIFIED STATE: Remove complex state management
  const [localFormData, setLocalFormData] = useState({});
  const [errors, setErrors] = useState({})
  const [isValid, setIsValid] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState({
    accomplishmentReport: null,
    preRegistrationList: null,
    finalAttendanceList: null
  })
  const [uploadProgress, setUploadProgress] = useState({})
  const [formProgress, setFormProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const formRef = useRef(null)

  // 🔧 SIMPLIFIED DATA: Use formData directly without complex recovery
  const effectiveFormData = useMemo(() => {
    const base = formData || {};
    const merged = { ...base, ...localFormData };
    return merged;
  }, [formData, localFormData]);

  // 🔧 SIMPLIFIED AUTO-SAVE: Basic database save function
  const saveToDatabase = useCallback(async (dataToSave) => {
    const data = dataToSave;
    const proposalId = data.id || data.proposalId || data.organization_id || '85'; // Default to 85 for testing

    if (!data.organizationName) {
      throw new Error('Missing organization name - skipping database save');
    }

    if (!data.event_status || String(data.event_status).trim() === '') {
      throw new Error('Missing event_status - required field cannot be empty');
    }

    console.log('💾 Auto-saving to database:', {
      proposalId,
      fieldsToSave: Object.keys(data).filter(key => data[key] !== undefined && data[key] !== '')
    });

    const formData = new FormData();
    formData.append('proposal_id', proposalId);

    const fieldsToSave = {
      event_status: data.event_status,
      event_venue: data.event_venue || (data.organizationTypes?.includes("school-based") ? data.schoolVenue : data.communityVenue),
      report_description: data.reportDescription,
      attendance_count: data.attendanceCount,
      organization_name: data.organizationName,
      event_name: data.organizationTypes?.includes("school-based") ? data.schoolEventName : data.communityEventName,
      event_start_date: toMysqlDate(data.organizationTypes?.includes("school-based") ? data.schoolStartDate : data.communityStartDate),
      event_end_date: toMysqlDate(data.organizationTypes?.includes("school-based") ? data.schoolEndDate : data.communityEndDate)
    };

    Object.entries(fieldsToSave).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        formData.append(key, value);
      }
    });

    const backendUrl = getApiBase();
    const response = await fetch(`${backendUrl}/mongodb-unified/section5-reporting`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.message || `Auto-save failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Auto-save successful:', result.verified_data);

    if (result.verified_data) {
      const updatedState = { ...data, ...result.verified_data };
      updateFormData(updatedState);
      try {
        localStorage.setItem('eventProposalFormData', JSON.stringify(updatedState));
      } catch (lsError) {
        console.warn('Could not update localStorage after auto-save:', lsError);
      }
    }

    return result;
  }, [updateFormData]);

  // 🔧 INITIALIZE AUTO-SAVE HOOK
  const {
    debouncedSave,
    cancelSave,
    isSaving: isAutoSaving,
    lastSaved,
    saveError,
    setSaveError
  } = useAutoSave(saveToDatabase, 1000);

  // 🔧 SIMPLIFIED VALIDATION
  const hasMinimumRequiredData = useCallback((data) => {
    if (!data) return false;
    const hasOrgInfo = data.organizationName && data.contactEmail;
    const hasProposalId = data.id || data.proposalId || data.organization_id;
    return hasOrgInfo || hasProposalId;
  }, []);

  // 🔧 ENHANCED FILE UPLOAD HANDLER
  const handleFileUpload = useCallback((fileType, validFormats, namingPattern = null) => {
    return (e) => {
      if (disabled) return

      const selectedFile = e.target.files[0]
      if (!selectedFile) return

      const errors = validateFile(selectedFile, validFormats, namingPattern)
      if (errors.length > 0) {
        setErrors(prev => ({ ...prev, [fileType]: errors.join(', ') }))
        return
      }

      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }))
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileType] || 0
          if (currentProgress >= 100) {
            clearInterval(progressInterval)
            return prev
          }
          return { ...prev, [fileType]: Math.min(currentProgress + 10, 100) }
        })
      }, 100)

      setUploadedFiles(prev => ({ ...prev, [fileType]: selectedFile }))

      const updatedData = { ...effectiveFormData, [fileType]: selectedFile.name };
      setLocalFormData(prev => ({ ...prev, [fileType]: selectedFile.name }));
      updateFormData(updatedData);

      setErrors(prev => ({ ...prev, [fileType]: null }))

      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [fileType]: 100 }))
      }, 1000)
    }
  }, [disabled, effectiveFormData, updateFormData])

  // File validation utility
  const validateFile = (file, validFormats, namingPattern) => {
    const errors = []

    if (!validFormats.includes(file.type) && !validFormats.some(format => file.name.toLowerCase().endsWith(format))) {
      const formatList = validFormats.join(', ')
      errors.push(`File must be in ${formatList} format`)
    }

    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size must be less than 10MB')
    }

    if (namingPattern) {
      const orgName = effectiveFormData.organizationName || ""
      const expectedPrefix = orgName.replace(/\s+/g, "") + namingPattern
      if (!file.name.startsWith(expectedPrefix)) {
        errors.push(`File name must follow format: ${expectedPrefix}`)
      }
    }

    return errors
  }

  // Create specific file handlers
  const handleAccomplishmentReportUpload = useMemo(() =>
    handleFileUpload('accomplishmentReport', [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pdf', '.docx'
    ], '_AR'), [handleFileUpload])

  const handlePreRegistrationUpload = useMemo(() =>
    handleFileUpload('preRegistrationList', ['text/csv', '.csv']), [handleFileUpload])

  const handleFinalAttendanceUpload = useMemo(() =>
    handleFileUpload('finalAttendanceList', ['text/csv', '.csv']), [handleFileUpload])

  // 🔧 ENHANCED FORM VALIDATION
  const validateForm = useCallback((dataToValidate) => {
    const newErrors = {};
    let completedFields = 0;
    const totalRequiredFields = 8;

    const data = dataToValidate;

    // File validation
    if (!uploadedFiles.accomplishmentReport) {
      newErrors.accomplishmentReport = "Please upload your Accomplishment Report";
    } else {
      completedFields++;
    }
    if (!uploadedFiles.preRegistrationList) {
      newErrors.preRegistrationList = "Please upload the Pre-Registration Attendee List";
    } else {
      completedFields++;
    }
    if (!uploadedFiles.finalAttendanceList) {
      newErrors.finalAttendanceList = "Please upload the Final Attendance List";
    } else {
      completedFields++;
    }

    if (!data.organizationName?.trim()) newErrors.organizationName = "Organization name is required"; else completedFields++;

    const eventName = data.organizationTypes?.includes("school-based") ? data.schoolEventName : data.communityEventName;
    if (!eventName?.trim()) newErrors.eventName = "Event name is required"; else completedFields++;

    const eventVenue = data.event_venue ?? (data.organizationTypes?.includes("school-based") ? data.schoolVenue : data.communityVenue);
    if (!eventVenue?.trim()) newErrors.eventVenue = "Event venue is required"; else completedFields++;

    if (!data.event_status?.trim()) newErrors.eventStatus = "Event status is required"; else completedFields++;

    // Date validation
    const startDate = data.organizationTypes?.includes("school-based") ? data.schoolStartDate : data.communityStartDate;
    const endDate = data.organizationTypes?.includes("school-based") ? data.schoolEndDate : data.communityEndDate;

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

  // Update validation when data changes
  useEffect(() => {
    const { errors, isValid, progress } = validateForm(effectiveFormData);
    setErrors(errors);
    setIsValid(isValid);
    setFormProgress(progress);
  }, [effectiveFormData, validateForm]);

  // 🔧 REFACTORED FIELD CHANGE HANDLER WITH AUTO-SAVE
  const handleFieldChange = useCallback((fieldName, value) => {
    if (disabled) return;

    console.log(`🔄 Field change: ${fieldName}: ${value}`);

    setLocalFormData(prev => ({ ...prev, [fieldName]: value }));

    const newFormData = { ...effectiveFormData, [fieldName]: value };
    updateFormData(newFormData);

    const { errors, isValid, progress } = validateForm(newFormData);
    setErrors(errors);
    setIsValid(isValid);
    setFormProgress(progress);

    setSaveError(null);

    if (value && String(value).trim() !== '' && newFormData.event_status) {
      console.log('🔄 Triggering debounced auto-save for:', fieldName);
      debouncedSave(newFormData);
    }
  }, [disabled, effectiveFormData, updateFormData, validateForm, setSaveError, debouncedSave]);

  // 🔧 ENHANCED FORM SUBMISSION
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()

    if (!isValid) {
      const { errors } = validateForm(effectiveFormData)
      console.warn('Form validation failed:', errors)
      return
    }

    cancelSave();

    setIsSubmitting(true)
    setSubmitSuccess(false)

    try {
      const data = effectiveFormData;
      const proposalId = data.id || data.proposalId || data.organization_id || '85';

      console.log('📋 Submitting Section 5 data to backend...');

      const formDataPayload = new FormData();
      formDataPayload.append('proposal_id', proposalId);
      formDataPayload.append('event_status', data.event_status || '');
      formDataPayload.append('report_description', data.reportDescription || '');
      formDataPayload.append('attendance_count', data.attendanceCount || '');
      formDataPayload.append('organization_name', data.organizationName || '');
      formDataPayload.append('event_name', eventName || '');
      formDataPayload.append('event_venue', eventVenue || '');
      formDataPayload.append('event_start_date', toMysqlDate(eventStartDate));
      formDataPayload.append('event_end_date', toMysqlDate(eventEndDate));

      if (uploadedFiles.accomplishmentReport) {
        formDataPayload.append('accomplishment_report_file', uploadedFiles.accomplishmentReport);
      }
      if (uploadedFiles.preRegistrationList) {
        formDataPayload.append('pre_registration_file', uploadedFiles.preRegistrationList);
      }
      if (uploadedFiles.finalAttendanceList) {
        formDataPayload.append('final_attendance_file', uploadedFiles.finalAttendanceList);
      }

      const backendUrl = getApiBase();
      const response = await fetch(`${backendUrl}/mongodb-unified/section5-reporting`, {
        method: 'POST',
        body: formDataPayload
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Section 5 submitted successfully:', result);

      const updatedState = {
        ...effectiveFormData,
        ...result.verified_data,
        submissionComplete: true,
        lastSubmitted: new Date().toISOString()
      };

      localStorage.setItem('eventProposalFormData', JSON.stringify(updatedState));
      updateFormData(updatedState);

      setSubmitSuccess(true)
      setIsSubmitting(false)
      onSubmit(result);

    } catch (error) {
      console.error('❌ Section 5 submission failed:', error);
      setIsSubmitting(false)
      setSubmitSuccess(false)
      onSubmit({ success: false, error: error.message });
    }
  }, [isValid, validateForm, cancelSave, uploadedFiles, onSubmit, effectiveFormData, updateFormData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSave();
    };
  }, [cancelSave])

  // Get event details from effective form data
  const eventName = effectiveFormData.organizationTypes?.includes("school-based")
    ? effectiveFormData.schoolEventName
    : effectiveFormData.communityEventName

  const eventVenue = effectiveFormData.event_venue ?? (
    effectiveFormData.organizationTypes?.includes("school-based")
      ? effectiveFormData.schoolVenue
      : effectiveFormData.communityVenue
  );

  const eventStartDate = effectiveFormData.organizationTypes?.includes("school-based")
    ? effectiveFormData.schoolStartDate
    : effectiveFormData.communityStartDate

  const eventEndDate = effectiveFormData.organizationTypes?.includes("school-based")
    ? effectiveFormData.schoolEndDate
    : effectiveFormData.communityEndDate

  // 🔧 APPROVED STATE: Show the enhanced Section 5 form immediately
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Section 5 of 5: Post-Event Reporting & Documentation</CardTitle>
              <CardDescription>Update event details, upload attendance records, and submit your comprehensive report</CardDescription>
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
                  <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded flex items-center animate-pulse">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Auto-saving...
                  </span>
                )}
                {lastSaved && !isAutoSaving && !saveError && (
                  <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Saved {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
                {saveError && (
                  <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded flex items-center cursor-pointer"
                    onClick={() => setSaveError(null)}
                    title={saveError}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Save failed - Click to retry
                  </span>
                )}
                {/* Connection status */}
                {typeof navigator !== 'undefined' && navigator.onLine !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded flex items-center ${navigator.onLine
                    ? 'text-green-600 bg-green-50'
                    : 'text-red-600 bg-red-50'
                    }`}>
                    {navigator.onLine ? (
                      <>
                        <Wifi className="w-3 h-3 mr-1" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </>
                    )}
                  </span>
                )}
                {submitSuccess && (
                  <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                    ✅ Final Submission Complete
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar with enhanced styling */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${formProgress === 100
                  ? 'bg-gradient-to-r from-green-400 to-green-600'
                  : 'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`}
                style={{ width: `${formProgress}%` }}
              />
            </div>

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
                      setSaveError(null);
                      debouncedSave(effectiveFormData);
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

          {/* Editable Event Details Section */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium mb-4 text-blue-800">Event Details - Update as Needed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organizationName" className="flex items-center">
                  Organization Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={effectiveFormData.organizationName || ""}
                  onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                  placeholder="Enter organization name"
                  className="mt-1"
                  disabled={disabled}
                />
                {errors.organizationName && <p className="text-sm text-red-500 mt-1">{errors.organizationName}</p>}
              </div>
              <div>
                <Label htmlFor="eventName" className="flex items-center">
                  Event Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="eventName"
                  name={
                    effectiveFormData.organizationTypes?.includes("school-based")
                      ? "schoolEventName"
                      : "communityEventName"
                  }
                  value={eventName || ""}
                  onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                  placeholder="Enter event name"
                  className="mt-1"
                  disabled={disabled}
                />
                {errors.eventName && <p className="text-sm text-red-500 mt-1">{errors.eventName}</p>}
              </div>
              <div>
                <Label htmlFor="eventVenue" className="flex items-center">
                  Venue <span className="text-red-500 ml-1">*</span>
                  {isAutoSaving && (
                    <RefreshCw className="w-3 h-3 ml-2 animate-spin text-blue-500" />
                  )}
                  {lastSaved && !isAutoSaving && !saveError && (
                    <CheckCircle className="w-3 h-3 ml-2 text-green-500" />
                  )}
                  {saveError && (
                    <AlertCircle className="w-3 h-3 ml-2 text-red-500" />
                  )}
                </Label>
                <Input
                  id="eventVenue"
                  name="event_venue"
                  value={eventVenue || ""}
                  onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                  placeholder="Enter event venue"
                  className={`mt-1 ${isAutoSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                  disabled={disabled}
                  required
                />
                {errors.eventVenue && <p className="text-sm text-red-500 mt-1">{errors.eventVenue}</p>}
              </div>
              <div>
                <Label htmlFor="eventStatus" className="flex items-center">
                  Event Status <span className="text-red-500 ml-1">*</span>
                  {isAutoSaving && (
                    <RefreshCw className="w-3 h-3 ml-2 animate-spin text-blue-500" />
                  )}
                  {lastSaved && !isAutoSaving && !saveError && (
                    <CheckCircle className="w-3 h-3 ml-2 text-green-500" />
                  )}
                  {saveError && (
                    <AlertCircle className="w-3 h-3 ml-2 text-red-500" />
                  )}
                </Label>
                <select
                  id="eventStatus"
                  name="event_status"
                  value={effectiveFormData.event_status || ""}
                  onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1 ${isAutoSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                  disabled={disabled}
                  required
                >
                  <option value="">Select status</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
                {errors.eventStatus && <p className="text-sm text-red-500 mt-1">{errors.eventStatus}</p>}
              </div>
              <div>
                <DatePickerComponent
                  label="Start Date"
                  fieldName="start_date"
                  value={eventStartDate ? new Date(eventStartDate) : null}
                  onChange={(_, date) => {
                    const formattedDate = date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;
                    const key = effectiveFormData.organizationTypes?.includes('school-based') ? 'schoolStartDate' : 'communityStartDate';
                    handleFieldChange(key, formattedDate);
                  }}
                  disabled={disabled}
                  required
                  error={errors.eventDates}
                />
              </div>
              <div>
                <DatePickerComponent
                  label="End Date"
                  fieldName="end_date"
                  value={eventEndDate ? new Date(eventEndDate) : null}
                  onChange={(_, date) => {
                    const newDate = toMysqlDate(date)
                    const key = effectiveFormData.organizationTypes?.includes('school-based') ? 'schoolEndDate' : 'communityEndDate'
                    handleFieldChange(key, newDate)
                  }}
                  disabled={disabled}
                  required
                  error={errors.eventDates}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="flex items-center">
                Additional Notes (optional)
                {isAutoSaving && (
                  <RefreshCw className="w-3 h-3 ml-2 animate-spin text-blue-500" />
                )}
                {lastSaved && !isAutoSaving && !saveError && (
                  <CheckCircle className="w-3 h-3 ml-2 text-green-500" />
                )}
                {saveError && (
                  <AlertCircle className="w-3 h-3 ml-2 text-red-500" />
                )}
              </Label>
              <Textarea
                id="description"
                name="reportDescription"
                placeholder="Additional notes about your post-event report"
                value={effectiveFormData.reportDescription || ""}
                onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                className={`min-h-[100px] ${isAutoSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                disabled={disabled}
              />
            </div>

            {/* Enhanced Attendance Tracking Section */}
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <h3 className="font-medium mb-4 text-amber-800">Attendance Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="preRegistrationFile" className="flex items-center">
                    Pre-Registration Attendee List <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    Upload the list of expected participants (CSV format only)
                  </p>
                  {effectiveFormData.pre_registration_file_path ? (
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded-md flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>File uploaded: {effectiveFormData.pre_registration_file_name}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          id="preRegistrationFile"
                          name="preRegistrationList"
                          type="file"
                          accept=".csv"
                          onChange={handlePreRegistrationUpload}
                          className="max-w-md"
                          disabled={disabled}
                        />
                        {uploadedFiles.preRegistrationList && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                      {uploadProgress.preRegistrationList !== undefined && uploadProgress.preRegistrationList < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress.preRegistrationList}%` }}
                          />
                        </div>
                      )}
                      {errors.preRegistrationList && <p className="text-sm text-red-500">{errors.preRegistrationList}</p>}
                      {uploadedFiles.preRegistrationList && (
                        <p className="text-sm text-green-600">✓ {uploadedFiles.preRegistrationList.name}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finalAttendanceFile" className="flex items-center">
                    Actual Post-Event Attendance <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    Upload the final list of actual attendees (CSV format only)
                  </p>
                  {effectiveFormData.final_attendance_file_path ? (
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded-md flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>File uploaded: {effectiveFormData.final_attendance_file_name}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          id="finalAttendanceFile"
                          name="finalAttendanceList"
                          type="file"
                          accept=".csv"
                          onChange={handleFinalAttendanceUpload}
                          className="max-w-md"
                          disabled={disabled}
                        />
                        {uploadedFiles.finalAttendanceList && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                      {uploadProgress.finalAttendanceList !== undefined && uploadProgress.finalAttendanceList < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress.finalAttendanceList}%` }}
                          />
                        </div>
                      )}
                      {errors.finalAttendanceList && <p className="text-sm text-red-500">{errors.finalAttendanceList}</p>}
                      {uploadedFiles.finalAttendanceList && (
                        <p className="text-sm text-green-600">✓ {uploadedFiles.finalAttendanceList.name}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accomplishmentReport" className="flex items-center">
                Accomplishment Report Documentation <span className="text-red-500 ml-1">*</span>
              </Label>
              <p className="text-sm text-gray-500">
                Must be in PDF or DOCS file format. File name format: OrganizationName_AR
              </p>
              {effectiveFormData.accomplishment_report_file_path ? (
                <div className="text-sm text-green-700 bg-green-50 p-2 rounded-md flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>File uploaded: {effectiveFormData.accomplishment_report_file_name}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accomplishmentReport"
                      name="accomplishmentReport"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleAccomplishmentReportUpload}
                      className="max-w-md"
                      disabled={disabled}
                    />
                    {uploadedFiles.accomplishmentReport && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  {uploadProgress.accomplishmentReport !== undefined && uploadProgress.accomplishmentReport < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress.accomplishmentReport}%` }}
                      />
                    </div>
                  )}
                  {errors.accomplishmentReport && <p className="text-sm text-red-500">{errors.accomplishmentReport}</p>}
                  {uploadedFiles.accomplishmentReport && (
                    <p className="text-sm text-green-600">✓ {uploadedFiles.accomplishmentReport.name}</p>
                  )}
                </>
              )}
            </div>
          </div>
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
  )
}

export default Section5_Reporting;
