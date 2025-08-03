// backend/middleware/session.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const logger = require('../config/logger');

let testSecretOverride = null;
const getJwtSecret = () => {
  const secret = testSecretOverride ?? process.env.JWT_SECRET_DEV ?? process.env.JWT_SECRET;
  if (typeof secret !== 'string' || !secret.trim()) {
    throw new Error('JWT_SECRET_DEV or JWT_SECRET is not defined in environment variables.');
  }
  return secret;
};

const sessionManager = {
  __setTestSecret: (val) => (testSecretOverride = val), // test hook

  generateToken: (user) => {
    const JWT_SECRET = getJwtSecret();
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, approved: user.approved },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
  },

  verifyToken: (token) => {
    const JWT_SECRET = getJwtSecret();
    return jwt.verify(token, JWT_SECRET);
  },

  refreshToken: async (token) => {
    const decoded = sessionManager.verifyToken(token);
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) throw new Error('User not found for refresh token');

    const requiredFields = ['id', 'email', 'role', 'approved'];
    for (const field of requiredFields) {
      if (user[field] === undefined || user[field] === null) {
        throw new Error(`User field ${field} is missing or malformed`);
      }
    }

    if (!user.approved) throw new Error('User not approved for refresh token');

    return sessionManager.generateToken(user);
  },

  logAccess: async (userId, role, action) => {
    if (!userId) return logger.warn('Missing userId in logAccess');
    if (!action) return logger.warn('Missing action in logAccess');

    try {
      await pool.query(
        'INSERT INTO access_logs (user_id, role, action, timestamp) VALUES (?, ?, ?, NOW())',
        [userId, role, action]
      );
    } catch (e) {
      logger.error('Failed to log access:', e.message);
    }
  }
};

module.exports = sessionManager;
