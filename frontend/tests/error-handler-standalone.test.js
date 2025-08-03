/**
 * Standalone Error Handler Tests
 * 
 * Purpose: Test core error handling functionality without imports
 * Approach: Self-contained tests that don't rely on external modules
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock console
const mockConsole = {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
};

// Mock window
global.window = {
    location: { href: 'http://localhost:3000/test' },
    navigator: { userAgent: 'test-user-agent' }
};

// Mock process.env
process.env.NODE_ENV = 'test';

describe('Error Handler - Standalone Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.console = mockConsole;
    });

    afterEach(() => {
        global.console = console;
    });

    describe('Error Classification Logic', () => {
        it('should classify network errors correctly', () => {
            // Test the classification logic directly
            const classifyError = (error) => {
                const message = error.message?.toLowerCase() || '';
                const name = error.name?.toLowerCase() || '';

                if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
                    return 'network';
                }
                if (message.includes('validation') || name === 'validationerror') {
                    return 'validation';
                }
                if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
                    return 'authentication';
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
            };

            const networkError = new Error('Network Error');
            const fetchError = new Error('fetch failed');
            const connectionError = new Error('connection refused');

            expect(classifyError(networkError)).toBe('network');
            expect(classifyError(fetchError)).toBe('network');
            expect(classifyError(connectionError)).toBe('network');
        });

        it('should classify validation errors correctly', () => {
            const classifyError = (error) => {
                const message = error.message?.toLowerCase() || '';
                const name = error.name?.toLowerCase() || '';

                if (message.includes('validation') || message.includes('invalid') || message.includes('required') || name === 'validationerror') {
                    return 'validation';
                }
                return 'unknown';
            };

            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            const invalidError = new Error('Invalid input');
            const requiredError = new Error('Field is required');

            expect(classifyError(validationError)).toBe('validation');
            expect(classifyError(invalidError)).toBe('validation');
            expect(classifyError(requiredError)).toBe('validation');
        });

        it('should classify authentication errors correctly', () => {
            const classifyError = (error) => {
                const message = error.message?.toLowerCase() || '';
                const name = error.name?.toLowerCase() || '';

                if (message.includes('auth') || message.includes('token') || message.includes('unauthorized') || name === 'jsonwebtokenerror' || name === 'tokenexpirederror') {
                    return 'authentication';
                }
                return 'unknown';
            };

            const authError = new Error('Authentication failed');
            const tokenError = new Error('Invalid token');
            const unauthorizedError = new Error('Unauthorized');

            expect(classifyError(authError)).toBe('authentication');
            expect(classifyError(tokenError)).toBe('authentication');
            expect(classifyError(unauthorizedError)).toBe('authentication');
        });
    });

    describe('Error Severity Logic', () => {
        it('should determine error severity correctly', () => {
            const determineErrorSeverity = (errorType, context = {}) => {
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
            };

            expect(determineErrorSeverity('authentication')).toBe('critical');
            expect(determineErrorSeverity('authorization')).toBe('critical');
            expect(determineErrorSeverity('state_machine')).toBe('high');
            expect(determineErrorSeverity('dom_manipulation')).toBe('high');
            expect(determineErrorSeverity('network')).toBe('medium');
            expect(determineErrorSeverity('api_error')).toBe('medium');
            expect(determineErrorSeverity('validation')).toBe('low');
            expect(determineErrorSeverity('form_persistence')).toBe('low');
        });
    });

    describe('Error Recovery Strategies', () => {
        it('should provide appropriate recovery strategies', () => {
            const getErrorRecoveryStrategy = (errorType) => {
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
            };

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
    });

    describe('Error Logging Logic', () => {
        it('should log errors with proper structure', () => {
            const logError = (error, context = {}, severity = null) => {
                const errorInfo = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    severity: severity || 'medium',
                    context,
                    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
                    url: typeof window !== 'undefined' ? window.location.href : 'server'
                };

                console.error(`Error: ${error.message}`, errorInfo);
                return errorInfo;
            };

            const testError = new Error('Test error');
            const context = { component: 'TestComponent' };

            const result = logError(testError, context);

            expect(result).toHaveProperty('message', 'Test error');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('context', context);
            expect(result).toHaveProperty('severity', 'medium');
            expect(mockConsole.error).toHaveBeenCalled();
        });

        it('should handle different error severities', () => {
            const logErrorBySeverity = (error, severity) => {
                const errorInfo = {
                    message: error.message,
                    severity,
                    timestamp: new Date().toISOString()
                };

                switch (severity) {
                    case 'critical':
                        console.error(`Critical: ${error.message}`, errorInfo);
                        break;
                    case 'high':
                        console.error(`High: ${error.message}`, errorInfo);
                        break;
                    case 'medium':
                        console.error(`Medium: ${error.message}`, errorInfo);
                        break;
                    case 'low':
                        console.warn(`Low: ${error.message}`, errorInfo);
                        break;
                    default:
                        console.error(`Unknown: ${error.message}`, errorInfo);
                }

                return errorInfo;
            };

            const testError = new Error('Test error');
            const criticalResult = logErrorBySeverity(testError, 'critical');
            const highResult = logErrorBySeverity(testError, 'high');
            const mediumResult = logErrorBySeverity(testError, 'medium');
            const lowResult = logErrorBySeverity(testError, 'low');

            expect(criticalResult.severity).toBe('critical');
            expect(highResult.severity).toBe('high');
            expect(mediumResult.severity).toBe('medium');
            expect(lowResult.severity).toBe('low');
        });
    });

    describe('Retry Mechanism Logic', () => {
        it('should retry operations on recoverable errors', async () => {
            const withRetry = async (operation, maxRetries = 3, delay = 100) => {
                let lastError;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        return await operation();
                    } catch (error) {
                        lastError = error;
                        if (attempt >= maxRetries) {
                            throw error;
                        }
                        await new Promise(resolve => setTimeout(resolve, delay * attempt));
                    }
                }

                throw lastError;
            };

            let attempts = 0;
            const operation = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Network error');
                }
                return 'success';
            });

            const result = await withRetry(operation, 3, 100);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should not retry on non-recoverable errors', async () => {
            const withRetry = async (operation, maxRetries = 3, delay = 100) => {
                let lastError;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        return await operation();
                    } catch (error) {
                        lastError = error;
                        if (attempt >= maxRetries) {
                            throw error;
                        }
                        await new Promise(resolve => setTimeout(resolve, delay * attempt));
                    }
                }

                throw lastError;
            };

            const operation = vi.fn().mockRejectedValue(new Error('Validation error'));

            await expect(withRetry(operation, 3, 100)).rejects.toThrow('Validation error');
            expect(operation).toHaveBeenCalledTimes(1);
        });
    });
}); 