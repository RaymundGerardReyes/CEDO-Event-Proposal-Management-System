/**
 * Simple test file for ReportingMain component
 * Purpose: Basic functionality verification
 * Approach: Minimal mocking to avoid esbuild issues
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Simple mock for the hook
const mockUseReportingData = vi.fn();

// Mock the hook module
vi.mock('../src/app/main/student-dashboard/submit-event/[draftId]/reporting/hooks/useReportingData', () => ({
    useReportingData: mockUseReportingData
}));

// Simple mock for child components
vi.mock('../src/app/main/student-dashboard/submit-event/[draftId]/reporting/components/ErrorDisplay', () => ({
    ErrorDisplay: ({ error }) => <div>Error: {error}</div>
}));

vi.mock('../src/app/main/student-dashboard/submit-event/[draftId]/reporting/components/LoadingSpinner', () => ({
    LoadingSpinner: ({ message }) => <div>Loading: {message}</div>
}));

vi.mock('../src/app/main/student-dashboard/submit-event/[draftId]/reporting/components/LockedDisplay', () => ({
    LockedDisplay: ({ proposalStatus }) => <div>Locked: {proposalStatus}</div>
}));

vi.mock('../src/app/main/student-dashboard/submit-event/[draftId]/reporting/components/ReportingForm', () => ({
    ReportingForm: () => <div>Reporting Form</div>
}));

vi.mock('../src/app/main/student-dashboard/submit-event/[draftId]/reporting/components/SuccessDisplay', () => ({
    SuccessDisplay: ({ submissionDate }) => <div>Success: {submissionDate}</div>
}));

// Import after mocks
import { ReportingMain } from '../src/app/main/student-dashboard/submit-event/[draftId]/reporting/components/ReportingMain';

describe('ReportingMain Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state', () => {
        mockUseReportingData.mockReturnValue({
            isLoading: true,
            formData: {},
            error: null,
            submitSuccess: false
        });

        render(<ReportingMain initialData={{}} />);

        expect(screen.getByText('Loading: Loading...')).toBeInTheDocument();
    });

    it('should render error state', () => {
        mockUseReportingData.mockReturnValue({
            isLoading: false,
            formData: {},
            error: 'Test error',
            submitSuccess: false
        });

        render(<ReportingMain initialData={{}} />);

        expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });

    it('should render success state', () => {
        mockUseReportingData.mockReturnValue({
            isLoading: false,
            formData: { submissionDate: '2025-01-15T10:30:00Z' },
            error: null,
            submitSuccess: true
        });

        render(<ReportingMain initialData={{}} />);

        expect(screen.getByText('Success: 2025-01-15T10:30:00Z')).toBeInTheDocument();
    });

    it('should render locked display for draft proposals', () => {
        mockUseReportingData.mockReturnValue({
            isLoading: false,
            formData: { proposalStatus: 'draft' },
            error: null,
            submitSuccess: false,
            isProposalApproved: false
        });

        render(<ReportingMain initialData={{}} />);

        expect(screen.getByText('Locked: draft')).toBeInTheDocument();
    });

    it('should render reporting form for approved proposals', () => {
        mockUseReportingData.mockReturnValue({
            isLoading: false,
            formData: { proposalStatus: 'approved' },
            error: null,
            submitSuccess: false,
            isProposalApproved: true
        });

        render(<ReportingMain initialData={{}} />);

        expect(screen.getByText('Reporting Form')).toBeInTheDocument();
    });
}); 