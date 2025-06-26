'use client';
// frontend/src/app/(main)/admin-dashboard/settings/api/user-api.js

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

import axios from 'axios';

// Use the same API configuration as auth-context.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance with same configuration as auth-context
const api = axios.create({
    baseURL: API_URL,
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
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('🚨 [UserAPI] API Error:', error.response?.data || error.message);

        // Handle common errors
        if (error.response?.status === 401) {
            // Token expired or invalid - redirect to login
            if (typeof window !== "undefined") {
                window.location.href = '/sign-in';
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Real User API Implementation
 */
export const userApi = {
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

        try {
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
            const url = queryString ? `/users?${queryString}` : '/users';

            console.log('📡 [UserAPI] Making request to:', url);

            const response = await api.get(url);

            // Handle different response structures
            const users = response.data.users || response.data.data || response.data;

            console.log('✅ [UserAPI] Successfully fetched', users.length, 'users from database');
            return users;

        } catch (error) {
            console.error('❌ [UserAPI] Error fetching users from database:', error);

            // Provide more specific error messages
            if (error.response?.status === 403) {
                throw new Error('Access denied. You do not have permission to view users.');
            } else if (error.response?.status === 404) {
                throw new Error('User management service not found.');
            } else if (error.response?.status === 500) {
                throw new Error('Database error. Please try again later.');
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                throw new Error('Unable to connect to the server. Please check your connection.');
            }

            throw new Error(error.response?.data?.message || 'Failed to fetch users from database');
        }
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
            const response = await api.get(`/users/${userId}`);
            const user = response.data.user || response.data;

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
            const response = await api.post('/users', userData);
            const createdUser = response.data.user || response.data;

            console.log('✅ [UserAPI] Successfully created user in database:', createdUser.name);

            return {
                success: true,
                message: 'User created successfully',
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
            const response = await api.put(`/users/${userId}`, updateData);
            const updatedUser = response.data.user || response.data;

            console.log('✅ [UserAPI] Successfully updated user in database:', updatedUser.name);

            return {
                success: true,
                message: 'User updated successfully',
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
            const response = await api.delete(`/users/${userId}`);
            const result = response.data;

            console.log('✅ [UserAPI] Successfully deleted user from database');

            return {
                success: true,
                message: 'User deleted successfully',
                deletedUser: result.user || { id: userId }
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
            const response = await api.post('/users/bulk-delete', { userIds });
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
            const response = await api.get('/users/stats');
            const stats = response.data.stats || response.data;

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
            const response = await api.put(`/users/${userId}/approval`, { is_approved: isApproved });
            const updatedUser = response.data.user || response.data;

            console.log('✅ [UserAPI] Successfully updated user approval in database');

            return {
                success: true,
                message: `User ${isApproved ? 'approved' : 'revoked'} successfully`,
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
            const url = queryString ? `/users/search?${queryString}` : '/users/search';

            const response = await api.get(url);
            const users = response.data.users || response.data.data || response.data;

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