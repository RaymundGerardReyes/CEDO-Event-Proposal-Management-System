// frontend/src/utils/proposals.js

/**
 * Proposal utilities
 * - normalizeProposal: convert various backend field shapes to a canonical client schema
 * - buildFilesObject: construct a normalized files map from legacy fields
 * - highlightMatches: wrap matched substrings with markers for UI highlight rendering
 */

/**
 * Build files object from legacy flat fields
 */
function buildFilesObject(raw) {
    const files = {};
    if (raw.gpoa_file_name) {
        files.gpoa = {
            name: raw.gpoa_file_name,
            size: raw.gpoa_file_size,
            type: raw.gpoa_file_type,
            path: raw.gpoa_file_path,
        };
    }
    if (raw.project_proposal_file_name) {
        files.projectProposal = {
            name: raw.project_proposal_file_name,
            size: raw.project_proposal_file_size,
            type: raw.project_proposal_file_type,
            path: raw.project_proposal_file_path,
        };
    }
    return files;
}

/**
 * Normalize a single proposal into canonical client shape
 */
export function normalizeProposal(raw) {
    if (!raw || typeof raw !== 'object') return null;

    // Normalize files:
    // - If backend returns an array, pass it through so UIs expecting an array can render.
    // - If backend returns an object map, use it as-is.
    // - Otherwise, build from legacy flat fields.
    const files = Array.isArray(raw.files)
        ? raw.files
        : (raw.files && typeof raw.files === 'object')
            ? raw.files
            : buildFilesObject(raw);

    const status = raw.status || raw.proposal_status || 'pending';

    return {
        id: raw.id ?? null,
        uuid: raw.uuid ?? String(raw.id ?? ''),
        // API already returns the correct field names - use them directly
        organization: raw.organization || '',
        eventName: raw.eventName || '',
        status,
        adminComments: raw.adminComments || '',
        // Expose common file name fallbacks for UI that reads specific fields
        gpoaFileName: raw.gpoaFileName || raw.gpoa_file_name || null,
        projectProposalFileName: raw.projectProposalFileName || raw.project_proposal_file_name || null,
        contact: {
            name: raw.contact?.name || '',
            email: raw.contact?.email || '',
            phone: raw.contact?.phone || '',
        },
        organizationType: raw.organizationType || '',
        venue: raw.location || '',
        // Frontend expects 'date' field for event start date
        date: raw.date || '',
        startDate: raw.startDate || '',
        endDate: raw.endDate || '',
        startTime: raw.startTime || '',
        endTime: raw.endTime || '',
        // Map type to organization_type as per database schema
        type: raw.type || '',
        eventType: raw.eventType || '',
        eventMode: raw.eventMode || '',
        createdAt: raw.createdAt || '',
        updatedAt: raw.updatedAt || '',
        submittedAt: raw.submittedAt || '',
        approvedAt: raw.approvedAt || '',
        reviewedAt: raw.reviewedAt || '',
        hasFiles: Array.isArray(files)
            ? files.length > 0
            : !!(files && typeof files === 'object' && Object.keys(files).length > 0),
        files,
        // Additional fields for details view
        description: raw.description || '',
        budget: raw.budget || 0,
        volunteersNeeded: raw.volunteersNeeded || 0,
        attendanceCount: raw.attendanceCount || 0,
        targetAudience: raw.targetAudience || [],
        sdpCredits: raw.sdpCredits || 0,
        // keep raw for debugging if needed
        _raw: raw,
    };
}

/**
 * Highlight matches within a string with start/end markers for UI components to render.
 * Returns an array of segments with { text, match }.
 */
export function highlightMatches(text, query) {
    if (!query || !text) return [{ text: String(text || ''), match: false }];
    const q = String(query).trim();
    if (!q) return [{ text: String(text), match: false }];
    try {
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
        const parts = String(text).split(regex);
        return parts.filter(Boolean).map(part => ({ text: part, match: regex.test(part) }));
    } catch {
        return [{ text: String(text), match: false }];
    }
}

export function getFilesCount(files) {
    if (!files) return 0;
    if (Array.isArray(files)) return files.length;
    if (typeof files === 'object') return Object.keys(files).length;
    return 0;
}
