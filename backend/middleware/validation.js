const { validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Format validation errors
        const formattedErrors = errors.array().map(error => ({
            msg: error.msg,
            param: error.param,
            location: error.location
        }));

        return res.status(400).json({
            message: 'Validation error',
            errors: formattedErrors
        });
    };
};

module.exports = validate; 