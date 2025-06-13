/**
 * Form Persistence Configuration System
 * Provides complete control over form data persistence and dialog behavior
 */

// 🔧 CONFIGURATION OPTIONS
export const PERSISTENCE_MODES = {
    DISABLED: 'disabled',           // Never save data, never show dialog, always start fresh
    MANUAL_ONLY: 'manual_only',     // Only save when user explicitly saves, no auto-save
    AUTO_SAVE_NO_DIALOG: 'auto_save_no_dialog',  // Auto-save but never show restoration dialog
    FULL_PERSISTENCE: 'full_persistence'         // Full auto-save with restoration dialog (default)
};

// 🚀 GLOBAL CONFIGURATION
// Change this to control the entire persistence system behavior
export const FORM_PERSISTENCE_CONFIG = {
    // 🔥 FIXED: Change mode to allow normal operation while disabling dialogs
    mode: PERSISTENCE_MODES.AUTO_SAVE_NO_DIALOG, // Allow auto-save but no dialog interruptions

    // 🔧 CRITICAL FIX: Only clear data on actual page refresh, not on state transitions
    clearDataOnPageLoad: false,       // Don't clear data during normal operation
    disableAutoSave: false,          // Allow auto-save to work normally
    disableDialogs: true,            // Keep dialogs disabled as requested
    forceCleanStart: false,          // Don't force clean start during transitions

    // Developer options
    enableDebugLogging: true,        // Keep debug logging for troubleshooting
    showConfigInConsole: true,       // Display current config on page load
};

/**
 * Get the current persistence configuration
 * @returns {Object} Current configuration
 */
export const getPersistenceConfig = () => {
    return FORM_PERSISTENCE_CONFIG;
};

/**
 * Check if persistence is completely disabled
 * @returns {boolean} True if persistence should be disabled
 */
export const isPersistenceDisabled = () => {
    return FORM_PERSISTENCE_CONFIG.mode === PERSISTENCE_MODES.DISABLED ||
        FORM_PERSISTENCE_CONFIG.forceCleanStart;
};

/**
 * Check if auto-save should be disabled
 * @returns {boolean} True if auto-save should be disabled
 */
export const isAutoSaveDisabled = () => {
    return FORM_PERSISTENCE_CONFIG.mode === PERSISTENCE_MODES.DISABLED ||
        FORM_PERSISTENCE_CONFIG.mode === PERSISTENCE_MODES.MANUAL_ONLY ||
        FORM_PERSISTENCE_CONFIG.disableAutoSave;
};

/**
 * Check if persistence dialog should be shown
 * @returns {boolean} True if dialog should be shown
 */
export const shouldShowPersistenceDialog = () => {
    return FORM_PERSISTENCE_CONFIG.mode === PERSISTENCE_MODES.FULL_PERSISTENCE &&
        !FORM_PERSISTENCE_CONFIG.disableDialogs &&
        !FORM_PERSISTENCE_CONFIG.forceCleanStart;
};

/**
 * Check if data should be cleared on page load
 * @returns {boolean} True if data should be cleared
 */
export const shouldClearDataOnLoad = () => {
    return FORM_PERSISTENCE_CONFIG.mode === PERSISTENCE_MODES.DISABLED ||
        FORM_PERSISTENCE_CONFIG.clearDataOnPageLoad ||
        FORM_PERSISTENCE_CONFIG.forceCleanStart;
};

/**
 * Completely clear all form-related storage
 * This is the nuclear option - clears everything
 */
export const nukeAllFormData = () => {
    if (typeof window === 'undefined') return;

    const config = getPersistenceConfig();

    if (config.enableDebugLogging) {
        console.log('🧨 NUKING ALL FORM DATA - Complete reset initiated');
    }

    try {
        // Clear localStorage items
        const localStorageKeys = [
            'eventProposalFormData',
            'formPersistenceData',
            'autoSaveFormData',
            'mockFormData',
            'cedoFormData',
            'proposalFormData'
        ];

        localStorageKeys.forEach(key => {
            localStorage.removeItem(key);
            if (config.enableDebugLogging) {
                console.log(`🗑️ Cleared localStorage: ${key}`);
            }
        });

        // Clear sessionStorage items
        const sessionStorageKeys = [
            'formSessionChoice',
            'lastFormSessionId',
            'formSessionChoiceTimestamp',
            'persistenceDialogShown',
            'userSessionChoice'
        ];

        sessionStorageKeys.forEach(key => {
            sessionStorage.removeItem(key);
            if (config.enableDebugLogging) {
                console.log(`🗑️ Cleared sessionStorage: ${key}`);
            }
        });

        // Clear any other form-related storage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('form') || key.includes('Form') || key.includes('proposal') || key.includes('event'))) {
                localStorage.removeItem(key);
                if (config.enableDebugLogging) {
                    console.log(`🗑️ Cleared additional localStorage: ${key}`);
                }
            }
        }

        if (config.enableDebugLogging) {
            console.log('✅ All form data completely cleared');
        }

    } catch (error) {
        console.error('❌ Error clearing form data:', error);
    }
};

/**
 * Initialize persistence system based on configuration
 * Call this on page load to set up the system according to config
 */
export const initializePersistenceSystem = () => {
    if (typeof window === 'undefined') return;

    const config = getPersistenceConfig();

    if (config.showConfigInConsole) {
        console.log('🔧 FORM PERSISTENCE CONFIG:', config);
        console.log('📋 Current Mode:', config.mode);
        console.log('🚮 Clear on Load:', shouldClearDataOnLoad());
        console.log('💾 Auto-save Disabled:', isAutoSaveDisabled());
        console.log('💬 Dialog Disabled:', !shouldShowPersistenceDialog());
    }

    // 🔧 CRITICAL FIX: Only clear data on actual page refresh, not component re-renders
    // Check if this is a real page load/refresh vs a React component re-render
    const isActualPageLoad = !window.performance.navigation ||
        window.performance.navigation.type === 1 || // TYPE_RELOAD
        window.performance.navigation.type === 0;   // TYPE_NAVIGATE

    // Only clear data if it's an actual page refresh AND clearDataOnPageLoad is true
    if (shouldClearDataOnLoad() && isActualPageLoad) {
        if (config.enableDebugLogging) {
            console.log('🧹 Clearing data on actual page load as configured');
        }
        nukeAllFormData();
    } else if (config.enableDebugLogging) {
        console.log('🔄 Component re-render detected - preserving form data');
    }

    // Set up storage event listeners to prevent external persistence if disabled
    if (isPersistenceDisabled()) {
        const preventPersistence = (e) => {
            if (e.key && (e.key.includes('form') || e.key.includes('Form') || e.key.includes('proposal'))) {
                if (config.enableDebugLogging) {
                    console.log('🚫 Preventing external persistence:', e.key);
                }
                localStorage.removeItem(e.key);
            }
        };

        window.addEventListener('storage', preventPersistence);

        // Return cleanup function
        return () => {
            window.removeEventListener('storage', preventPersistence);
        };
    }
};

/**
 * Enhanced form data handler that respects configuration
 * @param {Object} formData - Form data to potentially save
 * @returns {boolean} True if data was saved, false if saving is disabled
 */
export const handleFormDataPersistence = (formData) => {
    const config = getPersistenceConfig();

    if (isAutoSaveDisabled()) {
        if (config.enableDebugLogging) {
            console.log('🚫 Auto-save disabled - not saving form data');
        }
        return false;
    }

    // If we reach here, saving is allowed
    if (config.enableDebugLogging) {
        console.log('💾 Saving form data:', formData);
    }

    try {
        localStorage.setItem('eventProposalFormData', JSON.stringify(formData));
        return true;
    } catch (error) {
        console.error('❌ Error saving form data:', error);
        return false;
    }
};

/**
 * Get form data if persistence is enabled
 * @returns {Object|null} Form data or null if persistence is disabled
 */
export const getPersistedFormData = () => {
    if (isPersistenceDisabled()) {
        return null;
    }

    try {
        const data = localStorage.getItem('eventProposalFormData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Error loading form data:', error);
        return null;
    }
};

// 🚀 QUICK CONFIGURATION PRESETS
export const PRESET_CONFIGS = {
    // For development/testing - always start clean
    DEVELOPMENT: {
        mode: PERSISTENCE_MODES.DISABLED,
        clearDataOnPageLoad: true,
        disableAutoSave: true,
        disableDialogs: true,
        forceCleanStart: true,
        enableDebugLogging: true,
        showConfigInConsole: true
    },

    // For production - full persistence
    PRODUCTION: {
        mode: PERSISTENCE_MODES.FULL_PERSISTENCE,
        clearDataOnPageLoad: false,
        disableAutoSave: false,
        disableDialogs: false,
        forceCleanStart: false,
        enableDebugLogging: false,
        showConfigInConsole: false
    },

    // For user preference - auto-save but no dialog interruptions
    USER_FRIENDLY: {
        mode: PERSISTENCE_MODES.AUTO_SAVE_NO_DIALOG,
        clearDataOnPageLoad: false,
        disableAutoSave: false,
        disableDialogs: true,
        forceCleanStart: false,
        enableDebugLogging: false,
        showConfigInConsole: false
    }
};

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of preset to apply
 */
export const applyPresetConfig = (presetName) => {
    if (PRESET_CONFIGS[presetName]) {
        Object.assign(FORM_PERSISTENCE_CONFIG, PRESET_CONFIGS[presetName]);
        console.log(`🔧 Applied preset configuration: ${presetName}`);
        console.log('📋 New config:', FORM_PERSISTENCE_CONFIG);
    } else {
        console.error(`❌ Unknown preset: ${presetName}`);
    }
};

// Export all functions and configs
export default {
    PERSISTENCE_MODES,
    FORM_PERSISTENCE_CONFIG,
    PRESET_CONFIGS,
    getPersistenceConfig,
    isPersistenceDisabled,
    isAutoSaveDisabled,
    shouldShowPersistenceDialog,
    shouldClearDataOnLoad,
    nukeAllFormData,
    initializePersistenceSystem,
    handleFormDataPersistence,
    getPersistedFormData,
    applyPresetConfig
}; 