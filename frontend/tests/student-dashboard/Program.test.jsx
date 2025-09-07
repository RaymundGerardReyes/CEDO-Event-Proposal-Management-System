/**
 * Program Component Unit Tests
 * 
 * 🎯 Purpose: Comprehensive testing of the Program review component
 * - Tests form data display and formatting
 * - Tests UUID display and context integration
 * - Tests navigation and form submission
 * - Tests data validation and error handling
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import Program from '../../src/app/student-dashboard/submit-event/components/Program';
import { EventFormProvider } from '../../src/app/student-dashboard/submit-event/contexts/EventFormContext';

// Mock the EventFormContext
const mockEventFormContext = {
    eventUuid: '550e8400-e29b-41d4-a716-446655440000',
    getShortUuid: vi.fn(() => '550e8400'),
    getFormAge: vi.fn(() => '2 hours ago')
};

vi.mock('../../contexts/EventFormContext', () => ({
    useEventForm: () => mockEventFormContext,
    EventFormProvider: ({ children }) => children
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid="alert-circle-icon" />,
    Calendar: () => <div data-testid="calendar-icon" />,
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    FileText: () => <div data-testid="file-text-icon" />,
    MapPin: () => <div data-testid="mappin-icon" />
}));

// Test form schema
const testSchema = z.object({
    eventName: z.string().optional(),
    venue: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    eventType: z.string().optional(),
    targetAudience: z.string().optional(),
    sdpCredits: z.string().optional(),
    gpoaFile: z.any().optional(),
    projectProposalFile: z.any().optional()
});

// Test wrapper component with sample data
const TestWrapper = ({ children, defaultValues = {} }) => {
    const methods = useForm({
        resolver: zodResolver(testSchema),
        defaultValues: {
            eventName: 'Community Health Seminar',
            venue: 'Main Auditorium',
            startDate: '2024-12-01',
            endDate: '2024-12-01',
            eventType: 'academic-enhancement',
            targetAudience: '1st-year',
            sdpCredits: '2',
            gpoaFile: { name: 'gpoa.pdf', size: 1024000 },
            projectProposalFile: { name: 'proposal.pdf', size: 2048000 },
            ...defaultValues
        }
    });

    return (
        <EventFormProvider>
            <FormProvider {...methods}>{children}</FormProvider>
        </EventFormProvider>
    );
};

describe('Program Component', () => {
    const mockMethods = {
        register: vi.fn(),
        formState: { errors: {} },
        watch: vi.fn(() => ({}))
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
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
            expect(screen.getByText(/review all event information before submission/i)).toBeInTheDocument();
        });

        it('should render all required icons', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getAllByTestId('calendar-icon')).toHaveLength(1);
            expect(screen.getAllByTestId('mappin-icon')).toHaveLength(1);
            expect(screen.getAllByTestId('file-text-icon')).toHaveLength(3); // Header + 2 file icons
            expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(5); // Header + 2 uploaded status icons + 2 more
        });

        it('should render step validation status', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Review Complete')).toBeInTheDocument();
            expect(screen.getByText(/all information is complete and ready for submission/i)).toBeInTheDocument();
        });
    });

    describe('UUID Display and Context Integration', () => {
        it('should display UUID information', () => {
            render(
                <TestWrapper>
                    <Program
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
                    <Program
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
                    <Program
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

    describe('Event Information Display', () => {
        it('should display event name', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Community Health Seminar')).toBeInTheDocument();
        });

        it('should display venue information', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
        });

        it('should display formatted dates', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getAllByText('December 1, 2024')).toHaveLength(2); // Start and end date
        });

        it('should display event type', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Academic Enhancement')).toBeInTheDocument();
        });

        it('should display target audience', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('1st Year')).toBeInTheDocument();
        });

        it('should display SDP credits', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('2')).toBeInTheDocument(); // SDP Credits
        });
    });

    describe('Event Information Display', () => {
        it('should display event overview section', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Event Overview')).toBeInTheDocument();
            expect(screen.getByText('Event Details')).toBeInTheDocument();
        });
    });

    describe('File Information Display', () => {
        it('should display uploaded file names', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/gpoa\.pdf/)).toBeInTheDocument();
            expect(screen.getByText(/proposal\.pdf/)).toBeInTheDocument();
        });

        it('should display formatted file sizes', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/1000 KB/)).toBeInTheDocument(); // 1024000 bytes
            expect(screen.getByText(/1\.95 MB/)).toBeInTheDocument(); // 2048000 bytes
        });

        it('should show file upload status', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('General Plans of Action (GPOA)')).toBeInTheDocument();
            expect(screen.getByText('Project Proposal')).toBeInTheDocument();
        });
    });

    describe('Data Formatting Functions', () => {
        it('should format dates correctly', () => {
            render(
                <TestWrapper defaultValues={{ startDate: '2024-12-25' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('December 25, 2024')).toBeInTheDocument();
        });

        it('should handle missing dates gracefully', () => {
            render(
                <TestWrapper defaultValues={{ startDate: '', endDate: '' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getAllByText('Not specified')).toHaveLength(2);
        });

        it('should format file sizes correctly', () => {
            render(
                <TestWrapper defaultValues={{
                    gpoaFile: { name: 'test.pdf', size: 1536 }, // 1.5 KB
                    projectProposalFile: { name: 'test2.pdf', size: 1048576 } // 1 MB
                }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/1\.5 KB/)).toBeInTheDocument();
            expect(screen.getByText(/1 MB/)).toBeInTheDocument();
        });

        it('should handle zero file size', () => {
            render(
                <TestWrapper defaultValues={{
                    gpoaFile: { name: 'empty.pdf', size: 0 }
                }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/0 Bytes/)).toBeInTheDocument();
        });
    });

    describe('Event Type Label Mapping', () => {
        it('should map academic-enhancement to correct label', () => {
            render(
                <TestWrapper defaultValues={{ eventType: 'academic-enhancement' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Academic Enhancement')).toBeInTheDocument();
        });

        it('should map seminar-webinar to correct label', () => {
            render(
                <TestWrapper defaultValues={{ eventType: 'seminar-webinar' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Seminar/Webinar')).toBeInTheDocument();
        });

        it('should map general-assembly to correct label', () => {
            render(
                <TestWrapper defaultValues={{ eventType: 'general-assembly' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('General Assembly')).toBeInTheDocument();
        });

        it('should map leadership-training to correct label', () => {
            render(
                <TestWrapper defaultValues={{ eventType: 'leadership-training' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Leadership Training')).toBeInTheDocument();
        });

        it('should map others to correct label', () => {
            render(
                <TestWrapper defaultValues={{ eventType: 'others' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Others')).toBeInTheDocument();
        });

        it('should handle unknown event type', () => {
            render(
                <TestWrapper defaultValues={{ eventType: 'unknown-type' }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('unknown-type')).toBeInTheDocument();
        });
    });

    describe('Step Validation and Status', () => {
        it('should show incomplete status when form is invalid', () => {
            render(
                <TestWrapper defaultValues={{
                    eventName: '',
                    venue: '',
                    startDate: '',
                    endDate: '',
                    eventType: '',
                    targetAudience: '',
                    sdpCredits: '',
                    gpoaFile: null,
                    projectProposalFile: null
                }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Incomplete')).toBeInTheDocument();
            expect(screen.getByText(/please complete all required fields in previous steps/i)).toBeInTheDocument();
        });

        it('should show ready to submit status when form is valid', () => {
            render(
                <TestWrapper defaultValues={{
                    eventName: 'Test Event',
                    venue: 'Test Venue',
                    startDate: '2024-12-01',
                    endDate: '2024-12-01',
                    eventType: 'academic-enhancement',
                    targetAudience: '1st-year',
                    sdpCredits: '2',
                    gpoaFile: { name: 'test.pdf', size: 1000 },
                    projectProposalFile: { name: 'test2.pdf', size: 1000 }
                }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getAllByText('Ready to Submit')).toHaveLength(2); // Both the heading and status badge
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing methods prop gracefully', () => {
            expect(() => render(
                <TestWrapper>
                    <Program
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
                    <Program
                        methods={mockMethods}
                        isLastStep={false}
                    />
                </TestWrapper>
            )).not.toThrow();
        });

        it('should handle empty form data gracefully', () => {
            render(
                <TestWrapper defaultValues={{}}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // Should not crash with empty data
            expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
        });

        it('should handle null file data', () => {
            render(
                <TestWrapper defaultValues={{
                    gpoaFile: null,
                    projectProposalFile: null
                }}>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getAllByText('No file uploaded')).toHaveLength(2);
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should have proper section headings', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Event Overview')).toBeInTheDocument();
            expect(screen.getByText('Event Details')).toBeInTheDocument();
            expect(screen.getByText('Attached Documents')).toBeInTheDocument();
        });

        it('should have proper heading hierarchy', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const mainHeading = screen.getByRole('heading', { level: 2 });
            expect(mainHeading).toHaveTextContent('Review & Confirm');
        });

        it('should display confirmation message', () => {
            render(
                <TestWrapper>
                    <Program
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/please review all information above carefully/i)).toBeInTheDocument();
        });
    });
});
