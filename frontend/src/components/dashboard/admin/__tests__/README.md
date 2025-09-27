# ProposalTable Component - White Box Testing Documentation

## Overview
This test suite provides comprehensive white-box testing for the `ProposalTable` component, following TDD principles and ensuring 100% code path coverage.

## Test Structure

### 1. Component Initialization and State Management
- **Purpose**: Test component mounting, unmounting, and state initialization
- **Coverage**: `isMountedRef`, `isFetchingRef`, state variables
- **Edge Cases**: Unmounting during async operations, state updates after unmount

### 2. Data Fetching Logic
- **Purpose**: Test API interactions, error handling, and request management
- **Coverage**: `fetchProposals`, `fetchUpdatedProposalDetails`, API error scenarios
- **Edge Cases**: Network failures, authentication errors, malformed responses

### 3. Proposal Data Normalization
- **Purpose**: Test data transformation and field mapping
- **Coverage**: `normalizedProposals`, field mapping logic, missing data handling
- **Edge Cases**: Incomplete data, null values, type mismatches

### 4. File Handling Logic
- **Purpose**: Test file detection, counting, and display logic
- **Coverage**: `getSafeFileCount`, `formatFileCount`, `hasFiles` logic
- **Edge Cases**: Empty files object, null files, different file types

### 5. Search and Filtering Logic
- **Purpose**: Test search functionality and debouncing
- **Coverage**: `debouncedSearchTerm`, `filteredProposals`, search logic
- **Edge Cases**: Rapid typing, empty searches, special characters

### 6. Status Update Logic
- **Purpose**: Test proposal status changes and API interactions
- **Coverage**: `updateProposalStatus`, `handleRejectionWithComment`, optimistic updates
- **Edge Cases**: API failures, validation errors, concurrent updates

### 7. File Download Logic
- **Purpose**: Test file download functionality and error handling
- **Coverage**: `downloadFile`, blob handling, error scenarios
- **Edge Cases**: Missing files, authentication failures, network errors

### 8. Pagination Logic
- **Purpose**: Test page navigation and pagination controls
- **Coverage**: Page navigation, page jumping, pagination state
- **Edge Cases**: Invalid page numbers, edge pages, empty results

### 9. Modal and Dialog Logic
- **Purpose**: Test modal interactions and dialog management
- **Coverage**: `showDetails`, `showCommentDialog`, modal state
- **Edge Cases**: Multiple modals, keyboard navigation, escape handling

### 10. Error Handling and Edge Cases
- **Purpose**: Test error scenarios and edge cases
- **Coverage**: Network errors, API failures, malformed data
- **Edge Cases**: Timeouts, authentication failures, empty responses

### 11. Performance and Optimization
- **Purpose**: Test performance optimizations and memoization
- **Coverage**: `useMemo`, `useCallback`, debouncing
- **Edge Cases**: Rapid state changes, memory leaks, unnecessary re-renders

### 12. Accessibility and UX
- **Purpose**: Test accessibility features and user experience
- **Coverage**: ARIA labels, keyboard navigation, loading states
- **Edge Cases**: Screen reader compatibility, keyboard-only navigation

## Test Data

### Mock Proposals
```javascript
const mockProposals = [
  {
    id: 1,
    eventName: 'Test Event 1',
    contactPerson: 'John Doe',
    contactEmail: 'john@example.com',
    proposal_status: 'pending',
    hasFiles: true,
    files: { gpoa: {}, projectProposal: {} }
  },
  // ... more mock data
];
```

### Mock API Responses
```javascript
const mockApiResponse = {
  success: true,
  proposals: mockProposals,
  pagination: {
    page: 1,
    pages: 1,
    total: 2,
    hasNext: false,
    hasPrev: false
  }
};
```

## Running Tests

### Individual Test Categories
```bash
# Run specific test categories
npm test -- --testNamePattern="Data Fetching Logic"
npm test -- --testNamePattern="File Handling Logic"
npm test -- --testNamePattern="Status Update Logic"
```

### Full Test Suite
```bash
# Run all tests with coverage
npm test -- --coverage
npm test -- --coverage --reporter=verbose
```

### Watch Mode
```bash
# Run tests in watch mode
npm test -- --watch
```

## Test Coverage Goals

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

## Mock Strategy

### API Mocks
- Mock `fetch` globally for all API calls
- Mock authentication utilities
- Mock file download functionality

### DOM Mocks
- Mock `document.createElement` for download links
- Mock `window.URL` for blob handling
- Mock `localStorage` and `sessionStorage`

### Component Mocks
- Mock `useToast` hook
- Mock utility functions
- Mock configuration functions

## Best Practices

### 1. Test Isolation
- Each test is independent
- Clean up after each test
- Mock external dependencies

### 2. Descriptive Test Names
- Use clear, descriptive test names
- Group related tests in describe blocks
- Use consistent naming conventions

### 3. Comprehensive Coverage
- Test happy paths and error paths
- Test edge cases and boundary conditions
- Test user interactions and state changes

### 4. Performance Testing
- Test debouncing behavior
- Test memoization effectiveness
- Test memory usage and cleanup

### 5. Accessibility Testing
- Test keyboard navigation
- Test screen reader compatibility
- Test ARIA attributes

## Debugging Tests

### Common Issues
1. **Async Operations**: Use `waitFor` for async operations
2. **State Updates**: Use `act` for state updates
3. **Event Handling**: Use `fireEvent` or `userEvent`
4. **Mock Cleanup**: Clear mocks between tests

### Debug Commands
```bash
# Run tests with debug output
npm test -- --reporter=verbose --no-coverage

# Run specific test with debug
npm test -- --testNamePattern="specific test" --reporter=verbose
```

## Continuous Integration

### GitHub Actions
```yaml
- name: Run ProposalTable Tests
  run: npm test -- --coverage --reporter=verbose
```

### Pre-commit Hooks
```bash
# Run tests before commit
npm run test:proposal-table
```

## Maintenance

### Adding New Tests
1. Follow existing test structure
2. Add comprehensive test cases
3. Update documentation
4. Ensure coverage goals

### Updating Tests
1. Update when component changes
2. Maintain test coverage
3. Update mock data as needed
4. Review and refactor regularly

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event Testing](https://testing-library.com/docs/user-event/intro/)
