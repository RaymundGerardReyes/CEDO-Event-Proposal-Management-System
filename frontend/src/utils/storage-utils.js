/**
 * Enhanced localStorage Utilities
 * 
 * Comprehensive localStorage management with:
 * - Form data persistence and recovery
 * - File upload handling via data URLs
 * - UUID-based storage isolation
 * - Storage monitoring and cleanup
 * - Error handling and fallbacks
 * 
 * Key approaches: Security-first design, comprehensive error handling, 
 * performance optimization, and user experience enhancement
 */

// Import localStorage fix functions
import {
    getDetailedStorageInfo as fixedGetDetailedStorageInfo,
    getStorageItem as fixedGetStorageItem,
    removeStorageItem as fixedRemoveStorageItem,
    setStorageItem as fixedSetStorageItem
} from './localStorage-fix';

// Storage configuration
const STORAGE_CONFIG = {
    // Maximum storage size (5MB)
    MAX_SIZE: 5 * 1024 * 1024,

    // Debounce delay for auto-save
    DEBOUNCE_DELAY: 500,

    // Data expiration times
    EXPIRATION: {
        FORM_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
        USER_PREFERENCES: 30 * 24 * 60 * 60 * 1000, // 30 days
        TEMP_DATA: 24 * 60 * 60 * 1000, // 24 hours
    },

    // Storage keys
    KEYS: {
        EVENT_FORM: 'eventForm',
        USER_PREFERENCES: 'cedo_user_preferences',
        AUTH_TOKEN: 'cedo_token',
        DRAFT_UUID: 'current_draft_uuid',
        EVENT_TYPE: 'current_event_type',
        BACKUP_DATA: 'formDataBackup',
        STORAGE_META: 'storage_metadata'
    }
};

/**
 * Enhanced logger for storage operations
 */
const logger = {
    info: (message, data = {}) => {
        console.log(`[Storage] ${message}`, data);
    },
    warn: (message, data = {}) => {
        console.warn(`[Storage] ⚠️ ${message}`, data);
    },
    error: (message, error = null, data = {}) => {
        console.error(`[Storage] ❌ ${message}`, { error: error?.message, ...data });
    },
    success: (message, data = {}) => {
        console.log(`[Storage] ✅ ${message}`, data);
    }
};

/**
 * Compress storage data by optimizing file storage
 */
function compressStorageData(data) {
    if (!data || typeof data !== 'object') return data;

    const compressed = { ...data };

    // Optimize file storage - keep essential data but compress large data URLs
    if (compressed.gpoa && compressed.gpoa.dataUrl) {
        const gpoaData = compressed.gpoa;
        // Only compress if the data URL is very large (>500KB)
        if (gpoaData.dataUrl && gpoaData.dataUrl.length > 500000) {
            // Store file metadata separately and use a reference
            compressed.gpoa = {
                name: gpoaData.name,
                size: gpoaData.size,
                type: gpoaData.type,
                timestamp: gpoaData.timestamp || Date.now(),
                hasData: true,
                // Keep a compressed version or store separately
                dataUrl: gpoaData.dataUrl // Keep the data URL for now
            };
        }
    }

    if (compressed.projectProposal && compressed.projectProposal.dataUrl) {
        const proposalData = compressed.projectProposal;
        // Only compress if the data URL is very large (>500KB)
        if (proposalData.dataUrl && proposalData.dataUrl.length > 500000) {
            compressed.projectProposal = {
                name: proposalData.name,
                size: proposalData.size,
                type: proposalData.type,
                timestamp: proposalData.timestamp || Date.now(),
                hasData: true,
                dataUrl: proposalData.dataUrl // Keep the data URL for now
            };
        }
    }

    return compressed;
}

/**
 * Check if there's enough storage space available
 */
function hasStorageSpace(requiredSize) {
    try {
        const testKey = '__storage_test__';
        const testData = 'x'.repeat(requiredSize);

        // Try to store test data
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            return false;
        }
        // For other errors, assume space is available
        return true;
    }
}

/**
 * Check if localStorage is available and supported
 */
export function isStorageSupported() {
    if (typeof window === 'undefined') return false;

    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        logger.warn('localStorage not supported', { error: error.message });
        return false;
    }
}

/**
 * Get current storage usage
 */
export function getStorageUsage() {
    if (!isStorageSupported()) return { used: 0, percentage: 0, available: 0 };

    try {
        let used = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }

        const percentage = (used / STORAGE_CONFIG.MAX_SIZE) * 100;
        const available = STORAGE_CONFIG.MAX_SIZE - used;

        return { used, percentage, available };
    } catch (error) {
        logger.error('Failed to calculate storage usage', error);
        return { used: 0, percentage: 0, available: 0 };
    }
}

/**
 * Check if storage is getting full
 */
export function isStorageNearFull(threshold = 80) {
    const usage = getStorageUsage();
    return usage.percentage > threshold;
}

/**
 * Generate storage key for form data
 */
export function generateFormStorageKey(uuid, stepName) {
    return `${STORAGE_CONFIG.KEYS.EVENT_FORM}:${uuid}:${stepName}`;
}

/**
 * Store file data separately to prevent data loss
 */
export function storeFileData(uuid, fieldName, fileData) {
    if (!isStorageSupported()) {
        logger.warn('localStorage not supported for file storage', { fieldName });
        return false;
    }

    try {
        const fileKey = `file_${uuid}_${fieldName}`;
        const storageData = {
            value: fileData,
            timestamp: Date.now(),
            expires: Date.now() + STORAGE_CONFIG.EXPIRATION.FORM_DATA,
            version: '1.0'
        };

        const serializedData = JSON.stringify(storageData);
        const dataSize = serializedData.length;

        logger.info('Attempting to store file data', {
            fieldName,
            dataSize,
            maxAllowed: STORAGE_CONFIG.MAX_SIZE * 0.3,
            uuid: uuid.substring(0, 8) + '...'
        });

        // Check if file is too large
        if (dataSize > STORAGE_CONFIG.MAX_SIZE * 0.3) { // 30% of max size for files
            logger.warn('File too large for storage', {
                fieldName,
                size: dataSize,
                maxAllowed: STORAGE_CONFIG.MAX_SIZE * 0.3
            });
            return false;
        }

        // Check available storage space
        if (!hasStorageSpace(dataSize)) {
            logger.warn('Insufficient storage space for file', { fieldName, dataSize });
            return false;
        }

        localStorage.setItem(fileKey, serializedData);
        logger.success('File data stored successfully', { fieldName, size: dataSize });
        return true;
    } catch (error) {
        logger.error('Failed to store file data', error, {
            fieldName,
            errorName: error.name,
            errorMessage: error.message
        });
        return false;
    }
}

/**
 * Retrieve file data from separate storage
 */
export function retrieveFileData(uuid, fieldName) {
    if (!isStorageSupported()) return null;

    try {
        const fileKey = `file_${uuid}_${fieldName}`;
        const stored = localStorage.getItem(fileKey);

        if (!stored) return null;

        const storageData = JSON.parse(stored);

        // Check if data has expired
        if (storageData.expires && Date.now() > storageData.expires) {
            localStorage.removeItem(fileKey);
            return null;
        }

        return storageData.value;
    } catch (error) {
        logger.error('Failed to retrieve file data', error, { fieldName });
        return null;
    }
}

/**
 * Enhanced localStorage setter with comprehensive error handling
 * Now uses the localStorage fix implementation
 */
export function setStorageItem(key, value, options = {}) {
    // Use the localStorage fix implementation directly
    return fixedSetStorageItem(key, value, options);
}

/**
 * Enhanced localStorage getter with error handling
 * Now uses the localStorage fix implementation
 */
export function getStorageItem(key, defaultValue = null) {
    return fixedGetStorageItem(key, defaultValue);
}

/**
 * Remove storage item with error handling
 * Now uses the localStorage fix implementation
 */
export function removeStorageItem(key) {
    return fixedRemoveStorageItem(key);
}

/**
 * Enhanced cleanup function with better error handling
 */
function performEnhancedCleanup() {
    if (!isStorageSupported()) return 0;

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
            logger.success(`Enhanced storage cleanup completed: ${cleanedCount} items removed`);
        }

        return cleanedCount;
    } catch (error) {
        logger.error('Failed to perform enhanced storage cleanup', error);
        return 0;
    }
}

/**
 * Clean up expired data
 */
export function cleanupExpiredData() {
    if (!isStorageSupported()) return;

    try {
        let cleanedCount = 0;
        const now = Date.now();

        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                try {
                    const stored = localStorage.getItem(key);
                    const parsedData = JSON.parse(stored);

                    if (parsedData.expires && now > parsedData.expires) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                } catch (error) {
                    // Skip invalid entries
                    continue;
                }
            }
        }

        if (cleanedCount > 0) {
            logger.success('Cleaned up expired data', { count: cleanedCount });
        }
    } catch (error) {
        logger.error('Failed to cleanup expired data', error);
    }
}

/**
 * Clean up old form data (older than 7 days)
 */
export function cleanupOldFormData() {
    if (!isStorageSupported()) return;

    try {
        let cleanedCount = 0;
        const cutoffTime = Date.now() - STORAGE_CONFIG.EXPIRATION.FORM_DATA;

        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_CONFIG.KEYS.EVENT_FORM)) {
                try {
                    const stored = localStorage.getItem(key);
                    const parsedData = JSON.parse(stored);

                    if (parsedData.timestamp && parsedData.timestamp < cutoffTime) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                } catch (error) {
                    // Skip invalid entries
                    continue;
                }
            }
        }

        if (cleanedCount > 0) {
            logger.success('Cleaned up old form data', { count: cleanedCount });
        }
    } catch (error) {
        logger.error('Failed to cleanup old form data', error);
    }
}

/**
 * Save form data with auto-save capabilities
 */
export function saveFormData(uuid, stepName, data, options = {}) {
    const key = generateFormStorageKey(uuid, stepName);
    const expires = STORAGE_CONFIG.EXPIRATION.FORM_DATA;

    logger.info('Starting form data save', {
        uuid: uuid.substring(0, 8) + '...',
        stepName,
        hasData: !!data,
        dataType: typeof data
    });

    // Handle file data separately to prevent data loss
    if (data && typeof data === 'object') {
        const processedData = { ...data };

        // Store file data separately if it exists
        if (processedData.gpoa && processedData.gpoa.dataUrl) {
            logger.info('Processing GPOA file data', {
                hasDataUrl: !!processedData.gpoa.dataUrl,
                dataUrlLength: processedData.gpoa.dataUrl?.length || 0,
                fileName: processedData.gpoa.name
            });

            const gpoaFileData = processedData.gpoa;
            const fileStored = storeFileData(uuid, 'gpoa', gpoaFileData);
            if (fileStored) {
                // Keep only metadata in main data, file content is stored separately
                processedData.gpoa = {
                    name: gpoaFileData.name,
                    size: gpoaFileData.size,
                    type: gpoaFileData.type,
                    timestamp: gpoaFileData.timestamp || Date.now(),
                    hasData: true
                };
                logger.success('GPOA file stored separately');
            } else {
                logger.warn('Failed to store GPOA file separately, keeping in main data');
            }
        }

        if (processedData.projectProposal && processedData.projectProposal.dataUrl) {
            logger.info('Processing Project Proposal file data', {
                hasDataUrl: !!processedData.projectProposal.dataUrl,
                dataUrlLength: processedData.projectProposal.dataUrl?.length || 0,
                fileName: processedData.projectProposal.name
            });

            const proposalFileData = processedData.projectProposal;
            const fileStored = storeFileData(uuid, 'projectProposal', proposalFileData);
            if (fileStored) {
                // Keep only metadata in main data, file content is stored separately
                processedData.projectProposal = {
                    name: proposalFileData.name,
                    size: proposalFileData.size,
                    type: proposalFileData.type,
                    timestamp: proposalFileData.timestamp || Date.now(),
                    hasData: true
                };
                logger.success('Project Proposal file stored separately');
            } else {
                logger.warn('Failed to store Project Proposal file separately, keeping in main data');
            }
        }

        const result = setStorageItem(key, processedData, { expires, ...options });
        logger.info('Form data save completed', { success: result.success, key, details: result });
        return result.success || false;
    }

    const result = setStorageItem(key, data, { expires, ...options });
    logger.info('Simple form data save completed', { success: result.success, key, details: result });
    return result.success || false;
}

/**
 * Load form data with fallback options
 */
export function loadFormData(uuid, stepName, defaultValue = null) {
    const key = generateFormStorageKey(uuid, stepName);
    const data = getStorageItem(key, defaultValue);

    // Restore file data from separate storage if it exists
    if (data && typeof data === 'object') {
        const restoredData = { ...data };

        // Restore GPOA file data
        if (restoredData.gpoa && restoredData.gpoa.hasData) {
            const fileData = retrieveFileData(uuid, 'gpoa');
            if (fileData) {
                restoredData.gpoa = fileData;
            }
        }

        // Restore Project Proposal file data
        if (restoredData.projectProposal && restoredData.projectProposal.hasData) {
            const fileData = retrieveFileData(uuid, 'projectProposal');
            if (fileData) {
                restoredData.projectProposal = fileData;
            }
        }

        return restoredData;
    }

    return data;
}

/**
 * Remove form data
 */
export function removeFormData(uuid, stepName) {
    const key = generateFormStorageKey(uuid, stepName);

    // Also remove associated file data
    if (isStorageSupported()) {
        try {
            localStorage.removeItem(`file_${uuid}_gpoa`);
            localStorage.removeItem(`file_${uuid}_projectProposal`);
        } catch (error) {
            logger.warn('Failed to remove file data', error);
        }
    }

    return removeStorageItem(key);
}

/**
 * Save file data as data URL
 */
export function saveFileData(file, dataUrl) {
    if (!file || !dataUrl) return null;

    return {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: dataUrl,
        timestamp: Date.now()
    };
}

/**
 * Restore file from data URL
 */
export async function restoreFileFromDataUrl(fileData) {
    if (!fileData?.dataUrl) return null;

    try {
        const response = await fetch(fileData.dataUrl);
        const blob = await response.blob();
        return new File([blob], fileData.name || 'file', { type: fileData.type || blob.type });
    } catch (error) {
        logger.error('Failed to restore file from data URL', error);
        return null;
    }
}

/**
 * Create form data backup
 */
export function createFormDataBackup(uuid, formData) {
    const backupData = {
        ...formData,
        backupTimestamp: Date.now(),
        uuid,
        version: '1.0'
    };

    const success = setStorageItem(STORAGE_CONFIG.KEYS.BACKUP_DATA, backupData);
    if (success) {
        logger.success('Form data backup created', { uuid });
    }
    return success;
}

/**
 * Restore form data from backup
 */
export function restoreFormDataBackup() {
    const backupData = getStorageItem(STORAGE_CONFIG.KEYS.BACKUP_DATA);
    if (backupData) {
        logger.success('Form data restored from backup', { uuid: backupData.uuid });
    }
    return backupData;
}

/**
 * Get all form data for a UUID
 */
export function getAllFormData(uuid) {
    if (!isStorageSupported()) return {};

    const formData = {};

    try {
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(`${STORAGE_CONFIG.KEYS.EVENT_FORM}:${uuid}:`)) {
                const stepName = key.split(':').pop();
                const data = getStorageItem(key);
                if (data) {
                    formData[stepName] = data;
                }
            }
        }
    } catch (error) {
        logger.error('Failed to get all form data', error, { uuid });
    }

    return formData;
}

/**
 * Clear all form data for a UUID
 */
export function clearAllFormData(uuid) {
    if (!isStorageSupported()) return false;

    try {
        let clearedCount = 0;

        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                // Clear form data
                if (key.startsWith(`${STORAGE_CONFIG.KEYS.EVENT_FORM}:${uuid}:`)) {
                    localStorage.removeItem(key);
                    clearedCount++;
                }
                // Clear file data
                if (key.startsWith(`file_${uuid}_`)) {
                    localStorage.removeItem(key);
                    clearedCount++;
                }
            }
        }

        logger.success('Cleared all form and file data', { uuid, count: clearedCount });
        return true;
    } catch (error) {
        logger.error('Failed to clear all form data', error, { uuid });
        return false;
    }
}

/**
 * Export form data for backup/transfer
 */
export function exportFormData(uuid) {
    const formData = getAllFormData(uuid);
    const metadata = {
        uuid,
        exportTimestamp: Date.now(),
        version: '1.0',
        data: formData
    };

    return JSON.stringify(metadata, null, 2);
}

/**
 * Import form data from backup/transfer
 */
export function importFormData(exportedData) {
    try {
        const metadata = JSON.parse(exportedData);

        if (!metadata.uuid || !metadata.data) {
            throw new Error('Invalid export data format');
        }

        const { uuid, data } = metadata;

        // Save each step's data
        Object.entries(data).forEach(([stepName, stepData]) => {
            saveFormData(uuid, stepName, stepData);
        });

        logger.success('Form data imported successfully', { uuid });
        return true;
    } catch (error) {
        logger.error('Failed to import form data', error);
        return false;
    }
}

/**
 * Initialize storage monitoring
 */
export function initializeStorageMonitoring() {
    if (!isStorageSupported()) return;

    // Check storage usage periodically
    setInterval(() => {
        const usage = getStorageUsage();

        if (usage.percentage > 90) {
            logger.warn('Storage almost full', { usage });
            cleanupExpiredData();
            cleanupOldFormData();
        }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        cleanupExpiredData();
    });

    logger.success('Storage monitoring initialized');
}

/**
 * Get detailed storage information for debugging
 * Now uses the localStorage fix implementation
 */
export function getDetailedStorageInfo() {
    return fixedGetDetailedStorageInfo();
}

/**
 * Get storage statistics
 */
export function getStorageStats() {
    if (!isStorageSupported()) return null;

    try {
        const usage = getStorageUsage();
        let formDataCount = 0;
        let totalFormDataSize = 0;

        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                if (key.startsWith(STORAGE_CONFIG.KEYS.EVENT_FORM)) {
                    formDataCount++;
                    totalFormDataSize += localStorage[key].length;
                }
            }
        }

        return {
            usage,
            formDataCount,
            totalFormDataSize,
            isSupported: true
        };
    } catch (error) {
        logger.error('Failed to get storage stats', error);
        return null;
    }
}

// Storage monitoring is initialized manually when needed

/**
 * Clear all localStorage data (for debugging/testing)
 */
export function clearAllLocalStorage() {
    if (!isStorageSupported()) return false;

    try {
        const keysToRemove = [];
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        logger.info('Cleared all localStorage data', { count: keysToRemove.length });
        return true;
    } catch (error) {
        logger.error('Failed to clear all localStorage data', error);
        return false;
    }
}
