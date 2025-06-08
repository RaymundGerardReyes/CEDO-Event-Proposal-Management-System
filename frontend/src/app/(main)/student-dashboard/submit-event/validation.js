// Comprehensive validation system for all sections of the submit-event flow

/**
 * Required fields configuration for each section
 */
export const REQUIRED_FIELDS = {
    section1: {
        purpose: {
            required: true,
            message: "Please select your purpose"
        }
    },

    section2: {
        organizationName: {
            required: true,
            message: "Organization name is required"
        },
        organizationTypes: {
            required: true,
            message: "Please select one organization type",
            validator: (value) => {
                if (value === undefined || value === null) {
                    return false;
                }

                if (Array.isArray(value) && value.length === 0) {
                    return false;
                }

                if (Array.isArray(value)) {
                    return value.length === 1 && (value[0] === 'school-based' || value[0] === 'community-based');
                }

                if (typeof value === 'string') {
                    return value === 'school-based' || value === 'community-based';
                }

                return false;
            }
        },
        contactName: {
            required: true,
            message: "Contact person name is required"
        },
        contactEmail: {
            required: true,
            message: "Contact email is required",
            validator: (value) => /\S+@\S+\.\S+/.test(value),
            validationMessage: "Please enter a valid email address"
        }
    },

    section3: {
        schoolEventName: {
            required: true,
            message: "Event name is required"
        },
        schoolVenue: {
            required: true,
            message: "Venue is required"
        },
        schoolStartDate: {
            required: true,
            message: "Start date is required",
            validator: (value) => value && new Date(value) instanceof Date && !isNaN(new Date(value))
        },
        schoolEndDate: {
            required: true,
            message: "End date is required",
            validator: (value) => value && new Date(value) instanceof Date && !isNaN(new Date(value))
        },
        schoolTimeStart: {
            required: true,
            message: "Start time is required",
            validator: (value) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
        },
        schoolTimeEnd: {
            required: true,
            message: "End time is required",
            validator: (value) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
        },
        schoolEventType: {
            required: true,
            message: "Event type is required"
        },
        schoolTargetAudience: {
            required: true,
            message: "At least one target audience must be selected",
            validator: (value) => Array.isArray(value) && value.length > 0
        },
        schoolEventMode: {
            required: true,
            message: "Event mode is required"
        },
        schoolReturnServiceCredit: {
            required: true,
            message: "Number of return service credits is required"
        },
        schoolGPOAFile: {
            required: true,
            message: "GPOA file is required"
        },
        schoolProposalFile: {
            required: true,
            message: "Proposal document is required"
        }
    },

    section4: {
        communityEventName: {
            required: true,
            message: "Event name is required"
        },
        communityVenue: {
            required: true,
            message: "Venue is required"
        },
        communityStartDate: {
            required: true,
            message: "Start date is required",
            validator: (value) => value && new Date(value) instanceof Date && !isNaN(new Date(value))
        },
        communityEndDate: {
            required: true,
            message: "End date is required",
            validator: (value) => value && new Date(value) instanceof Date && !isNaN(new Date(value))
        },
        communityTimeStart: {
            required: true,
            message: "Start time is required",
            validator: (value) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
        },
        communityTimeEnd: {
            required: true,
            message: "End time is required",
            validator: (value) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
        },
        communityEventType: {
            required: true,
            message: "Event type is required"
        },
        communityTargetAudience: {
            required: true,
            message: "At least one target audience must be selected",
            validator: (value) => Array.isArray(value) && value.length > 0
        },
        communityEventMode: {
            required: true,
            message: "Event mode is required"
        },
        communitySDPCredits: {
            required: true,
            message: "Number of SDP credits is required"
        },
        communityGPOAFile: {
            required: true,
            message: "GPOA file is required"
        },
        communityProposalFile: {
            required: true,
            message: "Proposal document is required"
        }
    },

    section5: {
        attendanceCount: {
            required: true,
            message: "Attendance count is required",
            validator: (value) => value && parseInt(value) > 0
        },
        eventStatus: {
            required: true,
            message: "Event status is required"
        },
        accomplishmentReport: {
            required: true,
            message: "Accomplishment report file is required"
        },
        signature: {
            required: true,
            message: "Digital signature is required"
        }
    }
};

/**
 * Validates a single field based on its configuration
 * @param {string} fieldName - Name of the field to validate
 * @param {any} value - Value to validate
 * @param {object} fieldConfig - Field configuration
 * @param {boolean} isSubmissionValidation - Whether this is for submission (strict) or interactive (lenient)
 */
export const validateField = (fieldName, value, fieldConfig, isSubmissionValidation = false) => {
    if (!fieldConfig) return null;

    // Add debugging for organizationTypes specifically
    if (fieldName === 'organizationTypes') {
        console.log('=== VALIDATING ORGANIZATION TYPES ===');
        console.log('Field name:', fieldName);
        console.log('Value:', value);
        console.log('Value type:', typeof value);
        console.log('Is array:', Array.isArray(value));
        console.log('Array length:', value?.length);
        console.log('First element:', value?.[0]);
        console.log('Is submission validation:', isSubmissionValidation);
        console.log('Field config:', fieldConfig);
    }

    // Check if field is required and empty
    if (fieldConfig.required) {
        const isEmpty = value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0);

        if (fieldName === 'organizationTypes') {
            console.log('Is empty check:', isEmpty);
        }

        // Only show required field errors during submission validation or if user has interacted
        if (isEmpty) {
            if (fieldName === 'organizationTypes') {
                console.log('❌ Field is empty, submission validation:', isSubmissionValidation);
            }

            // For organizationTypes, only show error during submission
            if (fieldName === 'organizationTypes' && !isSubmissionValidation) {
                console.log('🔄 Skipping empty validation for organizationTypes during interaction');
                return null; // Allow empty during interaction
            }

            return fieldConfig.message;
        }
    }

    // Run custom validator if provided
    if (fieldConfig.validator && value !== undefined && value !== null && value !== '') {
        const validatorResult = fieldConfig.validator(value);

        if (fieldName === 'organizationTypes') {
            console.log('Custom validator result:', validatorResult);
        }

        if (!validatorResult) {
            if (fieldName === 'organizationTypes') {
                console.log('❌ Custom validator failed, submission validation:', isSubmissionValidation);
            }

            // For organizationTypes, only show validator errors during submission
            if (fieldName === 'organizationTypes' && !isSubmissionValidation) {
                console.log('🔄 Skipping validator error for organizationTypes during interaction');
                return null; // Allow invalid during interaction
            }

            return fieldConfig.validationMessage || fieldConfig.message;
        }
    }

    if (fieldName === 'organizationTypes') {
        console.log('✅ Organization types validation passed');
    }

    return null;
};

/**
 * Validates all fields for a specific section
 * @param {string} sectionName - Name of the section to validate
 * @param {object} formData - Form data to validate
 * @param {boolean} isSubmissionValidation - Whether this is submission validation (strict) or interactive (lenient)
 */
export const validateSection = (sectionName, formData, isSubmissionValidation = false) => {
    const sectionFields = REQUIRED_FIELDS[sectionName];
    if (!sectionFields) return {};

    const errors = {};

    Object.entries(sectionFields).forEach(([fieldName, fieldConfig]) => {
        const error = validateField(fieldName, formData[fieldName], fieldConfig, isSubmissionValidation);
        if (error) {
            errors[fieldName] = error;
        }
    });

    return errors;
};

/**
 * Validates all sections and returns comprehensive error object
 * @param {object} formData - Form data to validate
 * @param {boolean} isSubmissionValidation - Whether this is submission validation (strict) or interactive (lenient)
 */
export const validateAllSections = (formData, isSubmissionValidation = false) => {
    const allErrors = {};

    Object.keys(REQUIRED_FIELDS).forEach(sectionName => {
        const sectionErrors = validateSection(sectionName, formData, isSubmissionValidation);
        if (Object.keys(sectionErrors).length > 0) {
            allErrors[sectionName] = sectionErrors;
        }
    });

    return allErrors;
};

/**
 * Gets the appropriate section to validate based on organization types
 */
export const getActiveEventSection = (organizationTypes) => {
    if (!organizationTypes || !Array.isArray(organizationTypes) || organizationTypes.length === 0) {
        return 'section3'; // Default to school event
    }

    const selectedType = organizationTypes[0]; // Only one type allowed now

    if (selectedType === 'school-based') {
        return 'section3';
    } else if (selectedType === 'community-based') {
        return 'section4';
    }

    return 'section3'; // Default
};

/**
 * Validates the current step based on organization type
 * @param {string} currentSection - Current section name
 * @param {object} formData - Form data to validate
 * @param {boolean} isSubmissionValidation - Whether this is submission validation (strict) or interactive (lenient)
 */
export const validateCurrentStep = (currentSection, formData, isSubmissionValidation = true) => {
    switch (currentSection) {
        case 'overview':
            return validateSection('section1', formData, isSubmissionValidation);
        case 'orgInfo':
            return validateSection('section2', formData, isSubmissionValidation);
        case 'schoolEvent':
            return validateSection('section3', formData, isSubmissionValidation);
        case 'communityEvent':
            return validateSection('section4', formData, isSubmissionValidation);
        case 'reporting':
            return validateSection('section5', formData, isSubmissionValidation);
        default:
            return {};
    }
};

/**
 * Utility to check if a field has an error
 */
export const hasFieldError = (fieldName, errors) => {
    return Boolean(errors && errors[fieldName]);
};

/**
 * Utility to get error message for a field
 */
export const getFieldError = (fieldName, errors) => {
    return errors && errors[fieldName] ? errors[fieldName] : null;
};

/**
 * Utility to generate field CSS classes for error states
 */
export const getFieldClasses = (fieldName, errors, baseClasses = '') => {
    const hasError = hasFieldError(fieldName, errors);
    const errorClasses = hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
        : '';

    return `${baseClasses} ${errorClasses}`.trim();
};

/**
 * Creates user-friendly field name for display
 */
export const getDisplayFieldName = (fieldName) => {
    const fieldNameMap = {
        // Section 1
        purpose: 'Purpose',

        // Section 2
        organizationName: 'Organization Name',
        organizationTypes: 'Organization Type',
        contactName: 'Contact Person',
        contactEmail: 'Contact Email',

        // Section 3 (School Event)
        schoolEventName: 'Event Name',
        schoolVenue: 'Venue',
        schoolStartDate: 'Start Date',
        schoolEndDate: 'End Date',
        schoolTimeStart: 'Start Time',
        schoolTimeEnd: 'End Time',
        schoolEventType: 'Event Type',
        schoolTargetAudience: 'Target Audience',
        schoolEventMode: 'Event Mode',
        schoolReturnServiceCredit: 'Return Service Credits',
        schoolGPOAFile: 'GPOA File',
        schoolProposalFile: 'Proposal Document',

        // Section 4 (Community Event)
        communityEventName: 'Event Name',
        communityVenue: 'Venue',
        communityStartDate: 'Start Date',
        communityEndDate: 'End Date',
        communityTimeStart: 'Start Time',
        communityTimeEnd: 'End Time',
        communityEventType: 'Event Type',
        communityTargetAudience: 'Target Audience',
        communityEventMode: 'Event Mode',
        communitySDPCredits: 'SDP Credits',
        communityGPOAFile: 'GPOA File',
        communityProposalFile: 'Proposal Document',

        // Section 5 (Reporting)
        attendanceCount: 'Attendance Count',
        eventStatus: 'Event Status',
        accomplishmentReport: 'Accomplishment Report',
        signature: 'Digital Signature'
    };

    return fieldNameMap[fieldName] || fieldName;
}; 