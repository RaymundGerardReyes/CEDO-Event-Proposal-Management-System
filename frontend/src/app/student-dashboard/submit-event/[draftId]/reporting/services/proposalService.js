/**
 * Proposal Service
 * Handles all API calls to backend proposal endpoints
 * 
 * Key approaches: UUID-based operations, localStorage integration,
 * comprehensive error handling, and status management
 */

import { getToken } from '@/utils/auth-utils';
import { safeJsonParse } from '@/app/student-dashboard/submit-event/[draftId]/utils';

/**
 * Enhanced logger for proposal operations
 */
const logger = {
    info: (message, data = {}) => {
        console.log(`[Proposal Service] ${message}`, data);
    },
    warn: (message, data = {}) => {
        console.warn(`[Proposal Service] ⚠️ ${message}`, data);
    },
    error: (message, error = null, data = {}) => {
        const errorInfo = {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            name: error?.name,
            ...data
        };
        console.error(`[Proposal Service] ❌ ${message}`, errorInfo);
    },
    success: (message, data = {}) => {
        console.log(`[Proposal Service] ✅ ${message}`, data);
    }
};

/**
 * Get or create proposal UUID
 * Checks localStorage first, then creates new proposal if needed
 */
export async function getOrCreateProposalUuid(organizationName = 'New Organization') {
    try {
        // Check localStorage first
        const storedUuid = localStorage.getItem('proposal_uuid');
        if (storedUuid && isValidUUID(storedUuid)) {
            logger.info('Retrieved stored proposal UUID', { uuid: storedUuid });
            return storedUuid;
        }

        // Generate new UUID
        const newUuid = generateUUID();
        logger.info('Generated new proposal UUID', { uuid: newUuid });

        // Create proposal in backend
        const proposal = await createProposal({
            uuid: newUuid,
            organization_name: organizationName,
            current_section: 'orgInfo',
            proposal_status: 'draft'
        });

        if (proposal && proposal.uuid) {
            // Store in localStorage
            localStorage.setItem('proposal_uuid', proposal.uuid);
            localStorage.setItem('proposal_status', proposal.proposal_status);
            localStorage.setItem('current_section', proposal.current_section);

            logger.success('Proposal created and stored', { uuid: proposal.uuid });
            return proposal.uuid;
        }

        throw new Error('Failed to create proposal');
    } catch (error) {
        logger.error('Error in getOrCreateProposalUuid', error);
        throw error;
    }
}

/**
 * Create new proposal
 */
export async function createProposal(proposalData) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch('/api/proposals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(proposalData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        logger.success('Proposal created', { uuid: result.uuid });
        return result;
    } catch (error) {
        logger.error('Error creating proposal', error, { proposalData });
        throw error;
    }
}

/**
 * Update proposal
 */
export async function updateProposal(uuid, updateData) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`/api/proposals/${uuid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Update localStorage
        if (updateData.proposal_status) {
            localStorage.setItem('proposal_status', updateData.proposal_status);
        }
        if (updateData.current_section) {
            localStorage.setItem('current_section', updateData.current_section);
        }

        logger.success('Proposal updated', { uuid, updates: updateData });
        return result;
    } catch (error) {
        logger.error('Error updating proposal', error, { uuid, updateData });
        throw error;
    }
}

/**
 * Get proposal by UUID
 */
export async function getProposal(uuid) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`/api/proposals/${uuid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        logger.success('Proposal retrieved', { uuid });
        return result;
    } catch (error) {
        logger.error('Error getting proposal', error, { uuid });
        throw error;
    }
}

/**
 * Submit proposal
 */
export async function submitProposal(uuid) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`/api/proposals/${uuid}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Update localStorage
        localStorage.setItem('proposal_status', result.proposal_status);
        localStorage.setItem('current_section', result.current_section);

        logger.success('Proposal submitted', { uuid, status: result.proposal_status });
        return result;
    } catch (error) {
        logger.error('Error submitting proposal', error, { uuid });
        throw error;
    }
}

/**
 * Submit report for approved proposal
 */
export async function submitReport(uuid, reportData) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`/api/proposals/${uuid}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                throw new Error('Report can only be submitted for approved proposals');
            }
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Update localStorage
        localStorage.setItem('report_status', result.report_status);

        logger.success('Report submitted', { uuid, status: result.report_status });
        return result;
    } catch (error) {
        logger.error('Error submitting report', error, { uuid, reportData });
        throw error;
    }
}

/**
 * Get debug information for proposal
 */
export async function getDebugInfo(uuid) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`/api/proposals/${uuid}/debug`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Use safeJsonParse for error responses
            const errorData = await safeJsonParse(response, 'debug-info-error', { uuid });
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Use safeJsonParse for successful responses
        const result = await safeJsonParse(response, 'debug-info', { uuid });
        logger.success('Debug info retrieved', { uuid });
        return result;
    } catch (error) {
        logger.error('Error getting debug info', error, { uuid });
        throw error;
    }
}

/**
 * Add debug log entry
 */
export async function addDebugLog(uuid, source, message, meta = null) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`/api/proposals/${uuid}/debug/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ source, message, meta })
        });

        if (!response.ok) {
            // Use safeJsonParse for error responses
            const errorData = await safeJsonParse(response, 'debug-log-error', { uuid, source });
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Use safeJsonParse for successful responses
        const result = await safeJsonParse(response, 'debug-log', { uuid, source });
        logger.success('Debug log added', { uuid, source, message });
        return result;
    } catch (error) {
        logger.error('Error adding debug log', error, { uuid, source, message });
        throw error;
    }
}

/**
 * Clear proposal data from localStorage
 */
export function clearProposalData() {
    try {
        localStorage.removeItem('proposal_uuid');
        localStorage.removeItem('proposal_status');
        localStorage.removeItem('current_section');
        localStorage.removeItem('report_status');

        logger.success('Proposal data cleared from localStorage');
    } catch (error) {
        logger.error('Error clearing proposal data', error);
    }
}

/**
 * Get proposal data from localStorage
 */
export function getProposalData() {
    try {
        const uuid = localStorage.getItem('proposal_uuid');
        const status = localStorage.getItem('proposal_status');
        const section = localStorage.getItem('current_section');
        const reportStatus = localStorage.getItem('report_status');

        return {
            uuid,
            status,
            section,
            reportStatus,
            isValid: uuid && isValidUUID(uuid)
        };
    } catch (error) {
        logger.error('Error getting proposal data from localStorage', error);
        return { isValid: false };
    }
}

/**
 * Update proposal progress
 */
export async function updateProposalProgress(uuid, section, completionPercentage) {
    try {
        const updateData = {
            current_section: section,
            form_completion_percentage: completionPercentage
        };

        const result = await updateProposal(uuid, updateData);

        // Update localStorage
        localStorage.setItem('current_section', section);

        logger.success('Proposal progress updated', {
            uuid,
            section,
            completionPercentage
        });

        return result;
    } catch (error) {
        logger.error('Error updating proposal progress', error, {
            uuid,
            section,
            completionPercentage
        });
        throw error;
    }
}

/**
 * Utility function to validate UUID format
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Utility function to generate UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Export proposal data for debugging
 */
export function exportProposalData() {
    try {
        const proposalData = getProposalData();
        const exportData = {
            timestamp: new Date().toISOString(),
            proposal_data: proposalData,
            localStorage: {
                proposal_uuid: localStorage.getItem('proposal_uuid'),
                proposal_status: localStorage.getItem('proposal_status'),
                current_section: localStorage.getItem('current_section'),
                report_status: localStorage.getItem('report_status')
            },
            sessionStorage: {
                // Add any session storage data if needed
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proposal-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        logger.success('Proposal data exported');
        return exportData;
    } catch (error) {
        logger.error('Error exporting proposal data', error);
        throw error;
    }
}
