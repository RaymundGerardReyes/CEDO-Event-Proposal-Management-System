# Windows Jest Testing Guide

## Fixed Issues ✅

1. **Path Separator Problem**: Fixed Jest configuration to handle Windows paths properly
2. **Import Path**: Fixed Section5_Reporting import path in test file
3. **API Mock Structure**: Updated test mocks to match the actual API response structure (`proposal_status` instead of `proposalStatus`)

## How to Run Tests on Windows

### Option 1: Using the provided batch script (Recommended)
```bash
# Run Section5 tests by name
./run-test.bat Section5

# Run Section5 tests by file path
./run-test.bat path

# Run all student-dashboard tests
./run-test.bat all
```

### Option 2: Using npm directly with proper syntax

#### ✅ CORRECT Ways to run tests:
```bash
# By test name pattern (works reliably)
npm test -- --testNamePattern="Section5_Reporting Component"

# By file path with forward slashes
npm test tests/student-dashboard/Section5_Reporting.test.jsx

# By test path pattern  
npm test -- --testPathPattern="tests/student-dashboard/"

# Run with verbose output
npm test -- --testNamePattern="Section5_Reporting Component" --verbose
```

#### ❌ WRONG Ways (Windows path issues):
```bash
# Don't use backslashes - they get stripped
npm test -- tests\student-dashboard\Section5_Reporting.test.jsx

# Don't use relative paths with dots
npm test -- .\tests\student-dashboard\Section5_Reporting.test.jsx
```

## Remaining Test Issues

The tests are now running but some are still failing due to these issues:

### 1. React Component Import Error ⚠️
**Error**: `Element type is invalid: expected a string (for built-in components) or a class/function`

**Cause**: One of the UI components being imported is undefined. Likely issues:
- Missing component export in `@/components/ui/*` files
- Circular dependency
- Component not properly mocked

**Solution**: Check these files for proper exports:
- `src/components/ui/button.jsx`
- `src/components/ui/card.jsx` 
- `src/components/ui/input.jsx`
- `src/components/ui/label.jsx`
- `src/components/ui/textarea.jsx`

### 2. Component Not Rendering Full Form ⚠️
**Issue**: Even with `proposal_status: 'approved'`, the component is not showing the full form fields.

**Possible Causes**:
1. The status check logic in the component is more complex than expected
2. Additional validation preventing form render
3. Missing required props or data

**Debug Steps**:
1. Add more detailed console logs to see what the component is receiving
2. Check the component's approval detection logic
3. Verify all required props are provided in tests

### 3. Mock API Response Structure ⚠️ 
**Status**: Partially Fixed ✅

The API response structure was corrected to use `proposal_status` instead of `proposalStatus`, but the component might expect additional fields.

## Test Structure Improvements ✅

1. **Jest Configuration**: Added explicit `testMatch` patterns to handle Windows paths
2. **Module Mapping**: Proper `@/*` path resolution configured  
3. **Test Organization**: Clear test categorization with descriptive names

## Next Steps

1. **Fix Component Imports**: Verify all UI component exports
2. **Debug Approval Logic**: Add logging to understand why approved status isn't showing the form
3. **Update Mock Structure**: Ensure API mocks match exactly what the component expects
4. **Add Integration Tests**: Test the full component lifecycle with real-like data

## Usage Examples

```bash
# Quick test run for Section5
npm test -- --testNamePattern="Section5_Reporting Component"

# Run with coverage
npm test -- --testNamePattern="Section5_Reporting Component" --coverage

# Run in watch mode for development
npm test -- --testNamePattern="Section5_Reporting Component" --watch

# Run single test case
npm test -- --testNamePattern="should render the loading state"
```

## Performance Tips

- Use `--maxWorkers=50%` for better performance on multi-core systems
- Clear Jest cache if encountering strange issues: `npm test -- --clearCache`
- Use `--silent` to reduce output noise during debugging 