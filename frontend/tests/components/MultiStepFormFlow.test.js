/**
 * MultiStepFormFlow Component Tests
 * Comprehensive tests for the multi-step form flow component
 * 
 * Key approaches: TDD, step navigation testing, form state management,
 * dynamic rendering, validation handling, and event type selection
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock React.use
const mockUse = vi.fn();
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        use: mockUse
    };
});

// Mock the hooks
const mockUseMultiStepForm = vi.fn();
vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/hooks/useMultiStepForm', () => ({
    useMultiStepForm: mockUseMultiStepForm,
    STEPS: [
        { name: "Overview", description: "Start your proposal", path: '/overview', index: 0 },
        { name: "Event Type", description: "Choose event type", path: '/event-type', index: 1 },
        { name: "Organization", description: "Organization details", path: '/organization', index: 2 },
        { name: "Event Details", description: "Event information", path: '/school-event', alternativePaths: ['/community-event'], index: 3 },
        { name: "Reporting", description: "Submit report", path: '/reporting', index: 4 }
    ]
}));

// Mock child components with simple null returns
vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/components/overview/Section1_Overview', () => ({
    default: () => null
}));

vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/event-type/EventTypeSelection', () => ({
    default: () => null
}));

vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/organization/OrganizationSection', () => ({
    default: () => null
}));

vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/components/school/SchoolSpecificSection', () => ({
    default: () => null
}));

vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/components/community/CommunitySpecificSection', () => ({
    default: () => null
}));

vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/components', () => ({
    ValidationErrorsAlert: () => null
}));

// Import after mocking
import MultiStepFormFlow from '../../src/app/student-dashboard/submit-event/[draftId]/components/MultiStepFormFlow';

describe('MultiStepFormFlow Component', () => {
    const mockParams = Promise.resolve({ draftId: 'test-draft-123' });

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockUse.mockReturnValue({ draftId: 'test-draft-123' });
        mockUseMultiStepForm.mockReturnValue({
            currentStep: 0,
            formData: { eventType: 'school-based' },
            validationErrors: {},
            loading: false,
            progressPercentage: 20,
            nextStep: vi.fn(),
            prevStep: vi.fn(),
            updateFormData: vi.fn(),
            validateStep: vi.fn(),
            handleInputChange: vi.fn(),
            goToStep: vi.fn(),
            goToNextStep: vi.fn(),
            goToPreviousStep: vi.fn(),
            handleEventTypeSelect: vi.fn(),
            handleOrganizationNext: vi.fn(),
            hasValidationErrors: false
        });
    });

    describe('Params Resolution', () => {
        it('should resolve params using React.use()', () => {
            render(<MultiStepFormFlow params={mockParams} />);

            expect(mockUse).toHaveBeenCalledWith(mockParams);
        });

        it('should extract draftId from resolved params', () => {
            mockUse.mockReturnValue({ draftId: 'extracted-draft-456' });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(mockUseMultiStepForm).toHaveBeenCalledWith('extracted-draft-456');
        });

        it('should handle undefined params', () => {
            mockUse.mockReturnValue({});

            render(<MultiStepFormFlow />);

            expect(mockUseMultiStepForm).toHaveBeenCalledWith(undefined);
        });
    });

    describe('Hook Integration', () => {
        it('should call useMultiStepForm with correct draftId', () => {
            render(<MultiStepFormFlow params={mockParams} />);

            expect(mockUseMultiStepForm).toHaveBeenCalledWith('test-draft-123');
        });

        it('should destructure all required hook values', () => {
            const mockHookReturn = {
                currentStep: 2,
                formData: { eventType: 'community-based' },
                validationErrors: { organizationName: 'Required' },
                loading: true,
                progressPercentage: 60,
                nextStep: vi.fn(),
                prevStep: vi.fn(),
                updateFormData: vi.fn(),
                validateStep: vi.fn(),
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: true
            };

            mockUseMultiStepForm.mockReturnValue(mockHookReturn);

            render(<MultiStepFormFlow params={mockParams} />);

            // Verify the component renders without crashing
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });
    });

    describe('Step Navigation', () => {
        it('should render overview section when currentStep is 0', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 0
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
        });

        it('should render event type section when currentStep is 1', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 1
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
        });

        it('should render organization section when currentStep is 2', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
        });

        it('should render event details section when currentStep is 3', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 3,
                formData: { eventType: 'school-based' }
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
        });

        it('should render reporting section when currentStep is 4', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 4
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Proposal Submitted!')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
        });

        it('should default to overview section for unknown step', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 999
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });
    });

    describe('Progress Bar', () => {
        it('should display correct progress percentage', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                progressPercentage: 60
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ width: '60%' });
        });

        it('should display correct step information', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                progressPercentage: 60
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should highlight current and completed steps', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                progressPercentage: 60
            });

            render(<MultiStepFormFlow params={mockParams} />);

            // Check that steps 0, 1, and 2 are highlighted (completed/current)
            const stepIndicators = screen.getAllByText(/[1-5]/);
            expect(stepIndicators[0]).toHaveClass('bg-blue-600'); // Step 1
            expect(stepIndicators[1]).toHaveClass('bg-blue-600'); // Step 2
            expect(stepIndicators[2]).toHaveClass('bg-blue-600'); // Step 3 (current)
        });
    });

    describe('Navigation Buttons', () => {
        it('should disable previous button on first step', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 0,
                loading: false
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const previousButton = screen.getByRole('button', { name: 'Previous' });
            expect(previousButton).toBeDisabled();
        });

        it('should enable previous button on other steps', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                loading: false
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const previousButton = screen.getByRole('button', { name: 'Previous' });
            expect(previousButton).not.toBeDisabled();
        });

        it('should disable next button on last step', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 4,
                loading: false
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const nextButton = screen.getByRole('button', { name: 'Complete' });
            expect(nextButton).toBeDisabled();
        });

        it('should enable next button on other steps', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                loading: false
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const nextButton = screen.getByRole('button', { name: 'Next' });
            expect(nextButton).not.toBeDisabled();
        });

        it('should disable navigation buttons when loading', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                loading: true
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const previousButton = screen.getByRole('button', { name: 'Previous' });
            const nextButton = screen.getByRole('button', { name: 'Next' });

            expect(previousButton).toBeDisabled();
            expect(nextButton).toBeDisabled();
        });

        it('should call goToPreviousStep when previous button is clicked', () => {
            const mockGoToPreviousStep = vi.fn();
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                loading: false,
                goToPreviousStep: mockGoToPreviousStep
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const previousButton = screen.getByRole('button', { name: 'Previous' });
            fireEvent.click(previousButton);

            expect(mockGoToPreviousStep).toHaveBeenCalled();
        });

        it('should call goToNextStep when next button is clicked', () => {
            const mockGoToNextStep = vi.fn();
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                loading: false,
                goToNextStep: mockGoToNextStep
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const nextButton = screen.getByRole('button', { name: 'Next' });
            fireEvent.click(nextButton);

            expect(mockGoToNextStep).toHaveBeenCalled();
        });
    });

    describe('Component Structure', () => {
        it('should have correct layout structure', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2
            });

            render(<MultiStepFormFlow params={mockParams} />);

            // Check main container
            const mainContainer = screen.getByText('Event Proposal Submission').closest('.min-h-screen');
            expect(mainContainer).toHaveClass('bg-gray-50', 'dark:bg-gray-900');

            // Check progress bar container
            const progressContainer = screen.getByText('Event Proposal Submission').closest('.bg-white');
            expect(progressContainer).toHaveClass('shadow-sm', 'border-b', 'dark:bg-gray-800');

            // Check main content area
            const contentArea = screen.getByText('Event Proposal Submission').closest('.max-w-7xl');
            expect(contentArea).toBeInTheDocument();
        });

        it('should have proper dark mode classes', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2
            });

            render(<MultiStepFormFlow params={mockParams} />);

            const mainContainer = screen.getByText('Event Proposal Submission').closest('.min-h-screen');
            expect(mainContainer).toHaveClass('dark:bg-gray-900');

            const progressContainer = screen.getByText('Event Proposal Submission').closest('.bg-white');
            expect(progressContainer).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined formData', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 3,
                formData: undefined
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle empty formData', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 3,
                formData: {}
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle null validationErrors', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                validationErrors: null,
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });

        it('should handle empty validationErrors', () => {
            mockUseMultiStepForm.mockReturnValue({
                ...mockUseMultiStepForm(),
                currentStep: 2,
                validationErrors: {},
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={mockParams} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
        });
    });
});
