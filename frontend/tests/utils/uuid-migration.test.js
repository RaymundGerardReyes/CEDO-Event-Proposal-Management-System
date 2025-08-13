/**
 * UUID Migration Utility Tests
 * Tests the refactored UUID migration utility with proper error handling
 * and environment-aware execution
 */

import {
    clearStoredUUID,
    completeUUIDMigration,
    getEventTypeFromDescriptiveId,
    getOrCreateUUID,
    getStoredUUID,
    isDescriptiveDraftId,
    isValidUUID,
    migrateToUUID,
    storeUUID,
    updateURLWithUUID,
    validateAndFixDraftId
} from '@/utils/uuid-migration';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window object for client-side tests
const mockWindow = {
    location: {
        origin: 'http://localhost:3000'
    },
    history: {
        replaceState: vi.fn()
    }
};

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
};

describe('UUID Migration Utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset environment variables
        delete process.env.NEXT_PUBLIC_API_URL;
        delete process.env.API_URL;

        // Mock console methods to reduce noise in tests
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('UUID Validation', () => {
        it('should validate correct UUIDs', () => {
            const validUUIDs = [
                '123e4567-e89b-12d3-a456-426614174000',
                '550e8400-e29b-41d4-a716-446655440000',
                '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
            ];

            validUUIDs.forEach(uuid => {
                expect(isValidUUID(uuid)).toBe(true);
            });
        });

        it('should reject invalid UUIDs', () => {
            const invalidUUIDs = [
                'not-a-uuid',
                '123e4567-e89b-12d3-a456', // too short
                '123e4567-e89b-12d3-a456-426614174000-extra', // too long
                '',
                null,
                undefined
            ];

            invalidUUIDs.forEach(uuid => {
                expect(isValidUUID(uuid)).toBe(false);
            });
        });
    });

    describe('Descriptive Draft ID Detection', () => {
        it('should identify descriptive draft IDs', () => {
            const descriptiveIds = [
                'new-draft',
                'school-event',
                'community-event',
                'event-proposal-123',
                'school-based-event'
            ];

            descriptiveIds.forEach(id => {
                expect(isDescriptiveDraftId(id)).toBe(true);
            });
        });

        it('should reject non-descriptive IDs', () => {
            const nonDescriptiveIds = [
                '123e4567-e89b-12d3-a456-426614174000', // valid UUID
                'random-string',
                '',
                null,
                undefined
            ];

            nonDescriptiveIds.forEach(id => {
                expect(isDescriptiveDraftId(id)).toBe(false);
            });
        });
    });

    describe('Event Type Detection', () => {
        it('should detect school-based events', () => {
            const schoolEvents = [
                'school-event',
                'school-based-event',
                'school-proposal'
            ];

            schoolEvents.forEach(id => {
                expect(getEventTypeFromDescriptiveId(id)).toBe('school-based');
            });
        });

        it('should detect community-based events', () => {
            const communityEvents = [
                'community-event',
                'community-based-event',
                'community-proposal'
            ];

            communityEvents.forEach(id => {
                expect(getEventTypeFromDescriptiveId(id)).toBe('community-based');
            });
        });

        it('should default to school-based for unknown types', () => {
            expect(getEventTypeFromDescriptiveId('new-draft')).toBe('school-based');
            expect(getEventTypeFromDescriptiveId('event-proposal-123')).toBe('school-based');
            expect(getEventTypeFromDescriptiveId('')).toBe('school-based');
            expect(getEventTypeFromDescriptiveId(null)).toBe('school-based');
        });
    });

    describe('Server-Side Execution', () => {
        it('should handle server-side execution gracefully', async () => {
            // Simulate server-side environment
            const originalWindow = global.window;
            delete global.window;

            try {
                const result = await migrateToUUID('new-draft');
                expect(result).toMatch(/^fallback-\d+-\w+$/);
            } finally {
                global.window = originalWindow;
            }
        });

        it('should handle server-side getOrCreateUUID', async () => {
            const originalWindow = global.window;
            delete global.window;

            try {
                const result = await getOrCreateUUID('new-draft');
                expect(result).toMatch(/^fallback-\d+-\w+$/);
            } finally {
                global.window = originalWindow;
            }
        });

        it('should handle server-side completeUUIDMigration', async () => {
            const originalWindow = global.window;
            delete global.window;

            try {
                const result = await completeUUIDMigration('new-draft', '/test-path');
                expect(result).toMatch(/^fallback-\d+-\w+$/);
            } finally {
                global.window = originalWindow;
            }
        });
    });

    describe('Client-Side API Calls', () => {
        beforeEach(() => {
            global.window = mockWindow;
            global.localStorage = mockLocalStorage;
        });

        it('should make successful API calls with proper URL construction', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ draftId: '123e4567-e89b-12d3-a456-426614174000' })
            };

            global.fetch.mockResolvedValue(mockResponse);

            const result = await migrateToUUID('new-draft');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/proposals/drafts',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        eventType: 'school-based',
                        originalDescriptiveId: 'new-draft'
                    })
                })
            );

            expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
        });

        it('should handle API call failures gracefully', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            };

            global.fetch.mockResolvedValue(mockResponse);

            const result = await migrateToUUID('new-draft');

            expect(result).toBeNull();
        });

        it('should handle network errors gracefully', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const result = await migrateToUUID('new-draft');

            expect(result).toBeNull();
        });

        it('should handle timeout errors', async () => {
            global.fetch.mockRejectedValue(new Error('API call timed out'));

            const result = await migrateToUUID('new-draft');

            expect(result).toBeNull();
        });
    });

    describe('LocalStorage Operations', () => {
        beforeEach(() => {
            global.window = mockWindow;
            global.localStorage = mockLocalStorage;
        });

        it('should store UUID in localStorage', () => {
            const uuid = '123e4567-e89b-12d3-a456-426614174000';
            const eventType = 'school-based';

            storeUUID(uuid, eventType);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('current_draft_uuid', uuid);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('current_event_type', eventType);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('draft_created_at', expect.any(String));
        });

        it('should retrieve stored UUID from localStorage', () => {
            const uuid = '123e4567-e89b-12d3-a456-426614174000';
            const eventType = 'school-based';

            mockLocalStorage.getItem
                .mockReturnValueOnce(uuid)
                .mockReturnValueOnce(eventType);

            const result = getStoredUUID();

            expect(result).toEqual({ uuid, eventType });
        });

        it('should return null for invalid stored UUID', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid-uuid');

            const result = getStoredUUID();

            expect(result).toBeNull();
        });

        it('should clear stored UUID data', () => {
            clearStoredUUID();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current_draft_uuid');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current_event_type');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('draft_created_at');
        });
    });

    describe('URL Updates', () => {
        beforeEach(() => {
            global.window = mockWindow;
        });

        it('should update URL with UUID', () => {
            const uuid = '123e4567-e89b-12d3-a456-426614174000';
            const currentPath = '/student-dashboard/submit-event/overview';

            const result = updateURLWithUUID(uuid, currentPath);

            expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
                null,
                '',
                `/student-dashboard/submit-event/${uuid}/overview`
            );
            expect(result).toBe(`/student-dashboard/submit-event/${uuid}/overview`);
        });

        it('should handle missing parameters gracefully', () => {
            const result = updateURLWithUUID(null, '/test-path');
            expect(result).toBeNull();
        });
    });

    describe('Environment Variable Handling', () => {
        beforeEach(() => {
            global.window = mockWindow;
        });

        it('should use NEXT_PUBLIC_API_URL when available', async () => {
            process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ draftId: '123e4567-e89b-12d3-a456-426614174000' })
            };

            global.fetch.mockResolvedValue(mockResponse);

            await migrateToUUID('new-draft');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.example.com/api/proposals/drafts',
                expect.any(Object)
            );
        });

        it('should fallback to window.location.origin when no env vars', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ draftId: '123e4567-e89b-12d3-a456-426614174000' })
            };

            global.fetch.mockResolvedValue(mockResponse);

            await migrateToUUID('new-draft');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/proposals/drafts',
                expect.any(Object)
            );
        });
    });

    describe('Integration Tests', () => {
        beforeEach(() => {
            global.window = mockWindow;
            global.localStorage = mockLocalStorage;
        });

        it('should handle complete UUID migration flow', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ draftId: '123e4567-e89b-12d3-a456-426614174000' })
            };

            global.fetch.mockResolvedValue(mockResponse);

            const result = await completeUUIDMigration('new-draft', '/student-dashboard/submit-event/overview');

            expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            expect(mockWindow.history.replaceState).toHaveBeenCalled();
        });

        it('should handle validation and fixing of draft IDs', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ draftId: '123e4567-e89b-12d3-a456-426614174000' })
            };

            global.fetch.mockResolvedValue(mockResponse);

            const result = await validateAndFixDraftId('school-event', '/test-path');

            expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
        });
    });
});

