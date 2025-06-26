// @/lib/draft-api.js

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Creates a new, empty draft proposal on the backend.
 * This function should be called when a user starts a new submission.
 *
 * @returns {Promise<{draftId: string}>} The UUID of the newly created draft.
 */
export async function createDraft() {
    console.log('API: Creating new draft...');
    // TODO: This requires a new backend endpoint: POST /api/proposals/drafts
    const response = await fetch(`${API_URL}/api/proposals/drafts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Include auth headers if needed
        },
    });

    if (!response.ok) {
        throw new Error('Failed to create draft. Please ensure the backend is running and the endpoint is configured.');
    }

    const result = await response.json();
    console.log('API: New draft created with ID:', result.draftId);
    return result; // Expected response: { draftId: "some-uuid" }
}

/**
 * Fetches the complete data for an existing draft from the backend.
 *
 * @param {string} draftId - The UUID of the draft to fetch.
 * @returns {Promise<Object>} The draft data, including its status and formData.
 */
export async function getDraft(draftId) {
    console.log(`API: Fetching draft ${draftId}...`);
    // TODO: This requires a new backend endpoint: GET /api/proposals/drafts/:draftId
    const response = await fetch(`${API_URL}/api/proposals/drafts/${draftId}`);

    if (!response.ok) {
        if (response.status === 404) {
            // If the draft no longer exists on the server (e.g. backend was
            // restarted and the in-memory cache was cleared) we fall back to
            // an empty draft object so that the user is not thrown to the
            // framework-level 404 page.  The client can then decide whether
            // to save again or inform the user.
            console.warn(`Draft ${draftId} not found on server – returning placeholder draft so the UI can continue.`);
            return { draftId, form_data: {}, status: 'missing' };
        }
        throw new Error('Failed to fetch draft');
    }

    const result = await response.json();
    console.log(`API: Fetched draft data for ${draftId}`, result);
    return result;
}

/**
 * Updates a draft with partial data for a specific section (Save as Draft).
 *
 * @param {string} draftId - The UUID of the draft to update.
 * @param {Object} data - The data for the section to save.
 * @returns {Promise<{success: boolean}>}
 */
export async function updateDraft(draftId, data) {
    console.log(`API: Updating draft ${draftId}...`);
    // TODO: This requires a new backend endpoint: PATCH /api/proposals/drafts/:draftId
    const response = await fetch(`${API_URL}/api/proposals/drafts/${draftId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
    });

    if (!response.ok) {
        throw new Error('Failed to update draft');
    }

    return await response.json();
}

export async function patchSection(id, sec, p) {
    // Implementation of patchSection function
}

export async function submitDraft(id) {
    // Implementation of submitDraft function
} 