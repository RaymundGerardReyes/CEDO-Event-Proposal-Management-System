/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Event Management
 * =============================================
 * 
 * This module handles all event proposal submissions including school events
 * (Section 3) and community events (Section 4). It implements hybrid storage:
 * - MySQL: Relational proposal data
 * - MongoDB GridFS: File attachments
 * - MongoDB: Event metadata and admin comments
 * 
 * @module routes/mongodb-unified/events
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Hybrid MySQL + MongoDB storage
 * - GridFS file uploads with metadata
 * - Proposal ID linking between databases
 * - Comprehensive error handling and logging
 * - Data consistency validation
 */

const express = require('express');
const router = express.Router();

const {
    getDb,
    upload,
    toObjectId,
    uploadToGridFS,
    pool,
    validateProposalId,
    createErrorResponse,
    createSuccessResponse
} = require('./helpers');

// Import data sync service for organization name resolution
const dataSyncService = require('../../services/data-sync.service');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Resolve organization name from request data or database
 * 
 * @param {Object} reqBody - Request body containing organization data
 * @returns {Promise<string>} Resolved organization name
 */
const resolveOrganizationName = async (reqBody) => {
    let orgName = reqBody.organization_name;

    if (!orgName && reqBody.organization_id) {
        try {
            orgName = await dataSyncService.getOrganizationName(reqBody.organization_id);
        } catch (syncError) {
            console.error('❌ Error using sync service:', syncError);
            orgName = 'Unknown';
        }
    } else if (!orgName) {
        orgName = 'Unknown';
    }

    return orgName;
};

/**
 * Validate and get existing MySQL proposal or create new one
 * 
 * @param {Object} reqBody - Request body containing proposal data
 * @param {string} orgName - Organization name
 * @param {string} eventType - Type of event ('school' or 'community')
 * @returns {Promise<number>} MySQL proposal ID
 */
const getOrCreateMySQLProposal = async (reqBody, orgName, eventType) => {
    // Check if we have an existing proposal ID from the request
    if (reqBody.proposal_id) {
        const proposalId = validateProposalId(reqBody.proposal_id);
        if (!proposalId) {
            throw new Error(`Invalid proposal ID: ${reqBody.proposal_id}`);
        }

        // Verify the proposal exists
        const [existingProposal] = await pool.query(
            'SELECT id, proposal_status FROM proposals WHERE id = ?',
            [proposalId]
        );

        if (existingProposal.length === 0) {
            throw new Error(`Proposal with ID ${proposalId} not found`);
        }

        console.log('✅ Using existing proposal ID:', proposalId);
        return proposalId;
    }

    // Create new MySQL proposal if no existing ID provided
    console.log('💾 Creating new MySQL proposal...');

    const mysqlProposalData = {
        organization_name: orgName,
        organization_description: `${eventType === 'school' ? 'Event' : 'Community Event'}: ${reqBody.name} at ${reqBody.venue}`,
        organization_type: eventType === 'school' ? 'school-based' : 'community-based',
        contact_name: orgName,
        contact_email: 'contact@example.com',
        contact_phone: '+63-88-000-0000',
        event_name: reqBody.name,
        event_venue: reqBody.venue,
        event_start_date: reqBody.start_date,
        event_end_date: reqBody.end_date,
        event_start_time: reqBody.time_start,
        event_end_time: reqBody.time_end,
        [eventType === 'school' ? 'school_event_type' : 'community_event_type']: reqBody.event_type === 'competition' ? 'other' : reqBody.event_type,
        event_mode: reqBody.event_mode,
        proposal_status: 'pending',
        attendance_count: 0,
        objectives: `Organize ${reqBody.name} ${eventType === 'school' ? 'event' : 'community event'} at ${reqBody.venue}`,
        budget: 0
    };

    const insertQuery = `
        INSERT INTO proposals (
            organization_name, organization_description, organization_type,
            contact_name, contact_email, contact_phone,
            event_name, event_venue, event_start_date, event_end_date,
            event_start_time, event_end_time, ${eventType === 'school' ? 'school_event_type' : 'community_event_type'}, event_mode,
            proposal_status, attendance_count, objectives, budget,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertValues = [
        mysqlProposalData.organization_name,
        mysqlProposalData.organization_description,
        mysqlProposalData.organization_type,
        mysqlProposalData.contact_name,
        mysqlProposalData.contact_email,
        mysqlProposalData.contact_phone,
        mysqlProposalData.event_name,
        mysqlProposalData.event_venue,
        mysqlProposalData.event_start_date,
        mysqlProposalData.event_end_date,
        mysqlProposalData.event_start_time,
        mysqlProposalData.event_end_time,
        mysqlProposalData[eventType === 'school' ? 'school_event_type' : 'community_event_type'],
        mysqlProposalData.event_mode,
        mysqlProposalData.proposal_status,
        mysqlProposalData.attendance_count,
        mysqlProposalData.objectives,
        mysqlProposalData.budget
    ];

    const [mysqlResult] = await pool.query(insertQuery, insertValues);
    const newProposalId = mysqlResult.insertId;
    console.log('✅ New MySQL proposal created with ID:', newProposalId);

    return newProposalId;
};

/**
 * Upload files to GridFS and return metadata
 * 
 * @param {Object} files - Multer files object
 * @param {string} orgName - Organization name for file naming
 * @param {number} proposalId - MySQL proposal ID for linking
 * @returns {Promise<Object>} File metadata object
 */
const uploadFilesToGridFS = async (files, orgName, proposalId) => {
    const fileMetadata = {};

    if (files.gpoaFile) {
        console.log('📎 Processing GPOA file upload...');
        try {
            fileMetadata.gpoa = await uploadToGridFS(
                files.gpoaFile[0],
                'gpoa',
                orgName,
                proposalId.toString()
            );
            console.log('✅ GPOA file uploaded successfully:', {
                filename: fileMetadata.gpoa.filename,
                gridFsId: fileMetadata.gpoa.gridFsId,
                size: fileMetadata.gpoa.size
            });
        } catch (error) {
            console.error('❌ GPOA file upload failed:', error);
            throw new Error(`GPOA file upload failed: ${error.message}`);
        }
    }

    if (files.proposalFile) {
        console.log('📎 Processing Proposal file upload...');
        try {
            fileMetadata.proposal = await uploadToGridFS(
                files.proposalFile[0],
                'proposal',
                orgName,
                proposalId.toString()
            );
            console.log('✅ Proposal file uploaded successfully:', {
                filename: fileMetadata.proposal.filename,
                gridFsId: fileMetadata.proposal.gridFsId,
                size: fileMetadata.proposal.size
            });
        } catch (error) {
            console.error('❌ Proposal file upload failed:', error);
            throw new Error(`Proposal file upload failed: ${error.message}`);
        }
    }

    return fileMetadata;
};

/**
 * Create MongoDB proposal document
 * 
 * @param {Object} reqBody - Request body data
 * @param {string} orgName - Organization name
 * @param {number} mysqlProposalId - MySQL proposal ID
 * @param {Object} fileMetadata - File upload metadata
 * @param {string} eventType - Type of event ('school' or 'community')
 * @returns {Object} MongoDB proposal document
 */
const createMongoDBProposal = (reqBody, orgName, mysqlProposalId, fileMetadata, eventType) => {
    const baseProposal = {
        title: reqBody.name,
        description: `${eventType === 'school' ? 'Event' : 'Community Event'}: ${reqBody.name} at ${reqBody.venue}`,
        category: eventType === 'school' ? 'school-event' : 'community-event',
        startDate: new Date(reqBody.start_date),
        endDate: new Date(reqBody.end_date),
        location: reqBody.venue,
        submitter: reqBody.organization_id,
        budget: 0,
        objectives: `Organize ${reqBody.name} ${eventType === 'school' ? 'event' : 'community event'} at ${reqBody.venue}`,
        volunteersNeeded: 0,
        organizationType: eventType === 'school' ? 'school-based' : 'community-based',
        contactPerson: orgName,
        contactEmail: 'contact@example.com',
        contactPhone: '+63-88-000-0000',
        status: 'pending',
        priority: 'medium',
        assignedTo: '',
        adminComments: '',
        reviewComments: [],
        documents: [],
        complianceStatus: 'not_applicable',
        complianceDocuments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        proposalId: mysqlProposalId.toString(),
        files: fileMetadata
    };

    // Add event-specific details
    baseProposal.eventDetails = {
        timeStart: reqBody.time_start,
        timeEnd: reqBody.time_end,
        eventType: reqBody.event_type === 'competition' ? 'other' : reqBody.event_type,
        eventMode: reqBody.event_mode,
        returnServiceCredit: parseInt(reqBody.return_service_credit || reqBody.sdp_credits || '0'),
        targetAudience: JSON.parse(reqBody.target_audience || '[]'),
        organizationId: reqBody.organization_id
    };

    return baseProposal;
};

// =============================================
// SCHOOL EVENT ROUTES (Section 3)
// =============================================

/**
 * @route POST /api/mongodb-unified/proposals/school-events
 * @desc Save school event proposal with file attachments
 * @access Public (Student)
 * 
 * @body {string} proposal_id - Existing MySQL proposal ID (optional)
 * @body {string} organization_name - Organization name
 * @body {string} name - Event name
 * @body {string} venue - Event venue
 * @body {string} start_date - Event start date (YYYY-MM-DD)
 * @body {string} end_date - Event end date (YYYY-MM-DD)
 * @body {string} time_start - Event start time (HH:MM)
 * @body {string} time_end - Event end time (HH:MM)
 * @body {string} event_type - Type of event
 * @body {string} event_mode - Event mode (online/offline)
 * @body {string} return_service_credit - Service credit hours
 * @body {string} target_audience - JSON array of target audiences
 * @body {File} gpoaFile - GPOA document (optional)
 * @body {File} proposalFile - Proposal document (optional)
 * 
 * @returns {Object} Success response with MongoDB ID and file metadata
 */
router.post(
    '/proposals/school-events',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            console.log('🏫 MONGODB SECTION 3: ==================== SCHOOL EVENT SAVE REQUEST ====================');
            console.log('🏫 MONGODB SECTION 3: Request method:', req.method);
            console.log('🏫 MONGODB SECTION 3: Request body keys:', Object.keys(req.body));
            console.log('🏫 MONGODB SECTION 3: Has files attached:', !!(req.files && Object.keys(req.files).length > 0));

            const db = await getDb();
            console.log('🔗 MONGODB SECTION 3: Database connection established');

            // STEP 1: Resolve organization name
            const orgName = await resolveOrganizationName(req.body);
            console.log('🏢 MONGODB SECTION 3: Organization name for file metadata:', orgName);

            // STEP 2: Get or create MySQL proposal
            const mysqlProposalId = await getOrCreateMySQLProposal(req.body, orgName, 'school');

            // STEP 3: Upload files to GridFS
            const fileMetadata = await uploadFilesToGridFS(req.files, orgName, mysqlProposalId);
            console.log('📁 MONGODB SECTION 3: File upload process completed. File metadata:', fileMetadata);

            // STEP 4: Create MongoDB proposal document
            const proposalData = createMongoDBProposal(req.body, orgName, mysqlProposalId, fileMetadata, 'school');

            console.log('💾 MONGODB SECTION 3: Inserting proposal data into MongoDB...');
            const result = await db.collection('proposals').insertOne(proposalData);
            console.log('✅ MONGODB SECTION 3: Proposal successfully inserted into MongoDB:', {
                insertedId: result.insertedId,
                acknowledged: result.acknowledged
            });

            // STEP 5: Check data consistency
            try {
                const consistencyCheck = await dataSyncService.ensureProposalConsistency(req.body.organization_id);
                console.log('🔄 MONGODB SECTION 3: Data consistency check:', {
                    consistent: consistencyCheck.consistency.consistent,
                    recommendations: consistencyCheck.recommendations
                });
            } catch (consistencyError) {
                console.warn('⚠️ MONGODB SECTION 3: Consistency check failed:', consistencyError.message);
            }

            // STEP 6: Send success response
            const responseData = createSuccessResponse({
                id: result.insertedId,
                files: fileMetadata,
                fileUploads: Object.keys(fileMetadata).reduce((acc, key) => {
                    acc[key] = {
                        success: true,
                        filename: fileMetadata[key].filename,
                        mongoId: fileMetadata[key].gridFsId,
                        size: fileMetadata[key].size
                    };
                    return acc;
                }, {}),
                dataConsistency: {
                    organizationName: orgName,
                    filesStored: Object.keys(fileMetadata).length,
                    proposalLinked: !!req.body.organization_id
                }
            }, 'School event proposal saved successfully');

            console.log('🎉 MONGODB SECTION 3: Sending successful response:', responseData);
            res.json(responseData);

        } catch (error) {
            console.error('❌ MONGODB SECTION 3: Error saving school event:', {
                error: error.message,
                stack: error.stack,
                requestBody: req.body,
                files: req.files ? Object.keys(req.files) : [],
                hasFiles: !!(req.files && Object.keys(req.files).length > 0)
            });

            // Add detailed validation error logging
            if (error.message.includes('Document failed validation')) {
                console.error('🔍 MONGODB SECTION 3: Validation error details:', {
                    errorCode: error.code,
                    errorName: error.codeName,
                    errorLabels: error.errorLabels,
                    errorResponse: error.errorResponse
                });
            }

            const errorResponse = createErrorResponse(
                error.message,
                500,
                'Check server logs for more information'
            );
            res.status(500).json(errorResponse);
        }
    }
);

// =============================================
// COMMUNITY EVENT ROUTES (Section 4)
// =============================================

/**
 * @route POST /api/mongodb-unified/proposals/community-events
 * @desc Save community event proposal with file attachments
 * @access Public (Student)
 * 
 * @body {string} proposal_id - Existing MySQL proposal ID (optional)
 * @body {string} organization_name - Organization name
 * @body {string} name - Event name
 * @body {string} venue - Event venue
 * @body {string} start_date - Event start date (YYYY-MM-DD)
 * @body {string} end_date - Event end date (YYYY-MM-DD)
 * @body {string} time_start - Event start time (HH:MM)
 * @body {string} time_end - Event end time (HH:MM)
 * @body {string} event_type - Type of event
 * @body {string} event_mode - Event mode (online/offline)
 * @body {string} sdp_credits - SDP credit hours
 * @body {string} target_audience - JSON array of target audiences
 * @body {File} gpoaFile - GPOA document (optional)
 * @body {File} proposalFile - Proposal document (optional)
 * 
 * @returns {Object} Success response with MongoDB ID and file metadata
 */
router.post(
    '/proposals/community-events',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            console.log('🌍 MONGODB SECTION 4: ==================== COMMUNITY EVENT SAVE REQUEST ====================');
            console.log('🌍 MONGODB SECTION 4: Request method:', req.method);
            console.log('🌍 MONGODB SECTION 4: Request body keys:', Object.keys(req.body));
            console.log('🌍 MONGODB SECTION 4: Has files attached:', !!(req.files && Object.keys(req.files).length > 0));

            const db = await getDb();
            console.log('🔗 MONGODB SECTION 4: Database connection established');

            // STEP 1: Resolve organization name
            const orgName = await resolveOrganizationName(req.body);
            console.log('🏢 MONGODB SECTION 4: Organization name for file metadata:', orgName);

            // STEP 2: Get or create MySQL proposal
            const mysqlProposalId = await getOrCreateMySQLProposal(req.body, orgName, 'community');

            // STEP 3: Upload files to GridFS
            const fileMetadata = await uploadFilesToGridFS(req.files, orgName, mysqlProposalId);
            console.log('📁 MONGODB SECTION 4: File upload process completed. File metadata:', fileMetadata);

            // STEP 4: Create MongoDB proposal document
            const proposalData = createMongoDBProposal(req.body, orgName, mysqlProposalId, fileMetadata, 'community');

            console.log('💾 MONGODB SECTION 4: Inserting proposal data into MongoDB...');
            const result = await db.collection('proposals').insertOne(proposalData);
            console.log('✅ MONGODB SECTION 4: Proposal successfully inserted into MongoDB:', {
                insertedId: result.insertedId,
                acknowledged: result.acknowledged
            });

            // STEP 5: Send success response
            const responseData = createSuccessResponse({
                id: result.insertedId,
                files: fileMetadata,
                fileUploads: Object.keys(fileMetadata).reduce((acc, key) => {
                    acc[key] = {
                        success: true,
                        filename: fileMetadata[key].filename,
                        mongoId: fileMetadata[key].gridFsId,
                        size: fileMetadata[key].size
                    };
                    return acc;
                }, {}),
                dataConsistency: {
                    organizationName: orgName,
                    filesStored: Object.keys(fileMetadata).length,
                    proposalLinked: !!req.body.organization_id
                }
            }, 'Community event proposal saved successfully');

            console.log('🎉 MONGODB SECTION 4: Sending successful response:', responseData);
            res.json(responseData);

        } catch (error) {
            console.error('❌ MONGODB SECTION 4: Error saving community event:', {
                error: error.message,
                stack: error.stack,
                requestBody: req.body,
                files: req.files ? Object.keys(req.files) : [],
                hasFiles: !!(req.files && Object.keys(req.files).length > 0)
            });

            const errorResponse = createErrorResponse(
                error.message,
                500,
                'Check server logs for more information'
            );
            res.status(500).json(errorResponse);
        }
    }
);

module.exports = router; 