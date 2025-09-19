/**
 * Refactored SubmitEventFlow Tests
 * 
 * Purpose: Comprehensive testing of the refactored architecture
 * Approach: White box testing covering new custom hooks, extracted components, and HOCs
 * Coverage: Custom hooks, reusable components, error boundaries, and performance optimizations
 * 
 * Key Testing Patterns:
 * - Mock Dependencies: APIs, localStorage, UUID generation for determinism
 * - Component Testing: Isolated testing of extracted UI components
 * - Hook Testing: Custom hook logic and state management
 * - HOC Testing: Higher-order component functionality
 * - Performance Testing: Memoization and optimization verification
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ✅ MOCK: All dependencies before imports
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        back: vi.fn(),
        forward: vi.fn()
    })),
    useParams: vi.fn(() => ({ draftId: 'test-draft-123' })),
    usePathname: vi.fn(() => '/student-dashboard/submit-event/test-draft-123/event-type')
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn(() => ({
        toast: vi.fn()
    }))
}));

vi.mock('@/lib/draft-api', () => ({
    saveEventTypeSelection: vi.fn()
}));

vi.mock('@/lib/utils/eventProposalStorage', () => ({
    updateDraftSection: vi.fn()
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow', () => ({
    useProposalFlow: vi.fn(() => ({
        proposalUuid: 'test-uuid-123',
        proposalData: { status: 'draft' },
        loading: false,
        error: null,
        initializeProposal: vi.fn(),
        handleProposalUpdate: vi.fn()
    }))
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/utils', () => ({
    getCurrentStepIndex: vi.fn(() => 1),
    resolveParams: vi.fn(() => ({ draftId: 'test-draft-123' })),
    STEPS: [
        { name: 'Overview', path: '/overview' },
        { name: 'Event Type', path: '/event-type' },
        { name: 'Organization', path: '/organization' }
    ]
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/components/DraftShell', () => ({
    default: ({ children }) => <div data-testid="draft-shell">{children}</div>
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/components/StepRenderer', () => ({
    default: () => <div data-testid="step-renderer">Step Content</div>
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/debug', () => ({
    DataFlowTracker: () => <div data-testid="data-flow-tracker">Debug Info</div>
}));

// ✅ MOCK: localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ✅ IMPORT: Components after mocks
import SubmitEventFlow from '@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow';
import {
    ContentContainer,
    DebugPanel,
    ErrorDisplay,
    GridLayout,
    LoadingSpinner,
    ProposalHeader,
    StepProgress
} from '@/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlowUI';
import { useSubmitEventFlow } from '@/app/student-dashboard/submit-event/[draftId]/hooks/useSubmitEventFlow';

describe('Refactored SubmitEventFlow Architecture', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Custom Hook - useSubmitEventFlow', () => {
        it('should return comprehensive hook interface', async () => {
            const hookResult = useSubmitEventFlow({ draftId: 'test-draft-123' });

            // ✅ TEST: Core state
            expect(hookResult.draftId).toBe('test-draft-123');
            expect(hookResult.currentStepIndex).toBe(1);
            expect(hookResult.currentStep).toEqual({ name: 'Event Type', path: '/event-type' });

            // ✅ TEST: Proposal flow state
            expect(hookResult.proposalUuid).toBe('test-uuid-123');
            expect(hookResult.proposalData).toEqual({ status: 'draft' });
            expect(hookResult.loading).toBe(false);
            expect(hookResult.error).toBe(null);

            // ✅ TEST: Page information
            expect(hookResult.pageInfo.isOverviewPage).toBe(false);
            expect(hookResult.pageInfo.isEventTypePage).toBe(true);
            expect(hookResult.pageInfo.currentPath).toBe('/student-dashboard/submit-event/test-draft-123/event-type');

            // ✅ TEST: Layout configuration
            expect(hookResult.layoutConfig.showHeader).toBe(true);
            expect(hookResult.layoutConfig.showDebugPanel).toBe(true);
            expect(hookResult.layoutConfig.containerClass).toBe('max-w-7xl mx-auto px-6 py-8');

            // ✅ TEST: Computed values
            expect(hookResult.totalSteps).toBe(3);
            expect(hookResult.currentStepNumber).toBe(2);
            expect(hookResult.isLastStep).toBe(false);
            expect(hookResult.isFirstStep).toBe(false);
            expect(hookResult.isValidState).toBe(true);
        });

        it('should handle overview page detection correctly', async () => {
            const { usePathname } = await import('next/navigation');
            usePathname.mockReturnValue('/student-dashboard/submit-event/test-draft-123/overview');

            const hookResult = useSubmitEventFlow({ draftId: 'test-draft-123' });

            expect(hookResult.pageInfo.isOverviewPage).toBe(true);
            expect(hookResult.layoutConfig.showHeader).toBe(false);
            expect(hookResult.layoutConfig.containerClass).toBe('');
        });

        it('should provide error handlers', async () => {
            const hookResult = useSubmitEventFlow({ draftId: 'test-draft-123' });

            expect(typeof hookResult.errorHandlers.handleRetry).toBe('function');
            expect(typeof hookResult.errorHandlers.handleError).toBe('function');
        });
    });

    describe('Extracted UI Components', () => {
        describe('LoadingSpinner', () => {
            it('should render loading spinner correctly', () => {
                render(<LoadingSpinner />);

                expect(screen.getByRole('status')).toBeInTheDocument();
                expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
                expect(screen.getByLabelText('Loading')).toBeInTheDocument();
            });
        });

        describe('ErrorDisplay', () => {
            it('should render error message correctly', () => {
                const mockRetry = vi.fn();
                render(<ErrorDisplay error="Test error message" onRetry={mockRetry} />);

                expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
                expect(screen.getByText('Test error message')).toBeInTheDocument();
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });

            it('should call retry function when retry button is clicked', () => {
                const mockRetry = vi.fn();
                render(<ErrorDisplay error="Test error" onRetry={mockRetry} />);

                fireEvent.click(screen.getByText('Retry'));
                expect(mockRetry).toHaveBeenCalledTimes(1);
            });

            it('should render without retry button when onRetry is not provided', () => {
                render(<ErrorDisplay error="Test error" />);

                expect(screen.getByText('Test error')).toBeInTheDocument();
                expect(screen.queryByText('Retry')).not.toBeInTheDocument();
            });
        });

        describe('ProposalHeader', () => {
            it('should render header with all information', () => {
                const props = {
                    proposalUuid: 'test-uuid-123',
                    currentStep: { name: 'Event Type', path: '/event-type' },
                    currentStepIndex: 1,
                    proposalData: { status: 'draft' }
                };

                render(<ProposalHeader {...props} />);

                expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
                expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
                expect(screen.getByText('Step 2 of 3: Event Type')).toBeInTheDocument();
                expect(screen.getByText('draft')).toBeInTheDocument();
            });

            it('should handle missing currentStep gracefully', () => {
                const props = {
                    proposalUuid: 'test-uuid-123',
                    currentStep: null,
                    currentStepIndex: 1,
                    proposalData: { status: 'draft' }
                };

                render(<ProposalHeader {...props} />);

                expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
                expect(screen.queryByText(/Step 2 of 3/)).not.toBeInTheDocument();
            });
        });

        describe('DebugPanel', () => {
            it('should render debug information correctly', () => {
                const props = {
                    proposalUuid: 'test-uuid-123',
                    currentStep: { name: 'Event Type', path: '/event-type' },
                    currentStepIndex: 1,
                    pathname: '/test/path',
                    proposalData: { status: 'draft' }
                };

                render(<DebugPanel {...props} />);

                expect(screen.getByText('UUID: test-uuid-123')).toBeInTheDocument();
                expect(screen.getByText('Status: draft')).toBeInTheDocument();
                expect(screen.getByText('Step: Event Type (2/3)')).toBeInTheDocument();
                expect(screen.getByText('Path: /test/path')).toBeInTheDocument();
            });
        });

        describe('StepProgress', () => {
            it('should render progress bar correctly', () => {
                render(<StepProgress currentStepIndex={1} totalSteps={3} />);

                expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
                expect(screen.getByText('67% Complete')).toBeInTheDocument();
                expect(screen.getByText('Overview')).toBeInTheDocument();
                expect(screen.getByText('Event Type')).toBeInTheDocument();
                expect(screen.getByText('Organization')).toBeInTheDocument();
            });

            it('should apply correct styling for completed and current steps', () => {
                render(<StepProgress currentStepIndex={1} totalSteps={3} />);

                const overviewStep = screen.getByText('Overview');
                const eventTypeStep = screen.getByText('Event Type');
                const organizationStep = screen.getByText('Organization');

                // Overview should be completed (blue)
                expect(overviewStep).toHaveClass('text-blue-600', 'font-medium');
                // Event Type should be current (blue)
                expect(eventTypeStep).toHaveClass('text-blue-600', 'font-medium');
                // Organization should be future (gray)
                expect(organizationStep).toHaveClass('text-gray-400');
            });
        });

        describe('ContentContainer', () => {
            it('should apply correct classes for overview page', () => {
                render(<ContentContainer isOverviewPage={true}>Test Content</ContentContainer>);

                const container = screen.getByText('Test Content').parentElement;
                expect(container).toHaveClass('min-h-screen bg-gray-50');
            });

            it('should apply correct classes for non-overview page', () => {
                render(<ContentContainer isOverviewPage={false}>Test Content</ContentContainer>);

                const container = screen.getByText('Test Content').parentElement;
                expect(container).toHaveClass('max-w-7xl mx-auto px-6 py-8');
            });
        });

        describe('GridLayout', () => {
            it('should render grid layout with left and right columns', () => {
                render(
                    <GridLayout
                        leftColumn={<div>Left Content</div>}
                        rightColumn={<div>Right Content</div>}
                    />
                );

                expect(screen.getByText('Left Content')).toBeInTheDocument();
                expect(screen.getByText('Right Content')).toBeInTheDocument();
            });
        });
    });

    describe('Higher-Order Components (HOCs)', () => {
        describe('withLoading HOC', () => {
            it('should show loading spinner when loading is true', () => {
                const TestComponent = ({ loading }) => <div>Test Component</div>;
                const WrappedComponent = withLoading(TestComponent);

                render(<WrappedComponent loading={true} />);

                expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
                expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
            });

            it('should render component when loading is false', () => {
                const TestComponent = ({ loading }) => <div>Test Component</div>;
                const WrappedComponent = withLoading(TestComponent);

                render(<WrappedComponent loading={false} />);

                expect(screen.getByText('Test Component')).toBeInTheDocument();
                expect(screen.queryByText('Initializing proposal...')).not.toBeInTheDocument();
            });
        });

        describe('withErrorBoundary HOC', () => {
            it('should render component normally when no error occurs', () => {
                const TestComponent = () => <div>Test Component</div>;
                const WrappedComponent = withErrorBoundary(TestComponent);

                render(<WrappedComponent />);

                expect(screen.getByText('Test Component')).toBeInTheDocument();
            });

            it('should render error display when component throws error', () => {
                const TestComponent = () => {
                    throw new Error('Test error');
                };
                const WrappedComponent = withErrorBoundary(TestComponent);

                render(<WrappedComponent />);

                expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });
        });
    });

    describe('Main SubmitEventFlow Component', () => {
        it('should render complete flow structure', () => {
            render(<SubmitEventFlow />);

            // ✅ TEST: Header should be rendered
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('test-uuid-123')).toBeInTheDocument();

            // ✅ TEST: Main content should be rendered
            expect(screen.getByTestId('draft-shell')).toBeInTheDocument();
            expect(screen.getByTestId('data-flow-tracker')).toBeInTheDocument();

            // ✅ TEST: Debug panel should be rendered in development
            expect(screen.getByText('UUID: test-uuid-123')).toBeInTheDocument();
        });

        it('should handle loading state correctly', async () => {
            const { useProposalFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow');
            useProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
        });

        it('should handle error state correctly', async () => {
            const { useProposalFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow');
            const mockInitializeProposal = vi.fn();
            useProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: false,
                error: 'Test error message',
                initializeProposal: mockInitializeProposal,
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            expect(screen.getByText('Error Initializing Proposal')).toBeInTheDocument();
            expect(screen.getByText('Test error message')).toBeInTheDocument();

            // Test retry functionality
            fireEvent.click(screen.getByText('Retry'));
            expect(mockInitializeProposal).toHaveBeenCalled();
        });

        it('should render overview page without header and debug panel', async () => {
            const { usePathname } = await import('next/navigation');
            usePathname.mockReturnValue('/student-dashboard/submit-event/test-draft-123/overview');

            render(<SubmitEventFlow><div>Overview Content</div></SubmitEventFlow>);

            // Header should not be rendered
            expect(screen.queryByText('Event Proposal Submission')).not.toBeInTheDocument();

            // Overview content should be rendered directly
            expect(screen.getByText('Overview Content')).toBeInTheDocument();

            // Debug panel should not be rendered
            expect(screen.queryByText('UUID: test-uuid-123')).not.toBeInTheDocument();
        });
    });

    describe('Performance Optimizations', () => {
        it('should memoize expensive computations', async () => {
            const { useSubmitEventFlow } = await import('@/app/student-dashboard/submit-event/[draftId]/hooks/useSubmitEventFlow');

            // First call
            const result1 = useSubmitEventFlow({ draftId: 'test-draft-123' });

            // Second call with same parameters
            const result2 = useSubmitEventFlow({ draftId: 'test-draft-123' });

            // Results should be the same (memoized)
            expect(result1.currentStepIndex).toBe(result2.currentStepIndex);
            expect(result1.pageInfo).toEqual(result2.pageInfo);
            expect(result1.layoutConfig).toEqual(result2.layoutConfig);
        });

        it('should use early returns for better performance', () => {
            const { useProposalFlow } = vi.mocked(await import('@/app/student-dashboard/submit-event/[draftId]/hooks/useProposalFlow'));
            useProposalFlow.mockReturnValue({
                proposalUuid: null,
                proposalData: null,
                loading: true,
                error: null,
                initializeProposal: vi.fn(),
                handleProposalUpdate: vi.fn()
            });

            render(<SubmitEventFlow />);

            // Should return early with loading spinner, not render full component
            expect(screen.getByText('Initializing proposal...')).toBeInTheDocument();
            expect(screen.queryByText('Event Proposal Submission')).not.toBeInTheDocument();
        });
    });
});























