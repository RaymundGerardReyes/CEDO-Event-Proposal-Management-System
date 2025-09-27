/**
 * Proposal Service - API functions for proposal management
 * Provides functions for draft management, proposal submission, and status checking
 */

import { getAppConfig } from '@/lib/utils';
import { api } from '@/utils/api';

// Get authentication token from localStorage or cookies
const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cedo_token') ||
        document.cookie.split('; ').find(row => row.startsWith('cedo_token='))?.split('=')[1];
};

/**
 * Get drafts and rejected proposals for the current user
 */
export const getDraftsAndRejected = async (options = {}) => {
    try {
        const { includeRejected = true, limit = 100, offset = 0 } = options;
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        const response = await api.get('/proposals/user-proposals', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.success && response.data?.proposals) {
            let filteredProposals = response.data.proposals;

            if (!includeRejected) {
                filteredProposals = response.data.proposals.filter(p =>
                    !['denied', 'rejected', 'revision_requested'].includes(p.proposal_status)
                );
            }

            return {
                success: true,
                data: filteredProposals.slice(offset, offset + limit),
                metadata: {
                    total: filteredProposals.length,
                    limit,
                    offset,
                    hasMore: filteredProposals.length > offset + limit
                }
            };
        }

        return { success: false, message: 'No proposals found' };
    } catch (error) {
        console.error('Error fetching drafts and rejected proposals:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Save a draft proposal (deprecated - use direct proposal creation instead)
 */
export const saveDraftProposal = async (proposalData) => {
    console.warn('saveDraftProposal is deprecated. Use direct proposal creation instead.');
    return { success: false, message: 'Draft system is deprecated. Please use direct proposal creation.' };
};

/**
 * Upload files for a proposal
 */
export const uploadProposalFiles = async (proposalId, files) => {
    try {
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        console.log('📎 Uploading files for proposal:', proposalId);
        console.log('📎 Files to upload:', {
            gpoaFile: files.gpoaFile ? files.gpoaFile.name : 'None',
            projectProposalFile: files.projectProposalFile ? files.projectProposalFile.name : 'None'
        });

        // Create FormData for file upload
        const formData = new FormData();

        if (files.gpoaFile) {
            console.log('📎 Adding GPOA file:', files.gpoaFile.name);
            formData.append('gpoa', files.gpoaFile);
        }

        if (files.projectProposalFile) {
            console.log('📎 Adding Project Proposal file:', files.projectProposalFile.name);
            formData.append('projectProposal', files.projectProposalFile);
        }

        // Debug FormData contents
        console.log('📎 FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value.name || value);
        }

        // Upload files using direct fetch (handles FormData correctly)
        const backendUrl = getAppConfig().backendUrl;
        const response = await fetch(`${backendUrl}/api/proposals/${proposalId}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type, let browser set it with boundary
            },
            body: formData
        });

        console.log('✅ Files uploaded successfully');
        return response;

    } catch (error) {
        console.error('❌ Error uploading files:', error);

        let userMessage = 'Failed to upload files. Please try again.';

        if (error.name === 'AbortError' || error.message?.includes('signal is aborted')) {
            userMessage = 'File upload timed out. Please try again.';
        } else if (error.message?.includes('Authentication')) {
            userMessage = 'Authentication expired. Please sign in again.';
        } else if (error.message?.includes('Network')) {
            userMessage = 'Network error. Please check your connection and try again.';
        }

        return {
            success: false,
            message: userMessage,
            error: error.message
        };
    }
};

/**
 * Save proposal data to database
 */
export const saveProposal = async (proposalId, formData) => {
    try {
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        console.log('💾 Saving proposal to database:', proposalId);

        // Prepare the proposal data for the backend
        const proposalData = {
            uuid: proposalId,
            organization_name: formData.organizationName || '',
            organization_type: ['internal', 'external', 'school-based', 'community-based'].includes(formData.organizationType)
                ? formData.organizationType
                : 'school-based',
            organization_description: formData.organizationDescription || '',
            organization_registration_no: formData.organizationRegistrationNo || '',
            contact_person: formData.contactPerson || '',
            contact_email: formData.contactEmail || '',
            contact_phone: formData.contactPhone || '',
            event_name: formData.eventName || '',
            event_venue: formData.venue || '',
            event_start_date: formData.startDate || '',
            event_end_date: formData.endDate || '',
            event_start_time: formData.startTime || '',
            event_end_time: formData.endTime || '',
            event_mode: ['offline', 'online', 'hybrid'].includes(formData.eventMode)
                ? formData.eventMode
                : 'offline',
            event_type: ['academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others'].includes(formData.eventType)
                ? formData.eventType
                : 'others',
            target_audience: Array.isArray(formData.targetAudience) ? formData.targetAudience : [],
            sdp_credits: Math.max(1, Math.min(2, parseInt(formData.sdpCredits) || 1)), // Ensure integer between 1-2
            current_section: 'orgInfo',
            proposal_status: 'draft'
        };

        // Save the proposal using PUT request
        const response = await api.put(`/proposals/${proposalId}`, proposalData, {
            headers: { 'Authorization': `Bearer ${token}` },
        }, {
            timeout: 30000, // 30 second timeout
            maxRetries: 2
        });

        console.log('✅ Proposal saved successfully');
        return response;

    } catch (error) {
        console.error('❌ Error saving proposal:', error);

        let userMessage = 'Failed to save proposal. Please try again.';

        if (error.name === 'AbortError' || error.message?.includes('signal is aborted')) {
            userMessage = 'Request timed out. Please try again.';
        } else if (error.message?.includes('Authentication')) {
            userMessage = 'Authentication expired. Please sign in again.';
        } else if (error.message?.includes('Network')) {
            userMessage = 'Network error. Please check your connection and try again.';
        }

        return {
            success: false,
            message: userMessage,
            error: error.message
        };
    }
};

/**
 * Submit proposal for review
 */
export const submitProposalForReview = async (proposalId) => {
    try {
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        console.log('🚀 Submitting proposal:', proposalId);

        // Try to submit the proposal
        const resp = await api.post(`/proposals/${proposalId}/submit`, {}, {
            headers: { 'Authorization': `Bearer ${token}` },
        }, {
            timeout: 30000, // 30 second timeout for submission
            maxRetries: 2
        });

        console.log('✅ Proposal submitted successfully');
        return resp;

    } catch (error) {
        console.error('❌ Error submitting proposal for review:', error);

        // Provide specific error messages
        let userMessage = 'Failed to submit proposal. Please try again.';

        if (error.status === 404 || error.message?.includes('Proposal not found')) {
            userMessage = 'Proposal not found. Please ensure you have saved your proposal before submitting.';
        } else if (error.name === 'AbortError' || error.message?.includes('signal is aborted')) {
            userMessage = 'Request timed out. The server is taking too long to respond. Please try again.';
        } else if (error.message?.includes('Authentication')) {
            userMessage = 'Authentication expired. Please sign in again.';
        } else if (error.message?.includes('Network')) {
            userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.status === 500) {
            userMessage = 'Server error. Please try again later.';
        }

        return {
            success: false,
            message: userMessage,
            error: error.message
        };
    }
};

/**
 * Get proposal status
 */
export const getProposalStatus = async (proposalId) => {
    try {
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        const response = await api.get(`/proposals/${proposalId}/status`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        return response;
    } catch (error) {
        console.error('Error getting proposal status:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Get approved events for post-event reports
 */
export const getApprovedEvents = async () => {
    try {
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        const response = await api.get('/proposals/user-proposals?status=approved', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.success && response.data?.proposals) {
            const approvedEvents = response.data.proposals.filter(p => p.proposal_status === 'approved');
            return { success: true, data: approvedEvents };
        }

        return { success: false, message: 'No approved events found' };
    } catch (error) {
        console.error('Error getting approved events:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Check if proposal exists
 */
export const checkProposalExists = async (proposalId) => {
    try {
        const token = getAuthToken();

        if (!token) {
            return { success: false, message: 'Authentication token not found' };
        }

        const response = await api.get(`/proposals/${proposalId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.success) {
            return { success: true, exists: true, data: response.data };
        } else if (response.status === 404) {
            return { success: true, exists: false };
        }

        return { success: false, message: 'Failed to check proposal existence' };
    } catch (error) {
        console.error('Error checking proposal existence:', error);
        return { success: false, message: error.message };
    }
};
