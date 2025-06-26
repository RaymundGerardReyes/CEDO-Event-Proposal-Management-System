import { getDraft } from '@/lib/draft-api';
import { accessAllowed, correctUrl } from '@/utils/guards';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import DraftShell from './DraftShell'; // (client wrapper)

export const dynamic = 'force-dynamic'

export default async function Layout({ children, params, searchParams }) {
    // 1. unwrap dynamic APIs ----------------------------------------------------
    const { draftId } = await params
    const hdrList = await headers()
    const pathname = hdrList.get('next-url')

    console.log('🏗️ Layout processing:', { draftId, pathname });

    // 2. Handle review mode special case ----------------------------------------
    const isReviewDraft = draftId?.startsWith('review-');
    const mode = searchParams?.mode;
    const proposalId = searchParams?.proposalId;
    const source = searchParams?.source;

    if (isReviewDraft) {
        console.log('🔍 Review draft detected:', { draftId, mode, proposalId, source });

        // For review drafts, create a mock draft object
        const reviewDraft = {
            id: draftId,
            form_data: {
                id: proposalId,
                source: source,
                mode: mode,
                status: 'rejected', // Assume rejected for review mode
                isReviewMode: true,
                proposalId: proposalId,
                currentSection: 'reporting'
            }
        };

        // Skip normal guard checks for review mode
        return (
            <DraftShell draft={reviewDraft} pathname={pathname}>
                {children}
            </DraftShell>
        );
    }

    // 3. fetch draft (normal flow) ---------------------------------------------
    const draft = await getDraft(draftId).catch(() => redirect('/404'))

    // 4. guard check ------------------------------------------------------------
    if (!accessAllowed(pathname, draft.form_data)) {
        redirect(correctUrl(draftId, draft.form_data))
    }

    // 5. hand off to the client shell ------------------------------------------
    return (
        <DraftShell draft={draft} pathname={pathname}>
            {children}
        </DraftShell>
    )
}