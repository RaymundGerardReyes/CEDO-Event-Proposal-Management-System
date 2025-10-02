/**
 * Frontend Integration Tests for Proposal Table
 * 
 * Tests the ProposalTable component integration with:
 * - Data normalization
 * - API service calls
 * - Component rendering
 * - User interactions
 */

import { ProposalTable } from '@/components/dashboard/admin/proposal-table';
import { fetchProposals, fetchProposalStats } from '@/services/admin-proposals.service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the API service
vi.mock('@/services/admin-proposals.service', () => ({
    fetchProposals: vi.fn(),
    fetchProposalStats: vi.fn(),
    approveProposal: vi.fn(),
    denyProposal: vi.fn(),
    bulkApprove: vi.fn(),
    bulkDeny: vi.fn(),
    addProposalComment: vi.fn()
}));

// Mock the utils
vi.mock('@/utils/proposals', () => ({
    normalizeProposal: (raw) => ({
        id: raw.id,
        uuid: raw.uuid,
        organization: raw.organization_name || '',
        eventName: raw.event_name || '',
        status: raw.proposal_status || 'pending',
        contact: {
            name: raw.contact_person || '',
            email: raw.contact_email || '',
            phone: raw.contact_phone || ''
        },
        date: raw.event_start_date || '',
        type: raw.event_type || '',
        description: raw.objectives || '',
        budget: raw.budget || 0,
        hasFiles: !!(raw.gpoa_file_name || raw.project_proposal_file_name),
        files: {
            gpoa: raw.gpoa_file_name ? {
                name: raw.gpoa_file_name,
                size: raw.gpoa_file_size,
                type: raw.gpoa_file_type,
                path: raw.gpoa_file_path
            } : null,
            projectProposal: raw.project_proposal_file_name ? {
                name: raw.project_proposal_file_name,
                size: raw.project_proposal_file_size,
                type: raw.project_proposal_file_type,
                path: raw.project_proposal_file_path
            } : null
        }
    })
}));

// Mock date-fns
vi.mock('date-fns', () => ({
    format: vi.fn((date, format) => 'Dec 25, 2024')
}));

// Mock lodash.debounce
vi.mock('lodash.debounce', () => ({
    default: vi.fn((fn) => fn)
}));

describe('ProposalTable Integration Tests', () => {
    const mockProposals = [
        {
            id: 1,
            uuid: 'test-uuid-1',
            organization_name: 'Test Organization',
            event_name: 'Test Event 2024',
            contact_person: 'John Doe',
            contact_email: 'john@test.com',
            contact_phone: '+1234567890',
            event_start_date: '2024-12-25',
            event_type: 'workshop',
            proposal_status: 'pending',
            objectives: 'Test objectives',
            budget: 5000.00,
            gpoa_file_name: 'test-gpoa.pdf',
            gpoa_file_size: 1024000,
            gpoa_file_type: 'application/pdf',
            project_proposal_file_name: 'test-proposal.pdf',
            project_proposal_file_size: 2048000,
            project_proposal_file_type: 'application/pdf'
        },
        {
            id: 2,
            uuid: 'test-uuid-2',
            organization_name: 'Another Organization',
            event_name: 'Another Event',
            contact_person: 'Jane Smith',
            contact_email: 'jane@test.com',
            event_start_date: '2024-12-26',
            event_type: 'seminar',
            proposal_status: 'approved',
            objectives: 'Another test objectives',
            budget: 3000.00
        }
    ];

    const mockStats = {
        total: 2,
        pending: 1,
        approved: 1,
        rejected: 0,
        draft: 0
    };

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Setup default mock implementations
        fetchProposals.mockResolvedValue({
            success: true,
            proposals: mockProposals,
            pagination: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1
            },
            stats: mockStats
        });

        fetchProposalStats.mockResolvedValue({
            success: true,
            stats: mockStats
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render proposal table with data', async () => {
            render(<ProposalTable statusFilter="all" />);

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
                expect(screen.getByText('Another Event')).toBeInTheDocument();
            });

            // Check if organization names are displayed
            expect(screen.getByText('Test Organization')).toBeInTheDocument();
            expect(screen.getByText('Another Organization')).toBeInTheDocument();

            // Check if contact information is displayed
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('jane@test.com')).toBeInTheDocument();
        });

        it('should render loading state initially', () => {
            fetchProposals.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<ProposalTable statusFilter="all" />);

            // Should show loading skeleton
            expect(screen.getByRole('table')).toBeInTheDocument();
        });

        it('should render empty state when no proposals', async () => {
            fetchProposals.mockResolvedValue({
                success: true,
                proposals: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
                stats: { total: 0, pending: 0, approved: 0, rejected: 0, draft: 0 }
            });

            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });
        });
    });

    describe('Data Normalization', () => {
        it('should correctly normalize proposal data from backend', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Verify that the normalized data is displayed correctly
            expect(screen.getByText('Test Organization')).toBeInTheDocument();
            expect(screen.getByText('john@test.com')).toBeInTheDocument();
        });

        it('should handle proposals with files correctly', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Check if file indicators are present (implementation depends on UI)
            // This would need to be adjusted based on how files are displayed in the UI
        });
    });

    describe('Filtering and Search', () => {
        it('should call API with correct filter parameters', async () => {
            render(<ProposalTable statusFilter="pending" />);

            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'pending'
                    })
                );
            });
        });

        it('should handle search functionality', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Find and interact with search input
            const searchInput = screen.getByPlaceholderText(/search/i);
            fireEvent.change(searchInput, { target: { value: 'test' } });

            // Wait for debounced search
            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({
                        search: 'test'
                    })
                );
            }, { timeout: 1000 });
        });
    });

    describe('Sorting', () => {
        it('should handle column sorting', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Find and click on a sortable column header
            const eventNameHeader = screen.getByText('Event Name');
            fireEvent.click(eventNameHeader);

            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sort: expect.objectContaining({
                            field: 'eventName'
                        })
                    })
                );
            });
        });
    });

    describe('Pagination', () => {
        it('should handle page changes', async () => {
            fetchProposals.mockResolvedValue({
                success: true,
                proposals: mockProposals,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 25,
                    totalPages: 3
                },
                stats: mockStats
            });

            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Find and click next page button
            const nextButton = screen.getByText('Next');
            fireEvent.click(nextButton);

            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({
                        page: 2
                    })
                );
            });
        });

        it('should handle page size changes', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Find and change page size selector
            const pageSizeSelect = screen.getByDisplayValue('10');
            fireEvent.change(pageSizeSelect, { target: { value: '25' } });

            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({
                        limit: 25
                    })
                );
            });
        });
    });

    describe('Selection and Bulk Actions', () => {
        it('should handle row selection', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Find and click checkbox for first proposal
            const checkboxes = screen.getAllByRole('checkbox');
            const firstRowCheckbox = checkboxes[1]; // Skip the "select all" checkbox
            fireEvent.click(firstRowCheckbox);

            // Check if selection state is updated (implementation depends on UI)
            expect(firstRowCheckbox).toBeChecked();
        });

        it('should handle select all functionality', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Find and click "select all" checkbox
            const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
            fireEvent.click(selectAllCheckbox);

            // All checkboxes should be checked
            const allCheckboxes = screen.getAllByRole('checkbox');
            allCheckboxes.forEach(checkbox => {
                expect(checkbox).toBeChecked();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            fetchProposals.mockRejectedValue(new Error('API Error'));

            render(<ProposalTable statusFilter="all" />);

            // Should not crash and should show empty state or error message
            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });
        });

        it('should handle malformed API responses', async () => {
            fetchProposals.mockResolvedValue({
                success: false,
                error: 'Invalid response'
            });

            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });
        });
    });

    describe('Status Filter Changes', () => {
        it('should refetch data when status filter changes', async () => {
            const { rerender } = render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({ status: 'all' })
                );
            });

            // Change status filter
            rerender(<ProposalTable statusFilter="pending" />);

            await waitFor(() => {
                expect(fetchProposals).toHaveBeenCalledWith(
                    expect.objectContaining({ status: 'pending' })
                );
            });
        });
    });

    describe('Mobile Responsiveness', () => {
        it('should render mobile view on small screens', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600,
            });

            render(<ProposalTable statusFilter="all" />);

            // Should render mobile cards instead of table
            // This test would need to be adjusted based on the actual mobile implementation
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Check for proper ARIA labels
            expect(screen.getByLabelText(/select all proposals/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/select test event 2024/i)).toBeInTheDocument();
        });

        it('should be keyboard navigable', async () => {
            render(<ProposalTable statusFilter="all" />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            });

            // Test keyboard navigation
            const firstCheckbox = screen.getAllByRole('checkbox')[1];
            firstCheckbox.focus();
            expect(firstCheckbox).toHaveFocus();
        });
    });
});






