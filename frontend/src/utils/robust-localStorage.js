/**
 * Robust localStorage Implementation
 * 
 * A comprehensive localStorage wrapper that addresses all common issues:
 * - Quota exceeded errors with automatic cleanup
 * - Security errors (private browsing, blocked access)
 * - Browser compatibility issues
 * - Storage monitoring and management
 * - Fallback mechanisms
 * 
 * Based on web search best practices and real-world usage patterns.
 */

// Configuration
const CONFIG = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    WARNING_THRESHOLD: 0.8, // 80% usage warning
    CLEANUP_THRESHOLD: 0.9, // 90% usage cleanup
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 100,
    MAX_ITEM_SIZE: 1024 * 1024 // 1MB per item
};

// Logger
const log = {
    info: (msg, data = {}) => console.log(`[Robust Storage] ${msg}`, data),
    warn: (msg, data = {}) => console.warn(`[Robust Storage] ⚠️ ${msg}`, data),
    error: (msg, error = null, data = {}) => console.error(`[Robust Storage] ❌ ${msg}`, { error: error?.message, ...data }),
    success: (msg, data = {}) => console.log(`[Robust Storage] ✅ ${msg}`, data)
};

/**
 * Check if localStorage is available and working
 */
function isLocalStorageAvailable() {
    if (typeof window === 'undefined') return false;
    if (!window.localStorage) return false;

    try {
        const testKey = '__robust_storage_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        log.warn('localStorage not available', { error: error.message });
        return false;
    }
}

/**
 * Get current storage usage
 */
function getStorageUsage() {
    if (!isLocalStorageAvailable()) {
        return { used: 0, percentage: 0, available: 0, maxSize: CONFIG.MAX_SIZE };
    }

    try {
        let used = 0;
        let keyCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    used += key.length + value.length;
                    keyCount++;
                }
            }
        }

        const percentage = (used / CONFIG.MAX_SIZE) * 100;
        const available = CONFIG.MAX_SIZE - used;

        return {
            used,
            percentage: Math.round(percentage * 100) / 100,
            available,
            maxSize: CONFIG.MAX_SIZE,
            keyCount
        };
    } catch (error) {
        log.error('Failed to calculate storage usage', error);
        return { used: 0, percentage: 0, available: 0, maxSize: CONFIG.MAX_SIZE, keyCount: 0 };
    }
}

/**
 * Clean up old and unnecessary data
 */
function cleanupStorage() {
    if (!isLocalStorageAvailable()) return 0;

    let cleanedCount = 0;
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    try {
        const keysToRemove = [];

        // Identify keys to remove
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                // Remove old form data, drafts, and temporary data
                if (key.includes('form-') ||
                    key.includes('draft-') ||
                    key.includes('backup-') ||
                    key.includes('eventForm:') ||
                    key.includes('file_') ||
                    key.includes('temp_') ||
                    key.includes('cache_') ||
                    key.includes('test_')) {

                    try {
                        const stored = localStorage.getItem(key);
                        if (stored) {
                            const parsed = JSON.parse(stored);
                            const age = now - (parsed.timestamp || 0);

                            // Remove if older than maxAge or no timestamp
                            if (age > maxAge || !parsed.timestamp) {
                                keysToRemove.push(key);
                            }
                        } else {
                            keysToRemove.push(key);
                        }
                    } catch {
                        // If we can't parse it, remove it
                        keysToRemove.push(key);
                    }
                }
            }
        }

        // Remove identified keys
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
                cleanedCount++;
                log.info(`Cleaned up: ${key}`);
            } catch (error) {
                log.warn(`Failed to remove: ${key}`, error);
            }
        });

        if (cleanedCount > 0) {
            log.success(`Cleanup completed: ${cleanedCount} items removed`);
        }

        return cleanedCount;
    } catch (error) {
        log.error('Cleanup failed', error);
        return 0;
    }
}

/**
 * Compress data to reduce size
 */
function compressData(data) {
    if (!data || typeof data !== 'object') return data;

    const compressed = { ...data };

    // Compress large file data
    if (compressed.gpoa && compressed.gpoa.dataUrl) {
        const gpoaData = compressed.gpoa;
        if (gpoaData.dataUrl && gpoaData.dataUrl.length > 100000) { // 100KB threshold
            compressed.gpoa = {
                name: gpoaData.name,
                size: gpoaData.size,
                type: gpoaData.type,
                timestamp: gpoaData.timestamp || Date.now(),
                hasData: true,
                compressed: true
                // Remove dataUrl to save space
            };
        }
    }

    if (compressed.projectProposal && compressed.projectProposal.dataUrl) {
        const proposalData = compressed.projectProposal;
        if (proposalData.dataUrl && proposalData.dataUrl.length > 100000) { // 100KB threshold
            compressed.projectProposal = {
                name: proposalData.name,
                size: proposalData.size,
                type: proposalData.type,
                timestamp: proposalData.timestamp || Date.now(),
                hasData: true,
                compressed: true
                // Remove dataUrl to save space
            };
        }
    }

    return compressed;
}

/**
 * Robust localStorage setItem with comprehensive error handling
 */
export function setStorageItem(key, value, options = {}) {
    if (!isLocalStorageAvailable()) {
        log.warn('localStorage not available', { key });
        return { success: false, error: 'localStorage not available' };
    }

    const { expires, retryOnFailure = true } = options;

    // Prepare storage data
    const storageData = {
        value: compressData(value),
        timestamp: Date.now(),
        expires: expires ? Date.now() + expires : null,
        version: '2.0'
    };

    const serializedData = JSON.stringify(storageData);
    const dataSize = serializedData.length;

    // Check if data is too large
    if (dataSize > CONFIG.MAX_ITEM_SIZE) {
        log.warn('Item too large', { key, size: dataSize, maxAllowed: CONFIG.MAX_ITEM_SIZE });
        return { success: false, error: 'Item too large for storage', size: dataSize };
    }

    // Check current storage usage
    const usage = getStorageUsage();
    if (usage.percentage > CONFIG.CLEANUP_THRESHOLD * 100) {
        log.warn('Storage almost full, performing cleanup', { usage });
        cleanupStorage();
    }

    // Retry logic
    const attemptStorage = (attemptNumber = 1) => {
        try {
            localStorage.setItem(key, serializedData);
            log.success('Item saved successfully', { key, size: dataSize, attempt: attemptNumber });
            return { success: true, size: dataSize, attempt: attemptNumber };
        } catch (error) {
            log.error(`Storage attempt ${attemptNumber} failed`, error, { key, size: dataSize });

            // Handle specific error types
            if (error.name === 'QuotaExceededError') {
                log.warn('Storage quota exceeded, attempting cleanup', { attempt: attemptNumber });

                // Perform cleanup
                const cleanedCount = cleanupStorage();

                if (cleanedCount > 0 && attemptNumber < CONFIG.RETRY_ATTEMPTS) {
                    // Retry after cleanup
                    setTimeout(() => {
                        return attemptStorage(attemptNumber + 1);
                    }, CONFIG.RETRY_DELAY * attemptNumber);
                } else {
                    return {
                        success: false,
                        error: 'Storage quota exceeded even after cleanup',
                        originalError: error.name,
                        cleanedCount
                    };
                }
            } else if (error.name === 'SecurityError') {
                log.error('Storage security error - browser blocked access', error, { key });
                return { success: false, error: 'Storage access blocked by browser', type: 'SecurityError' };
            } else {
                // Generic error
                if (retryOnFailure && attemptNumber < CONFIG.RETRY_ATTEMPTS) {
                    log.info(`Retrying storage operation (attempt ${attemptNumber + 1})`);
                    setTimeout(() => {
                        return attemptStorage(attemptNumber + 1);
                    }, CONFIG.RETRY_DELAY * attemptNumber);
                } else {
                    return {
                        success: false,
                        error: error.message || 'Unknown storage error',
                        type: error.name,
                        attempt: attemptNumber
                    };
                }
            }
        }
    };

    return attemptStorage();
}

/**
 * Robust localStorage getItem with error handling
 */
export function getStorageItem(key, defaultValue = null) {
    if (!isLocalStorageAvailable()) {
        log.warn('localStorage not available, returning default value', { key });
        return defaultValue;
    }

    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;

        const parsedData = JSON.parse(stored);

        // Check if data has expired
        if (parsedData.expires && Date.now() > parsedData.expires) {
            log.info('Item expired, removing', { key });
            localStorage.removeItem(key);
            return defaultValue;
        }

        return parsedData.value;
    } catch (error) {
        log.error('Failed to retrieve item', error, { key });
        return defaultValue;
    }
}

/**
 * Robust localStorage removeItem with error handling
 */
export function removeStorageItem(key) {
    if (!isLocalStorageAvailable()) return false;

    try {
        localStorage.removeItem(key);
        log.success('Item removed', { key });
        return true;
    } catch (error) {
        log.error('Failed to remove item', error, { key });
        return false;
    }
}

/**
 * Get detailed storage information for debugging
 */
export function getDetailedStorageInfo() {
    if (!isLocalStorageAvailable()) {
        return { error: 'localStorage not available' };
    }

    try {
        const info = {
            totalKeys: 0,
            totalSize: 0,
            formDataKeys: 0,
            fileDataKeys: 0,
            formDataSize: 0,
            fileDataSize: 0,
            otherSize: 0,
            keys: [],
            errors: []
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        const size = key.length + value.length;
                        info.totalKeys++;
                        info.totalSize += size;
                        info.keys.push({ key, size });

                        if (key.startsWith('eventForm:')) {
                            info.formDataKeys++;
                            info.formDataSize += size;
                        } else if (key.startsWith('file_')) {
                            info.fileDataKeys++;
                            info.fileDataSize += size;
                        } else {
                            info.otherSize += size;
                        }
                    }
                } catch (error) {
                    info.errors.push({ key, error: error.message });
                }
            }
        }

        return {
            ...info,
            maxSize: CONFIG.MAX_SIZE,
            percentageUsed: Math.round((info.totalSize / CONFIG.MAX_SIZE * 100) * 100) / 100,
            availableSpace: CONFIG.MAX_SIZE - info.totalSize,
            isHealthy: (info.totalSize / CONFIG.MAX_SIZE) < CONFIG.WARNING_THRESHOLD
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * Test storage functionality
 */
export function testStorageFunctionality() {
    if (!isLocalStorageAvailable()) {
        return { success: false, error: 'localStorage not available' };
    }

    try {
        const testKey = '__robust_storage_test__';
        const testData = { test: true, timestamp: Date.now() };

        // Test write
        const writeResult = setStorageItem(testKey, testData);
        if (!writeResult.success) {
            return { success: false, error: 'Write test failed', details: writeResult };
        }

        // Test read
        const readData = getStorageItem(testKey);
        if (!readData || readData.test !== true) {
            return { success: false, error: 'Read test failed' };
        }

        // Test remove
        const removeResult = removeStorageItem(testKey);
        if (!removeResult) {
            return { success: false, error: 'Remove test failed' };
        }

        return { success: true, message: 'All storage tests passed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Initialize storage monitoring
 */
export function initializeStorageMonitoring() {
    if (!isLocalStorageAvailable()) return;

    // Check storage usage periodically
    const checkInterval = setInterval(() => {
        const usage = getStorageUsage();

        if (usage.percentage > CONFIG.CLEANUP_THRESHOLD * 100) {
            log.warn('Storage usage high, performing cleanup', { usage });
            cleanupStorage();
        }
    }, 60000); // Check every minute

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        cleanupStorage();
        clearInterval(checkInterval);
    });

    // Clean up on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cleanupStorage();
        }
    });

    log.success('Storage monitoring initialized');
}

// Initialize storage monitoring when module loads
if (typeof window !== 'undefined') {
    initializeStorageMonitoring();
}






