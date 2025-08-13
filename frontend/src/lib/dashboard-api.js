/**
 * Dashboard API utilities for fetching user statistics and data
 */

import { getToken } from '../utils/auth-utils';
import { createError, logError } from '../utils/error-logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Fetch dashboard statistics for the authenticated user
 * @returns {Promise<Object>} Dashboard statistics
 */
export const fetchDashboardStats = async () => {
    try {
        const token = getToken();

        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch dashboard statistics');
        }

        return data.stats;
    } catch (error) {
        const enhancedError = logError('Dashboard Stats API', error, {
            endpoint: `${API_BASE_URL}/api/dashboard/stats`,
            hasToken: !!getToken()
        });

        // Create a more descriptive error for the UI
        const uiError = createError(
            enhancedError.message || 'Failed to fetch dashboard statistics',
            'DASHBOARD_STATS_ERROR',
            { originalError: enhancedError }
        );

        throw uiError;
    }
};

/**
 * Fetch recent events for the authenticated user
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of events to fetch (default: 10)
 * @param {string} options.status - Filter by status (optional)
 * @returns {Promise<Object>} Recent events data
 */
export const fetchRecentEvents = async (options = {}) => {
    try {
        const token = getToken();

        if (!token) {
            throw new Error('Authentication token not found');
        }

        const { limit = 10, status } = options;
        const queryParams = new URLSearchParams({
            limit: limit.toString(),
            ...(status && { status })
        });

        const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-events?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch recent events');
        }

        return data.events;
    } catch (error) {
        console.error('Error fetching recent events:', error);
        throw error;
    }
};

/**
 * Get cached dashboard stats with fallback to default values
 * @returns {Promise<Object>} Dashboard statistics with fallback values
 */
export const getDashboardStatsWithFallback = async () => {
    return getDataWithFallback(
        fetchDashboardStats,
        'student-dashboard',
        {
            maxRetries: 2,
            retryDelay: 1000,
            reason: 'dashboard_stats_fetch_failed'
        }
    );
};

/**
 * Fetch admin dashboard statistics with fallback support
 * @returns {Promise<Object>} Admin dashboard statistics with fallback values
 */
export const fetchAdminDashboardStats = async () => {
    try {
        const token = getToken();

        if (!token) {
            throw createError('Authentication token not found', 'AUTH_TOKEN_MISSING');
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw createError(
                errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                'ADMIN_STATS_FETCH_ERROR'
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw createError(data.message || 'Failed to fetch admin dashboard statistics', 'ADMIN_STATS_ERROR');
        }

        return data.data;
    } catch (error) {
        logError('Admin Dashboard Stats API', error, {
            endpoint: `${API_BASE_URL}/api/admin/stats`,
            hasToken: !!getToken()
        });

        throw error;
    }
};

/**
 * Get admin dashboard stats with fallback support
 * @returns {Promise<Object>} Admin dashboard statistics with fallback values
 */
export const getAdminDashboardStatsWithFallback = async () => {
    return getDataWithFallback(
        fetchAdminDashboardStats,
        'admin-dashboard',
        {
            maxRetries: 2,
            retryDelay: 1000,
            reason: 'admin_dashboard_stats_fetch_failed'
        }
    );
}; 