/**
 * MultiStepFormFlow Component Unit Tests
 * Tests the multi-step form flow component
 * 
 * Key approaches: TDD workflow, step navigation, form state management,
 * progress tracking, and section rendering
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the hooks
vi.mock('../src/app/student-dashboard/submit-event/[draftId]/hooks/useMultiStepForm', () => ({
    useMultiStepForm: vi.fn(),
    STEPS: [
        { name: "Overview", path: '/overview', index: 0 },
        { name: "Event Type", path: '/event-type', index: 1 },
        { name: "Organization", path: '/organization', index: 2 },
        { name: "Event Details", path: '/school-event', index: 3 },
        { name: "Reporting", path: '/reporting', index: 4 }
    ]
}));

// Mock child components
vi.mock('../src/app/student-dashboard/submit-event/[draftId]/overview/Section1_Overview', () => ({
    default: ({ onStartProposal, onContinueEditing, onViewProposal, onSubmitReport }) => (
        <div data-testid="overview-section">
            <h2>Overview Section</h2>
            <button onClick={onStartProposal}>Start Proposal</button>
            <button onClick={onContinueEditing}>Continue Editing</button>
            <button onClick={onViewProposal}>View Proposal</button>
            <button onClick={onSubmitReport}>Submit Report</button>
        </div>
    )
}));

vi.mock('../src/app/student-dashboard/submit-event/[draftId]/event-type/EventTypeSelection', () => ({
    default: ({ onSelect, onPrevious, isSaving }) => (
        <div data-testid="event-type-section">
            <h2>Event Type Selection</h2>
            <button onClick={() => onSelect('school-based')} disabled={isSaving}>School Based</button>
            <button onClick={() => onSelect('community-based')} disabled={isSaving}>Community Based</button>
            <button onClick={onPrevious}>Previous</button>
        </div>
    )
}));

vi.mock('../src/app/student-dashboard/submit-event/[draftId]/organization/OrganizationSection', () => ({
    default: ({ formData, handleInputChange, onNext, onPrevious, disabled, eventType }) => (
        <div data-testid="organization-section">
            <h2>Organization Section</h2>
            <p>Event Type: {eventType}</p>
            <input name="organizationName" onChange={handleInputChange} disabled={disabled} />
            <button onClick={onNext}>Next</button>
            <button onClick={onPrevious}>Previous</button>
        </div>
    )
}));

vi.mock('../src/app/student-dashboard/submit-event/[draftId]/components/school/SchoolSpecificSection', () => ({
    SchoolSpecificSection: ({ formData, handleInputChange, onNext, onPrevious, disabled, draftId }) => (
        <div data-testid="school-event-section">
            <h2>School Event Section</h2>
            <p>Draft ID: {draftId}</p>
            <input name="schoolEventName" onChange={handleInputChange} disabled={disabled} />
            <button onClick={onNext}>Next</button>
            <button onClick={onPrevious}>Previous</button>
        </div>
    )
}));

vi.mock('../src/app/student-dashboard/submit-event/[draftId]/components/community/CommunitySpecificSection', () => ({
    CommunitySpecificSection: ({ formData, handleInputChange, onNext, onPrevious, disabled, draftId }) => (
        <div data-testid="community-event-section">
            <h2>Community Event Section</h2>
            <p>Draft ID: {draftId}</p>
            <input name="communityEventName" onChange={handleInputChange} disabled={disabled} />
            <button onClick={onNext}>Next</button>
            <button onClick={onPrevious}>Previous</button>
        </div>
    )
}));

vi.mock('../../components', () => ({
    ValidationErrorsAlert: ({ errors }) => (
        <div data-testid="validation-errors">
            <h3>Validation Errors</h3>
            <ul>
                {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{field}: {error}</li>
                ))}
            </ul>
        </div>
    )
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn()
    }))
}));

// Import the component and hook
import MultiStepFormFlow from '../src/app/student-dashboard/submit-event/[draftId]/components/MultiStepFormFlow.jsx';
import { useMultiStepForm } from '../src/app/student-dashboard/submit-event/[draftId]/hooks/useMultiStepForm';

describe('MultiStepFormFlow Component', () => {
    const mockUseMultiStepForm = vi.mocked(useMultiStepForm);
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render the main component structure', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 0,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 20,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByText('Event Proposal Submission')).toBeInTheDocument();
            expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
            expect(screen.getByTestId('overview-section')).toBeInTheDocument();
            expect(currentStep).toBe(0);
        });

        it('should render progress bar with correct percentage', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ width: '60%' });
        });

        it('should render step indicators correctly', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 1,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 40,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
        });
    });

    describe('Step Navigation', () => {
        it('should render overview section for step 0', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 0,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 20,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByTestId('overview-section')).toBeInTheDocument();
            expect(screen.getByText('Overview Section')).toBeInTheDocument();
        });

        it('should render event type section for step 1', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 1,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 40,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByTestId('event-type-section')).toBeInTheDocument();
            expect(screen.getByText('Event Type Selection')).toBeInTheDocument();
        });

        it('should render organization section for step 2', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: { eventType: 'school-based' },
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByTestId('organization-section')).toBeInTheDocument();
            expect(screen.getByText('Organization Section')).toBeInTheDocument();
            expect(screen.getByText('Event Type: school-based')).toBeInTheDocument();
            expect(currentStep).toBe(2);
        });

        it('should render school event section for step 3 with school-based event type', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 3,
                formData: { eventType: 'school-based' },
                validationErrors: {},
                loading: false,
                progressPercentage: 80,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByTestId('school-event-section')).toBeInTheDocument();
            expect(screen.getByText('School Event Section')).toBeInTheDocument();
        });

        it('should render community event section for step 3 with community-based event type', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 3,
                formData: { eventType: 'community-based' },
                validationErrors: {},
                loading: false,
                progressPercentage: 80,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByTestId('community-event-section')).toBeInTheDocument();
            expect(screen.getByText('Community Event Section')).toBeInTheDocument();
        });

        it('should render reporting section for step 4', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 4,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 100,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByText('Proposal Submitted!')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
        });
    });

    describe('Navigation Buttons', () => {
        it('should render navigation buttons correctly', () => {
            const mockGoToNextStep = vi.fn();
            const mockGoToPreviousStep = vi.fn();

            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: mockGoToNextStep,
                goToPreviousStep: mockGoToPreviousStep,
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
        });

        it('should disable previous button on first step', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 0,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 20,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const previousButton = screen.getByRole('button', { name: 'Previous' });
            expect(previousButton).toBeDisabled();
        });

        it('should disable next button on last step', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 4,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 100,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const nextButton = screen.getByRole('button', { name: 'Complete' });
            expect(nextButton).toBeDisabled();
        });

        it('should call navigation functions when buttons are clicked', async () => {
            const mockGoToNextStep = vi.fn();
            const mockGoToPreviousStep = vi.fn();

            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: mockGoToNextStep,
                goToPreviousStep: mockGoToPreviousStep,
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const nextButton = screen.getByRole('button', { name: 'Next' });
            const previousButton = screen.getByRole('button', { name: 'Previous' });

            await user.click(nextButton);
            await user.click(previousButton);

            expect(mockGoToNextStep).toHaveBeenCalledTimes(1);
            expect(mockGoToPreviousStep).toHaveBeenCalledTimes(1);
            expect(fireEvent.click(nextButton)).toBeDefined();
            expect(fireEvent.click(previousButton)).toBeDefined();
        });
    });

    describe('Form Interactions', () => {
        it('should handle input changes correctly', async () => {
            const mockHandleInputChange = vi.fn();

            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: { eventType: 'school-based' },
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: mockHandleInputChange,
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const input = screen.getByRole('textbox');
            await user.type(input, 'Test Organization');

            expect(mockHandleInputChange).toHaveBeenCalled();
        });

        it('should handle event type selection correctly', async () => {
            const mockHandleEventTypeSelect = vi.fn();

            mockUseMultiStepForm.mockReturnValue({
                currentStep: 1,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 40,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: mockHandleEventTypeSelect,
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const schoolButton = screen.getByRole('button', { name: 'School Based' });
            await user.click(schoolButton);

            expect(mockHandleEventTypeSelect).toHaveBeenCalledWith('school-based');
        });

        it('should disable form inputs when loading', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: { eventType: 'school-based' },
                validationErrors: {},
                loading: true,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const input = screen.getByRole('textbox');
            expect(input).toBeDisabled();
        });
    });

    describe('Validation Errors', () => {
        it('should display validation errors when present', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: { eventType: 'school-based' },
                validationErrors: { organizationName: 'Organization name is required' },
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: true
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
            expect(screen.getByText('organizationName: Organization name is required')).toBeInTheDocument();
        });

        it('should not display validation errors when none present', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: { eventType: 'school-based' },
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            expect(screen.queryByTestId('validation-errors')).not.toBeInTheDocument();
        });
    });

    describe('Overview Section Handlers', () => {
        it('should call correct handlers for overview section buttons', async () => {
            const mockGoToStep = vi.fn();

            mockUseMultiStepForm.mockReturnValue({
                currentStep: 0,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 20,
                handleInputChange: vi.fn(),
                goToStep: mockGoToStep,
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const startButton = screen.getByRole('button', { name: 'Start Proposal' });
            const continueButton = screen.getByRole('button', { name: 'Continue Editing' });
            const viewButton = screen.getByRole('button', { name: 'View Proposal' });
            const reportButton = screen.getByRole('button', { name: 'Submit Report' });

            await user.click(startButton);
            await user.click(continueButton);
            await user.click(viewButton);
            await user.click(reportButton);

            expect(mockGoToStep).toHaveBeenCalledWith(1); // Start Proposal
            expect(mockGoToStep).toHaveBeenCalledWith(1); // Continue Editing
            expect(mockGoToStep).toHaveBeenCalledWith(0); // View Proposal
            expect(mockGoToStep).toHaveBeenCalledWith(4); // Submit Report
        });
    });

    describe('Hook Integration', () => {
        it('should call useMultiStepForm with correct draftId', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 0,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 20,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft-123' }} />);

            expect(mockUseMultiStepForm).toHaveBeenCalledWith('test-draft-123');
        });

        it('should handle all hook return values correctly', () => {
            const mockHandleInputChange = vi.fn();
            const mockGoToStep = vi.fn();
            const mockHandleEventTypeSelect = vi.fn();

            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: { eventType: 'school-based' },
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: mockHandleInputChange,
                goToStep: mockGoToStep,
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: mockHandleEventTypeSelect,
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            // Verify hook values are used
            expect(screen.getByText('Event Type: school-based')).toBeInTheDocument();
            expect(mockHandleInputChange).toBeDefined();
            expect(mockGoToStep).toBeDefined();
            expect(mockHandleEventTypeSelect).toBeDefined();
        });
    });

    describe('Styling and Layout', () => {
        it('should have correct main container styling', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 0,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 20,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const mainContainer = screen.getByText('Event Proposal Submission').closest('div');
            expect(mainContainer).toHaveClass('min-h-screen');
            expect(mainContainer).toHaveClass('bg-gray-50');
        });

        it('should have correct progress bar styling', () => {
            mockUseMultiStepForm.mockReturnValue({
                currentStep: 2,
                formData: {},
                validationErrors: {},
                loading: false,
                progressPercentage: 60,
                handleInputChange: vi.fn(),
                goToStep: vi.fn(),
                goToNextStep: vi.fn(),
                goToPreviousStep: vi.fn(),
                handleEventTypeSelect: vi.fn(),
                handleOrganizationNext: vi.fn(),
                hasValidationErrors: false
            });

            render(<MultiStepFormFlow params={{ draftId: 'test-draft' }} />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveClass('bg-blue-600');
            expect(progressBar).toHaveClass('h-2');
            expect(progressBar).toHaveClass('rounded-full');
        });
    });
});
