#!/usr/bin/env node

/**
 * Debug Test for ProposalTable Component
 * This script helps debug why the ProposalTable is not showing data
 */

console.log('🧪 Testing ProposalTable Debug...');

// Simulate the component props
const testProps = {
    statusFilter: "all",
    proposals: null, // This should trigger internal mode
    selectedIds: [],
    onSelectionChange: () => { },
    onRowClick: () => { },
    onProposalAction: () => { },
    isLoading: false,
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    onPageChange: () => { },
    onPageSizeChange: () => { },
    sortConfig: { field: "submitted_at", direction: "desc" },
    onSortChange: () => { },
    focusedProposalId: null,
};

console.log('📋 Test Props:', testProps);

// Test internal mode detection
const isInternalMode = testProps.proposals === null;
console.log('🔍 Internal Mode Check:', {
    isInternalMode,
    proposalsProvided: testProps.proposals !== null,
    shouldFetchData: isInternalMode
});

// Test API URL construction
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const endpoint = '/admin/proposals';
const queryParams = new URLSearchParams({
    page: 1,
    limit: 10,
    status: 'all',
    sortField: 'submitted_at',
    sortDirection: 'desc'
});

const fullUrl = `${API_BASE_URL}/api${endpoint}?${queryParams.toString()}`;
console.log('🌐 Expected API URL:', fullUrl);

// Test query parameters
console.log('📊 Query Parameters:', {
    page: 1,
    limit: 10,
    status: 'all',
    sortField: 'submitted_at',
    sortDirection: 'desc'
});

console.log('\n✅ Debug test completed!');
console.log('\n💡 Next steps:');
console.log('1. Check browser console for ProposalTable logs');
console.log('2. Verify API calls are being made');
console.log('3. Check network tab for failed requests');
console.log('4. Ensure backend server is running on port 5000');
console.log('5. Verify authentication token is present');

module.exports = { testProps, isInternalMode, fullUrl };






