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
    if (err.name === 'ValidationError') {
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
        message = 'Duplicate entry';
    } else if (err.response?.status === 400) {
        // Handle Axios errors (e.g., from Google OAuth)
        statusCode = 400;
        message = err.response.data.message || 'Bad request';
    }

    // Log security events
    if (statusCode === 401 || statusCode === 403) {
        console.warn('Security Event:', {
            type: 'Authentication Failure',
            status: statusCode,
            path: req.path,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
    }

    // Send error response
    res.status(statusCode).json({
        message,
        errors: errors.length > 0 ? errors : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler; 