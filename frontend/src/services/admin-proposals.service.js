// frontend/src/services/admin-proposals.service.js

/**
 * Enhanced Admin Proposals Service
 * - fetchProposals: paginated list with advanced filters/search/sort
 * - fetchProposalByUuid: get a single proposal by uuid
 * - approveProposal / denyProposal: update status with optional comments
 * - bulkApprove / bulkDeny: batch status updates
 * - Advanced filtering, sorting, and export functionality
 */

import { apiRequest } from '@/utils/api';
import { normalizeProposal } from '@/utils/proposals';

function buildQuery(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;

        // Handle special cases for complex parameters
        if (k === 'dateRange' && v && typeof v === 'object') {
            if (v.from) qs.append('dateFrom', v.from.toISOString().split('T')[0]);
            if (v.to) qs.append('dateTo', v.to.toISOString().split('T')[0]);
        } else if (k === 'sort' && v && typeof v === 'object') {
            qs.append('sortField', v.field);
            qs.append('sortDirection', v.direction);
        } else if (Array.isArray(v)) {
            v.forEach(item => qs.append(k, item));
        } else {
            qs.append(k, String(v));
        }
    });
    return qs.toString();
}

/**
 * Fetch proposals with enhanced filtering, sorting, and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by status
 * @param {string} params.search - Search query
 * @param {Object} params.sort - Sort configuration {field, direction}
 * @param {string} params.type - Event type filter
 * @param {string} params.organizationType - Organization type filter
 * @param {Object} params.dateRange - Date range filter {from, to}
 * @param {string} params.priority - Priority filter
 * @param {string} params.assignedTo - Assigned to filter
 * @param {string} params.fileCount - File count filter
 * @param {string} params.uuid - Focus on specific proposal by UUID
 */
export async function fetchProposals(params = {}) {
    const {
        page = 1,
        limit = 10,
        status = 'all',
        search = '',
        sort = { field: 'submitted_at', direction: 'desc' },
        type,
        organizationType,
        dateRange,
        priority,
        assignedTo,
        fileCount,
        uuid
    } = params;

    const queryString = buildQuery({
        page,
        limit,
        status,
        search,
        sort,
        type,
        organizationType,
        dateRange,
        priority,
        assignedTo,
        fileCount,
        uuid
    });

    const data = await apiRequest(`/admin/proposals?${queryString}`, { method: 'GET' }, { maxRetries: 2 });

    const proposals = Array.isArray(data?.proposals) ? data.proposals.map(normalizeProposal) : [];

    return {
        success: !!data?.success,
        proposals,
        pagination: data?.pagination || { page, limit, total: 0 },
        stats: data?.stats || {},
        error: data?.error || null,
    };
}

/**
 * Fetch a single proposal by UUID or ID
 * @param {string} idOrUuid - Proposal ID or UUID
 */
export async function fetchProposalByUuid(uuid) {
    console.log('🔍 fetchProposalByUuid called with:', {
        uuid,
        uuidType: typeof uuid,
        uuidLength: uuid?.length
    });

    if (!uuid) throw new Error('UUID is required');

    // Validate UUID format (36-char standard UUID)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(uuid)) {
        console.error('❌ Invalid UUID format:', uuid);
        throw new Error('Invalid UUID format');
    }

    console.log('✅ UUID format valid, making API request to:', `/api/admin/proposals/${uuid}`);

    try {
        const data = await apiRequest(`/api/admin/proposals/${uuid}`, { method: 'GET' }, { maxRetries: 2 });
        console.log('📡 API Response received:', data);

        const result = {
            success: !!data?.success,
            proposal: data?.proposal ? normalizeProposal(data.proposal) : null,
            error: data?.error || null
        };

        console.log('🎯 Returning result:', result);
        return result;
    } catch (error) {
        console.error('❌ API Request failed:', error);
        throw error;
    }
}

/**
 * Get proposal statistics for dashboard
 */
export async function fetchProposalStats() {
    const data = await apiRequest('/admin/proposals/stats', { method: 'GET' }, { maxRetries: 2 });
    return {
        success: !!data?.success,
        stats: data?.stats || {},
        error: data?.error || null,
    };
}

/**
 * Update proposal status (approve/deny/reject)
 * @param {string} idOrUuid - Proposal ID or UUID
 * @param {string} status - New status
 * @param {string} adminComments - Optional admin comments
 */
async function patchStatus(idOrUuid, status, adminComments) {
    const body = JSON.stringify({ status, adminComments: adminComments || null });
    const data = await apiRequest(`/admin/proposals/${idOrUuid}/status`, { method: 'PATCH', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        proposal: data?.proposal ? normalizeProposal(data.proposal) : null,
        error: data?.error || null
    };
}

/**
 * Approve a proposal
 * @param {string} idOrUuid - Proposal ID or UUID
 * @param {string} adminComments - Optional approval comments
 */
export async function approveProposal(idOrUuid, adminComments) {
    return patchStatus(idOrUuid, 'approved', adminComments);
}

/**
 * Deny/Reject a proposal
 * @param {string} idOrUuid - Proposal ID or UUID
 * @param {string} adminComments - Required rejection reason
 */
export async function denyProposal(idOrUuid, adminComments) {
    return patchStatus(idOrUuid, 'denied', adminComments);
}

/**
 * Bulk approve proposals
 * @param {Array} idsOrUuids - Array of proposal IDs or UUIDs
 * @param {string} adminComments - Optional approval comments
 */
export async function bulkApprove(idsOrUuids = [], adminComments) {
    const body = JSON.stringify({
        ids: idsOrUuids,
        status: 'approved',
        adminComments: adminComments || null
    });
    const data = await apiRequest('/admin/proposals/bulk-status', { method: 'PATCH', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        results: (data?.results || []).map(normalizeProposal),
        error: data?.error || null
    };
}

/**
 * Bulk deny proposals
 * @param {Array} idsOrUuids - Array of proposal IDs or UUIDs
 * @param {string} adminComments - Required rejection reason
 */
export async function bulkDeny(idsOrUuids = [], adminComments) {
    const body = JSON.stringify({
        ids: idsOrUuids,
        status: 'denied',
        adminComments: adminComments || null
    });
    const data = await apiRequest('/admin/proposals/bulk-status', { method: 'PATCH', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        results: (data?.results || []).map(normalizeProposal),
        error: data?.error || null
    };
}

/**
 * Add comment to a proposal
 * @param {string} idOrUuid - Proposal ID or UUID
 * @param {string} comment - Comment text
 */
export async function addProposalComment(idOrUuid, comment) {
    const body = JSON.stringify({ comment });
    const data = await apiRequest(`/admin/proposals/${idOrUuid}/comment`, { method: 'POST', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        error: data?.error || null,
    };
}

/**
 * Export proposals in various formats
 * @param {Object} params - Export parameters
 * @param {Array} params.ids - Specific proposal IDs to export
 * @param {string} params.format - Export format (csv, excel, pdf, json)
 * @param {Object} params.filters - Applied filters for export
 */
export async function exportProposals(params = {}) {
    const { ids, format = 'csv', filters = {} } = params;

    const queryString = buildQuery({
        format,
        ...(ids && { ids: ids.join(',') }),
        ...filters
    });

    const data = await apiRequest(`/admin/proposals/export?${queryString}`, { method: 'GET' }, { maxRetries: 1 });

    return {
        success: !!data?.success,
        downloadUrl: data?.downloadUrl,
        filename: data?.filename,
        error: data?.error || null,
    };
}

/**
 * Download proposal file
 * @param {string} idOrUuid - Proposal ID or UUID
 * @param {string} fileType - Type of file to download
 */
export async function downloadProposalFile(idOrUuid, fileType) {
    const data = await apiRequest(
        `/admin/proposals/${idOrUuid}/download/${fileType}`,
        { method: 'GET' },
        { maxRetries: 1, responseType: 'blob' }
    );

    return {
        success: !!data,
        blob: data,
        error: null,
    };
}

/**
 * Assign proposals to reviewers
 * @param {Array} idsOrUuids - Array of proposal IDs or UUIDs
 * @param {string} assignedTo - Reviewer ID or name
 */
export async function assignProposals(idsOrUuids = [], assignedTo) {
    const body = JSON.stringify({ ids: idsOrUuids, assignedTo });
    const data = await apiRequest('/admin/proposals/assign', { method: 'PATCH', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        results: data?.results || [],
        error: data?.error || null,
    };
}

/**
 * Set priority for proposals
 * @param {Array} idsOrUuids - Array of proposal IDs or UUIDs
 * @param {string} priority - Priority level (high, medium, low)
 */
export async function setProposalPriority(idsOrUuids = [], priority) {
    const body = JSON.stringify({ ids: idsOrUuids, priority });
    const data = await apiRequest('/admin/proposals/priority', { method: 'PATCH', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        results: data?.results || [],
        error: data?.error || null,
    };
}

/**
 * Archive proposals
 * @param {Array} idsOrUuids - Array of proposal IDs or UUIDs
 */
export async function archiveProposals(idsOrUuids = []) {
    const body = JSON.stringify({ ids: idsOrUuids });
    const data = await apiRequest('/admin/proposals/archive', { method: 'PATCH', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        results: data?.results || [],
        error: data?.error || null,
    };
}

/**
 * Delete proposals
 * @param {Array} idsOrUuids - Array of proposal IDs or UUIDs
 */
export async function deleteProposals(idsOrUuids = []) {
    const body = JSON.stringify({ ids: idsOrUuids });
    const data = await apiRequest('/admin/proposals/delete', { method: 'DELETE', body }, { maxRetries: 1 });
    return {
        success: !!data?.success,
        results: data?.results || [],
        error: data?.error || null,
    };
}

/**
 * Get search suggestions based on current search query
 * @param {string} query - Search query
 */
export async function getSearchSuggestions(query) {
    if (!query || query.length < 2) return { suggestions: [] };

    const data = await apiRequest(`/admin/proposals/suggestions?q=${encodeURIComponent(query)}`, { method: 'GET' }, { maxRetries: 1 });

    return {
        success: !!data?.success,
        suggestions: data?.suggestions || [],
        error: data?.error || null,
    };
}
