/**
 * Utility Helper Functions for Section 5 Reporting
 * Extracted from monolithic component for better maintainability
 */

/**
 * Convert Date objects or ISO strings to MySQL-friendly YYYY-MM-DD format
 * @param {Date|string|null} value - Date value to convert
 * @returns {string} MySQL date format or empty string
 */
export const toMysqlDate = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.split('T')[0];
    try {
        return new Date(value).toISOString().split('T')[0];
    } catch {
        return String(value);
    }
};

/**
 * Build a normalized API base URL (backend root without /api suffix)
 * @returns {string} Normalized backend base URL
 */
import { getAppConfig } from '@/lib/utils';

export const getApiBase = () => {
    return getAppConfig().backendUrl;
}

/**
 * Check if form data has minimum required information
 * @param {Object} data - Form data to validate
 * @returns {boolean} True if has minimum required data
 */
export const hasMinimumRequiredData = (data) => {
    if (!data) return false;
    const hasOrgInfo = data.organizationName && data.contactEmail;
    const hasProposalId = data.id || data.proposalId || data.organization_id;
    return hasOrgInfo || hasProposalId;
};

/**
 * Get authentication token from cookies or localStorage
 * @returns {string|null} Authentication token
 */
export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
        return localStorage.getItem('cedo_token') || localStorage.getItem('token');
    }
    return null;
};

/**
 * Validate file upload constraints
 * @param {File} file - File to validate
 * @param {string[]} validFormats - Array of valid formats
 * @param {string} namingPattern - Optional naming pattern
 * @param {string} organizationName - Organization name for pattern validation
 * @returns {string[]} Array of error messages
 */
export const validateFile = (file, validFormats, namingPattern = null, organizationName = '') => {
    const errors = [];

    // Format validation
    if (!validFormats.includes(file.type) && !validFormats.some(format => file.name.toLowerCase().endsWith(format))) {
        const formatList = validFormats.join(', ');
        errors.push(`File must be in ${formatList} format`);
    }

    // Size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        errors.push('File size must be less than 10MB');
    }

    // Naming pattern validation
    if (namingPattern && organizationName) {
        const expectedPrefix = organizationName.replace(/\s+/g, "") + namingPattern;
        if (!file.name.startsWith(expectedPrefix)) {
            errors.push(`File name must follow format: ${expectedPrefix}`);
        }
    }

    return errors;
};

/**
 * Get event details from form data based on organization type
 * @param {Object} formData - Complete form data
 * @returns {Object} Event details object
 */
export const getEventDetails = (formData) => {
    const isSchoolBased = formData.organizationTypes?.includes("school-based");

    return {
        eventName: isSchoolBased ? formData.schoolEventName : formData.communityEventName,
        eventVenue: formData.event_venue ?? (isSchoolBased ? formData.schoolVenue : formData.communityVenue),
        eventStartDate: isSchoolBased ? formData.schoolStartDate : formData.communityStartDate,
        eventEndDate: isSchoolBased ? formData.schoolEndDate : formData.communityEndDate,
        isSchoolBased
    };
};

/**
 * Score data completeness for recovery prioritization
 * @param {Object} data - Data to score
 * @returns {number} Completeness score
 */
export const scoreDataCompleteness = (data) => {
    let score = 0;
    if (data.organizationName) score += 20;
    if (data.contactEmail) score += 20;
    if (data.id || data.proposalId) score += 10;
    if (data.schoolEventName || data.communityEventName) score += 5;
    score += Object.keys(data).length;
    return score;
};

/**
 * Merge form data with priority: local > recovered > provided
 * @param {Object} providedData - Data from props
 * @param {Object} recoveredData - Data from recovery
 * @param {Object} localData - Local user edits
 * @returns {Object} Merged form data
 */
export const mergeFormData = (providedData = {}, recoveredData = {}, localData = {}) => {
    const base = recoveredData || providedData || {};
    return { ...base, ...localData };
};

/**
 * Generate form data payload for API submission
 * @param {Object} data - Form data
 * @param {string} proposalId - Proposal ID
 * @param {Object} uploadedFiles - Uploaded files object
 * @returns {FormData} Ready-to-submit FormData object
 */
export const createFormDataPayload = (data, proposalId, uploadedFiles = {}) => {
    const formDataPayload = new FormData();

    // Add proposal ID
    formDataPayload.append('proposal_id', proposalId);

    // Get event details
    const { eventName, eventVenue, eventStartDate, eventEndDate } = getEventDetails(data);

    // Add form fields (only non-empty values)
    const getDateString = (val) => {
        // If it's already a simple YYYY-MM-DD string just return it; otherwise format
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        return toMysqlDate(val);
    };

    const fieldsToSave = {
        event_status: data.event_status,
        event_venue: eventVenue,
        report_description: data.reportDescription,
        attendance_count: data.attendanceCount,
        organization_name: data.organizationName,
        event_name: eventName,
        event_start_date: getDateString(eventStartDate),
        event_end_date: getDateString(eventEndDate)
    };

    Object.entries(fieldsToSave).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            formDataPayload.append(key, value);
        }
    });

    // Add files
    if (uploadedFiles.accomplishmentReport) {
        formDataPayload.append('accomplishment_report_file', uploadedFiles.accomplishmentReport);
    }
    if (uploadedFiles.preRegistrationList) {
        formDataPayload.append('pre_registration_file', uploadedFiles.preRegistrationList);
    }
    if (uploadedFiles.finalAttendanceList) {
        formDataPayload.append('final_attendance_file', uploadedFiles.finalAttendanceList);
    }

    return formDataPayload;
};

/**
 * Constants for file upload validation
 */
export const FILE_VALIDATION = {
    ACCOMPLISHMENT_REPORT: {
        formats: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.pdf', '.docx'
        ],
        namingPattern: '_AR'
    },
    CSV_FILES: {
        formats: ['text/csv', '.csv'],
        namingPattern: null
    },
    MAX_SIZE: 10 * 1024 * 1024 // 10MB
};

/**
 * Storage keys for localStorage operations
 */
export const STORAGE_KEYS = [
    'eventProposalFormData',
    'cedoFormData',
    'formData',
    'submitEventFormData',
    'autoSavedFormData'
]; 