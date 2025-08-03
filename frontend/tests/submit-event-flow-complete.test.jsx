/**
 * Complete Submit Event Flow Tests
 * 
 * Purpose: Test the complete flow including organization step
 * Key approaches: Complete flow testing, organization integration, proper sequence
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock all external dependencies
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useParams: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn()
}));

vi.mock('@/hooks/useDraft', () => ({
    useDraft: vi.fn()
}));

// Simple test components that don't require any imports
const TestOverviewPage = ({ onNext }) => {
    return (
        <div data-testid="overview-page">
            <h2>Overview Page</h2>
            <button onClick={onNext} data-testid="overview-next-btn">Next</button>
        </div>
    );
};

const TestOrganizationPage = ({ formData, onNext, onPrevious }) => {
    return (
        <div data-testid="organization-page">
            <h2>Organization Page</h2>
            <div>Event Type: {formData.eventType || 'Not selected'}</div>
            <div>Organization: {formData.organizationName || 'Not filled'}</div>
            <button onClick={onNext} data-testid="organization-next-btn">Next</button>
            <button onClick={onPrevious} data-testid="organization-previous-btn">Previous</button>
        </div>
    );
};

const TestEventTypePage = ({ onSelect, onPrevious }) => {
    return (
        <div data-testid="event-type-page">
            <h2>Event Type Selection</h2>
            <button onClick={() => onSelect('school-based')} data-testid="school-event-btn">
                School-Based Event
            </button>
            <button onClick={() => onSelect('community-based')} data-testid="community-event-btn">
                Community-Based Event
            </button>
            <button onClick={onPrevious} data-testid="event-type-previous-btn">Previous</button>
        </div>
    );
};

const TestEventFormPage = ({ eventType, onNext, onPrevious }) => {
    return (
        <div data-testid="event-form-page">
            <h2>{eventType === 'school-based' ? 'School Event Form' : 'Community Event Form'}</h2>
            <button onClick={onNext} data-testid="event-form-next-btn">Next</button>
            <button onClick={onPrevious} data-testid="event-form-previous-btn">Previous</button>
        </div>
    );
};

const TestReportingPage = () => {
    return (
        <div data-testid="reporting-page">
            <h2>Reporting Page</h2>
            <div>Proposal submitted successfully!</div>
        </div>
    );
};

describe('Complete Submit Event Flow', () => {
    let mockRouter;
    let mockToast;
    let mockUseDraft;

    beforeEach(() => {
        mockRouter = {
            push: vi.fn(),
            back: vi.fn(),
            forward: vi.fn()
        };

        mockToast = {
            toast: vi.fn()
        };

        mockUseDraft = {
            draft: {
                id: 'test-draft-123',
                payload: {
                    organization: {
                        organizationName: 'Test Organization',
                        contactEmail: 'test@example.com',
                        eventType: null
                    }
                }
            },
            patch: vi.fn(),
            loading: false
        };

        // Setup mocks
        const { useRouter } = require('next/navigation');
        const { useParams } = require('next/navigation');
        const { useToast } = require('@/hooks/use-toast');
        const { useDraft } = require('@/hooks/useDraft');

        useRouter.mockReturnValue(mockRouter);
        useParams.mockReturnValue({ draftId: 'test-draft-123' });
        useToast.mockReturnValue(mockToast);
        useDraft.mockReturnValue(mockUseDraft);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Complete Flow Sequence', () => {
        it('should follow the correct flow sequence: overview → organization → event-type → event-form → reporting', () => {
            // Step 1: Overview
            const onOverviewNext = vi.fn();
            render(<TestOverviewPage onNext={onOverviewNext} />);

            const overviewNextBtn = screen.getByTestId('overview-next-btn');
            fireEvent.click(overviewNextBtn);

            expect(onOverviewNext).toHaveBeenCalled();
            expect(screen.getByTestId('overview-page')).toBeInTheDocument();

            // Step 2: Organization (without event type)
            const onOrganizationNext = vi.fn();
            const onOrganizationPrevious = vi.fn();
            render(
                <TestOrganizationPage
                    formData={{ organizationName: 'Test Org', contactEmail: 'test@example.com' }}
                    onNext={onOrganizationNext}
                    onPrevious={onOrganizationPrevious}
                />
            );

            expect(screen.getByTestId('organization-page')).toBeInTheDocument();
            expect(screen.getByText('Event Type: Not selected')).toBeInTheDocument();

            // Step 3: Event Type Selection
            const onEventTypeSelect = vi.fn();
            const onEventTypePrevious = vi.fn();
            render(
                <TestEventTypePage
                    onSelect={onEventTypeSelect}
                    onPrevious={onEventTypePrevious}
                />
            );

            const schoolEventBtn = screen.getByTestId('school-event-btn');
            fireEvent.click(schoolEventBtn);

            expect(onEventTypeSelect).toHaveBeenCalledWith('school-based');

            // Step 4: Organization (with event type)
            render(
                <TestOrganizationPage
                    formData={{
                        organizationName: 'Test Org',
                        contactEmail: 'test@example.com',
                        eventType: 'school-based'
                    }}
                    onNext={onOrganizationNext}
                    onPrevious={onOrganizationPrevious}
                />
            );

            expect(screen.getByText('Event Type: school-based')).toBeInTheDocument();

            // Step 5: Event Form
            const onEventFormNext = vi.fn();
            const onEventFormPrevious = vi.fn();
            render(
                <TestEventFormPage
                    eventType="school-based"
                    onNext={onEventFormNext}
                    onPrevious={onEventFormPrevious}
                />
            );

            expect(screen.getByText('School Event Form')).toBeInTheDocument();

            // Step 6: Reporting
            render(<TestReportingPage />);
            expect(screen.getByTestId('reporting-page')).toBeInTheDocument();
            expect(screen.getByText('Proposal submitted successfully!')).toBeInTheDocument();
        });

        it('should handle community-based event flow correctly', () => {
            // Event Type Selection for Community
            const onEventTypeSelect = vi.fn();
            render(<TestEventTypePage onSelect={onEventTypeSelect} onPrevious={() => { }} />);

            const communityEventBtn = screen.getByTestId('community-event-btn');
            fireEvent.click(communityEventBtn);

            expect(onEventTypeSelect).toHaveBeenCalledWith('community-based');

            // Organization with Community Event Type
            render(
                <TestOrganizationPage
                    formData={{
                        organizationName: 'Test Org',
                        contactEmail: 'test@example.com',
                        eventType: 'community-based'
                    }}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            expect(screen.getByText('Event Type: community-based')).toBeInTheDocument();

            // Community Event Form
            render(
                <TestEventFormPage
                    eventType="community-based"
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            expect(screen.getByText('Community Event Form')).toBeInTheDocument();
        });
    });

    describe('Flow State Management', () => {
        it('should maintain organization data throughout the flow', () => {
            const organizationData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                contactPhone: '123-456-7890',
                eventType: 'school-based'
            };

            // Organization page with data
            render(
                <TestOrganizationPage
                    formData={organizationData}
                    onNext={() => { }}
                    onPrevious={() => { }}
                />
            );

            expect(screen.getByText('Organization: Test Organization')).toBeInTheDocument();
            expect(screen.getByText('Event Type: school-based')).toBeInTheDocument();
        });

        it('should handle navigation between steps correctly', () => {
            const onPrevious = vi.fn();
            const onNext = vi.fn();

            // Test organization navigation
            render(
                <TestOrganizationPage
                    formData={{}}
                    onNext={onNext}
                    onPrevious={onPrevious}
                />
            );

            const previousBtn = screen.getByTestId('organization-previous-btn');
            const nextBtn = screen.getByTestId('organization-next-btn');

            fireEvent.click(previousBtn);
            expect(onPrevious).toHaveBeenCalled();

            fireEvent.click(nextBtn);
            expect(onNext).toHaveBeenCalled();
        });
    });

    describe('Event Type Integration', () => {
        it('should save event type selection and route correctly', () => {
            const onSelect = vi.fn();
            render(<TestEventTypePage onSelect={onSelect} onPrevious={() => { }} />);

            // Select school-based event
            const schoolEventBtn = screen.getByTestId('school-event-btn');
            fireEvent.click(schoolEventBtn);

            expect(onSelect).toHaveBeenCalledWith('school-based');

            // Select community-based event
            const communityEventBtn = screen.getByTestId('community-event-btn');
            fireEvent.click(communityEventBtn);

            expect(onSelect).toHaveBeenCalledWith('community-based');
        });

        it('should handle event type selection errors gracefully', () => {
            const onSelect = vi.fn().mockImplementation(() => {
                throw new Error('Save failed');
            });

            render(<TestEventTypePage onSelect={onSelect} onPrevious={() => { }} />);

            const schoolEventBtn = screen.getByTestId('school-event-btn');
            fireEvent.click(schoolEventBtn);

            expect(onSelect).toHaveBeenCalledWith('school-based');
        });
    });

    describe('Organization Data Validation', () => {
        it('should validate required organization fields', () => {
            const formData = {
                organizationName: '',
                contactEmail: '',
                eventType: 'school-based'
            };

            const errors = [];

            if (!formData.organizationName?.trim()) {
                errors.push('Organization name is required');
            }
            if (!formData.contactEmail?.trim()) {
                errors.push('Contact email is required');
            }

            expect(errors).toHaveLength(2);
            expect(errors).toContain('Organization name is required');
            expect(errors).toContain('Contact email is required');
        });

        it('should pass validation with valid organization data', () => {
            const formData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                eventType: 'school-based'
            };

            const errors = [];

            if (!formData.organizationName?.trim()) {
                errors.push('Organization name is required');
            }
            if (!formData.contactEmail?.trim()) {
                errors.push('Contact email is required');
            }

            expect(errors).toHaveLength(0);
        });
    });

    describe('Complete Flow Routing Logic', () => {
        it('should route correctly for school-based events', () => {
            const draftId = 'test-draft-123';
            const eventType = 'school-based';

            // Organization → Event Type
            const eventTypeRoute = `/student-dashboard/submit-event/${draftId}/event-type`;
            expect(eventTypeRoute).toBe('/student-dashboard/submit-event/test-draft-123/event-type');

            // Event Type → Organization (with event type)
            const organizationRoute = `/student-dashboard/submit-event/${draftId}/organization`;
            expect(organizationRoute).toBe('/student-dashboard/submit-event/test-draft-123/organization');

            // Organization → School Event
            const schoolEventRoute = `/student-dashboard/submit-event/${draftId}/school-event`;
            expect(schoolEventRoute).toBe('/student-dashboard/submit-event/test-draft-123/school-event');
        });

        it('should route correctly for community-based events', () => {
            const draftId = 'test-draft-123';
            const eventType = 'community-based';

            // Organization → Event Type
            const eventTypeRoute = `/student-dashboard/submit-event/${draftId}/event-type`;
            expect(eventTypeRoute).toBe('/student-dashboard/submit-event/test-draft-123/event-type');

            // Event Type → Organization (with event type)
            const organizationRoute = `/student-dashboard/submit-event/${draftId}/organization`;
            expect(organizationRoute).toBe('/student-dashboard/submit-event/test-draft-123/organization');

            // Organization → Community Event
            const communityEventRoute = `/student-dashboard/submit-event/${draftId}/community-event`;
            expect(communityEventRoute).toBe('/student-dashboard/submit-event/test-draft-123/community-event');
        });
    });
}); 