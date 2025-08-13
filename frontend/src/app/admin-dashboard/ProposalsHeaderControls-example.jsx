import { useCallback, useState } from 'react';
import ProposalsHeaderControls from './ProposalsHeaderControls';

/**
 * Example Parent Component demonstrating how to use ProposalsHeaderControls
 * 
 * This example shows:
 * - How to handle search changes with debouncing
 * - How to implement export functionality
 * - How to manage status filtering
 * - How to integrate with data fetching/filtering logic
 */
export default function ProposalsPageExample() {
    // State management in parent component
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [proposals, setProposals] = useState([
        { id: 1, title: "Science Fair", status: "Pending", organization: "USTP" },
        { id: 2, title: "Community Service", status: "Approved", organization: "XU" },
        { id: 3, title: "Tech Workshop", status: "Rejected", organization: "MSU" }
    ]);

    // Handler for search changes (receives debounced search term)
    const handleSearchChange = useCallback((debouncedSearchTerm) => {
        setSearchTerm(debouncedSearchTerm);
        console.log('🔍 Search term changed:', debouncedSearchTerm);

        // TODO: Implement actual search logic
        // This could trigger:
        // - API call with search parameter
        // - Local filtering of proposals
        // - Update to data fetching hook

        // Example: Filter proposals locally
        if (debouncedSearchTerm) {
            // Filter logic would go here
            console.log('Filtering proposals by:', debouncedSearchTerm);
        }
    }, []);

    // Handler for export functionality
    const handleExport = useCallback(() => {
        console.log('📤 Export triggered');

        // TODO: Implement actual export logic
        // This could involve:
        // - Generating CSV/Excel file
        // - Calling export API endpoint
        // - Downloading filtered data

        // Example implementation:
        const dataToExport = proposals.filter(proposal => {
            const matchesSearch = !searchTerm ||
                proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                proposal.organization.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'All' || proposal.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        console.log('Exporting data:', dataToExport);
        alert(`Would export ${dataToExport.length} proposals`);
    }, [proposals, searchTerm, statusFilter]);

    // Handler for status filter changes
    const handleStatusChange = useCallback((selectedStatus) => {
        setStatusFilter(selectedStatus);
        console.log('📊 Status filter changed:', selectedStatus);

        // TODO: Implement actual filtering logic
        // This could trigger:
        // - API call with status parameter
        // - Local filtering of proposals
        // - Update to data fetching hook

        // Example: Filter proposals locally
        console.log('Filtering proposals by status:', selectedStatus);
    }, []);

    // Example of how filtered data might be calculated
    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = !searchTerm ||
            proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.organization.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || proposal.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6">
            {/* Using the refactored ProposalsHeaderControls component */}
            <ProposalsHeaderControls
                onSearchChange={handleSearchChange}
                onExport={handleExport}
                onStatusChange={handleStatusChange}
                initialSearchTerm={searchTerm}
                initialStatus={statusFilter}
            />

            {/* Display current state for demonstration */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-medium mb-2">Current State:</h4>
                <div className="text-sm space-y-1">
                    <div>Search Term: "{searchTerm}"</div>
                    <div>Status Filter: {statusFilter}</div>
                    <div>Total Proposals: {proposals.length}</div>
                    <div>Filtered Proposals: {filteredProposals.length}</div>
                </div>
            </div>

            {/* Example proposals table */}
            <div className="mt-4">
                <h4 className="font-medium mb-2">Filtered Proposals:</h4>
                <div className="space-y-2">
                    {filteredProposals.map(proposal => (
                        <div key={proposal.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h5 className="font-medium">{proposal.title}</h5>
                                    <p className="text-sm text-gray-600">{proposal.organization}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${proposal.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        proposal.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {proposal.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Key Implementation Notes:
 * 
 * 1. **Debounced Search**: The onSearchChange callback receives the debounced 
 *    search term (300ms delay), preventing excessive API calls or filtering operations.
 * 
 * 2. **Export Functionality**: The onExport callback can be used to trigger 
 *    any export logic - CSV generation, API calls, file downloads, etc.
 * 
 * 3. **Status Filtering**: The onStatusChange callback receives the selected 
 *    status and can be used to filter data or trigger API calls.
 * 
 * 4. **State Management**: The parent component manages the search term and 
 *    status filter state, allowing for complex filtering and data management.
 * 
 * 5. **Initial Values**: The component accepts initialSearchTerm and initialStatus 
 *    props to set default values or restore previous state.
 * 
 * 6. **Accessibility**: The component includes proper ARIA labels, roles, and 
 *    keyboard navigation support.
 */ 