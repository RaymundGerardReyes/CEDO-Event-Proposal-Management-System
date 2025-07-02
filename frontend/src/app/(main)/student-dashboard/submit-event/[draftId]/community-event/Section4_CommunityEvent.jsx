"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect"
import { useDraft } from '@/hooks/useDraft'
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import isEqual from "lodash.isequal"
import { AlertCircle, CalendarIcon, InfoIcon, LockIcon, Paperclip, UploadCloud, X } from "lucide-react"
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from "react"
import { getFieldClasses, hasFieldError } from "../../validation"

// API service function for MongoDB - Community Events
const saveCommunityEventData = async (formData) => {
  const form = new FormData();

  // Get organization_id from form data or use default
  const organizationId = formData.organizationId || formData.organization_id || '1';

  // Add text fields for MongoDB document
  form.append('organization_id', organizationId);
  form.append('name', formData.communityEventName);
  form.append('venue', formData.communityVenue);
  form.append('start_date', formData.communityStartDate ? new Date(formData.communityStartDate).toISOString().split('T')[0] : '');
  form.append('end_date', formData.communityEndDate ? new Date(formData.communityEndDate).toISOString().split('T')[0] : '');
  form.append('time_start', formData.communityTimeStart);
  form.append('time_end', formData.communityTimeEnd);

  // Map event types to database enum values for community events
  const eventTypeMapping = {
    'academic-enhancement': 'academic',
    'seminar-webinar': 'seminar',
    'general-assembly': 'assembly',
    'leadership-training': 'leadership',
    'others': 'other'
  };

  form.append('event_type', eventTypeMapping[formData.communityEventType] || 'other');
  form.append('event_mode', formData.communityEventMode);

  // Convert SDP credits to string
  form.append('sdp_credits', formData.communitySDPCredits || '1');

  form.append('proposal_status', 'pending');
  form.append('admin_comments', '');

  // Add target audience as JSON string for MongoDB
  form.append('target_audience', JSON.stringify(formData.communityTargetAudience || []));

  // Add contact information from form data (collected in Section2)
  form.append('contact_person', formData.contactName || formData.contactPerson || 'Unknown Contact');
  form.append('contact_email', formData.contactEmail || 'unknown@example.com');
  form.append('contact_phone', formData.contactPhone || '0000000000');

  // Add files - This is the key part for MongoDB file storage
  if (formData.communityGPOAFile instanceof File) {
    form.append('gpoaFile', formData.communityGPOAFile);
  }

  if (formData.communityProposalFile instanceof File) {
    form.append('proposalFile', formData.communityProposalFile);
  }

  // Use MongoDB API endpoint for community events
  const backendUrl = process.env.API_URL || 'http://localhost:5000';
  const apiUrl = `${backendUrl}/api/mongodb-unified/proposals/community-events`; // MongoDB community events endpoint

  console.log('Sending community event request to MongoDB:', apiUrl);
  console.log('Community event form data to be sent to MongoDB:');
  for (let [key, value] of form.entries()) {
    console.log(key, ':', value instanceof File ? `File: ${value.name}` : value);
  }

  try {
    // FOR WHEN YOU RE-ENABLE AUTH: Get token from localStorage or your auth context
    // const token = localStorage.getItem('token') || authContext.token;
    // const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      // headers, // Uncomment this when you re-enable authentication
    });

    console.log('MongoDB Community Event Response status:', response.status);
    console.log('MongoDB Community Event Response headers:', response.headers);

    // First check if response is ok
    if (!response.ok) {
      // Try to get error response as text first
      const responseText = await response.text();
      console.log('MongoDB Community Event Error response text:', responseText);

      // Try to parse as JSON if possible
      let errorData;
      try {
        errorData = JSON.parse(responseText);
        console.log('Parsed MongoDB community event error data:', errorData);
      } catch (jsonError) {
        console.log('Failed to parse MongoDB community event error response as JSON:', jsonError);
        // If it's not JSON, it might be an HTML error page
        if (responseText.includes('<!DOCTYPE')) {
          throw new Error(`MongoDB server returned HTML error page instead of JSON. Status: ${response.status}. This usually means the API endpoint doesn't exist or there's a server error.`);
        }
        throw new Error(`Failed to save community event data to MongoDB. Status: ${response.status}. Response: ${responseText}`);
      }

      // Handle validation errors specifically
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const validationMessages = errorData.errors.map(err => `${err.param}: ${err.msg}`).join(', ');
        throw new Error(`MongoDB Validation failed: ${validationMessages}`);
      }

      throw new Error(errorData.error || errorData.message || 'Failed to save community event data to MongoDB');
    }

    const result = await response.json();
    console.log('MongoDB Community Event Success response:', result);
    return result;
  } catch (fetchError) {
    console.error('MongoDB Community Event Fetch error:', fetchError);

    // Check if it's a network error
    if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to the MongoDB server. Please check if the backend is running.');
    }

    throw fetchError;
  }
};

export const Section4_CommunityEvent = ({
  formData,
  handleInputChange,
  handleFileChange,
  onNext,
  onPrevious,
  onWithdraw,
  disabled = false,
  validationErrors = {},
}) => {
  const { toast } = useToast();
  const prevFormDataRef = useRef();
  const router = useRouter();
  const { draftId } = useParams();
  const { draft, patch } = useDraft(draftId);

  // Add saving state to prevent duplicate submissions
  const [isSaving, setIsSaving] = useState(false);

  const [localFormData, setLocalFormData] = useState({
    communityEventName: formData.communityEventName || "",
    communityVenue: formData.communityVenue || "",
    communityStartDate: formData.communityStartDate ? new Date(formData.communityStartDate) : null,
    communityEndDate: formData.communityEndDate ? new Date(formData.communityEndDate) : null,
    communityTimeStart: formData.communityTimeStart || "",
    communityTimeEnd: formData.communityTimeEnd || "",
    communityEventType: formData.communityEventType || "",
    communityEventMode: formData.communityEventMode || "",
    communitySDPCredits: formData.communitySDPCredits || "",
    communityTargetAudience: formData.communityTargetAudience || [],
    communityGPOAFile: formData.communityGPOAFile || null,
    communityProposalFile: formData.communityProposalFile || null,
  });

  const [filePreviews, setFilePreviews] = useState({
    communityGPOAFile: formData.communityGPOAFile?.name || "",
    communityProposalFile: formData.communityProposalFile?.name || "",
  });

  // Update local form data when formData prop changes
  useEffect(() => {
    const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
    const getComparable = (data) => ({
      ...data,
      communityStartDate: data.communityStartDate ? new Date(data.communityStartDate).getTime() : null,
      communityEndDate: data.communityEndDate ? new Date(data.communityEndDate).getTime() : null,
      communityGPOAFile: data.communityGPOAFile?.name || data.communityGPOAFile || null,
      communityProposalFile: data.communityProposalFile?.name || data.communityProposalFile || null,
      communityTargetAudience: Array.isArray(data.communityTargetAudience) ? data.communityTargetAudience : [],
    });

    const prev = prevFormDataRef.current ? getComparable(prevFormDataRef.current) : null;
    const curr = getComparable(formData);

    if (!isEqual(prev, curr)) {
      setLocalFormData({
        communityEventName: formData.communityEventName || "",
        communityVenue: formData.communityVenue || "",
        communityStartDate: formData.communityStartDate ? new Date(formData.communityStartDate) : null,
        communityEndDate: formData.communityEndDate ? new Date(formData.communityEndDate) : null,
        communityTimeStart: formData.communityTimeStart || "",
        communityTimeEnd: formData.communityTimeEnd || "",
        communityEventType: formData.communityEventType || "",
        communityEventMode: formData.communityEventMode || "",
        communitySDPCredits: formData.communitySDPCredits || "",
        communityTargetAudience: formData.communityTargetAudience || [],
        communityGPOAFile: formData.communityGPOAFile || null,
        communityProposalFile: formData.communityProposalFile || null,
      });
      prevFormDataRef.current = deepClone(formData);
    }
  }, [formData]);

  const handleLocalInputChange = useCallback((e) => {
    if (disabled) return;
    const { name, value } = e.target;
    setLocalFormData(prev => ({ ...prev, [name]: value }));
    handleInputChange(e);
  }, [disabled, handleInputChange]);

  const handleDateChange = useCallback((fieldName, date) => {
    if (disabled || !date) return;
    const formattedDate = date.toISOString();
    setLocalFormData(prev => ({ ...prev, [fieldName]: date }));
    handleInputChange({
      target: { name: fieldName, value: formattedDate }
    });
  }, [disabled, handleInputChange]);

  const handleTargetAudienceChange = useCallback((audience, checked) => {
    if (disabled) return;
    setLocalFormData(prev => {
      const currentAudiences = Array.isArray(prev.communityTargetAudience) ? prev.communityTargetAudience : [];
      const newAudiences = checked
        ? [...currentAudiences, audience]
        : currentAudiences.filter(item => item !== audience);
      return { ...prev, communityTargetAudience: newAudiences };
    });
    const newAudiences = checked
      ? [...(localFormData.communityTargetAudience || []), audience]
      : (localFormData.communityTargetAudience || []).filter(item => item !== audience);
    handleInputChange({
      target: { name: "communityTargetAudience", value: newAudiences }
    });
  }, [disabled, handleInputChange, localFormData.communityTargetAudience]);

  const handleRadioChange = useCallback((name, value) => {
    if (disabled) return;
    setLocalFormData(prev => ({ ...prev, [name]: value }));
    handleInputChange({
      target: { name, value }
    });
  }, [disabled, handleInputChange]);

  const handleFileUpload = useCallback((e, fieldName) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Word, and Excel files are allowed",
        variant: "destructive",
      });
      return;
    }

    setFilePreviews(prev => ({
      ...prev,
      [fieldName]: file.name
    }));

    setLocalFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));

    handleFileChange(e);
  }, [disabled, handleFileChange, toast]);

  // Save function to persist data to database
  const handleSaveData = useCallback(async () => {
    // Prevent duplicate saves
    if (isSaving) {
      console.log('Community event save already in progress, skipping duplicate call');
      return false;
    }

    setIsSaving(true);

    try {
      console.log('=== COMMUNITY EVENT SAVE VALIDATION DEBUG ===');
      console.log('Local form data:', localFormData);

      // Validate required fields before saving
      const requiredFields = {
        communityEventName: localFormData.communityEventName,
        communityVenue: localFormData.communityVenue,
        communityStartDate: localFormData.communityStartDate,
        communityEndDate: localFormData.communityEndDate,
        communityTimeStart: localFormData.communityTimeStart,
        communityTimeEnd: localFormData.communityTimeEnd,
        communityEventType: localFormData.communityEventType,
        communityEventMode: localFormData.communityEventMode,
        communitySDPCredits: localFormData.communitySDPCredits,
      };

      const missingFields = Object.entries(requiredFields).filter(([key, value]) => {
        let isEmpty = false;
        if (key.includes('Date')) {
          isEmpty = !value || !Date.parse(value);
        } else if (key.includes('Time')) {
          isEmpty = !value || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        } else {
          isEmpty = !value || (typeof value === 'string' && value.trim() === '');
        }
        return isEmpty;
      });

      if (missingFields.length > 0) {
        const fieldNameMap = {
          communityEventName: 'Event Name',
          communityVenue: 'Venue',
          communityStartDate: 'Start Date',
          communityEndDate: 'End Date',
          communityTimeStart: 'Start Time',
          communityTimeEnd: 'End Time',
          communityEventType: 'Event Type',
          communityEventMode: 'Event Mode',
          communitySDPCredits: 'SDP Credits'
        };

        const readableFieldNames = missingFields.map(([key]) => fieldNameMap[key] || key).join(', ');
        toast({
          title: "Missing Required Fields",
          description: `Please fill in: ${readableFieldNames}`,
          variant: "destructive",
        });
        return false;
      }

      if (!localFormData.communityTargetAudience || localFormData.communityTargetAudience.length === 0) {
        toast({
          title: "Missing Target Audience",
          description: "Please select at least one target audience",
          variant: "destructive",
        });
        return false;
      }

      // Save to database
      const result = await saveCommunityEventData(localFormData);
      const eventId = result.id || result._id || result.data?.id || result.data?._id || 'unknown';

      console.log('✅ Community event data saved successfully with ID:', eventId);

      toast({
        title: "Data Saved Successfully",
        description: `School event data has been saved to the database. ID: ${eventId}`,
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error saving community event data:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save data to database",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [localFormData, toast, isSaving]);

  // Modified onNext handler to sync data and validate before proceeding
  const handleNext = useCallback(async () => {
    if (disabled || isSaving) return;

    console.log('=== SECTION 4 COMMUNITY EVENT HANDLENEXT DEBUG ===');
    console.log('Local form data before sync:', localFormData);

    try {
      // Sync all local form data to the global state
      const fieldsToSync = [
        'communityEventName', 'communityVenue', 'communityStartDate', 'communityEndDate',
        'communityTimeStart', 'communityTimeEnd', 'communityEventType', 'communityEventMode',
        'communitySDPCredits', 'communityTargetAudience', 'communityGPOAFile', 'communityProposalFile'
      ];

      console.log('Syncing fields to global state...');
      fieldsToSync.forEach(fieldName => {
        const value = localFormData[fieldName];
        if (value !== undefined && value !== null) {
          console.log(`Syncing ${fieldName}:`, value);
          handleInputChange({ target: { name: fieldName, value } });
        }
      });

      // Small delay to ensure all state updates are processed
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('Data synced, now saving to MongoDB...');

      // Save to database
      const saveSuccess = await handleSaveData();

      if (saveSuccess) {
        console.log('✅ Community event data saved successfully, proceeding to Section 5');
        console.log('Calling onNext() function to navigate to Section5_Reporting...');

        // Call onNext to proceed to Section 5
        if (typeof onNext === 'function') {
          onNext(true); // Pass true to bypass validation in SubmitEventFlow
          console.log('✅ onNext(true) called successfully - proceeding to Section 5');
        } else {
          console.error('❌ onNext is not a function:', typeof onNext);
          toast({
            title: "Navigation Error",
            description: "Unable to proceed to Section 5. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('❌ Save failed, not proceeding to Section 5');
        // Error already shown in handleSaveData
      }
    } catch (error) {
      console.error('❌ Error in handleNext:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing. Please try again.",
        variant: "destructive",
      });
    }
  }, [disabled, isSaving, localFormData, handleInputChange, handleSaveData, onNext, toast]);

  const renderFieldError = useCallback((fieldName) => {
    if (!validationErrors[fieldName]) return null;
    return (
      <p className="mt-1 text-sm text-red-600 dark:text-red-500">
        {validationErrors[fieldName]}
      </p>
    );
  }, [validationErrors]);

  if (!draft) return <Skeleton />;

  const local = draft.payload.communityEvent || {};
  const [form, setForm] = useState(local);

  // auto-save on change (debounced 800 ms)
  useDebouncedEffect(() => {
    patch.mutate({ section: 'community-event', payload: form });
  }, [form]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold text-cedo-blue dark:text-cedo-gold">
              Section 4 of 5: Community-Based Event Details
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
              Provide comprehensive details about your proposed community-based event.
            </CardDescription>
          </div>
          {disabled && (
            <div className="flex items-center text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-3 py-1.5 rounded-md font-medium self-start sm:self-center">
              <LockIcon className="h-4 w-4 mr-2" />
              <span>Read-only Mode</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {form.proposalStatus === "denied" && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/40 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Revision Requested</AlertTitle>
            <AlertDescription className="text-sm">
              {form.adminComments || "The admin has requested revisions. Please update the required information and resubmit."}
            </AlertDescription>
          </Alert>
        )}

        {/* Fieldset for Basic Event Info */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Basic Information</legend>
          <div className="space-y-2">
            <Label htmlFor="communityEventName" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              Event/Activity Name <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="communityEventName"
              name="communityEventName"
              value={localFormData.communityEventName || ""}
              onChange={handleLocalInputChange}
              placeholder="e.g., Community Skills Workshop"
              className={getFieldClasses("communityEventName", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
              disabled={disabled}
              required
            />
            {renderFieldError("communityEventName")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="communityVenue" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              Venue (Platform or Address) <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="communityVenue"
              name="communityVenue"
              value={localFormData.communityVenue || ""}
              onChange={handleLocalInputChange}
              placeholder="e.g., Community Center or Zoom Meeting ID"
              className={getFieldClasses("communityVenue", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
              disabled={disabled}
              required
            />
            {renderFieldError("communityVenue")}
          </div>
        </fieldset>

        {/* Fieldset for Date & Time */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Date & Time</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Start Date <span className="text-red-500 ml-0.5">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={disabled}
                    className={getFieldClasses("communityStartDate", validationErrors, "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600/80 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    {localFormData.communityStartDate ? format(new Date(localFormData.communityStartDate), "MMMM d, yyyy") : <span className="text-gray-500 dark:text-gray-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFormData.communityStartDate ? new Date(localFormData.communityStartDate) : undefined}
                    onSelect={(date) => handleDateChange("communityStartDate", date)}
                    initialFocus
                    disabled={disabled}
                  />
                </PopoverContent>
              </Popover>
              {renderFieldError("communityStartDate")}
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">End Date <span className="text-red-500 ml-0.5">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={disabled}
                    className={getFieldClasses("communityEndDate", validationErrors, "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600/80 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    {localFormData.communityEndDate ? format(new Date(localFormData.communityEndDate), "MMMM d, yyyy") : <span className="text-gray-500 dark:text-gray-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFormData.communityEndDate ? new Date(localFormData.communityEndDate) : undefined}
                    onSelect={(date) => handleDateChange("communityEndDate", date)}
                    initialFocus
                    disabled={disabled}
                  />
                </PopoverContent>
              </Popover>
              {renderFieldError("communityEndDate")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="communityTimeStart" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Start Time <span className="text-red-500 ml-0.5">*</span></Label>
              <Input
                id="communityTimeStart"
                name="communityTimeStart"
                type="time"
                value={localFormData.communityTimeStart || ""}
                onChange={handleLocalInputChange}
                className={getFieldClasses("communityTimeStart", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                disabled={disabled}
                required
              />
              {renderFieldError("communityTimeStart")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="communityTimeEnd" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">End Time <span className="text-red-500 ml-0.5">*</span></Label>
              <Input
                id="communityTimeEnd"
                name="communityTimeEnd"
                type="time"
                value={localFormData.communityTimeEnd || ""}
                onChange={handleLocalInputChange}
                className={getFieldClasses("communityTimeEnd", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                disabled={disabled}
                required
              />
              {renderFieldError("communityTimeEnd")}
            </div>
          </div>
        </fieldset>

        {/* Fieldset for Event Specifics */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Event Specifics</legend>
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Type of Event <span className="text-red-500 ml-0.5">*</span></Label>
            <RadioGroup
              value={localFormData.communityEventType || ""}
              onValueChange={(value) => handleRadioChange("communityEventType", value)}
              className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communityEventType", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
              disabled={disabled}
            >
              {["Academic Enhancement", "Seminar/Webinar", "General Assembly", "Leadership Training", "Others"].map(type => (
                <div className="flex items-center space-x-2" key={type}>
                  <RadioGroupItem value={type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')} id={`community-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                  <Label htmlFor={`community-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{type}</Label>
                </div>
              ))}
            </RadioGroup>
            {renderFieldError("communityEventType")}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Target Audience <span className="text-red-500 ml-0.5">*</span></Label>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communityTargetAudience", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}>
              {["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Leaders", "Alumni"].map((audience) => (
                <div className="flex items-center space-x-2" key={audience}>
                  <Checkbox
                    id={`community-audience-${audience}`}
                    checked={localFormData.communityTargetAudience?.includes(audience) || false}
                    onCheckedChange={(checked) => handleTargetAudienceChange(audience, Boolean(checked))}
                    disabled={disabled}
                    className="data-[state=checked]:bg-cedo-blue dark:data-[state=checked]:bg-cedo-gold data-[state=checked]:border-transparent dark:border-gray-500"
                  />
                  <Label htmlFor={`community-audience-${audience}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{audience}</Label>
                </div>
              ))}
            </div>
            {renderFieldError("communityTargetAudience")}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Mode of Event <span className="text-red-500 ml-0.5">*</span></Label>
            <RadioGroup
              value={localFormData.communityEventMode || ""}
              onValueChange={(value) => handleRadioChange("communityEventMode", value)}
              className={`grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communityEventMode", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
              disabled={disabled}
            >
              {["Online", "Offline", "Hybrid"].map(mode => (
                <div className="flex items-center space-x-2" key={mode}>
                  <RadioGroupItem value={mode.toLowerCase()} id={`community-mode-${mode.toLowerCase()}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                  <Label htmlFor={`community-mode-${mode.toLowerCase()}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{mode}</Label>
                </div>
              ))}
            </RadioGroup>
            {renderFieldError("communityEventMode")}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Number of SDP Credits <span className="text-red-500 ml-0.5">*</span></Label>
            <RadioGroup
              value={String(localFormData.communitySDPCredits || "")}
              onValueChange={(value) => handleRadioChange("communitySDPCredits", value)}
              className={`grid grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("communitySDPCredits", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
              disabled={disabled}
            >
              {["1", "2"].map(credit => (
                <div className="flex items-center space-x-2" key={credit}>
                  <RadioGroupItem value={credit} id={`community-credit-${credit}`} disabled={disabled} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                  <Label htmlFor={`community-credit-${credit}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{credit}</Label>
                </div>
              ))}
            </RadioGroup>
            {renderFieldError("communitySDPCredits")}
          </div>
        </fieldset>

        {/* Fieldset for Attachments */}
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
          <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Attachments</legend>
          {[
            { label: "General Plan of Action (GPOA)", name: "communityGPOAFile", type: "gpoa", hint: "Filename: OrganizationName_GPOA.pdf/docx/xlsx" },
            { label: "Project Proposal Document", name: "communityProposalFile", type: "proposal", hint: "Filename: OrganizationName_PP.pdf/docx/xlsx. Must include summary, objectives, timeline, budget." }
          ].map(fileField => (
            <div key={fileField.name} className="space-y-2">
              <Label htmlFor={fileField.name} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                {fileField.label} <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <div className={cn("mt-1 group relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ease-in-out hover:border-cedo-blue dark:border-gray-600 dark:hover:border-cedo-gold",
                disabled && "opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-700/50",
                hasFieldError(fileField.name, validationErrors) && "border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-600 bg-red-50 dark:bg-red-900/30",
                filePreviews[fileField.name] && !hasFieldError(fileField.name, validationErrors) && "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 hover:border-green-600 dark:hover:border-green-600"
              )}>
                <Label htmlFor={fileField.name} className={cn("cursor-pointer w-full flex flex-col items-center justify-center", disabled && "cursor-not-allowed")}>
                  <UploadCloud className={cn("h-10 w-10 mb-2 text-gray-400 dark:text-gray-500 group-hover:text-cedo-blue dark:group-hover:text-cedo-gold transition-colors", filePreviews[fileField.name] && !hasFieldError(fileField.name, validationErrors) && "text-green-600 dark:text-green-500")} />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filePreviews[fileField.name] ? (
                      <span className="flex items-center gap-2 text-cedo-blue dark:text-cedo-gold">
                        <Paperclip className="h-4 w-4 flex-shrink-0" /> {filePreviews[fileField.name]}
                      </span>
                    ) : (
                      <>Drag & drop or <span className="font-semibold text-cedo-blue dark:text-cedo-gold">click to browse</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{fileField.hint}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Max 5MB. Allowed: PDF, Word, Excel.</p>
                </Label>
                <Input
                  id={fileField.name}
                  name={fileField.name}
                  type="file"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, fileField.name)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={disabled}
                />
                {filePreviews[fileField.name] && !disabled && (
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      const inputElement = document.getElementById(fileField.name);
                      if (inputElement) inputElement.value = "";
                      setFilePreviews(prev => ({ ...prev, [fileField.name]: "" }));
                      setLocalFormData(prev => ({ ...prev, [fileField.name]: null }));
                      handleFileChange({ target: { name: fileField.name, files: [] } });
                    }}
                    aria-label={`Remove ${fileField.label}`}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {renderFieldError(fileField.name)}
            </div>
          ))}
        </fieldset>

        <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200 rounded-lg">
          <InfoIcon className="h-5 w-5" />
          <AlertTitle className="font-semibold">Important Reminders</AlertTitle>
          <AlertDescription className="text-sm">
            All fields marked with <span className="text-red-500 font-semibold">*</span> are mandatory.
            Ensure all documents are correctly named and in the specified formats before submission.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={onPrevious} disabled={disabled || isSaving} className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-cedo-blue dark:focus:ring-cedo-gold">
            Back to Section 2
          </Button>
          {!disabled && (
            <Button variant="destructive" onClick={onWithdraw} disabled={isSaving} className="w-full sm:w-auto">
              Withdraw Proposal
            </Button>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {!disabled && (
            <Button
              variant="outline"
              onClick={handleSaveData}
              disabled={isSaving}
              className="w-full sm:w-auto border-cedo-blue text-cedo-blue hover:bg-cedo-blue hover:text-white dark:border-cedo-gold dark:text-cedo-gold dark:hover:bg-cedo-gold dark:hover:text-cedo-blue"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                'Save Progress'
              )}
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={disabled || isSaving}
            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white w-full sm:w-auto dark:bg-cedo-gold dark:text-cedo-blue dark:hover:bg-cedo-gold/90 focus:ring-offset-2 focus:ring-2 focus:ring-cedo-blue dark:focus:ring-cedo-gold"
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              'Save & Continue to Section 5'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default Section4_CommunityEvent
