export function getInitialFormState(draftData = {}) {
    return {
        communityEventName: draftData.communityEventName || "",
        communityVenue: draftData.communityVenue || "",
        communityStartDate: draftData.communityStartDate ? new Date(draftData.communityStartDate) : null,
        communityEndDate: draftData.communityEndDate ? new Date(draftData.communityEndDate) : null,
        communityTimeStart: draftData.communityTimeStart || "",
        communityTimeEnd: draftData.communityTimeEnd || "",
        communityEventType: draftData.communityEventType || "",
        communityEventMode: draftData.communityEventMode || "",
        communitySDPCredits: draftData.communitySDPCredits || "",
        communityTargetAudience: Array.isArray(draftData.communityTargetAudience) ? draftData.communityTargetAudience : [],
        communityGPOAFile: draftData.communityGPOAFile || null,
        communityProposalFile: draftData.communityProposalFile || null,
    };
} 