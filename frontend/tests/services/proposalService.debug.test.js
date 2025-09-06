/**
 * Proposal Service Debug Tests
 * Purpose: Test debug functionality with fallback handling
 * Key approaches: Vitest mocks, error handling, fallback scenarios
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockGetToken = vi.fn();
const mockSafeJsonParse = vi.fn();

vi.mock('@/utils/auth-utils', () => ({
    getToken: mockGetToken
}));

vi.mock('@/app/student-dashboard/submit-event/[draftId]/utils', () => ({
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

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true,
        });

        // Mock fetch
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getDebugInfo Function', () => {
        it('should return fallback debug info when no token is available', async () => {
            mockGetToken.mockReturnValue(null);

            const result = await getDebugInfo('test-uuid-123');

            expect(result).toEqual({
                mysql_record: null,
                audit_logs: [],
                debug_logs: [],
                status_match: true,
                fallback: true,
                local_data: null,
                timestamp: expect.any(String),
                message: 'Using fallback debug info - backend endpoint unavailable'
            });
        });

        it('should return fallback debug info when endpoint returns 404', async () => {
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

            const result = await getDebugInfo('test-uuid-123');

            expect(result).toEqual({
                mysql_record: null,
                audit_logs: [],
                debug_logs: [],
                status_match: true,
                fallback: true,
                local_data: null,
                timestamp: expect.any(String),
                message: 'Using fallback debug info - backend endpoint unavailable'
            });

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/proposals/test-uuid-123/debug',
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer mock-token-123'
                    }
                })
            );
        });

        it('should handle successful JSON responses', async () => {
            const successResponse = {
                mysql_record: { id: 1, uuid: 'test-uuid-123' },
                audit_logs: [],
                debug_logs: [],
                status_match: true
            };

            const mockResponse = {
                ok: true,
                status: 200
            };

            global.fetch.mockResolvedValueOnce(mockResponse);
            mockSafeJsonParse.mockResolvedValueOnce(successResponse);

            const result = await getDebugInfo('test-uuid-123');

            expect(result).toEqual(successResponse);
            expect(mockSafeJsonParse).toHaveBeenCalledWith(mockResponse, 'debug-info', { uuid: 'test-uuid-123' });
        });

        it('should handle network errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getDebugInfo('test-uuid-123');

            expect(result).toEqual({
                mysql_record: null,
                audit_logs: [],
                debug_logs: [],
                status_match: true,
                fallback: true,
                local_data: null,
                timestamp: expect.any(String),
                message: 'Using fallback debug info - backend endpoint unavailable'
            });
        });

        it('should handle other HTTP errors with fallback', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            };

            global.fetch.mockResolvedValueOnce(mockResponse);
            mockSafeJsonParse.mockRejectedValueOnce(new Error('Server error'));

            const result = await getDebugInfo('test-uuid-123');

            expect(result).toEqual({
                mysql_record: null,
                audit_logs: [],
                debug_logs: [],
                status_match: true,
                fallback: true,
                local_data: null,
                timestamp: expect.any(String),
                message: 'Using fallback debug info - backend endpoint unavailable'
            });
        });
    });

    describe('addDebugLog Function', () => {
        it('should add local debug log when no token is available', async () => {
            mockGetToken.mockReturnValue(null);

            const result = await addDebugLog('test-uuid-123', 'frontend', 'Test message', { test: true });

            expect(result).toEqual({
                id: expect.any(Number),
                source: 'frontend',
                message: 'Test message',
                meta: { test: true },
                local: true
            });

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'local_debug_logs',
                expect.any(String)
            );
        });

        it('should add local debug log when endpoint returns 404', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found'
            };

            global.fetch.mockResolvedValueOnce(mockResponse);

            const result = await addDebugLog('test-uuid-123', 'frontend', 'Test message');

            expect(result).toEqual({
                id: expect.any(Number),
                source: 'frontend',
                message: 'Test message',
                meta: null,
                local: true
            });

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'local_debug_logs',
                expect.any(String)
            );
        });

        it('should handle successful backend debug log creation', async () => {
            const successResponse = {
                id: 1,
                proposal_uuid: 'test-uuid-123',
                source: 'frontend',
                message: 'Test message',
                meta: { test: true },
                created_at: '2024-01-01T00:00:00.000Z'
            };

            const mockResponse = {
                ok: true,
                status: 201
            };

            global.fetch.mockResolvedValueOnce(mockResponse);
            mockSafeJsonParse.mockResolvedValueOnce(successResponse);

            const result = await addDebugLog('test-uuid-123', 'frontend', 'Test message', { test: true });

            expect(result).toEqual(successResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/proposals/test-uuid-123/debug/logs',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer mock-token-123'
                    },
                    body: JSON.stringify({
                        source: 'frontend',
                        message: 'Test message',
                        meta: { test: true }
                    })
                })
            );
        });

        it('should handle network errors with local fallback', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await addDebugLog('test-uuid-123', 'frontend', 'Test message');

            expect(result).toEqual({
                id: expect.any(Number),
                source: 'frontend',
                message: 'Test message',
                meta: null,
                local: true
            });

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'local_debug_logs',
                expect.any(String)
            );
        });

        it('should limit local debug logs to 50 entries', async () => {
            mockGetToken.mockReturnValue(null);

            // Mock existing logs (51 entries)
            const existingLogs = Array.from({ length: 51 }, (_, i) => ({
                id: i,
                proposal_uuid: 'test-uuid-123',
                source: 'frontend',
                message: `Old message ${i}`,
                created_at: '2024-01-01T00:00:00.000Z',
                local: true
            }));

            window.localStorage.getItem.mockReturnValue(JSON.stringify(existingLogs));

            await addDebugLog('test-uuid-123', 'frontend', 'New message');

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'local_debug_logs',
                expect.any(String)
            );

            const savedLogs = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
            expect(savedLogs).toHaveLength(50);
            expect(savedLogs[49].message).toBe('New message');
        });
    });

    describe('Fallback Debug Info', () => {
        it('should include local data in fallback debug info', async () => {
            mockGetToken.mockReturnValue(null);

            // Mock localStorage data
            window.localStorage.getItem
                .mockReturnValueOnce('test-uuid-123') // proposal_uuid
                .mockReturnValueOnce('pending') // current_proposal_status
                .mockReturnValueOnce('community-event') // current_section
                .mockReturnValueOnce('456') // current_mysql_proposal_id
                .mockReturnValueOnce('2024-01-01T00:00:00.000Z'); // submission_timestamp

            const result = await getDebugInfo('test-uuid-123');

            expect(result.local_data).toEqual({
                uuid: 'test-uuid-123',
                status: 'pending',
                section: 'community-event',
                mysqlId: '456',
                lastUpdated: '2024-01-01T00:00:00.000Z'
            });
        });

        it('should handle localStorage errors gracefully in fallback', async () => {
            mockGetToken.mockReturnValue(null);
            window.localStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            const result = await getDebugInfo('test-uuid-123');

            expect(result).toEqual({
                mysql_record: null,
                audit_logs: [],
                debug_logs: [],
                status_match: false,
                fallback: true,
                error: 'localStorage error',
                timestamp: expect.any(String),
                message: 'Failed to generate fallback debug info'
            });
        });
    });
});
