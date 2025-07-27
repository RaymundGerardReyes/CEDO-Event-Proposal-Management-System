import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Custom hook to manage Section 3 state and data recovery
 */
export const useSection3State = (formData, disabled = false) => {
    const { toast } = useToast();
    const prevFormDataRef = useRef(null);
    const isInitializedRef = useRef(false);
    const componentMountedRef = useRef(false);
    const userInteractionRef = useRef(false);

    // 🔧 DEBUG: Log formData status
    useEffect(() => {
        console.log('useSection3State: formData status:', {
            isDefined: !!formData,
            keys: formData ? Object.keys(formData) : [],
            schoolEventName: formData?.schoolEventName
        });
    }, [formData]);

    // 🔧 CRITICAL FIX: Prevent auto-save during initial mount
    const [isInitialMount, setIsInitialMount] = useState(process.env.NODE_ENV !== 'test');

    // Recovery state
    const [localStorageFormData, setLocalStorageFormData] = useState(null);
    const [recoveryAttempted, setRecoveryAttempted] = useState(false);

    // Form state - ✅ REFACTORED: Aligned with MySQL proposals table schema
    const [localFormData, setLocalFormData] = useState({
        // Event Information (matches database column names exactly)
        event_name: formData?.event_name || "",
        event_venue: formData?.event_venue || "",
        event_start_date: formData?.event_start_date ? new Date(formData.event_start_date) : null,
        event_end_date: formData?.event_end_date ? new Date(formData.event_end_date) : null,
        event_start_time: formData?.event_start_time || "",
        event_end_time: formData?.event_end_time || "",
        event_mode: formData?.event_mode || "",

        // School Event Specific Fields
        school_event_type: formData?.school_event_type || "",
        school_return_service_credit: formData?.school_return_service_credit || "",
        school_target_audience: Array.isArray(formData?.school_target_audience) ? formData.school_target_audience : [],

        // File Upload Fields
        school_gpoa_file_name: formData?.school_gpoa_file_name || "",
        school_gpoa_file_path: formData?.school_gpoa_file_path || "",
        school_proposal_file_name: formData?.school_proposal_file_name || "",
        school_proposal_file_path: formData?.school_proposal_file_path || "",

        // Additional Fields
        objectives: formData?.objectives || "",
        budget: formData?.budget || "",
        volunteers_needed: formData?.volunteers_needed || "",

        // File objects for upload handling
        school_gpoa_file: formData?.school_gpoa_file || null,
        school_proposal_file: formData?.school_proposal_file || null,
    });

    const [filePreviews, setFilePreviews] = useState({
        school_gpoa_file: formData?.school_gpoa_file_name || "",
        school_proposal_file: formData?.school_proposal_file_name || "",
    });

    // Saving state
    const [isSaving, setIsSaving] = useState(false);

    // Component lifecycle management
    useEffect(() => {
        const mountId = Math.random().toString(36).substr(2, 9);
        console.log(`📦 Section3 MOUNT [${mountId}] - Component mounting`);
        componentMountedRef.current = true;

        // Mark initial mount period to prevent auto-saves
        setTimeout(() => {
            if (componentMountedRef.current) {
                setIsInitialMount(false);
                console.log('🔧 ANTI-AUTO-APPROVAL: Initial mount period ended - saves now allowed');
                console.log('✅ Section 3: Component ready for user interactions');
            }
        }, 500);

        return () => {
            console.log(`📦 Section3 UNMOUNT [${mountId}] - Component unmounting`);
            componentMountedRef.current = false;
        };
    }, []);

    // Data recovery effect
    useEffect(() => {
        if (isInitializedRef.current || !componentMountedRef.current) return;

        const needsRecovery = (!formData?.organizationName || !formData?.contactEmail) && typeof window !== 'undefined';

        console.log('🔧 RECOVERY CHECK:', {
            needsRecovery,
            hasOrgName: !!formData?.organizationName,
            hasContactEmail: !!formData?.contactEmail,
            recoveryAttempted,
            componentMounted: componentMountedRef.current,
            formDataKeys: Object.keys(formData || {})
        });

        if (needsRecovery && !recoveryAttempted) {
            console.log('🔄 RECOVERY: Attempting to recover missing organization data...');
            isInitializedRef.current = true;
            setRecoveryAttempted(true);

            setTimeout(async () => {
                try {
                    const possibleKeys = [
                        'eventProposalFormData',
                        'cedoFormData',
                        'formData',
                        'submitEventFormData'
                    ];

                    let recoveredData = null;

                    for (const key of possibleKeys) {
                        const savedData = localStorage.getItem(key);
                        if (savedData) {
                            try {
                                const parsedData = JSON.parse(savedData);
                                console.log(`🔍 RECOVERY: Checking ${key}:`, parsedData);

                                if (parsedData.organizationName && parsedData.contactEmail) {
                                    recoveredData = parsedData;
                                    console.log(`✅ RECOVERY: Found complete data in ${key}`);
                                    break;
                                }
                            } catch (parseError) {
                                console.warn(`Failed to parse ${key}:`, parseError);
                            }
                        }
                    }

                    // Database search fallback
                    if (!recoveredData && componentMountedRef.current) {
                        try {
                            console.log('🔄 RECOVERY: localStorage failed, trying database search...');
                            const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

                            const getAuthToken = () => {
                                if (typeof window !== 'undefined') {
                                    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
                                    if (cookieValue) {
                                        return cookieValue.split('=')[1];
                                    }
                                    return localStorage.getItem('cedo_token') || localStorage.getItem('token');
                                }
                                return null;
                            };

                            const token = getAuthToken();
                            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (userResponse.ok) {
                                const userData = await userResponse.json();
                                const userInfo = userData.user;

                                if (userInfo.organization && userInfo.email) {
                                    console.log('🔍 RECOVERY: Searching database for proposals...');
                                    const searchResponse = await fetch(`${API_BASE_URL}/proposals/search`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            organization_name: userInfo.organization,
                                            contact_email: userInfo.email
                                        })
                                    });

                                    if (searchResponse.ok) {
                                        const proposalData = await searchResponse.json();
                                        if (proposalData.id) {
                                            console.log('✅ RECOVERY: Found existing proposal in database:', proposalData);
                                            recoveredData = {
                                                organizationName: userInfo.organization,
                                                contactEmail: userInfo.email,
                                                contactName: userInfo.name,
                                                id: proposalData.id,
                                                proposalId: proposalData.id,
                                                organizationType: 'school-based',
                                                selectedEventType: 'school-based'
                                            };
                                        }
                                    }
                                }
                            }
                        } catch (dbError) {
                            console.warn('⚠️ RECOVERY: Database search failed:', dbError.message);
                        }
                    }

                    if (recoveredData && componentMountedRef.current) {
                        setLocalStorageFormData(recoveredData);
                        console.log('🔄 RECOVERY: Using recovered data for organization info (LOCAL ONLY - NO PARENT UPDATE)');
                        console.log('🔄 RECOVERY: Recovered data:', {
                            organizationName: recoveredData.organizationName,
                            contactEmail: recoveredData.contactEmail,
                            proposalId: recoveredData.id || recoveredData.proposalId
                        });
                    } else if (!recoveredData) {
                        console.warn('⚠️ RECOVERY: No complete organization data found in localStorage or database');
                        if (componentMountedRef.current) {
                            toast({
                                title: "Organization Data Required",
                                description: "Please complete Section 2 (Organization Information) before proceeding with Section 3.",
                                variant: "default",
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ RECOVERY: Failed to recover data:', error);
                }
            }, 0);
        }
    }, []);

    // Sync local form data when formData prop changes
    useEffect(() => {
        setLocalFormData({
            schoolEventName: formData.schoolEventName || "",
            schoolVenue: formData.schoolVenue || "",
            schoolStartDate: formData.schoolStartDate ? new Date(formData.schoolStartDate) : null,
            schoolEndDate: formData.schoolEndDate ? new Date(formData.schoolEndDate) : null,
            schoolTimeStart: formData.schoolTimeStart || "",
            schoolTimeEnd: formData.schoolTimeEnd || "",
            schoolEventType: formData.schoolEventType || "",
            schoolEventMode: formData.schoolEventMode || "",
            schoolReturnServiceCredit: formData.schoolReturnServiceCredit || "",
            schoolTargetAudience: formData.schoolTargetAudience || [],
            schoolGPOAFile: formData.schoolGPOAFile || null,
            schoolProposalFile: formData.schoolProposalFile || null,
        });
        setFilePreviews({
            schoolGPOAFile: formData.schoolGPOAFile?.name || "",
            schoolProposalFile: formData.schoolProposalFile?.name || "",
        });
    }, [formData]);

    // Memoized values
    const proposalIdForFiles = useMemo(() => {
        return formData.proposalId || formData.id || formData._id || formData.submissionId || null;
    }, [formData.proposalId, formData.id, formData._id, formData.submissionId]);

    const organizationDataForFiles = useMemo(() => {
        return {
            organizationName: formData.organizationName,
            contactEmail: formData.contactEmail
        };
    }, [formData.organizationName, formData.contactEmail]);

    return {
        // State
        localFormData,
        setLocalFormData,
        filePreviews,
        setFilePreviews,
        isSaving,
        setIsSaving,
        isInitialMount,
        localStorageFormData,
        recoveryAttempted,

        // Refs
        componentMountedRef,
        userInteractionRef,

        // Memoized values
        proposalIdForFiles,
        organizationDataForFiles,

        // Utility functions
        toast
    };
}; 