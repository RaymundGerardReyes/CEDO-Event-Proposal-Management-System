/**
 * Enhanced localStorage Implementation
 * 
 * A comprehensive localStorage wrapper that addresses all common issues:
 * - Quota exceeded errors
 * - Security errors (private browsing, blocked access)
 * - Browser compatibility issues
 * - Storage monitoring and cleanup
 * - Fallback mechanisms
 * 
 * Based on web search best practices for robust localStorage handling.
 */

// Storage configuration
const STORAGE_CONFIG = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    WARNING_THRESHOLD: 0.8, // 80% usage warning
    CLEANUP_THRESHOLD: 0.9, // 90% usage cleanup
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 100
};

// Enhanced logger
const logger = {
    info: (message, data = {}) => console.log(`[Enhanced Storage] ${message}`, data),
    warn: (message, data = {}) => console.warn(`[Enhanced Storage] ⚠️ ${message}`, data),
    error: (message, error = null, data = {}) => console.error(`[Enhanced Storage] ❌ ${message}`, { error: error?.message, ...data }),
    success: (message, data = {}) => console.log(`[Enhanced Storage] ✅ ${message}`, data)
};

/**
 * Check if localStorage is supported and accessible
 */
function isLocalStorageSupported() {
    if (typeof window === 'undefined') return false;

    try {
        const testKey = '__enhanced_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        logger.warn('localStorage not supported or accessible', { error: error.message });
        return false;
    }
}

/**
 * Get current storage usage
 */
function getStorageUsage() {
    if (!isLocalStorageSupported()) {
        return { used: 0, percentage: 0, available: 0, maxSize: STORAGE_CONFIG.MAX_SIZE };
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

        const percentage = (used / STORAGE_CONFIG.MAX_SIZE) * 100;
        const available = STORAGE_CONFIG.MAX_SIZE - used;

        return {
            used,
            percentage: Math.round(percentage * 100) / 100,
            available,
            maxSize: STORAGE_CONFIG.MAX_SIZE,
            keyCount
        };
    } catch (error) {
        logger.error('Failed to calculate storage usage', error);
        return { used: 0, percentage: 0, available: 0, maxSize: STORAGE_CONFIG.MAX_SIZE, keyCount: 0 };
    }
}

/**
 * Clean up old and unnecessary data
 */
function performStorageCleanup() {
    if (!isLocalStorageSupported()) return 0;

    let cleanedCount = 0;
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    try {
        const keysToRemove = [];

        // First pass: identify keys to remove
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

        // Second pass: remove identified keys
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
                cleanedCount++;
                logger.info(`Cleaned up old storage item: ${key}`);
            } catch (error) {
                logger.warn(`Failed to remove storage item: ${key}`, error);
            }
        });

        if (cleanedCount > 0) {
            logger.success(`Storage cleanup completed: ${cleanedCount} items removed`);
        }

        return cleanedCount;
    } catch (error) {
        logger.error('Failed to perform storage cleanup', error);
        return 0;
    }
}

/**
 * Compress data to reduce size
 */
function compressData(data) {
    if (!data || typeof data !== 'object') return data;

    const compressed = { ...data };

    // Remove or compress large fields
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
 * Enhanced localStorage setItem with comprehensive error handling
 */
export function setStorageItem(key, value, options = {}) {
    if (!isLocalStorageSupported()) {
        logger.warn('localStorage not supported, skipping storage operation', { key });
        return { success: false, error: 'localStorage not supported' };
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
    if (dataSize > STORAGE_CONFIG.MAX_SIZE * 0.2) { // 20% of max size per item
        logger.warn('Storage item too large', { key, size: dataSize, maxAllowed: STORAGE_CONFIG.MAX_SIZE * 0.2 });
        return { success: false, error: 'Item too large for storage', size: dataSize };
    }

    // Check current storage usage
    const usage = getStorageUsage();
    if (usage.percentage > 95) {
        logger.warn('Storage almost full, performing cleanup', { usage });
        performStorageCleanup();
    }

    // Retry logic for storage operations
    const attemptStorage = (attemptNumber = 1) => {
        try {
            localStorage.setItem(key, serializedData);
            logger.success('Storage item saved successfully', { key, size: dataSize, attempt: attemptNumber });
            return { success: true, size: dataSize, attempt: attemptNumber };
        } catch (error) {
            logger.error(`Storage attempt ${attemptNumber} failed`, error, { key, size: dataSize });

            // Handle specific error types
            if (error.name === 'QuotaExceededError') {
                logger.warn('Storage quota exceeded, attempting cleanup', { attempt: attemptNumber });

                // Perform aggressive cleanup
                const cleanedCount = performStorageCleanup();

                if (cleanedCount > 0 && attemptNumber < STORAGE_CONFIG.RETRY_ATTEMPTS) {
                    // Wait a bit and retry
                    setTimeout(() => {
                        return attemptStorage(attemptNumber + 1);
                    }, STORAGE_CONFIG.RETRY_DELAY * attemptNumber);
                } else {
                    return {
                        success: false,
                        error: 'Storage quota exceeded even after cleanup',
                        originalError: error.name,
                        cleanedCount
                    };
                }
            } else if (error.name === 'SecurityError') {
                logger.error('Storage security error - browser blocked access', error, { key });
                return { success: false, error: 'Storage access blocked by browser', type: 'SecurityError' };
            } else {
                // Generic error
                if (retryOnFailure && attemptNumber < STORAGE_CONFIG.RETRY_ATTEMPTS) {
                    logger.info(`Retrying storage operation (attempt ${attemptNumber + 1})`);
                    setTimeout(() => {
                        return attemptStorage(attemptNumber + 1);
                    }, STORAGE_CONFIG.RETRY_DELAY * attemptNumber);
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
 * Enhanced localStorage getItem with error handling
 */
export function getStorageItem(key, defaultValue = null) {
    if (!isLocalStorageSupported()) {
        logger.warn('localStorage not supported, returning default value', { key });
        return defaultValue;
    }

    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;

        const parsedData = JSON.parse(stored);

        // Check if data has expired
        if (parsedData.expires && Date.now() > parsedData.expires) {
            logger.info('Storage item expired, removing', { key });
            localStorage.removeItem(key);
            return defaultValue;
        }

        return parsedData.value;
    } catch (error) {
        logger.error('Failed to retrieve storage item', error, { key });
        return defaultValue;
    }
}

/**
 * Enhanced localStorage removeItem with error handling
 */
export function removeStorageItem(key) {
    if (!isLocalStorageSupported()) return false;

    try {
        localStorage.removeItem(key);
        logger.success('Storage item removed', { key });
        return true;
    } catch (error) {
        logger.error('Failed to remove storage item', error, { key });
        return false;
    }
}

/**
 * Clear all storage data (with confirmation)
 */
export function clearAllStorage(confirm = false) {
    if (!isLocalStorageSupported()) return false;

    if (!confirm) {
        logger.warn('clearAllStorage called without confirmation');
        return false;
    }

    try {
        localStorage.clear();
        logger.success('All storage data cleared');
        return true;
    } catch (error) {
        logger.error('Failed to clear all storage', error);
        return false;
    }
}

/**
 * Get detailed storage information for debugging
 */
export function getDetailedStorageInfo() {
    if (!isLocalStorageSupported()) {
        return { error: 'localStorage not supported' };
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
            maxSize: STORAGE_CONFIG.MAX_SIZE,
            percentageUsed: Math.round((info.totalSize / STORAGE_CONFIG.MAX_SIZE * 100) * 100) / 100,
            availableSpace: STORAGE_CONFIG.MAX_SIZE - info.totalSize,
            isHealthy: (info.totalSize / STORAGE_CONFIG.MAX_SIZE) < STORAGE_CONFIG.WARNING_THRESHOLD
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * Initialize storage monitoring and cleanup
 */
export function initializeStorageMonitoring() {
    if (!isLocalStorageSupported()) return;

    // Check storage usage periodically
    const checkInterval = setInterval(() => {
        const usage = getStorageUsage();

        if (usage.percentage > STORAGE_CONFIG.CLEANUP_THRESHOLD * 100) {
            logger.warn('Storage usage high, performing cleanup', { usage });
            performStorageCleanup();
        }
    }, 60000); // Check every minute

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        performStorageCleanup();
        clearInterval(checkInterval);
    });

    // Clean up on visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            performStorageCleanup();
        }
    });

    logger.success('Storage monitoring initialized');
}

/**
 * Test storage functionality
 */
export function testStorageFunctionality() {
    if (!isLocalStorageSupported()) {
        return { success: false, error: 'localStorage not supported' };
    }

    try {
        const testKey = '__enhanced_storage_test__';
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

// Initialize storage monitoring when module loads
if (typeof window !== 'undefined') {
    initializeStorageMonitoring();
}






