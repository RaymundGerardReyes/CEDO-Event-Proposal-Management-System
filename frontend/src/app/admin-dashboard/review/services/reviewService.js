/**
 * Review Service - API Interaction Layer
 * 
 * This service encapsulates all API interactions related to review functionality.
 * Following the service pattern for clean separation of concerns.
 * 
 * Benefits:
 * - Centralized API logic
 * - Reusable across components
 * - Easy to test and mock
 * - Clean error handling
 */


const API_BASE_URL = process.env.API_URL || "http://localhost:5000/api";

class ReviewService {
    /**
     * Add a comment to a proposal
     * @param {string} proposalId - The proposal ID
     * @param {string} comment - The comment text
     * @returns {Promise<Object>} The API response
     */
    async addComment(proposalId, comment) {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth headers as needed
                    // 'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    comment,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add comment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('ReviewService.addComment error:', error);
            throw error;
        }
    }

    /**
     * Submit a review decision for a proposal
     * @param {Object} reviewData - The review data
     * @param {string} reviewData.proposalId - The proposal ID
     * @param {string} reviewData.decision - The review decision (approve, reject, revision)
     * @param {string} reviewData.comment - Optional review comment
     * @returns {Promise<Object>} The API response
     */
    async submitReview({ proposalId, decision, comment }) {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth headers as needed
                    // 'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    decision,
                    comment,
                    reviewedAt: new Date().toISOString(),
                    reviewerId: 'current-admin-id', // Get from auth context
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to submit review: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('ReviewService.submitReview error:', error);
            throw error;
        }
    }

    /**
     * Fetch proposal details with additional review data
     * @param {string} proposalId - The proposal ID
     * @returns {Promise<Object>} The proposal with review data
     */
    async getProposalDetails(proposalId) {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/details`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth headers as needed
                    // 'Authorization': `Bearer ${getAuthToken()}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch proposal details: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('ReviewService.getProposalDetails error:', error);
            throw error;
        }
    }

    /**
     * Update proposal status
     * @param {string} proposalId - The proposal ID
     * @param {string} status - The new status
     * @returns {Promise<Object>} The API response
     */
    async updateProposalStatus(proposalId, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth headers as needed
                    // 'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    status,
                    updatedAt: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update proposal status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('ReviewService.updateProposalStatus error:', error);
            throw error;
        }
    }

    /**
     * Request documentation from proposal submitter
     * @param {string} proposalId - The proposal ID
     * @param {string} message - Optional message to submitter
     * @returns {Promise<Object>} The API response
     */
    async requestDocumentation(proposalId, message = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/request-documentation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth headers as needed
                    // 'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    message,
                    requestedAt: new Date().toISOString(),
                    requesterId: 'current-admin-id', // Get from auth context
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to request documentation: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('ReviewService.requestDocumentation error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const reviewService = new ReviewService();

// Export class for testing
export { ReviewService };

