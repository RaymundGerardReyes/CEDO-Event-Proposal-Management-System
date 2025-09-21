/**
 * Comprehensive Unit Tests for storage-utils.js
 * 
 * 🎯 Purpose: Complete testing of localStorage utilities with:
 * - Form data persistence and recovery
 * - File upload handling via data URLs
 * - UUID-based storage isolation
 * - Storage monitoring and cleanup
 * - Error handling and fallbacks
 * - Performance optimization features
 * 
 * Test Coverage: 25 test cases covering all major functions and edge cases
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage BEFORE importing the storage utils
const localStorageMock = (() => {
    const store = new Map();
    return {
        store,
        getItem: vi.fn((key) => store.get(key) || null),
        setItem: vi.fn((key, value) => {
            store.set(key, value);
            return undefined;
        }),
        removeItem: vi.fn((key) => {
            store.delete(key);
            return undefined;
        }),
        key: vi.fn((index) => Array.from(store.keys())[index] || null),
        get length() { return store.size; },
        clear: vi.fn(() => store.clear()),
        hasOwnProperty: vi.fn((key) => store.has(key))
    };
})();

// Mock fetch for restoreFileFromDataUrl
global.fetch = vi.fn();

// Mock console methods to avoid noise in tests
const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => { }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
    error: vi.spyOn(console, 'error').mockImplementation(() => { }),
};

// Mock window object and localStorage globally BEFORE importing
Object.defineProperty(global, 'window', {
    value: {
        localStorage: localStorageMock,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    },
    writable: true
});

// Also set localStorage on global for direct access
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Now import the storage utils after mocking
import {
    cleanupExpiredData,
    cleanupOldFormData,
    clearAllFormData,
    clearAllLocalStorage,
    createFormDataBackup,
    exportFormData,
    generateFormStorageKey,
    getDetailedStorageInfo,
    getStorageItem,
    getStorageStats,
    getStorageUsage,
    importFormData,
    isStorageNearFull,
    isStorageSupported,
    loadFormData,
    removeFormData,
    removeStorageItem,
    restoreFileFromDataUrl,
    restoreFormDataBackup,
    retrieveFileData,
    saveFileData,
    saveFormData,
    setStorageItem,
    storeFileData
} from '../../src/utils/storage-utils';

describe('Storage Utils - Core Functions', () => {
    beforeEach(() => {
        // Reset localStorage mock
        localStorageMock.store.clear();
        vi.clearAllMocks();

        // Reset fetch mock
        global.fetch.mockClear();

        // Ensure localStorage mock is working
        localStorageMock.setItem.mockClear();
        localStorageMock.getItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.key.mockClear();
        localStorageMock.clear.mockClear();
        localStorageMock.hasOwnProperty.mockClear();
    });

    describe('Storage Support Detection', () => {
        it('should detect localStorage support when available', () => {
            const isSupported = isStorageSupported();
            expect(isSupported).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('__storage_test__', 'test');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('__storage_test__');
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });

            const isSupported = isStorageSupported();
            expect(isSupported).toBe(false);
        });

        it('should return false when window is undefined', () => {
            const originalWindow = global.window;
            delete global.window;

            const isSupported = isStorageSupported();
            expect(isSupported).toBe(false);

            global.window = originalWindow;
        });
    });

    describe('Storage Usage Monitoring', () => {
        it('should calculate storage usage correctly', () => {
            // Mock the for...in loop behavior for localStorage
            const mockLocalStorage = {
                key1: 'value1',
                key2: 'value2'
            };

            // Override the localStorage mock to behave like a real object
            Object.defineProperty(global.window, 'localStorage', {
                value: {
                    ...localStorageMock,
                    ...mockLocalStorage,
                    get length() { return Object.keys(mockLocalStorage).length; },
                    hasOwnProperty: vi.fn((key) => Object.prototype.hasOwnProperty.call(mockLocalStorage, key))
                },
                writable: true
            });

            const usage = getStorageUsage();
            expect(usage.used).toBeGreaterThan(0);
            expect(usage.percentage).toBeGreaterThanOrEqual(0);
            expect(usage.available).toBeGreaterThanOrEqual(0);
        });

        it('should return zero usage when localStorage is not supported', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });

            const usage = getStorageUsage();
            expect(usage).toEqual({ used: 0, percentage: 0, available: 0 });
        });

        it('should detect when storage is near full', () => {
            // Mock a high usage scenario with a large object
            const mockLocalStorage = {
                largeKey: 'x'.repeat(1000000)
            };

            Object.defineProperty(global.window, 'localStorage', {
                value: {
                    ...localStorageMock,
                    ...mockLocalStorage,
                    get length() { return Object.keys(mockLocalStorage).length; },
                    hasOwnProperty: vi.fn((key) => Object.prototype.hasOwnProperty.call(mockLocalStorage, key))
                },
                writable: true
            });

            const isNearFull = isStorageNearFull(50); // 50% threshold
            expect(isNearFull).toBe(true);
        });

        it('should return false when storage is not near full', () => {
            localStorageMock.store.set('smallKey', 'smallValue');

            const isNearFull = isStorageNearFull(90); // 90% threshold
            expect(isNearFull).toBe(false);
        });
    });

    describe('Storage Key Generation', () => {
        it('should generate correct form storage keys', () => {
            const key = generateFormStorageKey('test-uuid', 'organization');
            expect(key).toBe('eventForm:test-uuid:organization');
        });

        it('should handle special characters in UUID and step names', () => {
            const key = generateFormStorageKey('uuid-with-dashes', 'step-with-dashes');
            expect(key).toBe('eventForm:uuid-with-dashes:step-with-dashes');
        });
    });

    describe('File Data Storage', () => {
        it('should store file data successfully', () => {
            const fileData = {
                name: 'test.pdf',
                size: 1024,
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,test-data'
            };

            const result = storeFileData('test-uuid', 'gpoa', fileData);
            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'file_test-uuid_gpoa',
                expect.any(String)
            );
        });

        it('should retrieve file data successfully', () => {
            const fileData = {
                name: 'test.pdf',
                size: 1024,
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,test-data'
            };

            // Store the file data first
            storeFileData('test-uuid', 'gpoa', fileData);

            // Retrieve it
            const retrieved = retrieveFileData('test-uuid', 'gpoa');
            expect(retrieved).toEqual(fileData);
        });

        it('should handle file data expiration', () => {
            const fileData = {
                name: 'test.pdf',
                size: 1024,
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,test-data'
            };

            // Store with past expiration
            const expiredData = {
                value: fileData,
                timestamp: Date.now() - 1000000, // Very old
                expires: Date.now() - 500000, // Expired
                version: '1.0'
            };
            localStorageMock.store.set('file_test-uuid_gpoa', JSON.stringify(expiredData));

            const retrieved = retrieveFileData('test-uuid', 'gpoa');
            expect(retrieved).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('file_test-uuid_gpoa');
        });

        it('should reject files that are too large', () => {
            const largeFileData = {
                name: 'large.pdf',
                size: 10 * 1024 * 1024, // 10MB
                type: 'application/pdf',
                dataUrl: 'x'.repeat(10 * 1024 * 1024) // Very large data URL
            };

            const result = storeFileData('test-uuid', 'gpoa', largeFileData);
            expect(result).toBe(false);
        });
    });

    describe('Storage Item Management', () => {
        it('should set storage items with metadata', () => {
            const testData = { name: 'test', value: 123 };
            const result = setStorageItem('test-key', testData);

            expect(result.success).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'test-key',
                expect.stringContaining('"value":')
            );
        });

        it('should get storage items correctly', () => {
            const testData = { name: 'test', value: 123 };
            setStorageItem('test-key', testData);

            const retrieved = getStorageItem('test-key');
            expect(retrieved).toEqual(testData);
        });

        it('should handle expired storage items', () => {
            const expiredData = {
                value: { name: 'test' },
                timestamp: Date.now(),
                expires: Date.now() - 1000, // Expired
                version: '1.0'
            };
            localStorageMock.store.set('test-key', JSON.stringify(expiredData));

            const retrieved = getStorageItem('test-key');
            expect(retrieved).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
        });

        it('should remove storage items successfully', () => {
            setStorageItem('test-key', { data: 'test' });
            const result = removeStorageItem('test-key');

            expect(result).toBe(true);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
        });

        it('should handle QuotaExceededError with cleanup', () => {
            // Reset mocks to ensure localStorage is supported
            localStorageMock.setItem.mockClear();
            localStorageMock.removeItem.mockClear();

            // Make isStorageSupported return true by allowing the test operations
            localStorageMock.setItem.mockImplementation((key, value) => {
                if (key === '__storage_test__') {
                    localStorageMock.store.set(key, value);
                    return undefined;
                }
                // For actual storage operations, throw QuotaExceededError
                throw new DOMException('Quota exceeded', 'QuotaExceededError');
            });

            localStorageMock.removeItem.mockImplementation((key) => {
                if (key === '__storage_test__') {
                    localStorageMock.store.delete(key);
                    return undefined;
                }
                localStorageMock.store.delete(key);
                return undefined;
            });

            const result = setStorageItem('test-key', { data: 'test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Storage quota exceeded');
        });

        it('should handle SecurityError', () => {
            // Reset mocks to ensure localStorage is supported
            localStorageMock.setItem.mockClear();
            localStorageMock.removeItem.mockClear();

            // Make isStorageSupported return true by allowing the test operations
            localStorageMock.setItem.mockImplementation((key, value) => {
                if (key === '__storage_test__') {
                    localStorageMock.store.set(key, value);
                    return undefined;
                }
                // For actual storage operations, throw SecurityError
                throw new DOMException('Storage access blocked', 'SecurityError');
            });

            localStorageMock.removeItem.mockImplementation((key) => {
                if (key === '__storage_test__') {
                    localStorageMock.store.delete(key);
                    return undefined;
                }
                localStorageMock.store.delete(key);
                return undefined;
            });

            const result = setStorageItem('test-key', { data: 'test' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Storage access blocked by browser');
        });
    });

    describe('Data Cleanup Functions', () => {
        it('should cleanup expired data', () => {
            // Add expired data
            const expiredData = {
                value: { data: 'expired' },
                timestamp: Date.now(),
                expires: Date.now() - 1000,
                version: '1.0'
            };
            localStorageMock.store.set('expired-key', JSON.stringify(expiredData));

            // Add valid data
            const validData = {
                value: { data: 'valid' },
                timestamp: Date.now(),
                expires: Date.now() + 100000,
                version: '1.0'
            };
            localStorageMock.store.set('valid-key', JSON.stringify(validData));

            cleanupExpiredData();

            expect(localStorageMock.getItem('expired-key')).toBeNull();
            expect(localStorageMock.getItem('valid-key')).toBeTruthy();
        });

        it('should cleanup old form data', () => {
            // Add old form data
            const oldFormData = {
                value: { data: 'old' },
                timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days old
                version: '1.0'
            };
            localStorageMock.store.set('eventForm:test-uuid:step', JSON.stringify(oldFormData));

            // Add recent form data
            const recentFormData = {
                value: { data: 'recent' },
                timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days old
                version: '1.0'
            };
            localStorageMock.store.set('eventForm:test-uuid:recent', JSON.stringify(recentFormData));

            cleanupOldFormData();

            expect(localStorageMock.getItem('eventForm:test-uuid:step')).toBeNull();
            expect(localStorageMock.getItem('eventForm:test-uuid:recent')).toBeTruthy();
        });
    });

    describe('Form Data Management', () => {
        it('should save form data with file handling', () => {
            const formData = {
                name: 'Test Event',
                gpoa: {
                    name: 'gpoa.pdf',
                    size: 1024,
                    type: 'application/pdf',
                    dataUrl: 'data:application/pdf;base64,test'
                }
            };

            const result = saveFormData('test-uuid', 'organization', formData);
            expect(result).toBe(true);
        });

        it('should load form data with file restoration', () => {
            const formData = {
                name: 'Test Event',
                gpoa: {
                    name: 'gpoa.pdf',
                    size: 1024,
                    type: 'application/pdf',
                    hasData: true
                }
            };

            // Store the form data
            saveFormData('test-uuid', 'organization', formData);

            // Store the file data separately
            const fileData = {
                name: 'gpoa.pdf',
                size: 1024,
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,test'
            };
            storeFileData('test-uuid', 'gpoa', fileData);

            const loaded = loadFormData('test-uuid', 'organization');
            expect(loaded.name).toBe('Test Event');
            expect(loaded.gpoa.dataUrl).toBe('data:application/pdf;base64,test');
        });

        it('should remove form data and associated files', () => {
            const formData = { name: 'Test Event' };
            saveFormData('test-uuid', 'organization', formData);

            const result = removeFormData('test-uuid', 'organization');
            expect(result).toBe(true);
        });

        it('should clear all form data for a UUID', () => {
            saveFormData('test-uuid', 'organization', { name: 'Test' });
            saveFormData('test-uuid', 'eventInfo', { venue: 'Test Venue' });

            const result = clearAllFormData('test-uuid');
            expect(result).toBe(true);
        });
    });

    describe('File Operations', () => {
        it('should save file data correctly', () => {
            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
            const dataUrl = 'data:application/pdf;base64,test';

            const result = saveFileData(file, dataUrl);
            expect(result).toEqual({
                name: 'test.pdf',
                size: file.size,
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,test',
                timestamp: expect.any(Number)
            });
        });

        it('should restore file from data URL', async () => {
            const fileData = {
                name: 'test.pdf',
                type: 'application/pdf',
                dataUrl: 'data:application/pdf;base64,test'
            };

            // Mock fetch response
            global.fetch.mockResolvedValueOnce({
                blob: () => Promise.resolve(new Blob(['test content'], { type: 'application/pdf' }))
            });

            const result = await restoreFileFromDataUrl(fileData);
            expect(result).toBeInstanceOf(File);
            expect(result.name).toBe('test.pdf');
        });

        it('should handle file restoration errors', async () => {
            const fileData = {
                name: 'test.pdf',
                type: 'application/pdf',
                dataUrl: 'invalid-data-url'
            };

            global.fetch.mockRejectedValueOnce(new Error('Invalid data URL'));

            const result = await restoreFileFromDataUrl(fileData);
            expect(result).toBeNull();
        });
    });

    describe('Backup and Export Functions', () => {
        it('should create form data backup', () => {
            const formData = { name: 'Test Event', venue: 'Test Venue' };
            const result = createFormDataBackup('test-uuid', formData);

            expect(result).toBe(true);
        });

        it('should restore form data from backup', () => {
            const formData = { name: 'Test Event', venue: 'Test Venue' };
            createFormDataBackup('test-uuid', formData);

            const restored = restoreFormDataBackup();
            expect(restored.name).toBe('Test Event');
            expect(restored.uuid).toBe('test-uuid');
        });

        it('should export form data correctly', () => {
            saveFormData('test-uuid', 'organization', { name: 'Test' });
            saveFormData('test-uuid', 'eventInfo', { venue: 'Venue' });

            const exported = exportFormData('test-uuid');
            const parsed = JSON.parse(exported);

            expect(parsed.uuid).toBe('test-uuid');
            expect(parsed.data.organization.name).toBe('Test');
            expect(parsed.data.eventInfo.venue).toBe('Venue');
        });

        it('should import form data correctly', () => {
            const exportData = JSON.stringify({
                uuid: 'import-uuid',
                exportTimestamp: Date.now(),
                version: '1.0',
                data: {
                    organization: { name: 'Imported Event' },
                    eventInfo: { venue: 'Imported Venue' }
                }
            });

            const result = importFormData(exportData);
            expect(result).toBe(true);

            const loaded = loadFormData('import-uuid', 'organization');
            expect(loaded.name).toBe('Imported Event');
        });

        it('should handle invalid import data', () => {
            const result = importFormData('invalid-json');
            expect(result).toBe(false);
        });
    });

    describe('Storage Information and Statistics', () => {
        it('should get detailed storage information', () => {
            saveFormData('test-uuid', 'organization', { name: 'Test' });

            const info = getDetailedStorageInfo();
            expect(info.totalKeys).toBeGreaterThan(0);
            expect(info.formDataKeys).toBeGreaterThan(0);
            expect(info.maxSize).toBe(5 * 1024 * 1024); // 5MB
        });

        it('should get storage statistics', () => {
            saveFormData('test-uuid', 'organization', { name: 'Test' });

            const stats = getStorageStats();
            expect(stats).toBeTruthy();
            expect(stats.isSupported).toBe(true);
            expect(stats.formDataCount).toBeGreaterThan(0);
        });

        it('should clear all localStorage data', () => {
            localStorageMock.store.set('key1', 'value1');
            localStorageMock.store.set('key2', 'value2');

            const result = clearAllLocalStorage();
            expect(result).toBe(true);
            expect(localStorageMock.store.size).toBe(0);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle localStorage not supported in all functions', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });

            expect(isStorageSupported()).toBe(false);
            expect(getStorageUsage()).toEqual({ used: 0, percentage: 0, available: 0 });
            expect(setStorageItem('key', 'value').success).toBe(false);
            expect(getStorageItem('key')).toBeNull();
            expect(removeStorageItem('key')).toBe(false);
        });

        it('should handle malformed stored data', () => {
            localStorageMock.store.set('malformed-key', 'invalid-json');

            const result = getStorageItem('malformed-key');
            expect(result).toBeNull();
        });

        it('should handle large data compression', () => {
            const largeData = {
                name: 'Large Event',
                description: 'x'.repeat(100000), // Large description
                gpoa: {
                    name: 'large.pdf',
                    size: 1024,
                    type: 'application/pdf',
                    dataUrl: 'x'.repeat(100000) // Large data URL
                }
            };

            const result = setStorageItem('large-key', largeData, { compress: true });
            expect(result.success).toBe(true);
        });

        it('should handle concurrent storage operations', () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    Promise.resolve(setStorageItem(`concurrent-key-${i}`, { data: i }))
                );
            }

            return Promise.all(promises).then(results => {
                results.forEach(result => {
                    expect(result.success).toBe(true);
                });
            });
        });

        it('should handle storage quota exceeded with retry', () => {
            let callCount = 0;
            localStorageMock.setItem.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                // Second call succeeds
            });

            const result = setStorageItem('retry-key', { data: 'test' });
            expect(result.success).toBe(true);
            expect(result.cleanupPerformed).toBe(true);
        });
    });
});
