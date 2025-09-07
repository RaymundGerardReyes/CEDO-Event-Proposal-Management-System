/**
 * Overview Component Unit Tests
 * 
 * 🎯 Purpose: Comprehensive testing of the Overview landing page component
 * - Tests path selection functionality
 * - Tests UUID display and generation
 * - Tests user interaction flows
 * - Tests component rendering and state management
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Overview from '../../src/app/student-dashboard/submit-event/components/Overview';
import { EventFormProvider } from '../../src/app/student-dashboard/submit-event/contexts/EventFormContext';

// Mock the EventFormContext
const mockEventFormContext = {
    generateEventUuid: vi.fn(),
    eventUuid: null,
    isUuidGenerated: false,
    getShortUuid: vi.fn(() => null),
    getFormAge: vi.fn(() => null)
};

vi.mock('../contexts/EventFormContext', () => ({
    useEventForm: () => mockEventFormContext
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    FileText: () => <div data-testid="file-text-icon" />,
    Info: () => <div data-testid="info-icon" />,
    Lightbulb: () => <div data-testid="lightbulb-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    Target: () => <div data-testid="target-icon" />
}));

// Helper function to render Overview with EventFormProvider
const renderOverview = (props = {}) => {
    return render(
        <EventFormProvider>
            <Overview {...props} />
        </EventFormProvider>
    );
};

describe('Overview Component', () => {
    const mockOnPathSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockEventFormContext.eventUuid = null;
        mockEventFormContext.isUuidGenerated = false;
    });

    describe('Component Rendering', () => {
        it('should render the main heading and description', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText('Event Submission Hub')).toBeInTheDocument();
            expect(screen.getByText(/Choose your submission path/i)).toBeInTheDocument();
        });

        it('should render both path selection cards', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText('Create New Event Proposal')).toBeInTheDocument();
            expect(screen.getByText('Submit Post-Event Report')).toBeInTheDocument();
        });

        it('should render all required icons', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getAllByTestId('plus-icon')).toHaveLength(1);
            expect(screen.getAllByTestId('file-text-icon')).toHaveLength(1);
            expect(screen.getAllByTestId('lightbulb-icon')).toHaveLength(1);
            expect(screen.getAllByTestId('target-icon')).toHaveLength(1);
            expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(1);
        });

        it('should render the information section with UUID explanation', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText('How It Works')).toBeInTheDocument();
            expect(screen.getByText(/unique identifier will be generated/i)).toBeInTheDocument();
            expect(screen.getByText(/Example URL:/i)).toBeInTheDocument();
        });

        it('should render the features section', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText('Why Choose Our Platform?')).toBeInTheDocument();
            expect(screen.getByText('Streamlined Process')).toBeInTheDocument();
            expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
            expect(screen.getByText('Comprehensive Support')).toBeInTheDocument();
        });
    });

    describe('Event Proposal Path Selection', () => {
        it('should call onPathSelect with "organization" when Start Event Proposal is clicked', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            expect(mockOnPathSelect).toHaveBeenCalledWith('organization');
        });

        it('should update selectedPath state when Start Event Proposal is clicked', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            // The component should show the selected state
            expect(startButton.closest('.bg-blue-50')).toBeInTheDocument();
        });

        it('should display the correct description for event proposal path', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText(/Plan and submit your event proposal/i)).toBeInTheDocument();
            expect(screen.getByText(/Complete all required sections/i)).toBeInTheDocument();
        });

        it('should show the primary action button for event proposal', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const startButton = screen.getByText('Start Event Proposal');
            expect(startButton).toHaveClass('bg-blue-600');
            expect(startButton).toHaveClass('hover:bg-blue-700');
        });
    });

    describe('Post-Event Report Path Selection', () => {
        it('should call onPathSelect with "post-event-report" when Submit Report is clicked', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const reportButton = screen.getByText('Submit Report');
            fireEvent.click(reportButton);

            expect(mockOnPathSelect).toHaveBeenCalledWith('post-event-report');
        });

        it('should update selectedPath state when Submit Report is clicked', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const reportButton = screen.getByText('Submit Report');
            fireEvent.click(reportButton);

            // The component should show the selected state
            expect(reportButton.closest('.bg-green-50')).toBeInTheDocument();
        });

        it('should display the correct description for post-event report path', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText(/Submit documentation for completed events/i)).toBeInTheDocument();
            expect(screen.getByText(/Upload accomplishment reports/i)).toBeInTheDocument();
        });

        it('should show the secondary action button for post-event report', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const reportButton = screen.getByText('Submit Report');
            expect(reportButton).toHaveClass('bg-green-600');
            expect(reportButton).toHaveClass('hover:bg-green-700');
        });
    });

    describe('UUID Display and Context Integration', () => {
        it('should display UUID information when UUID is generated', () => {
            mockEventFormContext.eventUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.isUuidGenerated = true;
            mockEventFormContext.getShortUuid.mockReturnValue('550e8400');
            mockEventFormContext.getFormAge.mockReturnValue('2 hours ago');

            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText('Event ID:')).toBeInTheDocument();
            expect(screen.getByText('550e8400')).toBeInTheDocument();
            expect(screen.getByText('Created 2 hours ago')).toBeInTheDocument();
        });

        it('should not display UUID information when no UUID is generated', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.queryByText('Event ID:')).not.toBeInTheDocument();
        });

        it('should call getShortUuid when displaying UUID', () => {
            mockEventFormContext.eventUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.isUuidGenerated = true;

            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(mockEventFormContext.getShortUuid).toHaveBeenCalled();
        });

        it('should call getFormAge when displaying UUID', () => {
            mockEventFormContext.eventUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.isUuidGenerated = true;

            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(mockEventFormContext.getFormAge).toHaveBeenCalled();
        });
    });

    describe('Component State Management', () => {
        it('should initialize with no selected path', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            // Both cards should be in default state
            const eventProposalCard = screen.getByText('Create New Event Proposal').closest('.border-gray-200');
            const reportCard = screen.getByText('Submit Post-Event Report').closest('.border-gray-200');

            expect(eventProposalCard).toBeInTheDocument();
            expect(reportCard).toBeInTheDocument();
        });

        it('should handle path selection without onPathSelect callback', () => {
            render(<Overview />);

            const startButton = screen.getByText('Start Event Proposal');

            // Should not throw error when onPathSelect is not provided
            expect(() => fireEvent.click(startButton)).not.toThrow();
        });

        it('should maintain selected state after path selection', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            // Button should still be clickable and maintain state
            expect(startButton).toBeInTheDocument();
            expect(mockOnPathSelect).toHaveBeenCalledTimes(1);
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should have proper button accessibility attributes', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const startButton = screen.getByText('Start Event Proposal');
            const reportButton = screen.getByText('Submit Report');

            expect(startButton).toHaveAttribute('type', 'button');
            expect(reportButton).toHaveAttribute('type', 'button');
        });

        it('should have proper heading hierarchy', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toHaveTextContent('Event Submission Hub');

            const subHeadings = screen.getAllByRole('heading', { level: 2 });
            expect(subHeadings.length).toBeGreaterThan(0);
        });

        it('should display helpful information about UUID in URL', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            expect(screen.getByText(/unique identifier will be generated and added to your browser's address bar/i)).toBeInTheDocument();
            expect(screen.getByText(/can be referenced for support or tracking/i)).toBeInTheDocument();
        });

        it('should show example URL format', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const exampleUrl = screen.getByText(/\/student-dashboard\/submit-event\/550e8400-e29b-41d4-a716-446655440000/);
            expect(exampleUrl).toBeInTheDocument();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing onPathSelect prop gracefully', () => {
            expect(() => render(<Overview />)).not.toThrow();
        });

        it('should handle rapid clicking without issues', () => {
            render(<Overview onPathSelect={mockOnPathSelect} />);

            const startButton = screen.getByText('Start Event Proposal');

            // Rapid clicking should not cause issues
            fireEvent.click(startButton);
            fireEvent.click(startButton);
            fireEvent.click(startButton);

            expect(mockOnPathSelect).toHaveBeenCalledTimes(3);
        });

        it('should handle context errors gracefully', () => {
            // Mock context to throw error
            vi.mocked(mockEventFormContext.getShortUuid).mockImplementation(() => {
                throw new Error('Context error');
            });

            expect(() => render(<Overview onPathSelect={mockOnPathSelect} />)).not.toThrow();
        });
    });
});
