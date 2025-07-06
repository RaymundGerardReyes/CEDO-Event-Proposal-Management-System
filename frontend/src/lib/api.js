
/**
 * Centralized API Configuration
 * Ensures consistent API URL handling across the frontend
 */

// Base API URL with fallback
export const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    GOOGLE: `${API_BASE_URL}/auth/google`,
    STATUS: `${API_BASE_URL}/auth/oauth/me`,
    LOGOUT: `${API_BASE_URL}/auth/oauth/logout`,
  },

  // Config endpoints
  CONFIG: `${API_BASE_URL}/api/config`,

  // Profile endpoints
  PROFILE: {
    BASE: `${API_BASE_URL}/api/profile`,
    ORGANIZATION: `${API_BASE_URL}/api/profile/organization`,
    PHONE: `${API_BASE_URL}/api/profile/phone`,
  },

  // Health and status endpoints
  HEALTH: `${API_BASE_URL}/health`,
  DB_CHECK: `${API_BASE_URL}/api/db-check`,
  TABLES_CHECK: `${API_BASE_URL}/api/tables-check`,

  // Proposals endpoints
  PROPOSALS: `${API_BASE_URL}/api/proposals`,

  // Admin endpoints
  ADMIN: {
    STATS: `${API_BASE_URL}/api/admin/stats`,
    REPORTS: `${API_BASE_URL}/api/admin/reports`,
  },

  // MongoDB unified endpoints
  MONGODB_UNIFIED: `${API_BASE_URL}/api/mongodb-unified`,
};

/**
 * Generic fetch wrapper with error handling
 */
export async function apiFetch(endpoint, options = {}) {
  const url = typeof endpoint === 'string' ? endpoint : endpoint;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include', // Include cookies for session management
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet(endpoint, options = {}) {
  return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export async function apiPut(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete(endpoint, options = {}) {
  return apiFetch(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Load configuration from backend
 */
export async function loadApiConfig() {
  try {
    const config = await apiGet(API_ENDPOINTS.CONFIG);
    return config;
  } catch (error) {
    console.error('Failed to load API configuration:', error);
    throw error;
  }
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth() {
  try {
    const health = await apiGet(API_ENDPOINTS.HEALTH);
    return health.status === 'ok';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Get API base URL for debugging
 */
export function getApiBaseUrl() {
  return API_BASE_URL;
}

// Export for backward compatibility
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  loadApiConfig,
  checkBackendHealth,
  getApiBaseUrl,
};
