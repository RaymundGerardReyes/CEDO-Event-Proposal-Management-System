const express = require("express")
const router = express.Router()
const { pool } = require("../config/db") // MySQL connection pool
const { validateToken, validateAdmin } = require("../middleware/auth") // Updated JWT authentication middleware

// ===============================================
// GET /api/events/approved  –  Approved proposals -> "events" list
// ===============================================

/**
 * Returns all proposals that have `proposal_status = 'approved'`.  If the caller
 * provides `email` as a query-string ( ?email=user@example.com ) we additionally
 * filter so the student only sees their own events.
 *
 * The shape of each record matches what the front-end SubmitEvent flow expects
 * (see Section1_Overview.jsx → fetchApprovedEvents).
 */
router.get("/approved", async (req, res) => {
    try {
        const contactEmail = req.query.email; // optional filter by email
        const statusParam = req.query.status || 'approved'; // can be comma-separated

        // Split, trim and dedupe statuses
        const statuses = Array.from(new Set(statusParam.split(',').map(s => s.trim().toLowerCase())));

        console.log("📋 Events API: fetching proposals with statuses:", statuses, contactEmail ? `for ${contactEmail}` : "(no email filter)");

        // Build SQL & params dynamically (IN (? , ? ...))
        let placeholders = statuses.map(() => '?').join(',');
        let sql = `
            SELECT id,
                   organization_name,
                   organization_type,
                   contact_email,
                   contact_name,
                   event_name,
                   event_venue,
                   event_start_date,
                   event_end_date,
                   proposal_status,
                   event_status,
                   created_at,
                   updated_at,
                   -- Section-5 columns
                   accomplishment_report_file_name,
                   accomplishment_report_file_path,
                   pre_registration_file_name,
                   pre_registration_file_path,
                   final_attendance_file_name,
                   final_attendance_file_path,
                   attendance_count,
                   report_description,
                   0  AS form_completion_percentage,
                   'applicable' AS report_status
            FROM   proposals
            WHERE  proposal_status IN (${placeholders})`;

        const params = [...statuses];
        if (contactEmail) {
            sql += ' AND contact_email = ?';
            params.push(contactEmail);
        }

        sql += ' ORDER BY updated_at DESC';

        const [rows] = await pool.query(sql, params);

        // Normalise / alias fields so the client doesn't have to guess
        const events = rows.map((row) => ({
            id: row.id,
            uuid: null,
            organization_name: row.organization_name,
            organization_type: row.organization_type,
            event_name: row.event_name,
            event_venue: row.event_venue,
            event_start_date: row.event_start_date,
            event_end_date: row.event_end_date,
            proposal_status: row.proposal_status,
            report_status: row.report_status || "not_applicable",
            accomplishment_report_file_name: row.accomplishment_report_file_name || null,
            accomplishment_report_file_path: row.accomplishment_report_file_path || null,
            pre_registration_file_name: row.pre_registration_file_name || null,
            pre_registration_file_path: row.pre_registration_file_path || null,
            final_attendance_file_name: row.final_attendance_file_name || null,
            final_attendance_file_path: row.final_attendance_file_path || null,
            attendance_count: row.attendance_count,
            report_description: row.report_description,
            contact_email: row.contact_email,
            contact_name: row.contact_name,
            created_at: row.created_at,
            updated_at: row.updated_at,
            event_status: row.event_status || "pending",
            form_completion_percentage: row.form_completion_percentage || 0,
        }));

        res.json({ success: true, events, count: events.length });
    } catch (err) {
        console.error("❌ Events API: failed to fetch approved events", err);
        res.status(500).json({ success: false, error: "Failed to fetch approved events", message: err.message });
    }
});

// @route   GET /api/events
// @desc    Get all events
// @access  Public (or Private if you want auth)
router.get("/", async (req, res) => {
    try {
        // For now, return a simple response since we don't have an events table yet
        // You can modify this to query actual events from your database
        const events = [
            {
                id: "EVENT-001",
                title: "Science Fair Exhibition",
                startDate: "2023-03-20T09:00:00",
                endDate: "2023-03-20T17:00:00",
                location: "Main Campus Hall",
                attendees: 120,
                category: "academic",
                status: "upcoming",
                description: "Annual science fair showcasing student projects from various departments.",
            },
            {
                id: "EVENT-002",
                title: "Leadership Workshop",
                startDate: "2023-03-22T13:00:00",
                endDate: "2023-03-22T16:00:00",
                location: "Conference Room B",
                attendees: 45,
                category: "leadership",
                status: "upcoming",
                description: "Interactive workshop on leadership skills and team management.",
            }
        ];

        res.json({
            status: "success",
            data: events,
            message: "Events retrieved successfully"
        });
    } catch (error) {
        console.error("Error in events route:", error.message);
        res.status(500).json({
            status: "error",
            message: "Server error fetching events",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
        });
    }
});

// @route   GET /api/events/:id
// @desc    Get a specific event by ID
// @access  Public
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // For now, return a mock event
        // You can modify this to query the actual event from your database
        const event = {
            id: id,
            title: "Sample Event",
            startDate: "2023-03-20T09:00:00",
            endDate: "2023-03-20T17:00:00",
            location: "Main Campus Hall",
            attendees: 120,
            category: "academic",
            status: "upcoming",
            description: "Sample event description.",
        };

        res.json({
            status: "success",
            data: event,
            message: "Event retrieved successfully"
        });
    } catch (error) {
        console.error("Error in events route:", error.message);
        res.status(500).json({
            status: "error",
            message: "Server error fetching event",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
        });
    }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (requires authentication)
router.post("/", validateToken, async (req, res) => {
    try {
        const { title, description, startDate, endDate, location, category } = req.body;

        // Basic validation
        if (!title || !startDate || !endDate) {
            return res.status(400).json({
                status: "error",
                message: "Title, start date, and end date are required"
            });
        }

        // For now, return a mock response
        // You can modify this to actually create the event in your database
        const newEvent = {
            id: `EVENT-${Date.now()}`,
            title,
            description,
            startDate,
            endDate,
            location,
            category,
            status: "upcoming",
            createdBy: req.user.id,
            createdAt: new Date().toISOString()
        };

        res.status(201).json({
            status: "success",
            data: newEvent,
            message: "Event created successfully"
        });
    } catch (error) {
        console.error("Error creating event:", error.message);
        res.status(500).json({
            status: "error",
            message: "Server error creating event",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
        });
    }
});

module.exports = router; 