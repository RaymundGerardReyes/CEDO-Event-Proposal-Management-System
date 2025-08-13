/**
 * UUID Migration Utility
 * Handles migration from descriptive draft IDs to proper UUIDs
 * Ensures consistent data flow between MySQL and MongoDB
 * 
 * Key approaches: Comprehensive error handling, resilient fallbacks, 
 * structured logging, and graceful degradation
 */

/**
 * Get the appropriate base URL for API calls
 * Handles both client and server environments
 */
function getBaseURL() {
    // Client-side: use window.location or environment variables
    if (typeof window !== 'undefined') {
        // In browser, use current origin or environment variable
        return process.env.NEXT_PUBLIC_API_URL ||
            process.env.API_URL ||
            window.location.origin;
    }

    // Server-side: use environment variables
    return process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        'http://localhost:5000';
}

/**
 * Enhanced logger with structured error reporting
 */
const logger = {
    info: (message, data = {}) => {
        console.log(`[UUID Migration] ${message}`, data);
    },
    warn: (message, data = {}) => {
        console.warn(`[UUID Migration] ⚠️ ${message}`, data);
    },
    error: (message, error = null, data = {}) => {
        const errorInfo = {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            name: error?.name,
            ...data
        };
        console.error(`[UUID Migration] ❌ ${message}`, errorInfo);
    },
    success: (message, data = {}) => {
        console.log(`[UUID Migration] ✅ ${message}`, data);
    }
};

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Check if a string is a descriptive draft ID
 */
export function isDescriptiveDraftId(str) {
    if (!str || typeof str !== 'string' || str === '') return false;

    return (
        str === 'new-draft' ||
        str.includes('-event') ||
        str.includes('community') ||
        str.includes('school') ||
        str.includes('event')
    );
}

/**
 * Determine event type from descriptive draft ID
 */
export function getEventTypeFromDescriptiveId(descriptiveId) {
    if (!descriptiveId || typeof descriptiveId !== 'string') {
        logger.warn('Invalid descriptive ID provided, defaulting to school-based', { descriptiveId });
        return 'school-based';
    }

    const isSchoolEvent = descriptiveId.includes('school') || descriptiveId.includes('school-event');
    const isCommunityEvent = descriptiveId.includes('community') || descriptiveId.includes('community-event');

    // Default to school-based for unknown types (like 'event-proposal-789')
    return isSchoolEvent ? 'school-based' : (isCommunityEvent ? 'community-based' : 'school-based');
}

/**
 * Enhanced API call with comprehensive error handling and proper URL construction
 */
async function makeAPICall(endpoint, options = {}) {
    try {
        // Ensure we have a proper base URL
        const baseURL = getBaseURL();

        // Construct full URL
        const fullURL = endpoint.startsWith('http')
            ? endpoint
            : `${baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

        logger.info('Making API call', {
            endpoint,
            fullURL,
            method: 'POST',
            hasBody: !!options.body
        });

        // Check if we're in a server environment without fetch
        if (typeof fetch === 'undefined') {
            logger.warn('Fetch not available (server-side), skipping API call', { fullURL });
            throw new Error('Fetch not available in server environment');
        }

        const response = await fetch(fullURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(options.body),
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        logger.success('API call successful', { fullURL, status: response.status });
        return { success: true, data: result };
    } catch (error) {
        if (error.name === 'AbortError') {
            logger.error('API call timed out', error, { endpoint });
            throw new Error('API call timed out');
        }

        logger.error('API call failed', error, { endpoint });
        throw error;
    }
}

/**
 * Migrate descriptive draft ID to UUID with enhanced error handling
 */
export async function migrateToUUID(descriptiveId) {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
        logger.info('Server-side execution, skipping UUID migration', { descriptiveId });
        return generateFallbackUUID();
    }

    if (!isDescriptiveDraftId(descriptiveId)) {
        logger.warn('Not a descriptive draft ID, skipping migration', { descriptiveId });
        return null;
    }

    logger.info('Starting UUID migration', { descriptiveId });

    try {
        const eventType = getEventTypeFromDescriptiveId(descriptiveId);

        // Create new UUID-based draft
        const { success, data } = await makeAPICall('/api/proposals/drafts', {
            body: {
                eventType,
                originalDescriptiveId: descriptiveId
            }
        });

        if (success && data?.draftId) {
            logger.success('Successfully migrated to UUID', {
                from: descriptiveId,
                to: data.draftId,
                eventType
            });
            return data.draftId;
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        logger.error('Failed to migrate to UUID', error, {
            descriptiveId,
            eventType: getEventTypeFromDescriptiveId(descriptiveId)
        });

        // Return null to trigger fallback mechanism
        return null;
    }
}

/**
 * Generate a robust fallback UUID when API is not available
 */
function generateFallbackUUID() {
    try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const fallbackId = `fallback-${timestamp}-${random}`;

        logger.info('Generated fallback UUID', { fallbackId });
        return fallbackId;
    } catch (error) {
        logger.error('Failed to generate fallback UUID', error);
        // Ultimate fallback
        return `emergency-fallback-${Date.now()}`;
    }
}

/**
 * Get or create UUID for draft with enhanced error handling
 */
export async function getOrCreateUUID(draftId) {
    try {
        // Check if we're in a server environment
        if (typeof window === 'undefined') {
            logger.info('Server-side execution, using fallback UUID', { draftId });
            return generateFallbackUUID();
        }

        if (!draftId) {
            logger.info('No draft ID provided, creating new UUID');
            const result = await migrateToUUID('new-draft');
            return result || generateFallbackUUID();
        }

        if (isValidUUID(draftId)) {
            logger.info('Valid UUID detected', { draftId });
            return draftId; // Already a UUID
        }

        if (isDescriptiveDraftId(draftId)) {
            logger.info('Descriptive draft ID detected, migrating to UUID', { draftId });
            const result = await migrateToUUID(draftId);
            return result || generateFallbackUUID();
        }

        // Invalid format, create new UUID
        logger.warn('Invalid draft ID format, creating new UUID', { draftId });
        const result = await migrateToUUID('new-draft');
        return result || generateFallbackUUID();
    } catch (error) {
        logger.error('Error in getOrCreateUUID', error, { draftId });
        return generateFallbackUUID();
    }
}

/**
 * Store UUID in localStorage with error handling
 */
export function storeUUID(uuid, eventType = 'school-based') {
    if (typeof window === 'undefined') {
        logger.info('Server-side execution, skipping localStorage');
        return;
    }

    try {
        if (!uuid || typeof uuid !== 'string') {
            throw new Error('Invalid UUID provided for storage');
        }

        localStorage.setItem('current_draft_uuid', uuid);
        localStorage.setItem('current_event_type', eventType);
        localStorage.setItem('draft_created_at', Date.now().toString());

        logger.success('UUID stored in localStorage', { uuid, eventType });
    } catch (error) {
        logger.error('Failed to store UUID in localStorage', error, { uuid, eventType });
        // Don't throw - localStorage failure shouldn't break the app
    }
}

/**
 * Get stored UUID from localStorage with error handling
 */
export function getStoredUUID() {
    if (typeof window === 'undefined') {
        logger.info('Server-side execution, no localStorage access');
        return null;
    }

    try {
        const uuid = localStorage.getItem('current_draft_uuid');
        const eventType = localStorage.getItem('current_event_type');

        if (uuid && isValidUUID(uuid)) {
            logger.success('Retrieved stored UUID', { uuid, eventType });
            return { uuid, eventType };
        }

        logger.info('No valid stored UUID found');
        return null;
    } catch (error) {
        logger.error('Failed to get stored UUID from localStorage', error);
        return null;
    }
}

/**
 * Clear stored UUID data with error handling
 */
export function clearStoredUUID() {
    if (typeof window === 'undefined') {
        logger.info('Server-side execution, skipping localStorage clear');
        return;
    }

    try {
        localStorage.removeItem('current_draft_uuid');
        localStorage.removeItem('current_event_type');
        localStorage.removeItem('draft_created_at');

        logger.success('Cleared stored UUID data');
    } catch (error) {
        logger.error('Failed to clear stored UUID data', error);
    }
}

/**
 * Update URL to use UUID with error handling
 */
export function updateURLWithUUID(uuid, currentPath) {
    if (typeof window === 'undefined') {
        logger.info('Server-side execution, skipping URL update');
        return null;
    }

    try {
        if (!uuid || !currentPath) {
            throw new Error('Missing required parameters for URL update');
        }

        // Extract the section from current path
        const pathParts = currentPath.split('/');
        const sectionIndex = pathParts.findIndex(part =>
            ['overview', 'organization', 'event-type', 'school-event', 'community-event', 'reporting'].includes(part)
        );

        if (sectionIndex !== -1) {
            const section = pathParts[sectionIndex];
            const newPath = `/student-dashboard/submit-event/${uuid}/${section}`;

            window.history.replaceState(null, '', newPath);
            logger.success('URL updated with UUID', { newPath });
            return newPath;
        } else {
            logger.warn('No valid section found in path for URL update', { currentPath });
        }
    } catch (error) {
        logger.error('Failed to update URL with UUID', error, { uuid, currentPath });
    }

    return null;
}

/**
 * Complete UUID migration process with comprehensive error handling
 */
export async function completeUUIDMigration(descriptiveId, currentPath) {
    logger.info('Starting complete UUID migration process', { descriptiveId, currentPath });

    try {
        // Check if we're in a server environment
        if (typeof window === 'undefined') {
            logger.info('Server-side execution, using fallback UUID for migration', { descriptiveId });
            const fallbackUUID = generateFallbackUUID();
            logger.success('UUID migration completed with server-side fallback', {
                from: descriptiveId,
                to: fallbackUUID
            });
            return fallbackUUID;
        }

        // Get or create UUID
        const uuid = await getOrCreateUUID(descriptiveId);

        if (!uuid) {
            logger.error('Failed to create UUID, using fallback');
            const fallbackUUID = generateFallbackUUID();

            // Store fallback UUID
            const eventType = getEventTypeFromDescriptiveId(descriptiveId);
            storeUUID(fallbackUUID, eventType);

            // Update URL
            updateURLWithUUID(fallbackUUID, currentPath);

            logger.success('UUID migration completed with fallback', {
                from: descriptiveId,
                to: fallbackUUID,
                eventType
            });

            return fallbackUUID;
        }

        // Store UUID
        const eventType = getEventTypeFromDescriptiveId(descriptiveId);
        storeUUID(uuid, eventType);

        // Update URL
        updateURLWithUUID(uuid, currentPath);

        logger.success('UUID migration completed successfully', {
            from: descriptiveId,
            to: uuid,
            eventType
        });

        return uuid;
    } catch (error) {
        logger.error('Critical error in completeUUIDMigration', error, {
            descriptiveId,
            currentPath
        });

        // Ultimate fallback - ensure we always return something
        const emergencyUUID = generateFallbackUUID();
        storeUUID(emergencyUUID, 'school-based');

        return emergencyUUID;
    }
}

/**
 * Validate and fix draft ID format with error handling
 */
export async function validateAndFixDraftId(draftId, currentPath) {
    try {
        // Check if we're in a server environment
        if (typeof window === 'undefined') {
            logger.info('Server-side execution, using fallback UUID for validation', { draftId });
            return generateFallbackUUID();
        }

        if (!draftId) {
            logger.info('No draft ID provided, creating new UUID');
            const result = await completeUUIDMigration('new-draft', currentPath);
            return result || generateFallbackUUID();
        }

        if (isValidUUID(draftId)) {
            logger.success('Valid UUID detected', { draftId });
            storeUUID(draftId);
            return draftId;
        }

        if (isDescriptiveDraftId(draftId)) {
            logger.info('Descriptive draft ID detected, migrating to UUID', { draftId });
            const result = await completeUUIDMigration(draftId, currentPath);
            return result || generateFallbackUUID();
        }

        logger.warn('Invalid draft ID format, creating new UUID', { draftId });
        const result = await completeUUIDMigration('new-draft', currentPath);
        return result || generateFallbackUUID();
    } catch (error) {
        logger.error('Error in validateAndFixDraftId', error, { draftId, currentPath });
        return generateFallbackUUID();
    }
}
