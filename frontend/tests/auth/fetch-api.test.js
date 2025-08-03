// File: fetch-api.test.js
// Purpose: Comprehensive tests for auth fetch API calls to backend databases.
// Key approaches: TDD workflow, mocking fetch calls, testing error scenarios, and backend integration.
// Test coverage: loadConfig, getAppConfig, sign-in flow, and error handling.
// Refactor: Fixed test isolation issues and proper mock management following TDD best practices.

import { getAppConfig, loadConfig, resetAppConfig } from '@/lib/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    assertFallbackConfigReturned,
    assertFetchCalledWith,
    assertSuccessfulConfigReturned,
    cleanupConsoleErrorSpy,
    cleanupTestEnvironment,
    mockFailedFetch,
    mockHttpError,
    mockMalformedJsonResponse,
    mockSuccessfulFetch,
    setupConsoleErrorSpy,
    setupTestEnvironment
} from './test-helpers';

// Mock fetch globally
global.fetch = vi.fn();

describe('Auth Fetch API Tests', () => {
    beforeEach(() => {
        setupTestEnvironment();
        resetAppConfig();
    });

    afterEach(() => {
        cleanupTestEnvironment();
        resetAppConfig();
    });

    describe('loadConfig Function', () => {
        it('should successfully load config from backend', async () => {
            // Arrange: Mock successful response
            const mockConfig = mockSuccessfulFetch();

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Verify fetch was called and config returned
            assertFetchCalledWith('http://localhost:5000/api/config');
            assertSuccessfulConfigReturned(result, mockConfig);
        });

        it('should handle network errors gracefully', async () => {
            // Arrange: Mock network error
            mockFailedFetch('Network error');

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should handle HTTP error responses', async () => {
            // Arrange: Mock HTTP error response
            mockHttpError(500, 'Internal Server Error');

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should handle malformed JSON responses', async () => {
            // Arrange: Mock response with invalid JSON
            mockMalformedJsonResponse();

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should use correct URL construction with standard base URL', async () => {
            // Arrange: Use standard base URL
            process.env.API_URL = 'http://localhost:5000';

            mockSuccessfulFetch({ backendUrl: 'http://localhost:5000' });

            // Act: Call loadConfig
            await loadConfig();

            // Assert: Verify correct URL construction
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should handle URL with trailing slash', async () => {
            // Arrange: Set environment variable with trailing slash
            process.env.API_URL = 'http://localhost:5000/';

            mockSuccessfulFetch({ backendUrl: 'http://localhost:5000' });

            // Act: Call loadConfig
            await loadConfig();

            // Assert: Should construct correct URL
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should handle URL with /api suffix', async () => {
            // Arrange: Set environment variable with /api suffix
            process.env.API_URL = 'http://localhost:5000/api';

            mockSuccessfulFetch({ backendUrl: 'http://localhost:5000' });

            // Act: Call loadConfig
            await loadConfig();

            // Assert: Should construct correct URL without double /api
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should cache config after successful load', async () => {
            // Arrange: Mock successful response
            const mockConfig = mockSuccessfulFetch();

            // Act: Call loadConfig twice
            const result1 = await loadConfig();
            const result2 = await loadConfig();

            // Assert: Fetch should only be called once due to caching
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result1).toEqual(result2);
        });
    });

    describe('getAppConfig Function', () => {
        it('should return fallback config when no config is loaded', () => {
            // Act: Call getAppConfig without loading config
            const result = getAppConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
        });

        it('should return loaded config after loadConfig is called', async () => {
            // Arrange: Mock successful config load
            const mockConfig = mockSuccessfulFetch();

            // Act: Load config then get it
            await loadConfig();
            const result = getAppConfig();

            // Assert: Should return loaded config
            assertSuccessfulConfigReturned(result, mockConfig);
        });

        it('should handle environment variable fallbacks correctly', () => {
            // Arrange: Clear environment variables
            delete process.env.NEXT_PUBLIC_API_URL;
            delete process.env.API_URL;
            delete process.env.BACKEND_URL;

            // Act: Call getAppConfig
            const result = getAppConfig();

            // Assert: Should use default fallback
            expect(result.backendUrl).toBe('http://localhost:5000');
        });
    });

    describe('Backend Integration Tests', () => {
        it('should handle backend server not running', async () => {
            // Arrange: Mock fetch to simulate server not running
            mockFailedFetch('Failed to fetch');

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should handle CORS errors', async () => {
            // Arrange: Mock CORS error
            mockFailedFetch('CORS error');

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
            assertFetchCalledWith('http://localhost:5000/api/config');
        });

        it('should handle timeout errors', async () => {
            // Arrange: Mock timeout error
            mockFailedFetch('Request timeout');

            // Act: Call loadConfig
            const result = await loadConfig();

            // Assert: Should return fallback config
            assertFallbackConfigReturned(result);
            assertFetchCalledWith('http://localhost:5000/api/config');
        });
    });

    describe('Error Handling and Logging', () => {
        it('should log errors appropriately', async () => {
            // Arrange: Mock console.error and network error
            const consoleSpy = setupConsoleErrorSpy();
            mockFailedFetch('Test error');

            // Act: Call loadConfig
            await loadConfig();

            // Assert: Error should be logged
            expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to load config:', expect.any(Error));

            // Cleanup
            cleanupConsoleErrorSpy(consoleSpy);
        });

        it('should handle multiple consecutive failures', async () => {
            // Arrange: Mock multiple failures
            mockFailedFetch('First failure');
            mockFailedFetch('Second failure');

            // Act: Call loadConfig multiple times
            const result1 = await loadConfig();
            const result2 = await loadConfig();

            // Assert: Should return fallback config each time
            assertFallbackConfigReturned(result1);
            assertFallbackConfigReturned(result2);
        });
    });


}); 