/**
 * SubmitEventFlow Component Test
 * Tests the main event submission flow component
 * 
 * Key approaches: TDD, comprehensive mocking, state management testing,
 * navigation flow validation, and error handling
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useParams: vi.fn(),
    useRouter: vi.fn()
}));

// Mock the useProposalFlow hook
vi.mock('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow', () => ({
    useProposalFlow: vi.fn()
}));

// Mock DraftShell component
vi.mock('@/app/student-dashboard/submit-event/[draftId]/components/DraftShell', () => ({
    default: vi.fn(({ proposalUuid, onProposalUpdate }) => (
        <div data-testid="draft-shell">
            <p>Proposal UUID: {proposalUuid}</p>
            <button onClick={() => onProposalUpdate('new-uuid')}>
                Update UUID
            </button>
        </div>
    ))
}));

// Mock DataFlowTracker component
vi.mock('@/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker', () => ({
    default: vi.fn(() => <div data-testid="data-flow-tracker">Debug Panel</div>)
}));

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('SubmitEventFlow Component', () => {
    let mockUseProposalFlow;
    let mockUseParams;
    let mockUseRouter;

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

        // Setup mock useRouter
        mockUseRouter = {
            push: vi.fn(),
            back: vi.fn(),
            forward: vi.fn()
        };

        // Apply mocks
        const { useProposalFlow } = require('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow');
        useProposalFlow.mockReturnValue(mockUseProposalFlow);

        const { useParams, useRouter } = require('next/navigation');
        useParams.mockImplementation(mockUseParams);
        useRouter.mockReturnValue(mockUseRouter);
    });

    describe('Component Rendering', () => {
        it('should render the main component structure', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            // Check for main structure
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('UUID:')).toBeInTheDocument();
            expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('draft')).toBeInTheDocument();
        });

        it('should display proposal UUID correctly', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            const uuidElement = screen.getByText('test-uuid-123');
            expect(uuidElement).toBeInTheDocument();
            expect(uuidElement.parentElement).toHaveClass('font-mono', 'text-sm', 'bg-gray-100');
        });

        it('should display proposal status correctly', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('draft')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('should show loading spinner when loading is true', async () => {
            mockUseProposalFlow.loading = true;

            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
            expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
        });

        it('should not show main content when loading', async () => {
            mockUseProposalFlow.loading = true;

            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.queryByText('Event Proposal Submission')).not.toBeInTheDocument();
            expect(screen.queryByTestId('draft-shell')).not.toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('should show error message when error exists', async () => {
            mockUseProposalFlow.error = 'Failed to load proposal';

            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
            expect(screen.getByText('Failed to load proposal')).toBeInTheDocument();
        });

        it('should show retry button when error exists', async () => {
            mockUseProposalFlow.error = 'Failed to load proposal';

            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
        });

        it('should call initializeProposal when retry button is clicked', async () => {
            mockUseProposalFlow.error = 'Failed to load proposal';

            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            await userEvent.click(retryButton);

            expect(mockUseProposalFlow.initializeProposal).toHaveBeenCalledTimes(1);
        });
    });

    describe('Main Content Rendering', () => {
        it('should render DraftShell component with correct props', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.getByTestId('draft-shell')).toBeInTheDocument();
            expect(screen.getByText('Proposal UUID: test-uuid-123')).toBeInTheDocument();
        });

        it('should render DataFlowTracker component', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.getByTestId('data-flow-tracker')).toBeInTheDocument();
        });

        it('should handle proposal update from DraftShell', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            const updateButton = screen.getByRole('button', { name: /update uuid/i });
            await userEvent.click(updateButton);

            expect(mockUseProposalFlow.handleProposalUpdate).toHaveBeenCalledWith('new-uuid');
        });
    });

    describe('Layout and Styling', () => {
        it('should have correct layout structure', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            // Check for main container
            const mainContainer = screen.getByText('Event Proposal Submission').closest('.min-h-screen');
            expect(mainContainer).toHaveClass('bg-gray-50');

            // Check for header
            const header = screen.getByText('Event Proposal Submission').closest('.bg-white');
            expect(header).toHaveClass('border-b', 'border-gray-200');

            // Check for main content area
            const mainContent = screen.getByTestId('draft-shell').closest('.max-w-7xl');
            expect(mainContent).toBeInTheDocument();
        });

        it('should have responsive grid layout', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            const gridContainer = screen.getByTestId('draft-shell').closest('.grid');
            expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
        });
    });

    describe('Props Handling', () => {
        it('should accept and use params prop correctly', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            const testParams = { draftId: 'custom-draft-456' };
            render(<SubmitEventFlow params={testParams} />);

            // Component should work with custom params
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should work without params prop', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            // Component should work without params prop
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });
    });

    describe('Integration with useProposalFlow', () => {
        it('should call useProposalFlow with correct draftId', async () => {
            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            const { useProposalFlow } = require('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow');
            expect(useProposalFlow).toHaveBeenCalledWith('test-draft-123');
        });

        it('should handle undefined proposalData gracefully', async () => {
            mockUseProposalFlow.proposalData = null;

            const { default: SubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow');

            render(<SubmitEventFlow />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });
});

