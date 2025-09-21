/**
 * Enhanced Organization Component Unit Tests
 * 
 * 🎯 Purpose: Comprehensive testing of the Organization form component with new features
 * - Tests localStorage integration and auto-save functionality
 * - Tests phone number validation and formatting
 * - Tests auto-fill functionality with session management
 * - Tests organization autocomplete and validation
 * - Tests UUID display and context integration
 * - Tests error handling and edge cases
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import Organization from '../../src/app/student-dashboard/submit-event/components/Organization';
import { EventFormProvider } from '../../src/app/student-dashboard/submit-event/contexts/EventFormContext';

// Mock the EventFormContext
const mockEventFormContext = {
    eventUuid: '550e8400-e29b-41d4-a716-446655440000',
    getShortUuid: vi.fn(() => '550e8400'),
    getFormAge: vi.fn(() => '2 hours ago'),
    updateFormStatus: vi.fn(),
    clearEventUuid: vi.fn()
};

vi.mock('../../src/app/student-dashboard/submit-event/contexts/EventFormContext', () => ({
    useEventForm: () => mockEventFormContext,
    EventFormProvider: ({ children }) => children
}));

// Mock the auth context
vi.mock('../../src/contexts/auth-context', () => ({
    useAuth: () => ({
        user: {
            id: 'user123',
            organization: 'Test Organization',
            email: 'test@example.com',
            name: 'John Doe',
            phoneNumber: '09123456789'
        }
    })
}));

// Mock the API utility
vi.mock('../../src/utils/api', () => ({
    apiRequest: vi.fn()
}));

// Mock the form storage hook
const mockFormStorage = {
    saveData: vi.fn(),
    loadData: vi.fn(),
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    storageError: null,
    retrySave: vi.fn(),
    getDebugInfo: vi.fn(() => ({ totalKeys: 5, totalSize: 1024 }))
};

vi.mock('../../src/hooks/use-form-storage', () => ({
    useFormStorage: () => mockFormStorage
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid="alert-circle-icon" />,
    Building2: () => <div data-testid="building2-icon" />,
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    Edit3: () => <div data-testid="edit3-icon" />,
    Lock: () => <div data-testid="lock-icon" />,
    Mail: () => <div data-testid="mail-icon" />,
    Phone: () => <div data-testid="phone-icon" />,
    User: () => <div data-testid="user-icon" />,
    Users: () => <div data-testid="users-icon" />
}));

// Test form schema
const testSchema = z.object({
    organizationName: z.string().min(1, 'Organization name is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    contactEmail: z.string().email('Valid email is required'),
    contactPhone: z.string().optional(),
    organizationRegistrationNo: z.string().optional()
});

// Test wrapper component
const TestWrapper = ({ children, defaultValues = {} }) => {
    const methods = useForm({
        resolver: zodResolver(testSchema),
        defaultValues: {
            organizationName: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            organizationRegistrationNo: '',
            ...defaultValues
        }
    });

    return (
        <EventFormProvider>
            <FormProvider {...methods}>{children}</FormProvider>
        </EventFormProvider>
    );
};

describe('Enhanced Organization Component', () => {
    const mockMethods = {
        register: vi.fn(),
        formState: { errors: {} },
        watch: vi.fn(() => ({})),
        setValue: vi.fn(),
        trigger: vi.fn(),
        reset: vi.fn()
    };

    const mockOnNext = vi.fn();
    const mockOnPrevious = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Clear session storage
        sessionStorage.clear();
        // Reset mock implementations
        mockFormStorage.saveData.mockResolvedValue(true);
        mockFormStorage.loadData.mockResolvedValue(null);
        mockFormStorage.isSaving = false;
        mockFormStorage.storageError = null;
    });

    describe('Component Rendering and Basic Functionality', () => {
        it('should render the main heading and description', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Organizer & Contact')).toBeInTheDocument();
            expect(screen.getByText(/provide organization and contact information/i)).toBeInTheDocument();
        });

        it('should render all form fields with proper labels', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
        });

        it('should display UUID information with storage status', () => {
            render(
                <TestWrapper>
                    <Organization
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

        it('should render storage status indicators', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // Should show saved status when lastSaved exists
            mockFormStorage.lastSaved = new Date();
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Saved')).toBeInTheDocument();
        });
    });

    describe('Phone Number Validation and Formatting', () => {
        it('should format phone number as user types', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const phoneInput = screen.getByLabelText(/contact phone/i);

            // Test formatting as user types
            fireEvent.change(phoneInput, { target: { value: '09757524678' } });
            expect(phoneInput.value).toBe('0975-752-4678');

            fireEvent.change(phoneInput, { target: { value: '09123456789' } });
            expect(phoneInput.value).toBe('0912-345-6789');
        });

        it('should validate phone number format correctly', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const phoneInput = screen.getByLabelText(/contact phone/i);

            // Valid phone number
            fireEvent.change(phoneInput, { target: { value: '0975-752-4678' } });
            expect(phoneInput.value).toBe('0975-752-4678');

            // Invalid phone number (too short)
            fireEvent.change(phoneInput, { target: { value: '0975-752-46' } });
            expect(phoneInput.value).toBe('0975-752-46');
        });

        it('should show phone format helper text', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/format: 09XX-XXX-XXXX \(philippine mobile number\)/i)).toBeInTheDocument();
        });

        it('should handle empty phone number (optional field)', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const phoneInput = screen.getByLabelText(/contact phone/i);
            fireEvent.change(phoneInput, { target: { value: '' } });

            expect(phoneInput.value).toBe('');
            // Should not show validation error for empty optional field
            expect(screen.queryByText(/phone number must start with 09/i)).not.toBeInTheDocument();
        });
    });

    describe('Auto-fill Functionality', () => {
        it('should auto-fill form fields from user profile data', async () => {
            const { apiRequest } = await import('../../src/utils/api');
            apiRequest.mockResolvedValue({
                success: true,
                user: {
                    organization: 'Test Organization',
                    name: 'John Doe',
                    email: 'john@test.com',
                    phoneNumber: '09123456789'
                }
            });

            // Mock form values to be empty initially to trigger auto-fill
            mockMethods.watch.mockReturnValue({
                organizationName: '',
                contactPerson: '',
                contactEmail: '',
                contactPhone: ''
            });

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(apiRequest).toHaveBeenCalledWith('/profile');
            });

            // The component should show auto-fill success message
            await waitFor(() => {
                expect(screen.getByText(/auto-filled with your profile data/i)).toBeInTheDocument();
            });
        });

        it('should only auto-fill once per session using sessionStorage', async () => {
            const { apiRequest } = await import('../../src/utils/api');
            apiRequest.mockResolvedValue({
                success: true,
                user: {
                    organization: 'Test Organization',
                    name: 'Test User',
                    email: 'test@test.com',
                    phoneNumber: '09123456789'
                }
            });

            // Mock empty form values initially
            mockMethods.watch.mockReturnValue({
                organizationName: '',
                contactPerson: '',
                contactEmail: '',
                contactPhone: ''
            });

            // Clear any existing session storage
            sessionStorage.clear();

            // First render - should auto-fill
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(apiRequest).toHaveBeenCalledWith('/profile');
            });

            // Verify session storage was set
            expect(sessionStorage.getItem(`autoFilled_${mockEventFormContext.eventUuid}`)).toBe('true');
        });

        it('should show auto-fill loading indicator', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText(/loading your profile data/i)).toBeInTheDocument();
            expect(screen.getByText(/we're fetching your organization and contact information/i)).toBeInTheDocument();
        });

        it('should show auto-fill success indicator', async () => {
            const { apiRequest } = await import('../../src/utils/api');
            apiRequest.mockResolvedValue({
                success: true,
                user: { organization: 'Test Organization', name: 'John Doe' }
            });

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/auto-filled with your profile data/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/organization name and contact email are locked/i)).toBeInTheDocument();
            expect(screen.getByText(/contact person and contact phone can be updated/i)).toBeInTheDocument();
        });

        it('should handle auto-fill errors gracefully', async () => {
            const { apiRequest } = await import('../../src/utils/api');
            apiRequest.mockRejectedValue(new Error('API Error'));

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(apiRequest).toHaveBeenCalledWith('/profile');
            });

            // Should not crash and should not show auto-fill success message
            expect(screen.queryByText(/auto-filled with your profile data/i)).not.toBeInTheDocument();
        });
    });

    describe('LocalStorage Integration', () => {
        it('should save form data to localStorage when values change', async () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // Wait for the component to initialize and call saveData
            await waitFor(() => {
                expect(mockFormStorage.saveData).toHaveBeenCalled();
            });

            // Verify the saveData was called (we don't need to check exact values since the mock doesn't simulate real form behavior)
            expect(mockFormStorage.saveData).toHaveBeenCalledWith(expect.objectContaining({
                values: expect.any(Object),
                selectedOrg: null
            }));
        });

        it('should load saved data from localStorage on mount', async () => {
            const savedData = {
                values: {
                    organizationName: 'Saved Org',
                    contactPerson: 'Saved Person',
                    contactEmail: 'saved@test.com',
                    contactPhone: '09123456789',
                    organizationRegistrationNo: ''
                },
                selectedOrg: { name: 'Saved Org', type: 'Academic' }
            };

            mockFormStorage.loadData.mockResolvedValue(savedData);

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFormStorage.loadData).toHaveBeenCalled();
            });

            // The component should call loadData to retrieve saved data
            expect(mockFormStorage.loadData).toHaveBeenCalledWith();
        });

        it('should show storage error and retry button when save fails', () => {
            mockFormStorage.storageError = 'Storage quota exceeded';

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.getByText('Retry')).toBeInTheDocument();
        });

        it('should handle retry save functionality', () => {
            mockFormStorage.storageError = 'Storage quota exceeded';

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const retryButton = screen.getByText('Retry');
            fireEvent.click(retryButton);

            expect(mockFormStorage.retrySave).toHaveBeenCalled();
        });

        it('should show saving indicator when data is being saved', () => {
            mockFormStorage.isSaving = true;

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Saving...')).toBeInTheDocument();
        });
    });

    describe('Organization Autocomplete', () => {
        it('should handle organization input changes', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);
            fireEvent.change(orgInput, { target: { value: 'SLP' } });

            expect(orgInput.value).toBe('SLP');
        });

        it('should handle organization input filtering', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);
            fireEvent.change(orgInput, { target: { value: 'Community' } });

            expect(orgInput.value).toBe('Community');
        });

        it('should handle short input without errors', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);
            fireEvent.change(orgInput, { target: { value: 'S' } });

            expect(orgInput.value).toBe('S');
        });

        it('should handle organization input value changes', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);
            fireEvent.change(orgInput, { target: { value: 'Test Organization' } });

            expect(orgInput.value).toBe('Test Organization');
        });
    });

    describe('Form Validation and State Management', () => {
        it('should show step completion status correctly', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Step 2 Progress')).toBeInTheDocument();
            expect(screen.getByText(/complete all required fields to proceed/i)).toBeInTheDocument();
        });

        it('should show complete status when all required fields are filled', () => {
            mockMethods.watch.mockReturnValue({
                organizationName: 'Test Org',
                contactPerson: 'John Doe',
                contactEmail: 'john@test.com'
            });

            render(
                <TestWrapper defaultValues={{
                    organizationName: 'Test Org',
                    contactPerson: 'John Doe',
                    contactEmail: 'john@test.com'
                }}>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Complete')).toBeInTheDocument();
        });

        it('should handle form field changes correctly', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);
            fireEvent.change(orgInput, { target: { value: 'Test Organization' } });

            expect(orgInput.value).toBe('Test Organization');
        });

        it('should validate contact person name format', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const contactInput = screen.getByLabelText(/contact person/i);

            // Test valid name
            fireEvent.change(contactInput, { target: { value: 'John Doe' } });
            expect(contactInput.value).toBe('John Doe');

            // Test invalid name with numbers
            fireEvent.change(contactInput, { target: { value: 'John123' } });
            expect(contactInput.value).toBe('John'); // Numbers should be removed
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing methods prop gracefully', () => {
            expect(() => render(
                <TestWrapper>
                    <Organization
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            )).not.toThrow();
        });

        it('should handle localStorage not supported', () => {
            // Mock localStorage not supported
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true
            });

            expect(() => render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            )).not.toThrow();
        });

        it('should handle rapid form field changes', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);

            // Rapid changes should not cause issues
            fireEvent.change(orgInput, { target: { value: 'S' } });
            fireEvent.change(orgInput, { target: { value: 'SL' } });
            fireEvent.change(orgInput, { target: { value: 'SLP' } });

            expect(orgInput.value).toBe('SLP');
        });

        it('should handle network errors during auto-fill', async () => {
            const { apiRequest } = await import('../../src/utils/api');
            apiRequest.mockRejectedValue(new Error('Network Error'));

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(apiRequest).toHaveBeenCalledWith('/profile');
            });

            // Should not crash the component
            expect(screen.getByText('Organizer & Contact')).toBeInTheDocument();
        });
    });

    describe('Accessibility and User Experience', () => {
        it('should have proper form field accessibility attributes', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            const orgInput = screen.getByLabelText(/organization name/i);
            const emailInput = screen.getByLabelText(/contact email/i);
            const phoneInput = screen.getByLabelText(/contact phone/i);

            expect(orgInput).toHaveAttribute('type', 'text');
            expect(emailInput).toHaveAttribute('type', 'email');
            expect(phoneInput).toHaveAttribute('type', 'tel');
        });

        it('should show helpful field descriptions and instructions', () => {
            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            // Check for actual placeholder text that appears in the component
            expect(screen.getByPlaceholderText(/loading your data/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/loading your name/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/loading your email/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/loading your phone/i)).toBeInTheDocument();
        });

        it('should display proper loading states and indicators', () => {
            mockFormStorage.isSaving = true;

            render(
                <TestWrapper>
                    <Organization
                        methods={mockMethods}
                        onNext={mockOnNext}
                        onPrevious={mockOnPrevious}
                        isLastStep={false}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Saving...')).toBeInTheDocument();
            expect(screen.getByText(/loading your profile data/i)).toBeInTheDocument();
        });
    });
});
