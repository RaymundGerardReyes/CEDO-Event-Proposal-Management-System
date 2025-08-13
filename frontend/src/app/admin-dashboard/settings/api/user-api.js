'use client';
// frontend/src/app/admin-dashboard/settings/api/user-api.js

/**
 * Real User API - Connects to backend database for user management
 * 
 * This API provides real database operations for user management,
 * following the same pattern as auth-context.js with proper error handling.
 * 
 * Features:
 * - Real backend API integration
 * - Proper authentication headers
 * - Error handling and validation
 * - CRUD operations for users
 * - Real-time database updates
 */

import { getAppConfig } from '@/lib/utils';
import axios from 'axios';

// Use the same API configuration as auth-context.js
const API_URL = getAppConfig().backendUrl;

// Create axios instance with same configuration as auth-context
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 second timeout to prevent hanging requests
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Add request interceptor to include auth token from cookies
api.interceptors.request.use((config) => {
    if (typeof document !== "undefined") {
        const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
        if (cookieValue) {
            const token = cookieValue.split("=")[1];
            // Set the Authorization header directly on the config
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 [UserAPI] Added auth token to request:', token ? 'Token present' : 'No token');
        } else {
            console.log('⚠️ [UserAPI] No auth token found in cookies');
        }
    }
    return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('🚨 [UserAPI] API Error:', error.response?.data || error.message);

        // Handle timeout errors specifically
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error('⏰ [UserAPI] Request timeout - server took too long to respond');
            error.message = 'Request timed out. The server took too long to respond. Please try again.';
        }

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || !error.response) {
            console.error('🌐 [UserAPI] Network error - unable to connect to server');
            error.message = 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
        }

        // Handle common HTTP errors
        if (error.response?.status === 401) {
            console.error('🔐 [UserAPI] Authentication error - token expired or invalid');
            error.message = 'Authentication expired. Please sign in again.';
            // Token expired or invalid - redirect to login
            if (typeof window !== "undefined") {
                window.location.href = '/sign-in';
            }
        } else if (error.response?.status === 403) {
            console.error('🚫 [UserAPI] Authorization error - insufficient permissions');
            error.message = 'Access denied. You do not have permission to perform this action.';
        } else if (error.response?.status === 404) {
            console.error('🔍 [UserAPI] Resource not found');
            error.message = 'The requested resource was not found.';
        } else if (error.response?.status === 500) {
            console.error('💥 [UserAPI] Server error');
            error.message = 'Server error. Please try again later.';
        }

        return Promise.reject(error);
    }
);

/**
 * Utility function to safely format role strings
 * @param {string} role - The role string to format
 * @returns {string} Formatted role string
 */
const formatRole = (role) => {
    if (!role || typeof role !== 'string') {
        return 'Unknown';
    }
    return role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

/**
 * Utility function to sanitize user data
 * @param {Object} user - Raw user data from API
 * @returns {Object} Sanitized user data
 */
const sanitizeUserData = (user) => ({
    id: user.id || 0,
    name: user.name || 'Unknown User',
    email: user.email || 'no-email@example.com',
    role: user.role || 'student',
    organization: user.organization || '',
    organization_type: user.organization_type || '',
    is_approved: Boolean(user.is_approved),
    created_at: user.created_at || new Date().toISOString(),
    last_login: user.last_login || null,
    avatar: user.avatar || null,
    phone_number: user.phone_number || null
});

/**
 * Real User API Implementation
 */
export const userApi = {
    /**
     * Test connection to backend API
     * 
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        console.log('🧪 [UserAPI] Testing backend connection...');

        try {
            // Test basic connectivity
            const response = await api.get('/api/config');
            console.log('✅ [UserAPI] Backend connection successful:', response.data);

            // Test auth endpoint
            const authResponse = await api.get('/api/auth/me');
            console.log('✅ [UserAPI] Auth endpoint accessible:', authResponse.data);

            return {
                success: true,
                message: 'Backend connection successful',
                config: response.data,
                auth: authResponse.data
            };

        } catch (error) {
            console.error('❌ [UserAPI] Connection test failed:', error);
            return {
                success: false,
                message: 'Backend connection failed',
                error: error.message
            };
        }
    },

    /**
     * Get current user's authentication status and role
     * 
     * @returns {Promise<Object>} Current user info
     */
    async getCurrentUser() {
        console.log('👤 [UserAPI] Getting current user info...');

        try {
            const response = await api.get('/api/auth/me');
            console.log('✅ [UserAPI] Current user:', response.data);

            const user = response.data.user || response.data;
            const isAdmin = user.role && ['head_admin', 'manager', 'admin'].includes(user.role);

            console.log('🔐 [UserAPI] User role:', user.role, 'Is admin:', isAdmin);

            return {
                success: true,
                user: user,
                isAdmin: isAdmin,
                canAccessAdminAPI: isAdmin && user.is_approved
            };

        } catch (error) {
            console.error('❌ [UserAPI] Failed to get current user:', error);
            return {
                success: false,
                error: error.message,
                isAdmin: false,
                canAccessAdminAPI: false
            };
        }
    },

    /**
     * Get all users from the database
     * 
     * @param {Object} options - Query options
     * @param {string} options.search - Search term for name/email
     * @param {string} options.role - Filter by role
     * @param {string} options.sortBy - Sort field
     * @param {string} options.sortOrder - Sort order (asc/desc)
     * @returns {Promise<Array>} Array of users
     */
    async getAllUsers(options = {}) {
        console.log('🔍 [UserAPI] Fetching all users from database with options:', options);

        // Add timeout and retry logic
        const maxRetries = 2;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 [UserAPI] Attempt ${attempt}/${maxRetries} - Fetching users...`);

                // Build query parameters
                const params = new URLSearchParams();

                if (options.search) {
                    params.append('search', options.search);
                }

                if (options.role) {
                    params.append('role', options.role);
                }

                if (options.sortBy) {
                    params.append('sortBy', options.sortBy);
                    params.append('sortOrder', options.sortOrder || 'asc');
                }

                const queryString = params.toString();

                // Try admin endpoint first
                let url = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';
                console.log('📡 [UserAPI] Trying admin endpoint:', url);
                console.log('🔑 [UserAPI] Using API URL:', API_URL);
                console.log('🔑 [UserAPI] Full URL:', `${API_URL}${url}`);

                try {
                    const response = await api.get(url);
                    console.log('📥 [UserAPI] Admin endpoint response:', response.status);
                    console.log('📥 [UserAPI] Response data:', response.data);

                    // Handle admin API response format
                    const users = response.data.data || response.data.users || response.data;

                    // Sanitize user data to prevent undefined values
                    const sanitizedUsers = users.map(sanitizeUserData);

                    console.log('✅ [UserAPI] Successfully fetched', sanitizedUsers.length, 'users from admin endpoint');
                    console.log('👥 [UserAPI] Users data:', sanitizedUsers);

                    return sanitizedUsers;

                } catch (adminError) {
                    console.log('⚠️ [UserAPI] Admin endpoint failed, trying regular users endpoint...');
                    console.log('⚠️ [UserAPI] Admin error:', adminError.response?.status, adminError.response?.data);

                    // Fallback to regular users endpoint
                    url = queryString ? `/api/users?${queryString}` : '/api/users';
                    console.log('📡 [UserAPI] Trying regular endpoint:', url);

                    const fallbackResponse = await api.get(url);
                    console.log('📥 [UserAPI] Regular endpoint response:', fallbackResponse.status);
                    console.log('📥 [UserAPI] Fallback response data:', fallbackResponse.data);

                    // Handle regular users API response format
                    const users = fallbackResponse.data.data || fallbackResponse.data.users || fallbackResponse.data;

                    // Sanitize user data to prevent undefined values
                    const sanitizedUsers = users.map(sanitizeUserData);

                    console.log('✅ [UserAPI] Successfully fetched', sanitizedUsers.length, 'users from regular endpoint');
                    console.log('👥 [UserAPI] Users data:', sanitizedUsers);

                    return sanitizedUsers;
                }

            } catch (error) {
                lastError = error;
                console.error(`❌ [UserAPI] Attempt ${attempt} failed:`, error.message);

                // Don't retry on certain errors
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw error; // Don't retry auth errors
                }

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
                    console.log(`⏳ [UserAPI] Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        // All attempts failed
        console.error('❌ [UserAPI] All attempts failed to fetch users from database:', lastError);
        console.error('❌ [UserAPI] Error response:', lastError.response?.data);
        console.error('❌ [UserAPI] Error status:', lastError.response?.status);
        console.error('❌ [UserAPI] Error headers:', lastError.response?.headers);

        // Provide more specific error messages
        if (lastError.response?.status === 403) {
            throw new Error('Access denied. You do not have permission to view users. Please ensure you are logged in with admin privileges.');
        } else if (lastError.response?.status === 404) {
            throw new Error('User management service not found.');
        } else if (lastError.response?.status === 500) {
            throw new Error('Database error. Please try again later.');
        } else if (lastError.code === 'ECONNABORTED' || lastError.message.includes('timeout')) {
            throw new Error('Request timed out. The server took too long to respond. Please try again.');
        } else if (lastError.code === 'NETWORK_ERROR' || !lastError.response) {
            throw new Error('Unable to connect to the server. Please check your connection and ensure the backend is running.');
        }

        throw new Error(lastError.response?.data?.message || 'Failed to fetch users from database');
    },

    /**
     * Get a single user by ID from database
     * 
     * @param {number} userId - User ID
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUserById(userId) {
        console.log('🔍 [UserAPI] Fetching user by ID from database:', userId);

        try {
            const response = await api.get(`/api/admin/users/${userId}`);
            const user = response.data.data || response.data.user || response.data;

            if (!user) {
                console.log('⚠️ [UserAPI] User not found in database:', userId);
                return null;
            }

            console.log('✅ [UserAPI] Successfully fetched user from database:', user.name);
            return user;

        } catch (error) {
            if (error.response?.status === 404) {
                console.log('⚠️ [UserAPI] User not found in database:', userId);
                return null;
            }

            console.error('❌ [UserAPI] Error fetching user from database:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch user from database');
        }
    },

    /**
     * Create a new user in the database
     * 
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user with response metadata
     */
    async createUser(userData) {
        console.log('🆕 [UserAPI] Creating new user in database:', userData.email);

        try {
            const response = await api.post('/api/admin/users', userData);
            const createdUser = response.data.data || response.data.user || response.data;

            console.log('✅ [UserAPI] Successfully created user in database:', createdUser.name);

            return {
                success: true,
                message: response.data.message || 'User created successfully',
                user: createdUser
            };

        } catch (error) {
            console.error('❌ [UserAPI] Error creating user in database:', error);

            // Handle specific validation errors
            if (error.response?.status === 400) {
                const message = error.response.data?.message || 'Invalid user data';
                throw new Error(message);
            } else if (error.response?.status === 409) {
                throw new Error('A user with this email already exists');
            }

            throw new Error(error.response?.data?.message || 'Failed to create user in database');
        }
    },

    /**
     * Update an existing user in the database
     * 
     * @param {number} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user with response metadata
     */
    async updateUser(userId, updateData) {
        console.log('📝 [UserAPI] Updating user in database:', userId, updateData);

        try {
            const response = await api.put(`/api/admin/users/${userId}`, updateData);
            const updatedUser = response.data.data || response.data.user || response.data;

            console.log('✅ [UserAPI] Successfully updated user in database:', updatedUser.name);

            return {
                success: true,
                message: response.data.message || 'User updated successfully',
                user: updatedUser
            };

        } catch (error) {
            console.error('❌ [UserAPI] Error updating user in database:', error);

            if (error.response?.status === 404) {
                throw new Error('User not found');
            } else if (error.response?.status === 400) {
                const message = error.response.data?.message || 'Invalid update data';
                throw new Error(message);
            } else if (error.response?.status === 409) {
                throw new Error('Email already exists');
            }

            throw new Error(error.response?.data?.message || 'Failed to update user in database');
        }
    },

    /**
     * Delete a user from the database
     * 
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Success response
     */
    async deleteUser(userId) {
        console.log('🗑️ [UserAPI] Deleting user from database:', userId);

        try {
            const response = await api.delete(`/api/admin/users/${userId}`);
            const result = response.data;

            console.log('✅ [UserAPI] Successfully deleted user from database');

            return {
                success: true,
                message: result.message || 'User deleted successfully',
                deletedUser: result.data || { id: userId }
            };

        } catch (error) {
            console.error('❌ [UserAPI] Error deleting user from database:', error);

            if (error.response?.status === 404) {
                throw new Error('User not found');
            } else if (error.response?.status === 403) {
                throw new Error(error.response.data?.message || 'Cannot delete this user');
            }

            throw new Error(error.response?.data?.message || 'Failed to delete user from database');
        }
    },

    /**
     * Bulk delete users from the database
     * 
     * @param {Array<number>} userIds - Array of user IDs
     * @returns {Promise<Object>} Bulk deletion response
     */
    async bulkDeleteUsers(userIds) {
        console.log('🗑️ [UserAPI] Bulk deleting users from database:', userIds);

        try {
            const response = await api.post('/api/admin/users/bulk-delete', { userIds });
            const result = response.data;

            console.log('✅ [UserAPI] Bulk deletion completed:', result);

            return {
                success: true,
                message: result.message || 'Bulk deletion completed',
                results: result
            };

        } catch (error) {
            console.error('❌ [UserAPI] Error in bulk deletion:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete users from database');
        }
    },

    /**
     * Get user statistics from the database
     * 
     * @returns {Promise<Object>} User statistics
     */
    async getUserStats() {
        console.log('📊 [UserAPI] Fetching user statistics from database');

        try {
            const response = await api.get('/api/admin/users/stats');
            const stats = response.data.stats || response.data.data || response.data;

            console.log('✅ [UserAPI] Successfully fetched statistics from database');
            return stats;

        } catch (error) {
            console.error('❌ [UserAPI] Error fetching statistics from database:', error);

            // If stats endpoint doesn't exist, calculate from users list
            if (error.response?.status === 404) {
                console.log('📊 [UserAPI] Stats endpoint not found, calculating from users list');
                try {
                    const users = await this.getAllUsers();
                    const stats = users.reduce((acc, user) => {
                        acc.total++;
                        acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1;
                        if (user.is_approved) acc.approved++;
                        return acc;
                    }, {
                        total: 0,
                        approved: 0,
                        byRole: {}
                    });
                    return stats;
                } catch (fallbackError) {
                    throw new Error('Failed to fetch user statistics');
                }
            }

            throw new Error(error.response?.data?.message || 'Failed to fetch statistics from database');
        }
    },

    /**
     * Update user approval status in the database
     * 
     * @param {number} userId - User ID
     * @param {boolean} isApproved - Approval status
     * @returns {Promise<Object>} Updated user
     */
    async updateUserApproval(userId, isApproved) {
        console.log('🔐 [UserAPI] Updating user approval in database:', userId, isApproved);

        try {
            const response = await api.put(`/api/users/${userId}/approval`, { is_approved: isApproved });
            const updatedUser = response.data.user || response.data.data || response.data;

            console.log('✅ [UserAPI] Successfully updated user approval in database');

            return {
                success: true,
                message: response.data.message || `User ${isApproved ? 'approved' : 'revoked'} successfully`,
                user: updatedUser
            };

        } catch (error) {
            console.error('❌ [UserAPI] Error updating user approval in database:', error);
            throw new Error(error.response?.data?.message || 'Failed to update user approval in database');
        }
    },

    /**
     * Search users in the database
     * 
     * @param {string} searchTerm - Search term
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Filtered users
     */
    async searchUsers(searchTerm, filters = {}) {
        console.log('🔍 [UserAPI] Searching users in database:', searchTerm, filters);

        try {
            const params = new URLSearchParams();

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const queryString = params.toString();
            const url = queryString ? `/api/admin/users/search?${queryString}` : '/api/admin/users/search';

            const response = await api.get(url);
            const users = response.data.data || response.data.users || response.data;

            console.log('✅ [UserAPI] Successfully searched users in database:', users.length, 'results');
            return users;

        } catch (error) {
            console.error('❌ [UserAPI] Error searching users in database:', error);

            // If search endpoint doesn't exist, fall back to getAllUsers with search
            if (error.response?.status === 404) {
                console.log('🔍 [UserAPI] Search endpoint not found, using getAllUsers with search');
                return this.getAllUsers({ search: searchTerm, ...filters });
            }

            throw new Error(error.response?.data?.message || 'Failed to search users in database');
        }
    }
};

export default userApi;

// Export utility functions for use in other components
export { formatRole, sanitizeUserData };
