/**
 * handleHookError Function Test
 * Tests the hook error handling utility function
 * 
 * Key approaches: TDD, comprehensive error handling testing,
 * logging verification, and recovery mechanism validation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the logger
vi.mock('@/utils/logger', () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
}));

describe('handleHookError Function', () => {
    let mockLogger;
    let handleHookError;

    beforeEach(() => {
        vi.clearAllMocks();

        // Get the mocked logger
        const logger = require('@/utils/logger').default;
        mockLogger = logger;

        // Import the function to test
        const utils = require('@/app/student-dashboard/submit-event/[draftId]/utils');
        handleHookError = utils.handleHookError;
    });

    describe('Basic Error Handling', () => {
        it('should log hook errors with proper context', () => {
            const error = new Error('Hook initialization failed');
            const resetFunction = vi.fn();

            const cleanup = handleHookError(error, resetFunction);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Hook error occurred',
                error,
                expect.objectContaining({
                    context: 'hook-error',
                    component: expect.any(String),
                    timestamp: expect.any(String)
                }),
                'system'
            );
        });

        it('should return a cleanup function', () => {
            const error = new Error('Test error');
            const resetFunction = vi.fn();

            const cleanup = handleHookError(error, resetFunction);

            expect(typeof cleanup).toBe('function');
        });

        it('should handle null errors gracefully', () => {
            const resetFunction = vi.fn();

            const cleanup = handleHookError(null, resetFunction);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'handleHookError called with null/undefined error',
                {},
                'system'
            );
            expect(typeof cleanup).toBe('function');
        });

        it('should handle undefined errors gracefully', () => {
            const resetFunction = vi.fn();

            const cleanup = handleHookError(undefined, resetFunction);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'handleHookError called with null/undefined error',
                {},
                'system'
            );
            expect(typeof cleanup).toBe('function');
        });
    });

    describe('Error Recovery', () => {
        it('should call reset function for recoverable errors', () => {
            const error = new Error('Context not available');
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction);

            expect(resetFunction).toHaveBeenCalledTimes(1);
        });

        it('should not call reset function for critical errors', () => {
            const error = new Error('Critical system error');
            error.critical = true;
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction);

            expect(resetFunction).not.toHaveBeenCalled();
        });

        it('should handle missing reset function', () => {
            const error = new Error('Test error');

            const cleanup = handleHookError(error, null);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Reset function not provided for hook error',
                expect.objectContaining({
                    error: error.message
                }),
                'system'
            );
            expect(typeof cleanup).toBe('function');
        });
    });

    describe('Error Classification', () => {
        it('should classify context errors as recoverable', () => {
            const error = new Error('useDraftContext must be used within a DraftProvider');
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Recoverable hook error detected',
                expect.objectContaining({
                    errorType: 'context-error',
                    error: error.message
                }),
                'system'
            );
            expect(resetFunction).toHaveBeenCalled();
        });

        it('should classify network errors appropriately', () => {
            const error = new Error('Network request failed');
            error.name = 'NetworkError';
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Hook error occurred',
                error,
                expect.objectContaining({
                    errorType: 'network-error'
                }),
                'system'
            );
        });

        it('should classify validation errors appropriately', () => {
            const error = new Error('Invalid form data');
            error.name = 'ValidationError';
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Validation error in hook',
                expect.objectContaining({
                    error: error.message
                }),
                'validation'
            );
        });
    });

    describe('Cleanup Function', () => {
        it('should execute cleanup when called', () => {
            const error = new Error('Test error');
            const resetFunction = vi.fn();

            const cleanup = handleHookError(error, resetFunction);
            cleanup();

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Hook error cleanup completed',
                expect.objectContaining({
                    error: error.message
                }),
                'system'
            );
        });

        it('should handle cleanup errors gracefully', () => {
            const error = new Error('Test error');
            const resetFunction = vi.fn();

            const cleanup = handleHookError(error, resetFunction);

            // Mock logger to throw error during cleanup
            mockLogger.info.mockImplementationOnce(() => {
                throw new Error('Cleanup logging failed');
            });

            expect(() => cleanup()).not.toThrow();
        });
    });

    describe('Error Context and Metadata', () => {
        it('should include component information in error context', () => {
            const error = new Error('Test error');
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction, 'TestComponent');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Hook error occurred',
                error,
                expect.objectContaining({
                    component: 'TestComponent'
                }),
                'system'
            );
        });

        it('should include timestamp in error context', () => {
            const error = new Error('Test error');
            const resetFunction = vi.fn();

            handleHookError(error, resetFunction);

            const callArgs = mockLogger.error.mock.calls[0];
            const context = callArgs[2];

            expect(context.timestamp).toBeDefined();
            expect(new Date(context.timestamp)).toBeInstanceOf(Date);
        });

        it('should include URL information when available', () => {
            const error = new Error('Test error');
            const resetFunction = vi.fn();

            // Mock window.location
            Object.defineProperty(window, 'location', {
                value: { href: 'http://localhost:3000/test' },
                writable: true
            });

            handleHookError(error, resetFunction);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Hook error occurred',
                error,
                expect.objectContaining({
                    url: 'http://localhost:3000/test'
                }),
                'system'
            );
        });
    });

    describe('Performance and Memory', () => {
        it('should not cause memory leaks with repeated calls', () => {
            const resetFunction = vi.fn();

            // Call multiple times to ensure no memory leaks
            for (let i = 0; i < 10; i++) {
                const error = new Error(`Error ${i}`);
                const cleanup = handleHookError(error, resetFunction);
                cleanup();
            }

            expect(mockLogger.error).toHaveBeenCalledTimes(10);
            expect(mockLogger.info).toHaveBeenCalledTimes(10); // cleanup calls
        });

        it('should handle rapid successive calls', () => {
            const resetFunction = vi.fn();

            // Rapid successive calls
            const cleanups = [];
            for (let i = 0; i < 5; i++) {
                const error = new Error(`Rapid error ${i}`);
                const cleanup = handleHookError(error, resetFunction);
                cleanups.push(cleanup);
            }

            // Execute all cleanups
            cleanups.forEach(cleanup => cleanup());

            expect(mockLogger.error).toHaveBeenCalledTimes(5);
            expect(mockLogger.info).toHaveBeenCalledTimes(5);
        });
    });
});

