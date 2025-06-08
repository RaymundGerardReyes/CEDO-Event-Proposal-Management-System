const express = require("express")
const router = express.Router()
const { pool } = require("../config/db") // MySQL connection pool
const { validateToken, validateAdmin } = require("../middleware/auth") // Updated JWT authentication middleware

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