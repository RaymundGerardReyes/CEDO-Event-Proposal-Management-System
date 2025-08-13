/**
 * ProposalFlow Component Unit Tests
 * Tests the UUID-based proposal flow component
 * 
 * Key approaches: TDD workflow, component rendering, hook integration,
 * error handling, and state management
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the hooks
vi.mock('../src/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow', () => ({
    useProposalFlow: vi.fn()
}));

// Mock child components
vi.mock('../src/app/student-dashboard/submit-event/[draftId]/components/DraftShell', () => ({
    default: ({ proposalUuid, onProposalUpdate }) => (
        <div data-testid="draft-shell">
            <h2>Draft Shell</h2>
            <p>UUID: {proposalUuid}</p>
            <button onClick={() => onProposalUpdate('new-uuid')}>Update UUID</button>
        </div>
    )
}));

vi.mock('../src/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker', () => ({
    default: ({ proposalUuid }) => (
        <div data-testid="data-flow-tracker">
            <h2>Data Flow Tracker</h2>
            <p>UUID: {proposalUuid}</p>
        </div>
    )
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useParams: vi.fn(() => ({ draftId: 'test-draft-123' }))
}));

// Import the component and hook
import ProposalFlow from '../src/app/student-dashboard/submit-event/[draftId]/ProposalFlow.jsx';
import { useProposalFlow } from '../src/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow';

describe('ProposalFlow Component', () => {
    const mockUseProposalFlow = vi.mocked(useProposalFlow);
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Loading State', () => {
        it('should render loading state when hook returns loading true', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
            expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
            expect(loading).toBe(true);
        });

        it('should show loading spinner with correct styling', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const spinner = screen.getByRole('status');
            expect(spinner).toHaveClass('animate-spin');
            expect(spinner).toHaveClass('rounded-full');
            expect(spinner).toHaveClass('h-12');
            expect(spinner).toHaveClass('w-12');
        });
    });

    describe('Error State', () => {
        it('should render error state when hook returns error', () => {
            const mockError = 'Failed to initialize proposal';
            const mockInitializeProposal = vi.fn();

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: mockError,
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
            expect(screen.getByText(mockError)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
            expect(error).toBe(mockError);
        });

        it('should call initializeProposal when retry button is clicked', async () => {
            const mockError = 'Failed to initialize proposal';
            const mockInitializeProposal = vi.fn();

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: mockError,
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const retryButton = screen.getByRole('button', { name: 'Retry' });
            await user.click(retryButton);

            expect(mockInitializeProposal).toHaveBeenCalledTimes(1);
        });

        it('should have correct error styling', () => {
            const mockError = 'Failed to initialize proposal';

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: mockError,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const errorContainer = screen.getByText('Error Initializing Proposal').closest('div');
            expect(errorContainer).toHaveClass('bg-red-50');
            expect(errorContainer).toHaveClass('border-red-200');
        });
    });

    describe('Success State', () => {
        it('should render main content when hook returns success state', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft', section: 'overview' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
            expect(screen.getByText('draft')).toBeInTheDocument();
            expect(screen.getByTestId('draft-shell')).toBeInTheDocument();
            expect(screen.getByTestId('data-flow-tracker')).toBeInTheDocument();
            expect(proposalUuid).toBe('test-uuid-123');
        });

        it('should display UUID in header with correct styling', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const uuidElement = screen.getByText('test-uuid-123');
            expect(uuidElement).toHaveClass('font-mono');
            expect(uuidElement).toHaveClass('text-sm');
            expect(uuidElement).toHaveClass('bg-gray-100');
        });

        it('should display proposal status in header', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'pending' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('pending')).toBeInTheDocument();
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

            render(<ProposalFlow />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });

    describe('Child Component Integration', () => {
        it('should pass proposalUuid to DraftShell component', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const draftShell = screen.getByTestId('draft-shell');
            expect(draftShell).toHaveTextContent('test-uuid-123');
        });

        it('should pass proposalUuid to DataFlowTracker component', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const dataFlowTracker = screen.getByTestId('data-flow-tracker');
            expect(dataFlowTracker).toHaveTextContent('test-uuid-123');
        });

        it('should call handleProposalUpdate when DraftShell triggers update', async () => {
            const mockHandleProposalUpdate = vi.fn();

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: mockHandleProposalUpdate
            });

            render(<ProposalFlow />);

            const updateButton = screen.getByRole('button', { name: 'Update UUID' });
            await user.click(updateButton);

            expect(mockHandleProposalUpdate).toHaveBeenCalledWith('new-uuid');
        });
    });

    describe('Layout and Styling', () => {
        it('should have correct main container styling', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const mainContainer = screen.getByText('Event Proposal Submission').closest('div');
            expect(mainContainer).toHaveClass('min-h-screen');
            expect(mainContainer).toHaveClass('bg-gray-50');
        });

        it('should have correct grid layout for main content', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const gridContainer = screen.getByTestId('draft-shell').closest('div');
            expect(gridContainer).toHaveClass('grid');
            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('lg:grid-cols-3');
        });

        it('should have sticky positioning for debug panel', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            const debugPanel = screen.getByTestId('data-flow-tracker').closest('div');
            expect(debugPanel).toHaveClass('sticky');
            expect(debugPanel).toHaveClass('top-8');
        });
    });

    describe('Development Debug Info', () => {
        it('should show debug info in development environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft', section: 'overview' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(screen.getByText('UUID: test-uuid-123')).toBeInTheDocument();
            expect(screen.getByText('Status: draft')).toBeInTheDocument();
            expect(screen.getByText('Section: overview')).toBeInTheDocument();

            // Restore original environment
            process.env.NODE_ENV = originalEnv;
        });

        it('should not show debug info in production environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft', section: 'overview' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(screen.queryByText('UUID: test-uuid-123')).not.toBeInTheDocument();
            expect(screen.queryByText('Status: draft')).not.toBeInTheDocument();
            expect(screen.queryByText('Section: overview')).not.toBeInTheDocument();

            // Restore original environment
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Hook Integration', () => {
        it('should call useProposalFlow with correct draftId', () => {
            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<ProposalFlow />);

            expect(mockUseProposalFlow).toHaveBeenCalledWith('test-draft-123');
        });

        it('should handle all hook return values correctly', () => {
            const mockInitializeProposal = vi.fn();
            const mockHandleProposalUpdate = vi.fn();

            mockUseProposalFlow.mockReturnValue({
                proposalUuid: 'test-uuid-123',
                proposalData: { status: 'draft' },
                loading: false,
                error: null,
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: mockHandleProposalUpdate
            });

            render(<ProposalFlow />);

            // Verify all hook values are used
            expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
            expect(screen.getByText('draft')).toBeInTheDocument();
            expect(mockInitializeProposal).toBeDefined();
            expect(mockHandleProposalUpdate).toBeDefined();
        });
    });
});
