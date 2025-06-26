import axios from "axios"

// API base URL with fallback
const API_URL = process.env.API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cedo_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear auth data
      localStorage.removeItem("cedo_token")
      localStorage.removeItem("cedo_user")

      // Redirect to login if not already there
      if (typeof window !== "undefined" && !window.location.pathname.includes("/sign-in")) {
        window.location.href = "/sign-in"
      }
    }
    return Promise.reject(error)
  },
)

/**
 * Auth API functions
 */
export const authApi = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      return response.data
    } catch (error) {
      throw error
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post("/auth/verify-otp", { email, otp })
      if (response.data.token) {
        localStorage.setItem("cedo_token", response.data.token)
      }
      return response.data
    } catch (error) {
      throw error
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email })
      return response.data
    } catch (error) {
      throw error
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await api.put(`/auth/reset-password/${token}`, { password })
      return response.data
    } catch (error) {
      throw error
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/users/me")
      return response.data
    } catch (error) {
      throw error
    }
  },
}

/**
 * Proposals API functions
 */
export const proposalsApi = {
  getAll: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await api.get(`/proposals?${queryParams}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/proposals/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  create: async (proposalData) => {
    try {
      const response = await api.post("/proposals", proposalData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  update: async (id, proposalData) => {
    try {
      const response = await api.put(`/proposals/${id}`, proposalData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/proposals/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  addDocuments: async (id, formData) => {
    try {
      const response = await api.post(`/proposals/${id}/documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  deleteDocument: async (proposalId, documentId) => {
    try {
      const response = await api.delete(`/proposals/${proposalId}/documents/${documentId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

/**
 * Reviews API functions
 */
export const reviewsApi = {
  getPending: async () => {
    try {
      const response = await api.get("/reviews/pending")
      return response.data
    } catch (error) {
      throw error
    }
  },

  submitReview: async (proposalId, reviewData) => {
    try {
      const response = await api.post(`/reviews/${proposalId}`, reviewData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  assignReviewer: async (proposalId, reviewerId) => {
    try {
      const response = await api.put(`/reviews/${proposalId}/assign`, { reviewerId })
      return response.data
    } catch (error) {
      throw error
    }
  },

  getStats: async () => {
    try {
      const response = await api.get("/reviews/stats")
      return response.data
    } catch (error) {
      throw error
    }
  },
}

/**
 * Compliance API functions
 */
export const complianceApi = {
  getAll: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await api.get(`/compliance?${queryParams}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  submitDocuments: async (proposalId, formData) => {
    try {
      const response = await api.post(`/compliance/${proposalId}/documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  updateStatus: async (proposalId, statusData) => {
    try {
      const response = await api.put(`/compliance/${proposalId}/status`, statusData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  getOverdue: async () => {
    try {
      const response = await api.get("/compliance/overdue")
      return response.data
    } catch (error) {
      throw error
    }
  },

  getStats: async () => {
    try {
      const response = await api.get("/compliance/stats")
      return response.data
    } catch (error) {
      throw error
    }
  },
}

/**
 * Reports API functions
 */
export const reportsApi = {
  getProposalsReport: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await api.get(`/reports/proposals?${queryParams}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default {
  auth: authApi,
  proposals: proposalsApi,
  reviews: reviewsApi,
  compliance: complianceApi,
  reports: reportsApi,
}
