/**
 * Reporting Types and Interfaces
 * Purpose: Type definitions for reporting functionality
 * Approach: JSDoc type annotations for better IDE support
 */

/**
 * @typedef {Object} ProposalStatus
 * @property {string} proposal_status - Current proposal status (draft, pending, approved, denied)
 * @property {string} report_status - Current report status (draft, pending, revision, approved)
 * @property {string} mysql_id - MySQL proposal ID
 * @property {string} admin_comments - Admin feedback comments
 * @property {string} submitted_at - Submission timestamp
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} AccomplishmentReport
 * @property {string} eventName - Name of the event as implemented
 * @property {string} completionDetails - Narrative summary of event completion
 * @property {string} outcomeReporting - Results and impact description
 * @property {File|null} accomplishmentReportFile - Uploaded report file
 * @property {string} reportStatus - Current report status
 * @property {string} submittedAt - Submission timestamp
 */

/**
 * @typedef {Object} EventAmendment
 * @property {string} finalVenue - Final event venue
 * @property {string} finalStartDate - Final start date
 * @property {string} finalEndDate - Final end date
 * @property {string} finalTimeStart - Final start time
 * @property {string} finalTimeEnd - Final end time
 * @property {string} finalEventMode - Final event mode (online, offline, hybrid)
 * @property {string} changeReason - Reason for changes
 */

/**
 * @typedef {Object} ReportingFormData
 * @property {string} eventName - Event name
 * @property {string} completionDetails - Completion details
 * @property {string} outcomeReporting - Outcome reporting
 * @property {File|null} accomplishmentReportFile - Report file
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string|null} error - Error message if validation failed
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether the API call was successful
 * @property {string} message - Response message
 * @property {Object} data - Response data
 * @property {string} error - Error message if failed
 */

/**
 * @typedef {Object} ReportingProgress
 * @property {number} eventName - Progress percentage for event name (0-100)
 * @property {number} completionDetails - Progress percentage for completion details (0-100)
 * @property {number} outcomeReporting - Progress percentage for outcome reporting (0-100)
 * @property {number} file - Progress percentage for file upload (0-100)
 */

/**
 * @typedef {Object} ReportingState
 * @property {ReportingFormData} formData - Current form data
 * @property {boolean} isLoading - Loading state
 * @property {boolean} isSaving - Saving state
 * @property {boolean} isSubmitting - Submitting state
 * @property {string|null} error - Error message
 * @property {Object} validationErrors - Validation errors
 * @property {boolean} saveSuccess - Save success state
 * @property {boolean} submitSuccess - Submit success state
 */

/**
 * @typedef {Object} ReportingActions
 * @property {Function} updateFormData - Update form data
 * @property {Function} submitReport - Submit the report
 * @property {Function} clearError - Clear error state
 * @property {Function} resetForm - Reset form to initial state
 * @property {Function} validateForm - Validate form data
 */

/**
 * @typedef {Object} ReportingComputed
 * @property {boolean} isProposalApproved - Whether proposal is approved
 * @property {boolean} isFormComplete - Whether form is complete
 * @property {boolean} hasValidationErrors - Whether there are validation errors
 * @property {Object} eventDetails - Event details object
 * @property {ReportingProgress} progress - Form completion progress
 * @property {boolean} canSubmit - Whether form can be submitted
 */

/**
 * @typedef {Object} ReportingHookReturn
 * @property {ReportingState} state - Current state
 * @property {ReportingActions} actions - Available actions
 * @property {ReportingComputed} computed - Computed values
 */

/**
 * Status constants for reporting
 */
export const REPORTING_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    REVISION: 'revision',
    APPROVED: 'approved',
    DENIED: 'denied'
};

/**
 * Event mode constants
 */
export const EVENT_MODE = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    HYBRID: 'hybrid'
};

/**
 * File type constants
 */
export const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx'];

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
    EVENT_NAME_REQUIRED: 'Event name is required',
    COMPLETION_DETAILS_REQUIRED: 'Event completion details are required',
    OUTCOME_REPORTING_REQUIRED: 'Outcome reporting is required',
    FILE_REQUIRED: 'Accomplishment report file is required',
    INVALID_FILE_TYPE: 'File must be PDF or DOC/DOCX format',
    INVALID_FILE_NAME: 'File must be named following the format: {organization}_AR.{extension}'
};

/**
 * API endpoints for reporting
 */
export const REPORTING_ENDPOINTS = {
    ACCOMPLISHMENT_REPORTS: '/api/mongodb-unified/reports/accomplishment-reports',
    EVENT_AMENDMENTS: '/api/mongodb-unified/reports/event-amendments',
    PROPOSAL_STATUS: '/api/mongodb-unified/reports/proposal',
    ACCOMPLISHMENT_REPORT: '/api/mongodb-unified/reports/accomplishment'
};

/**
 * Local storage keys for reporting
 */
export const STORAGE_KEYS = {
    REPORTING_FORM_DATA: 'reporting_form_data',
    CURRENT_PROPOSAL_STATUS: 'current_proposal_status',
    CURRENT_REPORT_STATUS: 'current_report_status',
    CURRENT_MYSQL_PROPOSAL_ID: 'current_mysql_proposal_id',
    ADMIN_COMMENTS: 'admin_comments',
    SUBMISSION_TIMESTAMP: 'submission_timestamp'
};

/**
 * Default form data
 */
export const DEFAULT_FORM_DATA = {
    eventName: '',
    completionDetails: '',
    outcomeReporting: '',
    accomplishmentReportFile: null
};

/**
 * Default amendment data
 */
export const DEFAULT_AMENDMENT_DATA = {
    finalVenue: '',
    finalStartDate: '',
    finalEndDate: '',
    finalTimeStart: '',
    finalTimeEnd: '',
    finalEventMode: '',
    changeReason: ''
};

/**
 * Helper function to create a new reporting form data object
 * @param {Partial<ReportingFormData>} data - Initial data
 * @returns {ReportingFormData} New form data object
 */
export function createReportingFormData(data = {}) {
    return {
        ...DEFAULT_FORM_DATA,
        ...data
    };
}

/**
 * Helper function to create a new amendment data object
 * @param {Partial<EventAmendment>} data - Initial data
 * @returns {EventAmendment} New amendment data object
 */
export function createAmendmentData(data = {}) {
    return {
        ...DEFAULT_AMENDMENT_DATA,
        ...data
    };
}

/**
 * Helper function to validate file naming convention
 * @param {string} fileName - File name to validate
 * @param {string} organizationName - Organization name
 * @returns {ValidationResult} Validation result
 */
export function validateFileName(fileName, organizationName) {
    if (!fileName) {
        return { isValid: false, error: VALIDATION_MESSAGES.FILE_REQUIRED };
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
        return { isValid: false, error: VALIDATION_MESSAGES.INVALID_FILE_TYPE };
    }

    const fileNameWithoutExt = fileName.split('.')[0];
    const expectedPrefix = organizationName.replace(/\s+/g, '_');

    if (!fileNameWithoutExt.includes(expectedPrefix)) {
        return {
            isValid: false,
            error: VALIDATION_MESSAGES.INVALID_FILE_NAME.replace('{organization}', organizationName).replace('{extension}', fileExtension)
        };
    }

    return { isValid: true, error: null };
}

/**
 * Helper function to calculate form progress
 * @param {ReportingFormData} formData - Form data
 * @returns {ReportingProgress} Progress object
 */
export function calculateProgress(formData) {
    return {
        eventName: formData.eventName ? 25 : 0,
        completionDetails: formData.completionDetails ? 50 : 0,
        outcomeReporting: formData.outcomeReporting ? 75 : 0,
        file: formData.accomplishmentReportFile ? 100 : 0
    };
}

/**
 * Helper function to check if form is complete
 * @param {ReportingFormData} formData - Form data
 * @returns {boolean} Whether form is complete
 */
export function isFormComplete(formData) {
    return !!(formData.eventName && formData.completionDetails && formData.outcomeReporting);
}

/**
 * Helper function to format timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return 'Not submitted';

    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Invalid date';
    }
} 