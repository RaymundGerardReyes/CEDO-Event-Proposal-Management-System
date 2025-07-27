export function validateCommunityEventForm(formState) {
    const requiredFields = [
        'communityEventName', 'communityVenue', 'communityStartDate',
        'communityEndDate', 'communityTimeStart', 'communityTimeEnd',
        'communityEventType', 'communityEventMode', 'communitySDPCredits'
    ];
    const errors = {};
    requiredFields.forEach(field => {
        const value = formState[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
        }
    });
    if (formState.communityStartDate && formState.communityEndDate) {
        const startDate = new Date(formState.communityStartDate);
        const endDate = new Date(formState.communityEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) errors.communityStartDate = 'Start date cannot be in the past';
        if (endDate < startDate) errors.communityEndDate = 'End date cannot be before start date';
    }
    if (formState.communityTimeStart && formState.communityTimeEnd) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formState.communityTimeStart)) errors.communityTimeStart = 'Invalid time format (HH:MM)';
        if (!timeRegex.test(formState.communityTimeEnd)) errors.communityTimeEnd = 'Invalid time format (HH:MM)';
        if (formState.communityTimeStart >= formState.communityTimeEnd) errors.communityTimeEnd = 'End time must be after start time';
    }
    if (formState.communitySDPCredits) {
        const credits = parseInt(formState.communitySDPCredits);
        if (isNaN(credits) || credits < 1 || credits > 10) errors.communitySDPCredits = 'SDP credits must be between 1 and 10';
    }
    if (!formState.communityTargetAudience?.length) errors.communityTargetAudience = 'Please select at least one target audience';
    return errors;
} 