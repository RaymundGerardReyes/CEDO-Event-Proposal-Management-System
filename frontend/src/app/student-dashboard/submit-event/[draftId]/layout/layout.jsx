import {
    createReviewDraft,
    extractReviewInfo,
    handleDraftIdValidation
} from '@/hooks/useFormValidation';
import { getDraft } from '@/lib/draft-api';
import { accessAllowed } from '@/utils/guards';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import DraftShell from '../components/DraftShell'; // (client wrapper)
import ErrorDisplay from '../components/ErrorDisplay'; // <-- You may need to create this

export const dynamic = 'force-dynamic'

export default async function Layout({ children, params, searchParams }) {
    const { draftId } = await params
    const resolvedSearchParams = await searchParams
    const hdrList = await headers()
    const pathname = hdrList.get('next-url')

    // ✅ ENHANCED: Development mode handling
    const isDevelopment = process.env.NODE_ENV === 'development';

    // 1. Validate draftId parameter
    const validation = handleDraftIdValidation(draftId, {
        allowReviewMode: true,
        allowSpecialChars: false,
        maxLength: 1000
    });

    if (!validation.success) {
        // Only redirect if validation provides a redirect (e.g. for malformed IDs)
        if (validation.redirect) {
            redirect(validation.redirect);
        }
        // Otherwise, show error
        return <ErrorDisplay message={`Invalid draft ID: ${validation.error || 'Unknown error'}`} />;
    }

    // 2. Handle review mode
    if (validation.isReviewMode) {
        const reviewInfo = extractReviewInfo(validation.draftId, resolvedSearchParams);
        const reviewDraft = createReviewDraft(reviewInfo);

        return (
            <DraftShell draft={reviewDraft} pathname={pathname}>
                {children}
            </DraftShell>
        );
    }

    // 3. Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('cedo_token')?.value;

    // ✅ ENHANCED: More permissive authentication in development
    if (!token) {
        if (isDevelopment) {
            console.log('🔄 Development: No token found, but allowing access to submit-event');
            // In development, create a mock draft to allow access
            const mockDraft = {
                id: draftId,
                form_data: {
                    current_section: 'overview',
                    // Add minimal required data for development
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            return (
                <DraftShell draft={mockDraft} pathname={pathname}>
                    {children}
                </DraftShell>
            );
        } else {
            redirect('/auth/sign-in?redirect=/student-dashboard/submit-event');
        }
    }

    // 4. fetch draft (normal flow)
    let draft = null;
    let draftError = null;
    try {
        draft = await getDraft(validation.draftId, token);
    } catch (err) {
        draftError = err;
        console.error('❌ Error fetching draft:', err);

        // ✅ CRITICAL: Handle authentication errors immediately
        if (err.message === 'AUTHENTICATION_REQUIRED') {
            // The draft-api.js has already handled the redirect
            // This component should not render anything further
            return null;
        }
    }

    if (!draft) {
        // ✅ ENHANCED: More permissive in development
        if (isDevelopment) {
            console.log('🔄 Development: Draft not found, but allowing access');
            const mockDraft = {
                id: draftId,
                form_data: {
                    current_section: 'overview',
                    // Add minimal required data for development
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            return (
                <DraftShell draft={mockDraft} pathname={pathname}>
                    {children}
                </DraftShell>
            );
        } else {
            // ✅ ENHANCED: Better error messages based on error type
            let errorMessage = "Draft not found or you do not have access to this draft.";
            let actionLabel = "Back to Dashboard";
            let actionHref = "/student-dashboard";

            if (draftError?.message?.includes('Authentication failed') || draftError?.message?.includes('User account not found')) {
                errorMessage = "Your session has expired or your account was not found.";
                actionLabel = "Sign In Again";
                actionHref = "/auth/sign-in";
            } else if (draftError?.message?.includes('Proposal not found')) {
                errorMessage = "This proposal draft could not be found.";
            }

            // Show a user-friendly error instead of redirecting
            return (
                <ErrorDisplay
                    message={errorMessage}
                    details={draftError?.message}
                    actionLabel={actionLabel}
                    actionHref={actionHref}
                />
            );
        }
    }

    // 5. guard check - ✅ ENHANCED: More permissive in development
    if (!accessAllowed(pathname, draft.form_data)) {
        if (isDevelopment) {
            console.log('🔄 Development: Access not allowed, but allowing access');
            return (
                <DraftShell draft={draft} pathname={pathname}>
                    {children}
                </DraftShell>
            );
        } else {
            // Only redirect if the user is truly unauthorized
            return (
                <ErrorDisplay
                    message="You do not have access to this section of the draft."
                    actionLabel="Back to Dashboard"
                    actionHref="/student-dashboard"
                />
            );
        }
    }

    // 6. hand off to the client shell
    return (
        <DraftShell draft={draft} pathname={pathname}>
            {children}
        </DraftShell>
    )
}