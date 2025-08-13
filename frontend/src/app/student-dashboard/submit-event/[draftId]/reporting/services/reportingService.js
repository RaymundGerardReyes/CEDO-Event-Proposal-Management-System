/**
 * Reporting Service Layer
 * Purpose: Centralized API operations for reporting functionality
 * Approach: Clean service methods with error handling and retry logic
 */

/**
 * Base API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Generic API request helper
 */
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

/**
 * Reporting Service Class
 */
export class ReportingService {
    /**
     * Submit accomplishment report
     * @param {Object} reportData - Report data including file
     * @returns {Promise<Object>} API response
     */
    static async submitAccomplishmentReport(reportData) {
        const formData = new FormData();

        // Add text fields
        formData.append('proposal_id', reportData.proposalId);
        formData.append('event_name', reportData.eventName);
        formData.append('completion_details', reportData.completionDetails);
        formData.append('outcome_reporting', reportData.outcomeReporting);

        // Add file if present
        if (reportData.accomplishmentReportFile) {
            formData.append('accomplishmentReport', reportData.accomplishmentReportFile);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/mongodb-unified/reports/accomplishment-reports`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error submitting accomplishment report:', error);
            throw error;
        }
    }

    /**
     * Submit event amendments
     * @param {Object} amendmentData - Amendment data
     * @returns {Promise<Object>} API response
     */
    static async submitEventAmendments(amendmentData) {
        return apiRequest('/api/mongodb-unified/reports/event-amendments', {
            method: 'POST',
            body: JSON.stringify(amendmentData)
        });
    }

    /**
     * Get proposal status and details
     * @param {string} proposalId - Proposal ID
     * @returns {Promise<Object>} Proposal data
     */
    static async getProposalStatus(proposalId) {
        return apiRequest(`/api/mongodb-unified/reports/proposal/${proposalId}`, {
            method: 'GET'
        });
    }

    /**
     * Get accomplishment report details
     * @param {string} reportId - Report ID
     * @returns {Promise<Object>} Report data
     */
    static async getAccomplishmentReport(reportId) {
        return apiRequest(`/api/mongodb-unified/reports/accomplishment/${reportId}`, {
            method: 'GET'
        });
    }

    /**
     * Update accomplishment report
     * @param {string} reportId - Report ID
     * @param {Object} updateData - Updated report data
     * @returns {Promise<Object>} API response
     */
    static async updateAccomplishmentReport(reportId, updateData) {
        const formData = new FormData();

        // Add text fields
        Object.keys(updateData).forEach(key => {
            if (key !== 'accomplishmentReportFile') {
                formData.append(key, updateData[key]);
            }
        });

        // Add file if present
        if (updateData.accomplishmentReportFile) {
            formData.append('accomplishmentReport', updateData.accomplishmentReportFile);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/mongodb-unified/reports/accomplishment-reports/${reportId}`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating accomplishment report:', error);
            throw error;
        }
    }

    /**
     * Get report status with retry logic
     * @param {string} proposalId - Proposal ID
     * @param {number} maxRetries - Maximum retry attempts
     * @returns {Promise<Object>} Status data
     */
    static async getReportStatusWithRetry(proposalId, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} to fetch report status`);

                const result = await this.getProposalStatus(proposalId);

                console.log('✅ Successfully fetched report status:', result);
                return result;

            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    // Wait before retry (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Validate file naming convention
     * @param {File} file - File to validate
     * @param {string} organizationName - Organization name
     * @returns {Object} Validation result
     */
    static validateFileName(file, organizationName) {
        if (!file) {
            return { isValid: false, error: 'Please select a file' };
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (!['pdf', 'doc', 'docx'].includes(fileExtension)) {
            return { isValid: false, error: 'File must be PDF or DOC/DOCX format' };
        }

        // Check if filename starts with organization name
        const fileNameWithoutExt = file.name.split('.')[0];
        const expectedPrefix = organizationName.replace(/\s+/g, '_');

        if (!fileNameWithoutExt.includes(expectedPrefix)) {
            return {
                isValid: false,
                error: `File must be named following the format: ${organizationName}_AR.${fileExtension}`
            };
        }

        return { isValid: true, error: null };
    }

    /**
     * Save form data to localStorage
     * @param {string} key - Storage key
     * @param {Object} data - Data to save
     */
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ Saved to localStorage: ${key}`);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    /**
     * Load form data from localStorage
     * @param {string} key - Storage key
     * @returns {Object|null} Loaded data or null
     */
    static loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    /**
     * Clear form data from localStorage
     * @param {string} key - Storage key
     */
    static clearFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            console.log(`🗑️ Cleared from localStorage: ${key}`);
        } catch (error) {
            console.error('Error clearing from localStorage:', error);
        }
    }
} 