// frontend/src/utils/files.js

import { apiRequest } from '@/utils/api';

/**
 * Lazy-load file metadata/signed URLs for a proposal
 * Returns { success, files } where files is a map keyed by type
 */
export async function lazyLoadFiles(proposalUuid) {
    if (!proposalUuid) throw new Error('proposalUuid is required');
    // Endpoint assumed: GET /admin/proposals/:uuid/files
    const data = await apiRequest(`/admin/proposals/${proposalUuid}/files`, { method: 'GET' }, { maxRetries: 1 });
    const files = data?.files || {};
    return { success: !!data?.success, files };
}

