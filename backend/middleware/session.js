const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const sessionManager = {
    // Generate new token
    generateToken: (user) => {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    },

    // Verify token
    verifyToken: async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user still exists and is approved
            const [users] = await pool.query(
                'SELECT * FROM users WHERE id = ? AND is_approved = TRUE',
                [decoded.id]
            );

            if (users.length === 0) {
                throw new Error('User not found or not approved');
            }

            return decoded;
        } catch (error) {
            throw error;
        }
    },

    // Refresh token
    refreshToken: async (oldToken) => {
        try {
            const decoded = await sessionManager.verifyToken(oldToken);
            const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

            if (users.length === 0) {
                throw new Error('User not found');
            }

            return sessionManager.generateToken(users[0]);
        } catch (error) {
            throw error;
        }
    },

    // Log access
    logAccess: async (userId, action) => {
        try {
            await pool.query(
                'INSERT INTO access_logs (user_id, action, timestamp) VALUES (?, ?, NOW())',
                [userId, action]
            );
        } catch (error) {
            console.error('Failed to log access:', error);
        }
    }
};

module.exports = sessionManager; 