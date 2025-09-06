/**
 * Express server for Event Approval Form
 * Implements 404 route with performance monitoring and event API endpoints
 * 
 * Key approaches: Performance monitoring, UUID handling, comprehensive error handling
 */

const express = require('express');
const cors = require('cors');
const responseTime = require('response-time');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response time logging middleware
app.use(responseTime((req, res, time) => {
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${time.toFixed(3)}ms`;

    // Log slow requests (>273ms) with warning
    if (time > 273) {
        console.warn(`⚠️ SLOW REQUEST: ${logMessage}`);
    } else {
        console.log(logMessage);
    }
}));

// In-memory storage for demo (in production, use proper database)
const events = new Map();
const drafts = new Map();

// ===================================================================
// 404 ROUTE - INTENTIONAL 404 FOR /student-dashboard/submit-event
// ===================================================================

app.get('/student-dashboard/submit-event', (req, res) => {
    // Return 404 immediately - this is intentional
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
    });
});

// ===================================================================
// EVENT API ENDPOINTS
// ===================================================================

/**
 * Create a new event draft
 * POST /api/events
 */
app.post('/api/events', (req, res) => {
    try {
        const eventId = uuidv4();
        const now = new Date().toISOString();

        const event = {
            eventId,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            formData: req.body || {},
            version: 1
        };

        events.set(eventId, event);
        drafts.set(eventId, event);

        console.log(`✅ Created new event draft: ${eventId}`);

        res.status(201).json({
            success: true,
            eventId,
            event,
            message: 'Event draft created successfully'
        });
    } catch (error) {
        console.error('❌ Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event draft',
            message: error.message
        });
    }
});

/**
 * Get event by UUID
 * GET /api/events/:uuid
 */
app.get('/api/events/:uuid', (req, res) => {
    try {
        const { uuid } = req.params;

        if (!uuid || typeof uuid !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid UUID parameter'
            });
        }

        const event = events.get(uuid);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${uuid}`
            });
        }

        console.log(`✅ Retrieved event: ${uuid}`);

        res.json({
            success: true,
            event,
            message: 'Event retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Error retrieving event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve event',
            message: error.message
        });
    }
});

/**
 * Update event by UUID
 * PUT /api/events/:uuid
 */
app.put('/api/events/:uuid', (req, res) => {
    try {
        const { uuid } = req.params;

        if (!uuid || typeof uuid !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid UUID parameter'
            });
        }

        const existingEvent = events.get(uuid);

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${uuid}`
            });
        }

        const updatedEvent = {
            ...existingEvent,
            formData: { ...existingEvent.formData, ...req.body },
            updatedAt: new Date().toISOString(),
            version: existingEvent.version + 1
        };

        events.set(uuid, updatedEvent);
        drafts.set(uuid, updatedEvent);

        console.log(`✅ Updated event: ${uuid}`);

        res.json({
            success: true,
            event: updatedEvent,
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update event',
            message: error.message
        });
    }
});

/**
 * Submit event for review
 * POST /api/events/:uuid/submit
 */
app.post('/api/events/:uuid/submit', (req, res) => {
    try {
        const { uuid } = req.params;

        if (!uuid || typeof uuid !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid UUID parameter'
            });
        }

        const event = events.get(uuid);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${uuid}`
            });
        }

        // Validate required fields before submission
        const validationErrors = validateEventSubmission(event.formData);

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                validationErrors,
                message: 'Please complete all required fields before submission'
            });
        }

        const submittedEvent = {
            ...event,
            status: 'submitted_for_review',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: event.version + 1
        };

        events.set(uuid, submittedEvent);
        drafts.delete(uuid); // Remove from drafts when submitted

        console.log(`✅ Submitted event for review: ${uuid}`);

        res.json({
            success: true,
            event: submittedEvent,
            message: 'Event submitted for review successfully'
        });
    } catch (error) {
        console.error('❌ Error submitting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit event',
            message: error.message
        });
    }
});

/**
 * Get user's events (for dashboard)
 * GET /api/events?owner=userId
 */
app.get('/api/events', (req, res) => {
    try {
        const { owner, status } = req.query;

        let userEvents = Array.from(events.values());

        // Filter by owner if provided
        if (owner) {
            userEvents = userEvents.filter(event =>
                event.formData?.ownerId === owner ||
                event.formData?.contactEmail === owner
            );
        }

        // Filter by status if provided
        if (status) {
            userEvents = userEvents.filter(event => event.status === status);
        }

        // Sort by updated date (newest first)
        userEvents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        console.log(`✅ Retrieved ${userEvents.length} events for owner: ${owner || 'all'}`);

        res.json({
            success: true,
            events: userEvents,
            count: userEvents.length,
            message: 'Events retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Error retrieving events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve events',
            message: error.message
        });
    }
});

/**
 * Delete event by UUID
 * DELETE /api/events/:uuid
 */
app.delete('/api/events/:uuid', (req, res) => {
    try {
        const { uuid } = req.params;

        if (!uuid || typeof uuid !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid UUID parameter'
            });
        }

        const event = events.get(uuid);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
                message: `No event found with ID: ${uuid}`
            });
        }

        events.delete(uuid);
        drafts.delete(uuid);

        console.log(`✅ Deleted event: ${uuid}`);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete event',
            message: error.message
        });
    }
});

// ===================================================================
// VALIDATION FUNCTIONS
// ===================================================================

function validateEventSubmission(formData) {
    const errors = [];

    // Required fields validation
    if (!formData.title) errors.push('Event title is required');
    if (!formData.description) errors.push('Event description is required');
    if (!formData.eventType) errors.push('Event type is required');
    if (!formData.organizationName) errors.push('Organization name is required');
    if (!formData.contactPerson) errors.push('Contact person is required');
    if (!formData.contactEmail) errors.push('Contact email is required');
    if (!formData.dateRange?.start) errors.push('Start date is required');
    if (!formData.dateRange?.end) errors.push('End date is required');
    if (!formData.venueId) errors.push('Venue selection is required');
    if (!formData.agenda || formData.agenda.length === 0) errors.push('Event agenda is required');
    if (!formData.facilitators || formData.facilitators.length === 0) errors.push('At least one facilitator is required');
    if (!formData.learningObjectives || formData.learningObjectives.length < 3) errors.push('At least 3 learning objectives are required');
    if (!formData.riskLevel) errors.push('Risk level assessment is required');
    if (!formData.declarationSignature) errors.push('Declaration signature is required');
    if (!formData.declarationAccepted) errors.push('Declaration acceptance is required');

    // Conditional validations
    if (formData.onlineHybrid && !formData.meetingLink) {
        errors.push('Meeting link is required for online/hybrid events');
    }
    if ((formData.riskLevel === 'medium' || formData.riskLevel === 'high') && !formData.riskJustification) {
        errors.push('Risk justification is required for medium/high risk events');
    }
    if (formData.permitsRequired && !formData.permitStatus) {
        errors.push('Permit status is required when permits are needed');
    }
    if (formData.conflictOfInterest && (!formData.conflictDescription || !formData.mitigationPlan)) {
        errors.push('Conflict description and mitigation plan are required when conflict of interest exists');
    }

    return errors;
}

// ===================================================================
// HEALTH CHECK ENDPOINT
// ===================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        events: events.size,
        drafts: drafts.size
    });
});

// ===================================================================
// ERROR HANDLING MIDDLEWARE
// ===================================================================

app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

// ===================================================================
// SERVER STARTUP
// ===================================================================

app.listen(port, () => {
    console.log(`🚀 Event Approval Form server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`❌ 404 route: http://localhost:${port}/student-dashboard/submit-event`);
    console.log(`📝 API docs: http://localhost:${port}/api/events`);
    console.log(`⏱️  Performance target: ≤273ms for 404 route`);
});

module.exports = app;
