/**
 * SubmitEventFlow Component Tests
 * Comprehensive tests for the main event submission flow wrapper
 * 
 * Key approaches: TDD, state management testing, error handling,
 * component integration, and Next.js 15+ params handling
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useParams: vi.fn()
}));

// Mock the hooks
const mockUseProposalFlow = vi.fn();
vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow', () => ({
    useProposalFlow: mockUseProposalFlow
}));

// Mock the utils
const mockResolveParams = vi.fn();
vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/utils', () => ({
    resolveParams: mockResolveParams
}));

// Mock child components with simple divs
vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker', () => ({
    default: () => null
}));

vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/components/DraftShell', () => ({
    default: () => null
}));

// Import after mocking
import SubmitEventFlow from '../../src/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow';

describe('SubmitEventFlow Component', () => {
    const mockUseParams = useParams;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockUseParams.mockReturnValue({ draftId: 'test-draft-123' });
        mockResolveParams.mockReturnValue({ draftId: 'test-draft-123' });
        mockUseProposalFlow.mockReturnValue({
            proposalUuid: 'test-uuid-123',
            proposalData: { status: 'draft' },
            loading: false,
            error: null,
            initializeProposal: vi.fn(),
            handleProposalUpdate: vi.fn()
        });
    });

    describe('Params Resolution', () => {
        it('should resolve params correctly with custom params', () => {
            const customParams = { draftId: 'custom-draft-456' };
            mockResolveParams.mockReturnValue({ draftId: 'custom-draft-456' });

            render(<SubmitEventFlow params={customParams} />);

            expect(mockResolveParams).toHaveBeenCalledWith(customParams, mockUseParams);
        });

        it('should resolve params correctly with useParams fallback', () => {
            mockResolveParams.mockReturnValue({ draftId: 'fallback-draft-789' });

            render(<SubmitEventFlow />);

            expect(mockResolveParams).toHaveBeenCalledWith(undefined, mockUseParams);
        });

        it('should handle null params gracefully', () => {
            mockResolveParams.mockReturnValue({});

            render(<SubmitEventFlow params={null} />);

            expect(mockResolveParams).toHaveBeenCalledWith(null, mockUseParams);
        });
    });

    describe('Hook Integration', () => {
        it('should call useProposalFlow with resolved draftId', () => {
            mockResolveParams.mockReturnValue({ draftId: 'resolved-draft-123' });

            render(<SubmitEventFlow params={{ draftId: 'custom-draft' }} />);

            expect(mockUseProposalFlow).toHaveBeenCalledWith('resolved-draft-123');
        });

        it('should handle undefined draftId', () => {
            mockResolveParams.mockReturnValue({});

            render(<SubmitEventFlow />);

            expect(mockUseProposalFlow).toHaveBeenCalledWith(undefined);
        });
    });

    describe('Loading State', () => {
        it('should display loading spinner when loading is true', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByRole('status')).toBeInTheDocument();
            expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
            expect(screen.getByLabelText('Loading')).toBeInTheDocument();
        });

        it('should not display main content when loading', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid',
                proposalData: { status: 'draft' },
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.queryByText('Event Proposal Submission')).not.toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('should display error message when error is present', () => {
            const mockInitializeProposal = vi.fn();
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: 'Failed to initialize proposal',
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
            expect(screen.getByText('Failed to initialize proposal')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        });

        it('should call initializeProposal when retry button is clicked', () => {
            const mockInitializeProposal = vi.fn();
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: 'Test error',
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            const retryButton = screen.getByRole('button', { name: 'Retry' });
            fireEvent.click(retryButton);

            expect(mockInitializeProposal).toHaveBeenCalledTimes(1);
        });

        it('should not display main content when error is present', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid',
                proposalData: { status: 'draft' },
                loading: false,
                error: 'Test error',
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.queryByText('Event Proposal Submission')).not.toBeInTheDocument();
        });
    });

    describe('Success State', () => {
        it('should display main content when not loading and no error', () => {
            const mockHandleProposalUpdate = vi.fn();
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: mockHandleProposalUpdate
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
            expect(screen.getByText('draft')).toBeInTheDocument();
        });

        it('should display unknown status when proposalData is null', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: null,
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });

    describe('Component Structure', () => {
        it('should have correct layout structure', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            // Check main container
            const mainContainer = screen.getByText('Event Proposal Submission').closest('.min-h-screen');
            expect(mainContainer).toHaveClass('bg-gray-50');

            // Check header
            const header = screen.getByText('Event Proposal Submission').closest('.bg-white');
            expect(header).toHaveClass('border-b', 'border-gray-200');

            // Check main content area
            const contentArea = screen.getByText('Event Proposal Submission').closest('.max-w-7xl');
            expect(contentArea).toBeInTheDocument();
        });

        it('should display UUID in monospace font', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            const uuidElement = screen.getByText('test-uuid-123');
            expect(uuidElement).toHaveClass('font-mono');
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels for loading state', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            const loadingSpinner = screen.getByRole('status');
            expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading');
        });

        it('should have proper button roles', () => {
            const mockInitializeProposal = vi.fn();
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: 'Test error',
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            const retryButton = screen.getByRole('button', { name: 'Retry' });
            expect(retryButton).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty proposalUuid', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: '',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle null proposalUuid', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle complex proposalData structure', () => {
            const complexData = {
                status: 'submitted',
                metadata: {
                    createdAt: '2024-01-01',
                    updatedAt: '2024-01-02'
                },
                sections: ['overview', 'organization']
            };

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: complexData,
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('submitted')).toBeInTheDocument();
        });
    });
});
