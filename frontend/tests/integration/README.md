# CEDO Frontend Integration Tests

This directory contains comprehensive integration tests for the CEDO frontend application. These tests verify the complete functionality of the application, including user flows, API interactions, and component integrations.

## 🎯 Test Coverage

### Authentication Flow (`auth-flow.integration.test.jsx`)
- **Sign-In Flow**: Tests user authentication with valid/invalid credentials
- **Sign-Up Flow**: Tests user registration and validation
- **Session Management**: Tests token persistence and refresh
- **Sign-Out Flow**: Tests logout functionality
- **Protected Routes**: Tests route protection and redirects
- **Error Handling**: Tests network errors and server errors

### Dashboard Flow (`dashboard-flow.integration.test.jsx`)
- **Dashboard Initialization**: Tests data loading and display
- **Navigation Flow**: Tests navigation between sections
- **Proposals Management**: Tests proposal listing, filtering, and creation
- **Profile Management**: Tests profile display and updates
- **Notifications Management**: Tests notification display and marking as read
- **Sidebar Navigation**: Tests mobile responsiveness and navigation
- **Data Synchronization**: Tests data refresh and concurrent updates
- **Error Boundaries**: Tests error handling in components

### Event Submission Flow (`event-submission.integration.test.jsx`)
- **Event Type Selection**: Tests event type selection and validation
- **Event Overview Form**: Tests form validation and data persistence
- **Organization Information Form**: Tests organization details and validation
- **School Event Details Form**: Tests school event specifics and validation
- **Reporting Requirements Form**: Tests reporting requirements and validation
- **Event Review and Submission**: Tests review process and final submission
- **Draft Auto-Save**: Tests automatic draft saving
- **Form Validation**: Tests comprehensive form validation
- **Progress Tracking**: Tests completion progress tracking

### API Integration (`api-integration.integration.test.jsx`)
- **Authentication API**: Tests sign-in, sign-up, token refresh
- **Dashboard API**: Tests dashboard data fetching
- **Proposals API**: Tests CRUD operations on proposals
- **Profile API**: Tests profile fetching and updates
- **Notifications API**: Tests notification management
- **File Upload API**: Tests file upload functionality
- **Error Handling**: Tests various HTTP error scenarios
- **Request/Response Interceptors**: Tests API middleware

## 🚀 Running the Tests

### Quick Start
```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Run integration tests with coverage
npm run test:integration:coverage
```

### Individual Test Files
```bash
# Run specific test file
npx vitest run tests/integration/auth-flow.integration.test.jsx

# Run with verbose output
npx vitest run tests/integration/dashboard-flow.integration.test.jsx --reporter=verbose

# Run with coverage
npx vitest run tests/integration/event-submission.integration.test.jsx --coverage
```

### Test Runner Script
```bash
# Run the comprehensive test runner
node tests/integration/run-integration-tests.js

# The runner provides:
# - Detailed progress reporting
# - Retry logic for failed tests
# - Coverage analysis
# - JSON report generation
# - Color-coded output
```

## 📊 Test Reports

### Generated Reports
- **Individual Test Results**: JSON files for each test in `test-results/`
- **Integration Test Report**: `test-results/integration-test-report.json`
- **Coverage Report**: HTML coverage report in `coverage/`

### Report Structure
```json
{
  "timestamp": "2024-01-15T10:00:00Z",
  "summary": {
    "total": 4,
    "passed": 4,
    "failed": 0,
    "successRate": 100.0,
    "duration": 45.23
  },
  "results": [
    {
      "file": "tests/integration/auth-flow.integration.test.jsx",
      "success": true,
      "error": null,
      "output": "..."
    }
  ]
}
```

## 🛠 Test Configuration

### Vitest Configuration
The tests use the main `vitest.config.js` configuration with:
- **Environment**: jsdom for DOM testing
- **Setup**: `vitest.setup.js` for global mocks
- **Aliases**: Path aliases for clean imports
- **Coverage**: v8 coverage provider

### Mock Strategy
- **Next.js Navigation**: Mocked router and navigation hooks
- **API Calls**: Mocked fetch and API functions
- **Authentication**: Mocked auth context and tokens
- **Local Storage**: Mocked browser storage
- **File System**: Mocked file operations

### Test Data
Each test includes realistic test data:
- User profiles and authentication tokens
- Event proposals and form data
- API responses and error scenarios
- Dashboard statistics and notifications

## 🔧 Test Development

### Adding New Tests
1. Create a new test file in the `tests/integration/` directory
2. Follow the naming convention: `{feature}.integration.test.jsx`
3. Import necessary testing utilities and mocks
4. Write comprehensive test cases covering:
   - Happy path scenarios
   - Error conditions
   - Edge cases
   - User interactions

### Test Structure
```javascript
describe('Feature Integration', () => {
  let mockApi;
  let mockRouter;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  describe('User Flow', () => {
    it('should handle successful scenario', async () => {
      // Test implementation
    });

    it('should handle error scenario', async () => {
      // Error test implementation
    });
  });
});
```

### Best Practices
- **Isolation**: Each test should be independent
- **Realism**: Use realistic data and scenarios
- **Coverage**: Test both success and failure paths
- **Performance**: Keep tests fast and efficient
- **Maintainability**: Use clear, descriptive test names

## 🐛 Troubleshooting

### Common Issues

#### Test Timeout
```bash
# Increase timeout for slow tests
npx vitest run --timeout=60000
```

#### Mock Issues
```javascript
// Ensure mocks are properly reset
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### Environment Issues
```bash
# Check test environment
node tests/integration/run-integration-tests.js --check-env
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=vitest:* npm run test:integration

# Run specific test with debug
npx vitest run tests/integration/auth-flow.integration.test.jsx --reporter=verbose
```

## 📈 Coverage Goals

### Target Coverage
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 85%+
- **Lines**: 80%+

### Coverage Areas
- **Authentication**: 100% of auth flows
- **Dashboard**: 90% of dashboard functionality
- **Event Submission**: 95% of form flows
- **API Integration**: 85% of API interactions

## 🔄 Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  run: |
    cd frontend
    npm run test:integration:coverage
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:integration"
    }
  }
}
```

## 📚 Additional Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)

### Related Files
- `vitest.config.js`: Main test configuration
- `vitest.setup.js`: Global test setup
- `package.json`: Test scripts and dependencies
- `tests/`: Unit tests and other test files

### Support
For issues with integration tests:
1. Check the test logs for specific error messages
2. Verify all dependencies are installed
3. Ensure the development environment is properly configured
4. Review the test configuration and mocks

---

**Note**: These integration tests are designed to run in isolation and should not depend on external services or databases. All external dependencies are mocked to ensure reliable and fast test execution. 