/**
 * SubmitEventFlow Params Handling Test
 * Tests the new Next.js params handling with React.use()
 * 
 * Key approaches: TDD, async params testing, React.use() integration,
 * error boundary testing, and migration compatibility
 */

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useParams: vi.fn()
}));

// Mock the useProposalFlow hook
vi.mock('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow', () => ({
    useProposalFlow: vi.fn()
}));

// Mock child components
vi.mock('@/app/student-dashboard/submit-event/[draftId]/components/DraftShell', () => ({
    default: vi.fn(() => <div data-testid="draft-shell">DraftShell Component</div>)
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker', () => ({
    default: vi.fn(() => <div data-testid="data-flow-tracker">DataFlowTracker Component</div>)
}));

// Mock React.use
const mockReactUse = vi.fn();
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        use: mockReactUse
    };
});

describe('SubmitEventFlow Params Handling', () => {
    let mockUseProposalFlow;
    let mockUseParams;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock useProposalFlow
        mockUseProposalFlow = {
            proposalUuid: 'test-uuid-123',
            proposalData: {
                status: 'draft',
                overview: { purpose: 'Test event' }
            },
            loading: false,
            error: null,
            initializeProposal: vi.fn(),
            handleProposalUpdate: vi.fn()
        };

        // Setup mock useParams
        mockUseParams = vi.fn().mockReturnValue({ draftId: 'test-draft-123' });

        // Apply mocks
        const { useProposalFlow } = require('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow');
        useProposalFlow.mockReturnValue(mockUseProposalFlow);

        const { useParams } = require('next/navigation');
        useParams.mockImplementation(mockUseParams);

        // Setup React.use mock
        mockReactUse.mockImplementation((promise) => {
            if (promise && typeof promise.then === 'function') {
                // Simulate async params resolution
                return Promise.resolve({ draftId: 'async-draft-456' });
            }
            return promise;
        });
    });

    describe('React.use() Integration', () => {
        it('should use React.use() to unwrap params Promise', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            // Create a mock params Promise
            const paramsPromise = Promise.resolve({ draftId: 'async-draft-456' });

            render(<SubmitEventFlow params={paramsPromise} />);

            expect(mockReactUse).toHaveBeenCalledWith(paramsPromise);
        });

        it('should handle resolved params correctly', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const paramsPromise = Promise.resolve({ draftId: 'async-draft-456' });

            render(<SubmitEventFlow params={paramsPromise} />);

            await waitFor(() => {
                expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            });
        });

        it('should fallback to useParams when no custom params provided', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(mockUseParams).toHaveBeenCalled();
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle params loading state', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            // Mock a slow-resolving params Promise
            const slowParamsPromise = new Promise((resolve) => {
                setTimeout(() => resolve({ draftId: 'slow-draft' }), 100);
            });

            mockReactUse.mockImplementation(() => {
                throw new Promise((resolve) => {
                    setTimeout(() => resolve({ draftId: 'slow-draft' }), 100);
                });
            });

            render(<SubmitEventFlow params={slowParamsPromise} />);

            // Should show loading state while params are resolving
            expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
        });

        it('should handle params resolution errors', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const errorParamsPromise = Promise.reject(new Error('Params resolution failed'));

            mockReactUse.mockImplementation(() => {
                throw new Error('Params resolution failed');
            });

            render(<SubmitEventFlow params={errorParamsPromise} />);

            // Should show error state
            expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
        });
    });

    describe('Backward Compatibility', () => {
        it('should handle synchronous params object', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const syncParams = { draftId: 'sync-draft-789' };

            mockReactUse.mockImplementation((value) => {
                // Return the value directly if it's not a Promise
                return value;
            });

            render(<SubmitEventFlow params={syncParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle undefined params gracefully', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow params={undefined} />);

            // Should fallback to useParams
            expect(mockUseParams).toHaveBeenCalled();
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle null params gracefully', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow params={null} />);

            // Should fallback to useParams
            expect(mockUseParams).toHaveBeenCalled();
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });
    });

    describe('Error Boundaries', () => {
        it('should handle React.use() errors with error boundary', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const paramsPromise = Promise.resolve({ draftId: 'test-draft' });

            mockReactUse.mockImplementation(() => {
                throw new Error('React.use() failed');
            });

            render(<SubmitEventFlow params={paramsPromise} />);

            // Should show error state
            expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
        });

        it('should handle missing draftId in resolved params', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const paramsPromise = Promise.resolve({}); // No draftId

            mockReactUse.mockImplementation(() => {
                return {};
            });

            render(<SubmitEventFlow params={paramsPromise} />);

            // Should fallback to useParams
            expect(mockUseParams).toHaveBeenCalled();
        });
    });

    describe('Performance and Memory', () => {
        it('should not cause memory leaks with repeated params resolution', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const paramsPromise = Promise.resolve({ draftId: 'test-draft' });

            // Render multiple times to ensure no memory leaks
            for (let i = 0; i < 3; i++) {
                const { unmount } = render(<SubmitEventFlow params={paramsPromise} />);
                await waitFor(() => {
                    expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
                });
                unmount();
            }

            expect(mockReactUse).toHaveBeenCalledTimes(3);
        });

        it('should handle rapid params changes', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const { rerender } = render(<SubmitEventFlow params={Promise.resolve({ draftId: 'draft-1' })} />);

            await waitFor(() => {
                expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            });

            // Change params rapidly
            rerender(<SubmitEventFlow params={Promise.resolve({ draftId: 'draft-2' })} />);

            await waitFor(() => {
                expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            });
        });
    });
});
