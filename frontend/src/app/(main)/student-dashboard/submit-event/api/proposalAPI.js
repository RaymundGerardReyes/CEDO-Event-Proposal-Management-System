// ===================================================================
// UNIFIED PROPOSAL API - WORKS WITH NEW PROPOSALS TABLE SCHEMA
// ===================================================================
// This replaces the separate school/community event APIs
// All data goes to the single 'proposals' table

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
    console.log('🚀 Saving proposal to MySQL proposals table:', proposalData);

    const formData = new FormData();

    // ===============================================================
    // SECTION 2: ORGANIZATION INFO (Primary focus for Section 2)
    // ===============================================================

    // 🔍 Debug the incoming proposalData
    console.log('🔍 API: Raw proposalData received:', proposalData);
    console.log('🔍 API: organizationName value:', `"${proposalData.organizationName}"`);
    console.log('🔍 API: contactName value:', `"${proposalData.contactName}"`);
    console.log('🔍 API: contactEmail value:', `"${proposalData.contactEmail}"`);

    // Check if required fields are empty before mapping
    const requiredFieldsCheck = {
        organizationName: proposalData.organizationName,
        contactName: proposalData.contactName,
        contactEmail: proposalData.contactEmail
    };

    const emptyFields = Object.entries(requiredFieldsCheck)
        .filter(([key, value]) => !value || (typeof value === 'string' && value.trim().length === 0))
        .map(([key]) => key);

    if (emptyFields.length > 0) {
        console.error('🚨 API: Empty fields detected before sending to backend:', emptyFields);
        console.log('🔍 API: Field values:');
        Object.entries(requiredFieldsCheck).forEach(([key, value]) => {
            console.log(`  ${key}: "${value}" (type: ${typeof value}, length: ${value?.length || 0})`);
        });
    }

    // Map fields with explicit logging
    const titleValue = proposalData.organizationName || 'Untitled Proposal';
    const contactPersonValue = proposalData.contactName || '';
    const contactEmailValue = proposalData.contactEmail || '';

    console.log('🔄 API: Field mapping:');
    console.log(`  organizationName → title: "${proposalData.organizationName}" → "${titleValue}"`);
    console.log(`  contactName → contactPerson: "${proposalData.contactName}" → "${contactPersonValue}"`);
    console.log(`  contactEmail → contactEmail: "${proposalData.contactEmail}" → "${contactEmailValue}"`);

    formData.append('title', titleValue);
    formData.append('description', proposalData.organizationDescription || 'No description provided');
    formData.append('category', 'partnership'); // Default category
    formData.append('organizationType', proposalData.organizationType || proposalData.organizationTypes?.[0] || '');
    formData.append('contactPerson', contactPersonValue);
    formData.append('contactEmail', contactEmailValue);
    formData.append('contactPhone', proposalData.contactPhone || '');

    // Required fields for backend validation - set defaults for Section 2
    formData.append('startDate', proposalData.schoolStartDate || proposalData.communityStartDate || new Date().toISOString().split('T')[0]);
    formData.append('endDate', proposalData.schoolEndDate || proposalData.communityEndDate || new Date().toISOString().split('T')[0]);
    formData.append('location', proposalData.schoolVenue || proposalData.communityVenue || 'TBD');
    formData.append('budget', proposalData.budget || '0');
    formData.append('objectives', proposalData.objectives || 'Objectives to be defined');
    formData.append('volunteersNeeded', proposalData.volunteersNeeded || '1');
    formData.append('status', proposalData.status || 'draft');

    // Add proposal ID if updating existing proposal
    if (proposalData.id) {
        formData.append('proposal_id', proposalData.id);
    }

    // Log the form data being sent
    console.log('📤 FormData being sent to API:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }

    try {
        // 🔧 ARCHITECTURAL FIX: Use real MySQL endpoint for Section 2 organization data
        const endpoint = `${API_BASE_URL}/api/proposals/section2-organization`;
        const method = 'POST'; // Always POST to MySQL endpoint

        console.log(`🌐 Making ${method} request to MySQL Section 2 endpoint:`, endpoint);

        // 🔍 Debug: Convert FormData to object for logging
        const formDataObj = {};
        for (let [key, value] of formData.entries()) {
            formDataObj[key] = value;
        }
        console.log('📤 API: FormData being sent:', formDataObj);

        // 🚨 IMPORTANT: Backend expects JSON, not FormData!
        // Convert FormData to JSON object
        const jsonData = {};
        for (let [key, value] of formData.entries()) {
            jsonData[key] = value;
        }

        console.log('🔄 API: Converting FormData to JSON:', jsonData);

        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // Add auth header when authentication is re-enabled
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(jsonData)
        });

        console.log('📨 API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);

            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || 'Failed to save proposal');
            } catch (parseError) {
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }
        }

        const result = await response.json();
        console.log('✅ API Success response:', result);

        return result;

    } catch (error) {
        console.error('🚨 Error saving proposal:', error);
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