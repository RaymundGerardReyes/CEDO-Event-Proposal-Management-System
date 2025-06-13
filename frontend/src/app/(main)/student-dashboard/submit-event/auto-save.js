"use client"


/**
 * Comprehensive form data persistence system
 * Handles all 5 sections of the event submission form
 */

const STORAGE_KEY = 'eventProposalFormData';
const AUTOSAVE_DEBOUNCE_MS = 1000; // 1 second debounce for auto-save
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB max for localStorage

// Debounce function to prevent excessive saves
let saveTimeout = null;

/**
 * Save form data to localStorage with error handling
 * @param {Object} formData - Complete form data object
 * @param {boolean} immediate - Skip debouncing if true
 */
export const saveFormData = (formData, immediate = false) => {
  const performSave = () => {
    try {
      // Clean and prepare data for storage
      const cleanData = cleanFormDataForStorage(formData);

      // Check storage size
      const dataString = JSON.stringify(cleanData);
      if (dataString.length > MAX_STORAGE_SIZE) {
        console.warn('Form data too large for localStorage, truncating...');
        // Keep only essential fields if data is too large
        const essentialData = extractEssentialData(cleanData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(essentialData));
      } else {
        localStorage.setItem(STORAGE_KEY, dataString);
      }

      // Update last save timestamp
      localStorage.setItem(STORAGE_KEY + '_timestamp', Date.now().toString());

      console.log('✅ Form data auto-saved to localStorage:', {
        size: dataString.length,
        sections: Object.keys(cleanData),
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to save form data to localStorage:', error);

      // Try to clear old data and save again
      if (error.name === 'QuotaExceededError') {
        console.log('localStorage quota exceeded, clearing old data...');
        clearOldFormData();
        try {
          const essentialData = extractEssentialData(cleanFormDataForStorage(formData));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(essentialData));
          return true;
        } catch (retryError) {
          console.error('❌ Failed to save even essential data:', retryError);
        }
      }
      return false;
    }
  };

  if (immediate) {
    // Clear any pending saves and save immediately
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    return performSave();
  } else {
    // Debounced save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      performSave();
      saveTimeout = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  }
};

/**
 * Load form data from localStorage
 * @returns {Object} Restored form data or empty object
 */
export const loadFormData = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_KEY + '_timestamp');

    if (!storedData) {
      console.log('📄 No saved form data found');
      return {};
    }

    const parsedData = JSON.parse(storedData);
    const saveAge = timestamp ? Date.now() - parseInt(timestamp) : 0;
    const saveAgeHours = saveAge / (1000 * 60 * 60);

    console.log('✅ Loaded form data from localStorage:', {
      sections: Object.keys(parsedData),
      saveAge: `${saveAgeHours.toFixed(1)} hours ago`,
      dataSize: storedData.length
    });

    // Restore file references (files themselves can't be stored in localStorage)
    const restoredData = restoreFileReferences(parsedData);

    return restoredData;
  } catch (error) {
    console.error('❌ Failed to load form data from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_timestamp');
    return {};
  }
};

/**
 * Clean form data for storage (remove non-serializable objects)
 * @param {Object} formData 
 * @returns {Object} Cleaned form data
 */
const cleanFormDataForStorage = (formData) => {
  const cleaned = { ...formData };

  // Handle File objects - store metadata only
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] instanceof File) {
      cleaned[key] = {
        _isFile: true,
        name: cleaned[key].name,
        size: cleaned[key].size,
        type: cleaned[key].type,
        lastModified: cleaned[key].lastModified
      };
    }

    // Convert Date objects to ISO strings
    if (cleaned[key] instanceof Date) {
      cleaned[key] = cleaned[key].toISOString();
    }

    // Handle nested objects
    if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
      cleaned[key] = cleanFormDataForStorage(cleaned[key]);
    }
  });

  return cleaned;
};

/**
 * Restore file references from stored metadata
 * @param {Object} data 
 * @returns {Object} Data with file references restored
 */
const restoreFileReferences = (data) => {
  const restored = { ...data };

  Object.keys(restored).forEach(key => {
    if (restored[key] && typeof restored[key] === 'object' && restored[key]._isFile) {
      // Create a placeholder for file reference
      restored[key] = {
        ...restored[key],
        _isRestoredFile: true,
        toString: () => restored[key].name
      };
    }
  });

  return restored;
};

/**
 * Extract only essential data when storage is full
 * @param {Object} formData 
 * @returns {Object} Essential data only
 */
const extractEssentialData = (formData) => {
  const essential = {
    // Section 1 - Overview
    currentSection: formData.currentSection,
    hasActiveProposal: formData.hasActiveProposal,
    proposalStatus: formData.proposalStatus,

    // Section 2 - Organization Info (Critical)
    organizationName: formData.organizationName,
    organizationDescription: formData.organizationDescription,
    organizationType: formData.organizationType,
    organizationTypes: formData.organizationTypes,
    eventType: formData.eventType,
    contactName: formData.contactName,
    contactEmail: formData.contactEmail,
    contactPhone: formData.contactPhone,

    // Section 3 - School Event (Essential fields only)
    schoolEventName: formData.schoolEventName,
    schoolVenue: formData.schoolVenue,
    schoolStartDate: formData.schoolStartDate,
    schoolEndDate: formData.schoolEndDate,
    schoolEventType: formData.schoolEventType,
    schoolEventMode: formData.schoolEventMode,

    // Section 4 - Community Event (Essential fields only)  
    communityEventName: formData.communityEventName,
    communityVenue: formData.communityVenue,
    communityStartDate: formData.communityStartDate,
    communityEndDate: formData.communityEndDate,
    communityEventType: formData.communityEventType,
    communityEventMode: formData.communityEventMode,

    // Section 5 - Reporting
    reportStatus: formData.reportStatus,
    accomplishmentReport: formData.accomplishmentReport
  };

  // Remove undefined/null values to save space
  Object.keys(essential).forEach(key => {
    if (essential[key] === undefined || essential[key] === null) {
      delete essential[key];
    }
  });

  return essential;
};

/**
 * Clear old form data from localStorage
 */
const clearOldFormData = () => {
  const keysToRemove = [];

  // Find old form-related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('eventProposal') || key.includes('formData'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('🧹 Cleared old form data keys:', keysToRemove);
};

/**
 * Clear all form data from localStorage
 */
export const clearFormData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_timestamp');
    console.log('🧹 Cleared all form data from localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear form data:', error);
    return false;
  }
};

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
export const getStorageInfo = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_KEY + '_timestamp');

    return {
      hasData: !!data,
      dataSize: data ? data.length : 0,
      dataSizeKB: data ? (data.length / 1024).toFixed(2) : 0,
      lastSaved: timestamp ? new Date(parseInt(timestamp)) : null,
      storageUsed: JSON.stringify(localStorage).length,
      storageAvailable: MAX_STORAGE_SIZE
    };
  } catch (error) {
    return { hasData: false, error: error.message };
  }
};

/**
 * Setup automatic form persistence with page unload warning
 * @param {Function} getFormData - Function to get current form data
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 */
export const setupFormPersistence = (getFormData, hasUnsavedChanges = false) => {
  // Auto-save on page visibility change (when user switches tabs)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      const formData = getFormData();
      if (formData && Object.keys(formData).length > 0) {
        saveFormData(formData, true); // Immediate save
      }
    }
  };

  // Warn before page unload if there are unsaved changes
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChanges) {
      // Auto-save before leaving
      const formData = getFormData();
      if (formData && Object.keys(formData).length > 0) {
        saveFormData(formData, true); // Immediate save
      }

      // Show browser warning
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  };

  // Auto-save periodically
  const autoSaveInterval = setInterval(() => {
    const formData = getFormData();
    if (formData && Object.keys(formData).length > 0) {
      saveFormData(formData);
    }
  }, 30000); // Every 30 seconds

  // Add event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    clearInterval(autoSaveInterval);

    // Final save on cleanup
    const formData = getFormData();
    if (formData && Object.keys(formData).length > 0) {
      saveFormData(formData, true);
    }
  };
};

/**
 * Debug function to inspect current storage state
 */
export const debugStorage = () => {
  console.log('🔍 Form Storage Debug Info:');
  console.log('Storage Info:', getStorageInfo());
  console.log('Current Data:', loadFormData());

  // List all localStorage keys related to forms
  const formKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('form') || key.includes('event') || key.includes('proposal'))) {
      formKeys.push(key);
    }
  }
  console.log('Form-related localStorage keys:', formKeys);
};
