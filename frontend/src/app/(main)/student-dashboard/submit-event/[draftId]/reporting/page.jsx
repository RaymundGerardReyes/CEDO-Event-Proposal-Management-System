/**
 * Section 5 Reporting - Main Orchestrator Component
 * Replaces the monolithic Section5_Reporting.jsx with a clean, modular architecture
 */

"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/student/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from "react";
import EnhancedLoadingPage from "./components/EnhancedLoadingPage.jsx";
import ReportingErrorBoundary from "./components/ReportingErrorBoundary.jsx";
import ReportingForm from "./components/ReportingForm.jsx";
import ReportingLocked from "./components/ReportingLocked.jsx";
import { useAutoSave } from "./hooks/useAutoSave.js";
import { useProposalData } from "./hooks/useProposalData.js";
import { saveReportingData, submitFinalReport } from "./utils/api.js";
import { createFormDataPayload } from "./utils/helpers.js";

/**
 * Main Section 5 Reporting orchestrator component
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data from parent
 * @param {Function} props.updateFormData - Callback to update parent form data
 * @param {Function} props.onSubmit - Submission callback
 * @param {Function} props.onPrevious - Previous button callback
 * @param {boolean} props.disabled - Whether component is disabled
 * @param {Object} props.sectionsComplete - Sections completion status
 * @returns {JSX.Element} Section 5 reporting component
 */
export const Section5_Reporting = ({
    formData: initialFormData = {},
    updateFormData = () => { },
    onSubmit = () => { },
    onPrevious = () => { },
    disabled = false,
    sectionsComplete = {}
}) => {
    // Form submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Use proposal data hook for data management
    const proposalDataState = useProposalData(initialFormData, updateFormData);
    const {
        data: effectiveFormData,
        status,
        isApproved,
        proposalId,
        error,
        dataRecoveryStatus,
        recoveryAttempts,
        maxRecoveryAttempts,
        isCheckingStatus,
        isRecovering,
        lastChecked,
        proposalStatus,
        updateLocalFormData,
        refreshStatus,
        resetRecovery,
        refetch
    } = proposalDataState;

    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams(); // ✅ Next.js 15 FIX: Use useParams() hook for client components
    const [proposalData, setProposalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState(null);

    // Extract parameters from URL and props (Next.js 15 compatible)
    const mode = initialFormData.mode || searchParams.get('mode');
    const source = initialFormData.source || searchParams.get('source');
    const draftId = initialFormData.draftId || params?.draftId;
    const proposalIdFromProps = initialFormData.proposalId;

    // Check if this is review mode
    const isReviewMode = mode === 'review' && (proposalId || proposalIdFromProps);
    const isReviewDraft = draftId?.startsWith('review-');

    console.log('📊 Reporting page loaded:', {
        mode,
        proposalId: proposalId || proposalIdFromProps,
        source,
        draftId,
        isReviewMode,
        isReviewDraft
    });

    // Fetch proposal data
    useEffect(() => {
        // ✅ REACT 18/NEXT.JS 15 FIX: Wrap async operations to prevent uncached promise errors
        let isMounted = true;

        const fetchProposalData = async () => {
            const effectiveProposalId = proposalId || proposalIdFromProps;
            if (!isReviewMode || !effectiveProposalId) {
                // For normal flow, try to get draft data
                if (isMounted) {
                    setLoading(false);
                }
                return;
            }

            try {
                if (isMounted) {
                    setLoading(true);
                    setSubmitError(null);
                }

                // Get stored proposal data from localStorage first
                const storedData = localStorage.getItem('currentDraft');
                if (storedData && isMounted) {
                    const parsed = JSON.parse(storedData);
                    console.log('📦 Found stored proposal data:', parsed);
                    setProposalData(parsed);
                }

                // TODO: Fetch fresh data from API based on proposalId and source
                // const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                // const response = await fetch(`${backend}/api/proposals/${effectiveProposalId}?source=${source}`);
                // if (response.ok) {
                //   const data = await response.json();
                //   if (isMounted) setProposalData(data);
                // }

            } catch (err) {
                console.error('❌ Error fetching proposal data:', err);
                if (isMounted) {
                    setSubmitError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // ✅ Execute async function safely
        fetchProposalData().catch(err => {
            console.error('❌ Unhandled error in fetchProposalData:', err);
            if (isMounted) {
                setSubmitError('Failed to load proposal data');
                setLoading(false);
            }
        });

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [isReviewMode, proposalId, proposalIdFromProps, source]);

    /**
     * Auto-save function that integrates with the API
     * ✅ REACT 18/NEXT.JS 15 FIX: Proper error handling for async operations
     */
    const autoSaveFunction = useCallback(async (dataToSave) => {
        try {
            const effectiveProposalId = proposalId || proposalIdFromProps;
            const proposalIdToUse = dataToSave.id || dataToSave.proposalId || dataToSave.organization_id || effectiveProposalId;

            if (!proposalIdToUse) {
                throw new Error('No proposal ID available for auto-save');
            }

            if (!dataToSave.organizationName) {
                throw new Error('Missing organization name - skipping auto-save');
            }

            if (!dataToSave.event_status || String(dataToSave.event_status).trim() === '') {
                throw new Error('Missing event_status - required field cannot be empty');
            }

            console.log('💾 ORCHESTRATOR: Auto-saving data for proposal:', proposalIdToUse);

            const formDataPayload = createFormDataPayload(dataToSave, proposalIdToUse, {});
            const result = await saveReportingData(formDataPayload);

            // Update form data with server response
            if (result.verified_data) {
                const updatedData = { ...dataToSave, ...result.verified_data };
                updateFormData(updatedData);

                // Update localStorage safely
                try {
                    localStorage.setItem('eventProposalFormData', JSON.stringify(updatedData));
                } catch (lsError) {
                    console.warn('Could not update localStorage after auto-save:', lsError);
                }
            }

            return result;
        } catch (error) {
            console.error('❌ Auto-save error:', error);
            throw error; // Re-throw to be handled by the auto-save hook
        }
    }, [proposalId, proposalIdFromProps, updateFormData]);

    // Initialize auto-save hook
    const autoSaveState = useAutoSave(autoSaveFunction, 1000);
    const { debouncedSave, cancelSave } = autoSaveState;

    /**
     * Handle field changes with auto-save
     */
    const handleFieldChange = useCallback((fieldName, value) => {
        if (disabled) return;

        console.log(`🔄 ORCHESTRATOR: Field change: ${fieldName}: ${value}`);

        // Update local state immediately
        updateLocalFormData({ [fieldName]: value });

        // Create new complete form data
        const newFormData = { ...effectiveFormData, [fieldName]: value };

        // Update parent component state
        updateFormData(newFormData);

        // Clear any previous save errors
        autoSaveState.clearSaveError();

        // Trigger debounced auto-save if conditions are met
        if (isApproved && value && String(value).trim() !== '' && newFormData.event_status) {
            console.log('🔄 ORCHESTRATOR: Triggering auto-save for:', fieldName);
            debouncedSave(newFormData);
        } else if (!isApproved) {
            console.log('⚠️ ORCHESTRATOR: Skipping auto-save: proposal not approved');
        } else if (!newFormData.event_status) {
            console.log('⚠️ ORCHESTRATOR: Skipping auto-save: event_status required');
        } else {
            console.log('⚠️ ORCHESTRATOR: Skipping auto-save: empty value');
        }
    }, [disabled, effectiveFormData, updateLocalFormData, updateFormData, autoSaveState, isApproved, debouncedSave]);

    /**
     * Handle final form submission
     * ✅ REACT 18/NEXT.JS 15 FIX: Proper async error handling
     */
    const handleSubmit = useCallback(async (uploadedFiles = {}) => {
        console.log('📋 ORCHESTRATOR: Starting final submission');

        try {
            // Cancel any pending auto-save
            cancelSave();

            setIsSubmitting(true);
            setSubmitSuccess(false);

            const effectiveProposalId = proposalId || proposalIdFromProps;
            const proposalIdToUse = effectiveFormData.id || effectiveFormData.proposalId || effectiveFormData.organization_id || effectiveProposalId;

            if (!proposalIdToUse) {
                throw new Error('No proposal ID available for final submission');
            }

            const formDataPayload = createFormDataPayload(effectiveFormData, proposalIdToUse, uploadedFiles);
            const result = await submitFinalReport(formDataPayload);

            console.log('✅ ORCHESTRATOR: Final submission successful:', result);

            const updatedState = {
                ...effectiveFormData,
                ...result.verified_data,
                submissionComplete: true,
                lastSubmitted: new Date().toISOString()
            };

            // Update localStorage safely
            try {
                localStorage.setItem('eventProposalFormData', JSON.stringify(updatedState));
            } catch (lsError) {
                console.warn('Could not update localStorage after submission:', lsError);
            }

            updateFormData(updatedState);
            setSubmitSuccess(true);
            onSubmit({ success: true, data: result });

        } catch (error) {
            console.error('❌ ORCHESTRATOR: Final submission failed:', error);
            setSubmitSuccess(false);
            onSubmit({ success: false, error: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }, [cancelSave, effectiveFormData, proposalId, proposalIdFromProps, updateFormData, onSubmit]);

    /**
     * Debug and recovery action handlers
     */
    const handleDebugRecovery = useCallback(() => {
        console.log('🐛 ORCHESTRATOR: Manual debug recovery triggered');
        console.log('🐛 Complete effective form data:', JSON.stringify(effectiveFormData, null, 2));
        console.log('🐛 Recovery status:', dataRecoveryStatus);
        console.log('🐛 Proposal status data:', proposalDataState);

        // Retry data recovery
        resetRecovery();
    }, [effectiveFormData, dataRecoveryStatus, proposalDataState, resetRecovery]);

    const handleManualRecovery = useCallback(() => {
        console.log('🔧 ORCHESTRATOR: Manual recovery from localStorage');

        const storageKeys = [
            'eventProposalFormData',
            'cedoFormData',
            'formData',
            'submitEventFormData'
        ];

        let bestData = null;
        let bestScore = 0;

        for (const key of storageKeys) {
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    let score = 0;
                    if (parsed.organizationName) score += 20;
                    if (parsed.contactEmail) score += 20;
                    if (parsed.id || parsed.proposalId) score += 10;
                    if (parsed.schoolEventName || parsed.communityEventName) score += 5;
                    score += Object.keys(parsed).length;

                    if (score > bestScore) {
                        bestScore = score;
                        bestData = parsed;
                    }
                }
            } catch (error) {
                console.warn(`Failed to parse ${key}:`, error);
            }
        }

        if (bestData && bestData.organizationName && bestData.contactEmail) {
            console.log('✅ ORCHESTRATOR: Found complete data!', bestData);
            updateFormData(bestData);
            refreshStatus();
        } else {
            console.error('❌ ORCHESTRATOR: No complete data found');
            alert('No complete proposal data found. Please complete Sections 2-3 first.');
        }
    }, [updateFormData, refreshStatus]);

    const handleEmergencyBypass = useCallback(() => {
        console.log('🚨 ORCHESTRATOR: Emergency bypass activated');

        // Use known working proposal data
        const bypassData = {
            organizationName: 'XCEL',
            contactEmail: 'test@example.com',
            id: 85,
            proposalId: 85,
            organization_id: 85,
            schoolEventName: 'Test School Event',
            schoolVenue: 'School Auditorium',
            schoolStartDate: '2024-01-15',
            schoolEndDate: '2024-01-16',
            organizationType: 'school-based',
            organizationTypes: ['school-based']
        };

        updateFormData(bypassData);

        // Force approval status
        setTimeout(() => {
            refreshStatus();
        }, 100);

        console.log('✅ ORCHESTRATOR: Emergency bypass completed');
    }, [updateFormData, refreshStatus]);

    // Handle navigation back to previous section
    const handlePrevious = () => {
        if (isReviewMode) {
            // Go back to drafts page in review mode
            router.push('/student-dashboard/drafts');
        } else {
            // Normal flow: go to previous section
            router.push(`/student-dashboard/submit-event/${draftId}/community-event`);
        }
    };

    /**
     * Refresh proposal status
     * ✅ REACT 18/NEXT.JS 15 FIX: Proper async error handling
     */
    const handleRefreshStatus = useCallback(async () => {
        try {
            setLoading(true);
            setSubmitError(null);

            const effectiveProposalId = proposalId || proposalIdFromProps;
            if (!effectiveProposalId) {
                throw new Error('No proposal ID available for status refresh');
            }

            // TODO: Implement actual status refresh API call
            console.log('🔄 Refreshing status for proposal:', effectiveProposalId);

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For now, just reload the component state
            const storedData = localStorage.getItem('eventProposalFormData');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                updateFormData(parsed);
            }

        } catch (error) {
            console.error('❌ Error refreshing status:', error);
            setSubmitError(error.message);
        } finally {
            setLoading(false);
        }
    }, [proposalId, proposalIdFromProps, updateFormData]);

    // Handle force refresh
    const handleForceRefresh = () => {
        window.location.reload();
    };

    /**
     * Conditional rendering based on status
     */

    // Loading state
    if (loading) {
        return (
            <EnhancedLoadingPage
                message="Loading Proposal Data..."
                showProgress={true}
                estimatedTime={5000}
            />
        );
    }

    if (submitError) {
        return (
            <Alert variant="destructive" className="max-w-4xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Proposal</AlertTitle>
                <AlertDescription>
                    {submitError}
                </AlertDescription>
            </Alert>
        );
    }

    // Review mode: Show locked state with admin comments
    if (isReviewMode) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Review Mode Header */}
                <Alert className="mb-6">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Review Mode</AlertTitle>
                    <AlertDescription>
                        You are reviewing a {proposalData?.status || 'rejected'} proposal.
                        {proposalData?.name && ` Proposal: "${proposalData.name}"`}
                    </AlertDescription>
                </Alert>

                <ReportingLocked
                    proposalStatus={proposalData?.status || 'rejected'}
                    proposalId={proposalId || proposalIdFromProps}
                    isCheckingStatus={false}
                    lastChecked={new Date().toISOString()}
                    error={null}
                    dataRecoveryStatus="success"
                    formData={proposalData || {}}
                    onRefreshStatus={handleRefreshStatus}
                    onForceRefresh={handleForceRefresh}
                    onPrevious={handlePrevious}
                />
            </div>
        );
    }

    // Normal mode: Check if proposal is approved
    if (!isApproved) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <ReportingLocked
                    proposalStatus={proposalData?.status || 'pending'}
                    proposalId={proposalData?.id}
                    isCheckingStatus={false}
                    lastChecked={new Date().toISOString()}
                    error={null}
                    dataRecoveryStatus="success"
                    formData={proposalData || {}}
                    onRefreshStatus={handleRefreshStatus}
                    onForceRefresh={handleForceRefresh}
                    onPrevious={handlePrevious}
                />
            </div>
        );
    }

    // Approved proposal: Show reporting form
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Section 5 of 5: Documentation & Accomplishment Reports
                    </CardTitle>
                    <CardDescription>
                        Your proposal has been approved! Please upload your documentation and accomplishment reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportingForm
                        formData={effectiveFormData}
                        onFieldChange={handleFieldChange}
                        onSubmit={handleSubmit}
                        onPrevious={handlePrevious}
                        disabled={disabled}
                        isSubmitting={isSubmitting}
                        submitSuccess={submitSuccess}
                        autoSaveState={autoSaveState}
                        proposalId={proposalId || proposalIdFromProps}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

// ✅ Next.js 15 FIX: Simplified server/client component wrapper
// Remove async server component to avoid conflicts with client components

// Enhanced loading component for Suspense boundary
function ReportingPageLoading() {
    return (
        <EnhancedLoadingPage
            message="Loading Reporting Section..."
            showProgress={true}
            estimatedTime={15000}
        />
    );
}

// Main page component with Suspense boundary
export default function ReportingPage({ params, searchParams }) {
    return (
        <ReportingErrorBoundary>
            <Suspense fallback={<ReportingPageLoading />}>
                <ReportingPageClient params={params} searchParams={searchParams} />
            </Suspense>
        </ReportingErrorBoundary>
    );
}

// Client component wrapper that handles async params
function ReportingPageClient({ params, searchParams }) {
    const [resolvedParams, setResolvedParams] = useState(null);
    const [resolvedSearchParams, setResolvedSearchParams] = useState(null);
    const [isResolving, setIsResolving] = useState(true);

    // ✅ REACT 18/NEXT.JS 15 FIX: Resolve async params in useEffect
    useEffect(() => {
        const resolveParams = async () => {
            try {
                const [resolvedP, resolvedSP] = await Promise.all([
                    Promise.resolve(params),
                    Promise.resolve(searchParams)
                ]);

                setResolvedParams(resolvedP);
                setResolvedSearchParams(resolvedSP);

                console.log('🏗️ ReportingPageClient resolved params:', {
                    draftId: resolvedP?.draftId,
                    mode: resolvedSP?.mode,
                    proposalId: resolvedSP?.proposalId,
                    source: resolvedSP?.source
                });
            } catch (error) {
                console.error('❌ Error resolving params:', error);
            } finally {
                setIsResolving(false);
            }
        };

        resolveParams();
    }, [params, searchParams]);

    // Show loading while resolving params
    if (isResolving || !resolvedParams) {
        return (
            <EnhancedLoadingPage
                message="Initializing Reporting Section..."
                showProgress={true}
                estimatedTime={3000}
            />
        );
    }

    // Extract values for the main component
    const draftId = resolvedParams.draftId;
    const mode = resolvedSearchParams?.mode;
    const proposalId = resolvedSearchParams?.proposalId;
    const source = resolvedSearchParams?.source;
    const parsedProposalId = proposalId ? String(proposalId) : null;

    console.log('🔧 ReportingPageClient rendering with:', {
        draftId,
        mode,
        proposalId: parsedProposalId,
        source
    });

    return (
        <ReportingErrorBoundary>
            <Section5_Reporting
                formData={{
                    draftId,
                    mode,
                    proposalId: parsedProposalId,
                    source
                }}
                updateFormData={() => { }}
                onSubmit={() => { }}
                onPrevious={() => { }}
                disabled={false}
                sectionsComplete={{}}
            />
        </ReportingErrorBoundary>
    );
}

