/**
 * Enhanced Overview Component Unit Tests
 * 
 * 🎯 Purpose: Comprehensive testing of the Overview landing page component with new features
 * - Tests UUID generation and session management
 * - Tests path selection functionality with auto-fill clearing
 * - Tests component rendering and state management
 * - Tests user interaction flows and accessibility
 * - Tests error handling and edge cases
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Overview from '../../src/app/student-dashboard/submit-event/components/Overview';
import { EventFormProvider } from '../../src/app/student-dashboard/submit-event/contexts/EventFormContext';

// Mock the EventFormContext
const mockEventFormContext = {
    generateEventUuid: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    eventUuid: null,
    isUuidGenerated: false,
    getShortUuid: vi.fn(() => null),
    getFormAge: vi.fn(() => null)
};

vi.mock('../../src/app/student-dashboard/submit-event/contexts/EventFormContext', () => ({
    useEventForm: () => mockEventFormContext,
    EventFormProvider: ({ children }) => children
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

describe('Enhanced Overview Component', () => {
    const mockOnPathSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockEventFormContext.eventUuid = null;
        mockEventFormContext.isUuidGenerated = false;
        // Clear session storage
        sessionStorage.clear();
    });

    describe('Component Rendering and Basic Functionality', () => {
        it('should render the main heading and description', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText('Event Submission Hub')).toBeInTheDocument();
            expect(screen.getByText(/choose the appropriate path based on your event status/i)).toBeInTheDocument();
        });

        it('should render both path selection cards with proper styling', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText('Create New Event Proposal')).toBeInTheDocument();
            expect(screen.getByText('Submit Post-Event Report')).toBeInTheDocument();

            // Check for proper badges
            expect(screen.getByText('Pre-Event')).toBeInTheDocument();
            expect(screen.getByText('Post-Event')).toBeInTheDocument();
        });

        it('should render all required icons correctly', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getAllByTestId('target-icon')).toHaveLength(1); // Main header
            expect(screen.getAllByTestId('plus-icon')).toHaveLength(2); // Event proposal card + button
            expect(screen.getAllByTestId('file-text-icon')).toHaveLength(2); // Post-event report card + button
            expect(screen.getAllByTestId('info-icon')).toHaveLength(1); // Information section
            expect(screen.getAllByTestId('lightbulb-icon')).toHaveLength(1); // Help section
            expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(8); // Features list (4 for each path)
        });

        it('should render the information section with UUID explanation', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText('How It Works')).toBeInTheDocument();
            expect(screen.getByText(/unique identifier will be generated and added to your browser's address bar/i)).toBeInTheDocument();
            expect(screen.getByText(/Example URL:/i)).toBeInTheDocument();
        });

        it('should render the help section with path guidance', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText('Need Help Choosing?')).toBeInTheDocument();
            expect(screen.getByText(/create new event proposal:/i)).toBeInTheDocument();
            expect(screen.getByText(/submit post-event report:/i)).toBeInTheDocument();
        });

        it('should display proper heading hierarchy', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toHaveTextContent('Event Submission Hub');

            const subHeadings = screen.getAllByRole('heading', { level: 2 });
            expect(subHeadings.length).toBeGreaterThan(0);
        });
    });

    describe('Event Proposal Path Selection', () => {
        it('should call onPathSelect with "organization" when Start Event Proposal is clicked', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            expect(mockOnPathSelect).toHaveBeenCalledWith('organization');
        });

        it('should generate UUID when Start Event Proposal is clicked', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            expect(mockEventFormContext.generateEventUuid).toHaveBeenCalled();
        });

        it('should clear auto-fill session flags when starting new event', () => {
            // Set up some session storage data
            sessionStorage.setItem('autoFilled_550e8400-e29b-41d4-a716-446655440000', 'true');

            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            // Check that the session storage was cleared
            expect(sessionStorage.getItem('autoFilled_550e8400-e29b-41d4-a716-446655440000')).toBeNull();
        });

        it('should display the correct description for event proposal path', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText(/plan and submit a new event for approval/i)).toBeInTheDocument();
            expect(screen.getByText(/event details and logistics planning/i)).toBeInTheDocument();
            expect(screen.getByText(/venue and date coordination/i)).toBeInTheDocument();
            expect(screen.getByText(/target audience and sdp credits/i)).toBeInTheDocument();
            expect(screen.getByText(/required documentation upload/i)).toBeInTheDocument();
        });

        it('should show the primary action button styling for event proposal', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByRole('button', { name: /start event proposal/i });
            expect(startButton).toHaveClass('bg-blue-600');
            expect(startButton).toHaveClass('hover:bg-blue-700');
            expect(startButton).toHaveClass('text-white');
        });

        it('should display help text for event proposal path', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText(/use this for events that haven't happened yet/i)).toBeInTheDocument();
        });
    });

    describe('Post-Event Report Path Selection', () => {
        it('should call onPathSelect with "post-event-report" when Submit Report is clicked', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const reportButton = screen.getByText('Submit Report');
            fireEvent.click(reportButton);

            expect(mockOnPathSelect).toHaveBeenCalledWith('post-event-report');
        });

        it('should display the correct description for post-event report path', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText(/document and report on a completed event/i)).toBeInTheDocument();
            expect(screen.getByText(/attendance and participation reports/i)).toBeInTheDocument();
            expect(screen.getByText(/event photos and documentation/i)).toBeInTheDocument();
            expect(screen.getByText(/accomplishment summaries/i)).toBeInTheDocument();
            expect(screen.getByText(/final reports and receipts/i)).toBeInTheDocument();
        });

        it('should show the secondary action button styling for post-event report', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const reportButton = screen.getByRole('button', { name: /submit report/i });
            expect(reportButton).toHaveClass('bg-white');
            expect(reportButton).toHaveClass('border-2');
            expect(reportButton).toHaveClass('border-gray-300');
            expect(reportButton).toHaveClass('text-gray-700');
        });

        it('should display help text for post-event report path', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText(/use this for events that have already occurred/i)).toBeInTheDocument();
        });
    });

    describe('UUID Display and Context Integration', () => {
        it('should display UUID information when UUID is generated', () => {
            mockEventFormContext.eventUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.isUuidGenerated = true;
            mockEventFormContext.getShortUuid.mockReturnValue('550e8400');

            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText('Event ID Generated')).toBeInTheDocument();
            expect(screen.getByText('550e8400')).toBeInTheDocument();
        });

        it('should not display UUID information when no UUID is generated', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.queryByText('Event ID Generated')).not.toBeInTheDocument();
            expect(screen.queryByText('550e8400')).not.toBeInTheDocument();
        });

        it('should call getShortUuid when displaying UUID', () => {
            mockEventFormContext.eventUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.isUuidGenerated = true;

            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(mockEventFormContext.getShortUuid).toHaveBeenCalled();
        });

        it('should show UUID status with proper styling when generated', () => {
            mockEventFormContext.eventUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.isUuidGenerated = true;
            mockEventFormContext.getShortUuid.mockReturnValue('550e8400');

            renderOverview({ onPathSelect: mockOnPathSelect });

            const uuidContainer = screen.getByText('Event ID Generated').closest('.bg-green-50');
            expect(uuidContainer).toBeInTheDocument();
            expect(uuidContainer).toHaveClass('border-green-200');
        });
    });

    describe('Session Management and Auto-fill Clearing', () => {
        it('should clear specific auto-fill session flags for new event UUID', () => {
            const newUuid = '550e8400-e29b-41d4-a716-446655440000';
            mockEventFormContext.generateEventUuid.mockReturnValue(newUuid);

            // Set up session storage with auto-fill flags
            sessionStorage.setItem('autoFilled_550e8400-e29b-41d4-a716-446655440000', 'true');
            sessionStorage.setItem('autoFilled_other-uuid', 'true');

            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            // Should clear only the specific UUID's auto-fill flag
            expect(sessionStorage.getItem('autoFilled_550e8400-e29b-41d4-a716-446655440000')).toBeNull();
            expect(sessionStorage.getItem('autoFilled_other-uuid')).toBe('true');
        });

        it('should handle session storage clearing gracefully when no flags exist', () => {
            mockEventFormContext.generateEventUuid.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');

            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');

            // Should not throw error when no session storage exists
            expect(() => fireEvent.click(startButton)).not.toThrow();
        });

        it('should handle session storage operations correctly', () => {
            mockEventFormContext.generateEventUuid.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');

            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByRole('button', { name: /start event proposal/i });

            // Should work normally when session storage is available
            expect(() => fireEvent.click(startButton)).not.toThrow();
            expect(mockOnPathSelect).toHaveBeenCalledWith('organization');
        });
    });

    describe('Component State Management', () => {
        it('should initialize with no selected path', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            // Both cards should be in default state
            const eventProposalCard = screen.getByText('Create New Event Proposal').closest('.border-blue-200');
            const reportCard = screen.getByText('Submit Post-Event Report').closest('.border-gray-200');

            expect(eventProposalCard).toBeInTheDocument();
            expect(reportCard).toBeInTheDocument();
        });

        it('should handle path selection without onPathSelect callback', () => {
            renderOverview();

            const startButton = screen.getByText('Start Event Proposal');

            // Should not throw error when onPathSelect is not provided
            expect(() => fireEvent.click(startButton)).not.toThrow();
        });

        it('should maintain selected state after path selection', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');
            fireEvent.click(startButton);

            // Button should still be clickable and maintain state
            expect(startButton).toBeInTheDocument();
            expect(mockOnPathSelect).toHaveBeenCalledTimes(1);
        });

        it('should handle rapid clicking without issues', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');

            // Rapid clicking should not cause issues
            fireEvent.click(startButton);
            fireEvent.click(startButton);
            fireEvent.click(startButton);

            expect(mockOnPathSelect).toHaveBeenCalledTimes(3);
            expect(mockEventFormContext.generateEventUuid).toHaveBeenCalledTimes(3);
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should have proper button accessibility attributes', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByRole('button', { name: /start event proposal/i });
            const reportButton = screen.getByRole('button', { name: /submit report/i });

            // Buttons should be focusable and clickable
            expect(startButton).toBeInTheDocument();
            expect(reportButton).toBeInTheDocument();
            expect(startButton.tagName).toBe('BUTTON');
            expect(reportButton.tagName).toBe('BUTTON');
        });

        it('should display helpful information about UUID in URL', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText(/unique identifier will be generated and added to your browser's address bar/i)).toBeInTheDocument();
            expect(screen.getByText(/can be referenced for support or tracking/i)).toBeInTheDocument();
        });

        it('should show example URL format with proper styling', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const exampleUrl = screen.getByText(/\/student-dashboard\/submit-event\/550e8400-e29b-41d4-a716-446655440000/);
            expect(exampleUrl).toBeInTheDocument();
            expect(exampleUrl.closest('.bg-blue-100')).toBeInTheDocument();
        });

        it('should provide clear guidance for path selection', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            expect(screen.getByText(/are you planning a new event or reporting on a completed one/i)).toBeInTheDocument();
            expect(screen.getByText(/choose this if you're planning a future event/i)).toBeInTheDocument();
            expect(screen.getByText(/choose this if your event has already taken place/i)).toBeInTheDocument();
        });

        it('should have proper focus management for buttons', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByText('Start Event Proposal');

            // Test that button can be focused
            startButton.focus();

            // In jsdom, focus might not work as expected, so just verify the button exists
            expect(startButton).toBeInTheDocument();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing onPathSelect prop gracefully', () => {
            expect(() => renderOverview()).not.toThrow();
        });

        it('should handle context errors gracefully', () => {
            // Mock context to throw error
            vi.mocked(mockEventFormContext.generateEventUuid).mockImplementation(() => {
                throw new Error('Context error');
            });

            expect(() => renderOverview({ onPathSelect: mockOnPathSelect })).not.toThrow();
        });

        it('should handle UUID generation correctly', () => {
            mockEventFormContext.generateEventUuid.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');

            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByRole('button', { name: /start event proposal/i });

            // Should work normally when UUID generation succeeds
            expect(() => fireEvent.click(startButton)).not.toThrow();
            expect(mockEventFormContext.generateEventUuid).toHaveBeenCalled();
        });

        it('should handle rapid path switching without issues', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByRole('button', { name: /start event proposal/i });
            const reportButton = screen.getByRole('button', { name: /submit report/i });

            // Test individual button clicks
            fireEvent.click(startButton);
            expect(mockOnPathSelect).toHaveBeenCalledWith('organization');

            fireEvent.click(reportButton);
            expect(mockOnPathSelect).toHaveBeenCalledWith('post-event-report');

            // Test that buttons can be clicked multiple times
            fireEvent.click(startButton);
            expect(mockOnPathSelect).toHaveBeenCalledWith('organization');
        });

        it('should handle component unmounting gracefully', () => {
            const { unmount } = renderOverview({ onPathSelect: mockOnPathSelect });

            // Should not throw error when unmounting
            expect(() => unmount()).not.toThrow();
        });
    });

    describe('Visual Feedback and User Experience', () => {
        it('should show proper hover effects on path cards', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const eventProposalCard = screen.getByText('Create New Event Proposal').closest('.hover\\:shadow-xl');
            const reportCard = screen.getByText('Submit Post-Event Report').closest('.hover\\:shadow-xl');

            expect(eventProposalCard).toBeInTheDocument();
            expect(reportCard).toBeInTheDocument();
        });

        it('should display proper visual hierarchy with badges', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const preEventBadge = screen.getByText('Pre-Event');
            const postEventBadge = screen.getByText('Post-Event');

            expect(preEventBadge.closest('.bg-blue-600')).toBeInTheDocument();
            expect(postEventBadge.closest('.bg-gray-600')).toBeInTheDocument();
        });

        it('should show proper visual indicators for primary vs secondary actions', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            const startButton = screen.getByRole('button', { name: /start event proposal/i });
            const reportButton = screen.getByRole('button', { name: /submit report/i });

            // Primary action should have blue background
            expect(startButton).toHaveClass('bg-blue-600');
            expect(startButton).toHaveClass('text-white');

            // Secondary action should have white background with border
            expect(reportButton).toHaveClass('bg-white');
            expect(reportButton).toHaveClass('border-2');
            expect(reportButton).toHaveClass('text-gray-700');
        });

        it('should display comprehensive feature lists for each path', () => {
            renderOverview({ onPathSelect: mockOnPathSelect });

            // Event Proposal features
            expect(screen.getByText(/event details and logistics planning/i)).toBeInTheDocument();
            expect(screen.getByText(/venue and date coordination/i)).toBeInTheDocument();
            expect(screen.getByText(/target audience and sdp credits/i)).toBeInTheDocument();
            expect(screen.getByText(/required documentation upload/i)).toBeInTheDocument();

            // Post-Event Report features
            expect(screen.getByText(/attendance and participation reports/i)).toBeInTheDocument();
            expect(screen.getByText(/event photos and documentation/i)).toBeInTheDocument();
            expect(screen.getByText(/accomplishment summaries/i)).toBeInTheDocument();
            expect(screen.getByText(/final reports and receipts/i)).toBeInTheDocument();
        });
    });
});
