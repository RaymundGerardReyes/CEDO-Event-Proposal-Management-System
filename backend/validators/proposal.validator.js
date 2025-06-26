const { body } = require("express-validator");

const createProposalValidation = [
    body("title", "Title is required").trim().not().isEmpty(),
    body("description", "Description is required").trim().not().isEmpty(),
    body("category", "Category is required").trim().not().isEmpty(),
    body("startDate", "Start date is required and must be a valid date").not().isEmpty().isISO8601().toDate(),
    body("endDate", "End date is required and must be a valid date").not().isEmpty().isISO8601().toDate(),
    body("location", "Location is required").trim().not().isEmpty(),
    body("budget", "Budget is required and must be a number").trim().not().isEmpty().isNumeric(),
    body("objectives", "Objectives are required").trim().not().isEmpty(),
    body("volunteersNeeded", "Number of volunteers is required and must be an integer").trim().not().isEmpty().isInt({ gt: 0 }),
    body("organizationType", "Organization type is required").trim().not().isEmpty(),
    body("contactPerson", "Contact person is required").trim().not().isEmpty(),
    body("contactEmail", "Contact email is required and must be a valid email").trim().isEmail(),
    body("contactPhone", "Contact phone is required").trim().not().isEmpty(),
    body("status", "Invalid status value").optional().isIn(["draft", "pending"]),
    body('endDate').custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
            throw new Error('End date cannot be before start date');
        }
        return true;
    })
];

const updateProposalValidation = [
    body("title", "Title is required").optional().trim().not().isEmpty(),
    body("description", "Description is required").optional().trim().not().isEmpty(),
    body("category", "Category is required").optional().trim().not().isEmpty(),
    body("startDate", "Start date must be a valid date").optional().isISO8601().toDate(),
    body("endDate", "End date must be a valid date").optional().isISO8601().toDate(),
    body("location", "Location is required").optional().trim().not().isEmpty(),
    body("budget", "Budget must be a number").optional().trim().not().isEmpty().isNumeric(),
    body("objectives", "Objectives are required").optional().trim().not().isEmpty(),
    body("volunteersNeeded", "Number of volunteers must be an integer").optional().trim().not().isEmpty().isInt({ gt: 0 }),
    body("contactPerson", "Contact person is required").optional().trim().not().isEmpty(),
    body("contactEmail", "Contact email must be a valid email").optional().trim().isEmail(),
    body("contactPhone", "Contact phone is required").optional().trim().not().isEmpty(),
    body("status", "Invalid status value").optional().isIn(["draft", "pending", "approved", "rejected", "under_review"]),
    body('endDate').optional().custom((value, { req }) => {
        if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
            throw new Error('End date cannot be before start date');
        }
        return true;
    })
];

const createSchoolEventValidation = [
    body('organization_id', 'Organization ID is required').not().isEmpty(),
    body('name', 'Event name is required').trim().not().isEmpty(),
    body('venue', 'Venue is required').trim().not().isEmpty(),
    body('start_date', 'Start date is required').not().isEmpty(),
    body('end_date', 'End date is required').not().isEmpty(),
    body('time_start', 'Start time is required').not().isEmpty(),
    body('time_end', 'End time is required').not().isEmpty(),
    body('event_type', 'Event type is required').not().isEmpty(),
    body('event_mode', 'Event mode is required').not().isEmpty(),
    body('contact_person', 'Contact person is required').trim().not().isEmpty(),
    body('contact_email', 'Contact email is required').trim().isEmail(),
];


module.exports = {
    createProposalValidation,
    updateProposalValidation,
    createSchoolEventValidation
} 