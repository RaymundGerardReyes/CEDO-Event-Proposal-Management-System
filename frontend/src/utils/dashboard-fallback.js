/**
 * Dashboard Fallback Data Provider
 * 
 * Provides fallback data structures for dashboard components when:
 * - API calls fail
 * - User is not authenticated
 * - Data is loading
 * - Network issues occur
 */

import { logInfo, logWarning } from './error-logger';

/**
 * Get fallback admin dashboard statistics
 * @param {string} reason - Reason for using fallback data
 * @returns {Object} Fallback admin stats
 */
export function getAdminDashboardFallback(reason = 'unknown') {
    logWarning('Dashboard Fallback', `Using admin dashboard fallback data`, { reason });

    return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        newSinceYesterday: 0,
        approvalRate: '0%',
        dayOverDayPct: '0%',
        isPositiveGrowth: true,
        lastUpdated: new Date().toISOString(),
        isFallback: true,
        fallbackReason: reason
    };
}

/**
 * Get fallback student dashboard statistics
 * @param {string} reason - Reason for using fallback data
 * @returns {Object} Fallback student stats
 */
export function getStudentDashboardFallback(reason = 'unknown') {
    logWarning('Dashboard Fallback', `Using student dashboard fallback data`, { reason });

    return {
        sdpCredits: {
            totalEarned: 0,
            pending: 0,
            totalRequired: 36
        },
        events: {
            upcoming: 0,
            total: 0,
            approved: 0,
            pending: 0,
            draft: 0,
            rejected: 0
        },
        progress: {
            overallPercentage: 0,
            overallText: "0 of 36 credits",
            categories: {
                leadership: { current: 0, total: 12, percentage: 0 },
                communityService: { current: 0, total: 12, percentage: 0 },
                professionalDevelopment: { current: 0, total: 12, percentage: 0 }
            }
        },
        recentEvents: [],
        lastUpdated: new Date().toISOString(),
        isFallback: true,
        fallbackReason: reason
    };
}

/**
 * Get fallback user profile data
 * @param {string} reason - Reason for using fallback data
 * @returns {Object} Fallback user profile
 */
export function getUserProfileFallback(reason = 'unknown') {
    logWarning('Dashboard Fallback', `Using user profile fallback data`, { reason });

    return {
        id: null,
        name: 'Guest User',
        email: '',
        role: 'guest',
        organization: '',
        organization_type: '',
        avatar: null,
        is_approved: false,
        created_at: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        isFallback: true,
        fallbackReason: reason
    };
}

/**
 * Get fallback recent events data
 * @param {string} reason - Reason for using fallback data
 * @returns {Array} Fallback recent events
 */
export function getRecentEventsFallback(reason = 'unknown') {
    logWarning('Dashboard Fallback', `Using recent events fallback data`, { reason });

    return [];
}

/**
 * Get fallback notifications data
 * @param {string} reason - Reason for using fallback data
 * @returns {Array} Fallback notifications
 */
export function getNotificationsFallback(reason = 'unknown') {
    logWarning('Dashboard Fallback', `Using notifications fallback data`, { reason });

    return [];
}

/**
 * Enhanced fallback data provider that determines appropriate fallback based on context
 * @param {string} dataType - Type of data needed ('admin', 'student', 'user', 'events', 'notifications')
 * @param {Object} options - Additional options
 * @param {string} options.reason - Reason for using fallback
 * @param {Object} options.context - Additional context information
 * @returns {Object|Array} Appropriate fallback data
 */
export function getFallbackData(dataType, options = {}) {
    const { reason = 'data_fetch_failed', context = {} } = options;

    logInfo('Dashboard Fallback', `Providing fallback data for ${dataType}`, {
        reason,
        context,
        timestamp: new Date().toISOString()
    });

    switch (dataType) {
        case 'admin':
        case 'admin-dashboard':
            return getAdminDashboardFallback(reason);

        case 'student':
        case 'student-dashboard':
            return getStudentDashboardFallback(reason);

        case 'user':
        case 'profile':
            return getUserProfileFallback(reason);

        case 'events':
        case 'recent-events':
            return getRecentEventsFallback(reason);

        case 'notifications':
            return getNotificationsFallback(reason);

        default:
            logWarning('Dashboard Fallback', `Unknown data type requested: ${dataType}`, { reason, context });
            return {
                error: `Unknown data type: ${dataType}`,
                isFallback: true,
                fallbackReason: reason,
                lastUpdated: new Date().toISOString()
            };
    }
}

/**
 * Check if data is fallback data
 * @param {Object} data - Data to check
 * @returns {boolean} True if data is fallback data
 */
export function isFallbackData(data) {
    return data && typeof data === 'object' && data.isFallback === true;
}

/**
 * Get fallback data with retry mechanism
 * @param {Function} dataFetcher - Function that fetches the actual data
 * @param {string} fallbackType - Type of fallback data to use if all retries fail
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @param {string} options.reason - Reason for potential fallback
 * @returns {Promise<Object>} Either the fetched data or fallback data
 */
export async function getDataWithFallback(dataFetcher, fallbackType, options = {}) {
    const { maxRetries = 3, retryDelay = 1000, reason = 'fetch_failed' } = options;

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logInfo('Dashboard Fallback', `Attempting to fetch data (attempt ${attempt}/${maxRetries})`);

            const data = await dataFetcher();

            if (data) {
                logInfo('Dashboard Fallback', `Data fetch successful on attempt ${attempt}`);
                return data;
            }

            throw new Error('Data fetcher returned null/undefined');

        } catch (error) {
            lastError = error;

            logWarning('Dashboard Fallback', `Data fetch attempt ${attempt} failed`, {
                error: error.message,
                attempt,
                maxRetries,
                willRetry: attempt < maxRetries
            });

            if (attempt < maxRetries) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    // All retries failed, use fallback data
    logWarning('Dashboard Fallback', `All ${maxRetries} fetch attempts failed, using fallback data`, {
        lastError: lastError?.message,
        fallbackType
    });

    return getFallbackData(fallbackType, {
        reason: `${reason}_after_${maxRetries}_retries`,
        context: { lastError: lastError?.message }
    });
}

/**
 * Merge fallback data with partial real data
 * @param {Object} realData - Partial real data
 * @param {Object} fallbackData - Complete fallback data
 * @returns {Object} Merged data with real data taking precedence
 */
export function mergeWithFallback(realData, fallbackData) {
    if (!realData || typeof realData !== 'object') {
        return fallbackData;
    }

    const merged = { ...fallbackData, ...realData };

    // Mark as partially fallback if we used fallback data
    if (fallbackData.isFallback) {
        merged.isPartialFallback = true;
        merged.fallbackFields = Object.keys(fallbackData).filter(
            key => !(key in realData) && key !== 'isFallback' && key !== 'fallbackReason'
        );
    }

    return merged;
}


