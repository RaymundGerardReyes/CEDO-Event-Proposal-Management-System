// backend/middleware/session.js
const jwt = require('jsonwebtoken');
const { pool, query } = require('../config/database-postgresql-only');
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

  generateToken: (user, rememberMe = false) => {
    const JWT_SECRET = getJwtSecret();
    const expirationTime = rememberMe ? '30d' : '1d';

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        approved: user.approved,
        rememberMe: rememberMe,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: expirationTime }
    );
  },

  verifyToken: (token) => {
    const JWT_SECRET = getJwtSecret();
    return jwt.verify(token, JWT_SECRET);
  },

  refreshToken: async (token) => {
    const decoded = sessionManager.verifyToken(token);
    const rowsResult = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = rowsResult.rows[0];

    if (!user) throw new Error('User not found for refresh token');

    const requiredFields = ['id', 'email', 'role', 'approved'];
    for (const field of requiredFields) {
      if (user[field] === undefined || user[field] === null) {
        throw new Error(`User field ${field} is missing or malformed`);
      }
    }

    if (!user.approved) throw new Error('User not approved for refresh token');

    // Preserve rememberMe setting from original token
    const rememberMe = decoded.rememberMe || false;
    return sessionManager.generateToken(user, rememberMe);
  },

  logAccess: async (userId, role, action) => {
    if (!userId) return logger.warn('Missing userId in logAccess');
    if (!action) return logger.warn('Missing action in logAccess');

    try {
      // ✅ FIX: Use audit_logs table with correct structure from PostgreSQL schema
      await query(
        'INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
        [userId, action, 'users', userId, null, null]
      );
    } catch (e) {
      logger.error('Failed to log access:', e.message);
    }
  },

  // Remember Me specific methods
  generateRememberMeToken: (user) => {
    return sessionManager.generateToken(user, true);
  },

  isRememberMeToken: (token) => {
    try {
      const decoded = sessionManager.verifyToken(token);
      return decoded.rememberMe === true;
    } catch (error) {
      return false;
    }
  },

  getTokenExpiration: (token) => {
    try {
      const decoded = sessionManager.verifyToken(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
};

module.exports = sessionManager;
