/**
 * Centralized API Configuration and Utilities
 * Provides consistent API handling across the frontend with both fetch and axios support
 */

import axios from 'axios';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Base API URL with fallback - ensure no trailing /api
let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000';
// Remove trailing /api if present to prevent double /api/ in URLs
if (baseUrl.endsWith('/api')) {
  baseUrl = baseUrl.replace(/\/api$/, '');
}
export const API_BASE_URL = baseUrl;

// API endpoints configuration
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
  PROPOSALS_SEARCH: `${API_BASE_URL}/api/proposals/search`,

  // Admin endpoints
  ADMIN: {
    STATS: `${API_BASE_URL}/api/admin/stats`,
    REPORTS: `${API_BASE_URL}/api/admin/reports`,
  },

  // Admin API endpoints
  ADMIN_API: `${API_BASE_URL}/api/admin`,
};

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

/**
 * Configured axios instance with interceptors
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Request interceptor for logging and error handling
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// ============================================================================
// FETCH-BASED API UTILITIES
// ============================================================================

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
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
    console.log(`🚀 Fetch Request: ${fetchOptions.method || 'GET'} ${url}`);
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetch Response: ${response.status} ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ Fetch request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * GET request helper using fetch
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiGet(endpoint, options = {}) {
  return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper using fetch
 * @param {string} endpoint - API endpoint URL
 * @param {Object} data - Request body data
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiPost(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper using fetch
 * @param {string} endpoint - API endpoint URL
 * @param {Object} data - Request body data
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiPut(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper using fetch
 * @param {string} endpoint - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiDelete(endpoint, options = {}) {
  return apiFetch(endpoint, { ...options, method: 'DELETE' });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load configuration from backend
 * @returns {Promise<Object>} Configuration data
 */
export async function loadApiConfig() {
  try {
    console.log(`🔧 Loading API config from: ${API_ENDPOINTS.CONFIG}`);
    console.log(`🔧 API Base URL: ${API_BASE_URL}`);

    const config = await apiGet(API_ENDPOINTS.CONFIG);
    console.log('✅ API config loaded successfully:', config);
    return config;
  } catch (error) {
    console.error('❌ Failed to load API configuration:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: API_ENDPOINTS.CONFIG,
      baseUrl: API_BASE_URL
    });

    // Provide more specific error information
    if (error.message.includes('fetch')) {
      console.error('❌ Network error - backend may not be running at:', API_BASE_URL);
    } else if (error.response?.status === 404) {
      console.error('❌ Config endpoint not found - check backend routes');
    } else if (error.response?.status === 500) {
      console.error('❌ Backend server error - check backend logs');
    }

    throw error;
  }
}



/**
 * Get API base URL for debugging
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
  return API_BASE_URL;
}

/**
 * Create a full API URL from a path
 * @param {string} path - API path
 * @returns {string} Full API URL
 */
export function createApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Default export for backward compatibility
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  api, // Export axios instance
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  loadApiConfig,
  getApiBaseUrl,
  createApiUrl,
};
