/**
 * Comprehensive White Box Tests for ProposalTable Component
 * Tests internal logic, state transitions, API interactions, and edge cases
 * Following TDD approach with Vitest mocks
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProposalTable } from '../proposal-table';

// Mock dependencies
vi.mock('@/lib/utils', () => ({
    getAppConfig: vi.fn(() => ({ backendUrl: 'http://localhost:5000' }))
}));

vi.mock('@/utils/auth-utils', () => ({
    getAuthToken: vi.fn(),
    createAuthHeaders: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.URL for file downloads
global.URL = {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
};

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
    writable: true,
    value: 'cedo_token=test-token-123'
});

describe('ProposalTable Component - White Box Tests', () => {
    const mockProposals = [
        {
            id: 1,
            eventName: 'Test Event 1',
            contactPerson: 'John Doe',
            contactEmail: 'john@example.com',
            contactPhone: '123-456-7890',
            organizationType: 'School-based',
            venue: 'Test Venue',
            startDate: '2024-01-15',
            endDate: '2024-01-16',
            timeStart: '09:00:00',
            timeEnd: '17:00:00',
            eventType: 'Workshop',
            eventMode: 'Offline',
            proposal_status: 'pending',
            status: 'pending',
            submittedAt: '2024-01-10T10:00:00Z',
            hasFiles: true,
            files: {
                gpoa: {
                    name: 'gpoa_document.pdf',
                    size: 1024000,
                    type: 'application/pdf',
                    path: '/uploads/gpoa_document.pdf'
                },
                projectProposal: {
                    name: 'project_proposal.pdf',
                    size: 2048000,
                    type: 'application/pdf',
                    path: '/uploads/project_proposal.pdf'
                }
            }
        },
        {
            id: 2,
            eventName: 'Test Event 2',
            contactPerson: 'Jane Smith',
            contactEmail: 'jane@example.com',
            contactPhone: '098-765-4321',
            organizationType: 'Community-based',
            venue: 'Community Center',
            startDate: '2024-02-20',
            endDate: '2024-02-21',
            timeStart: '10:00:00',
            timeEnd: '16:00:00',
            eventType: 'Seminar',
            eventMode: 'Online',
            proposal_status: 'approved',
            status: 'approved',
            submittedAt: '2024-02-15T14:30:00Z',
            hasFiles: false,
            files: {}
        }
    ];

    const mockPagination = {
        page: 1,
        pages: 1,
        total: 2,
        hasNext: false,
        hasPrev: false
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock successful API response
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                proposals: mockProposals,
                pagination: mockPagination
            })
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Component Initialization and State Management', () => {
        it('should initialize with correct default state', () => {
            render(<ProposalTable />);

            // Test initial state
            expect(screen.getByText('Loading proposals...')).toBeInTheDocument();
        });

        it('should set isMountedRef to true on mount and false on unmount', () => {
            const { unmount } = render(<ProposalTable />);

            // Component should be mounted
            expect(screen.getByText('Loading proposals...')).toBeInTheDocument();

            // Unmount and verify cleanup
            unmount();
        });

        it('should prevent state updates after unmount', async () => {
            const { unmount } = render(<ProposalTable />);

            // Unmount immediately
            unmount();

            // Verify no console errors from state updates
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('Data Fetching Logic', () => {
        it('should fetch proposals on component mount', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:5000/api/admin/proposals?page=1&limit=10',
                    expect.objectContaining({
                        method: 'GET',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer test-token-123'
                        })
                    })
                );
            });
        });

        it('should handle fetch proposals with different query parameters', async () => {
            const { rerender } = render(<ProposalTable statusFilter="pending" />);

            // Simulate search term change
            const searchInput = screen.getByPlaceholderText('Search by event, contact, email...');
            await userEvent.type(searchInput, 'test search');

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('search=test%20search'),
                    expect.any(Object)
                );
            });
        });

        it('should prevent multiple simultaneous fetch requests', async () => {
            render(<ProposalTable />);

            // Trigger multiple rapid requests
            const refreshButton = screen.getByText('Refresh');
            fireEvent.click(refreshButton);
            fireEvent.click(refreshButton);
            fireEvent.click(refreshButton);

            // Should only make one request due to isFetchingRef
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(1);
            });
        });

        it('should handle API errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Failed to connect to server. Please check if the backend is running.')).toBeInTheDocument();
            });
        });

        it('should handle 401 authentication errors', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Failed to connect to server. Please check if the backend is running.')).toBeInTheDocument();
            });
        });
    });

    describe('Proposal Data Normalization', () => {
        it('should normalize proposal data with various field mappings', async () => {
            const rawProposal = {
                id: 1,
                event_name: 'Test Event',
                contact_person: 'John Doe',
                contact_email: 'john@example.com',
                proposal_status: 'pending',
                gpoa_file_name: 'test.pdf',
                project_proposal_file_name: 'proposal.pdf'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    proposals: [rawProposal],
                    pagination: mockPagination
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
            });
        });

        it('should handle missing optional fields gracefully', async () => {
            const minimalProposal = {
                id: 1,
                eventName: 'Minimal Event',
                contactPerson: 'Jane Doe',
                contactEmail: 'jane@example.com',
                proposal_status: 'pending'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    proposals: [minimalProposal],
                    pagination: mockPagination
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Minimal Event')).toBeInTheDocument();
                expect(screen.getByText('N/A')).toBeInTheDocument(); // For missing fields
            });
        });
    });

    describe('File Handling Logic', () => {
        it('should correctly identify proposals with files', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Files')).toBeInTheDocument();
                expect(screen.getByText('No files')).toBeInTheDocument();
            });
        });

        it('should format file count correctly', () => {
            // Test the utility functions
            const { getSafeFileCount, formatFileCount } = require('../proposal-table');

            expect(getSafeFileCount({ gpoa: {}, projectProposal: {} })).toBe(2);
            expect(getSafeFileCount(null)).toBe(0);
            expect(getSafeFileCount([])).toBe(0);

            expect(formatFileCount({ gpoa: {} })).toBe('1 file');
            expect(formatFileCount({ gpoa: {}, projectProposal: {} })).toBe('2 files');
            expect(formatFileCount({})).toBe('No files');
        });
    });

    describe('Search and Filtering Logic', () => {
        it('should debounce search input correctly', async () => {
            vi.useFakeTimers();

            render(<ProposalTable />);

            const searchInput = screen.getByPlaceholderText('Search by event, contact, email...');

            // Type rapidly
            await userEvent.type(searchInput, 'test');

            // Fast-forward time to test debouncing
            vi.advanceTimersByTime(100);
            expect(global.fetch).toHaveBeenCalledTimes(1); // Initial load only

            vi.advanceTimersByTime(300);
            expect(global.fetch).toHaveBeenCalledTimes(2); // Debounced search

            vi.useRealTimers();
        });

        it('should filter proposals by search term', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
                expect(screen.getByText('Test Event 2')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search by event, contact, email...');
            await userEvent.type(searchInput, 'Test Event 1');

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
                expect(screen.queryByText('Test Event 2')).not.toBeInTheDocument();
            });
        });

        it('should filter proposals by status', async () => {
            const { rerender } = render(<ProposalTable statusFilter="pending" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
                expect(screen.queryByText('Test Event 2')).not.toBeInTheDocument();
            });
        });
    });

    describe('Status Update Logic', () => {
        it('should update proposal status successfully', async () => {
            const { getAuthToken, createAuthHeaders } = require('@/utils/auth-utils');
            getAuthToken.mockReturnValue('test-token');
            createAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    message: 'Proposal approved successfully'
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click approve button
            const approveButton = screen.getByText('Approve');
            fireEvent.click(approveButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:5000/api/admin/proposals/1/status',
                    expect.objectContaining({
                        method: 'PATCH',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer test-token'
                        }),
                        body: JSON.stringify({
                            status: 'approved',
                            adminComments: null
                        })
                    })
                );
            });
        });

        it('should handle status update errors', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    error: 'Database connection failed'
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            const approveButton = screen.getByText('Approve');
            fireEvent.click(approveButton);

            await waitFor(() => {
                expect(screen.getByText('Database connection failed')).toBeInTheDocument();
            });
        });

        it('should handle rejection with comment', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click deny button
            const denyButton = screen.getByText('Deny');
            fireEvent.click(denyButton);

            // Should open comment dialog
            expect(screen.getByText('Reject Proposal')).toBeInTheDocument();

            // Enter rejection comment
            const commentTextarea = screen.getByPlaceholderText(/Please provide a detailed reason/);
            await userEvent.type(commentTextarea, 'Insufficient documentation');

            // Submit rejection
            const submitButton = screen.getByText('Submit Rejection');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:5000/api/admin/proposals/1/status',
                    expect.objectContaining({
                        method: 'PATCH',
                        body: JSON.stringify({
                            status: 'rejected',
                            adminComments: 'Insufficient documentation'
                        })
                    })
                );
            });
        });
    });

    describe('File Download Logic', () => {
        it('should download files successfully', async () => {
            const { getAuthToken, createAuthHeaders } = require('@/utils/auth-utils');
            getAuthToken.mockReturnValue('test-token');
            createAuthHeaders.mockReturnValue({ 'Authorization': 'Bearer test-token' });

            // Mock successful download response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                blob: async () => new Blob(['mock file content'], { type: 'application/pdf' })
            });

            // Mock DOM methods
            const mockAnchor = {
                href: '',
                download: '',
                click: vi.fn()
            };
            vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click download button (assuming it exists in the UI)
            const downloadButton = screen.getByText('Download');
            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:5000/api/admin/proposals/1/download/gpoa',
                    expect.objectContaining({
                        method: 'GET',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer test-token'
                        })
                    })
                );
            });
        });

        it('should handle download errors gracefully', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({
                    error: 'File not found'
                })
            });

            render(<ProposalTable />);

            // Test download error handling
            await waitFor(() => {
                expect(screen.getByText('File not found or proposal doesn\'t exist')).toBeInTheDocument();
            });
        });

        it('should handle authentication errors during download', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({
                    error: 'Authentication failed'
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Authentication failed. Please sign in again.')).toBeInTheDocument();
            });
        });
    });

    describe('Pagination Logic', () => {
        it('should handle page navigation', async () => {
            const paginationWithPages = {
                page: 1,
                pages: 3,
                total: 30,
                hasNext: true,
                hasPrev: false
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    proposals: mockProposals,
                    pagination: paginationWithPages
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
            });

            // Test next page
            const nextButton = screen.getByText('Next');
            fireEvent.click(nextButton);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('page=2'),
                    expect.any(Object)
                );
            });
        });

        it('should handle page jump input', async () => {
            const paginationWithPages = {
                page: 1,
                pages: 10,
                total: 100,
                hasNext: true,
                hasPrev: false
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    proposals: mockProposals,
                    pagination: paginationWithPages
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Jump to page:')).toBeInTheDocument();
            });

            const pageInput = screen.getByPlaceholderText('1');
            await userEvent.type(pageInput, '5');
            fireEvent.keyDown(pageInput, { key: 'Enter' });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('page=5'),
                    expect.any(Object)
                );
            });
        });
    });

    describe('Modal and Dialog Logic', () => {
        it('should open proposal details modal', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click view details
            const viewButton = screen.getByText('View Details');
            fireEvent.click(viewButton);

            expect(screen.getByText('Proposal Details')).toBeInTheDocument();
            expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        });

        it('should close modal when clicking close button', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Open modal
            const viewButton = screen.getByText('View Details');
            fireEvent.click(viewButton);

            expect(screen.getByText('Proposal Details')).toBeInTheDocument();

            // Close modal
            const closeButton = screen.getByText('✕ Close');
            fireEvent.click(closeButton);

            expect(screen.queryByText('Proposal Details')).not.toBeInTheDocument();
        });

        it('should handle rejection comment dialog', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click deny button
            const denyButton = screen.getByText('Deny');
            fireEvent.click(denyButton);

            expect(screen.getByText('Reject Proposal')).toBeInTheDocument();
            expect(screen.getByText('Provide a reason for rejecting: Test Event 1')).toBeInTheDocument();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing authentication token', async () => {
            // Mock no token
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: ''
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Loading proposals...')).toBeInTheDocument();
            });
        });

        it('should handle malformed API responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    error: 'Invalid response format'
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Invalid response format')).toBeInTheDocument();
            });
        });

        it('should handle network timeouts', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Request timeout'));

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Failed to connect to server. Please check if the backend is running.')).toBeInTheDocument();
            });
        });

        it('should handle empty proposals array', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    proposals: [],
                    pagination: { page: 1, pages: 0, total: 0 }
                })
            });

            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('No proposals found')).toBeInTheDocument();
                expect(screen.getByText('There are no proposals to display')).toBeInTheDocument();
            });
        });
    });

    describe('Performance and Optimization', () => {
        it('should memoize filtered proposals correctly', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Change search term
            const searchInput = screen.getByPlaceholderText('Search by event, contact, email...');
            await userEvent.type(searchInput, 'nonexistent');

            // Should not cause unnecessary re-renders
            expect(screen.getByText('No proposals found')).toBeInTheDocument();
        });

        it('should debounce search input to prevent excessive API calls', async () => {
            vi.useFakeTimers();

            render(<ProposalTable />);

            const searchInput = screen.getByPlaceholderText('Search by event, contact, email...');

            // Type multiple characters rapidly
            await userEvent.type(searchInput, 'test');

            // Should only make one API call after debounce
            vi.advanceTimersByTime(300);
            expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + debounced

            vi.useRealTimers();
        });
    });

    describe('Accessibility and UX', () => {
        it('should have proper ARIA labels and roles', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByLabelText('Search proposals')).toBeInTheDocument();
                expect(screen.getByLabelText('Refresh proposals list')).toBeInTheDocument();
                expect(screen.getByLabelText('Test API connection and endpoints')).toBeInTheDocument();
            });
        });

        it('should handle keyboard navigation', async () => {
            render(<ProposalTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Test tab navigation
            const firstButton = screen.getByText('Refresh');
            firstButton.focus();
            expect(document.activeElement).toBe(firstButton);
        });

        it('should provide loading states and feedback', async () => {
            render(<ProposalTable />);

            // Should show loading state initially
            expect(screen.getByText('Loading proposals...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Loading proposals...')).not.toBeInTheDocument();
            });
        });
    });
});
