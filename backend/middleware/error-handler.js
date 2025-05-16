// backend/middleware/error-handler.js
const errorHandler = (err, req, res, next) => {
    // Log error details
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error
    let statusCode = 500;
    let message = 'Server error';
    let errors = [];

    // Handle specific error types
    if (err.message === 'User not found or not approved') { // Added this specific check
        statusCode = 401;
        message = 'Unauthorized: User session is invalid or account not approved.';
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errors = Object.values(err.errors).map(error => ({
            msg: error.message,
            param: error.path
        }));
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = 'Duplicate entry'; // Or a more user-friendly message like "Email already exists."
    } else if (err.response?.status === 400) {
        // Handle Axios errors (e.g., from Google OAuth)
        statusCode = 400;
        message = err.response.data.message || 'Bad request';
    }
    // Add other specific error checks as needed

    // Log security events
    if (statusCode === 401 || statusCode === 403) {
        console.warn('Security Event:', {
            type: 'Authentication/Authorization Failure', // Generalized type
            status: statusCode,
            path: req.path,
            ip: req.ip, // Ensure req.ip is available (it usually is with Express)
            userId: req.user ? req.user.id : 'N/A', // Log user ID if available
            errorMessage: err.message, // Log the original error message for context
            timestamp: new Date().toISOString()
        });
    }

    // Send error response
    res.status(statusCode).json({
        message,
        errors: errors.length > 0 ? errors : undefined,
        // Conditionally include stack in development for debugging
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;