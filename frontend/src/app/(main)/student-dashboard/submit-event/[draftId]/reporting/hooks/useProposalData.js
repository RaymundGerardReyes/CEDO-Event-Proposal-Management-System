/**
 * Custom Hook for Proposal Data Management
 * Handles data fetching, recovery, status checking, and state management
 * Extracted from monolithic component for better separation of concerns
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchProposalStatus, recoverFormData } from "../utils/api.js";
import { hasMinimumRequiredData, mergeFormData } from "../utils/helpers.js";

/**
 * Custom hook for managing proposal data, status, and recovery
 * @param {Object} initialFormData - Initial form data from props
 * @param {Function} updateFormData - Callback to update parent form data
 * @returns {Object} Proposal data state and control functions
 */
export const useProposalData = (initialFormData = {}, updateFormData = () => { }) => {
    // Core state management
    const [localFormData, setLocalFormData] = useState({});
    const [recoveredFormData, setRecoveredFormData] = useState(null);

    // Status management
    const [proposalStatusData, setProposalStatusData] = useState({
        status: 'loading',
        isApproved: false,
        proposalId: null,
        lastChecked: null,
        error: null,
        proposalData: {}
    });

    // Recovery management
    const [dataRecoveryStatus, setDataRecoveryStatus] = useState('checking');
    const [recoveryAttempts, setRecoveryAttempts] = useState(0);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [initialStatusChecked, setInitialStatusChecked] = useState(false);

    // Constants
    const maxRecoveryAttempts = 3;
    const lastStatusCheckRef = useRef(0);
    const checkProposalStatusRef = useRef(null);

    /**
     * Compute effective form data with proper priority merging
     */
    const effectiveFormData = useMemo(() => {
        const merged = mergeFormData(initialFormData, recoveredFormData, localFormData);

        console.log('📊 HOOK: Effective form data composition:', {
            baseSource: recoveredFormData ? 'recovered' : 'props',
            localOverrides: Object.keys(localFormData).length,
            totalFields: Object.keys(merged).length
        });

        return merged;
    }, [initialFormData, recoveredFormData, localFormData]);

    /**
     * Check if proposal is approved from multiple sources
     */
    const isProposalApproved = useMemo(() => {
        const approved = proposalStatusData.isApproved ||
            effectiveFormData.proposalStatus === "approved" ||
            initialFormData?.proposalStatus === "approved";

        console.log('🔍 HOOK: Approval Status Check:', {
            databaseStatus: proposalStatusData.status,
            databaseApproved: proposalStatusData.isApproved,
            effectiveStatus: effectiveFormData?.proposalStatus,
            originalStatus: initialFormData?.proposalStatus,
            finalApproved: approved,
            dataSource: recoveredFormData ? 'Recovered' : 'Provided'
        });

        return approved;
    }, [proposalStatusData.isApproved, proposalStatusData.status, effectiveFormData, initialFormData?.proposalStatus, recoveredFormData]);

    /**
     * Recover missing form data with retry logic
     */
    const recoverMissingFormData = useCallback(async () => {
        if (recoveryAttempts >= maxRecoveryAttempts) {
            console.warn('🛑 HOOK: Maximum recovery attempts reached');
            setDataRecoveryStatus('disabled');
            return null;
        }

        const currentData = initialFormData || {};
        if (hasMinimumRequiredData(currentData)) {
            console.log('✅ HOOK: Sufficient data already available');
            setDataRecoveryStatus('success');
            setRecoveredFormData(currentData);
            return currentData;
        }

        console.log(`🔄 HOOK: Starting recovery attempt ${recoveryAttempts + 1}/${maxRecoveryAttempts}`);
        setRecoveryAttempts(prev => prev + 1);
        setDataRecoveryStatus('checking');

        try {
            const recoveredData = await recoverFormData(currentData, recoveryAttempts + 1);

            if (recoveredData && hasMinimumRequiredData(recoveredData)) {
                console.log('✅ HOOK: Recovery successful');
                setRecoveredFormData(recoveredData);
                setDataRecoveryStatus('success');

                // Update parent form data
                if (typeof updateFormData === 'function') {
                    updateFormData({ ...recoveredData });
                }

                return recoveredData;
            } else {
                console.warn(`⚠️ HOOK: Recovery attempt ${recoveryAttempts + 1} failed`);

                if (recoveryAttempts + 1 >= maxRecoveryAttempts) {
                    setDataRecoveryStatus('failed');
                } else {
                    setDataRecoveryStatus('checking');
                }

                return null;
            }
        } catch (error) {
            console.error('❌ HOOK: Recovery error:', error.message);

            if (recoveryAttempts + 1 >= maxRecoveryAttempts) {
                setDataRecoveryStatus('failed');
            }

            return null;
        }
    }, [initialFormData, updateFormData, recoveryAttempts, maxRecoveryAttempts]);

    /**
     * Check proposal status with throttling
     */
    const checkProposalStatus = useCallback(async () => {
        // Throttle: Skip if last check was less than 10s ago
        const now = Date.now();
        if (now - lastStatusCheckRef.current < 10000) {
            console.log('⏳ HOOK: Throttling proposal status check');
            return;
        }
        lastStatusCheckRef.current = now;

        setIsCheckingStatus(true);
        console.log('🔍 HOOK: Checking proposal status...');

        try {
            const effectiveData = effectiveFormData;

            if (!hasMinimumRequiredData(effectiveData)) {
                console.warn('⚠️ HOOK: Insufficient data for status check');
                setProposalStatusData({
                    status: 'no-data',
                    isApproved: false,
                    proposalId: null,
                    lastChecked: new Date().toISOString(),
                    error: 'Insufficient data for status check. Please complete Sections 2-3 first.',
                    proposalData: null
                });
                setIsCheckingStatus(false);
                return;
            }

            console.log('🔍 HOOK: Using effective form data for status check:', {
                keys: Object.keys(effectiveData),
                organizationName: effectiveData.organizationName,
                contactEmail: effectiveData.contactEmail,
                proposalId: effectiveData.id || effectiveData.proposalId,
                isRecovered: !!recoveredFormData
            });

            const statusResult = await fetchProposalStatus(effectiveData);

            if (statusResult.success) {
                const isApproved = statusResult.proposalStatus === 'approved';

                setProposalStatusData({
                    status: statusResult.proposalStatus,
                    isApproved: isApproved,
                    proposalId: statusResult.proposalId,
                    lastChecked: statusResult.lastUpdated,
                    error: null,
                    proposalData: statusResult.proposalData
                });

                // Keep parent formData in sync
                if (typeof updateFormData === 'function' && effectiveFormData.proposalStatus !== statusResult.proposalStatus) {
                    updateFormData({ proposalStatus: statusResult.proposalStatus });
                }

                console.log(`✅ HOOK: Proposal status: ${statusResult.proposalStatus} (approved: ${isApproved})`);
            } else {
                setProposalStatusData({
                    status: 'error',
                    isApproved: false,
                    proposalId: null,
                    lastChecked: new Date().toISOString(),
                    error: statusResult.error,
                    proposalData: null
                });

                console.error('❌ HOOK: Failed to get proposal status:', statusResult.error);
            }
        } catch (error) {
            console.error('❌ HOOK: Error checking proposal status:', error);
            setProposalStatusData({
                status: 'error',
                isApproved: false,
                proposalId: null,
                lastChecked: new Date().toISOString(),
                error: error.message,
                proposalData: null
            });
        } finally {
            setIsCheckingStatus(false);
        }
    }, [effectiveFormData, recoveredFormData, updateFormData]);

    /**
     * Force refresh status check
     */
    const refreshStatus = useCallback(() => {
        console.log('🔄 HOOK: Force refreshing proposal status');
        lastStatusCheckRef.current = 0; // Reset throttle
        checkProposalStatus();
    }, [checkProposalStatus]);

    /**
     * Update local form data
     */
    const updateLocalFormData = useCallback((updates) => {
        console.log('🔄 HOOK: Updating local form data:', Object.keys(updates));
        setLocalFormData(prev => ({ ...prev, ...updates }));
    }, []);

    /**
     * Reset recovery state for manual retry
     */
    const resetRecovery = useCallback(() => {
        console.log('🔄 HOOK: Resetting recovery state');
        setRecoveryAttempts(0);
        setDataRecoveryStatus('checking');
        setRecoveredFormData(null);
    }, []);

    // Auto-trigger recovery when needed
    useEffect(() => {
        const needsRecovery = !hasMinimumRequiredData(initialFormData);
        const canAttemptRecovery = dataRecoveryStatus === 'checking' &&
            recoveryAttempts < maxRecoveryAttempts &&
            !recoveredFormData;

        if (needsRecovery && canAttemptRecovery) {
            console.log('🔄 HOOK: Data recovery needed and allowed');
            recoverMissingFormData();
        } else if (!needsRecovery && dataRecoveryStatus === 'checking') {
            console.log('✅ HOOK: Sufficient data available');
            setDataRecoveryStatus('success');
            setRecoveredFormData(initialFormData);
        }
    }, [initialFormData, dataRecoveryStatus, recoveryAttempts, recoveredFormData, recoverMissingFormData]);

    // Check status when data recovery completes
    useEffect(() => {
        const data = effectiveFormData;

        if (dataRecoveryStatus === 'success' && hasMinimumRequiredData(data) && !initialStatusChecked) {
            console.log('🔍 HOOK: Initial recovery successful, triggering status check');
            checkProposalStatus();
            setInitialStatusChecked(true);
        } else if (dataRecoveryStatus === 'failed') {
            console.log('⚠️ HOOK: Data recovery failed, cannot check status');
            setProposalStatusData({
                status: 'no-data',
                isApproved: false,
                proposalId: null,
                lastChecked: new Date().toISOString(),
                error: 'Unable to recover organization data after multiple attempts. Please start from Section 2.',
                proposalData: null
            });
        }
    }, [dataRecoveryStatus, effectiveFormData, checkProposalStatus, initialStatusChecked]);

    // Keep ref to latest check function for auto-refresh
    useEffect(() => {
        checkProposalStatusRef.current = checkProposalStatus;
    });

    // Auto-refresh status every 30 seconds if not approved
    useEffect(() => {
        let refreshInterval;

        if (dataRecoveryStatus === 'success' && !isProposalApproved) {
            console.log('🔄 HOOK: Setting up auto-refresh for proposal status (every 30s)');
            refreshInterval = setInterval(() => {
                console.log('🔄 HOOK: Auto-refreshing proposal status');
                checkProposalStatusRef.current();
            }, 30000);
        }

        return () => {
            if (refreshInterval) {
                console.log('🔄 HOOK: Clearing auto-refresh interval');
                clearInterval(refreshInterval);
            }
        };
    }, [dataRecoveryStatus, isProposalApproved]);

    /**
     * Determine overall status for UI rendering
     */
    const overallStatus = useMemo(() => {
        if ((proposalStatusData.status === 'loading' || isCheckingStatus) &&
            dataRecoveryStatus !== 'failed' &&
            dataRecoveryStatus !== 'disabled') {
            return 'loading';
        }

        if (proposalStatusData.status === 'error' ||
            proposalStatusData.status === 'no-data' ||
            proposalStatusData.status === 'recovery-failed' ||
            dataRecoveryStatus === 'disabled' ||
            dataRecoveryStatus === 'failed') {
            return 'error';
        }

        if (!isProposalApproved) {
            return 'locked';
        }

        return 'success';
    }, [proposalStatusData.status, isCheckingStatus, dataRecoveryStatus, isProposalApproved]);

    return {
        // Data
        data: effectiveFormData,
        localFormData,
        recoveredFormData,

        // Status
        status: overallStatus,
        proposalStatus: proposalStatusData.status,
        isApproved: isProposalApproved,
        proposalId: proposalStatusData.proposalId,

        // Recovery info
        dataRecoveryStatus,
        recoveryAttempts,
        maxRecoveryAttempts,

        // Loading states
        isCheckingStatus,
        isRecovering: dataRecoveryStatus === 'checking',

        // Error info
        error: proposalStatusData.error,
        lastChecked: proposalStatusData.lastChecked,

        // Actions
        updateLocalFormData,
        refreshStatus,
        resetRecovery,
        refetch: checkProposalStatus,

        // Debug info
        proposalData: proposalStatusData.proposalData,
        initialStatusChecked
    };
};

export default useProposalData; 