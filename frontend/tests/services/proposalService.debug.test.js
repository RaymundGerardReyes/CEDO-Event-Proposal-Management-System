/**
 * Proposal Service Debug Test
 * Tests the debug info handling with proper HTML response detection
 * 
 * Key approaches: TDD, HTML response handling, JSON parsing safety,
 * error classification, and fallback mechanisms
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Create mock getToken function
const mockGetToken = vi.fn();

// Mock auth utils with a simple mock
vi.mock('@/utils/auth-utils', () => ({
    getToken: mockGetToken
}));

// Create a mock safeJsonParse function
const mockSafeJsonParse = vi.fn();

// Mock the utils module to avoid path alias issues
vi.mock('../../src/app/student-dashboard/submit-event/[draftId]/utils/index.js', () => ({
    safeJsonParse: mockSafeJsonParse
}));

describe('Proposal Service Debug Functions', () => {
    let getDebugInfo;
    let addDebugLog;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Setup mock token
        mockGetToken.mockReturnValue('mock-token-123');

        // Import the functions to test
        const proposalService = await import('../../src/app/student-dashboard/submit-event/[draftId]/reporting/services/proposalService.js');
        getDebugInfo = proposalService.getDebugInfo;
        addDebugLog = proposalService.addDebugLog;
    });

    describe('getDebugInfo Function', () => {
        it('should handle HTML error responses gracefully', async () => {
            const htmlErrorResponse = `
                <!DOCTYPE html>
                <html>
                <head><title>404 Not Found</title></head>
                <body>
                    <h1>404 Not Found</h1>
                    <p>The requested resource was not found.</p>
                </body>
                </html>
            `;

            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: vi.fn().mockRejectedValue(new Error('Unexpected token <')),
                text: vi.fn().mockResolvedValue(htmlErrorResponse)
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to throw an error for HTML responses
            mockSafeJsonParse.mockRejectedValueOnce(new Error('Server returned HTML error page (404 Not Found)'));

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Server returned HTML error page (404 Not Found)');

            // Verify fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                `/api/proposals/${uuid}/debug`,
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer mock-token-123'
                    }
                })
            );

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-info-error', { uuid });
        });

        it('should handle JSON error responses correctly', async () => {
            const jsonErrorResponse = {
                error: 'Proposal not found',
                status: 404
            };

            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found'
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to return the error response
            mockSafeJsonParse.mockResolvedValueOnce(jsonErrorResponse);

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Proposal not found');

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-info-error', { uuid });
        });

        it('should handle successful JSON responses', async () => {
            const successResponse = {
                uuid: 'test-uuid-123',
                status: 'draft',
                debugInfo: {
                    sections: ['overview', 'organization'],
                    lastUpdated: '2024-01-01T00:00:00Z'
                }
            };

            const mockResponse = {
                ok: true,
                status: 200
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to return the success response
            mockSafeJsonParse.mockResolvedValueOnce(successResponse);

            const uuid = 'test-uuid-123';
            const result = await getDebugInfo(uuid);

            expect(result).toEqual(successResponse);

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-info', { uuid });
        });

        it('should handle network errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Network error');
        });

        it('should handle missing authentication token', async () => {
            mockGetToken.mockReturnValue(null);

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Authentication required');
        });

        it('should handle malformed JSON responses', async () => {
            const mockResponse = {
                ok: true,
                status: 200
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to throw an error for malformed JSON
            mockSafeJsonParse.mockRejectedValueOnce(new Error('Server returned malformed response (200 OK)'));

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Server returned malformed response (200 OK)');

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-info', { uuid });
        });
    });

    describe('addDebugLog Function', () => {
        it('should handle HTML error responses gracefully', async () => {
            const htmlErrorResponse = `
                <!DOCTYPE html>
                <html>
                <head><title>500 Internal Server Error</title></head>
                <body>
                    <h1>500 Internal Server Error</h1>
                    <p>Something went wrong on the server.</p>
                </body>
                </html>
            `;

            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: vi.fn().mockRejectedValue(new Error('Unexpected token <')),
                text: vi.fn().mockResolvedValue(htmlErrorResponse)
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to throw an error for HTML responses
            mockSafeJsonParse.mockRejectedValueOnce(new Error('Server returned HTML error page (500 Internal Server Error)'));

            const uuid = 'test-uuid-123';
            const source = 'frontend';
            const message = 'Test debug log';

            await expect(addDebugLog(uuid, source, message)).rejects.toThrow('Server returned HTML error page (500 Internal Server Error)');

            // Verify fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                `/api/proposals/${uuid}/debug/logs`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer mock-token-123'
                    },
                    body: JSON.stringify({ source, message, meta: null })
                })
            );

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-log-error', { uuid, source });
        });

        it('should handle successful debug log creation', async () => {
            const successResponse = {
                id: 'log-123',
                uuid: 'test-uuid-123',
                source: 'frontend',
                message: 'Test debug log',
                timestamp: '2024-01-01T00:00:00Z'
            };

            const mockResponse = {
                ok: true,
                status: 200
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to return the success response
            mockSafeJsonParse.mockResolvedValueOnce(successResponse);

            const uuid = 'test-uuid-123';
            const source = 'frontend';
            const message = 'Test debug log';
            const meta = { test: 'data' };

            const result = await addDebugLog(uuid, source, message, meta);

            expect(result).toEqual(successResponse);

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-log', { uuid, source });
        });

        it('should handle missing authentication token', async () => {
            mockGetToken.mockReturnValue(null);

            const uuid = 'test-uuid-123';
            const source = 'frontend';
            const message = 'Test debug log';

            await expect(addDebugLog(uuid, source, message)).rejects.toThrow('Authentication required');
        });
    });

    describe('Error Response Classification', () => {
        it('should classify HTML responses as parsing errors', async () => {
            const mockResponse = {
                ok: false,
                status: 404
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            // Mock safeJsonParse to throw an error for HTML responses
            mockSafeJsonParse.mockRejectedValueOnce(new Error('Server returned HTML error page (404 Not Found)'));

            const uuid = 'test-uuid-123';

            try {
                await getDebugInfo(uuid);
            } catch (error) {
                expect(error.message).toContain('Server returned HTML error page');
            }

            // Verify safeJsonParse was called
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-info-error', { uuid });
        });

        it('should classify network errors appropriately', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Failed to fetch');
        });

        it('should classify authentication errors appropriately', async () => {
            mockGetToken.mockReturnValue(null);

            const uuid = 'test-uuid-123';

            await expect(getDebugInfo(uuid)).rejects.toThrow('Authentication required');
        });
    });
});
