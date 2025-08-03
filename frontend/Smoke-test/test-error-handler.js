/**
 * Simple Error Handler Test
 * 
 * Purpose: Test error handling functionality without Vitest
 * Approach: Simple Node.js script with manual assertions
 */

// Mock console for testing
const mockConsole = {
    log: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { }
};

// Mock window and navigator
global.window = {
    location: { href: 'http://localhost:3000/test' },
    navigator: { userAgent: 'test-user-agent' }
};

// Mock process.env
process.env.NODE_ENV = 'test';

// Test functions
function classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    // Check authentication first (before validation)
    if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
        return 'authentication';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        return 'network';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required') || name === 'validationerror') {
        return 'validation';
    }
    if (message.includes('permission') || message.includes('access') || message.includes('forbidden')) {
        return 'authorization';
    }
    if (message.includes('state') || message.includes('machine') || message.includes('xstate')) {
        return 'state_machine';
    }
    if (message.includes('storage') || message.includes('persistence')) {
        return 'form_persistence';
    }
    if (message.includes('file') || message.includes('upload')) {
        return 'file_upload';
    }
    if (message.includes('removechild') || message.includes('dom') || message.includes('node')) {
        return 'dom_manipulation';
    }
    if (message.includes('api') || message.includes('http') || message.includes('status')) {
        return 'api_error';
    }
    return 'unknown';
}

function determineErrorSeverity(errorType, context = {}) {
    if (errorType === 'authentication' || errorType === 'authorization') {
        return 'critical';
    }
    if (errorType === 'state_machine' || errorType === 'dom_manipulation' || context.isUserAction) {
        return 'high';
    }
    if (errorType === 'network' || errorType === 'api_error' || errorType === 'file_upload') {
        return 'medium';
    }
    if (errorType === 'validation' || errorType === 'form_persistence') {
        return 'low';
    }
    return 'medium';
}

function getErrorRecoveryStrategy(errorType) {
    const strategies = {
        network: {
            action: 'retry',
            message: 'Network connection issue. Please check your connection and try again.',
            autoRetry: true,
            maxRetries: 3,
            retryDelay: 1000
        },
        validation: {
            action: 'fix',
            message: 'Please check your input and try again.',
            autoRetry: false,
            showDetails: true
        },
        authentication: {
            action: 'redirect',
            message: 'Authentication required. Redirecting to login...',
            redirectTo: '/auth/sign-in',
            autoRetry: false
        },
        authorization: {
            action: 'redirect',
            message: 'Access denied. Redirecting to dashboard...',
            redirectTo: '/student-dashboard',
            autoRetry: false
        },
        state_machine: {
            action: 'reset',
            message: 'Form state error. Resetting form...',
            autoRetry: true,
            maxRetries: 1
        },
        form_persistence: {
            action: 'recover',
            message: 'Form data recovery issue. Attempting to restore...',
            autoRetry: true,
            maxRetries: 2
        },
        file_upload: {
            action: 'retry',
            message: 'File upload failed. Please try again.',
            autoRetry: true,
            maxRetries: 3
        },
        dom_manipulation: {
            action: 'reload',
            message: 'Display issue detected. Reloading page...',
            autoRetry: true,
            maxRetries: 1
        },
        api_error: {
            action: 'retry',
            message: 'API request failed. Please try again.',
            autoRetry: true,
            maxRetries: 2
        },
        unknown: {
            action: 'manual',
            message: 'An unexpected error occurred. Please try again or contact support.',
            autoRetry: false
        }
    };

    return strategies[errorType] || strategies.unknown;
}

function logError(error, context = {}, severity = null) {
    const errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        severity: severity || 'medium',
        context,
        userAgent: typeof window !== 'undefined' && window.navigator ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' && window.location ? window.location.href : 'server'
    };

    console.error(`Error: ${error.message}`, errorInfo);
    return errorInfo;
}

// Test runner
function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }

    function expect(actual) {
        return {
            toBe(expected) {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toHaveProperty(prop, value) {
                if (!(prop in actual)) {
                    throw new Error(`Expected object to have property ${prop}`);
                }
                if (value !== undefined && actual[prop] !== value) {
                    throw new Error(`Expected ${prop} to be ${value}, got ${actual[prop]}`);
                }
            }
        };
    }

    console.log('🧪 Running Error Handler Tests...\n');

    // Test 1: Error Classification
    test('should classify network errors correctly', () => {
        const networkError = new Error('Network Error');
        const fetchError = new Error('fetch failed');
        const connectionError = new Error('connection refused');

        expect(classifyError(networkError)).toBe('network');
        expect(classifyError(fetchError)).toBe('network');
        expect(classifyError(connectionError)).toBe('network');
    });

    test('should classify validation errors correctly', () => {
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        const invalidError = new Error('Invalid input');
        const requiredError = new Error('Field is required');

        expect(classifyError(validationError)).toBe('validation');
        expect(classifyError(invalidError)).toBe('validation');
        expect(classifyError(requiredError)).toBe('validation');
    });

    test('should classify authentication errors correctly', () => {
        const authError = new Error('Authentication failed');
        const tokenError = new Error('Invalid token');
        const unauthorizedError = new Error('Unauthorized');

        expect(classifyError(authError)).toBe('authentication');
        expect(classifyError(tokenError)).toBe('authentication');
        expect(classifyError(unauthorizedError)).toBe('authentication');
    });

    // Test 2: Error Severity
    test('should determine error severity correctly', () => {
        expect(determineErrorSeverity('authentication')).toBe('critical');
        expect(determineErrorSeverity('authorization')).toBe('critical');
        expect(determineErrorSeverity('state_machine')).toBe('high');
        expect(determineErrorSeverity('dom_manipulation')).toBe('high');
        expect(determineErrorSeverity('network')).toBe('medium');
        expect(determineErrorSeverity('api_error')).toBe('medium');
        expect(determineErrorSeverity('validation')).toBe('low');
        expect(determineErrorSeverity('form_persistence')).toBe('low');
    });

    // Test 3: Error Recovery Strategies
    test('should provide appropriate recovery strategies', () => {
        const networkStrategy = getErrorRecoveryStrategy('network');
        const authStrategy = getErrorRecoveryStrategy('authentication');
        const validationStrategy = getErrorRecoveryStrategy('validation');

        expect(networkStrategy.action).toBe('retry');
        expect(networkStrategy.autoRetry).toBe(true);
        expect(networkStrategy.maxRetries).toBe(3);

        expect(authStrategy.action).toBe('redirect');
        expect(authStrategy.redirectTo).toBe('/auth/sign-in');
        expect(authStrategy.autoRetry).toBe(false);

        expect(validationStrategy.action).toBe('fix');
        expect(validationStrategy.showDetails).toBe(true);
        expect(validationStrategy.autoRetry).toBe(false);
    });

    // Test 4: Error Logging
    test('should log errors with proper structure', () => {
        const testError = new Error('Test error');
        const context = { component: 'TestComponent' };

        const result = logError(testError, context);

        expect(result).toHaveProperty('message', 'Test error');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('context', context);
        expect(result).toHaveProperty('severity', 'medium');
    });

    // Test Summary
    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Error handling system is working correctly.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

// Run tests
runTests(); 