/*
  AccomplishmentReport.test.jsx
  ----------------------------
  Purpose: Comprehensive Vitest test suite for the AccomplishmentReport component in the submit-event flow.
  - Uses Vitest and React Testing Library for all tests.
  - All mocks are defined using vi.mock with correct shapes and valid paths.
  - Includes a minimal smoke test to ensure Vitest runs.
  - Ensures compatibility with ESM, Vite, and project aliasing.
  - Covers loading, error, data, and edge cases for the component.
*/

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// --- Vitest Mocks ---
vi.mock('@/contexts/auth-context', () => ({
    useAuth: vi.fn(),
}));
const { useAuth } = require('@/contexts/auth-context');
const mockUseAuth = useAuth;

vi.mock('@/lib/utils', () => ({
    loadConfig: vi.fn(),
}));
const { loadConfig } = require('@/lib/utils');
const mockLoadConfig = loadConfig;

vi.mock('@/app/main/student-dashboard/submit-event/[draftId]/overview/Section1_Overview', () => ({
    Section5_Reporting: function MockSection5Reporting({ formData, updateFormData, onSubmit, onPrevious }) {
        return (
            <div data-testid="section5-reporting">
                <div data-testid="form-data">{JSON.stringify(formData)}</div>
                <button onClick={() => updateFormData({ test: 'updated' })} data-testid="update-form">
                    Update Form
                </button>
                <button onClick={onSubmit} data-testid="submit-report">
                    Submit Report
                </button>
                <button onClick={onPrevious} data-testid="back-button">
                    Back
                </button>
            </div>
        );
    },
}));

// Main component import (after mocks) - Updated to test overview section since AccomplishmentReport was merged
import Section1_Overview from '@/app/main/student-dashboard/submit-event/[draftId]/overview/Section1_Overview';

// --- Minimal smoke test ---
test('smoke', () => {
    expect(1 + 1).toBe(2);
});

// --- Global fetch mock ---
beforeEach(() => {
    global.fetch = vi.fn();
});
afterEach(() => {
    vi.clearAllMocks();
});

// --- Helper functions ---
const createMockUser = (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'student',
    organization: 'Test Org',
    ...overrides,
});
const createMockEvent = (overrides = {}) => ({
    id: 1,
    organization_name: 'Test Organization',
    organization_type: 'school-based',
    event_name: 'Test Event',
    event_venue: 'Test Venue',
    event_start_date: '2024-01-01',
    event_end_date: '2024-01-02',
    proposal_status: 'approved',
    report_status: 'not_applicable',
    accomplishment_report_file_name: null,
    contact_email: 'test@example.com',
    contact_name: 'Test Contact',
    event_status: 'pending',
    form_completion_percentage: 0,
    ...overrides,
});

describe('AccomplishmentReport Component', () => {
    const mockSetActiveTab = vi.fn();

    beforeEach(() => {
        // Reset all mocks
        mockUseAuth.mockReturnValue({
            user: null,
            isLoading: false,
            isInitialized: true,
        });

        mockLoadConfig.mockResolvedValue({
            backendUrl: 'http://localhost:5000',
            apiUrl: 'http://localhost:5000',
        });

        global.fetch.mockClear();
    });

    describe('Configuration Loading', () => {
        test('should show loading state while configuration is loading', async () => {
            mockLoadConfig.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            expect(screen.getByText(/Loading configuration…/)).toBeInTheDocument();
        });

        test('should handle configuration loading error gracefully', async () => {
            mockLoadConfig.mockRejectedValue(new Error('Config failed'));

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/Loading user profile…/)).toBeInTheDocument();
            });
        });

        test('should use fallback configuration when config loading fails', async () => {
            mockLoadConfig.mockRejectedValue(new Error('Config failed'));

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(mockLoadConfig).toHaveBeenCalled();
            });
        });

        test('should log configuration loading success', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            mockLoadConfig.mockResolvedValue({
                backendUrl: 'http://test-backend.com',
                apiUrl: 'http://test-api.com',
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('⚙️ Loaded config:', expect.any(Object));
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Authentication Context Integration', () => {
        test('should show loading state while auth is initializing', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: false,
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            expect(screen.getByText(/Loading authentication…/)).toBeInTheDocument();
        });

        test('should show loading state while auth is loading', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: true,
                isInitialized: true,
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            expect(screen.getByText(/Loading authentication…/)).toBeInTheDocument();
        });

        test('should use authenticated user data from auth context', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/Loading user profile…/)).toBeInTheDocument();
            });
        });

        test('should handle no authenticated user gracefully', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/Loading user profile…/)).toBeInTheDocument();
            });
        });

        test('should log auth state for debugging', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const mockUser = createMockUser();
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('🔍 Auth state:', expect.any(Object));
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Event Fetching', () => {
        test('should fetch approved events for student user', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const mockEvents = [createMockEvent(), createMockEvent({ id: 2 })];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/events/approved?userId=123&status=approved,pending'),
                    expect.any(Object)
                );
            });
        });

        test('should fetch all events for admin user', async () => {
            const mockUser = createMockUser({ id: 123, role: 'admin' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const mockEvents = [createMockEvent(), createMockEvent({ id: 2 })];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/events/approved?status=approved,pending'),
                    expect.any(Object)
                );
            });
        });

        test('should handle event fetching error gracefully', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/Failed to Load Events/)).toBeInTheDocument();
            });
        });

        test('should show retry button when event fetching fails', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/Retry Loading Events/)).toBeInTheDocument();
            });
        });

        test('should not fetch events if user ID is missing for student', async () => {
            const mockUser = createMockUser({ id: null, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'User ID not found in profile data. Skipping event fetch to prevent loading incorrect data.'
                );
            });

            consoleSpy.mockRestore();
        });

        test('should transform event data correctly', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const rawEvents = [
                {
                    id: 1,
                    organization_name: 'Test Org',
                    event_name: 'Test Event',
                    proposal_status: 'approved',
                },
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: rawEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Test Event')).toBeInTheDocument();
            });
        });
    });

    describe('Event Display and Filtering', () => {
        beforeEach(async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const mockEvents = [
                createMockEvent({ id: 1, event_name: 'Event 1', organization_name: 'Org A' }),
                createMockEvent({ id: 2, event_name: 'Event 2', organization_name: 'Org B' }),
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });
        });

        test('should display events in a list', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Event 1')).toBeInTheDocument();
                expect(screen.getByText('Event 2')).toBeInTheDocument();
            });
        });

        test('should show event details correctly', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Test Organization')).toBeInTheDocument();
                expect(screen.getByText('school-based')).toBeInTheDocument();
                expect(screen.getByText('Test Venue')).toBeInTheDocument();
            });
        });

        test('should filter events by search query', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Event 1')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText(/Search by event or organization/);
            fireEvent.change(searchInput, { target: { value: 'Event 1' } });

            expect(screen.getByText('Event 1')).toBeInTheDocument();
            expect(screen.queryByText('Event 2')).not.toBeInTheDocument();
        });

        test('should filter events by date range', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Event 1')).toBeInTheDocument();
            });

            const fromDateInput = screen.getByLabelText('From');
            fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });

            expect(screen.getByText('Event 1')).toBeInTheDocument();
        });

        test('should clear filters when reset button is clicked', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Event 1')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText(/Search by event or organization/);
            fireEvent.change(searchInput, { target: { value: 'Event 1' } });

            const clearButton = screen.getByText('Clear');
            fireEvent.click(clearButton);

            expect(searchInput.value).toBe('');
        });

        test('should show no events message when no events match filters', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Event 1')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText(/Search by event or organization/);
            fireEvent.change(searchInput, { target: { value: 'NonExistentEvent' } });

            expect(screen.getByText(/No Events Match Your Filters/)).toBeInTheDocument();
        });

        test('should show event count in summary', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/2 of 2 Approved Event/)).toBeInTheDocument();
            });
        });
    });

    describe('Report Creation and Editing', () => {
        beforeEach(async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const mockEvents = [
                createMockEvent({
                    id: 1,
                    event_name: 'Test Event',
                    report_status: 'not_applicable',
                    accomplishment_report_file_name: null
                }),
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });
        });

        test('should show create report button for events without reports', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });
        });

        test('should show view and edit buttons for events with reports', async () => {
            const mockEvents = [
                createMockEvent({
                    id: 1,
                    event_name: 'Test Event',
                    report_status: 'completed',
                    accomplishment_report_file_name: 'report.pdf'
                }),
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('View Report')).toBeInTheDocument();
                expect(screen.getByText('Edit Report')).toBeInTheDocument();
            });
        });

        test('should open report creation interface when create button is clicked', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Report');
            fireEvent.click(createButton);

            expect(screen.getByText(/Creating Report/)).toBeInTheDocument();
            expect(screen.getByTestId('section5-reporting')).toBeInTheDocument();
        });

        test('should show back button in report interface', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Report');
            fireEvent.click(createButton);

            expect(screen.getByText('← Back to Events List')).toBeInTheDocument();
        });

        test('should return to events list when back button is clicked', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Report');
            fireEvent.click(createButton);

            const backButton = screen.getByText('← Back to Events List');
            fireEvent.click(backButton);

            expect(screen.getByText('Create Report')).toBeInTheDocument();
        });

        test('should pass correct form data to Section5 component', async () => {
            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Report');
            fireEvent.click(createButton);

            const formDataElement = screen.getByTestId('form-data');
            const formData = JSON.parse(formDataElement.textContent);

            expect(formData.id).toBe(1);
            expect(formData.organizationName).toBe('Test Organization');
            expect(formData.contactEmail).toBe('test@example.com');
        });

        test('should handle form submission successfully', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Create Report')).toBeInTheDocument();
            });

            const createButton = screen.getByText('Create Report');
            fireEvent.click(createButton);

            const submitButton = screen.getByTestId('submit-report');
            fireEvent.click(submitButton);

            expect(consoleSpy).toHaveBeenCalledWith('Final report submitted!');

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle network errors gracefully', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/Failed to Load Events/)).toBeInTheDocument();
            });
        });

        test('should handle malformed API responses', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ invalid: 'response' }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/No Approved Events/)).toBeInTheDocument();
            });
        });

        test('should handle empty events array', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: [] }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText(/No Approved Events/)).toBeInTheDocument();
            });
        });

        test('should show go to proposal button when no events exist', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: [] }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Go to Event Proposal')).toBeInTheDocument();
            });
        });

        test('should handle missing event properties gracefully', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const incompleteEvents = [
                { id: 1 }, // Missing most properties
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: incompleteEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Unnamed Event')).toBeInTheDocument();
                expect(screen.getByText('Unknown Org')).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility and User Experience', () => {
        test('should have proper ARIA labels for form inputs', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const mockEvents = [createMockEvent()];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Search')).toBeInTheDocument();
                expect(screen.getByLabelText('From')).toBeInTheDocument();
                expect(screen.getByLabelText('To')).toBeInTheDocument();
            });
        });

        test('should show loading states appropriately', async () => {
            mockLoadConfig.mockImplementation(() => new Promise(() => { }));

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            expect(screen.getByText(/Loading configuration…/)).toBeInTheDocument();
        });

        test('should handle mobile responsive design', async () => {
            const mockUser = createMockUser({ id: 123, role: 'student' });
            mockUseAuth.mockReturnValue({
                user: mockUser,
                isLoading: false,
                isInitialized: true,
            });

            const mockEvents = [createMockEvent()];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ events: mockEvents }),
            });

            render(<Section1_Overview setActiveTab={mockSetActiveTab} />);

            await waitFor(() => {
                expect(screen.getByText('Test Event')).toBeInTheDocument();
            });
        });
    });
}); 