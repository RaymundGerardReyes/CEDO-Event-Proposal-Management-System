import { createDraft } from '@/lib/draft-api';
import { redirect } from 'next/navigation';

// Server component: handles both new drafts and review mode
export default async function Page({ searchParams }) {
    // Await searchParams before accessing its properties (Next.js 15+ requirement)
    const resolvedSearchParams = await searchParams;

    // Check if this is a review mode request
    const mode = resolvedSearchParams?.mode;
    const proposalId = resolvedSearchParams?.proposalId;
    const source = resolvedSearchParams?.source;

    // If review mode with proposal ID, redirect to review the existing proposal
    if (mode === 'review' && proposalId) {
        console.log('🔍 Review mode detected:', { proposalId, source, mode });

        // For review mode, we want to go directly to reporting section
        // Create a special draft ID that represents the review proposal
        const reviewDraftId = `review-${proposalId}-${source}`;

        // Redirect to reporting section with review context
        redirect(`/student-dashboard/submit-event/${reviewDraftId}/reporting?mode=review&proposalId=${proposalId}&source=${source}`);
    }

    // Default behavior: create new draft for normal flow
    console.log('📝 Creating new draft for normal flow');
    const { draftId } = await createDraft();

    // Send user to the first step of the new draft
    redirect(`/student-dashboard/submit-event/${draftId}/overview`);
} 