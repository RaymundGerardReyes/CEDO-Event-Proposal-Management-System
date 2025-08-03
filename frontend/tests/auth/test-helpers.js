// File: test-helpers.js
// Purpose: Test helper functions for auth fetch API tests.
// Key approaches: DRY principle, reusable test utilities, and consistent test patterns.
// Refactor: Extracted common test utilities to improve maintainability.

import { vi } from 'vitest';

// Mock environment variables
const originalEnv = process.env;

/**
 * Setup test environment with default configuration
 */
export function setupTestEnvironment() {
    // Reset mocks and environment
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    // Set up default environment variables
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
    process.env.API_URL = 'http://localhost:5000';
    process.env.BACKEND_URL = 'http://localhost:5000';
}

/**
 * Cleanup test environment
 */
export function cleanupTestEnvironment() {
    // Restore environment
    process.env = originalEnv;
}

/**
 * Create expected fetch options for assertions
 */
export function createExpectedFetchOptions() {
    return {
        signal: expect.any(AbortSignal),
        headers: {
            'Content-Type': 'application/json',
        }
    };
}

/**
 * Create expected fallback config for assertions
 */
export function createExpectedFallbackConfig() {
    return {
        backendUrl: 'http://localhost:5000'
    };
}

/**
 * Mock successful fetch response
 */
export function mockSuccessfulFetch(mockData = {}) {
    const defaultData = {
        recaptchaSiteKey: 'test-site-key',
        timestamp: Date.now(),
        backendUrl: 'http://localhost:5000',
        ...mockData
    };

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => defaultData
    });

    return defaultData;
}

/**
 * Mock failed fetch response
 */
export function mockFailedFetch(errorMessage = 'Network error') {
    global.fetch.mockRejectedValueOnce(new Error(errorMessage));
}

/**
 * Mock HTTP error response
 */
export function mockHttpError(status = 500, statusText = 'Internal Server Error') {
    global.fetch.mockResolvedValueOnce({
        ok: false,
        status,
        statusText
    });
}

/**
 * Mock malformed JSON response
 */
export function mockMalformedJsonResponse() {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
            throw new Error('Invalid JSON');
        }
    });
}

/**
 * Setup console error spy for testing error logging
 */
export function setupConsoleErrorSpy() {
    return vi.spyOn(console, 'error').mockImplementation(() => { });
}

/**
 * Cleanup console error spy
 */
export function cleanupConsoleErrorSpy(consoleSpy) {
    consoleSpy.mockRestore();
}

/**
 * Test different URL construction scenarios
 */
export const URL_TEST_CASES = [
    { base: 'http://localhost:5000', expected: 'http://localhost:5000/api/config' },
    { base: 'http://localhost:5000/', expected: 'http://localhost:5000/api/config' },
    { base: 'http://localhost:5000/api', expected: 'http://localhost:5000/api/config' },
    { base: 'http://localhost:5000/api/', expected: 'http://localhost:5000/api/config' }
];

/**
 * Assert fetch was called with correct parameters
 */
export function assertFetchCalledWith(url, options = createExpectedFetchOptions()) {
    expect(global.fetch).toHaveBeenCalledWith(url, options);
}

/**
 * Assert fallback config was returned
 */
export function assertFallbackConfigReturned(result) {
    expect(result).toEqual(createExpectedFallbackConfig());
}

/**
 * Assert successful config was returned
 */
export function assertSuccessfulConfigReturned(result, expectedConfig) {
    expect(result).toEqual(expectedConfig);
} 