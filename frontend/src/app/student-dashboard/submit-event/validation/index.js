// ✅ Validation Index
// Re-export all validation utilities for cleaner imports

export {
    REQUIRED_FIELDS,
    getActiveEventSection,
    getDisplayFieldName,
    getFieldClasses,
    getFieldError,
    hasFieldError,
    validateAllSections,
    validateCurrentStep,
    validateField,
    validateSection
} from './validation.js';
