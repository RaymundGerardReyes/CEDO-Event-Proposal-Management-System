/**
 * Unified Draft API - Refactored
 * Purpose: Centralized draft operations with consistent error handling
 * Key approaches: Single responsibility, comprehensive validation, unified error responses
 */

import { getApiUrl, robustFetch } from '@/utils/api';

// Request deduplication cache
const requestCache = new Map();

/**
 * ✅ CENTRALIZED: Handle API response errors with proper authentication redirects
 * @param {Response} response - Fetch response object
 * @param {string} errorText - Response error text
 * @param {string} operation - Operation being performed (for better error messages)
 * @throws {Error} Appropriate error based on status code
 */
function handleApiError(response, errorText, operation = 'API request') {
    let errorData;
    let errorMessage;
    try {
        errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        errorData = { message: errorMessage };
    }

    // ✅ CRITICAL: Handle authentication errors by redirecting to sign-in
    if (response.status === 401) {
        console.error('🔐 Authentication Error in', operation + ':', errorMessage);

        // Check if this is specifically a "User account not found" error
        if (errorMessage.includes('User account not found') || errorMessage.includes('Please sign in again')) {
            console.log('🔄 User account not found - redirecting to sign-in...');

            // Clear any stored authentication data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('cedo_token');
                document.cookie = 'cedo_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

                // Redirect to sign-in page
                window.location.href = '/auth/sign-in?error=account_not_found&message=' + encodeURIComponent('Your account was not found. Please sign in again.');
            }

            throw new Error('AUTHENTICATION_REQUIRED');
        }

        // Other 401 errors (invalid token, expired, etc.)
        throw new Error(`Authentication failed: ${errorMessage}`);
    }

    // Handle other common errors
    if (response.status === 403) {
        throw new Error(`Access denied: ${errorMessage}`);
    }

    if (response.status === 404) {
        throw new Error(`Not found: ${errorMessage}`);
    }

    if (response.status >= 500) {
        throw new Error(`Server error: ${errorMessage}`);
    }

    // Generic error for other status codes
    console.error('❌ API Error response in', operation + ':', errorText);
    throw new Error(`${operation} failed: ${errorMessage}`);
}

/**
 * Clear the request cache (useful for cleanup)
 */
export function clearDraftCache() {
    requestCache.clear();
    console.log('🧹 Draft request cache cleared');
}

/**
 * Clear a specific draft from cache
 */
export function clearDraftFromCache(draftId, token = null) {
    const cacheKey = `draft-${draftId}-${token ? 'auth' : 'noauth'}`;
    if (requestCache.delete(cacheKey)) {
        console.log(`🧹 Cleared draft from cache: ${draftId}`);
    }
}

/**
 * Deduplicate requests for the same resource
 * @param {string} key - Cache key
 * @param {Function} requestFn - Request function
 * @returns {Promise} Request result
 */
async function deduplicateRequest(key, requestFn) {
    if (requestCache.has(key)) {
        console.log(`🔄 Using cached request for: ${key}`);
        return requestCache.get(key);
    }

    console.log(`📡 Making new request for: ${key}`);
    const promise = requestFn();
    requestCache.set(key, promise);

    try {
        const result = await promise;
        // Keep successful results in cache for a short time
        setTimeout(() => requestCache.delete(key), 5000);
        return result;
    } catch (error) {
        // Remove failed requests from cache immediately
        requestCache.delete(key);
        throw error;
    }
}

/**
 * Get proposal by ID (unified function)
 * @param {string} id - Proposal UUID or descriptive ID
 * @param {string} [token] - Optional authentication token
 * @returns {Promise<Object>} Proposal data
 */
export async function getProposalById(id, token = null) {
    const API_URL = getApiUrl();
    const cacheKey = `proposal-${id}-${token ? 'auth' : 'noauth'}`;

    return deduplicateRequest(cacheKey, async () => {
        console.log(`🔍 Getting proposal by ID: ${id}`);

        const headers = { 'Content-Type': 'application/json' };
        let authToken = token;

        if (!authToken && typeof document !== 'undefined') {
            const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
            if (cookieValue) {
                authToken = cookieValue.split('=')[1];
            }
        }

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}/api/proposals/${id}`, {
            method: 'GET',
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();

            let errorData;
            let errorMessage;
            try {
                errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            } catch {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
                errorData = { message: errorMessage };
            }

            // ✅ Use centralized error handling
            handleApiError(response, errorText, 'Get Proposal');
        }

        const result = await response.json();
        console.log(`✅ Proposal retrieved successfully: ${id}`);
        return result;
    });
}

/**
 * Create a new proposal draft
 * @param {string} [token] - Optional authentication token
 * @param {Object} [options] - Creation options
 * @returns {Promise<Object>} Created proposal data
 */
export async function createProposal(token = null, options = {}) {
    const API_URL = getApiUrl();
    console.log('📝 Creating new proposal...');

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;

    if (!authToken && typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            authToken = cookieValue.split('=')[1];
        }
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await robustFetch(`${API_URL}/api/proposals/drafts`, {
        method: 'POST',
        headers,
        credentials: 'include',
    }, {
        toastMessage: 'Failed to create proposal.',
        toast: options.toast,
        sentryContext: { feature: 'CreateProposal' }
    });

    const result = await response.json();
    console.log('✅ Proposal created successfully:', result);
    return result;
}

/**
 * Update proposal by ID
 * @param {string} id - Proposal UUID
 * @param {Object} data - Update data
 * @param {string} [token] - Optional authentication token
 * @returns {Promise<Object>} Update result
 */
export async function updateProposal(id, data, token = null) {
    const API_URL = getApiUrl();
    console.log(`🔄 Updating proposal: ${id}`);

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;

    if (!authToken && typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            authToken = cookieValue.split('=')[1];
        }
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}/api/proposals/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorText = await response.text();
        handleApiError(response, errorText, 'Update Proposal');
    }

    const result = await response.json();
    console.log(`✅ Proposal updated successfully: ${id}`);
    return result;
}

/**
 * Delete proposal by ID
 * @param {string} id - Proposal UUID
 * @param {string} [token] - Optional authentication token
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteProposal(id, token = null) {
    const API_URL = getApiUrl();
    console.log(`🗑️ Deleting proposal: ${id}`);

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;

    if (!authToken && typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            authToken = cookieValue.split('=')[1];
        }
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}/api/proposals/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);

        let errorMessage;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }

        if (response.status === 404) {
            throw new Error(`Proposal not found: ${errorMessage}`);
        } else {
            throw new Error(`Failed to delete proposal: ${errorMessage}`);
        }
    }

    console.log(`✅ Proposal deleted successfully: ${id}`);
    return { success: true };
}

/**
 * Save event type selection (unified function)
 * @param {string} draftId - The UUID of the draft
 * @param {string} eventType - The selected event type ('school-based' or 'community-based')
 * @param {string} [token] - Optional authentication token
 * @returns {Promise<Object>} The response from the server
 */
export async function saveEventTypeSelection(draftId, eventType, token = null) {
    const API_URL = getApiUrl();
    console.log(`🎯 Saving event type selection for draft ${draftId}:`, eventType);

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;

    if (!authToken && typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            authToken = cookieValue.split('=')[1];
        }
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const endpoint = `${API_URL}/api/proposals/drafts/${draftId}/event-type`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ eventType }),
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);

            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            } catch {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            }

            if (response.status === 404) {
                throw new Error(`Draft not found. Please create a new draft and try again.`);
            } else if (response.status === 400) {
                throw new Error(`Invalid event type. Please select either "school-based" or "community-based".`);
            } else if (response.status === 500) {
                throw new Error(`Server error while saving event type. Please try again.`);
            } else {
                throw new Error(`Failed to save event type selection: ${errorMessage}`);
            }
        }

        const result = await response.json();
        console.log(`✅ Event type selection saved for draft ${draftId}:`, result);
        return result;
    } catch (error) {
        console.error('❌ Error in saveEventTypeSelection:', error);
        throw error;
    }
}

/**
 * Update draft section (unified function)
 * @param {string} draftId - The UUID of the draft
 * @param {string} section - Section name
 * @param {Object} data - Section data
 * @param {string} [token] - Optional authentication token
 * @returns {Promise<Object>} Update result
 */
export async function updateDraftSection(draftId, section, data, token = null) {
    const API_URL = getApiUrl();
    console.log(`🔄 Updating draft section ${section} for draft ${draftId}`);

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;

    if (!authToken && typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            authToken = cookieValue.split('=')[1];
        }
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const endpoint = `${API_URL}/api/proposals/drafts/${draftId}/${section}`;

    try {
        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);

            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            } catch {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            }

            if (response.status === 404) {
                throw new Error(`Draft not found: ${errorMessage}`);
            } else {
                throw new Error(`Failed to update draft section: ${errorMessage}`);
            }
        }

        const result = await response.json();
        console.log(`✅ Draft section ${section} updated successfully for draft ${draftId}`);
        return result;
    } catch (error) {
        console.error('❌ Error in updateDraftSection:', error);
        throw error;
    }
}

/**
 * Submit draft (change status to pending)
 * @param {string} draftId - The UUID of the draft
 * @param {string} [token] - Optional authentication token
 * @returns {Promise<Object>} Submission result
 */
export async function submitDraft(draftId, token = null) {
    const API_URL = getApiUrl();
    console.log(`📤 Submitting draft: ${draftId}`);

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;

    if (!authToken && typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            authToken = cookieValue.split('=')[1];
        }
    }

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const endpoint = `${API_URL}/api/proposals/drafts/${draftId}/submit`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);

            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            } catch {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            }

            if (response.status === 404) {
                throw new Error(`Draft not found: ${errorMessage}`);
            } else {
                throw new Error(`Failed to submit draft: ${errorMessage}`);
            }
        }

        const result = await response.json();
        console.log(`✅ Draft submitted successfully: ${draftId}`);
        return result;
    } catch (error) {
        console.error('❌ Error in submitDraft:', error);
        throw error;
    }
}

// ===================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ===================================================================

/**
 * Legacy function for backward compatibility
 * @deprecated Use createProposal instead
 */
export async function createDraft(token = null, options = {}) {
    console.warn('⚠️ createDraft is deprecated, use createProposal instead');
    return createProposal(token, options);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getProposalById instead
 */
export async function getDraft(draftId, token = null) {
    console.warn('⚠️ getDraft is deprecated, use getProposalById instead');
    return getProposalById(draftId, token);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use updateDraftSection instead
 */
export async function updateDraft(draftId, section, data, token = null) {
    console.warn('⚠️ updateDraft is deprecated, use updateDraftSection instead');
    return updateDraftSection(draftId, section, data, token);
}