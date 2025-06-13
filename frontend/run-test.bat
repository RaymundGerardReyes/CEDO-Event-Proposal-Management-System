@echo off
echo Starting Jest tests with proper Windows path handling...

REM Option 1: Run specific test file by name pattern
if "%1"=="Section5" (
    echo Running Section5_Reporting tests...
    npm test -- --testNamePattern="Section5_Reporting Component"
    goto :end
)

REM Option 2: Run specific test file by path (using forward slashes)
if "%1"=="path" (
    echo Running Section5_Reporting tests by file path...
    npm test tests/student-dashboard/Section5_Reporting.test.jsx
    goto :end
)

REM Option 3: Run all tests in student-dashboard directory
if "%1"=="all" (
    echo Running all student-dashboard tests...
    npm test -- --testPathPattern="tests/student-dashboard/"
    goto :end
)

REM Default: Show usage
echo Usage:
echo   run-test.bat Section5     - Run Section5_Reporting tests by name
echo   run-test.bat path         - Run Section5_Reporting tests by file path  
echo   run-test.bat all          - Run all student-dashboard tests
echo.
echo Examples:
echo   run-test.bat Section5
echo   run-test.bat path
echo   run-test.bat all

:end
pause 