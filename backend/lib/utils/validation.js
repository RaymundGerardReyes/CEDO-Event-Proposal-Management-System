/**
 * Unified Validation Utility Functions
 * Purpose: Centralized validation logic for all proposal fields
 * Key approaches: Consistent validation rules, comprehensive error messages, reusable validators
 */

const { formatISO, validateDateRange } = require('./date');

// ===================================================================
// VALIDATION RULES
// ===================================================================

/**
 * Common validation rules for proposal fields
 */
const VALIDATION_RULES = {
    // Organization fields
    organizationName: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-\.]+$/,
        message: 'Organization name must be 2-100 characters and contain only letters, numbers, spaces, hyphens, and periods'
    },

    contactName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
        message: 'Contact name must be 2-50 characters and contain only letters and spaces'
    },

    contactEmail: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },

    contactPhone: {
        required: false,
        pattern: /^\d{11}$/,
        message: 'Phone number must be exactly 11 digits'
    },

    // Event fields
    eventName: {
        required: true,
        minLength: 5,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-\.]+$/,
        message: 'Event name must be 5-100 characters and contain only letters, numbers, spaces, hyphens, and periods'
    },

    venue: {
        required: true,
        minLength: 5,
        maxLength: 200,
        pattern: /^[a-zA-Z0-9\s\-\.\,]+$/,
        message: 'Venue must be 5-200 characters and contain only letters, numbers, spaces, hyphens, periods, and commas'
    },

    startDate: {
        required: true,
        validator: (value) => {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime()) && date >= new Date();
        },
        message: 'Start date must be a valid date in the future'
    },

    endDate: {
        required: true,
        validator: (value) => {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime()) && date >= new Date();
        },
        message: 'End date must be a valid date in the future'
    },

    startTime: {
        required: true,
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        message: 'Start time must be in HH:MM format (24-hour)'
    },

    endTime: {
        required: true,
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        message: 'End time must be in HH:MM format (24-hour)'
    },

    eventType: {
        required: true,
        enum: ['academic-competition', 'cultural-festival', 'sports-event', 'leadership-summit', 'community-service', 'academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others'],
        message: 'Please select a valid event type'
    },

    eventMode: {
        required: true,
        enum: ['online', 'offline', 'hybrid'],
        message: 'Please select a valid event mode'
    },

    sdpCredits: {
        required: true,
        min: 1,
        max: 10,
        pattern: /^\d+$/,
        message: 'SDP credits must be a number between 1 and 10'
    },

    targetAudience: {
        required: true,
        validator: (value) => {
            if (!Array.isArray(value)) return false;
            return value.length > 0 && value.length <= 10;
        },
        message: 'Please select at least one target audience (maximum 10)'
    },

    // File fields
    gpoaFile: {
        required: true,
        validator: (file) => {
            if (!file) return false;
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            return allowedTypes.includes(file.type) && file.size <= maxSize;
        },
        message: 'GPOA document must be a PDF or image file (JPEG, PNG) under 5MB'
    },

    proposalFile: {
        required: false,
        validator: (file) => {
            if (!file) return true; // Optional field
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const maxSize = 10 * 1024 * 1024; // 10MB
            return allowedTypes.includes(file.type) && file.size <= maxSize;
        },
        message: 'Proposal document must be a PDF or Word document under 10MB'
    }
};

// ===================================================================
// VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate a single field against its rules
 * @param {string} fieldName - Name of the field to validate
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateField(fieldName, value, options = {}) {
    const rule = VALIDATION_RULES[fieldName];

    if (!rule) {
        return { isValid: true, error: null };
    }

    // Check if field is required
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return { isValid: false, error: rule.message };
    }

    // Skip validation for optional empty fields
    if (!rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return { isValid: true, error: null };
    }

    // Check minimum length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        return { isValid: false, error: rule.message };
    }

    // Check maximum length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        return { isValid: false, error: rule.message };
    }

    // Check minimum value
    if (rule.min !== undefined && Number(value) < rule.min) {
        return { isValid: false, error: rule.message };
    }

    // Check maximum value
    if (rule.max !== undefined && Number(value) > rule.max) {
        return { isValid: false, error: rule.message };
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return { isValid: false, error: rule.message };
    }

    // Check enum values
    if (rule.enum && !rule.enum.includes(value)) {
        return { isValid: false, error: rule.message };
    }

    // Check custom validator
    if (rule.validator && !rule.validator(value)) {
        return { isValid: false, error: rule.message };
    }

    return { isValid: true, error: null };
}

/**
 * Validate multiple fields at once
 * @param {Object} data - Object containing field values
 * @param {Array} fields - Array of field names to validate
 * @returns {Object} Validation results
 */
function validateFields(data, fields) {
    const errors = {};
    let isValid = true;

    fields.forEach(fieldName => {
        const result = validateField(fieldName, data[fieldName]);
        if (!result.isValid) {
            errors[fieldName] = result.error;
            isValid = false;
        }
    });

    return { isValid, errors };
}

/**
 * Validate proposal data based on event type
 * @param {Object} data - Proposal data
 * @param {string} eventType - Event type ('school-based' or 'community-based')
 * @returns {Object} Validation results
 */
function validateProposal(data, eventType) {
    const baseFields = [
        'organizationName', 'contactName', 'contactEmail', 'contactPhone',
        'eventName', 'venue', 'startDate', 'endDate', 'startTime', 'endTime',
        'eventMode', 'sdpCredits', 'targetAudience', 'gpoaFile'
    ];

    // Add event type specific fields
    const specificFields = eventType === 'school-based'
        ? ['schoolEventType']
        : ['communityEventType'];

    const allFields = [...baseFields, ...specificFields];

    // Validate basic fields
    const result = validateFields(data, allFields);

    // Additional cross-field validations
    if (result.isValid) {
        // Validate date range
        if (data.startDate && data.endDate) {
            if (!validateDateRange(data.startDate, data.endDate)) {
                result.errors = result.errors || {};
                result.errors.dateRange = 'End date must be after start date';
                result.isValid = false;
            }
        }

        // Validate time range for same day events
        if (data.startDate && data.endDate && data.startTime && data.endTime) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);

            if (startDate.toDateString() === endDate.toDateString()) {
                const startTime = new Date(`2000-01-01T${data.startTime}`);
                const endTime = new Date(`2000-01-01T${data.endTime}`);

                if (startTime >= endTime) {
                    result.errors = result.errors || {};
                    result.errors.timeRange = 'End time must be after start time for same-day events';
                    result.isValid = false;
                }
            }
        }
    }

    return result;
}

/**
 * Validate event type selection
 * @param {string} eventType - Event type to validate
 * @returns {Object} Validation result
 */
function validateEventType(eventType) {
    const validTypes = ['school-based', 'community-based'];

    if (!eventType || !validTypes.includes(eventType)) {
        return {
            isValid: false,
            error: 'Event type must be either "school-based" or "community-based"'
        };
    }

    return { isValid: true, error: null };
}

/**
 * Sanitize input data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeData(data) {
    const sanitized = {};

    Object.keys(data).forEach(key => {
        let value = data[key];

        // Trim strings
        if (typeof value === 'string') {
            value = value.trim();
        }

        // Remove HTML tags
        if (typeof value === 'string') {
            value = value.replace(/<[^>]*>/g, '');
        }

        // Escape special characters
        if (typeof value === 'string') {
            value = value.replace(/[<>]/g, '');
        }

        sanitized[key] = value;
    });

    return sanitized;
}

/**
 * Get validation error message for a field
 * @param {string} fieldName - Field name
 * @returns {string} Error message
 */
function getFieldErrorMessage(fieldName) {
    const rule = VALIDATION_RULES[fieldName];
    return rule ? rule.message : 'Invalid field value';
}

/**
 * Check if a field has validation errors
 * @param {string} fieldName - Field name
 * @param {Object} errors - Validation errors object
 * @returns {boolean} True if field has errors
 */
function hasFieldError(fieldName, errors) {
    return errors && errors[fieldName];
}

/**
 * Get CSS classes for field validation
 * @param {string} fieldName - Field name
 * @param {Object} errors - Validation errors object
 * @param {string} baseClasses - Base CSS classes
 * @returns {string} CSS classes
 */
function getFieldClasses(fieldName, errors, baseClasses = '') {
    const errorClasses = hasFieldError(fieldName, errors) ? 'border-red-500 focus:border-red-500' : '';
    return `${baseClasses} ${errorClasses}`.trim();
}

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
    VALIDATION_RULES,
    validateField,
    validateFields,
    validateProposal,
    validateEventType,
    sanitizeData,
    getFieldErrorMessage,
    hasFieldError,
    getFieldClasses
}; 