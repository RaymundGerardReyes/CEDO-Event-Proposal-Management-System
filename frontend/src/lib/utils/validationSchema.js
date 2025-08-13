/**
 * Unified Validation Schema for Event Proposals
 * Purpose: Centralized validation rules for all proposal fields
 * Key approaches: Single schema, type-conditionals, comprehensive validation
 */

// ===================================================================
// VALIDATION SCHEMA
// ===================================================================

/**
 * Base validation rules for common fields
 */
const BASE_RULES = {
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

            // Handle both Date objects and date strings
            let date;
            if (value instanceof Date) {
                date = value;
            } else {
                date = new Date(value);
            }

            // Check if it's a valid date
            if (isNaN(date.getTime())) return false;

            // Allow today's date and future dates (remove time component for comparison)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);

            return date >= today;
        },
        message: 'Start date must be a valid date (today or in the future)'
    },

    endDate: {
        required: true,
        validator: (value) => {
            if (!value) return false;

            // Handle both Date objects and date strings
            let date;
            if (value instanceof Date) {
                date = value;
            } else {
                date = new Date(value);
            }

            // Check if it's a valid date
            if (isNaN(date.getTime())) return false;

            // Allow today's date and future dates (remove time component for comparison)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);

            return date >= today;
        },
        message: 'End date must be a valid date (today or in the future)'
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
    }
};

/**
 * Section-specific validation rules
 */
const SECTION_RULES = {
    overview: {
        title: {
            required: true,
            minLength: 5,
            maxLength: 100,
            message: 'Title must be 5-100 characters'
        },
        purpose: {
            required: true,
            minLength: 10,
            maxLength: 500,
            message: 'Purpose must be 10-500 characters'
        },
        objectives: {
            required: true,
            minLength: 10,
            maxLength: 1000,
            message: 'Objectives must be 10-1000 characters'
        },
        expectedOutcomes: {
            required: true,
            minLength: 10,
            maxLength: 1000,
            message: 'Expected outcomes must be 10-1000 characters'
        }
    },

    eventType: {
        eventType: {
            required: true,
            enum: ['school-based', 'community-based'],
            message: 'Please select either "School-Based Event" or "Community-Based Event"'
        }
    },

    organization: {
        organizationName: BASE_RULES.organizationName,
        contactName: BASE_RULES.contactName,
        contactEmail: BASE_RULES.contactEmail,
        contactPhone: BASE_RULES.contactPhone
    },

    details: {
        // School event fields
        schoolEventName: BASE_RULES.eventName,
        schoolVenue: BASE_RULES.venue,
        schoolStartDate: BASE_RULES.startDate,
        schoolEndDate: BASE_RULES.endDate,
        schoolTimeStart: BASE_RULES.startTime,
        schoolTimeEnd: BASE_RULES.endTime,
        schoolEventType: BASE_RULES.eventType,
        schoolEventMode: BASE_RULES.eventMode,
        schoolSDPCredits: BASE_RULES.sdpCredits,
        schoolTargetAudience: BASE_RULES.targetAudience,

        // Community event fields
        communityEventName: BASE_RULES.eventName,
        communityVenue: BASE_RULES.venue,
        communityStartDate: BASE_RULES.startDate,
        communityEndDate: BASE_RULES.endDate,
        communityTimeStart: BASE_RULES.startTime,
        communityTimeEnd: BASE_RULES.endTime,
        communityEventType: BASE_RULES.eventType,
        communityEventMode: BASE_RULES.eventMode,
        communitySDPCredits: BASE_RULES.sdpCredits,
        communityTargetAudience: BASE_RULES.targetAudience
    },

    reporting: {
        eventStatus: {
            required: true,
            enum: ['completed', 'ongoing', 'cancelled', 'postponed'],
            message: 'Please select a valid event status'
        },
        attendanceCount: {
            required: true,
            min: 0,
            pattern: /^\d+$/,
            message: 'Attendance count must be a non-negative number'
        },
        preRegistrationCount: {
            required: false,
            min: 0,
            pattern: /^\d+$/,
            message: 'Pre-registration count must be a non-negative number'
        },
        reportDescription: {
            required: true,
            minLength: 10,
            maxLength: 2000,
            message: 'Report description must be 10-2000 characters'
        },
        accomplishmentReport: {
            required: true,
            minLength: 10,
            maxLength: 5000,
            message: 'Accomplishment report must be 10-5000 characters'
        }
    }
};

// ===================================================================
// VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate a single field against its rules
 * @param {string} fieldName - Name of the field to validate
 * @param {any} value - Value to validate
 * @param {string} section - Section the field belongs to
 * @returns {Object} Validation result
 */
function validateField(fieldName, value, section = null) {
    let rules;

    if (section && SECTION_RULES[section] && SECTION_RULES[section][fieldName]) {
        rules = SECTION_RULES[section][fieldName];
    } else if (BASE_RULES[fieldName]) {
        rules = BASE_RULES[fieldName];
    } else {
        return { isValid: true, error: null };
    }

    // Check if field is required
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return { isValid: false, error: rules.message };
    }

    // Skip validation for optional empty fields
    if (!rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return { isValid: true, error: null };
    }

    // Check minimum length
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        return { isValid: false, error: rules.message };
    }

    // Check maximum length
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        return { isValid: false, error: rules.message };
    }

    // Check minimum value
    if (rules.min !== undefined && Number(value) < rules.min) {
        return { isValid: false, error: rules.message };
    }

    // Check maximum value
    if (rules.max !== undefined && Number(value) > rules.max) {
        return { isValid: false, error: rules.message };
    }

    // Check pattern
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return { isValid: false, error: rules.message };
    }

    // Check enum values
    if (rules.enum && !rules.enum.includes(value)) {
        return { isValid: false, error: rules.message };
    }

    // Check custom validator
    if (rules.validator && !rules.validator(value)) {
        return { isValid: false, error: rules.message };
    }

    return { isValid: true, error: null };
}

/**
 * Validate multiple fields at once
 * @param {Object} data - Object containing field values
 * @param {Array} fields - Array of field names to validate
 * @param {string} section - Section the fields belong to
 * @returns {Object} Validation results
 */
function validateFields(data, fields, section = null) {
    const errors = {};
    let isValid = true;

    fields.forEach(fieldName => {
        const result = validateField(fieldName, data[fieldName], section);
        if (!result.isValid) {
            errors[fieldName] = result.error;
            isValid = false;
        }
    });

    return { isValid, errors };
}

/**
 * Validate a complete section
 * @param {Object} data - Section data
 * @param {string} section - Section name
 * @returns {Object} Validation results
 */
function validateSection(data, section) {
    if (!SECTION_RULES[section]) {
        return { isValid: true, errors: {} };
    }

    const fields = Object.keys(SECTION_RULES[section]);
    return validateFields(data, fields, section);
}

/**
 * Validate proposal data based on event type
 * @param {Object} data - Proposal data
 * @param {string} eventType - Event type ('school-based' or 'community-based')
 * @returns {Object} Validation results
 */
function validateProposal(data, eventType) {
    const errors = {};
    let isValid = true;

    // Validate overview section
    const overviewValidation = validateSection(data.overview || {}, 'overview');
    if (!overviewValidation.isValid) {
        Object.assign(errors, overviewValidation.errors);
        isValid = false;
    }

    // Validate event type section
    const eventTypeValidation = validateSection(data.eventType || {}, 'eventType');
    if (!eventTypeValidation.isValid) {
        Object.assign(errors, eventTypeValidation.errors);
        isValid = false;
    }

    // Validate organization section
    const organizationValidation = validateSection(data.organization || {}, 'organization');
    if (!organizationValidation.isValid) {
        Object.assign(errors, organizationValidation.errors);
        isValid = false;
    }

    // Validate details section based on event type
    const detailsData = data.details || {};
    const detailsFields = eventType === 'school-based'
        ? ['schoolEventName', 'schoolVenue', 'schoolStartDate', 'schoolEndDate', 'schoolTimeStart', 'schoolTimeEnd', 'schoolEventType', 'schoolEventMode', 'schoolSDPCredits', 'schoolTargetAudience']
        : ['communityEventName', 'communityVenue', 'communityStartDate', 'communityEndDate', 'communityTimeStart', 'communityTimeEnd', 'communityEventType', 'communityEventMode', 'communitySDPCredits', 'communityTargetAudience'];

    const detailsValidation = validateFields(detailsData, detailsFields, 'details');
    if (!detailsValidation.isValid) {
        Object.assign(errors, detailsValidation.errors);
        isValid = false;
    }

    // Additional cross-field validations
    if (isValid) {
        // Validate date range
        const startDateField = eventType === 'school-based' ? 'schoolStartDate' : 'communityStartDate';
        const endDateField = eventType === 'school-based' ? 'schoolEndDate' : 'communityEndDate';

        if (detailsData[startDateField] && detailsData[endDateField]) {
            const startDate = new Date(detailsData[startDateField]);
            const endDate = new Date(detailsData[endDateField]);

            if (startDate >= endDate) {
                errors.dateRange = 'End date must be after start date';
                isValid = false;
            }
        }

        // Validate time range for same day events
        const startTimeField = eventType === 'school-based' ? 'schoolTimeStart' : 'communityTimeStart';
        const endTimeField = eventType === 'school-based' ? 'schoolTimeEnd' : 'communityTimeEnd';

        if (detailsData[startDateField] && detailsData[endDateField] && detailsData[startTimeField] && detailsData[endTimeField]) {
            const startDate = new Date(detailsData[startDateField]);
            const endDate = new Date(detailsData[endDateField]);

            if (startDate.toDateString() === endDate.toDateString()) {
                const startTime = new Date(`2000-01-01T${detailsData[startTimeField]}`);
                const endTime = new Date(`2000-01-01T${detailsData[endTimeField]}`);

                if (startTime >= endTime) {
                    errors.timeRange = 'End time must be after start time for same-day events';
                    isValid = false;
                }
            }
        }
    }

    return { isValid, errors };
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
 * Get validation error message for a field
 * @param {string} fieldName - Field name
 * @param {string} section - Section name
 * @returns {string} Error message
 */
function getFieldErrorMessage(fieldName, section = null) {
    let rules;

    if (section && SECTION_RULES[section] && SECTION_RULES[section][fieldName]) {
        rules = SECTION_RULES[section][fieldName];
    } else if (BASE_RULES[fieldName]) {
        rules = BASE_RULES[fieldName];
    } else {
        return 'Invalid field value';
    }

    return rules.message;
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

export {
    BASE_RULES, getFieldClasses, getFieldErrorMessage,
    hasFieldError, SECTION_RULES, validateEventType, validateField,
    validateFields, validateProposal, validateSection
};

