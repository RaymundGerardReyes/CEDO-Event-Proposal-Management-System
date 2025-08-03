// backend/middleware/error-handler.js

module.exports = function createErrorHandler({ env = process.env.NODE_ENV, logger = console } = {}) {
  return function errorHandler(err, req, res, next) {
    err = err || {};
    req = req || {};

    let status = err.status || 500;
    let message = err.message || 'Server error';

    switch (err.name) {
      case 'ValidationError':
        status = 400;
        message = err.message || 'Validation failed';
        break;
      case 'JsonWebTokenError':
        status = 401;
        message = 'Invalid token';
        break;
      case 'TokenExpiredError':
        status = 401;
        message = 'Token expired';
        break;
    }

    if (err.code === 'ER_DUP_ENTRY') {
      status = 400;
      message = 'Duplicate entry';
    }

    if (/not found|not approved/i.test(message)) {
      status = 401;
      message = 'Unauthorized';
    }

    if (err.response && err.response.status) {
      status = 400;
      message = err.response.data?.message || 'Bad request from axios';
    }

    if (!err.message || ['Test error', 'Unknown error'].includes(err.message)) {
      message = 'Server error';
    }

    const safeUser = req && req.user && req.user.id ? req.user.id : 'anonymous';
    const safePath = req && typeof req.path === 'string' ? req.path : 'unknown';
    const safeMethod = req && typeof req.method === 'string' ? req.method : 'UNKNOWN';
    const safeIP = req && typeof req.ip === 'string' ? req.ip : 'N/A';

    const warn = (label, details) => {
      if (typeof logger.warn === 'function') {
        logger.warn(`[SECURITY EVENT] ${label}`, details);
      }
    };

    if (!req.user) warn('Missing req.user', { ip: safeIP, path: safePath, method: safeMethod });
    if (!req.ip || safeIP === 'N/A') warn('Missing req.ip', { user: safeUser, path: safePath, method: safeMethod });
    if (!req.path || safePath === 'unknown') warn('Missing req.path', { user: safeUser, ip: safeIP, method: safeMethod });
    if (!req.method || safeMethod === 'UNKNOWN') warn('Missing req.method', { user: safeUser, ip: safeIP, path: safePath });

    if ([401, 403].includes(status)) {
      warn('Access denied', { status, message, user: safeUser, ip: safeIP, path: safePath, method: safeMethod });
    }

    if (env === 'development' && typeof logger.error === 'function') {
      logger.error('Error:', {
        status,
        message,
        stack: err.stack || 'No stack trace',
        path: safePath,
        method: safeMethod,
        ip: safeIP,
        user: safeUser
      });
    }

    if (res.headersSent) return next(err);

    const response = {
      error: message,
      message,
      status
    };

    if (env === 'development' && err.stack) {
      response.stack = err.stack;
    }

    if (err.errors && typeof err.errors === 'object') {
      response.errors = Object.values(err.errors).map(e => ({
        message: e.message,
        path: e.path || e.field || 'unknown'
      }));
    }

    return res.status(status).json(response);
  };
};
