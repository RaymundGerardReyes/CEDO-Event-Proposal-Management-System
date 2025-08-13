// -----------------------------------------------------------------------------
// File: src/app/student-dashboard/submit-event/page.jsx
// Purpose: Handles the student event submission flow, including draft creation
//          and review mode redirects. Implements robust error handling and
//          clean URL structure (no / prefix).
// Key Approaches: Simple draft creation, safe error extraction, clear
//                 logging, and user-friendly feedback.
// -----------------------------------------------------------------------------

import { createDraft } from '@/lib/draft-api';
import { completeUUIDMigration } from '@/utils/uuid-migration';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Helper function to extract user data from JWT token (matches middleware implementation)
function extractUserFromToken(token) {
    if (!token) return null;

    try {
        // JWT tokens have 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // Decode the payload (second part) using atob() to match middleware
        const payload = JSON.parse(atob(parts[1]));

        // Handle both old and new token formats (matches middleware)
        const user = payload.user || {
            id: payload.id,
            role: payload.role,
            email: payload.email,
            name: payload.name
        };

        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log('Token is expired');
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
    }
}

/**
 * Helper to extract a safe error message from any error object
 */
function getErrorMessage(error) {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.toString) return error.toString();
    return 'Unknown error';
}



// Server component: handles both new drafts and review mode
export default async function Page({ searchParams }) {
    try {
        // ✅ ENHANCED: Development mode handling
        const isDevelopment = process.env.NODE_ENV === 'development';

        // ✅ NEXT.JS 15 FIX: searchParams needs to be awaited
        // Check if this is a review mode request
        const resolvedSearchParams = await searchParams;
        const mode = resolvedSearchParams?.mode;
        const proposalId = resolvedSearchParams?.proposalId;
        const source = resolvedSearchParams?.source;

        // If review mode with proposal ID, redirect to review the existing proposal
        if (mode === 'review' && proposalId) {
            console.log('🔍 Review mode detected:', { proposalId, source, mode });

            // For review mode, we want to go directly to reporting section
            // Create a special draft ID that represents the review proposal
            const reviewDraftId = `review-${proposalId}-${source}`;

            // Redirect to reporting section with review context (no / prefix)
            redirect(`/student-dashboard/submit-event/${reviewDraftId}/reporting?mode=review&proposalId=${proposalId}&source=${source}`);
        }

        // Default behavior: create new draft for normal flow
        console.log('📝 Creating new draft for normal flow');

        // Simple draft creation without health checks
        console.log('📝 Creating new draft for normal flow');

        // Get authentication token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('cedo_token')?.value;

        // ✅ ENHANCED: More permissive authentication in development
        if (!token) {
            if (isDevelopment) {
                console.log('🔄 Development: No authentication token found, but allowing access');
                // Use UUID migration to create a proper UUID
                const uuid = await completeUUIDMigration('new-draft', '/student-dashboard/submit-event');
                redirect(`/student-dashboard/submit-event/${uuid}/overview`);
            } else {
                console.log('❌ No authentication token found, redirecting to sign-in');
                redirect('/auth/sign-in?redirect=/student-dashboard/submit-event');
            }
        }

        // Extract user data from token
        const user = extractUserFromToken(token);

        // ✅ ENHANCED: More permissive user validation in development
        if (!user || !user.id || isNaN(Number(user.id))) {
            if (isDevelopment) {
                console.log('🔄 Development: Invalid user data from token, but allowing access');
                // Use UUID migration to create a proper UUID
                const uuid = await completeUUIDMigration('new-draft', '/student-dashboard/submit-event');
                redirect(`/student-dashboard/submit-event/${uuid}/overview`);
            } else {
                console.log('❌ Invalid user data from token, redirecting to sign-in');
                redirect('/auth/sign-in?redirect=/student-dashboard/submit-event');
            }
        }

        console.log('✅ User authenticated:', { id: user.id, role: user.role });

        // ✅ UUID MIGRATION: Create new draft with proper UUID handling
        console.log('📝 Creating new draft with UUID migration...');

        try {
            // Attempt to create draft via backend API
            const draftResponse = await createDraft(token);
            const draftId = draftResponse.draftId || draftResponse.id;

            if (draftId) {
                console.log('✅ Backend draft created successfully:', draftId);
                redirect(`/student-dashboard/submit-event/${draftId}/overview`);
            } else {
                throw new Error('No draftId received from backend');
            }
        } catch (error) {
            console.warn('⚠️ Backend draft creation failed, using UUID migration:', error.message);

            // Fallback to UUID migration system
            const uuid = await completeUUIDMigration('new-draft', '/student-dashboard/submit-event');
            console.log('✅ UUID migration fallback successful:', uuid);
            redirect(`/student-dashboard/submit-event/${uuid}/overview`);
        }

    } catch (err) {
        // Check if this is a Next.js redirect (not a real error)
        if (err.message === 'NEXT_REDIRECT' || err.digest?.startsWith('NEXT_REDIRECT')) {
            // This is expected behavior - Next.js uses this to handle redirects
            // Don't log it as an error, just re-throw so Next.js can handle it
            throw err;
        }

        // Log real errors
        console.error('❌ Error in submit-event page:', err);

        // ✅ ENHANCED: More permissive error handling in development
        const isDevelopment = process.env.NODE_ENV === 'development';

        if (isDevelopment) {
            console.log('🔄 Development: Error occurred, using UUID migration fallback');
            const uuid = await completeUUIDMigration('new-draft', '/student-dashboard/submit-event');
            redirect(`/student-dashboard/submit-event/${uuid}/overview`);
        } else {
            // 🔧 ENHANCED ERROR HANDLING: Provide specific error messages
            if (err.message?.includes('Failed to create draft')) {
                // Draft creation failed - could be server issue or auth problem
                redirect('/auth/sign-in?error=draft_creation_failed&redirect=/student-dashboard/submit-event');
            } else if (err.message?.includes('fetch failed') || err.message?.includes('Failed to fetch')) {
                // Network error - backend might be down
                redirect('/auth/sign-in?error=network_error&redirect=/student-dashboard/submit-event');
            } else if (err.message?.includes('timeout')) {
                // Timeout error
                redirect('/auth/sign-in?error=timeout&redirect=/student-dashboard/submit-event');
            }

            // For any other error, redirect to sign-in with error context
            redirect('/auth/sign-in?error=server_error&redirect=/student-dashboard/submit-event');
        }
    }
} 