const express = require("express")
const router = express.Router()
const proposalController = require('../../controllers/proposal.controller');
const reportController = require('../../controllers/report.controller');
const { validateToken } = require("../../middleware/auth");
const { upload } = require("../../config/multer.config");
const { createProposalValidation, updateProposalValidation } = require("../../validators/proposal.validator");
const { rateLimiters } = require('../../middleware/performance');

const adminRoutes = require('./admin.routes');
const reportRoutes = require('./report.routes');

router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

// NEW: Comprehensive drafts and rejected proposals endpoint
router.get("/drafts-and-rejected", validateToken, proposalController.getUserDraftsAndRejected);

// NEW: MongoDB debugging and diagnostics endpoint
router.get("/debug-mongodb", validateToken, async (req, res) => {
    try {
        console.log('🔍 MongoDB Debug Endpoint Called');
        console.log('👤 User:', req.user);

        const { clientPromise, debugMongoDB, testConnection } = require('../../config/mongodb');

        // Test basic connection
        const connectionTest = await testConnection();

        // Get comprehensive debug info
        const debugInfo = await debugMongoDB();

        // Try to connect and get detailed info
        const client = await clientPromise;
        const adminDb = client.db('admin');

        // List all databases
        const { databases } = await adminDb.admin().listDatabases();

        // Check specific database
        const cedoDb = client.db('cedo_auth');
        const collections = await cedoDb.listCollections().toArray();

        // Sample data from each collection
        const collectionData = {};
        for (const collection of collections) {
            try {
                const coll = cedoDb.collection(collection.name);
                const count = await coll.countDocuments();
                const sample = count > 0 ? await coll.find({}).limit(2).toArray() : [];

                collectionData[collection.name] = {
                    count,
                    sample: sample.map(doc => ({
                        id: doc._id?.toString(),
                        keys: Object.keys(doc),
                        status: doc.status || doc.proposalStatus || doc.proposal_status || 'N/A',
                        email: doc.contactEmail || doc.contact_email || doc.email || 'N/A'
                    }))
                };
            } catch (err) {
                collectionData[collection.name] = { error: err.message };
            }
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            mongodb: {
                connectionTest,
                databases: databases.map(db => db.name),
                cedoAuthCollections: collections.map(c => c.name),
                collectionData,
                environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
                }
            }
        });

    } catch (error) {
        console.error('❌ MongoDB Debug Error:', error);
        res.status(500).json({
            success: false,
            error: 'MongoDB debug failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// NEW: Test endpoint for the comprehensive API (development only)
router.get("/test-drafts-api", validateToken, async (req, res) => {
    try {
        console.log('🧪 Testing comprehensive drafts API...');
        console.log('🔐 User from middleware:', req.user);

        res.json({
            success: true,
            message: 'Comprehensive drafts API test endpoint',
            user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role
            },
            timestamp: new Date().toISOString(),
            endpoints: {
                main: '/api/proposals/drafts-and-rejected',
                debug: '/api/proposals/debug-mongodb',
                test: '/api/proposals/test-drafts-api'
            },
            nextSteps: [
                '1. Check your MongoDB connection string in environment variables',
                '2. Verify database name and collection names match your data',
                '3. Test the debug-mongodb endpoint for detailed diagnostics',
                '4. Check the browser network tab for detailed error responses'
            ]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// MYSQL COMPATIBILITY ROUTES
router.post("/section2", proposalController.saveSection2Data);
router.post("/section2-organization", proposalController.saveSection2OrgData);
router.post("/section3-event", proposalController.saveSection3EventData);

// MySQL proposal retrieval endpoint - MISSING ENDPOINT FIX
router.get("/mysql/:id", proposalController.getProposalById);

// Debug and Search
router.get("/debug/:id", proposalController.getDebugInfo);
router.post("/search", proposalController.searchProposal);

// Mock
router.post("/section2-mock", proposalController.mockSection2);

// Dashboard stats
router.get('/stats', validateToken, reportController.getDashboardStats);
router.get('/stats/live', validateToken, reportController.getLiveStats);

// MONGO DB PROPOSAL CRUD
router.post(
    "/",
    validateToken,
    upload.fields([
        { name: 'school_gpoa_file', maxCount: 1 },
        { name: 'school_proposal_file', maxCount: 1 },
        { name: 'community_gpoa_file', maxCount: 1 },
        { name: 'community_proposal_file', maxCount: 1 },
        { name: 'accomplishment_report_file', maxCount: 1 }
    ]),
    createProposalValidation,
    proposalController.createProposal
);

router.get("/", validateToken, rateLimiters.table, proposalController.getProposals);
router.get("/:id", validateToken, proposalController.getProposalById);

router.put(
    "/:id",
    validateToken,
    upload.fields([
        { name: 'school_gpoa_file', maxCount: 1 },
        { name: 'school_proposal_file', maxCount: 1 },
        { name: 'community_gpoa_file', maxCount: 1 },
        { name: 'community_proposal_file', maxCount: 1 },
        { name: 'accomplishment_report_file', maxCount: 1 }
    ]),
    updateProposalValidation,
    proposalController.updateProposal
);

router.delete("/:id", validateToken, proposalController.deleteProposal);

// Document Management
router.post("/:id/documents",
    validateToken,
    upload.array("documents", 5),
    proposalController.addDocuments
);

router.delete("/:id/documents/:docId",
    validateToken,
    proposalController.deleteDocument
);

// Add this route for draft creation:
router.post("/drafts", async (req, res) => {
    console.log('Received POST /api/proposals/drafts');
    // You can add authentication middleware if needed
    try {
        // Create a new draft object (customize as needed)
        const draft = {
            draftId: require('crypto').randomUUID(),
            form_data: {},
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        // TODO: Save draft to your database here if needed

        res.status(201).json({ draftId: draft.draftId });
    } catch (err) {
        res.status(500).json({ error: "Failed to create draft", message: err.message });
    }
});

module.exports = router; 