/**
 * Unified Event Proposal Storage Utility
 * Purpose: Single source of truth for event proposal data
 * Key approaches: Unified localStorage key, comprehensive data structure, backward compatibility
 */

// ===================================================================
// STORAGE CONSTANTS
// ===================================================================

const STORAGE_KEY = 'eventProposalDraft';
const LEGACY_KEYS = [
    'eventProposalFormData',
    'cedoFormData',
    'eventTypeSelection',
    'selectedEventType'
];

// ===================================================================
// DATA STRUCTURE
// ===================================================================

/**
 * Default event proposal draft structure
 */
const DEFAULT_DRAFT_STRUCTURE = {
    id: null,
    draftId: null,
    status: 'draft',
    currentSection: 'overview',
    sections: {
        overview: {
            title: '',
            purpose: '',
            objectives: '',
            expectedOutcomes: ''
        },
        eventType: {
            eventType: null, // 'school-based' or 'community-based'
            selectedEventType: null
        },
        organization: {
            organizationName: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            organizationType: null
        },
        details: {
            // School event fields
            schoolEventName: '',
            schoolVenue: '',
            schoolStartDate: '',
            schoolEndDate: '',
            schoolTimeStart: '',
            schoolTimeEnd: '',
            schoolEventType: '',
            schoolEventMode: '',
            schoolSDPCredits: '',
            schoolTargetAudience: [],
            schoolGPOAFile: null,
            schoolProposalFile: null,

            // Community event fields
            communityEventName: '',
            communityVenue: '',
            communityStartDate: '',
            communityEndDate: '',
            communityTimeStart: '',
            communityTimeEnd: '',
            communityEventType: '',
            communityEventMode: '',
            communitySDPCredits: '',
            communityTargetAudience: [],
            communityGPOAFile: null,
            communityProposalFile: null
        },
        reporting: {
            eventStatus: '',
            attendanceCount: 0,
            preRegistrationCount: 0,
            reportDescription: '',
            accomplishmentReport: '',
            preRegistrationList: null,
            finalAttendanceList: null
        }
    },
    metadata: {
        createdAt: null,
        updatedAt: null,
        lastSavedSection: null
    }
};

// ===================================================================
// CORE FUNCTIONS
// ===================================================================

/**
 * Get the complete event proposal draft from localStorage
 * @param {string} draftId - The draft ID
 * @returns {Object} The complete draft data
 */
export function getEventProposalDraft(draftId = null) {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return createNewDraft(draftId);
        }

        const draft = JSON.parse(stored);

        // Ensure draft has the complete structure
        return mergeWithDefaultStructure(draft, draftId);
    } catch (error) {
        console.error('❌ Error getting event proposal draft:', error);
        return createNewDraft(draftId);
    }
}

/**
 * Save the complete event proposal draft to localStorage
 * @param {Object} draft - The complete draft data
 * @param {string} section - Optional section being updated
 */
export function saveEventProposalDraft(draft, section = null) {
    try {
        // Update metadata
        draft.metadata = {
            ...draft.metadata,
            updatedAt: new Date().toISOString(),
            lastSavedSection: section || draft.currentSection
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        console.log('✅ Event proposal draft saved:', { section, draftId: draft.draftId });
    } catch (error) {
        console.error('❌ Error saving event proposal draft:', error);
        throw error;
    }
}

/**
 * Update a specific section of the draft
 * @param {string} section - The section to update
 * @param {Object} data - The data to update
 * @param {string} draftId - The draft ID
 * @returns {Object} The updated draft
 */
export function updateDraftSection(section, data, draftId = null) {
    const draft = getEventProposalDraft(draftId);

    // Update the specific section
    draft.sections[section] = {
        ...draft.sections[section],
        ...data
    };

    // Update current section if provided
    if (section) {
        draft.currentSection = section;
    }

    saveEventProposalDraft(draft, section);
    return draft;
}

/**
 * Get a specific section from the draft
 * @param {string} section - The section to get
 * @param {string} draftId - The draft ID
 * @returns {Object} The section data
 */
export function getDraftSection(section, draftId = null) {
    const draft = getEventProposalDraft(draftId);
    return draft.sections[section] || {};
}

/**
 * Clear the event proposal draft
 */
export function clearEventProposalDraft() {
    try {
        localStorage.removeItem(STORAGE_KEY);

        // Also clear legacy keys for cleanup
        LEGACY_KEYS.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('🧹 Event proposal draft cleared');
    } catch (error) {
        console.error('❌ Error clearing event proposal draft:', error);
    }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Create a new draft with default structure
 * @param {string} draftId - The draft ID
 * @returns {Object} New draft with default structure
 */
function createNewDraft(draftId = null) {
    const newDraft = {
        ...DEFAULT_DRAFT_STRUCTURE,
        id: draftId,
        draftId: draftId,
        metadata: {
            ...DEFAULT_DRAFT_STRUCTURE.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    saveEventProposalDraft(newDraft);
    return newDraft;
}

/**
 * Merge existing draft with default structure to ensure completeness
 * @param {Object} existingDraft - Existing draft data
 * @param {string} draftId - The draft ID
 * @returns {Object} Merged draft with complete structure
 */
function mergeWithDefaultStructure(existingDraft, draftId = null) {
    const merged = {
        ...DEFAULT_DRAFT_STRUCTURE,
        ...existingDraft,
        id: existingDraft.id || draftId,
        draftId: existingDraft.draftId || draftId,
        sections: {
            ...DEFAULT_DRAFT_STRUCTURE.sections,
            ...existingDraft.sections
        },
        metadata: {
            ...DEFAULT_DRAFT_STRUCTURE.metadata,
            ...existingDraft.metadata
        }
    };

    // Ensure all sections exist
    Object.keys(DEFAULT_DRAFT_STRUCTURE.sections).forEach(section => {
        if (!merged.sections[section]) {
            merged.sections[section] = DEFAULT_DRAFT_STRUCTURE.sections[section];
        }
    });

    return merged;
}

/**
 * Get event type from draft (unified function)
 * @param {Object} draft - The draft data
 * @returns {string} Event type ('school-based' or 'community-based')
 */
export function getEventType(draft) {
    if (!draft) return 'school-based';

    // Check multiple sources in order of priority
    const sources = [
        draft.sections?.eventType?.eventType,
        draft.sections?.eventType?.selectedEventType,
        draft.sections?.organization?.organizationType,
        'school-based' // Default fallback
    ];

    for (const source of sources) {
        if (source && ['school-based', 'community-based'].includes(source)) {
            return source;
        }
    }

    return 'school-based';
}

/**
 * Migrate legacy localStorage data to unified structure
 * @param {string} draftId - The draft ID
 * @returns {Object} Migrated draft data
 */
export function migrateLegacyData(draftId = null) {
    try {
        const draft = getEventProposalDraft(draftId);
        let hasMigrated = false;

        // Migrate from legacy keys
        LEGACY_KEYS.forEach(key => {
            const legacyData = localStorage.getItem(key);
            if (legacyData) {
                try {
                    const parsed = JSON.parse(legacyData);

                    // Map legacy data to new structure
                    if (key === 'eventProposalFormData' || key === 'cedoFormData') {
                        draft.sections.organization = {
                            ...draft.sections.organization,
                            organizationName: parsed.organizationName || '',
                            contactName: parsed.contactName || '',
                            contactEmail: parsed.contactEmail || '',
                            contactPhone: parsed.contactPhone || '',
                            organizationType: parsed.organizationType || null
                        };
                        hasMigrated = true;
                    } else if (key === 'eventTypeSelection') {
                        draft.sections.eventType = {
                            ...draft.sections.eventType,
                            eventType: parsed.eventType || null,
                            selectedEventType: parsed.eventType || null
                        };
                        hasMigrated = true;
                    } else if (key === 'selectedEventType') {
                        draft.sections.eventType = {
                            ...draft.sections.eventType,
                            selectedEventType: parsed || null
                        };
                        hasMigrated = true;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to parse legacy data from ${key}:`, error);
                }
            }
        });

        if (hasMigrated) {
            saveEventProposalDraft(draft);
            console.log('✅ Legacy data migrated to unified structure');
        }

        return draft;
    } catch (error) {
        console.error('❌ Error migrating legacy data:', error);
        return getEventProposalDraft(draftId);
    }
}

/**
 * Export draft data for API submission
 * @param {Object} draft - The draft data
 * @param {string} eventType - The event type
 * @returns {Object} Formatted data for API
 */
export function exportDraftForAPI(draft, eventType) {
    const baseData = {
        organizationName: draft.sections.organization.organizationName,
        contactName: draft.sections.organization.contactName,
        contactEmail: draft.sections.organization.contactEmail,
        contactPhone: draft.sections.organization.contactPhone,
        eventType: eventType
    };

    if (eventType === 'school-based') {
        return {
            ...baseData,
            eventName: draft.sections.details.schoolEventName,
            venue: draft.sections.details.schoolVenue,
            startDate: draft.sections.details.schoolStartDate,
            endDate: draft.sections.details.schoolEndDate,
            timeStart: draft.sections.details.schoolTimeStart,
            timeEnd: draft.sections.details.schoolTimeEnd,
            eventType: draft.sections.details.schoolEventType,
            eventMode: draft.sections.details.schoolEventMode,
            sdpCredits: draft.sections.details.schoolSDPCredits,
            targetAudience: draft.sections.details.schoolTargetAudience,
            gpoaFile: draft.sections.details.schoolGPOAFile,
            proposalFile: draft.sections.details.schoolProposalFile
        };
    } else {
        return {
            ...baseData,
            eventName: draft.sections.details.communityEventName,
            venue: draft.sections.details.communityVenue,
            startDate: draft.sections.details.communityStartDate,
            endDate: draft.sections.details.communityEndDate,
            timeStart: draft.sections.details.communityTimeStart,
            timeEnd: draft.sections.details.communityTimeEnd,
            eventType: draft.sections.details.communityEventType,
            eventMode: draft.sections.details.communityEventMode,
            sdpCredits: draft.sections.details.communitySDPCredits,
            targetAudience: draft.sections.details.communityTargetAudience,
            gpoaFile: draft.sections.details.communityGPOAFile,
            proposalFile: draft.sections.details.communityProposalFile
        };
    }
}

// ===================================================================
// EXPORTS
// ===================================================================

export {
    DEFAULT_DRAFT_STRUCTURE, LEGACY_KEYS, STORAGE_KEY
};
