"use client"

import DatePickerComponent from "@/app/student-dashboard/submit-event/components/DatePickerComponent"
import { getFieldClasses, hasFieldError } from "@/app/student-dashboard/submit-event/validation/validation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { useDraft } from '@/hooks/useDraft'
import { cn } from "@/lib/utils"
import { InfoIcon, Paperclip, UploadCloud, X } from "lucide-react"
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AutoFillDebugger from "../components/AutoFillDebugger"

// Event type mapping for database compatibility
const EVENT_TYPE_MAPPING = {
    'academic-competition': 'competition',
    'workshop-seminar': 'workshop-seminar-webinar',
    'cultural-event': 'cultural-show',
    'sports-activity': 'sports-fest',
    'leadership-training': 'academic-enhancement',
    'community-service': 'other',
    'career-guidance': 'academic-enhancement',
    'health-wellness': 'other',
    'technology-workshop': 'workshop-seminar-webinar',
    'environmental-awareness': 'other',
    'other': 'other'
};

// API service function for MongoDB - School Events
const saveSchoolEventData = async (formData) => {
    const form = new FormData();

    // Get proposal_id from form data or use default
    const proposalId = formData.proposalId || formData.id || formData.organization_id || '1';

    // ✅ FIX: Add a flag to force creation of new proposal if current one is denied
    form.append('force_new_proposal', 'true');

    // Add text fields for MongoDB document
    form.append('proposal_id', proposalId);
    form.append('name', formData.schoolEventName);
    form.append('venue', formData.schoolVenue);
    form.append('start_date', formData.schoolStartDate ? new Date(formData.schoolStartDate).toISOString().split('T')[0] : '');
    form.append('end_date', formData.schoolEndDate ? new Date(formData.schoolEndDate).toISOString().split('T')[0] : '');
    form.append('time_start', formData.schoolTimeStart);
    form.append('time_end', formData.schoolTimeEnd);

    // Map event types to database enum values for school events
    const eventTypeMapping = {
        'academic-competition': 'competition',
        'workshop-seminar': 'workshop-seminar-webinar',
        'cultural-event': 'cultural-show',
        'sports-activity': 'sports-fest',
        'leadership-training': 'academic-enhancement',
        'community-service': 'other',
        'career-guidance': 'academic-enhancement',
        'health-wellness': 'other',
        'technology-workshop': 'workshop-seminar-webinar',
        'environmental-awareness': 'other',
        'other': 'other'
    };

    form.append('event_type', eventTypeMapping[formData.schoolEventType] || 'other');
    form.append('event_mode', formData.schoolEventMode);

    // Convert SDP credits to string
    form.append('sdp_credits', formData.schoolSDPCredits || '1');

    form.append('proposal_status', 'pending');
    form.append('admin_comments', '');

    // Add target audience as JSON string for MongoDB
    form.append('target_audience', JSON.stringify(formData.schoolTargetAudience || []));

    // Add contact information from form data (collected in Section2)
    form.append('contact_person', formData.contactName || formData.contactPerson || 'Unknown Contact');
    form.append('contact_email', formData.contactEmail || 'unknown@example.com');
    form.append('contact_phone', formData.contactPhone || '0000000000');

    // Add files - This is the key part for MongoDB file storage
    if (formData.schoolGPOAFile instanceof File) {
        form.append('gpoaFile', formData.schoolGPOAFile);
    }

    if (formData.schoolProposalFile instanceof File) {
        form.append('proposalFile', formData.schoolProposalFile);
    }

    // Use MongoDB API endpoint for school events
    const backendUrl = process.env.API_URL || 'http://localhost:5000';
    const apiUrl = `${backendUrl}/api/mongodb-unified/proposals/school-events`; // MongoDB school events endpoint

    console.log('Sending school event request to MongoDB:', apiUrl);
    console.log('School event form data to be sent to MongoDB:');
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

        console.log('MongoDB School Event Response status:', response.status);
        console.log('MongoDB School Event Response headers:', response.headers);

        // First check if response is ok
        if (!response.ok) {
            // Try to get error response as text first
            const responseText = await response.text();
            console.log('MongoDB School Event Error response text:', responseText);

            // Try to parse as JSON if possible
            let errorData;
            try {
                errorData = JSON.parse(responseText);
                console.log('Parsed MongoDB school event error data:', errorData);
            } catch (jsonError) {
                console.log('Failed to parse MongoDB school event error response as JSON:', jsonError);
                // If it's not JSON, it might be an HTML error page
                if (responseText.includes('<!DOCTYPE')) {
                    throw new Error(`MongoDB server returned HTML error page instead of JSON. Status: ${response.status}. This usually means the API endpoint doesn't exist or there's a server error.`);
                }
                throw new Error(`Failed to save school event data to MongoDB. Status: ${response.status}. Response: ${responseText}`);
            }

            // Handle validation errors specifically
            if (errorData.errors && Array.isArray(errorData.errors)) {
                const validationMessages = errorData.errors.map(err => `${err.param}: ${err.msg}`).join(', ');
                throw new Error(`MongoDB Validation failed: ${validationMessages}`);
            }

            throw new Error(errorData.error || errorData.message || 'Failed to save school event data to MongoDB');
        }

        const result = await response.json();
        console.log('MongoDB School Event Success response:', result);
        return result;
    } catch (fetchError) {
        console.error('MongoDB School Event Fetch error:', fetchError);

        // Check if it's a network error
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
            throw new Error('Network error: Could not connect to the MongoDB server. Please check if the backend is running.');
        }

        throw fetchError;
    }
};

export default function SchoolEventPage() {
    const { draftId } = useParams();
    const router = useRouter();
    const { toast } = useToast();

    console.log('🚀 SchoolEventPage component mounted');
    console.log('  - draftId from useParams:', draftId);

    const { draft, patch, loading } = useDraft(draftId);

    console.log('  - useDraft result:', { draft, patch, loading });

    // 🔧 FIX: Add fallback for when useDraft is stuck loading
    const [fallbackLoading, setFallbackLoading] = useState(false);

    // If loading takes too long, show form anyway
    useEffect(() => {
        if (loading) {
            const timeout = setTimeout(() => {
                console.log('⚠️ Loading timeout - showing form anyway');
                setFallbackLoading(false);
            }, 3000); // 3 second timeout

            return () => clearTimeout(timeout);
        } else {
            setFallbackLoading(false);
        }
    }, [loading]);

    // Use fallback loading state if original loading takes too long
    const shouldShowForm = !loading || fallbackLoading === false;

    // Add saving state to prevent duplicate submissions
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const isAutoSavingRef = useRef(false);

    const [localFormData, setLocalFormData] = useState({
        schoolEventName: "",
        schoolVenue: "",
        schoolStartDate: null,
        schoolEndDate: null,
        schoolTimeStart: "",
        schoolTimeEnd: "",
        schoolEventType: "",
        schoolEventMode: "",
        schoolSDPCredits: "",
        schoolTargetAudience: [],
        schoolGPOAFile: null,
        schoolProposalFile: null,
    });

    const [filePreviews, setFilePreviews] = useState({
        schoolGPOAFile: "",
        schoolProposalFile: "",
    });

    // Load initial data from draft
    useEffect(() => {
        console.log('🔄 useEffect: Loading draft data');
        console.log('  - draft:', draft);
        console.log('  - loading:', loading);

        if (draft && !loading) {
            const schoolEventData = draft.payload?.schoolEvent || draft.form_data?.schoolEvent || {};
            console.log('  - schoolEventData from draft:', schoolEventData);
            setLocalFormData(prev => ({
                ...prev,
                ...schoolEventData
            }));
        } else {
            console.log('  - No draft data available, using default form data');
        }
    }, [draft, loading]);

    // Memoize the form data to prevent unnecessary re-renders
    const memoizedFormData = useMemo(() => {
        return {
            schoolEventName: localFormData.schoolEventName || "",
            schoolVenue: localFormData.schoolVenue || "",
            schoolStartDate: localFormData.schoolStartDate,
            schoolEndDate: localFormData.schoolEndDate,
            schoolTimeStart: localFormData.schoolTimeStart || "",
            schoolTimeEnd: localFormData.schoolTimeEnd || "",
            schoolEventType: localFormData.schoolEventType || "",
            schoolEventMode: localFormData.schoolEventMode || "",
            schoolSDPCredits: localFormData.schoolSDPCredits || "",
            schoolTargetAudience: localFormData.schoolTargetAudience || [],
            schoolGPOAFile: localFormData.schoolGPOAFile,
            schoolProposalFile: localFormData.schoolProposalFile,
        };
    }, [localFormData]);

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
        setLocalFormData(prev => ({ ...prev, [fieldName]: date }));

        // Clear validation error for this field
        if (validationErrors[fieldName]) {
            setValidationErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    }, [validationErrors]);

    const handleTargetAudienceChange = useCallback((audience, checked) => {
        setLocalFormData(prev => {
            const currentAudiences = Array.isArray(prev.schoolTargetAudience) ? prev.schoolTargetAudience : [];
            const newAudiences = checked
                ? [...currentAudiences, audience]
                : currentAudiences.filter(item => item !== audience);
            return { ...prev, schoolTargetAudience: newAudiences };
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

    // Auto-save on change with stable dependencies and proper debouncing
    useEffect(() => {
        // Skip if already saving or if required dependencies are not ready
        if (isAutoSavingRef.current || !draft || loading || !patch) {
            return;
        }

        // Check if form has meaningful data
        const hasData = Object.values(memoizedFormData).some(value => {
            if (Array.isArray(value)) return value.length > 0;
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim() !== '';
            return true;
        });

        if (!hasData) {
            return;
        }

        // Set auto-saving flag to prevent duplicate requests
        isAutoSavingRef.current = true;

        const timeoutId = setTimeout(async () => {
            try {
                // Transform event type to database enum value before saving
                const transformedData = {
                    ...memoizedFormData,
                    schoolEventType: EVENT_TYPE_MAPPING[memoizedFormData.schoolEventType] || memoizedFormData.schoolEventType
                };

                console.log('🔄 Auto-saving school event data (10s debounce)...');
                await patch({ section: 'school-event', payload: transformedData });
                console.log('✅ Auto-save completed successfully');
            } catch (error) {
                console.error('Auto-save failed:', error);
                toast({
                    title: "Auto-save failed",
                    description: "Your changes may not have been saved. Please try again.",
                    variant: "destructive",
                });
            } finally {
                // Reset auto-saving flag
                isAutoSavingRef.current = false;
            }
        }, 10000); // 10 seconds debounce

        return () => {
            clearTimeout(timeoutId);
            isAutoSavingRef.current = false;
        };
    }, [memoizedFormData, draft, loading, patch, toast]);

    // Save function to persist data to database
    const handleSaveData = useCallback(async () => {
        // Prevent duplicate saves
        if (isSaving) {
            console.log('School event save already in progress, skipping duplicate call');
            return false;
        }

        setIsSaving(true);

        try {
            console.log('=== SCHOOL EVENT SAVE VALIDATION DEBUG ===');
            console.log('Local form data:', localFormData);

            // Validate required fields before saving
            const requiredFields = {
                schoolEventName: localFormData.schoolEventName,
                schoolVenue: localFormData.schoolVenue,
                schoolStartDate: localFormData.schoolStartDate,
                schoolEndDate: localFormData.schoolEndDate,
                schoolTimeStart: localFormData.schoolTimeStart,
                schoolTimeEnd: localFormData.schoolTimeEnd,
                schoolEventType: localFormData.schoolEventType,
                schoolEventMode: localFormData.schoolEventMode,
                schoolSDPCredits: localFormData.schoolSDPCredits,
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
                    schoolEventName: 'Event Name',
                    schoolVenue: 'Venue',
                    schoolStartDate: 'Start Date',
                    schoolEndDate: 'End Date',
                    schoolTimeStart: 'Start Time',
                    schoolTimeEnd: 'End Time',
                    schoolEventType: 'Event Type',
                    schoolEventMode: 'Event Mode',
                    schoolSDPCredits: 'SDP Credits'
                };

                const readableFieldNames = missingFields.map(([key]) => fieldNameMap[key] || key).join(', ');
                toast({
                    title: "Missing Required Fields",
                    description: `Please fill in: ${readableFieldNames}`,
                    variant: "destructive",
                });
                return false;
            }

            if (!localFormData.schoolTargetAudience || localFormData.schoolTargetAudience.length === 0) {
                toast({
                    title: "Missing Target Audience",
                    description: "Please select at least one target audience",
                    variant: "destructive",
                });
                return false;
            }

            // Save to database
            const result = await saveSchoolEventData(localFormData);
            const eventId = result.id || result._id || result.data?.id || result.data?._id || 'unknown';

            console.log('✅ School event data saved successfully with ID:', eventId);

            // Check if a new proposal was created due to previous denial
            const isNewProposal = result.data?.newProposal || result.newProposal;

            toast({
                title: "Data Saved Successfully",
                description: isNewProposal
                    ? `New proposal created and submitted for review. ID: ${eventId}`
                    : `School event data has been saved to the database. ID: ${eventId}`,
                variant: "default",
            });

            return true;
        } catch (error) {
            console.error('Error saving school event data:', error);
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

        console.log('=== SECTION 3 SCHOOL EVENT HANDLENEXT DEBUG ===');
        console.log('Local form data before sync:', localFormData);

        try {
            // Save to database
            const saveSuccess = await handleSaveData();

            if (saveSuccess) {
                console.log('✅ School event data saved successfully, proceeding to Section 5 (Reporting)');

                // Navigate directly to reporting section (Section 5)
                router.push(`/student-dashboard/submit-event/${draftId}/reporting`);
            } else {
                console.log('❌ Save failed, not proceeding to Section 5 (Reporting)');
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
        console.log('🔧 Auto-filling school event form with:', testData);

        // Update form data with test data
        setLocalFormData(prev => ({
            ...prev,
            ...testData
        }));

        // Update file previews
        setFilePreviews(prev => ({
            ...prev,
            schoolGPOAFile: testData.schoolGPOAFile?.name || "",
            schoolProposalFile: testData.schoolProposalFile?.name || ""
        }));

        // Clear validation errors
        setValidationErrors({});

        console.log('✅ Auto-fill completed');
    }, []);

    const handleClearFormData = useCallback(async () => {
        console.log('🔧 Clearing school event form');

        // Reset form data
        setLocalFormData({
            schoolEventName: "",
            schoolVenue: "",
            schoolStartDate: null,
            schoolEndDate: null,
            schoolTimeStart: "",
            schoolTimeEnd: "",
            schoolEventType: "",
            schoolEventMode: "",
            schoolSDPCredits: "",
            schoolTargetAudience: [],
            schoolGPOAFile: null,
            schoolProposalFile: null,
        });

        // Clear file previews
        setFilePreviews({
            schoolGPOAFile: "",
            schoolProposalFile: "",
        });

        // Clear validation errors
        setValidationErrors({});

        console.log('✅ Form cleared');
    }, []);

    const handleAutoFillAndSubmit = useCallback(async (testData) => {
        console.log('🔧 Auto-filling and submitting school event form');

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

    // Debug logging for loading state
    console.log('🔍 DEBUG SchoolEventPage loading state:');
    console.log('  - loading:', loading);
    console.log('  - draft:', draft);
    console.log('  - draftId:', draftId);
    console.log('  - should show skeleton:', loading || !draft);

    // 🔧 FIX: Always render the form, regardless of loading state
    // This ensures the form is always visible to the user
    if (loading && fallbackLoading !== false) {
        console.log('⏳ Loading state - but still rendering form with loading indicator');
        // Don't return early, just show loading indicator within the form
    }

    if (!draft) {
        console.log('⚠️ No draft available - showing form without draft data');
        // Continue to render the form even without draft data
    }

    console.log('✅ Rendering school event form');

    // 🔧 FALLBACK: Simple form that always renders
    const renderSimpleForm = () => (
        <div className="w-full max-w-3xl mx-auto p-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">School-Based Event Details</h1>
                <p className="text-gray-600 mb-6">Provide comprehensive details about your proposed school-based event.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event/Activity Name *
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Academic Competition"
                            value={localFormData.schoolEventName || ""}
                            onChange={(e) => setLocalFormData(prev => ({ ...prev, schoolEventName: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            School Venue *
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., School Auditorium, Gymnasium"
                            value={localFormData.schoolVenue || ""}
                            onChange={(e) => setLocalFormData(prev => ({ ...prev, schoolVenue: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handlePrevious}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Back to Section 2
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save & Continue to Section 5
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // 🔧 FALLBACK: If complex form fails, show simple form
    try {
        return (
            <>
                {/* Auto-Fill Debug Tool */}
                <AutoFillDebugger
                    onFillData={handleAutoFillData}
                    onClearData={handleClearFormData}
                    onFillAndSubmit={handleAutoFillAndSubmit}
                    isSubmitting={isSaving}
                />

                {/* 🔍 DEBUG: Show current state */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="w-full max-w-3xl mx-auto mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug Info:</h3>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <div>Loading: {loading ? 'true' : 'false'}</div>
                            <div>Fallback Loading: {fallbackLoading ? 'true' : 'false'}</div>
                            <div>Should Show Form: {shouldShowForm ? 'true' : 'false'}</div>
                            <div>Draft: {draft ? 'exists' : 'null'}</div>
                            <div>DraftId: {draftId}</div>
                            <div>Form Data Keys: {Object.keys(localFormData).join(', ')}</div>
                        </div>
                    </div>
                )}

                <Card className="w-full max-w-3xl mx-auto shadow-lg border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-xl font-bold text-cedo-blue dark:text-cedo-gold">
                                    School-Based Event Details
                                </CardTitle>
                                <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
                                    Provide comprehensive details about your proposed school-based event.
                                </CardDescription>
                                {loading && (
                                    <div className="flex items-center gap-2 mt-2 text-blue-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-sm">Loading draft data...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        {/* Fieldset for Basic Event Info */}
                        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
                            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Basic Information</legend>
                            <div className="space-y-2">
                                <Label htmlFor="schoolEventName" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                    Event/Activity Name <span className="text-red-500 ml-0.5">*</span>
                                </Label>
                                <Input
                                    id="schoolEventName"
                                    name="schoolEventName"
                                    value={localFormData.schoolEventName || ""}
                                    onChange={handleLocalInputChange}
                                    placeholder="e.g., Academic Competition"
                                    className={getFieldClasses("schoolEventName", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                                    required
                                />
                                {renderFieldError("schoolEventName")}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schoolVenue" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                    School Venue <span className="text-red-500 ml-0.5">*</span>
                                </Label>
                                <Input
                                    id="schoolVenue"
                                    name="schoolVenue"
                                    value={localFormData.schoolVenue || ""}
                                    onChange={handleLocalInputChange}
                                    placeholder="e.g., School Auditorium, Gymnasium"
                                    className={getFieldClasses("schoolVenue", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                                    required
                                />
                                {renderFieldError("schoolVenue")}
                            </div>
                        </fieldset>

                        {/* Fieldset for Date & Time */}
                        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
                            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Date & Time</legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                <DatePickerComponent
                                    label="Start Date"
                                    value={localFormData.schoolStartDate}
                                    onChange={handleDateChange}
                                    fieldName="schoolStartDate"
                                    required={true}
                                    error={validationErrors.schoolStartDate}
                                    placeholder="Pick a date"
                                />
                                <DatePickerComponent
                                    label="End Date"
                                    value={localFormData.schoolEndDate}
                                    onChange={handleDateChange}
                                    fieldName="schoolEndDate"
                                    required={true}
                                    error={validationErrors.schoolEndDate}
                                    placeholder="Pick a date"
                                />
                                <div className="space-y-2">
                                    <Label htmlFor="schoolTimeStart" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Start Time <span className="text-red-500 ml-0.5">*</span></Label>
                                    <Input
                                        id="schoolTimeStart"
                                        name="schoolTimeStart"
                                        type="time"
                                        value={localFormData.schoolTimeStart || ""}
                                        onChange={handleLocalInputChange}
                                        className={getFieldClasses("schoolTimeStart", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                                        required
                                    />
                                    {renderFieldError("schoolTimeStart")}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="schoolTimeEnd" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">End Time <span className="text-red-500 ml-0.5">*</span></Label>
                                    <Input
                                        id="schoolTimeEnd"
                                        name="schoolTimeEnd"
                                        type="time"
                                        value={localFormData.schoolTimeEnd || ""}
                                        onChange={handleLocalInputChange}
                                        className={getFieldClasses("schoolTimeEnd", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                                        required
                                    />
                                    {renderFieldError("schoolTimeEnd")}
                                </div>
                            </div>
                        </fieldset>

                        {/* Fieldset for Event Specifics */}
                        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
                            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Event Specifics</legend>
                            <div className="space-y-2">
                                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Type of Event <span className="text-red-500 ml-0.5">*</span></Label>
                                <RadioGroup
                                    value={localFormData.schoolEventType || ""}
                                    onValueChange={(value) => handleRadioChange("schoolEventType", value)}
                                    className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("schoolEventType", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
                                >
                                    {["Academic Competition", "Workshop/Seminar", "Cultural Event", "Sports Activity", "Leadership Training", "Community Service", "Career Guidance", "Health & Wellness", "Technology Workshop", "Environmental Awareness", "Other"].map(type => (
                                        <div className="flex items-center space-x-2" key={type}>
                                            <RadioGroupItem value={type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-').replace(/&/g, '-')} id={`school-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-').replace(/&/g, '-')}`} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                                            <Label htmlFor={`school-event-${type.toLowerCase().replace(/ /g, '-').replace(/\//g, '-').replace(/&/g, '-')}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{type}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {renderFieldError("schoolEventType")}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Target Audience <span className="text-red-500 ml-0.5">*</span></Label>
                                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("schoolTargetAudience", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}>
                                    {["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Leaders", "Alumni"].map((audience) => (
                                        <div className="flex items-center space-x-2" key={audience}>
                                            <Checkbox
                                                id={`school-audience-${audience}`}
                                                checked={localFormData.schoolTargetAudience?.includes(audience) || false}
                                                onCheckedChange={(checked) => handleTargetAudienceChange(audience, Boolean(checked))}
                                                className="data-[state=checked]:bg-cedo-blue dark:data-[state=checked]:bg-cedo-gold data-[state=checked]:border-transparent dark:border-gray-500"
                                            />
                                            <Label htmlFor={`school-audience-${audience}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{audience}</Label>
                                        </div>
                                    ))}
                                </div>
                                {renderFieldError("schoolTargetAudience")}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Mode of Event <span className="text-red-500 ml-0.5">*</span></Label>
                                <RadioGroup
                                    value={localFormData.schoolEventMode || ""}
                                    onValueChange={(value) => handleRadioChange("schoolEventMode", value)}
                                    className={`grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("schoolEventMode", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
                                >
                                    {["Online", "Offline", "Hybrid"].map(mode => (
                                        <div className="flex items-center space-x-2" key={mode}>
                                            <RadioGroupItem value={mode.toLowerCase()} id={`school-mode-${mode.toLowerCase()}`} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                                            <Label htmlFor={`school-mode-${mode.toLowerCase()}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{mode}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {renderFieldError("schoolEventMode")}
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">Number of SDP Credits <span className="text-red-500 ml-0.5">*</span></Label>
                                <RadioGroup
                                    value={String(localFormData.schoolSDPCredits || "")}
                                    onValueChange={(value) => handleRadioChange("schoolSDPCredits", value)}
                                    className={`grid grid-cols-2 gap-x-4 gap-y-2 pt-1 ${hasFieldError("schoolSDPCredits", validationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
                                >
                                    {["1", "2"].map(credit => (
                                        <div className="flex items-center space-x-2" key={credit}>
                                            <RadioGroupItem value={credit} id={`school-credit-${credit}`} className="text-cedo-blue dark:text-cedo-gold border-gray-400 dark:border-gray-500" />
                                            <Label htmlFor={`school-credit-${credit}`} className="font-normal text-gray-700 dark:text-gray-300 cursor-pointer">{credit}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {renderFieldError("schoolSDPCredits")}
                            </div>
                        </fieldset>

                        {/* Fieldset for Attachments */}
                        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
                            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">Attachments</legend>
                            {[
                                { label: "General Plan of Action (GPOA)", name: "schoolGPOAFile", type: "gpoa", hint: "Filename: OrganizationName_GPOA.pdf/docx/xlsx" },
                                { label: "Project Proposal Document", name: "schoolProposalFile", type: "proposal", hint: "Filename: OrganizationName_PP.pdf/docx/xlsx. Must include summary, objectives, timeline, budget." }
                            ].map(fileField => (
                                <div key={fileField.name} className="space-y-2">
                                    <Label htmlFor={fileField.name} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                        {fileField.label} <span className="text-red-500 ml-0.5">*</span>
                                    </Label>
                                    <div className={cn("mt-1 group relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ease-in-out hover:border-cedo-blue dark:border-gray-600 dark:hover:border-cedo-gold",
                                        hasFieldError(fileField.name, validationErrors) && "border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-600 bg-red-50 dark:bg-red-900/30",
                                        filePreviews[fileField.name] && !hasFieldError(fileField.name, validationErrors) && "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 hover:border-green-600 dark:hover:border-green-600"
                                    )}>
                                        <Label htmlFor={fileField.name} className="cursor-pointer w-full flex flex-col items-center justify-center">
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
                                        />
                                        {filePreviews[fileField.name] && (
                                            <Button type="button" variant="ghost" size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const inputElement = document.getElementById(fileField.name);
                                                    if (inputElement) inputElement.value = "";
                                                    setFilePreviews(prev => ({ ...prev, [fileField.name]: "" }));
                                                    setLocalFormData(prev => ({ ...prev, [fileField.name]: null }));
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
                            <Button variant="outline" onClick={handlePrevious} disabled={isSaving} className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-cedo-blue dark:focus:ring-cedo-gold">
                                Back to Section 2
                            </Button>
                            <Button variant="destructive" onClick={handleWithdraw} disabled={isSaving} className="w-full sm:w-auto">
                                Withdraw Proposal
                            </Button>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
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
                            <Button
                                onClick={handleNext}
                                disabled={isSaving}
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
    } catch (error) {
        console.error('❌ Error rendering complex form:', error);
        console.log('🔄 Falling back to simple form');
        return renderSimpleForm();
    }
}