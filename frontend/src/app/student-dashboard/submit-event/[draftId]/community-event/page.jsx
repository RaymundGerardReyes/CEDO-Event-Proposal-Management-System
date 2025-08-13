"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useDraft } from '@/hooks/useDraft'
import { cn } from "@/lib/utils"
import { InfoIcon, Paperclip, UploadCloud, X } from "lucide-react"
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from "react"
import DatePickerComponent from "../../components/DatePickerComponent"
import { getFieldClasses, hasFieldError } from "../../validation/validation"
import AutoFillDebugger from "../components/AutoFillDebugger"

// API service function for MongoDB - Community Events
const saveCommunityEventData = async (formData) => {
    const form = new FormData();

    // Get proposal_id from form data or use default
    const proposalId = formData.proposalId || formData.id || formData.organization_id || '1';

    // Add text fields for MongoDB document - using correct field names from MongoDB route
    form.append('proposal_id', proposalId);
    form.append('name', formData.communityEventName);
    form.append('venue', formData.communityVenue);
    form.append('start_date', formData.communityStartDate ? new Date(formData.communityStartDate).toISOString().split('T')[0] : '');
    form.append('end_date', formData.communityEndDate ? new Date(formData.communityEndDate).toISOString().split('T')[0] : '');
    form.append('time_start', formData.communityTimeStart);
    form.append('time_end', formData.communityTimeEnd);

    // Map event types to database enum values for community events
    const eventTypeMapping = {
        'academic-enhancement': 'academic-enhancement',
        'seminar-webinar': 'seminar-webinar',
        'general-assembly': 'general-assembly',
        'leadership-training': 'leadership-training',
        'others': 'others'
    };

    form.append('event_type', eventTypeMapping[formData.communityEventType] || 'others');
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

    // Add organization information for proper database linking
    form.append('organization_name', formData.organizationName || 'Unknown Organization');
    form.append('organization_type', 'community-based');

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

export default function CommunityEventPage() {
    const { draftId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { draft, patch, loading } = useDraft(draftId);

    // Add saving state to prevent duplicate submissions
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const [localFormData, setLocalFormData] = useState({
        communityEventName: "",
        communityVenue: "",
        communityStartDate: null,
        communityEndDate: null,
        communityTimeStart: "",
        communityTimeEnd: "",
        communityEventType: "",
        communityEventMode: "",
        communitySDPCredits: "",
        communityTargetAudience: [],
        communityGPOAFile: null,
        communityProposalFile: null,
    });

    const [filePreviews, setFilePreviews] = useState({
        communityGPOAFile: "",
        communityProposalFile: "",
    });

    // Load initial data from draft
    useEffect(() => {
        if (draft && !loading) {
            const communityEventData = draft.payload?.communityEvent || draft.form_data?.communityEvent || {};
            setLocalFormData(prev => ({
                ...prev,
                ...communityEventData
            }));
        }
    }, [draft, loading]);

    // Fallback: Save to localStorage if backend draft saving fails
    const saveToLocalStorage = useCallback((data) => {
        try {
            const key = `communityEvent_${draftId}`;
            localStorage.setItem(key, JSON.stringify(data));
            console.log('✅ Saved to localStorage as fallback:', key);
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }, [draftId]);

    // Load from localStorage as fallback
    useEffect(() => {
        if (!draft && !loading) {
            try {
                const key = `communityEvent_${draftId}`;
                const savedData = localStorage.getItem(key);
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    setLocalFormData(prev => ({
                        ...prev,
                        ...parsedData
                    }));
                    console.log('✅ Loaded from localStorage fallback:', parsedData);
                }
            } catch (error) {
                console.warn('Failed to load from localStorage:', error);
            }
        }
    }, [draft, loading, draftId]);

    const handleLocalInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setLocalFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    }, [validationErrors]);

    const handleDateChange = useCallback((fieldName, date) => {
        if (!date) return;
        const formattedDate = date.toISOString();
        setLocalFormData(prev => ({ ...prev, [fieldName]: date }));
    }, []);

    const handleTargetAudienceChange = useCallback((audience, checked) => {
        setLocalFormData(prev => {
            const currentAudiences = Array.isArray(prev.communityTargetAudience) ? prev.communityTargetAudience : [];
            const newAudiences = checked
                ? [...currentAudiences, audience]
                : currentAudiences.filter(item => item !== audience);
            return { ...prev, communityTargetAudience: newAudiences };
        });
    }, []);

    const handleRadioChange = useCallback((name, value) => {
        setLocalFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFileUpload = useCallback((e, fieldName) => {
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
    }, [toast]);

    // Auto-save on change with 10-second debounce and proper change detection
    useEffect(() => {
        // Skip if required dependencies are not ready
        if (!draft || loading || !patch) {
            return;
        }

        // Check if form has meaningful data
        const hasContent = Object.values(localFormData).some(value => {
            if (value instanceof File) return true;
            if (Array.isArray(value)) return value.length > 0;
            if (value instanceof Date) return true;
            return value && value !== '' && value !== null;
        });

        if (!hasContent) {
            return;
        }

        // Check for actual meaningful changes
        const hasChanges = Object.keys(localFormData).some(key => {
            const currentValue = localFormData[key];
            const savedValue = draft.payload?.communityEvent?.[key];

            // Skip file objects for comparison
            if (currentValue instanceof File || savedValue instanceof File) {
                return false;
            }

            // Handle array comparison
            if (Array.isArray(currentValue) && Array.isArray(savedValue)) {
                return JSON.stringify(currentValue) !== JSON.stringify(savedValue);
            }

            // Handle date comparison
            if (currentValue instanceof Date && savedValue instanceof Date) {
                return currentValue.getTime() !== savedValue.getTime();
            }

            // Handle null/undefined comparison
            if (currentValue === null && savedValue === null) return false;
            if (currentValue === undefined && savedValue === undefined) return false;

            return currentValue !== savedValue;
        });

        if (!hasChanges) {
            return;
        }

        // Set up 10-second debounced auto-save
        const timeoutId = setTimeout(async () => {
            try {
                console.log('🔄 Auto-saving community event data (10s debounce)...');
                await patch({ section: 'community-event', payload: localFormData });
                console.log('✅ Auto-save completed successfully');
            } catch (error) {
                console.error('Auto-save failed:', error);
                // Fallback to localStorage if backend fails
                saveToLocalStorage(localFormData);
            }
        }, 10000); // 10 seconds debounce

        return () => {
            clearTimeout(timeoutId);
        };
    }, [localFormData, draft, loading, patch]);

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
            console.log('📊 Full save result:', result);

            // ✅ SIMPLIFIED: Extract MySQL ID from API response (now properly included)
            const mysqlProposalId = result.data?.mysql_id || result.mysql_id;

            if (mysqlProposalId) {
                console.log('💾 Storing MySQL proposal ID from community event save:', mysqlProposalId);
                localStorage.setItem('current_mysql_proposal_id', mysqlProposalId.toString());
                localStorage.setItem('current_proposal_status', 'pending');
                localStorage.setItem('submission_timestamp', new Date().toISOString());
            } else {
                console.warn('⚠️ No MySQL ID found in community event save result:', result);
            }

            // Try to save to draft as well (but don't fail if it doesn't work)
            try {
                if (patch) {
                    await patch({ section: 'community-event', payload: localFormData });
                }
            } catch (draftError) {
                console.warn('Failed to save to draft (non-critical):', draftError);
                // Fallback to localStorage if backend draft saving fails
                saveToLocalStorage(localFormData);
            }

            toast({
                title: "Data Saved Successfully",
                description: `Community event data has been saved to the database. ID: ${eventId}`,
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

    // Handle next action
    const handleNext = useCallback(async () => {
        if (isSaving) return;

        console.log('=== SECTION 4 COMMUNITY EVENT HANDLENEXT DEBUG ===');
        console.log('Local form data before sync:', localFormData);

        try {
            // Save to database via MongoDB API to trigger status update
            const saveSuccess = await handleSaveData();

            if (saveSuccess) {
                console.log('✅ Community event data saved successfully, proceeding to Section 5');

                // ✅ SIMPLIFIED: No need for complex status update since MySQL ID is now properly returned
                console.log('✅ Community event data saved successfully, MySQL ID should be in localStorage');

                // Verify the MySQL ID was stored
                const storedMysqlId = localStorage.getItem('current_mysql_proposal_id');
                if (storedMysqlId) {
                    console.log('✅ MySQL ID confirmed in localStorage:', storedMysqlId);
                } else {
                    console.warn('⚠️ No MySQL ID found in localStorage after save');
                }

                // Navigate to next section
                router.push(`/student-dashboard/submit-event/${draftId}/reporting`);
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
    }, [isSaving, localFormData, handleSaveData, router, draftId, toast]);

    // Handle previous action
    const handlePrevious = useCallback(() => {
        router.push(`/student-dashboard/submit-event/${draftId}/organization`);
    }, [router, draftId]);

    // Handle withdraw action
    const handleWithdraw = useCallback(() => {
        // TODO: Implement withdraw logic
        console.log('Withdraw functionality not implemented yet');
        toast({
            title: "Withdraw",
            description: "Withdraw functionality not implemented yet",
            variant: "default",
        });
    }, [toast]);

    // ============================================================================
    // AUTO-FILL DEBUG HANDLERS
    // ============================================================================

    const handleAutoFillData = useCallback(async (testData) => {
        console.log('🔧 Auto-filling community event form with:', testData);

        // Update form data with test data
        setLocalFormData(prev => ({
            ...prev,
            ...testData
        }));

        // Update file previews
        setFilePreviews(prev => ({
            ...prev,
            communityGPOAFile: testData.communityGPOAFile?.name || "",
            communityProposalFile: testData.communityProposalFile?.name || ""
        }));

        // Clear validation errors
        setValidationErrors({});

        console.log('✅ Auto-fill completed');
    }, []);

    const handleClearFormData = useCallback(async () => {
        console.log('🔧 Clearing community event form');

        // Reset form data
        setLocalFormData({
            communityEventName: "",
            communityVenue: "",
            communityStartDate: null,
            communityEndDate: null,
            communityTimeStart: "",
            communityTimeEnd: "",
            communityEventType: "",
            communityEventMode: "",
            communitySDPCredits: "",
            communityTargetAudience: [],
            communityGPOAFile: null,
            communityProposalFile: null,
        });

        // Clear file previews
        setFilePreviews({
            communityGPOAFile: "",
            communityProposalFile: "",
        });

        // Clear validation errors
        setValidationErrors({});

        console.log('✅ Form cleared');
    }, []);

    const handleAutoFillAndSubmit = useCallback(async (testData) => {
        console.log('🔧 Auto-filling and submitting community event form');

        // First fill the form
        await handleAutoFillData(testData);

        // Then submit
        await handleNext();

        console.log('✅ Auto-fill and submit completed');
    }, [handleAutoFillData, handleNext]);

    const renderFieldError = useCallback((fieldName) => {
        if (!validationErrors[fieldName]) return null;
        return (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {validationErrors[fieldName]}
            </p>
        );
    }, [validationErrors]);

    if (loading || !draft) return <Skeleton />;

    return (
        <>
            {/* Auto-Fill Debug Tool */}
            <AutoFillDebugger
                onFillData={handleAutoFillData}
                onClearData={handleClearFormData}
                onFillAndSubmit={handleAutoFillAndSubmit}
                isSubmitting={isSaving}
            />

            <Card className="w-full max-w-3xl mx-auto shadow-lg border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-xl font-bold text-cedo-blue dark:text-cedo-gold">
                                Community-Based Event Details
                            </CardTitle>
                            <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
                                Provide comprehensive details about your proposed community-based event.
                            </CardDescription>
                        </div>
                        {/* Removed disabled state as it's now managed by the page component */}
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    {/* Removed form.proposalStatus check as form is not defined in this component */}

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
                                disabled={loading}
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
                                disabled={loading}
                                required
                            />
                            {renderFieldError("communityVenue")}
                        </div>
                    </fieldset>

                    {/* Fieldset for Date & Time */}
                    <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
                        <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Date & Time</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            <DatePickerComponent
                                label="Start Date"
                                value={localFormData.communityStartDate ? new Date(localFormData.communityStartDate) : null}
                                onChange={handleDateChange}
                                disabled={loading}
                                error={validationErrors.communityStartDate}
                                required={true}
                                fieldName="communityStartDate"
                                placeholder="Pick a date"
                            />
                            <DatePickerComponent
                                label="End Date"
                                value={localFormData.communityEndDate ? new Date(localFormData.communityEndDate) : null}
                                onChange={handleDateChange}
                                disabled={loading}
                                error={validationErrors.communityEndDate}
                                required={true}
                                fieldName="communityEndDate"
                                placeholder="Pick a date"
                            />
                            <div className="space-y-2">
                                <Label htmlFor="communityTimeStart" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Start Time <span className="text-red-500 ml-0.5">*</span></Label>
                                <Input
                                    id="communityTimeStart"
                                    name="communityTimeStart"
                                    type="time"
                                    value={localFormData.communityTimeStart || ""}
                                    onChange={handleLocalInputChange}
                                    className={getFieldClasses("communityTimeStart", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                                    disabled={loading}
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
                                    disabled={loading}
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
                                disabled={loading}
                            >
                                {["Academic Enhancement", "Seminar/Webinar", "General Assembly", "Leadership Training", "Others"].map(type => (
                                    <div className="flex items-center space-x-2" key={type}>
                                        <RadioGroupItem value={type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')} id={`community-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-')}`} disabled={loading} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
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
                                            disabled={loading}
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
                                disabled={loading}
                            >
                                {["Online", "Offline", "Hybrid"].map(mode => (
                                    <div className="flex items-center space-x-2" key={mode}>
                                        <RadioGroupItem value={mode.toLowerCase()} id={`community-mode-${mode.toLowerCase()}`} disabled={loading} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
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
                                disabled={loading}
                            >
                                {["1", "2"].map(credit => (
                                    <div className="flex items-center space-x-2" key={credit}>
                                        <RadioGroupItem value={credit} id={`community-credit-${credit}`} disabled={loading} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
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
                                    loading && "opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-700/50",
                                    hasFieldError(fileField.name, validationErrors) && "border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-600 bg-red-50 dark:bg-red-900/30",
                                    filePreviews[fileField.name] && !hasFieldError(fileField.name, validationErrors) && "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 hover:border-green-600 dark:hover:border-green-600"
                                )}>
                                    <Label htmlFor={fileField.name} className={cn("cursor-pointer w-full flex flex-col items-center justify-center", loading && "cursor-not-allowed")}>
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
                                        disabled={loading}
                                    />
                                    {filePreviews[fileField.name] && !loading && (
                                        <Button type="button" variant="ghost" size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const inputElement = document.getElementById(fileField.name);
                                                if (inputElement) inputElement.value = "";
                                                setFilePreviews(prev => ({ ...prev, [fileField.name]: "" }));
                                                setLocalFormData(prev => ({ ...prev, [fileField.name]: null }));
                                                // handleFileChange({ target: { name: fileField.name, files: [] } }); // This was removed from props
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

                    {/* Debug Section - Remove in production */}
                    <Alert variant="outline" className="bg-yellow-50 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 rounded-lg">
                        <InfoIcon className="h-5 w-5" />
                        <AlertTitle className="font-semibold">Debug Information</AlertTitle>
                        <AlertDescription className="text-sm space-y-2">
                            <div>Current MySQL ID in localStorage: <code className="bg-gray-100 px-1 rounded">{typeof window !== 'undefined' ? localStorage.getItem('current_mysql_proposal_id') || 'none' : 'server-side'}</code></div>
                            <div>Current status in localStorage: <code className="bg-gray-100 px-1 rounded">{typeof window !== 'undefined' ? localStorage.getItem('current_proposal_status') || 'none' : 'server-side'}</code></div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    localStorage.setItem('current_mysql_proposal_id', '286');
                                    localStorage.setItem('current_proposal_status', 'pending');
                                    console.log('🔧 Manual test: Set MySQL ID to 286 and status to pending');
                                    window.location.reload();
                                }}
                                className="mt-2"
                            >
                                Test: Set MySQL ID to 286
                            </Button>
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="outline" onClick={handlePrevious} disabled={loading} className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-cedo-blue dark:focus:ring-cedo-gold">
                            Back to Section 2
                        </Button>
                        {/* Removed onWithdraw prop */}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        {/* Removed handleSaveData prop */}
                        <Button
                            onClick={handleNext}
                            disabled={loading || isSaving}
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
        </>
    );
}