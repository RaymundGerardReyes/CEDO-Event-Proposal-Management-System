// API service for user management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        // First try to get token from cookie (primary method used by auth context)
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }

        // Fallback to localStorage with the correct key name
        return localStorage.getItem('cedo_token') || localStorage.getItem('token');
    }
    return null;
};

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
};

// User API functions
export const usersApi = {
    // Get all users (whitelist)
    getAllUsers: async () => {
        return apiRequest('/users/');
    },

    // Get current user details
    getCurrentUser: async () => {
        return apiRequest('/users/me');
    },

    // Get pending students (for approval)
    getPendingStudents: async () => {
        return apiRequest('/users/pending-students');
    },

    // Update user approval status
    updateUserApproval: async (userId, isApproved) => {
        return apiRequest(`/users/${userId}/approval`, {
            method: 'PUT',
            body: JSON.stringify({ is_approved: isApproved }),
        });
    },

    // Update user details
    updateUser: async (userId, userData) => {
        return apiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    // Create a new user (you may need to add this endpoint to backend)
    createUser: async (userData) => {
        return apiRequest('/users/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // Delete a user (you may need to add this endpoint to backend)
    deleteUser: async (userId) => {
        return apiRequest(`/users/${userId}`, {
            method: 'DELETE',
        });
    },

    // Approve student account
    approveStudent: async (studentId) => {
        return apiRequest(`/users/approve-student/${studentId}`, {
            method: 'POST',
        });
    },
};

export default usersApi; 