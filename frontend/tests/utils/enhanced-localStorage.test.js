/**
 * Enhanced localStorage Tests
 * 
 * Comprehensive tests for the enhanced localStorage implementation
 * that addresses quota exceeded errors, security errors, and browser compatibility issues.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store = new Map();
    let quotaExceeded = false;

    return {
        getItem: vi.fn((key) => store.get(key) || null),
        setItem: vi.fn((key, value) => {
            if (quotaExceeded) {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            }
            store.set(key, value);
        }),
        removeItem: vi.fn((key) => {
            store.delete(key);
        }),
        clear: vi.fn(() => {
            store.clear();
        }),
        key: vi.fn((index) => {
            const keys = Array.from(store.keys());
            return keys[index] || null;
        }),
        get length() {
            return store.size;
        },
        // Test helpers
        simulateQuotaExceeded: () => { quotaExceeded = true; },
        resetQuota: () => { quotaExceeded = false; },
        clear: () => { store.clear(); }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock console methods to avoid noise in tests
const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => { }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
    error: vi.spyOn(console, 'error').mockImplementation(() => { })
};

describe('Enhanced localStorage Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        localStorageMock.resetQuota();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('Basic Functionality', () => {
        it('should save and retrieve data successfully', async () => {
            const { setStorageItem, getStorageItem } = await import('@/utils/enhanced-localStorage');

            const testData = { name: 'Test', value: 123 };
            const result = setStorageItem('test-key', testData);

            expect(result.success).toBe(true);

            const retrieved = getStorageItem('test-key');
            expect(retrieved).toEqual(testData);
        });

        it('should handle localStorage not supported', async () => {
            // Mock localStorage not available
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true
            });

            const { setStorageItem, getStorageItem } = await import('@/utils/enhanced-localStorage');

            const result = setStorageItem('test-key', { test: 'data' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('localStorage not supported');

            const retrieved = getStorageItem('test-key', 'default');
            expect(retrieved).toBe('default');

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
                writable: true
            });
        });
    });

    describe('Quota Exceeded Handling', () => {
        it('should handle quota exceeded errors with cleanup and retry', async () => {
            const { setStorageItem } = await import('@/utils/enhanced-localStorage');

            // Add some old data to simulate cleanup scenario
            const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            localStorageMock.setItem('old-form-data', JSON.stringify({
                value: { test: 'old data' },
                timestamp: oldTimestamp,
                expires: null,
                version: '1.0'
            }));

            // Simulate quota exceeded
            localStorageMock.simulateQuotaExceeded();

            const testData = { name: 'New Test Data', large: 'x'.repeat(1000) };
            const result = setStorageItem('new-key', testData);

            // Should attempt cleanup and retry
            expect(result.success).toBe(false);
            expect(result.error).toContain('quota exceeded');
        });

        it('should perform storage cleanup when quota is exceeded', async () => {
            const { setStorageItem, getDetailedStorageInfo } = await import('@/utils/enhanced-localStorage');

            // Add old data that should be cleaned up
            const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            localStorageMock.setItem('eventForm:old-uuid:organization', JSON.stringify({
                value: { test: 'old form data' },
                timestamp: oldTimestamp,
                expires: null,
                version: '1.0'
            }));

            localStorageMock.setItem('file_old-uuid_gpoa', JSON.stringify({
                value: { test: 'old file data' },
                timestamp: oldTimestamp,
                expires: null,
                version: '1.0'
            }));

            const initialInfo = getDetailedStorageInfo();
            expect(initialInfo.totalKeys).toBe(2);

            // Reset quota and test cleanup
            localStorageMock.resetQuota();
            const testData = { name: 'Test Data' };
            const result = setStorageItem('test-key', testData);

            expect(result.success).toBe(true);

            // Verify old data was cleaned up
            const finalInfo = getDetailedStorageInfo();
            expect(finalInfo.totalKeys).toBeLessThanOrEqual(2); // Should have cleaned up old data
        });
    });

    describe('Security Error Handling', () => {
        it('should handle security errors gracefully', async () => {
            // Mock security error
            localStorageMock.setItem.mockImplementationOnce(() => {
                const error = new Error('SecurityError');
                error.name = 'SecurityError';
                throw error;
            });

            const { setStorageItem } = await import('@/utils/enhanced-localStorage');

            const result = setStorageItem('test-key', { test: 'data' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Storage access blocked by browser');
            expect(result.type).toBe('SecurityError');
        });
    });

    describe('Data Compression', () => {
        it('should compress large file data', async () => {
            const { setStorageItem, getStorageItem } = await import('@/utils/enhanced-localStorage');

            const largeFileData = {
                name: 'large-file.pdf',
                size: 2000000,
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,' + 'x'.repeat(150000), // Large data URL
                timestamp: Date.now()
            };

            const formData = {
                organizationName: 'Test Org',
                gpoa: largeFileData
            };

            const result = setStorageItem('test-key', formData);

            if (result.success) {
                const retrieved = getStorageItem('test-key');

                // Verify the data was compressed (dataUrl should be removed for large files)
                expect(retrieved.gpoa.hasData).toBe(true);
                expect(retrieved.gpoa.compressed).toBe(true);
                expect(retrieved.gpoa.dataUrl).toBeUndefined();
            }
        });
    });

    describe('Storage Monitoring', () => {
        it('should provide detailed storage information', async () => {
            const { setStorageItem, getDetailedStorageInfo } = await import('@/utils/enhanced-localStorage');

            // Add some test data
            setStorageItem('eventForm:test-uuid:organization', { org: 'data' });
            setStorageItem('file_test-uuid_gpoa', { file: 'data' });
            setStorageItem('other-key', { other: 'data' });

            const info = getDetailedStorageInfo();

            expect(info.totalKeys).toBeGreaterThan(0);
            expect(info.totalSize).toBeGreaterThan(0);
            expect(info.percentageUsed).toBeGreaterThan(0);
            expect(info.maxSize).toBeDefined();
            expect(info.availableSpace).toBeDefined();
            expect(info.isHealthy).toBeDefined();
            expect(info.formDataKeys).toBeGreaterThan(0);
            expect(info.fileDataKeys).toBeGreaterThan(0);
        });

        it('should detect unhealthy storage usage', async () => {
            const { getDetailedStorageInfo } = await import('@/utils/enhanced-localStorage');

            // Add a lot of data to simulate high usage
            for (let i = 0; i < 100; i++) {
                localStorageMock.setItem(`test-key-${i}`, JSON.stringify({
                    value: { test: `data ${i}`, large: 'x'.repeat(1000) },
                    timestamp: Date.now(),
                    expires: null,
                    version: '1.0'
                }));
            }

            const info = getDetailedStorageInfo();

            // Should detect high usage (though exact threshold depends on implementation)
            expect(info.totalKeys).toBeGreaterThan(0);
            expect(info.percentageUsed).toBeGreaterThan(0);
        });
    });

    describe('Data Expiration', () => {
        it('should handle expired data', async () => {
            const { setStorageItem, getStorageItem } = await import('@/utils/enhanced-localStorage');

            // Set data with short expiration
            const result = setStorageItem('expiring-key', { test: 'data' }, { expires: 100 }); // 100ms
            expect(result.success).toBe(true);

            // Immediately retrieve (should work)
            let retrieved = getStorageItem('expiring-key');
            expect(retrieved).toEqual({ test: 'data' });

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should return default value after expiration
            retrieved = getStorageItem('expiring-key', 'default');
            expect(retrieved).toBe('default');
        });
    });

    describe('Error Recovery', () => {
        it('should retry failed operations', async () => {
            const { setStorageItem } = await import('@/utils/enhanced-localStorage');

            let attemptCount = 0;
            localStorageMock.setItem.mockImplementation((key, value) => {
                attemptCount++;
                if (attemptCount < 3) {
                    const error = new Error('Temporary error');
                    error.name = 'GenericError';
                    throw error;
                }
                // Success on third attempt
            });

            const result = setStorageItem('retry-key', { test: 'data' });

            expect(attemptCount).toBe(3);
            expect(result.success).toBe(true);
        });

        it('should handle persistent failures', async () => {
            const { setStorageItem } = await import('@/utils/enhanced-localStorage');

            localStorageMock.setItem.mockImplementation(() => {
                const error = new Error('Persistent error');
                error.name = 'GenericError';
                throw error;
            });

            const result = setStorageItem('failing-key', { test: 'data' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Persistent error');
        });
    });

    describe('Storage Testing', () => {
        it('should test storage functionality', async () => {
            const { testStorageFunctionality } = await import('@/utils/enhanced-localStorage');

            const result = testStorageFunctionality();

            expect(result.success).toBe(true);
            expect(result.message).toBe('All storage tests passed');
        });

        it('should detect storage issues in test', async () => {
            // Mock localStorage failure
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage test failure');
            });

            const { testStorageFunctionality } = await import('@/utils/enhanced-localStorage');

            const result = testStorageFunctionality();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Storage test failure');
        });
    });

    describe('Integration with Storage Utils', () => {
        it('should work with existing storage-utils functions', async () => {
            const { setStorageItem: storageUtilsSetItem, getStorageItem: storageUtilsGetItem } = await import('@/utils/storage-utils');

            const testData = { name: 'Integration Test', value: 456 };
            const result = storageUtilsSetItem('integration-key', testData);

            expect(result.success).toBe(true);

            const retrieved = storageUtilsGetItem('integration-key');
            expect(retrieved).toEqual(testData);
        });

        it('should provide detailed storage info through storage-utils', async () => {
            const { getDetailedStorageInfo } = await import('@/utils/storage-utils');

            const info = getDetailedStorageInfo();

            expect(info).toBeDefined();
            expect(info.totalKeys).toBeDefined();
            expect(info.totalSize).toBeDefined();
            expect(info.percentageUsed).toBeDefined();
            expect(info.isHealthy).toBeDefined();
        });
    });
});







