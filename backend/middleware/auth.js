// middleware/auth.middleware.js

const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const logger = require("../utils/logger");

/**
 * Utility: Create consistent error with status
 */
const createError = (message, status = 401) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Utility: Role inclusion check
 */
const hasRole = (user, roles) => {
  return user && roles.includes(user.role);
};

/**
 * Middleware: Validate API key for admin access
 */
const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const expectedApiKey = process.env.ADMIN_API_KEY;

    if (!expectedApiKey) return next(createError("Server configuration error", 500));
    if (!apiKey) return next(createError("API key required"));
    if (apiKey !== expectedApiKey) return next(createError("Invalid API key"));

    req.user = {
      id: "api-key-admin",
      role: "admin",
      is_approved: true,
    };

    next();
  } catch (err) {
    logger.warn("validateApiKey error", err);
    next(createError("Authentication failed"));
  }
};

/**
 * Middleware: Validate JWT token
 */
const validateToken = async (req, res, next) => {
  const isVerbose = process.env.AUTH_VERBOSE === 'true';

  try {
    if (isVerbose) {
      console.log('🔐 validateToken middleware called');
      console.log('🔐 Request headers:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        'x-api-key': req.headers["x-api-key"] ? 'Present' : 'Missing'
      });
    }

    const apiKey = req.headers["x-api-key"];
    if (apiKey === process.env.ADMIN_API_KEY) {
      console.log('🔐 API key authentication used');
      req.user = {
        id: "api-key-admin",
        role: "admin",
        is_approved: true,
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No authorization header found');
      return next(createError("No token provided"));
    }

    const token = authHeader.split(" ")[1];
    if (isVerbose) {
      console.log('🔐 Token extracted:', token ? 'Present' : 'Missing');
    }

    const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT secret not configured');
      return next(createError("JWT secret not configured", 500));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
      if (isVerbose) {
        console.log('🔐 JWT decoded successfully:', {
          hasUserId: !!decoded.userId,
          hasId: !!decoded.id,
          hasUser: !!decoded.user,
          decodedKeys: Object.keys(decoded)
        });
      }
    } catch (err) {
      if (isVerbose) {
        console.log('❌ JWT verification failed:', err.message);
      }
      const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return next(createError(msg));
    }

    const userId = decoded.userId || decoded.id || (decoded.user && decoded.user.id);
    if (isVerbose) {
      console.log('🔐 User ID extracted:', {
        userId,
        fromUserId: decoded.userId,
        fromId: decoded.id,
        fromUser: decoded.user?.id,
        decodedStructure: {
          hasUserId: !!decoded.userId,
          hasId: !!decoded.id,
          hasUser: !!decoded.user,
          allKeys: Object.keys(decoded)
        }
      });
    }

    if (!userId) {
      console.log('❌ No user ID found in token');
      return next(createError("Invalid token"));
    }

    if (isVerbose) {
      console.log('🔐 Querying database for user ID:', userId);
    }

    const [users] = await pool.query(
      "SELECT id, email, role, name, organization, organization_type, avatar, is_approved FROM users WHERE id = ?",
      [userId]
    );

    if (!users.length) {
      console.log('❌ User not found in database for ID:', userId);

      if (isVerbose) {
        console.log('🔍 Available user IDs in database:');
        try {
          const [allUsers] = await pool.query("SELECT id, email, name, role FROM users ORDER BY id");
          allUsers.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
          });
        } catch (dbError) {
          console.log('❌ Could not fetch user list for debugging:', dbError.message);
        }
      }

      // Return a more specific error for this case
      const error = createError("User account not found. Please sign in again.");
      error.status = 401;
      error.code = "USER_NOT_FOUND";
      return next(error);
    }

    const user = users[0];
    if (isVerbose) {
      console.log('🔐 User found in database:', {
        id: user.id,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved
      });
    }

    if (!user.is_approved) {
      console.log('❌ User not approved:', user.id);
      return next(createError("Not approved"));
    }

    req.user = user;
    if (isVerbose) {
      console.log('✅ User set in request:', {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      });
    }
    next();
  } catch (err) {
    console.error('❌ validateToken error:', err);
    logger.warn("validateToken error", err);
    next(createError("Authentication failed"));
  }
};

/**
 * Middleware: Role validator factory
 */
const validateRole = (roles, message) => (req, res, next) => {
  if (!hasRole(req.user, roles)) {
    return next(createError(message, 403));
  }
  next();
};

const validateAdmin = validateRole(["head_admin", "manager", "admin"], "Admin privileges required");
const validateFaculty = validateRole(["faculty", "admin", "head_admin", "manager"], "Faculty privileges required");
const validateReviewer = validateRole(["reviewer", "admin", "head_admin", "manager"], "Reviewer privileges required");

module.exports = {
  validateToken,
  validateApiKey,
  validateAdmin,
  validateFaculty,
  validateReviewer,
};
