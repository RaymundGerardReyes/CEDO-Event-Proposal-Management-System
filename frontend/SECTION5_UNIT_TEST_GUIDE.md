# GENERAL UNIT TESTS FOR MODULES

This guide explains how to run unit tests for all modules in your Next.js/React project using Jest.

## Prerequisites
- Node.js and npm installed
- All dependencies installed (`npm install`)
- You are in the `frontend` directory

## Running Unit Tests

### Run All Tests (Recommended)
This will run all Jest tests for all modules:

```powershell
npm test
```

or

```powershell
npx jest
```

### Run a Specific Test File
To run a specific unit test (for example, Section 5 Reporting):

```powershell
npx jest tests/student-dashboard/Section5_Reporting.test.jsx
```

### Run with Coverage Report
To see a coverage summary for all modules:

```powershell
npx jest --coverage
```

### Run in Watch Mode (for development)

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
