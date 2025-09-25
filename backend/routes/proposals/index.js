const express = require("express")
const router = express.Router()
const { validateToken } = require("../../middleware/auth");
const { upload } = require("../../config/multer.config");
const { rateLimiters } = require('../../middleware/performance');

// ✅ REFACTORED: Import unified data access layer
const {
    getProposalById,
    createProposal,
    updateProposal,
    deleteProposal,
    getUserProposals,
    saveEventTypeSelection
} = require('../../lib/db/proposals');

// ✅ REFACTORED: Import unified utilities
const { formatISO, formatDisplay } = require('../../lib/utils/date');
const { validateEventType, sanitizeData } = require('../../lib/utils/validation');

const adminRoutes = require('./admin.routes');
const reportRoutes = require('./report.routes');

router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

// ✅ REFACTORED: Unified proposals endpoint
router.get("/drafts-and-rejected", validateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const proposals = await getUserProposals(userId, {
            status: ['draft', 'rejected']
        });

        res.json({
            success: true,
            proposals: proposals.map(proposal => ({
                ...proposal,
                created_at: formatDisplay(proposal.created_at),
                updated_at: formatDisplay(proposal.updated_at)
            }))
        });
    } catch (error) {
        console.error('❌ Error getting user proposals:', error);
        res.status(500).json({ error: 'Failed to get proposals', message: error.message });
    }
});

// PostgreSQL debugging endpoint
router.get("/debug-postgresql", validateToken, async (req, res) => {
    try {
        console.log('🔍 PostgreSQL Debug Endpoint Called');

        const { query } = require('../../config/database-postgresql-only');
        const connectionTest = await query('SELECT 1 as test, current_database() as database, current_user as user');

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            postgresql: {
                connectionTest: connectionTest.rows[0],
                environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
                    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'cedo_auth'
                }
            }
        });
    } catch (error) {
        console.error('❌ PostgreSQL Debug Error:', error);
        res.status(500).json({
            success: false,
            error: 'PostgreSQL debug failed',
            message: error.message
        });
    }
});

// ✅ REFACTORED: Unified draft creation endpoint
router.post("/drafts", validateToken, async (req, res) => {
    try {
        console.log('🔐 Draft creation request received');

        const userId = req.user?.id;
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({ error: 'Invalid user ID for draft creation' });
        }

        const proposal = await createProposal(req.body, userId);

        res.status(201).json(proposal);
    } catch (error) {
        console.error('❌ Error creating draft:', error);
        res.status(500).json({ error: 'Failed to create draft', message: error.message });
    }
});

// ✅ REFACTORED: Unified draft retrieval endpoint
router.get("/drafts/:uuid", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        const proposal = await getProposalById(uuid, { status: 'draft' });

        res.json({
            ...proposal,
            created_at: formatDisplay(proposal.created_at),
            updated_at: formatDisplay(proposal.updated_at)
        });
    } catch (error) {
        console.error('❌ Error fetching draft:', error);
        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Draft not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch draft', message: error.message });
        }
    }
});

// ✅ REFACTORED: Unified event type selection endpoint
router.post("/drafts/:uuid/event-type", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        const { eventType } = req.body;
        const userId = req.user?.id;

        console.log('🎯 Event type route called:', {
            uuid,
            eventType,
            userId,
            body: req.body
        });

        // Validate event type
        console.log('🔍 Validating event type:', eventType);
        const validation = validateEventType(eventType);
        console.log('🔍 Validation result:', validation);

        if (!validation.isValid) {
            console.log('❌ Event type validation failed:', validation.error);
            return res.status(400).json({ error: validation.error });
        }

        console.log('✅ Event type validation passed');

        console.log('🔄 Calling saveEventTypeSelection with:', { uuid, eventType, userId });
        const result = await saveEventTypeSelection(uuid, eventType, userId);
        console.log('✅ saveEventTypeSelection returned:', result);

        console.log('📤 Sending response:', result);
        res.json(result);
    } catch (error) {
        console.error('❌ Error saving event type selection:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            uuid: req.params.uuid,
            eventType: req.body.eventType,
            userId: req.user?.id
        });

        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Draft not found' });
        } else if (error.message.includes('Invalid event type')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to save event type selection', message: error.message });
        }
    }
});

// ✅ REFACTORED: Unified draft update endpoint
router.patch("/drafts/:uuid/:section", validateToken, async (req, res) => {
    try {
        const { uuid, section } = req.params;
        const updateData = sanitizeData(req.body);

        const result = await updateProposal(uuid, {
            section,
            payload: updateData
        });

        res.json(result);
    } catch (error) {
        console.error('❌ Error updating draft:', error);
        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Draft not found' });
        } else {
            res.status(500).json({ error: 'Failed to update draft', message: error.message });
        }
    }
});

// ✅ REFACTORED: Unified draft submission endpoint
router.post("/drafts/:uuid/submit", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        const result = await updateProposal(uuid, {
            proposal_status: 'pending'
        });

        res.json({ success: true, message: 'Draft submitted successfully' });
    } catch (error) {
        console.error('❌ Error submitting draft:', error);
        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Draft not found' });
        } else {
            res.status(500).json({ error: 'Failed to submit draft', message: error.message });
        }
    }
});

// ✅ REFACTORED: Unified proposal deletion endpoint
router.delete("/drafts/:uuid", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        await deleteProposal(uuid);

        res.status(204).end();
    } catch (error) {
        console.error('❌ Error deleting draft:', error);
        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Draft not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete draft', message: error.message });
        }
    }
});

// ✅ REFACTORED: Unified proposal retrieval endpoint
router.get("/:uuid", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        console.log('🔍 Fetching proposal with UUID:', uuid);

        // Pass user ID for auto-creation if needed
        const options = {
            userId: req.user.id
        };

        const proposal = await getProposalById(uuid, options);

        console.log('✅ Proposal fetched successfully:', {
            uuid: proposal.uuid,
            status: proposal.proposal_status,
            userId: proposal.user_id
        });

        res.json({
            ...proposal,
            created_at: formatDisplay(proposal.created_at),
            updated_at: formatDisplay(proposal.updated_at)
        });
    } catch (error) {
        console.error('❌ Error fetching proposal:', error);

        // Enhanced error handling with better messages
        if (error.message.includes('Proposal not found')) {
            res.status(404).json({
                error: 'Proposal not found',
                message: error.message,
                uuid: req.params.uuid,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch proposal',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
});

// ✅ REFACTORED: Unified proposal update endpoint
router.put("/:uuid", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;
        const updateData = sanitizeData(req.body);

        const result = await updateProposal(uuid, updateData);

        res.json(result);
    } catch (error) {
        console.error('❌ Error updating proposal:', error);
        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Proposal not found' });
        } else {
            res.status(500).json({ error: 'Failed to update proposal', message: error.message });
        }
    }
});

// ✅ REFACTORED: Unified proposal deletion endpoint
router.delete("/:uuid", validateToken, async (req, res) => {
    try {
        const { uuid } = req.params;

        await deleteProposal(uuid);

        res.status(204).end();
    } catch (error) {
        console.error('❌ Error deleting proposal:', error);
        if (error.message === 'Proposal not found') {
            res.status(404).json({ error: 'Proposal not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete proposal', message: error.message });
        }
    }
});

module.exports = router; 