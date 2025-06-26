/**
 * Authentication Middleware
 *
 * Comprehensive middleware functions for authenticating and authorizing users
 * in the CEDO proposal management system. Implements multiple authentication
 * methods with role-based access control.
 *
 * Features:
 * - JWT token validation and verification
 * - API key authentication for admin access
 * - Role-based authorization middleware
 * - User approval status verification
 * - Comprehensive error handling with security logging
 * - Database integration for user verification
 *
 * Security Considerations:
 * - Secure JWT secret management
 * - Token expiration handling
 * - User enumeration protection
 * - Proper error logging without exposure
 * - Database query optimization
 *
 * @see https://jwt.io/introduction/
 * @see https://www.sitepoint.com/google-auth-react-express/
 * 
 * @module middleware/auth
 * @requires jsonwebtoken
 * @requires ../config/db
 * @requires ../utils/logger
 */

const jwt = require("jsonwebtoken")
const { pool } = require("../config/db")
const logger = require("../utils/logger")

/**
 * Validates API key from request headers for admin dashboard access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateApiKey = (req, res, next) => {
  try {
    // Get API key from x-api-key header
    const apiKey = req.headers['x-api-key']
    const expectedApiKey = process.env.ADMIN_API_KEY

    if (!expectedApiKey) {
      logger.error('ADMIN_API_KEY not configured in environment variables')
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      })
    }

    if (!apiKey) {
      logger.warn('API key access attempt without key')
      return res.status(401).json({
        success: false,
        error: "API key required",
        message: "Please provide x-api-key header",
      })
    }

    if (apiKey !== expectedApiKey) {
      logger.warn(`Invalid API key access attempt: ${apiKey}`)
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
      })
    }

    // API key is valid, continue to next middleware
    logger.info('Valid API key access granted')
    next()
  } catch (error) {
    logger.error(`API key authentication error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

/**
 * Validates JWT token from request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateToken = async (req, res, next) => {
  try {
    // API Key authentication
    const apiKey = req.headers["x-api-key"]
    if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
      req.user = { id: "api-key-admin", role: "admin", is_approved: 1 }
      return next()
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("No token provided")
      error.name = "UnauthorizedError"
      throw error
    }

    const token = authHeader.split(" ")[1]

    // Verify token - using JWT_SECRET_DEV to match your existing configuration
    const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT secret not configured")
    }

    const decoded = jwt.verify(token, jwtSecret)

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      const error = new Error("Token expired")
      error.name = "UnauthorizedError"
      throw error
    }

    // Support multiple payload shapes: {id:1}, {userId:1}, {user:{id:1}}
    const userIdFromToken = decoded.userId || decoded.id || (decoded.user && decoded.user.id)

    if (!userIdFromToken) {
      throw new Error("Invalid token payload – no user id")
    }

    const [users] = await pool.query(
      "SELECT id, email, role, name, organization, organization_type, avatar, is_approved FROM users WHERE id = ?",
      [userIdFromToken],
    )

    if (users.length === 0) {
      const error = new Error("User not found or inactive")
      error.name = "UnauthorizedError"
      throw error
    }

    const user = users[0]

    // Check if user is approved
    if (!user.is_approved) {
      const error = new Error("User account not approved")
      error.name = "UnauthorizedError"
      throw error
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error.name = "UnauthorizedError"
      error.message = "Invalid token"
    }

    logger.error(`Authentication error: ${error.message}`)
    res.status(401).json({
      success: false,
      error: "Authentication failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

/**
 * Validates that the authenticated user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAdmin = (req, res, next) => {
  if (!req.user || !["head_admin", "manager", "admin"].includes(req.user.role)) {
    logger.warn(`Unauthorized admin access attempt by user ID: ${req.user?.id || "unknown"}`)
    return res.status(403).json({
      success: false,
      error: "Access denied. Admin privileges required.",
    })
  }
  next()
}

/**
 * Validates that the authenticated user has faculty role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateFaculty = (req, res, next) => {
  if (!req.user || !["faculty", "admin", "head_admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Faculty privileges required.",
    })
  }
  next()
}

/**
 * Validates that the authenticated user has reviewer role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateReviewer = (req, res, next) => {
  if (!req.user || !["reviewer", "admin", "head_admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: "Access denied. Reviewer privileges required.",
    })
  }
  next()
}

module.exports = {
  validateToken,
  validateAdmin,
  validateFaculty,
  validateReviewer,
  validateApiKey,
}
