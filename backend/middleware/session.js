// backend/middleware/session.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const sessionManager = {
    // Generate new token
    generateToken: (user) => {
        if (!process.env.JWT_SECRET_DEV) {
            throw new Error("JWT_SECRET_DEV is not defined in environment variables.");
        }
        return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_DEV, {
            expiresIn: "1m", // Set your desired expiration time
        });
    },

    // Verify token
    verifyToken: async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user still exists and is approved
            const [users] = await pool.query(
                'SELECT id, email, role, is_approved FROM users WHERE id = ? AND is_approved = TRUE', // Select only necessary fields
                [decoded.id]
            );

            if (users.length === 0) {
                // This error message will be caught by the error-handler
                throw new Error('User not found or not approved');
            }
            // Return the necessary user details from the database, not just the decoded token,
            // to ensure the data is current (e.g., role or approval status might have changed).
            // The decoded token primarily confirms identity and token validity.
            return { ...decoded, is_approved: users[0].is_approved }; // Or return users[0] if you want the fresh DB record as the source of truth for req.user
        } catch (error) {
            // Re-throw JWT errors (like TokenExpiredError, JsonWebTokenError) to be handled by error-handler
            // Also re-throw the custom 'User not found or not approved' error
            throw error;
        }
    },

    // Refresh token
    refreshToken: async (oldToken) => {
        try {
            // verifyToken will check if the user in the old token is still valid and approved
            const decodedOldToken = await sessionManager.verifyToken(oldToken);

            // Fetch the full user object to ensure we have the latest details for the new token
            // (though verifyToken already checks existence and approval)
            const [users] = await pool.query('SELECT id, email, role, is_approved FROM users WHERE id = ?', [decodedOldToken.id]);

            if (users.length === 0) {
                // This case should ideally be caught by verifyToken, but as a safeguard:
                throw new Error('User not found for refresh token');
            }

            // Ensure the user is still approved before issuing a new token
            if (!users[0].is_approved) {
                throw new Error('User not approved for refresh token');
            }

            // Pass the user object (users[0]) from the DB to generateToken
            return sessionManager.generateToken(users[0]);
        } catch (error) {
            // Re-throw errors to be handled by the calling route and then the main error handler
            throw error;
        }
    },

    // Log access - NOW ACCEPTS 'role'
    logAccess: async (userId, role, action) => { // Added 'role' parameter
        if (!userId || !action) {
            console.warn('Attempted to log access with missing userId or action.');
            return;
        }
        try {
            await pool.query(
                'INSERT INTO access_logs (user_id, role, action, timestamp) VALUES (?, ?, ?, NOW())', // Added 'role' to SQL query
                [userId, role, action] // Pass 'role' to query parameters
            );
        } catch (error) {
            console.error('Failed to log access:', error.message); // Log only message for brevity
        }
    }
};

module.exports = sessionManager;