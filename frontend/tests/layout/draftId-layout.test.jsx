/**
 * DraftId Layout Component Tests
 * 
 * Purpose: Test the dynamic route layout component for proper parameter handling
 * Key approaches: TDD, edge case coverage, type validation, error handling
 */

import Layout from '@/app/main/student-dashboard/submit-event/[draftId]/layout/layout';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => Promise.resolve({
        get: jest.fn(() => ({ value: 'mock-token' }))
    })),
    headers: jest.fn(() => Promise.resolve({
        get: jest.fn(() => '/mock-pathname')
    }))
}));

jest.mock('@/lib/draft-api', () => ({
    getDraft: jest.fn()
}));

jest.mock('@/utils/guards', () => ({
    accessAllowed: jest.fn(() => true),
    correctUrl: jest.fn(() => '/correct-url')
}));

jest.mock('../components/DraftShell', () => {
    return function MockDraftShell({ children, draft, pathname }) {
        return (
            <div data-testid="draft-shell" data-draft-id={draft?.id} data-pathname={pathname}>
                {children}
            </div>
        );
    };
});

describe('DraftId Layout Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Parameter Validation', () => {
        it('should redirect to 404 when draftId is undefined', async () => {
            const params = Promise.resolve({ draftId: undefined });
            const searchParams = Promise.resolve({});

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/404');
        });

        it('should redirect to 404 when draftId is null', async () => {
            const params = Promise.resolve({ draftId: null });
            const searchParams = Promise.resolve({});

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/404');
        });

        it('should redirect to 404 when draftId is not a string', async () => {
            const params = Promise.resolve({ draftId: 123 });
            const searchParams = Promise.resolve({});

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/404');
        });

        it('should redirect to 404 when draftId is an empty string', async () => {
            const params = Promise.resolve({ draftId: '' });
            const searchParams = Promise.resolve({});

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/404');
        });
    });

    describe('Review Mode Detection', () => {
        it('should detect review mode when draftId starts with review-', async () => {
            const params = Promise.resolve({ draftId: 'review-123' });
            const searchParams = Promise.resolve({
                mode: 'review',
                proposalId: 'proposal-456',
                source: 'admin'
            });

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', 'review-123');
            expect(draftShell).toHaveAttribute('data-pathname', '/mock-pathname');
        });

        it('should not detect review mode for normal draftId', async () => {
            const params = Promise.resolve({ draftId: 'normal-draft-123' });
            const searchParams = Promise.resolve({});

            // Mock getDraft to return a valid draft
            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue({
                id: 'normal-draft-123',
                form_data: {
                    status: 'draft',
                    currentSection: 'overview'
                }
            });

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', 'normal-draft-123');
        });

        it('should handle review mode with missing search params', async () => {
            const params = Promise.resolve({ draftId: 'review-123' });
            const searchParams = Promise.resolve({});

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', 'review-123');
        });
    });

    describe('Authentication Handling', () => {
        it('should redirect to sign-in when no token is present', async () => {
            const params = Promise.resolve({ draftId: 'test-draft' });
            const searchParams = Promise.resolve({});

            // Mock cookies to return no token
            const { cookies } = require('next/headers');
            cookies.mockResolvedValue({
                get: jest.fn(() => undefined)
            });

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/auth/sign-in?redirect=/main/student-dashboard/submit-event');
        });
    });

    describe('Draft Fetching', () => {
        it('should handle draft fetch errors gracefully', async () => {
            const params = Promise.resolve({ draftId: 'test-draft' });
            const searchParams = Promise.resolve({});

            // Mock getDraft to throw an error
            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockRejectedValue(new Error('Draft not found'));

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/404');
        });

        it('should render draft shell with fetched draft data', async () => {
            const params = Promise.resolve({ draftId: 'test-draft' });
            const searchParams = Promise.resolve({});

            const mockDraft = {
                id: 'test-draft',
                form_data: {
                    status: 'draft',
                    currentSection: 'overview'
                }
            };

            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue(mockDraft);

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', 'test-draft');
        });
    });

    describe('Access Control', () => {
        it('should redirect when access is not allowed', async () => {
            const params = Promise.resolve({ draftId: 'test-draft' });
            const searchParams = Promise.resolve({});

            const mockDraft = {
                id: 'test-draft',
                form_data: {
                    status: 'draft',
                    currentSection: 'overview'
                }
            };

            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue(mockDraft);

            const { accessAllowed, correctUrl } = require('@/utils/guards');
            accessAllowed.mockReturnValue(false);
            correctUrl.mockReturnValue('/correct-url');

            await Layout({
                children: <div>Test Content</div>,
                params,
                searchParams
            });

            expect(redirect).toHaveBeenCalledWith('/correct-url');
        });
    });

    describe('Edge Cases', () => {
        it('should handle draftId with special characters', async () => {
            const params = Promise.resolve({ draftId: 'draft-with-special-chars-123!@#' });
            const searchParams = Promise.resolve({});

            const mockDraft = {
                id: 'draft-with-special-chars-123!@#',
                form_data: {
                    status: 'draft',
                    currentSection: 'overview'
                }
            };

            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue(mockDraft);

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', 'draft-with-special-chars-123!@#');
        });

        it('should handle very long draftId', async () => {
            const longDraftId = 'a'.repeat(1000);
            const params = Promise.resolve({ draftId: longDraftId });
            const searchParams = Promise.resolve({});

            const mockDraft = {
                id: longDraftId,
                form_data: {
                    status: 'draft',
                    currentSection: 'overview'
                }
            };

            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue(mockDraft);

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', longDraftId);
        });

        it('should handle draftId with unicode characters', async () => {
            const params = Promise.resolve({ draftId: 'draft-🚀-emoji-123' });
            const searchParams = Promise.resolve({});

            const mockDraft = {
                id: 'draft-🚀-emoji-123',
                form_data: {
                    status: 'draft',
                    currentSection: 'overview'
                }
            };

            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue(mockDraft);

            const { container } = render(
                await Layout({
                    children: <div>Test Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveAttribute('data-draft-id', 'draft-🚀-emoji-123');
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete flow for normal draft', async () => {
            const params = Promise.resolve({ draftId: 'normal-draft-123' });
            const searchParams = Promise.resolve({ mode: 'edit' });

            const mockDraft = {
                id: 'normal-draft-123',
                form_data: {
                    status: 'draft',
                    currentSection: 'overview',
                    title: 'Test Event'
                }
            };

            const { getDraft } = require('@/lib/draft-api');
            getDraft.mockResolvedValue(mockDraft);

            const { container } = render(
                await Layout({
                    children: <div data-testid="page-content">Page Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            const pageContent = screen.getByTestId('page-content');

            expect(draftShell).toHaveAttribute('data-draft-id', 'normal-draft-123');
            expect(pageContent).toBeInTheDocument();
            expect(pageContent).toHaveTextContent('Page Content');
        });

        it('should handle complete flow for review draft', async () => {
            const params = Promise.resolve({ draftId: 'review-456' });
            const searchParams = Promise.resolve({
                mode: 'review',
                proposalId: 'proposal-789',
                source: 'admin'
            });

            const { container } = render(
                await Layout({
                    children: <div data-testid="page-content">Review Content</div>,
                    params,
                    searchParams
                })
            );

            const draftShell = screen.getByTestId('draft-shell');
            const pageContent = screen.getByTestId('page-content');

            expect(draftShell).toHaveAttribute('data-draft-id', 'review-456');
            expect(pageContent).toBeInTheDocument();
            expect(pageContent).toHaveTextContent('Review Content');
        });
    });
}); 