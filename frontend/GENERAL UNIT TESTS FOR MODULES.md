# GENERAL UNIT TESTS FOR MODULES

This guide explains how to run unit tests for all modules in your Next.js/React project using Jest.

## Prerequisites
- Node.js and npm installed
- All dependencies installed (`npm install`)
- You are in the `frontend` directory

## Test File Location Example
A typical test file (e.g., Section 5 Reporting) is located at:

```
frontend/tests/student-dashboard/Section5_Reporting.test.jsx
```

## Running Unit Tests

### 1. Run All Tests (Recommended)
This will run all Jest tests for all modules:

```powershell
npm test
```

or

```powershell
npx jest
```

### 2. Run a Specific Test File
To run a specific unit test (e.g., Section 5 Reporting):

```powershell
npx jest tests/student-dashboard/Section5_Reporting.test.jsx
```

or (with npm script, if configured):

```powershell
npm test -- tests/student-dashboard/Section5_Reporting.test.jsx
```

### 3. Run with Coverage Report
To see a coverage summary for all modules:

```powershell
npx jest --coverage
```

### 4. Run in Watch Mode (for development)

```powershell
npx jest --watch
```

## Notes
- If you encounter issues, ensure your Jest config is correct and dependencies are installed.
- For integration tests, use `jest.integration.config.js` as needed:

```powershell
npx jest --config jest.integration.config.js
```

---

**For more details, see your `jest.config.js` and `jest.integration.config.js` files.**
