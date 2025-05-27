const sessionManager = require('./session');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.warn("Auth Middleware: No Authorization header found.");
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      console.warn("Auth Middleware: Token format is not 'Bearer <token>'.");
      return res.status(401).json({ message: 'Token malformed' });
    }
    const token = tokenParts[1];

    // console.log("Auth Middleware: Received token:", token ? token.substring(0,15) + '...' : 'null_or_empty');
    const decoded = await sessionManager.verifyToken(token);
    // verifyToken should return an object containing at least id and role if successful
    if (!decoded || !decoded.id || !decoded.role) {
      console.error("Auth Middleware: Decoded token from sessionManager.verifyToken is invalid or missing id/role.", decoded);
      return res.status(401).json({ message: 'Token verification failed internally.' });
    }

    req.user = decoded; // req.user now has id, role, is_approved from verifyToken

    // Correctly pass role to logAccess
    await sessionManager.logAccess(decoded.id, decoded.role, 'authenticated_access');

    next();
  } catch (error) {
    console.error("Auth Middleware Error during token processing:", error.name, "-", error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', reason: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') { // Covers invalid signature, malformed token
      return res.status(401).json({ message: 'Invalid token', reason: 'TOKEN_INVALID' });
    }
    // For other errors thrown by verifyToken (like 'User not found or not approved')
    return res.status(401).json({ message: error.message || 'Authentication failed', reason: 'AUTH_FAILED' });
  }
};

module.exports = auth;
