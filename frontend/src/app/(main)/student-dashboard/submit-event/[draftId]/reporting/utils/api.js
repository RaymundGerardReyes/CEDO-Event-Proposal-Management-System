/**
 * Centralized API Service for Section 5 Reporting
 * All API operations extracted from monolithic component
 */

import { getApiBase, getAuthToken, hasMinimumRequiredData, STORAGE_KEYS } from './helpers.js';

/**
 * Search for proposals by organization details
 * @param {string} organizationName - Organization name
 * @param {string} contactEmail - Contact email
 * @returns {Promise<Object>} Search result
 */
export const searchProposals = async (organizationName, contactEmail) => {
    const searchUrl = `${getApiBase()}/api/proposals/search`;

    console.log('🔍 API: Searching proposals', { organizationName, contactEmail });

    const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            organization_name: organizationName,
            contact_email: contactEmail
        })
    });

    if (!response.ok) {
        throw new Error(`Search failed: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API: Search successful', result);

    return result;
};

/**
 * Get proposal status and details using unified API
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Proposal status data
 */
export const getProposalStatus = async (proposalId) => {
    console.log('🔍 API: Fetching proposal status for ID:', proposalId);
    console.log('🔍 API: Base URL:', getApiBase());

    // Try multiple endpoints with proper error handling
    const endpoints = [
        `${getApiBase()}/api/proposals/debug/${proposalId}`,
        `${getApiBase()}/api/proposals/mysql/${proposalId}`,
        `${getApiBase()}/api/mongodb-unified/proposal/${proposalId}`
    ];

    console.log('🔍 API: Will try endpoints:', endpoints);

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        const endpointName = endpoint.includes('debug') ? 'Debug'
            : endpoint.includes('mysql') ? 'MySQL'
                : 'MongoDB';

        try {
            console.log(`🔍 API: Trying ${endpointName} endpoint (${i + 1}/${endpoints.length}):`, endpoint);

            const response = await fetch(`${endpoint}?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                signal: controller.signal
            });

            if (response.ok) {
                clearTimeout(timeoutId);
                const proposalData = await response.json();
                console.log(`✅ API: Retrieved proposal data from ${endpointName}`, proposalData);

                // Extract status from various possible locations
                let proposalStatus = 'draft';
                let fullProposal = null;

                if (proposalData.success && proposalData.proposal) {
                    // MySQL API response format
                    fullProposal = proposalData.proposal;
                    proposalStatus = proposalData.proposal.proposalStatus || proposalData.proposal.proposal_status || 'draft';
                } else if (proposalData.proposal_status) {
                    // Direct status field
                    proposalStatus = proposalData.proposal_status;
                    fullProposal = proposalData;
                } else if (proposalData.status) {
                    // Legacy status field
                    proposalStatus = proposalData.status;
                    fullProposal = proposalData;
                } else if (proposalData.mysql?.data?.proposal_status) {
                    // Debug API MySQL format
                    proposalStatus = proposalData.mysql.data.proposal_status;
                    fullProposal = proposalData.mysql.data;
                } else if (proposalData.mysql?.found && proposalData.mysql?.data?.status) {
                    // Debug API MySQL legacy format
                    proposalStatus = proposalData.mysql.data.status;
                    fullProposal = proposalData.mysql.data;
                } else if (proposalData.mongodb?.data?.proposal_status) {
                    // Debug API MongoDB format
                    proposalStatus = proposalData.mongodb.data.proposal_status;
                } else if (proposalData.mongodb?.data?.status) {
                    // Debug API MongoDB legacy format
                    proposalStatus = proposalData.mongodb.data.status;
                }

                return {
                    success: true,
                    proposalId: proposalId,
                    proposalStatus: proposalStatus,
                    proposalData: proposalData,
                    fullProposal: fullProposal,
                    files: proposalData.files || {},
                    lastUpdated: new Date().toISOString()
                };
            } else {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                console.log(`⚠️ API: ${endpointName} endpoint failed with status ${response.status}:`, errorText);
                continue;
            }
        } catch (error) {
            console.log(`⚠️ API: ${endpointName} endpoint error:`, error.message);
            console.log(`⚠️ API: ${endpointName} full error:`, error);
            if (error.name === 'AbortError') {
                clearTimeout(timeoutId);
                throw new Error('Request timed out after 15 seconds');
            }
            continue;
        }
    }

    // All endpoints failed
    clearTimeout(timeoutId);
    throw new Error('All API endpoints failed to fetch proposal status');
};

/**
 * Save reporting data to database (auto-save)
 * @param {FormData} formDataPayload - Form data payload
 * @returns {Promise<Object>} Save result
 */
export const saveReportingData = async (formDataPayload) => {
    console.log('💾 API: Auto-saving reporting data');

    // Debug: Log all FormData entries
    console.log('📋 API: FormData being sent:');
    for (let [key, value] of formDataPayload.entries()) {
        console.log(`  ${key}: "${value}"`);
    }

    const backendUrl = getApiBase();
    const response = await fetch(`${backendUrl}/api/mongodb-unified/section5-reporting`, {
        method: 'POST',
        body: formDataPayload
    });

    if (!response.ok) {
        let errorResult;
        try {
            const responseText = await response.text();
            console.log('📋 API: Raw error response:', responseText);

            if (responseText) {
                try {
                    errorResult = JSON.parse(responseText);
                } catch (jsonError) {
                    errorResult = {
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        raw_response: responseText
                    };
                }
            } else {
                errorResult = {
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    raw_response: 'Empty response body'
                };
            }
        } catch (parseError) {
            errorResult = {
                message: `HTTP ${response.status}: ${response.statusText}`,
                parse_error: parseError.message
            };
        }

        // Enhanced error categorization
        if (response.status === 500) {
            // Prefer backend-provided message if available
            if (errorResult.error) {
                errorResult.user_message = errorResult.error;
            }
            // Check for specific MongoDB connection issues
            if (errorResult.message && errorResult.message.includes('MongoDB connection not ready')) {
                errorResult.user_message = 'Database connection is initializing. Please wait a moment and try again.';
                errorResult.technical_details = `500 MongoDB Connection - ${errorResult.message}`;
                errorResult.action_required = 'Wait 10-15 seconds for the database to initialize, then try saving again.';
            } else if (errorResult.message && errorResult.message.includes('Database not initialized')) {
                errorResult.user_message = 'Database is starting up. Please try again in a moment.';
                errorResult.technical_details = `500 Database Initialization - ${errorResult.message}`;
                errorResult.action_required = 'Wait for the database to fully start, then retry your request.';
            } else {
                errorResult.user_message = 'Server error occurred. Please try again in a moment.';
                errorResult.technical_details = `500 Internal Server Error - ${errorResult.message || 'Unknown server error'}`;
            }
        } else if (response.status === 404) {
            errorResult.user_message = 'Proposal not found. Please complete Sections 2-4 first to create your proposal.';
            errorResult.technical_details = `404 Not Found - ${errorResult.message || 'Proposal does not exist'}`;
            errorResult.action_required = 'Go back and complete Sections 2-4 to create your proposal before proceeding to Section 5.';
        } else if (response.status === 400) {
            errorResult.user_message = 'Invalid data provided. Please check your form inputs.';
            errorResult.technical_details = `400 Bad Request - ${errorResult.message || 'Invalid request data'}`;
            errorResult.action_required = 'Check the form fields and ensure all required data is properly filled.';
        }

        throw new Error(errorResult.user_message || errorResult.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ API: Save successful', result.verified_data);

    return result;
};

/**
 * Submit final report (complete submission)
 * @param {FormData} formDataPayload - Complete form data with files
 * @returns {Promise<Object>} Submission result
 */
export const submitFinalReport = async (formDataPayload) => {
    console.log('📋 API: Submitting final Section 5 report');

    const backendUrl = getApiBase();
    const response = await fetch(`${backendUrl}/api/mongodb-unified/section5-reporting`, {
        method: 'POST',
        body: formDataPayload
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API: Final submission successful', result);

    return result;
};

/**
 * Get user information for data recovery
 * @returns {Promise<Object>} User information
 */
export const getUserInfo = async () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token available');
    }

    const API_BASE_URL = getApiBase();
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
    }

    const userData = await response.json();
    return userData.user;
};

/**
 * Comprehensive proposal status fetching with recovery strategies
 * @param {Object} formData - Form data for proposal identification
 * @returns {Promise<Object>} Complete status result with recovery info
 */
export const fetchProposalStatus = async (formData) => {
    console.log('🔍 API: Starting comprehensive proposal status fetch');
    console.log('🔍 API: Input formData keys:', Object.keys(formData));

    // Strategy 1: Direct ID fields from formData
    let proposalId = null;
    const directIdFields = [
        formData.id,
        formData.proposalId,
        formData.organization_id,
        formData.proposal_id,
        formData.mysql_id
    ];

    proposalId = directIdFields.find(id => id !== null && id !== undefined && id !== '');

    if (proposalId) {
        console.log('✅ API: Strategy 1 - Found proposal ID in formData:', proposalId);
    } else {
        console.log('⚠️ API: Strategy 1 failed - No proposal ID in direct formData fields');

        // Strategy 2: Search localStorage
        if (typeof window !== 'undefined') {
            console.log('🔍 API: Strategy 2 - Searching localStorage');

            for (const key of STORAGE_KEYS) {
                try {
                    const storedData = localStorage.getItem(key);
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        const foundId = parsedData.id || parsedData.proposalId || parsedData.organization_id || parsedData.proposal_id;

                        if (foundId) {
                            console.log(`✅ API: Strategy 2 - Found proposal ID in ${key}:`, foundId);
                            proposalId = foundId;
                            break;
                        }
                    }
                } catch (error) {
                    console.warn(`API: Failed to parse ${key} from localStorage:`, error);
                }
            }
        }

        // Strategy 3: Search by organization details
        if (!proposalId && formData.organizationName && formData.contactEmail) {
            console.log('🔍 API: Strategy 3 - Searching by organization details');

            try {
                const searchResult = await searchProposals(formData.organizationName, formData.contactEmail);

                if (searchResult.id) {
                    proposalId = searchResult.id;
                    console.log('✅ API: Strategy 3 - Found proposal ID via search:', proposalId);

                    // Update localStorage with found ID
                    if (typeof window !== 'undefined') {
                        const updatedFormData = {
                            ...formData,
                            id: proposalId,
                            proposalId: proposalId,
                            organization_id: proposalId
                        };

                        localStorage.setItem('eventProposalFormData', JSON.stringify(updatedFormData));
                        console.log('✅ API: Updated localStorage with recovered proposal ID');
                    }
                } else {
                    console.log('⚠️ API: Strategy 3 failed - No proposal found via search');
                }
            } catch (searchError) {
                console.error('❌ API: Strategy 3 error:', searchError);
            }
        }
    }

    // Final check
    if (!proposalId) {
        console.error('❌ API: No proposal ID available for status check');
        return {
            success: false,
            error: 'No proposal ID found. Available data: ' + Object.keys(formData).join(', '),
            proposalStatus: 'no-id',
            proposalData: null
        };
    }

    // Fetch proposal status
    try {
        const statusResult = await getProposalStatus(proposalId);
        return statusResult;
    } catch (error) {
        console.error('❌ API: Failed to fetch proposal status:', error);
        return {
            success: false,
            error: error.message,
            proposalStatus: 'error',
            proposalData: null
        };
    }
};

/**
 * Recover missing form data from various sources
 * @param {Object} currentFormData - Current form data
 * @param {number} attemptNumber - Current attempt number
 * @returns {Promise<Object|null>} Recovered data or null
 */
/**
 * Fetch admin comments for a specific proposal
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Comments data
 */
export const fetchAdminComments = async (proposalId) => {
    console.log('💬 API: Fetching admin comments for proposal:', proposalId);

    if (!proposalId) {
        throw new Error('Proposal ID is required to fetch comments');
    }

    const backendUrl = getApiBase();
    const response = await fetch(`${backendUrl}/api/mongodb-unified/admin/proposals/${proposalId}/comments`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ API: Failed to fetch admin comments:', response.status, errorText);
        throw new Error(`Failed to fetch admin comments: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API: Admin comments fetched successfully:', result);

    return result;
};

export const recoverFormData = async (currentFormData, attemptNumber = 1) => {
    console.log(`🔄 API: Data recovery attempt ${attemptNumber}`);

    // Check if current data is sufficient
    if (hasMinimumRequiredData(currentFormData)) {
        console.log('✅ API: Current data is sufficient');
        return currentFormData;
    }

    // Try localStorage recovery
    console.log('🔄 API: Checking localStorage for complete data');

    let bestLocalData = null;
    let bestScore = 0;

    for (const key of STORAGE_KEYS) {
        try {
            const savedData = localStorage.getItem(key);
            if (savedData) {
                const parsedData = JSON.parse(savedData);

                // Score based on data completeness
                let score = 0;
                if (parsedData.organizationName) score += 10;
                if (parsedData.contactEmail) score += 10;
                if (parsedData.id || parsedData.proposalId) score += 5;
                if (parsedData.schoolEventName || parsedData.communityEventName) score += 3;
                score += Object.keys(parsedData).length;

                if (score > bestScore) {
                    bestScore = score;
                    bestLocalData = parsedData;
                }
            }
        } catch (error) {
            console.warn(`API: Failed to parse localStorage ${key}:`, error);
        }
    }

    if (bestLocalData && hasMinimumRequiredData(bestLocalData)) {
        console.log('✅ API: Found sufficient data in localStorage');
        return bestLocalData;
    }

    // Try database recovery
    console.log('🔄 API: Attempting database recovery');

    try {
        const userInfo = await getUserInfo();

        if (userInfo.organization && userInfo.email) {
            const searchResult = await searchProposals(userInfo.organization, userInfo.email);
            const proposals = searchResult.proposals || searchResult.data || [];

            if (searchResult.success && proposals && proposals.length > 0) {
                const userProposal = proposals.find(proposal =>
                    (proposal.organization_name === userInfo.organization &&
                        proposal.contact_email === userInfo.email) ||
                    (proposal.contactEmail === userInfo.email)
                );

                if (userProposal) {
                    console.log('✅ API: Found matching proposal for current user');

                    const recoveredData = {
                        id: userProposal.id || userProposal._id,
                        proposalId: userProposal.id || userProposal._id,
                        organization_id: userProposal.id || userProposal._id,
                        organizationName: userProposal.organization_name || userProposal.title || userProposal.organizationName,
                        contactEmail: userProposal.contact_email || userProposal.contactEmail,
                        contactName: userProposal.contact_person || userProposal.contactName,
                        contactPhone: userProposal.contact_phone || userProposal.contactPhone,
                        organizationType: userProposal.organizationType || userProposal.organization_type || 'school-based',
                        organizationTypes: [userProposal.organizationType || userProposal.organization_type || 'school-based'],
                        proposalStatus: userProposal.proposal_status || userProposal.status,
                        currentSection: 'reporting',
                        schoolEventName: userProposal.event_name || userProposal.title,
                        schoolVenue: userProposal.venue,
                        schoolStartDate: userProposal.start_date || userProposal.startDate,
                        schoolEndDate: userProposal.end_date || userProposal.endDate,
                        schoolEventType: userProposal.event_type || userProposal.eventType,
                        schoolEventMode: userProposal.event_mode || userProposal.eventMode,
                        recoveredFromDatabase: true,
                        recoveryTimestamp: new Date().toISOString(),
                        recoverySource: 'user_proposals',
                        recoveryAttempt: attemptNumber
                    };

                    if (hasMinimumRequiredData(recoveredData)) {
                        console.log('✅ API: Successfully recovered from database');
                        return recoveredData;
                    }
                }
            }
        }
    } catch (dbError) {
        console.warn('⚠️ API: Database recovery failed:', dbError.message);
    }

    console.warn(`⚠️ API: Recovery attempt ${attemptNumber} failed`);
    return null;
}; 