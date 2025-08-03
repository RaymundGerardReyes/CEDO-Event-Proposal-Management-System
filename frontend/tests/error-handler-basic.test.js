/**
 * Basic Error Handler Tests
 * 
 * Purpose: Test core error handling functionality
 * Approach: Simple tests without complex dependencies
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

// Import the error handler directly
import {
    classifyError,
    ERROR_SEVERITY,
    ERROR_TYPES,
    handleApiError,
    handleDomError,
    handleError,
    handleNetworkError,
    handleValidationError,
    logError,
    withRetry
} from '../src/utils/error-handler.js';

describe('Error Handler - Basic Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.console = mockConsole;
    });

    afterEach(() => {
        global.console = console;
    });

    describe('Error Types', () => {
        it('should have correct error types', () => {
            expect(ERROR_TYPES.NETWORK).toBe('network');
            expect(ERROR_TYPES.VALIDATION).toBe('validation');
            expect(ERROR_TYPES.AUTHENTICATION).toBe('authentication');
            expect(ERROR_TYPES.AUTHORIZATION).toBe('authorization');
            expect(ERROR_TYPES.STATE_MACHINE).toBe('state_machine');
            expect(ERROR_TYPES.FORM_PERSISTENCE).toBe('form_persistence');
            expect(ERROR_TYPES.FILE_UPLOAD).toBe('file_upload');
            expect(ERROR_TYPES.DOM_MANIPULATION).toBe('dom_manipulation');
            expect(ERROR_TYPES.API_ERROR).toBe('api_error');
            expect(ERROR_TYPES.UNKNOWN).toBe('unknown');
        });

        it('should have correct error severity levels', () => {
            expect(ERROR_SEVERITY.LOW).toBe('low');
            expect(ERROR_SEVERITY.MEDIUM).toBe('medium');
            expect(ERROR_SEVERITY.HIGH).toBe('high');
            expect(ERROR_SEVERITY.CRITICAL).toBe('critical');
        });
    });

    describe('Error Classification', () => {
        it('should classify network errors', () => {
            const networkError = new Error('Network Error');
            const fetchError = new Error('fetch failed');
            const connectionError = new Error('connection refused');

            expect(classifyError(networkError)).toBe(ERROR_TYPES.NETWORK);
            expect(classifyError(fetchError)).toBe(ERROR_TYPES.NETWORK);
            expect(classifyError(connectionError)).toBe(ERROR_TYPES.NETWORK);
        });

        it('should classify validation errors', () => {
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            const invalidError = new Error('Invalid input');
            const requiredError = new Error('Field is required');

            expect(classifyError(validationError)).toBe(ERROR_TYPES.VALIDATION);
            expect(classifyError(invalidError)).toBe(ERROR_TYPES.VALIDATION);
            expect(classifyError(requiredError)).toBe(ERROR_TYPES.VALIDATION);
        });

        it('should classify authentication errors', () => {
            const authError = new Error('Authentication failed');
            const tokenError = new Error('Invalid token');
            const unauthorizedError = new Error('Unauthorized');

            expect(classifyError(authError)).toBe(ERROR_TYPES.AUTHENTICATION);
            expect(classifyError(tokenError)).toBe(ERROR_TYPES.AUTHENTICATION);
            expect(classifyError(unauthorizedError)).toBe(ERROR_TYPES.AUTHENTICATION);
        });

        it('should classify DOM manipulation errors', () => {
            const domError = new Error('removeChild failed');
            const nodeError = new Error('Node not found');
            const notFoundError = new Error('Element not found');
            notFoundError.name = 'NotFoundError';

            expect(classifyError(domError)).toBe(ERROR_TYPES.DOM_MANIPULATION);
            expect(classifyError(nodeError)).toBe(ERROR_TYPES.DOM_MANIPULATION);
            expect(classifyError(notFoundError)).toBe(ERROR_TYPES.DOM_MANIPULATION);
        });

        it('should classify unknown errors', () => {
            const unknownError = new Error('Some random error');
            expect(classifyError(unknownError)).toBe(ERROR_TYPES.UNKNOWN);
        });
    });

    describe('Error Logging', () => {
        it('should log errors with proper structure', () => {
            const testError = new Error('Test error');
            const context = { component: 'TestComponent' };

            const result = logError(testError, context);

            expect(result).toHaveProperty('message', 'Test error');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('severity');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('context', context);
        });

        it('should handle different error severities', () => {
            const criticalError = new Error('Critical system failure');
            const mediumError = new Error('Network timeout');
            const lowError = new Error('Validation warning');

            const criticalResult = logError(criticalError, {}, ERROR_SEVERITY.CRITICAL);
            const mediumResult = logError(mediumError, {}, ERROR_SEVERITY.MEDIUM);
            const lowResult = logError(lowError, {}, ERROR_SEVERITY.LOW);

            expect(criticalResult.severity).toBe(ERROR_SEVERITY.CRITICAL);
            expect(mediumResult.severity).toBe(ERROR_SEVERITY.MEDIUM);
            expect(lowResult.severity).toBe(ERROR_SEVERITY.LOW);
        });
    });

    describe('Error Handling', () => {
        it('should handle errors and return recovery strategy', () => {
            const testError = new Error('Network timeout');
            const context = { component: 'TestComponent' };

            const result = handleError(testError, context);

            expect(result).toHaveProperty('errorInfo');
            expect(result).toHaveProperty('recoveryStrategy');
            expect(result).toHaveProperty('shouldRetry');
            expect(result).toHaveProperty('maxRetries');
            expect(result).toHaveProperty('retryDelay');
        });

        it('should provide appropriate recovery strategies', () => {
            const networkError = new Error('Network error');
            const authError = new Error('Authentication failed');
            const validationError = new Error('Validation failed');

            const networkResult = handleError(networkError);
            const authResult = handleError(authError);
            const validationResult = handleError(validationError);

            expect(networkResult.recoveryStrategy.action).toBe('retry');
            expect(authResult.recoveryStrategy.action).toBe('redirect');
            expect(validationResult.recoveryStrategy.action).toBe('fix');
        });
    });

    describe('Retry Mechanism', () => {
        it('should retry operations on recoverable errors', async () => {
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
            const operation = vi.fn().mockRejectedValue(new Error('Validation error'));

            await expect(withRetry(operation, 3, 100)).rejects.toThrow('Validation error');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should respect max retry limits', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('Network error'));

            await expect(withRetry(operation, 2, 100)).rejects.toThrow('Network error');
            expect(operation).toHaveBeenCalledTimes(2);
        });
    });

    describe('Specialized Error Handlers', () => {
        it('should handle validation errors', () => {
            const result = handleValidationError('email', 'invalid-email', 'Invalid email format', {
                component: 'TestForm'
            });

            expect(result).toHaveProperty('field', 'email');
            expect(result).toHaveProperty('message', 'Invalid email format');
            expect(result).toHaveProperty('severity', ERROR_SEVERITY.LOW);
        });

        it('should handle network errors', () => {
            const networkError = new Error('Network timeout');
            const result = handleNetworkError(networkError, { component: 'TestComponent' });

            expect(result).toHaveProperty('type', ERROR_TYPES.NETWORK);
            expect(result).toHaveProperty('severity', ERROR_SEVERITY.MEDIUM);
            expect(result).toHaveProperty('retryable', true);
        });

        it('should handle DOM errors', () => {
            const domError = new Error('removeChild failed');
            const result = handleDomError(domError, { component: 'TestComponent' });

            expect(result).toHaveProperty('type', ERROR_TYPES.DOM_MANIPULATION);
            expect(result).toHaveProperty('severity', ERROR_SEVERITY.HIGH);
            expect(result).toHaveProperty('retryable', true);
        });

        it('should handle API errors', () => {
            const apiError = new Error('API request failed');
            apiError.response = { status: 500 };
            const result = handleApiError(apiError, { component: 'TestComponent' });

            expect(result).toHaveProperty('type', ERROR_TYPES.API_ERROR);
            expect(result).toHaveProperty('retryable', true);
        });
    });

    describe('Error Recovery Strategies', () => {
        it('should provide retry strategy for network errors', () => {
            const networkError = new Error('Network timeout');
            const result = handleError(networkError);

            expect(result.recoveryStrategy.action).toBe('retry');
            expect(result.recoveryStrategy.autoRetry).toBe(true);
            expect(result.recoveryStrategy.maxRetries).toBe(3);
        });

        it('should provide redirect strategy for authentication errors', () => {
            const authError = new Error('Authentication failed');
            const result = handleError(authError);

            expect(result.recoveryStrategy.action).toBe('redirect');
            expect(result.recoveryStrategy.redirectTo).toBe('/auth/sign-in');
            expect(result.recoveryStrategy.autoRetry).toBe(false);
        });

        it('should provide fix strategy for validation errors', () => {
            const validationError = new Error('Validation failed');
            const result = handleError(validationError);

            expect(result.recoveryStrategy.action).toBe('fix');
            expect(result.recoveryStrategy.showDetails).toBe(true);
            expect(result.recoveryStrategy.autoRetry).toBe(false);
        });
    });
}); 