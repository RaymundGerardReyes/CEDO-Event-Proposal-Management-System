/**
 * Proposal Validation Middleware
 * Validates proposal data, review actions, and report submissions
 * 
 * Key approaches: Comprehensive validation, clear error messages,
 * and type checking for all proposal operations
 */

const { body, validationResult } = require('express-validator');

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valid proposal statuses
 */
const VALID_PROPOSAL_STATUSES = ['draft', 'pending', 'approved', 'revision_requested', 'denied'];

/**
 * Valid current sections
 */
const VALID_SECTIONS = ['orgInfo', 'schoolEvent', 'communityEvent', 'reporting', 'submitted'];

/**
 * Valid review actions
 */
const VALID_REVIEW_ACTIONS = ['approve', 'revision_requested', 'denied'];

/**
 * Validate proposal creation/update data
 */
const validateProposal = [
    body('uuid')
        .optional()
        .isString()
        .withMessage('UUID must be a string')
        .matches(UUID_REGEX)
        .withMessage('Invalid UUID format'),

    body('organization_name')
        .optional()
        .isString()
        .withMessage('Organization name must be a string')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Organization name must be between 1 and 255 characters')
        .custom(value => {
            if (value === '') {
                throw new Error('organization_name cannot be empty');
            }
            return true;
        }),

    body('user_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),

    body('current_section')
        .optional()
        .isIn(VALID_SECTIONS)
        .withMessage(`Current section must be one of: ${VALID_SECTIONS.join(', ')}`),

    body('proposal_status')
        .optional()
        .isIn(VALID_PROPOSAL_STATUSES)
        .withMessage(`Proposal status must be one of: ${VALID_PROPOSAL_STATUSES.join(', ')}`),

    body('form_completion_percentage')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Form completion percentage must be between 0 and 100'),

    body('event_type')
        .optional()
        .isIn(['school-based', 'community-based'])
        .withMessage('Event type must be either school-based or community-based'),

    body('event_title')
        .optional()
        .isString()
        .withMessage('Event title must be a string')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Event title must be between 1 and 255 characters'),

    body('event_description')
        .optional()
        .isString()
        .withMessage('Event description must be a string')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Event description must be less than 1000 characters'),

    body('event_date')
        .optional()
        .isISO8601()
        .withMessage('Event date must be a valid ISO 8601 date'),

    body('event_location')
        .optional()
        .isString()
        .withMessage('Event location must be a string')
        .trim()
        .isLength({ max: 255 })
        .withMessage('Event location must be less than 255 characters'),

    body('expected_participants')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Expected participants must be a positive integer'),

    body('budget_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget amount must be a non-negative number'),

    body('contact_person')
        .optional()
        .isString()
        .withMessage('Contact person must be a string')
        .trim()
        .isLength({ max: 255 })
        .withMessage('Contact person must be less than 255 characters'),

    body('contact_email')
        .optional()
        .isEmail()
        .withMessage('Contact email must be a valid email address'),

    body('contact_phone')
        .optional()
        .isString()
        .withMessage('Contact phone must be a string')
        .trim()
        .isLength({ max: 20 })
        .withMessage('Contact phone must be less than 20 characters'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                error: errorMessages.join(', '),
                details: errors.array()
            });
        }
        next();
    }
];

/**
 * Validate review action data
 */
const validateReviewAction = [
    body('action')
        .isIn(VALID_REVIEW_ACTIONS)
        .withMessage(`Review action must be one of: ${VALID_REVIEW_ACTIONS.join(', ')}`),

    body('note')
        .optional()
        .isString()
        .withMessage('Note must be a string')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Note must be less than 1000 characters'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                error: errorMessages.join(', '),
                details: errors.array()
            });
        }
        next();
    }
];

/**
 * Validate report submission data
 */
const validateReportData = [
    body('report_content')
        .isString()
        .withMessage('Report content must be a string')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Report content must be between 10 and 2000 characters'),

    body('participant_count')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Participant count must be a non-negative integer'),

    body('outcomes')
        .optional()
        .isString()
        .withMessage('Outcomes must be a string')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Outcomes must be less than 1000 characters'),

    body('challenges_faced')
        .optional()
        .isString()
        .withMessage('Challenges faced must be a string')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Challenges faced must be less than 1000 characters'),

    body('lessons_learned')
        .optional()
        .isString()
        .withMessage('Lessons learned must be a string')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Lessons learned must be less than 1000 characters'),

    body('future_recommendations')
        .optional()
        .isString()
        .withMessage('Future recommendations must be a string')
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Future recommendations must be less than 1000 characters'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                error: errorMessages.join(', '),
                details: errors.array()
            });
        }
        next();
    }
];

/**
 * Validate UUID parameter
 */
const validateUUID = [
    body('uuid')
        .isString()
        .withMessage('UUID must be a string')
        .matches(UUID_REGEX)
        .withMessage('Invalid UUID format'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                error: errorMessages.join(', '),
                details: errors.array()
            });
        }
        next();
    }
];

/**
 * Validate debug log data
 */
const validateDebugLog = [
    body('source')
        .isString()
        .withMessage('Source must be a string')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Source must be between 1 and 50 characters'),

    body('message')
        .isString()
        .withMessage('Message must be a string')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),

    body('meta')
        .optional()
        .isObject()
        .withMessage('Meta must be an object'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({
                error: errorMessages.join(', '),
                details: errors.array()
            });
        }
        next();
    }
];

/**
 * Utility function to validate UUID format
 */
function isValidUUID(uuid) {
    return UUID_REGEX.test(uuid);
}

/**
 * Utility function to validate proposal status
 */
function isValidProposalStatus(status) {
    return VALID_PROPOSAL_STATUSES.includes(status);
}

/**
 * Utility function to validate current section
 */
function isValidSection(section) {
    return VALID_SECTIONS.includes(section);
}

/**
 * Utility function to validate review action
 */
function isValidReviewAction(action) {
    return VALID_REVIEW_ACTIONS.includes(action);
}

module.exports = {
    validateProposal,
    validateReviewAction,
    validateReportData,
    validateUUID,
    validateDebugLog,
    isValidUUID,
    isValidProposalStatus,
    isValidSection,
    isValidReviewAction
}; 