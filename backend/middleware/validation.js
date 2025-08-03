const { validationResult } = require('express-validator');

/**
 * Express middleware to run an array of express-validator chains and return formatted errors.
 * - Always returns errors with msg, param, and location fields.
 * - Handles missing fields, nested fields, and custom validators robustly.
 * - If no errors, calls next().
 *
 * @param {Array} validations - Array of express-validator chains
 */
const validate = (validations) => {
    return async (req, res, next) => {
        try {
            // Run all validations
            await Promise.all(validations.map(validation => validation.run(req)));

            const errors = validationResult(req);
            if (errors.isEmpty()) {
                return next();
            }


            // Format validation errors, always include param and location as strings (never null)
            const formattedErrors = errors.array({ onlyFirstError: true }).map(error => {
                // express-validator: error.nestedErrors can exist for custom validators, flatten if present
                if (Array.isArray(error.nestedErrors) && error.nestedErrors.length > 0) {
                    return error.nestedErrors.map(nested => ({
                        msg: nested.msg,
                        param: (typeof nested.path === 'string' && nested.path) ? nested.path : (typeof nested.param === 'string' && nested.param ? nested.param : ''),
                        location: typeof nested.location === 'string' ? nested.location : (nested.location ? String(nested.location) : '')
                    }));
                }
                return {
                    msg: error.msg,
                    param: (typeof error.path === 'string' && error.path) ? error.path : (typeof error.param === 'string' && error.param ? error.param : ''),
                    location: typeof error.location === 'string' ? error.location : (error.location ? String(error.location) : '')
                };
            });

            // Flatten in case of nested errors
            const flatErrors = Array.isArray(formattedErrors[0]) ? formattedErrors.flat() : formattedErrors;

            return res.status(400).json({
                message: 'Validation error',
                errors: flatErrors
            });
        } catch (err) {
            // In case a validator throws unexpectedly
            return res.status(500).json({
                message: 'Internal validation middleware error',
                error: err.message || err.toString()
            });
        }
    };
};

module.exports = validate;