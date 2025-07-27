/**
 * Community Event Utils
 * Purpose: Utility functions for community event form state management
 * Key approaches: Form initialization, data transformation, validation helpers
 */

/**
 * Get initial form state for community event
 * @param {Object} initialData - Initial data from draft or props
 * @returns {Object} Initialized form state
 */
export const getInitialFormState = (initialData = {}) => {
    return {
        communityEventName: initialData.communityEventName || '',
        communityVenue: initialData.communityVenue || '',
        communityStartDate: initialData.communityStartDate ? new Date(initialData.communityStartDate) : null,
        communityEndDate: initialData.communityEndDate ? new Date(initialData.communityEndDate) : null,
        communityTimeStart: initialData.communityTimeStart || '',
        communityTimeEnd: initialData.communityTimeEnd || '',
        communityEventType: initialData.communityEventType || '',
        communityTargetAudience: Array.isArray(initialData.communityTargetAudience)
            ? initialData.communityTargetAudience
            : [],
        communityEventMode: initialData.communityEventMode || '',
        communitySDPCredits: initialData.communitySDPCredits || '',
        communityGPOAFile: initialData.communityGPOAFile || null,
        communityProposalFile: initialData.communityProposalFile || null,
    };
};

/**
 * Transform form data for API submission
 * @param {Object} formData - Form data to transform
 * @returns {Object} Transformed data ready for API
 */
export const transformFormDataForAPI = (formData) => {
    return {
        ...formData,
        communityStartDate: formData.communityStartDate?.toISOString?.() || formData.communityStartDate,
        communityEndDate: formData.communityEndDate?.toISOString?.() || formData.communityEndDate,
    };
};

/**
 * Validate required fields for community event
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation errors object
 */
export const validateRequiredFields = (formData) => {
    const errors = {};

    if (!formData.communityEventName?.trim()) {
        errors.communityEventName = 'Event name is required';
    }

    if (!formData.communityVenue?.trim()) {
        errors.communityVenue = 'Venue is required';
    }

    if (!formData.communityStartDate) {
        errors.communityStartDate = 'Start date is required';
    }

    if (!formData.communityEndDate) {
        errors.communityEndDate = 'End date is required';
    }

    if (!formData.communityTimeStart?.trim()) {
        errors.communityTimeStart = 'Start time is required';
    }

    if (!formData.communityTimeEnd?.trim()) {
        errors.communityTimeEnd = 'End time is required';
    }

    if (!formData.communityEventType?.trim()) {
        errors.communityEventType = 'Event type is required';
    }

    if (!Array.isArray(formData.communityTargetAudience) || formData.communityTargetAudience.length === 0) {
        errors.communityTargetAudience = 'At least one target audience must be selected';
    }

    if (!formData.communityEventMode?.trim()) {
        errors.communityEventMode = 'Event mode is required';
    }

    if (!formData.communitySDPCredits?.trim()) {
        errors.communitySDPCredits = 'Number of SDP credits is required';
    }

    if (!formData.communityGPOAFile) {
        errors.communityGPOAFile = 'GPOA file is required';
    }

    if (!formData.communityProposalFile) {
        errors.communityProposalFile = 'Proposal document is required';
    }

    return errors;
};

/**
 * Get field display name for error messages
 * @param {string} fieldName - Field name to get display name for
 * @returns {string} Human-readable field name
 */
export const getFieldDisplayName = (fieldName) => {
    const fieldNameMap = {
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
    };

    return fieldNameMap[fieldName] || fieldName;
}; 