const proposalService = require('../services/proposal.service');
const fileService = require('../services/file.service');
const { validationResult } = require("express-validator");
const fs = require("fs");
const { pool, query } = require('../config/database-postgresql-only');

const saveSection2Data = async (req, res) => {
    try {
        console.log('📥 Backend: Received Section 2 organization data:', req.body);
        const result = await proposalService.saveSection2Data(req.body);
        if (req.body.proposal_id) {
            res.json({
                id: result.id,
                message: 'Section 2 data updated successfully',
                affectedRows: result.affectedRows
            });
        } else {
            res.status(201).json({
                id: result.id,
                message: 'Section 2 data saved successfully',
                insertId: result.id
            });
        }
    } catch (error) {
        console.error('❌ PostgreSQL Error saving Section 2 data:', error);
        res.status(500).json({
            error: 'Database error',
            message: error.message,
        });
    }
};

const saveSection2OrgData = async (req, res) => {
    try {
        console.log('📥 PostgreSQL: Received Section 2 organization data:', req.body);
        const result = await proposalService.saveSection2OrgData(req.body);
        const responseData = {
            id: result.id,
            message: 'Section 2 organization data saved successfully to PostgreSQL',
            data: req.body,
            timestamp: new Date().toISOString()
        }
        if (req.body.proposal_id) {
            res.status(200).json(responseData);
        } else {
            res.status(201).json(responseData);
        }
    } catch (error) {
        console.error('❌ PostgreSQL: Error saving Section 2 data:', error);
        const statusCode = error.message === 'Proposal not found' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Database error',
            message: error.message,
        });
    }
};

const saveSection3EventData = async (req, res) => {
    try {
        console.log('📥 PostgreSQL SECTION 3: ==================== INCOMING REQUEST ====================');
        console.log('📥 PostgreSQL SECTION 3: Request method:', req.method);
        console.log('📥 PostgreSQL SECTION 3: Request headers:', {
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length'],
            'user-agent': req.headers['user-agent']
        });
        console.log('📥 PostgreSQL SECTION 3: Request body:', req.body);
        console.log('📥 PostgreSQL SECTION 3: Request files:', req.files);
        console.log('📥 PostgreSQL SECTION 3: Has files attached:', !!(req.files && Object.keys(req.files).length > 0));

        if (req.files && Object.keys(req.files).length > 0) {
            console.log('📎 PostgreSQL SECTION 3: FILE ATTACHMENT DETECTED - This should go to PostgreSQL!');
            console.log('📎 PostgreSQL SECTION 3: Files details:');
            Object.entries(req.files).forEach(([fieldName, fileInfo]) => {
                console.log(`📎 PostgreSQL SECTION 3: - ${fieldName}:`, {
                    originalname: fileInfo.originalname,
                    filename: fileInfo.filename,
                    mimetype: fileInfo.mimetype,
                    size: fileInfo.size,
                    path: fileInfo.path
                });
            });
            console.log('⚠️ PostgreSQL SECTION 3: WARNING - Files detected but this route only saves to PostgreSQL!');
            console.log('⚠️ PostgreSQL SECTION 3: Files should be handled by PostgreSQL unified API: /api/postgresql-unified/proposals/school-events');
        } else {
            console.log('📄 PostgreSQL SECTION 3: No files attached - proceeding with PostgreSQL-only save');
        }

        console.log('📥 PostgreSQL SECTION 3: Processed event data being saved to PostgreSQL:', req.body);
        const result = await proposalService.saveSection3EventData(req.body);

        console.log('✅ PostgreSQL SECTION 3: Successfully saved to PostgreSQL:', {
            id: result.id,
            previousStatus: result.previousStatus,
            newStatus: result.newStatus,
            autoPromoted: result.autoPromoted
        });

        res.status(200).json({
            id: result.id,
            message: 'Section 3 event data updated successfully in PostgreSQL (status preserved)',
            data: req.body,
            security: {
                previousStatus: result.previousStatus,
                newStatus: result.newStatus,
                autoPromoted: result.autoPromoted
            },
            fileHandling: {
                hasFiles: !!(req.files && Object.keys(req.files).length > 0),
                filesCount: req.files ? Object.keys(req.files).length : 0,
                note: req.files && Object.keys(req.files).length > 0 ?
                    'Files detected but not saved - use PostgreSQL unified API for file storage' :
                    'No files to process'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ PostgreSQL SECTION 3: Error updating Section 3 event data:', {
            error: error.message,
            stack: error.stack,
            requestBody: req.body,
            hasFiles: !!(req.files && Object.keys(req.files).length > 0)
        });
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            error: 'Database error',
            message: error.message,
        });
    }
};

const getDebugInfo = async (req, res) => {
    try {
        console.log('🔍 Debug: Getting proposal details for ID:', req.params.id);
        const proposalId = req.params.id;
        const info = await proposalService.getDebugProposalInfo(proposalId);
        res.json({
            success: true,
            proposalId: proposalId,
            ...info,
            recommendations: {
                hasData: !!(info.postgresql.found || info.postgresql.found),
                source: info.postgresql.found ? 'PostgreSQL' : info.postgresql.found ? 'PostgreSQL' : 'None',
                nextStep: !(info.postgresql.found || info.postgresql.found) ? 'Complete Section 2 first' : 'Data found, proceed to Section 3'
            }
        });
    } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const searchProposal = async (req, res) => {
    try {
        console.log('🔍 PostgreSQL: Searching for proposal:', req.body);
        const { organization_name, contact_email } = req.body;
        const proposal = await proposalService.searchProposal(organization_name, contact_email);

        if (!proposal) {
            // Return 200 with found: false, not 404
            return res.status(200).json({
                found: false,
                message: 'No proposal found with the given organization name and contact email'
            });
        }

        console.log('✅ PostgreSQL: Found proposal:', proposal);
        res.status(200).json({
            ...proposal,
            found: true,
            message: 'Proposal found successfully'
        });

    } catch (error) {
        console.error('❌ PostgreSQL: Error searching for proposal:', error);
        res.status(500).json({
            error: 'Database error',
            message: error.message,
        });
    }
};

const mockSection2 = async (req, res) => {
    console.log('📥 MOCK: Received Section 2 organization data:', req.body);
    const { title, contactPerson, contactEmail, proposal_id } = req.body;

    if (!title || !contactPerson || !contactEmail) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['title', 'contactPerson', 'contactEmail']
        });
    }

    const mockId = proposal_id || 'mock_' + Date.now();
    const mockResult = {
        id: mockId,
        message: 'MOCK: Section 2 data saved successfully (no database)',
        data: req.body,
        timestamp: new Date().toISOString()
    };

    console.log('✅ MOCK: Returning successful response:', mockResult);
    res.status(201).json(mockResult);
};

// ===================================================================
// postgresql DB PROPOSAL CRUD
// ===================================================================

const createProposal = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete file after validation error:', err);
                });
            });
        }
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const proposal = await proposalService.createProposal(req.body);
        // Persist files metadata into proposals/proposal_files/file_uploads per schema
        if (req.files && req.files.length) {
            await proposalService.saveProposalFiles(proposal.id, req.files, { uploadedBy: req.user?.id });
        }
        res.status(201).json(proposal);
    } catch (err) {
        console.error("Error creating proposal:", err.message);
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete file after DB error:', unlinkErr);
                });
            });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ errors: Object.values(err.errors).map(e => ({ msg: e.message, param: e.path })) });
        }
        res.status(500).send("Server error");
    }
};

const getProposals = async (req, res) => {
    try {
        const proposals = await proposalService.getProposals(req.user, req.query);
        res.json(proposals);
    } catch (err) {
        console.error("Error fetching proposals list:", err.message);
        res.status(500).send("Server error");
    }
};

const getProposalById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📊 PostgreSQL: Fetching proposal by ID:', id);

        // Fetch from PostgreSQL
        const [rows] = await pool.query(
            'SELECT * FROM proposals WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            console.log('❌ PostgreSQL: Proposal not found for ID:', id);
            return res.status(404).json({
                success: false,
                error: 'Proposal not found',
                message: `No proposal found with ID: ${id}`
            });
        }

        const proposal = rows[0];
        console.log('✅ PostgreSQL: Proposal found:', {
            id: proposal.id,
            organizationName: proposal.organization_name,
            status: proposal.proposal_status,
            contactEmail: proposal.contact_email
        });

        // Format response for frontend compatibility
        const formattedProposal = {
            id: proposal.id,
            organizationName: proposal.organization_name,
            organizationType: proposal.organization_type,
            organizationDescription: proposal.organization_description,
            contactName: proposal.contact_name,
            contactEmail: proposal.contact_email,
            contactPhone: proposal.contact_phone,
            eventName: proposal.event_name,
            eventVenue: proposal.event_venue,
            eventStartDate: proposal.event_start_date,
            eventEndDate: proposal.event_end_date,
            eventStartTime: proposal.event_start_time,
            eventEndTime: proposal.event_end_time,
            eventMode: proposal.event_mode,
            schoolEventType: proposal.school_event_type,
            schoolReturnServiceCredit: proposal.school_return_service_credit,
            schoolTargetAudience: proposal.school_target_audience,
            proposalStatus: proposal.proposal_status,
            reportStatus: proposal.report_status,
            createdAt: proposal.created_at,
            updatedAt: proposal.updated_at,
            submittedAt: proposal.submitted_at
        };

        res.json({
            success: true,
            proposal: formattedProposal,
            message: 'Proposal retrieved successfully'
        });

    } catch (error) {
        console.error('❌ PostgreSQL: Error fetching proposal by ID:', {
            error: error.message,
            stack: error.stack,
            proposalId: req.params.id
        });
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: error.message
        });
    }
};

const updateProposal = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete file after validation error:', err);
                });
            });
        }
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const proposal = await proposalService.updateProposal(req.params.id, req.body);
        if (req.files && req.files.length) {
            await proposalService.saveProposalFiles(req.params.id, req.files, { uploadedBy: req.user?.id });
        }
        res.json(proposal);
    } catch (err) {
        console.error("Error updating proposal:", err.message);
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete file after error:', unlinkErr);
                });
            });
        }
        if (err.statusCode) {
            return res.status(err.statusCode).json({ msg: err.message });
        }
        if (err.kind === "ObjectId" || err.message === "Proposal not found") {
            return res.status(404).json({ msg: "Proposal not found" });
        }
        res.status(500).send("Server error");
    }
};

const deleteProposal = async (req, res) => {
    try {
        const result = await proposalService.deleteProposal(req.params.id, req.user);
        res.json(result);
    } catch (err) {
        console.error("Error deleting proposal:", err.message);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ msg: err.message });
        }
        if (err.kind === "ObjectId" || err.message === "Proposal not found") {
            return res.status(404).json({ msg: "Proposal not found" });
        }
        res.status(500).send("Server error");
    }
};

const addDocuments = async (req, res) => {
    try {
        const updatedProposal = await fileService.addDocumentsToProposal(req.params.id, req.user, req.files);
        res.json(updatedProposal);
    } catch (err) {
        console.error("Error adding documents to proposal:", err.message);
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete file after error:', unlinkErr);
                });
            });
        }
        if (err.statusCode) {
            return res.status(err.statusCode).json({ msg: err.message });
        }
        if (err.kind === "ObjectId" || err.message === "Proposal not found") {
            return res.status(404).json({ msg: "Proposal not found" });
        }
        res.status(500).send("Server error");
    }
};

const deleteDocument = async (req, res) => {
    try {
        const updatedProposal = await fileService.deleteDocumentFromProposal(req.params.id, req.params.docId, req.user);
        res.json(updatedProposal);
    } catch (err) {
        console.error("Error deleting document from proposal:", err.message);
        if (err.statusCode) {
            return res.status(err.statusCode).json({ msg: err.message });
        }
        if (err.kind === "ObjectId" || err.message === "Proposal not found") {
            return res.status(404).json({ msg: "Proposal or document not found" });
        }
        res.status(500).send("Server error");
    }
};

const getUserDraftsAndRejected = async (req, res) => {
    try {
        console.log('📊 Fetching user drafts and rejected proposals...');
        console.log('🔐 User from auth middleware:', req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'User ID not found in request'
            });
        }

        const { id: userId, role, email } = req.user;
        const { status, limit = 50, offset = 0, includeRejected = 'true' } = req.query;

        console.log(`📊 Request details: userId=${userId}, role=${role}, email=${email}`);
        console.log(`📊 Query params: status=${status}, limit=${limit}, offset=${offset}, includeRejected=${includeRejected}`);

        let results = {
            postgresql: [],
            postgresql: [],
            total: 0,
            sources: [],
            debug: {
                postgresql: { attempted: false, success: false, error: null },
                postgresql: { attempted: false, success: false, error: null, collections: [], sampleData: [] }
            }
        };

        // ===== postgresql QUERY =====
        try {
            results.debug.postgresql.attempted = true;
            let postgresqlConditions = [];
            let postgresqlParams = [];

            // Role-based filtering for PostgreSQL
            if (role === 'student' || role === 'partner') {
                // Students and partners see only their own proposals
                postgresqlConditions.push('contact_email = ?');
                postgresqlParams.push(email);
            } else if (role === 'head_admin' || role === 'manager' || role === 'reviewer') {
                // Admins, managers, and reviewers can see all proposals
                // No additional filtering needed
            }

            // Status filtering
            const statusConditions = [];
            if (!status || status === 'all') {
                statusConditions.push("proposal_status = 'draft'");
                if (includeRejected === 'true') {
                    statusConditions.push("proposal_status = 'denied'");
                    statusConditions.push("proposal_status = 'revision_requested'");
                }
            } else if (status === 'draft') {
                statusConditions.push("proposal_status = 'draft'");
            } else if (status === 'rejected') {
                statusConditions.push("proposal_status = 'denied'");
                statusConditions.push("proposal_status = 'revision_requested'");
            }

            if (statusConditions.length > 0) {
                postgresqlConditions.push(`(${statusConditions.join(' OR ')})`);
            }

            const postgresqlWhereClause = postgresqlConditions.length > 0 ? `WHERE ${postgresqlConditions.join(' AND ')}` : '';

            const postgresqlQuery = `
                SELECT 
                    id, 
                    organization_name, 
                    organization_type, 
                    contact_email, 
                    contact_name,
                    event_name,
                    event_venue,
                    event_start_date,
                    event_end_date,
                    proposal_status, 
                    report_status,
                    updated_at, 
                    created_at,
                    admin_comments,
                    current_section,
                    form_completion_percentage
                FROM proposals 
                ${postgresqlWhereClause} 
                ORDER BY updated_at DESC 
                LIMIT ? OFFSET ?
            `;

            postgresqlParams.push(parseInt(limit), parseInt(offset));

            console.log('📊 PostgreSQL Query:', postgresqlQuery);
            console.log('📊 PostgreSQL Params:', postgresqlParams);

            const [postgresqlRows] = await pool.query(postgresqlQuery, postgresqlParams);

            results.postgresql = postgresqlRows.map(row => ({
                id: row.id,
                source: 'postgresql',
                name: row.organization_name || row.event_name || 'Untitled Proposal',
                organizationName: row.organization_name,
                organizationType: row.organization_type,
                contactEmail: row.contact_email,
                contactName: row.contact_name,
                eventName: row.event_name,
                eventVenue: row.event_venue,
                eventStartDate: row.event_start_date,
                eventEndDate: row.event_end_date,
                status: row.proposal_status,
                reportStatus: row.report_status,
                lastEdited: row.updated_at || row.created_at,
                createdAt: row.created_at,
                adminComments: row.admin_comments,
                currentSection: row.current_section || 'overview',
                progress: row.form_completion_percentage || 0,
                // Calculate progress based on current section if not stored
                calculatedProgress: calculateProgress(row.current_section, row.form_completion_percentage),
                step: mapSectionToStep(row.current_section),
                data: {
                    organizationName: row.organization_name,
                    organizationType: row.organization_type,
                    contactEmail: row.contact_email,
                    contactName: row.contact_name,
                    eventName: row.event_name
                }
            }));

            results.sources.push('postgresql');
            results.debug.postgresql.success = true;
            console.log(`✅ PostgreSQL: Found ${results.postgresql.length} proposals`);

        } catch (postgresqlError) {
            console.error('❌ PostgreSQL query error:', postgresqlError);
            results.debug.postgresql.error = postgresqlError.message;
            results.postgresqlError = postgresqlError.message;
        }

        // ===== ENHANCED postgresql QUERY =====
        try {
            results.debug.postgresql.attempted = true;

            // Use the working PostgreSQL connection directly
            const { clientPromise } = require('../config/postgresql');

            // Get client and database
            const client = await clientPromise;
            const db = client.db('cedo_db');

            console.log('🍃 PostgreSQL: Connection established successfully');

            // Test database access first
            await db.command({ ping: 1 });
            console.log('🍃 PostgreSQL: Database ping successful');

            // Get collections list to verify access
            const collections = await db.listCollections().toArray();
            results.debug.postgresql.collections = collections.map(c => c.name);
            console.log('🍃 PostgreSQL: Available collections:', results.debug.postgresql.collections);

            // Access proposals collection directly
            const proposalsCollection = db.collection('proposals');

            // Build PostgreSQL query conditions
            let postgresqlConditions = {};

            // Role-based filtering for PostgreSQL
            if (role === 'student' || role === 'partner') {
                postgresqlConditions.contactEmail = email;
            }

            // Status filtering for PostgreSQL
            const postgresqlStatusConditions = [];
            if (!status || status === 'all') {
                postgresqlStatusConditions.push('draft');
                if (includeRejected === 'true') {
                    postgresqlStatusConditions.push('rejected');
                }
            } else if (status === 'draft') {
                postgresqlStatusConditions.push('draft');
            } else if (status === 'rejected') {
                postgresqlStatusConditions.push('rejected');
            }

            if (postgresqlStatusConditions.length > 0) {
                postgresqlConditions.status = { $in: postgresqlStatusConditions };
            }

            console.log('🍃 PostgreSQL Query Conditions:', postgresqlConditions);

            // Execute the query
            const postgresqlProposals = await proposalsCollection
                .find(postgresqlConditions)
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset))
                .toArray();

            console.log(`🍃 PostgreSQL: Found ${postgresqlProposals.length} proposals matching conditions`);

            // Sample some documents for debugging
            if (postgresqlProposals.length > 0) {
                results.debug.postgresql.sampleData = postgresqlProposals.slice(0, 2).map(doc => ({
                    id: doc._id?.toString(),
                    status: doc.status,
                    email: doc.contactEmail,
                    title: doc.title
                }));
            }

            // Transform PostgreSQL results to match expected format
            results.postgresql = postgresqlProposals.map(proposal => ({
                id: proposal._id?.toString() || proposal.id,
                source: 'postgresql',
                name: proposal.title || proposal.eventName || proposal.organizationName || 'Untitled Proposal',
                organizationName: proposal.organizationName || proposal.organization_name,
                organizationType: proposal.organizationType || proposal.organization_type,
                contactEmail: proposal.contactEmail || proposal.contact_email,
                contactName: proposal.contactPerson || proposal.contact_person,
                eventName: proposal.title || proposal.eventName || proposal.event_name,
                eventVenue: proposal.location || proposal.venue || proposal.event_venue,
                eventStartDate: proposal.startDate || proposal.start_date,
                eventEndDate: proposal.endDate || proposal.end_date,
                status: proposal.status || proposal.proposalStatus || proposal.proposal_status,
                reportStatus: proposal.complianceStatus || proposal.compliance_status || 'not_applicable',
                lastEdited: proposal.updatedAt || proposal.updated_at || proposal.createdAt || proposal.created_at,
                createdAt: proposal.createdAt || proposal.created_at,
                adminComments: proposal.adminComments || proposal.admin_comments || '',
                currentSection: 'reporting',
                progress: 75,
                calculatedProgress: 75,
                step: 'reporting',
                data: {
                    organizationName: proposal.organizationName || proposal.organization_name,
                    organizationType: proposal.organizationType || proposal.organization_type,
                    contactEmail: proposal.contactEmail || proposal.contact_email,
                    contactName: proposal.contactPerson || proposal.contact_person,
                    eventName: proposal.title || proposal.eventName || proposal.event_name
                }
            }));

            console.log(`🍃 PostgreSQL: Transformed ${results.postgresql.length} proposals for response`);

            results.sources.push('postgresql');
            results.debug.postgresql.success = true;

        } catch (postgresqlError) {
            console.error('❌ PostgreSQL query error:', postgresqlError);
            results.debug.postgresql.error = postgresqlError.message;
            results.postgresqlError = postgresqlError.message;
        }

        // ===== COMBINE AND RETURN RESULTS =====
        const allProposals = [...results.postgresql, ...results.postgresql];

        // Sort combined results by lastEdited date (most recent first)
        allProposals.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));

        results.total = allProposals.length;
        results.proposals = allProposals;

        // Add metadata
        results.metadata = {
            userId,
            userRole: role,
            userEmail: email,
            queryParams: { status, limit, offset, includeRejected },
            timestamp: new Date().toISOString(),
            sources: results.sources,
            counts: {
                postgresql: results.postgresql.length,
                postgresql: results.postgresql.length,
                total: results.total
            }
        };

        console.log(`✅ Total proposals found: ${results.total}`);
        console.log(`📊 Sources used: ${results.sources.join(', ')}`);
        console.log(`🔧 Debug info:`, results.debug);

        res.json({
            success: true,
            ...results
        });

    } catch (error) {
        console.error('❌ getUserDraftsAndRejected error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper function to calculate progress based on current section
const calculateProgress = (currentSection, storedProgress) => {
    if (storedProgress && storedProgress > 0) return storedProgress;

    const progressMap = {
        'overview': 20,
        'orgInfo': 40,
        'schoolEvent': 60,
        'communityEvent': 60,
        'reporting': 80
    };

    return progressMap[currentSection] || 20;
};

// Helper function to map section to step name
const mapSectionToStep = (currentSection) => {
    const stepMap = {
        'overview': 'Overview',
        'orgInfo': 'Organization Info',
        'schoolEvent': 'School Event Details',
        'communityEvent': 'Community Event Details',
        'reporting': 'Reporting'
    };

    return stepMap[currentSection] || 'Overview';
};

module.exports = {
    saveSection2Data,
    saveSection2OrgData,
    saveSection3EventData,
    getDebugInfo,
    searchProposal,
    mockSection2,
    createProposal,
    getProposals,
    getProposalById,
    updateProposal,
    deleteProposal,
    addDocuments,
    deleteDocument,
    getUserDraftsAndRejected,
}; 