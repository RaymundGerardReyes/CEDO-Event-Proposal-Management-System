// ===================================================================
// UNIFIED PROPOSAL API - WORKS WITH NEW PROPOSALS TABLE SCHEMA
// ===================================================================
// This replaces the separate school/community event APIs
// All data goes to the single 'proposals' table

import { config } from '@/lib/utils';

const API_BASE_URL = config.backendUrl;

// ===================================================================
// CORE PROPOSAL API FUNCTIONS
// ===================================================================

/**
 * Save or Update a Proposal (Works for both School & Community events)
 * @param {Object} proposalData - Complete proposal data from all sections
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Object>} API response with proposal ID
 */
export const saveProposal = async (proposalData, files = []) => {
    console.log('🚀 Saving proposal section 2 data:', proposalData);

    // The API layer now trusts the component to send a valid type,
    // but the backend will validate it as a safety measure.
    const payload = {
        // Core Organization Fields
        title: proposalData.organizationName || 'Untitled Proposal',
        description: proposalData.organizationDescription || 'No description provided',
        organizationType: proposalData.organizationType,
        contactPerson: proposalData.contactName || '',
        contactEmail: proposalData.contactEmail || '',
        contactPhone: proposalData.contactPhone || '',
        status: 'draft', // Section 2 is always a draft
        userId: proposalData.userId,

        // Include proposal ID if this is an update
        proposal_id: proposalData.id || proposalData.proposalId,
    };

    console.log('✅ API: Assembled clean payload for backend:', payload);

    try {
        const endpoint = `${API_BASE_URL}/api/proposals/section2-organization`;
        console.log(`🌐 Making POST request to:`, endpoint);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` // Add when auth is ready
            },
            body: JSON.stringify(payload)
        });

        console.log('📨 API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);
            const errorData = JSON.parse(errorText || '{}');
            throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ API Success response:', result);
        return result;

    } catch (error) {
        console.error('🚨 Error saving proposal:', error.message);
        throw error;
    }
};

/**
 * Get a proposal by ID
 * @param {string|number} proposalId 
 * @returns {Promise<Object>} Proposal data
 */
export const getProposal = async (proposalId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch proposal: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching proposal:', error);
        throw error;
    }
};

/**
 * Get all proposals (with optional filters)
 * @param {Object} filters - Optional filters (status, organization_type, etc.)
 * @returns {Promise<Array>} Array of proposals
 */
export const getProposals = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/api/proposals?${queryParams}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch proposals: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching proposals:', error);
        throw error;
    }
};

/**
 * Submit proposal for approval (change status to 'pending')
 * @param {string|number} proposalId 
 * @returns {Promise<Object>} Updated proposal
 */
export const submitProposal = async (proposalId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to submit proposal: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting proposal:', error);
        throw error;
    }
};

/**
 * Delete/withdraw a proposal
 * @param {string|number} proposalId 
 * @returns {Promise<Object>} Success response
 */
export const deleteProposal = async (proposalId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete proposal: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting proposal:', error);
        throw error;
    }
};

/**
 * Verify proposal data was saved correctly and retrieve it
 * @param {string|number} proposalId - The proposal ID to verify
 * @returns {Promise<Object>} Verification result with proposal data
 */
export const verifyProposalData = async (proposalId) => {
    console.log('🔍 Verifying proposal data for ID:', proposalId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/debug/${proposalId}`);

        if (!response.ok) {
            throw new Error(`Verification failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('🔍 Verification result:', result);

        return result;
    } catch (error) {
        console.error('❌ Proposal verification error:', error);
        throw error;
    }
};

/**
 * Search for proposal by organization details (fallback method)
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Search result
 */
export const searchProposalByOrganization = async (searchParams) => {
    console.log('🔍 Searching for proposal by organization:', searchParams);

    try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                organization_name: searchParams.organizationName || searchParams.title,
                contact_email: searchParams.contactEmail
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log('🔍 Search response not ok:', errorText);
            return null; // Not found, don't throw error
        }

        const result = await response.json();
        console.log('🔍 Search result:', result);

        return result;
    } catch (error) {
        console.error('❌ Proposal search error:', error);
        return null; // Return null instead of throwing for search failures
    }
};

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Calculate form completion percentage based on filled fields
 * @param {Object} proposalData 
 * @returns {number} Percentage (0-100)
 */
const calculateCompletionPercentage = (proposalData) => {
    const requiredFields = [
        'organizationName',
        'contactName',
        'contactEmail'
    ];

    const organizationType = proposalData.organizationTypes?.[0] || proposalData.organizationType;

    if (organizationType === 'school-based') {
        requiredFields.push(
            'schoolEventName',
            'schoolVenue',
            'schoolStartDate',
            'schoolEndDate',
            'schoolEventType',
            'schoolReturnServiceCredit'
        );
    } else if (organizationType === 'community-based') {
        requiredFields.push(
            'communityEventName',
            'communityVenue',
            'communityStartDate',
            'communityEndDate',
            'communityEventType',
            'communitySDPCredits'
        );
    }

    const filledFields = requiredFields.filter(field => {
        const value = proposalData[field];
        return value && value !== '' && value !== null && value !== undefined;
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
};

/**
 * Convert database proposal back to React form data format
 * @param {Object} dbProposal - Proposal from database
 * @returns {Object} Form data in React format
 */
export const convertDbToFormData = (dbProposal) => {
    const formData = {
        // Section 1
        currentSection: dbProposal.current_section,
        hasActiveProposal: dbProposal.has_active_proposal,
        proposalStatus: dbProposal.proposal_status,
        reportStatus: dbProposal.report_status,

        // Section 2
        organizationName: dbProposal.organization_name,
        organizationTypes: [dbProposal.organization_type],
        organizationType: dbProposal.organization_type,
        organizationDescription: dbProposal.organization_description,
        contactName: dbProposal.contact_name,
        contactEmail: dbProposal.contact_email,
        contactPhone: dbProposal.contact_phone,

        // Common fields mapped to both school and community
        eventName: dbProposal.event_name,
        eventVenue: dbProposal.event_venue,
        eventStartDate: dbProposal.event_start_date,
        eventEndDate: dbProposal.event_end_date,
        eventStartTime: dbProposal.event_start_time,
        eventEndTime: dbProposal.event_end_time,
        eventMode: dbProposal.event_mode,
    };

    // Add organization-type specific fields
    if (dbProposal.organization_type === 'school-based') {
        formData.schoolEventName = dbProposal.event_name;
        formData.schoolVenue = dbProposal.event_venue;
        formData.schoolStartDate = dbProposal.event_start_date;
        formData.schoolEndDate = dbProposal.event_end_date;
        formData.schoolTimeStart = dbProposal.event_start_time;
        formData.schoolTimeEnd = dbProposal.event_end_time;
        formData.schoolEventMode = dbProposal.event_mode;
        formData.schoolEventType = dbProposal.school_event_type;
        formData.schoolReturnServiceCredit = dbProposal.school_return_service_credit;
        formData.schoolTargetAudience = dbProposal.school_target_audience ? JSON.parse(dbProposal.school_target_audience) : [];
        formData.schoolGPOAFile = dbProposal.school_gpoa_file_name;
        formData.schoolProposalFile = dbProposal.school_proposal_file_name;
    } else if (dbProposal.organization_type === 'community-based') {
        formData.communityEventName = dbProposal.event_name;
        formData.communityVenue = dbProposal.event_venue;
        formData.communityStartDate = dbProposal.event_start_date;
        formData.communityEndDate = dbProposal.event_end_date;
        formData.communityTimeStart = dbProposal.event_start_time;
        formData.communityTimeEnd = dbProposal.event_end_time;
        formData.communityEventMode = dbProposal.event_mode;
        formData.communityEventType = dbProposal.community_event_type;
        formData.communitySDPCredits = dbProposal.community_sdp_credits;
        formData.communityTargetAudience = dbProposal.community_target_audience ? JSON.parse(dbProposal.community_target_audience) : [];
        formData.communityGPOAFile = dbProposal.community_gpoa_file_name;
        formData.communityProposalFile = dbProposal.community_proposal_file_name;
    }

    // Section 5 fields
    if (dbProposal.accomplishment_report_file_name) {
        formData.accomplishmentReport = dbProposal.accomplishment_report_file_name;
    }
    formData.signature = dbProposal.digital_signature;
    formData.attendanceCount = dbProposal.attendance_count;
    formData.eventStatus = dbProposal.event_status;
    formData.reportDescription = dbProposal.report_description;

    return formData;
};

// ===================================================================
// EXPORT DEFAULT FUNCTIONS
// ===================================================================

export default {
    saveProposal,
    getProposal,
    getProposals,
    submitProposal,
    deleteProposal,
    convertDbToFormData,
    calculateCompletionPercentage,
    verifyProposalData,
    searchProposalByOrganization
}; 