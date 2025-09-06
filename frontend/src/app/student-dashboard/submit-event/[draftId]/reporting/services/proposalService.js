/**
 * Proposal Service
 * Handles all API calls to backend proposal endpoints
 * 
 * Key approaches: UUID-based operations, localStorage integration,
 * comprehensive error handling, and status management
 */

import { safeJsonParse } from '@/app/student-dashboard/submit-event/[draftId]/utils';
import { getToken } from '@/utils/auth-utils';

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
export async function getOrCreateProposalUuid() {
    try {
        // Check localStorage first
        const existingUuid = localStorage.getItem('proposal_uuid');
        if (existingUuid) {
            logger.info('Found existing proposal UUID in localStorage', { uuid: existingUuid });
            return existingUuid;
        }

        // Generate new UUID
        const newUuid = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Store in localStorage
        localStorage.setItem('proposal_uuid', newUuid);

        logger.success('Created new proposal UUID', { uuid: newUuid });
        return newUuid;
    } catch (error) {
        logger.error('Error getting or creating proposal UUID', error);
        throw error;
    }
}

/**
 * Get proposal data from localStorage
 */
export function getProposalData() {
    try {
        const uuid = localStorage.getItem('proposal_uuid');
        if (!uuid) {
            return null;
        }

        const data = {
            uuid,
            status: localStorage.getItem('current_proposal_status') || 'draft',
            section: localStorage.getItem('current_section') || 'overview',
            mysqlId: localStorage.getItem('current_mysql_proposal_id'),
            lastUpdated: localStorage.getItem('submission_timestamp')
        };

        logger.info('Retrieved proposal data from localStorage', data);
        return data;
    } catch (error) {
        logger.error('Error getting proposal data', error);
        throw error; // Re-throw the error so it can be caught by getFallbackDebugInfo
    }
}

/**
 * Save proposal data to localStorage
 */
export function saveProposalData(data) {
    try {
        if (data.uuid) {
            localStorage.setItem('proposal_uuid', data.uuid);
        }
        if (data.status) {
            localStorage.setItem('current_proposal_status', data.status);
        }
        if (data.section) {
            localStorage.setItem('current_section', data.section);
        }
        if (data.mysqlId) {
            localStorage.setItem('current_mysql_proposal_id', data.mysqlId);
        }
        if (data.lastUpdated) {
            localStorage.setItem('submission_timestamp', data.lastUpdated);
        }

        logger.success('Saved proposal data to localStorage', data);
    } catch (error) {
        logger.error('Error saving proposal data', error);
    }
}

/**
 * Submit proposal to backend
 */
export async function submitProposal(uuid, proposalData) {
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
            },
            body: JSON.stringify(proposalData)
        });

        if (!response.ok) {
            const errorData = await safeJsonParse(response, 'submit-proposal-error', { uuid });
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await safeJsonParse(response, 'submit-proposal', { uuid });
        logger.success('Proposal submitted successfully', { uuid });
        return result;
    } catch (error) {
        logger.error('Error submitting proposal', error, { uuid, proposalData });
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
            const errorData = await safeJsonParse(response, 'submit-report-error', { uuid });
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await safeJsonParse(response, 'submit-report', { uuid });
        logger.success('Report submitted successfully', { uuid });
        return result;
    } catch (error) {
        logger.error('Error submitting report', error, { uuid, reportData });
        throw error;
    }
}

/**
 * Get debug information for proposal
 * Enhanced with fallback functionality and better error handling
 */
export async function getDebugInfo(uuid) {
    try {
        // First, try to get token
        const token = getToken();

        // If no token, return fallback debug info
        if (!token) {
            logger.warn('No authentication token available, returning fallback debug info', { uuid });
            return getFallbackDebugInfo(uuid);
        }

        const response = await fetch(`/api/proposals/${uuid}/debug`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // If it's a 404, the endpoint might not exist or proposal not found
            if (response.status === 404) {
                logger.warn('Debug endpoint returned 404, using fallback', { uuid });
                return getFallbackDebugInfo(uuid);
            }

            // Use safeJsonParse for error responses
            const errorData = await safeJsonParse(response, 'debug-info-error', { uuid });
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Use safeJsonParse for successful responses
        const result = await safeJsonParse(response, 'debug-info', { uuid });
        logger.success('Debug info retrieved from backend', { uuid });
        return result;
    } catch (error) {
        logger.error('Error getting debug info from backend, using fallback', error, { uuid });
        return getFallbackDebugInfo(uuid);
    }
}

/**
 * Get fallback debug information when backend is unavailable
 */
function getFallbackDebugInfo(uuid) {
    try {
        const localData = getProposalData();
        const fallbackInfo = {
            mysql_record: null,
            audit_logs: [],
            debug_logs: [],
            status_match: true,
            fallback: true,
            local_data: localData,
            timestamp: new Date().toISOString(),
            message: 'Using fallback debug info - backend endpoint unavailable'
        };

        logger.info('Generated fallback debug info', { uuid, fallbackInfo });
        return fallbackInfo;
    } catch (error) {
        logger.error('Error generating fallback debug info', error, { uuid });
        return {
            mysql_record: null,
            audit_logs: [],
            debug_logs: [],
            status_match: false,
            fallback: true,
            error: error.message,
            timestamp: new Date().toISOString(),
            message: 'Failed to generate fallback debug info'
        };
    }
}

/**
 * Add debug log entry
 * Enhanced with fallback functionality
 */
export async function addDebugLog(uuid, source, message, meta = null) {
    try {
        // First, try to get token
        const token = getToken();

        // If no token, just log locally
        if (!token) {
            logger.warn('No authentication token available, logging locally only', { uuid, source });
            addLocalDebugLog(uuid, source, message, meta);
            return { id: Date.now(), source, message, meta, local: true };
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
            // If it's a 404, the endpoint might not exist
            if (response.status === 404) {
                logger.warn('Debug log endpoint returned 404, logging locally only', { uuid, source });
                addLocalDebugLog(uuid, source, message, meta);
                return { id: Date.now(), source, message, meta, local: true };
            }

            // Use safeJsonParse for error responses
            const errorData = await safeJsonParse(response, 'debug-log-error', { uuid, source });
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Use safeJsonParse for successful responses
        const result = await safeJsonParse(response, 'debug-log', { uuid, source });
        logger.success('Debug log added to backend', { uuid, source, message });
        return result;
    } catch (error) {
        logger.error('Error adding debug log to backend, logging locally only', error, { uuid, source, message });
        addLocalDebugLog(uuid, source, message, meta);
        return { id: Date.now(), source, message, meta, local: true };
    }
}

/**
 * Add debug log to localStorage when backend is unavailable
 */
function addLocalDebugLog(uuid, source, message, meta = null) {
    try {
        const logs = JSON.parse(localStorage.getItem('local_debug_logs') || '[]');
        const newLog = {
            id: Date.now(),
            proposal_uuid: uuid,
            source,
            message,
            meta,
            created_at: new Date().toISOString(),
            local: true
        };

        logs.push(newLog);

        // Keep only last 50 logs to prevent localStorage overflow
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }

        localStorage.setItem('local_debug_logs', JSON.stringify(logs));
        logger.info('Added local debug log', { uuid, source, message });
    } catch (error) {
        logger.error('Error adding local debug log', error, { uuid, source, message });
    }
}

/**
 * Clear proposal data from localStorage
 */
export function clearProposalData() {
    try {
        localStorage.removeItem('proposal_uuid');
        localStorage.removeItem('current_proposal_status');
        localStorage.removeItem('current_section');
        localStorage.removeItem('current_mysql_proposal_id');
        localStorage.removeItem('submission_timestamp');
        localStorage.removeItem('local_debug_logs');

        logger.success('Cleared all proposal data from localStorage');
    } catch (error) {
        logger.error('Error clearing proposal data', error);
    }
}
