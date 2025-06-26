export function accessAllowed(pathname, formData) {
    // Extract review mode from URL
    const isReviewMode = pathname?.includes('mode=review');
    const isReportingSection = pathname?.includes('/reporting');

    // Allow access to reporting section in review mode
    if (isReviewMode && isReportingSection) {
        console.log('✅ Review mode: Allowing access to reporting section');
        return true;
    }

    // For review draft IDs, allow all access
    if (pathname?.includes('review-')) {
        console.log('✅ Review draft: Allowing access');
        return true;
    }

    // TODO: Implement more sophisticated role logic later
    // For now, allow all access to maintain existing functionality
    return true;
}

export function correctUrl(draftId, formData) {
    // Handle review mode corrections
    if (draftId?.startsWith('review-')) {
        const urlParams = new URLSearchParams(window?.location?.search || '');
        const mode = urlParams.get('mode');
        const proposalId = urlParams.get('proposalId');
        const source = urlParams.get('source');

        if (mode === 'review' && proposalId) {
            return `/student-dashboard/submit-event/${draftId}/reporting?mode=review&proposalId=${proposalId}&source=${source}`;
        }
    }

    // Default behavior: redirect to overview
    return `/student-dashboard/submit-event/${draftId}/overview`;
} 