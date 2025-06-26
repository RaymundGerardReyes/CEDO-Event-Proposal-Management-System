// backend/middleware/session.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Use the same JWT secret that the frontend expects
const JWT_SECRET = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;

const sessionManager = {
    // Generate new token
    generateToken: (user) => {
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET_DEV or JWT_SECRET is not defined in environment variables.");
        }
        return jwt.sign(
            {
                user: {
                    id: user.id,
                    role: user.role,
                    email: user.email,
                    name: user.name
                }
            },
            JWT_SECRET,
            {
                expiresIn: "7d", // Match the frontend cookie expiration
            }
        );
    },

    // Verify token
    verifyToken: (token) => {
        try {
            if (!JWT_SECRET) {
                throw new Error("JWT_SECRET_DEV or JWT_SECRET is not defined in environment variables.");
            }
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            // Re-throw JWT errors (like TokenExpiredError, JsonWebTokenError)
            throw error;
        }
    },

    // Refresh token
    refreshToken: async (oldToken) => {
        try {
            // verifyToken will check if the token is valid
            const decodedOldToken = sessionManager.verifyToken(oldToken);

            // Fetch the full user object to ensure we have the latest details for the new token
            const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decodedOldToken.user.id]);

            if (users.length === 0) {
                throw new Error('User not found for refresh token');
            }

            // Ensure the user is still approved before issuing a new token
            if (!users[0].is_approved) {
                throw new Error('User not approved for refresh token');
            }

            // Pass the user object from the DB to generateToken
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