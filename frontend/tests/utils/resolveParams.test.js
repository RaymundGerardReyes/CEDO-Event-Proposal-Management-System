/**
 * Tests for resolveParams utility
 * Ensures Next.js 15+ params handling works without React use hook errors
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the logger to avoid dependency issues
vi.mock('@/utils/logger', () => ({
    default: {
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Mock the require call for React
const mockUse = vi.fn();
vi.mock('react', () => ({
    use: mockUse
}));

// Mock require to return our mocked React
const originalRequire = global.require;
global.require = vi.fn((module) => {
    if (module === 'react') {
        return { use: mockUse };
    }
    return originalRequire(module);
});

// Import after mocking
import { resolveParams } from '../../src/app/student-dashboard/submit-event/[draftId]/utils/errorHandling.js';

describe('resolveParams', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the mock for each test
        mockUse.mockClear();
    });

    afterAll(() => {
        // Restore original require
        global.require = originalRequire;
    });

    it('returns empty object when params is null/undefined', () => {
        const result = resolveParams(null);
        expect(result).toEqual({});
    });

    it('returns params directly when it is already an object', () => {
        const params = { draftId: 'test-123' };
        const result = resolveParams(params);
        expect(result).toEqual(params);
    });

    it('calls React.use() when params is a Promise', () => {
        const mockParams = Promise.resolve({ draftId: 'test-123' });
        const mockResolvedParams = { draftId: 'test-123' };
        mockUse.mockReturnValue(mockResolvedParams);

        const result = resolveParams(mockParams);

        expect(mockUse).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResolvedParams);
    });

    it('uses fallback function when params is falsy', () => {
        const fallbackFn = vi.fn().mockReturnValue({ draftId: 'fallback-123' });
        const result = resolveParams(null, fallbackFn);

        expect(fallbackFn).toHaveBeenCalled();
        expect(result).toEqual({ draftId: 'fallback-123' });
    });

    it('uses fallback function when params is not an object or Promise', () => {
        const fallbackFn = vi.fn().mockReturnValue({ draftId: 'fallback-123' });
        const result = resolveParams('not-an-object', fallbackFn);

        expect(fallbackFn).toHaveBeenCalled();
        expect(result).toEqual({ draftId: 'fallback-123' });
    });
});

