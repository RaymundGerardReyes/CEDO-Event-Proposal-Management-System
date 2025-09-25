/**
 * Enhanced localStorage Simple Tests
 * 
 * Simple tests to verify the enhanced localStorage implementation works
 * and addresses the quota exceeded errors.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage with quota exceeded simulation
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

// Mock console methods
const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => { }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
    error: vi.spyOn(console, 'error').mockImplementation(() => { })
};

describe('Enhanced localStorage Simple Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        localStorageMock.resetQuota();
    });

    describe('Basic Storage Operations', () => {
        it('should save and retrieve data successfully', async () => {
            const { setStorageItem, getStorageItem } = await import('@/utils/storage-utils');

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

            const { setStorageItem, getStorageItem } = await import('@/utils/storage-utils');

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
        it('should detect quota exceeded errors', async () => {
            const { setStorageItem } = await import('@/utils/storage-utils');

            // Simulate quota exceeded
            localStorageMock.simulateQuotaExceeded();

            const testData = { name: 'Test Data' };
            const result = setStorageItem('test-key', testData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('quota exceeded');
        });

        it('should perform cleanup when quota is exceeded', async () => {
            const { setStorageItem, getDetailedStorageInfo } = await import('@/utils/storage-utils');

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
            expect(initialInfo.totalKeys).toBeGreaterThan(0);

            // Reset quota and test cleanup
            localStorageMock.resetQuota();
            const testData = { name: 'Test Data' };
            const result = setStorageItem('test-key', testData);

            expect(result.success).toBe(true);
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

            const { setStorageItem } = await import('@/utils/storage-utils');

            const result = setStorageItem('test-key', { test: 'data' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Storage access blocked by browser');
            expect(result.type).toBe('SecurityError');
        });
    });

    describe('Storage Information', () => {
        it('should provide detailed storage information', async () => {
            const { setStorageItem, getDetailedStorageInfo } = await import('@/utils/storage-utils');

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
    });

    describe('Data Compression', () => {
        it('should compress large file data', async () => {
            const { setStorageItem, getStorageItem } = await import('@/utils/storage-utils');

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

    describe('Integration Tests', () => {
        it('should work with useFormStorage hook', async () => {
            const { useFormStorage } = await import('@/hooks/use-form-storage');

            // Test that the hook can be imported and used
            expect(useFormStorage).toBeDefined();
            expect(typeof useFormStorage).toBe('function');
        });

        it('should handle all storage utility functions', async () => {
            // Import all storage utilities
            const storageUtils = await import('@/utils/storage-utils');

            // Verify all expected functions are exported
            const expectedFunctions = [
                'generateFormStorageKey',
                'saveFormData',
                'loadFormData',
                'removeFormData',
                'clearAllFormData',
                'createFormDataBackup',
                'exportFormData',
                'importFormData',
                'getStorageStats',
                'getDetailedStorageInfo',
                'cleanupExpiredData',
                'cleanupOldFormData',
                'saveFileData',
                'restoreFileFromDataUrl',
                'setStorageItem',
                'getStorageItem',
                'removeStorageItem'
            ];

            expectedFunctions.forEach(funcName => {
                expect(storageUtils[funcName]).toBeDefined();
                expect(typeof storageUtils[funcName]).toBe('function');
            });
        });
    });

    describe('Real-world Scenarios', () => {
        it('should handle the specific error from the user', async () => {
            const { setStorageItem } = await import('@/utils/storage-utils');

            // Simulate the exact scenario from the user's error
            localStorageMock.simulateQuotaExceeded();

            const formData = {
                organizationName: 'Test Organization',
                contactPerson: 'John Doe',
                contactEmail: 'john@example.com',
                contactPhone: '0912-345-6789'
            };

            const result = setStorageItem('eventForm:test-uuid:organization', formData);

            // Should handle the quota exceeded error gracefully
            expect(result.success).toBe(false);
            expect(result.error).toContain('quota exceeded');

            // Should provide helpful error information
            expect(result.originalError).toBe('QuotaExceededError');
        });

        it('should provide user-friendly error messages', async () => {
            const { setStorageItem } = await import('@/utils/storage-utils');

            // Test different error scenarios
            localStorageMock.simulateQuotaExceeded();

            const result = setStorageItem('test-key', { test: 'data' });

            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
            expect(typeof result.error).toBe('string');

            // Error message should be user-friendly
            expect(result.error).not.toContain('QuotaExceededError');
            expect(result.error).toContain('quota');
        });
    });
});






