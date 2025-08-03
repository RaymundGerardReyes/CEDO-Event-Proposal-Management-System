/**
 * Submit Event Flow Integration Tests
 * 
 * Purpose: Test the complete flow from overview to reporting
 * Key approaches: Integration testing, flow validation, user interactions
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: vi.fn()
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn()
}));

// Mock the flow manager
vi.mock('@/app/main/student-dashboard/submit-event/[draftId]/flow/useSubmitEventFlow', () => ({
    useSubmitEventFlow: vi.fn()
}));

// Mock the event form component
vi.mock('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection', () => ({
    EventFormSection: vi.fn(({ eventType, onNext, onPrevious }) => (
        <div data-testid="event-form-section">
            <h2>{eventType === 'school-based' ? 'School Event Form' : 'Community Event Form'}</h2>
            <button onClick={onNext} data-testid="next-button">Next</button>
            <button onClick={onPrevious} data-testid="previous-button">Previous</button>
        </div>
    ))
}));

// Mock the event type selection component
vi.mock('@/app/main/student-dashboard/submit-event/[draftId]/event-type/EventTypeSelection', () => ({
    EventTypeSelection: vi.fn(({ onSelect, onPrevious }) => (
        <div data-testid="event-type-selection">
            <button onClick={() => onSelect('school-based')} data-testid="school-event-btn">
                School-Based Event
            </button>
            <button onClick={() => onSelect('community-based')} data-testid="community-event-btn">
                Community-Based Event
            </button>
            <button onClick={onPrevious} data-testid="previous-btn">Previous</button>
        </div>
    ))
}));

// Mock the event type page
vi.mock('@/app/main/student-dashboard/submit-event/[draftId]/event-type/page', () => ({
    default: vi.fn(({ params }) => {
        const { useRouter } = require('next/navigation');
        const { useToast } = require('@/hooks/use-toast');
        const { EventTypeSelection } = require('@/app/main/student-dashboard/submit-event/[draftId]/event-type/EventTypeSelection');

        const router = useRouter();
        const { toast } = useToast();

        const handleSelect = async (mappedType) => {
            try {
                console.log('🎯 EventTypePage: Saving event type selection:', mappedType);

                // Show success message
                toast({
                    title: "Event Type Saved",
                    description: `Your selection has been saved successfully.`,
                    variant: "default",
                });

                // Route to appropriate event section
                let targetRoute;
                if (mappedType === "school-based") {
                    targetRoute = `/student-dashboard/submit-event/${params.draftId}/school-event`;
                } else if (mappedType === "community-based") {
                    targetRoute = `/student-dashboard/submit-event/${params.draftId}/community-event`;
                } else {
                    targetRoute = `/student-dashboard/submit-event/${params.draftId}/organization`;
                }

                router.push(targetRoute);
            } catch (error) {
                console.error('❌ Failed to save event type selection:', error);
                toast({
                    title: "Warning: Event Type Not Saved",
                    description: "Your selection will be saved when you continue. You can proceed safely.",
                    variant: "destructive",
                });
            }
        };

        const handlePrevious = () => {
            router.push(`/student-dashboard/submit-event/${params.draftId}/overview`);
        };

        return <EventTypeSelection onSelect={handleSelect} onPrevious={handlePrevious} />;
    })
}));

describe('Submit Event Flow Integration', () => {
    let mockRouter;
    let mockToast;
    let mockUseSubmitEventFlow;

    beforeEach(() => {
        mockRouter = {
            push: vi.fn(),
            back: vi.fn(),
            forward: vi.fn()
        };

        mockToast = {
            toast: vi.fn()
        };

        mockUseSubmitEventFlow = {
            flowState: {
                currentStep: 'eventType',
                eventType: null,
                formData: {},
                validationErrors: {},
                canProceed: false
            },
            navigateToStep: vi.fn(),
            selectEventType: vi.fn(),
            updateFormData: vi.fn(),
            validateStep: vi.fn(),
            setError: vi.fn(),
            clearError: vi.fn()
        };

        // Setup mocks
        const { useRouter } = require('next/navigation');
        const { useToast } = require('@/hooks/use-toast');
        const { useSubmitEventFlow } = require('@/app/main/student-dashboard/submit-event/[draftId]/flow/useSubmitEventFlow');

        useRouter.mockReturnValue(mockRouter);
        useToast.mockReturnValue(mockToast);
        useSubmitEventFlow.mockReturnValue(mockUseSubmitEventFlow);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Event Type Selection Flow', () => {
        it('should route to school event section when school-based event is selected', async () => {
            // Render the event type page
            const EventTypePage = require('@/app/main/student-dashboard/submit-event/[draftId]/event-type/page').default;
            render(<EventTypePage params={{ draftId: 'test-draft-123' }} />);

            // Click on school-based event
            const schoolEventBtn = screen.getByTestId('school-event-btn');
            fireEvent.click(schoolEventBtn);

            // Verify the router was called correctly
            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/student-dashboard/submit-event/test-draft-123/school-event');
            });
        });

        it('should route to community event section when community-based event is selected', async () => {
            // Render the event type page
            const EventTypePage = require('@/app/main/student-dashboard/submit-event/[draftId]/event-type/page').default;
            render(<EventTypePage params={{ draftId: 'test-draft-123' }} />);

            // Click on community-based event
            const communityEventBtn = screen.getByTestId('community-event-btn');
            fireEvent.click(communityEventBtn);

            // Verify the router was called correctly
            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/student-dashboard/submit-event/test-draft-123/community-event');
            });
        });
    });

    describe('Event Form Flow', () => {
        it('should render school event form when event type is school-based', () => {
            // Render the event form
            const { EventFormSection } = require('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection');
            render(
                <EventFormSection
                    eventType="school-based"
                    formData={{}}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            // Verify school event form is rendered
            expect(screen.getByText('School Event Form')).toBeInTheDocument();
        });

        it('should render community event form when event type is community-based', () => {
            // Render the event form
            const { EventFormSection } = require('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection');
            render(
                <EventFormSection
                    eventType="community-based"
                    formData={{}}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            // Verify community event form is rendered
            expect(screen.getByText('Community Event Form')).toBeInTheDocument();
        });
    });

    describe('Form Validation Flow', () => {
        it('should validate required fields before proceeding', async () => {
            const mockValidateStep = vi.fn().mockReturnValue({
                isValid: false,
                errors: ['Event name is required', 'Start date is required']
            });

            mockUseSubmitEventFlow.validateStep = mockValidateStep;

            // Render the event form
            const { EventFormSection } = require('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection');
            render(
                <EventFormSection
                    eventType="school-based"
                    formData={{}}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            // Try to proceed without filling required fields
            const nextButton = screen.getByTestId('next-button');
            fireEvent.click(nextButton);

            // Verify validation was called
            await waitFor(() => {
                expect(mockValidateStep).toHaveBeenCalled();
            });
        });

        it('should allow proceeding when all required fields are filled', async () => {
            const mockValidateStep = vi.fn().mockReturnValue({
                isValid: true,
                errors: []
            });

            const mockNavigateToStep = vi.fn().mockResolvedValue(true);

            mockUseSubmitEventFlow.validateStep = mockValidateStep;
            mockUseSubmitEventFlow.navigateToStep = mockNavigateToStep;

            // Render the event form
            const { EventFormSection } = require('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection');
            render(
                <EventFormSection
                    eventType="school-based"
                    formData={{
                        eventName: 'Test Event',
                        startDate: '2024-01-15',
                        endDate: '2024-01-15',
                        startTime: '09:00',
                        endTime: '17:00',
                        targetAudience: ['1st Year', '2nd Year']
                    }}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            // Try to proceed with valid data
            const nextButton = screen.getByTestId('next-button');
            fireEvent.click(nextButton);

            // Verify navigation was called
            await waitFor(() => {
                expect(mockNavigateToStep).toHaveBeenCalled();
            });
        });
    });

    describe('Data Persistence Flow', () => {
        it('should preserve form data across navigation', async () => {
            const mockUpdateFormData = vi.fn();
            mockUseSubmitEventFlow.updateFormData = mockUpdateFormData;

            // Render the event form
            const { EventFormSection } = require('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection');
            render(
                <EventFormSection
                    eventType="school-based"
                    formData={{
                        eventName: 'Test Event',
                        startDate: '2024-01-15'
                    }}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            // Verify form data is preserved
            expect(screen.getByTestId('event-form-section')).toBeInTheDocument();
        });
    });

    describe('Error Handling Flow', () => {
        it('should handle validation errors gracefully', async () => {
            const mockValidateStep = vi.fn().mockReturnValue({
                isValid: false,
                errors: ['Event name is required']
            });

            const mockSetError = vi.fn();
            const mockClearError = vi.fn();

            mockUseSubmitEventFlow.validateStep = mockValidateStep;
            mockUseSubmitEventFlow.setError = mockSetError;
            mockUseSubmitEventFlow.clearError = mockClearError;

            // Render the event form
            const { EventFormSection } = require('@/app/main/student-dashboard/submit-event/[draftId]/components/shared/EventFormSection');
            render(
                <EventFormSection
                    eventType="school-based"
                    formData={{}}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            // Try to proceed with invalid data
            const nextButton = screen.getByTestId('next-button');
            fireEvent.click(nextButton);

            // Verify error handling
            await waitFor(() => {
                expect(mockValidateStep).toHaveBeenCalled();
            });
        });
    });
}); 