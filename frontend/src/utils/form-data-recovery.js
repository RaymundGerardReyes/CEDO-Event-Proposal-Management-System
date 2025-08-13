/**
 * Form Data Recovery Utilities
 * 
 * Purpose: Comprehensive form data recovery and validation system
 * Key approaches: Multi-source recovery, validation, error handling, fallback mechanisms
 */

/**
 * Storage keys used across the application
 */
const STORAGE_KEYS = {
    FORM_DATA: 'eventProposalFormData',
    SESSION_DATA: 'cedoFormData',
    TOKEN: 'cedo_token',
    DRAFT_DATA: 'draftData',
    BACKUP_DATA: 'formDataBackup'
};

/**
 * Required Section 2 fields that must be present
 */
const REQUIRED_SECTION2_FIELDS = {
    organizationName: 'Organization Name',
    contactEmail: 'Contact Email',
    contactName: 'Contact Name',
    organizationType: 'Organization Type'
};

/**
 * Validates if Section 2 data is complete
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result
 */
export function validateSection2Data(data) {
    const missingFields = [];
    const validationErrors = {};

    // Check each required field
    Object.entries(REQUIRED_SECTION2_FIELDS).forEach(([field, displayName]) => {
        const value = data[field];

        if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(field);
            validationErrors[field] = `${displayName} is required`;
        } else if (field === 'contactEmail' && !isValidEmail(value)) {
            missingFields.push(field);
            validationErrors[field] = 'Please enter a valid email address';
        }
    });

    return {
        isValid: missingFields.length === 0,
        missingFields,
        validationErrors,
        hasData: Object.keys(data).some(key => REQUIRED_SECTION2_FIELDS[key] && data[key])
    };
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Recovers Section 2 data from multiple sources
 * @param {Object} currentFormData - Current form data
 * @param {Object} localStorageFormData - Data from localStorage
 * @returns {Object} Recovered form data
 */
export async function recoverSection2Data(currentFormData = {}, localStorageFormData = {}) {
    console.log('🔄 Starting Section 2 data recovery...');

    let recoveredData = { ...currentFormData };
    const recoverySources = [];

    // 1. Check if current formData already has Section 2 data
    const currentValidation = validateSection2Data(currentFormData);
    if (currentValidation.isValid) {
        console.log('✅ Section 2 data already present in current formData');
        return { data: currentFormData, source: 'current', isValid: true };
    }

    // 2. Try localStorage data
    if (localStorageFormData && Object.keys(localStorageFormData).length > 0) {
        const localStorageValidation = validateSection2Data(localStorageFormData);
        if (localStorageValidation.isValid) {
            console.log('✅ Recovered Section 2 data from localStorage');
            recoverySources.push('localStorage');
            recoveredData = { ...recoveredData, ...localStorageFormData };
        }
    }

    // 3. Try sessionStorage
    try {
        const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION_DATA);
        if (sessionData) {
            const parsedSessionData = JSON.parse(sessionData);
            const sessionValidation = validateSection2Data(parsedSessionData);
            if (sessionValidation.isValid) {
                console.log('✅ Recovered Section 2 data from sessionStorage');
                recoverySources.push('sessionStorage');
                recoveredData = { ...recoveredData, ...parsedSessionData };
            }
        }
    } catch (error) {
        console.warn('⚠️ Failed to parse sessionStorage data:', error);
    }

    // 4. Try multiple localStorage keys
    const possibleKeys = [
        STORAGE_KEYS.FORM_DATA,
        'formData',
        'submitEventFormData',
        'eventFormData',
        'proposalFormData'
    ];

    for (const key of possibleKeys) {
        try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                const keyValidation = validateSection2Data(parsedData);
                if (keyValidation.isValid) {
                    console.log(`✅ Recovered Section 2 data from ${key}`);
                    recoverySources.push(key);
                    recoveredData = { ...recoveredData, ...parsedData };
                    break; // Use the first valid data found
                }
            }
        } catch (error) {
            console.warn(`⚠️ Failed to parse ${key} data:`, error);
        }
    }

    // 5. Try draft API as last resort
    try {
        const draftData = await recoverFromDraftAPI();
        if (draftData && validateSection2Data(draftData).isValid) {
            console.log('✅ Recovered Section 2 data from draft API');
            recoverySources.push('draftAPI');
            recoveredData = { ...recoveredData, ...draftData };
        }
    } catch (error) {
        console.warn('⚠️ Failed to recover from draft API:', error);
    }

    // 6. Try backup data
    try {
        const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA);
        if (backupData) {
            const parsedBackupData = JSON.parse(backupData);
            const backupValidation = validateSection2Data(parsedBackupData);
            if (backupValidation.isValid) {
                console.log('✅ Recovered Section 2 data from backup');
                recoverySources.push('backup');
                recoveredData = { ...recoveredData, ...parsedBackupData };
            }
        }
    } catch (error) {
        console.warn('⚠️ Failed to parse backup data:', error);
    }

    // Final validation
    const finalValidation = validateSection2Data(recoveredData);

    console.log('🔄 Recovery completed:', {
        sources: recoverySources,
        isValid: finalValidation.isValid,
        missingFields: finalValidation.missingFields
    });

    return {
        data: recoveredData,
        source: recoverySources.length > 0 ? recoverySources[0] : 'none',
        isValid: finalValidation.isValid,
        missingFields: finalValidation.missingFields,
        validationErrors: finalValidation.validationErrors
    };
}

/**
 * Recovers data from draft API
 * @returns {Promise<Object|null>} Draft data or null
 */
async function recoverFromDraftAPI() {
    try {
        // Extract draftId from URL
        const pathParts = window.location.pathname.split('/');
        const draftId = pathParts[pathParts.length - 1];

        if (!draftId || draftId.length < 10) {
            return null;
        }

        // Get authentication token
        let token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            const match = document.cookie.match(/(?:^|; )cedo_token=([^;]*)/);
            if (match) token = match[1];
        }

        if (!token) {
            console.warn('⚠️ No authentication token found for draft API recovery');
            return null;
        }

        // Fetch draft data
        const response = await fetch(`/api/drafts/${draftId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`Draft API returned ${response.status}`);
        }

        const draftData = await response.json();

        // Extract organization data from draft response
        if (draftData.payload?.organization) {
            const orgData = draftData.payload.organization;
            return {
                organizationName: orgData.organizationName,
                contactEmail: orgData.contactEmail,
                contactName: orgData.contactName || orgData.contactPerson,
                contactPhone: orgData.contactPhone,
                organizationType: orgData.organizationType,
                id: draftData.id,
                proposalId: draftData.id
            };
        }

        return null;
    } catch (error) {
        console.warn('⚠️ Draft API recovery failed:', error.message);
        return null;
    }
}

/**
 * Creates a backup of form data
 * @param {Object} formData - Form data to backup
 */
export function createFormDataBackup(formData) {
    try {
        const backupData = {
            ...formData,
            backupTimestamp: Date.now(),
            backupVersion: '1.0'
        };

        localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, JSON.stringify(backupData));
        console.log('✅ Form data backup created');
    } catch (error) {
        console.error('❌ Failed to create form data backup:', error);
    }
}

/**
 * Restores form data from backup
 * @returns {Object|null} Restored data or null
 */
export function restoreFormDataBackup() {
    try {
        const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA);
        if (!backupData) {
            return null;
        }

        const parsedData = JSON.parse(backupData);
        console.log('✅ Form data restored from backup');
        return parsedData;
    } catch (error) {
        console.error('❌ Failed to restore form data backup:', error);
        return null;
    }
}

/**
 * Enhanced form data consolidation with validation
 * @param {Object} localFormData - Local section data
 * @param {Object} formData - Parent form data
 * @param {Object} localStorageFormData - localStorage data
 * @returns {Promise<Object>} Consolidated and validated form data
 */
export async function consolidateFormData(localFormData, formData, localStorageFormData) {
    console.log('🔄 Starting form data consolidation...');

    // Attempt to recover Section 2 data
    const recoveryResult = await recoverSection2Data(formData, localStorageFormData);

    if (!recoveryResult.isValid) {
        console.error('❌ Section 2 data recovery failed:', recoveryResult.missingFields);
        throw new Error(`Missing required Section 2 data: ${recoveryResult.missingFields.join(', ')}`);
    }

    // Consolidate all data sources
    const consolidatedData = {
        ...recoveryResult.data,  // Recovered Section 2 data
        ...localFormData         // Current section data
    };

    // Create backup of consolidated data
    createFormDataBackup(consolidatedData);

    console.log('✅ Form data consolidation completed');
    return consolidatedData;
}

/**
 * Validates complete form data before submission
 * @param {Object} formData - Complete form data
 * @returns {Object} Validation result
 */
export function validateCompleteFormData(formData) {
    const errors = [];
    const warnings = [];

    // Section 2 validation
    const section2Validation = validateSection2Data(formData);
    if (!section2Validation.isValid) {
        errors.push(...Object.values(section2Validation.validationErrors));
    }

    // Section 3 validation (if present)
    const section3Fields = [
        'schoolEventName', 'schoolVenue', 'schoolStartDate',
        'schoolEndDate', 'schoolTimeStart', 'schoolTimeEnd',
        'schoolEventType', 'schoolEventMode', 'schoolReturnServiceCredit'
    ];

    const missingSection3Fields = section3Fields.filter(field =>
        !formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')
    );

    if (missingSection3Fields.length > 0) {
        warnings.push(`Missing Section 3 fields: ${missingSection3Fields.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasSection2Data: section2Validation.isValid,
        hasSection3Data: missingSection3Fields.length === 0
    };
}

/**
 * Handles form data recovery with user-friendly error messages
 * @param {Object} options - Recovery options
 * @returns {Promise<Object>} Recovery result with user messages
 */
export async function handleFormDataRecovery(options = {}) {
    const {
        currentFormData = {},
        localStorageFormData = {},
        showUserMessage = true,
        toast = null
    } = options;

    try {
        const recoveryResult = await recoverSection2Data(currentFormData, localStorageFormData);

        if (showUserMessage && toast) {
            if (recoveryResult.isValid) {
                toast({
                    title: "Data Recovered",
                    description: `Successfully recovered organization data from ${recoveryResult.source}`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Missing Organization Data",
                    description: "Please complete Section 2 (Organization Information) first. Required: Organization Name, Contact Email, Contact Name, and Organization Type.",
                    variant: "destructive",
                });
            }
        }

        return recoveryResult;
    } catch (error) {
        console.error('❌ Form data recovery failed:', error);

        if (showUserMessage && toast) {
            toast({
                title: "Data Recovery Failed",
                description: "Unable to recover form data. Please refresh the page and try again.",
                variant: "destructive",
            });
        }

        return {
            data: currentFormData,
            source: 'none',
            isValid: false,
            error: error.message
        };
    }
} 