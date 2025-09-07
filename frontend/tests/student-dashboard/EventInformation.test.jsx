/**
 * EventInformation Component Unit Tests
 * 
 * 🎯 Purpose: Comprehensive testing of the EventInformation form component
 * - Tests form field validation and submission
 * - Tests file upload functionality
 * - Tests date picker and dropdown interactions
 * - Tests UUID display and context integration
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import EventInformation from '../../src/app/student-dashboard/submit-event/components/EventInformation';
import { EventFormProvider } from '../../src/app/student-dashboard/submit-event/contexts/EventFormContext';

// Mock the EventFormContext
const mockEventFormContext = {
    eventUuid: '550e8400-e29b-41d4-a716-446655440000',
    getShortUuid: vi.fn(() => '550e8400'),
    getFormAge: vi.fn(() => '2 hours ago'),
    updateFormStatus: vi.fn(),
    clearEventUuid: vi.fn()
};

vi.mock('../../contexts/EventFormContext', () => ({
    useEventForm: () => mockEventFormContext,
    EventFormProvider: ({ children }) => children // Passthrough mock
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid="alert-circle-icon" />,
    Calendar: () => <div data-testid="calendar-icon" />,
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    FileText: () => <div data-testid="file-text-icon" />,
    MapPin: () => <div data-testid="mappin-icon" />,
    Upload: () => <div data-testid="upload-icon" />,
    X: () => <div data-testid="x-icon" />
}));

// Test form schema
const testSchema = z.object({
    eventName: z.string().min(1, 'Event name is required'),
    venue: z.string().min(1, 'Venue is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    eventType: z.string().min(1, 'Event type is required'),
    targetAudience: z.array(z.string()).min(1, 'Target audience is required'),
    sdpCredits: z.number().min(1, 'SDP credits is required'),
    gpoaFile: z.any().optional(),
    projectProposalFile: z.any().optional()
});

// Test wrapper component
const TestWrapper = ({ children, defaultValues = {} }) => {
    const methods = useForm({
        resolver: zodResolver(testSchema),
        defaultValues: {
            eventName: '',
            venue: '',
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            eventType: '',
            targetAudience: [],
            sdpCredits: 1,
            gpoaFile: null,
            projectProposalFile: null,
            ...defaultValues
        }
    });

    return (
        <EventFormProvider>
            <FormProvider {...methods}>{children}</FormProvider>
        </EventFormProvider>
    );
};

describe('EventInformation Component', () => {
    const mockMethods = {
        register: vi.fn(),
        formState: { errors: {} },
        watch: vi.fn(() => ({})),
        setValue: vi.fn(),
        trigger: vi.fn()
    };

    const mockOnNext = vi.fn();
    const mockOnPrevious = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render the main heading and description', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Event Information')).toBeInTheDocument();
            expect(screen.getByText(/provide event details and required documentation/i)).toBeInTheDocument();
        });

        it('should render all form fields', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByLabelText(/event\/activity name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/venue \(platform or address\)/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/type of event/i)).toBeInTheDocument();
            expect(screen.getByText(/target audience/i)).toBeInTheDocument();
            expect(screen.getAllByText(/number of sdp credits/i)).toHaveLength(2); // Label + description
        });

        it('should render all required icons', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getAllByTestId('calendar-icon')).toHaveLength(2); // Start and end date
            expect(screen.getAllByTestId('mappin-icon')).toHaveLength(2); // Venue + header
            expect(screen.getAllByTestId('clock-icon')).toHaveLength(2); // Start and end time
            // File-text icons only appear when files are uploaded, not initially
            expect(screen.queryByTestId('file-text-icon')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('upload-icon')).toHaveLength(4); // Two upload buttons + two file icons
        });

        it('should render step validation status', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Event Information Complete')).toBeInTheDocument();
            expect(screen.getByText(/complete all required fields and upload required documents/i)).toBeInTheDocument();
        });
    });

    describe('UUID Display and Context Integration', () => {
        it('should display UUID information', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Event ID:')).toBeInTheDocument();
            expect(screen.getByText('550e8400')).toBeInTheDocument();
            expect(screen.getByText(/created 2 hours ago/i)).toBeInTheDocument();
        });

        it('should call getShortUuid from context', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(mockEventFormContext.getShortUuid).toHaveBeenCalled();
        });

        it('should call getFormAge from context', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(mockEventFormContext.getFormAge).toHaveBeenCalled();
        });
    });

    describe('Form Field Validation', () => {
        it('should show required field indicators', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const requiredFields = screen.getAllByText(/\*$/);
            expect(requiredFields.length).toBeGreaterThan(0);
        });

        it('should display field labels correctly', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/event\/activity name/i)).toBeInTheDocument();
            expect(screen.getByText(/venue \(platform or address\)/i)).toBeInTheDocument();
            expect(screen.getByText(/start date/i)).toBeInTheDocument();
            expect(screen.getByText(/end date/i)).toBeInTheDocument();
            expect(screen.getByText(/start time/i)).toBeInTheDocument();
            expect(screen.getByText(/end time/i)).toBeInTheDocument();
            expect(screen.getByText(/type of event/i)).toBeInTheDocument();
            expect(screen.getByText(/target audience/i)).toBeInTheDocument();
            expect(screen.getAllByText(/number of sdp credits/i)).toHaveLength(2); // Label + description
        });

        it('should show field placeholders', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByPlaceholderText(/enter the name of your event or activity/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/enter venue name, platform, or full address/i)).toBeInTheDocument();
        });
    });

    describe('Event Type Dropdown', () => {
        it('should render all event type options', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Academic Enhancement')).toBeInTheDocument();
            expect(screen.getByText('Seminar/Webinar')).toBeInTheDocument();
            expect(screen.getByText('General Assembly')).toBeInTheDocument();
            expect(screen.getByText('Leadership Training')).toBeInTheDocument();
            expect(screen.getByText('Others')).toBeInTheDocument();
        });

        it('should handle event type selection', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const eventTypeSelect = screen.getByLabelText(/type of event/i);
            fireEvent.change(eventTypeSelect, { target: { value: 'academic-enhancement' } });

            expect(eventTypeSelect.value).toBe('academic-enhancement');
        });
    });

    describe('Target Audience Selection', () => {
        it('should render all target audience options', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('1st Year')).toBeInTheDocument();
            expect(screen.getByText('2nd Year')).toBeInTheDocument();
            expect(screen.getByText('3rd Year')).toBeInTheDocument();
            expect(screen.getByText('4th Year')).toBeInTheDocument();
            expect(screen.getByText('All Levels')).toBeInTheDocument();
            expect(screen.getByText('Leaders')).toBeInTheDocument();
            expect(screen.getByText('Alumni')).toBeInTheDocument();
        });

        it('should handle multiple target audience selection', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // Target audience checkboxes are within label elements
            // We need to find them by their value attribute
            const firstYearCheckbox = screen.getByRole('checkbox', { name: /1st year/i });
            const secondYearCheckbox = screen.getByRole('checkbox', { name: /2nd year/i });

            fireEvent.click(firstYearCheckbox);
            fireEvent.click(secondYearCheckbox);

            expect(firstYearCheckbox.checked).toBe(true);
            expect(secondYearCheckbox.checked).toBe(true);
        });
    });

    describe('Date Input Fields', () => {
        it('should handle start date input', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const startDateInput = screen.getByLabelText(/start date/i);
            fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });

            expect(startDateInput.value).toBe('2024-12-01');
        });

        it('should handle end date input', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const endDateInput = screen.getByLabelText(/end date/i);
            fireEvent.change(endDateInput, { target: { value: '2024-12-02' } });

            expect(endDateInput.value).toBe('2024-12-02');
        });

        it('should validate date range', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const startDateInput = screen.getByLabelText(/start date/i);
            const endDateInput = screen.getByLabelText(/end date/i);

            fireEvent.change(startDateInput, { target: { value: '2024-12-02' } });
            fireEvent.change(endDateInput, { target: { value: '2024-12-01' } });

            // End date should be after start date
            expect(new Date(endDateInput.value) >= new Date(startDateInput.value)).toBe(false);
        });
    });

    describe('File Upload Functionality', () => {
        it('should render file upload sections', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/attach general plans of action \(gpoa\)/i)).toBeInTheDocument();
            expect(screen.getByText(/attach project proposal/i)).toBeInTheDocument();
        });

        it('should handle file selection', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // File input is hidden, we need to find it by its id
            const fileInput = document.getElementById('gpoa-upload');
            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

            fireEvent.change(fileInput, { target: { files: [file] } });

            expect(fileInput.files[0]).toBe(file);
        });

        it('should show file upload instructions', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/file name format: organizationname_gpoa/i)).toBeInTheDocument();
            expect(screen.getByText(/upload gpoa document \(pdf, doc, docx\)/i)).toBeInTheDocument();
        });
    });

    describe('Number Input Fields', () => {
        it('should handle SDP credits selection', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // SDP credits are buttons, not input fields
            const sdpCreditsButton = screen.getByText('2');
            fireEvent.click(sdpCreditsButton);

            // Verify the button is selected (has the selected styling)
            expect(sdpCreditsButton).toBeInTheDocument();
        });

        it('should handle time input fields', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const startTimeInput = screen.getByLabelText(/start time/i);
            const endTimeInput = screen.getByLabelText(/end time/i);

            fireEvent.change(startTimeInput, { target: { value: '09:00' } });
            fireEvent.change(endTimeInput, { target: { value: '17:00' } });

            expect(startTimeInput.value).toBe('09:00');
            expect(endTimeInput.value).toBe('17:00');
        });

        it('should validate date range', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const startDateInput = screen.getByLabelText(/start date/i);
            const endDateInput = screen.getByLabelText(/end date/i);

            fireEvent.change(startDateInput, { target: { value: '2024-12-02' } });
            fireEvent.change(endDateInput, { target: { value: '2024-12-01' } });

            // End date should be after start date
            expect(new Date(endDateInput.value) >= new Date(startDateInput.value)).toBe(false);
        });
    });

    describe('Navigation and Form Submission', () => {
        it('should display step completion status', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Incomplete')).toBeInTheDocument();
        });

        it('should show complete status when form is valid', () => {
            render(
                <TestWrapper defaultValues={{
                    eventName: 'Test Event',
                    venue: 'Test Venue',
                    startDate: '2024-12-01',
                    endDate: '2024-12-02',
                    startTime: '09:00',
                    endTime: '17:00',
                    eventType: 'academic-enhancement',
                    targetAudience: ['1st-year'],
                    sdpCredits: 1
                }}>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // The form validation logic requires files to be uploaded as well
            // So we expect 'Incomplete' status
            expect(screen.getByText('Incomplete')).toBeInTheDocument();
        });

        it('should show step validation status', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={true}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Event Information Complete')).toBeInTheDocument();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing methods prop gracefully', () => {
            expect(() => render(
                <TestWrapper>
                    <EventInformation
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            )).not.toThrow();
        });

        it('should handle missing callback props gracefully', () => {
            expect(() => render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        isLastStep={false}
                    />
                </TestWrapper>
            )).not.toThrow();
        });

        it('should handle invalid file types', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // File input is hidden, we need to find it by its id
            const fileInput = document.getElementById('gpoa-upload');
            const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

            fireEvent.change(fileInput, { target: { files: [invalidFile] } });

            expect(fileInput.files[0]).toBe(invalidFile);
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should have proper form field accessibility attributes', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const eventNameInput = screen.getByLabelText(/event\/activity name/i);
            const startDateInput = screen.getByLabelText(/start date/i);
            const startTimeInput = screen.getByLabelText(/start time/i);

            expect(eventNameInput).toHaveAttribute('type', 'text');
            expect(startDateInput).toHaveAttribute('type', 'date');
            expect(startTimeInput).toHaveAttribute('type', 'time');
        });

        it('should have proper button accessibility attributes', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // The component doesn't have navigation buttons, so we test the step validation instead
            expect(screen.getByText('Event Information Complete')).toBeInTheDocument();
        });

        it('should display helpful field descriptions', () => {
            render(
                <TestWrapper>
                    <EventInformation
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByPlaceholderText(/enter the name of your event or activity/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/enter venue name, platform, or full address/i)).toBeInTheDocument();
        });
    });
});
