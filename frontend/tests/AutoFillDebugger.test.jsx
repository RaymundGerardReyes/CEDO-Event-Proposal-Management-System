/**
 * Test file for AutoFillDebugger component
 * Purpose: Verify auto-fill functionality works correctly
 * Approach: Test data generation and form interaction
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/main/student-dashboard/submit-event/test-draft/school-event'
    },
    writable: true
});

// Mock the component
import AutoFillDebugger from '../src/app/main/student-dashboard/submit-event/[draftId]/components/AutoFillDebugger';

describe('AutoFillDebugger Component', () => {
    const mockOnFillData = vi.fn();
    const mockOnClearData = vi.fn();
    const mockOnFillAndSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the debug tool with correct title', () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        expect(screen.getByText('🧪 Auto-Fill Debug Tool')).toBeInTheDocument();
        expect(screen.getByText('Automatically populate all form fields for testing')).toBeInTheDocument();
    });

    it('should detect school event form type correctly', () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        expect(screen.getByText('School Event Form')).toBeInTheDocument();
    });

    it('should show community event form type when on community page', () => {
        // Mock the pathname for community event
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/main/student-dashboard/submit-event/test-draft/community-event'
            },
            writable: true
        });

        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        expect(screen.getByText('Community Event Form')).toBeInTheDocument();
    });

    it('should call onFillData when Fill All Fields button is clicked', async () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        const fillButton = screen.getByText('Fill All Fields');
        fireEvent.click(fillButton);

        await waitFor(() => {
            expect(mockOnFillData).toHaveBeenCalledWith(expect.objectContaining({
                schoolEventName: expect.any(String),
                schoolVenue: expect.any(String),
                schoolEventType: expect.any(String)
            }));
        });
    });

    it('should call onClearData when Clear All Fields button is clicked', async () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        const clearButton = screen.getByText('Clear All Fields');
        fireEvent.click(clearButton);

        await waitFor(() => {
            expect(mockOnClearData).toHaveBeenCalled();
        });
    });

    it('should call onFillAndSubmit when Fill & Submit button is clicked', async () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        const submitButton = screen.getByText('Fill & Submit');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnFillAndSubmit).toHaveBeenCalledWith(expect.objectContaining({
                schoolEventName: expect.any(String),
                schoolVenue: expect.any(String),
                schoolEventType: expect.any(String)
            }));
        });
    });

    it('should disable buttons when isSubmitting is true', () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={true}
            />
        );

        const fillButton = screen.getByText('Fill All Fields');
        const clearButton = screen.getByText('Clear All Fields');
        const submitButton = screen.getByText('Fill & Submit');

        expect(fillButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
        expect(submitButton).toBeDisabled();
    });

    it('should show test data preview for school event', () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        expect(screen.getByText('Academic Excellence Competition 2025')).toBeInTheDocument();
        expect(screen.getByText('University Auditorium')).toBeInTheDocument();
        expect(screen.getByText('Academic Competition')).toBeInTheDocument();
        expect(screen.getByText('Offline')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show test data preview for community event', () => {
        // Mock the pathname for community event
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/main/student-dashboard/submit-event/test-draft/community-event'
            },
            writable: true
        });

        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        expect(screen.getByText('Community Leadership Workshop Series')).toBeInTheDocument();
        expect(screen.getByText('Community Center')).toBeInTheDocument();
        expect(screen.getByText('Leadership Training')).toBeInTheDocument();
        expect(screen.getByText('Hybrid')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show usage instructions', () => {
        render(
            <AutoFillDebugger
                onFillData={mockOnFillData}
                onClearData={mockOnClearData}
                onFillAndSubmit={mockOnFillAndSubmit}
                isSubmitting={false}
            />
        );

        expect(screen.getByText('📝 Usage Instructions')).toBeInTheDocument();
        expect(screen.getByText(/Fill All Fields/)).toBeInTheDocument();
        expect(screen.getByText(/Clear All Fields/)).toBeInTheDocument();
        expect(screen.getByText(/Fill & Submit/)).toBeInTheDocument();
        expect(screen.getByText(/File uploads will be simulated/)).toBeInTheDocument();
    });
}); 