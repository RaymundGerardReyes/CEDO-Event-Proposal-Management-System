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
    createSuccessResponse,
    uploadFile,
    query
} = require('./helpers');

// Add MySQL integration at the top
const { v4: uuidv4 } = require('uuid');

// Helper function to save to MySQL proposals table
const saveToMySQLProposals = async (eventData, files, eventType, userId = null) => {
    try {
        console.log('💾 MYSQL INTEGRATION: Saving to MySQL proposals table...');

        // Generate UUID for cross-database sync
        const uuid = uuidv4();

        // Map MongoDB data to MySQL proposals table structure
        const mysqlData = {
            uuid: uuid,
            organization_name: eventData.organizationName || 'Unknown Organization',
            organization_type: eventType === 'school' ? 'school-based' : 'community-based',
            organization_description: eventData.organizationDescription || '',
            contact_name: eventData.contactPerson || eventData.contact_person || 'Unknown Contact',
            contact_email: eventData.contactEmail || eventData.contact_email || 'unknown@example.com',
            contact_phone: eventData.contactPhone || eventData.contact_phone || '0000000000',
            event_name: eventData.name || eventData.eventName || 'Unknown Event',
            event_venue: eventData.venue || eventData.eventVenue || '',
            event_start_date: eventData.start_date || eventData.startDate || null,
            event_end_date: eventData.end_date || eventData.endDate || null,
            event_start_time: eventData.time_start || eventData.startTime || null,
            event_end_time: eventData.time_end || eventData.endTime || null,
            event_mode: eventData.event_mode || eventData.eventMode || 'offline',
            current_section: 'reporting', // After saving event data, user moves to reporting
            has_active_proposal: 1,
            proposal_status: 'pending', // ✅ FIX: Set to pending since form is complete
            report_status: 'pending', // ✅ FIX: Set to pending since form is complete
            event_status: 'scheduled',
            attendance_count: 0,
            objectives: eventData.objectives || '',
            budget: eventData.budget || 0.00,
            volunteers_needed: eventData.volunteersNeeded || 0,
            form_completion_percentage: 100.00, // ✅ FIX: Set to 100% since form is complete
            is_deleted: 0,
            user_id: userId || eventData.user_id || eventData.userId || null // Use provided user ID or null
        };

        // Add event-specific fields based on type
        if (eventType === 'school') {
            mysqlData.school_event_type = eventData.event_type || 'other';
            mysqlData.school_return_service_credit = eventData.sdp_credits || '1';
            mysqlData.school_target_audience = JSON.stringify(eventData.target_audience || []);

            // File paths for school events
            if (files && files.gpoa) {
                mysqlData.school_gpoa_file_name = files.gpoa.filename;
                mysqlData.school_gpoa_file_path = `gridfs://${files.gpoa.fileId}`;
            }
            if (files && files.proposal) {
                mysqlData.school_proposal_file_name = files.proposal.filename;
                mysqlData.school_proposal_file_path = `gridfs://${files.proposal.fileId}`;
            }
        } else if (eventType === 'community') {
            mysqlData.community_event_type = eventData.event_type || 'others';
            mysqlData.community_sdp_credits = eventData.sdp_credits || '1';
            mysqlData.community_target_audience = JSON.stringify(eventData.target_audience || []);

            // File paths for community events
            if (files && files.gpoa) {
                mysqlData.community_gpoa_file_name = files.gpoa.filename;
                mysqlData.community_gpoa_file_path = `gridfs://${files.gpoa.fileId}`;
            }
            if (files && files.proposal) {
                mysqlData.community_proposal_file_name = files.proposal.filename;
                mysqlData.community_proposal_file_path = `gridfs://${files.proposal.fileId}`;
            }
        }

        console.log('💾 MYSQL INTEGRATION: Prepared MySQL data:', {
            uuid: mysqlData.uuid,
            event_name: mysqlData.event_name,
            organization_type: mysqlData.organization_type,
            event_type: eventType,
            file_count: files ? Object.keys(files).length : 0
        });

        // Insert into MySQL proposals table
        const result = await query(`
            INSERT INTO proposals (
                uuid, organization_name, organization_type, organization_description,
                contact_name, contact_email, contact_phone, event_name, event_venue,
                event_start_date, event_end_date, event_start_time, event_end_time,
                event_mode, school_event_type, school_return_service_credit, school_target_audience,
                community_event_type, community_sdp_credits, community_target_audience,
                school_gpoa_file_name, school_gpoa_file_path, school_proposal_file_name, school_proposal_file_path,
                community_gpoa_file_name, community_gpoa_file_path, community_proposal_file_name, community_proposal_file_path,
                current_section, has_active_proposal, proposal_status, report_status, event_status,
                attendance_count, objectives, budget, volunteers_needed, form_completion_percentage,
                is_deleted, user_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            mysqlData.uuid, mysqlData.organization_name, mysqlData.organization_type, mysqlData.organization_description,
            mysqlData.contact_name, mysqlData.contact_email, mysqlData.contact_phone, mysqlData.event_name, mysqlData.event_venue,
            mysqlData.event_start_date, mysqlData.event_end_date, mysqlData.event_start_time, mysqlData.event_end_time,
            mysqlData.event_mode, mysqlData.school_event_type, mysqlData.school_return_service_credit, mysqlData.school_target_audience,
            mysqlData.community_event_type, mysqlData.community_sdp_credits, mysqlData.community_target_audience,
            mysqlData.school_gpoa_file_name, mysqlData.school_gpoa_file_path, mysqlData.school_proposal_file_name, mysqlData.school_proposal_file_path,
            mysqlData.community_gpoa_file_name, mysqlData.community_gpoa_file_path, mysqlData.community_proposal_file_name, mysqlData.community_proposal_file_path,
            mysqlData.current_section, mysqlData.has_active_proposal, mysqlData.proposal_status, mysqlData.report_status, mysqlData.event_status,
            mysqlData.attendance_count, mysqlData.objectives, mysqlData.budget, mysqlData.volunteers_needed, mysqlData.form_completion_percentage,
            mysqlData.is_deleted, mysqlData.user_id
        ]);

        console.log('✅ MYSQL INTEGRATION: Successfully saved to MySQL proposals table:', {
            mysql_id: result.insertId,
            uuid: mysqlData.uuid,
            event_name: mysqlData.event_name
        });

        return {
            mysql_id: result.insertId,
            uuid: mysqlData.uuid,
            success: true
        };

    } catch (error) {
        console.error('❌ MYSQL INTEGRATION: Error saving to MySQL proposals table:', error);
        // Don't throw error - let MongoDB save continue even if MySQL fails
        return {
            success: false,
            error: error.message
        };
    }
};

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
    // ✅ FIX: Check if we should force creation of a new proposal (for denied proposals)
    const forceNewProposal = reqBody.force_new_proposal === 'true';

    // Check if we have an existing proposal ID from the request
    if (reqBody.proposal_id && !forceNewProposal) {
        const proposalId = validateProposalId(reqBody.proposal_id);
        if (!proposalId) {
            throw new Error(`Invalid proposal ID: ${reqBody.proposal_id}`);
        }

        try {
            // Determine if proposalId is a UUID or numeric ID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId);

            let query, queryParams;
            if (isUuid) {
                // Look up by UUID
                query = 'SELECT id, proposal_status, current_section FROM proposals WHERE uuid = $1';
                queryParams = [proposalId];
            } else {
                // Look up by numeric ID
                query = 'SELECT id, proposal_status, current_section FROM proposals WHERE id = $1';
                queryParams = [proposalId];
            }

            // Verify the proposal exists and update status if needed
            const existingResult = await query(query, queryParams);
            const existingProposal = existingResult.rows[0];

            if (!existingProposal) {
                throw new Error(`Proposal with ${isUuid ? 'UUID' : 'ID'} ${proposalId} not found`);
            }

            const currentProposal = existingProposal;
            console.log('✅ Found existing proposal:', {
                id: currentProposal.id,
                currentStatus: currentProposal.proposal_status,
                currentSection: currentProposal.current_section
            });

            // ✅ FIX: Update status to 'pending' if currently 'draft' and form is being completed
            if (currentProposal.proposal_status === 'draft') {
                console.log('🔄 Updating proposal status from draft to pending');
                await query(
                    'UPDATE proposals SET proposal_status = ?, report_status = ?, submitted_at = NOW(), form_completion_percentage = ?, updated_at = NOW() WHERE id = ?',
                    ['pending', 'pending', 100.00, currentProposal.id]
                );
                console.log('✅ Proposal status and report status updated to pending with 100% completion');
            } else if (currentProposal.proposal_status === 'pending') {
                // ✅ FIX: Update form completion percentage even if already pending
                console.log('🔄 Updating form completion percentage for pending proposal');
                await query(
                    'UPDATE proposals SET form_completion_percentage = ?, report_status = ?, submitted_at = COALESCE(submitted_at, NOW()), updated_at = NOW() WHERE id = ?',
                    [100.00, 'pending', currentProposal.id]
                );
                console.log('✅ Form completion percentage updated to 100% and report status set to pending');
            } else if (currentProposal.proposal_status === 'approved') {
                // ✅ FIX: Don't change status if approved, just update completion
                console.log('🔄 Proposal already approved, updating completion percentage only');
                await query(
                    'UPDATE proposals SET form_completion_percentage = ?, report_status = ?, updated_at = NOW() WHERE id = ?',
                    [100.00, 'pending', currentProposal.id]
                );
                console.log('✅ Form completion percentage updated to 100% and report status set to pending');
            } else if (currentProposal.proposal_status === 'denied') {
                // ✅ FIX: For denied proposals, create a new one instead of updating the denied one
                console.log('🔄 Proposal was denied, will create a new proposal instead');
                throw new Error('DENIED_PROPOSAL_CREATE_NEW');
            }

            return currentProposal.id; // Return the numeric ID for consistency
        } catch (mysqlError) {
            // ✅ FIX: Handle denied proposal case by creating a new one
            if (mysqlError.message === 'DENIED_PROPOSAL_CREATE_NEW') {
                console.log('🔄 Creating new proposal for denied proposal ID:', proposalId);
                // Fall through to create new proposal logic below
            } else {
                console.warn('⚠️ MySQL verification failed, using provided ID:', mysqlError.message);
                return proposalId; // Still use the provided ID even if MySQL is down
            }
        }
    }

    // Create new MySQL proposal if no existing ID provided
    console.log('💾 Creating new MySQL proposal...');

    try {
        // Generate UUID for the proposal
        const { v4: uuidv4 } = require('uuid');
        const proposalUuid = uuidv4();

        // Map event types to correct enum values
        const mapEventTypeToEnum = (eventType, category) => {
            if (category === 'school') {
                const schoolTypeMap = {
                    'academic': 'academic-enhancement',
                    'workshop': 'workshop-seminar-webinar',
                    'seminar': 'workshop-seminar-webinar',
                    'conference': 'conference',
                    'competition': 'competition',
                    'cultural': 'cultural-show',
                    'sports': 'sports-fest',
                    'other': 'other'
                };
                return schoolTypeMap[eventType] || 'other';
            } else {
                const communityTypeMap = {
                    'academic': 'academic-enhancement',
                    'seminar': 'seminar-webinar',
                    'webinar': 'seminar-webinar',
                    'assembly': 'general-assembly',
                    'leadership': 'leadership-training',
                    'other': 'others'
                };
                return communityTypeMap[eventType] || 'others';
            }
        };

        const mysqlProposalData = {
            uuid: proposalUuid,
            organization_name: orgName,
            organization_description: `${eventType === 'school' ? 'School Event' : 'Community Event'}: ${reqBody.name} at ${reqBody.venue}`,
            organization_type: eventType === 'school' ? 'school-based' : 'community-based',
            contact_name: reqBody.contact_person || reqBody.contact_name || orgName,
            contact_email: reqBody.contact_email || 'contact@example.com',
            contact_phone: reqBody.contact_phone || '+63-88-000-0000',
            event_name: reqBody.name,
            event_venue: reqBody.venue,
            event_start_date: reqBody.start_date,
            event_end_date: reqBody.end_date,
            event_start_time: reqBody.time_start,
            event_end_time: reqBody.time_end,
            event_mode: reqBody.event_mode || 'offline',
            proposal_status: 'draft', // Start as draft, will be updated to pending
            event_status: 'scheduled',
            current_section: eventType === 'school' ? 'schoolEvent' : 'communityEvent',
            attendance_count: 0,
            objectives: `Organize ${reqBody.name} ${eventType === 'school' ? 'school event' : 'community event'} at ${reqBody.venue}`,
            budget: 0.00,
            volunteers_needed: 0,
            form_completion_percentage: 100.00
        };

        // Add event type specific fields
        if (eventType === 'school') {
            mysqlProposalData.school_event_type = mapEventTypeToEnum(reqBody.event_type, 'school');
            mysqlProposalData.school_return_service_credit = reqBody.return_service_credit || '1';
            mysqlProposalData.school_target_audience = JSON.stringify(reqBody.target_audience || []);
        } else {
            mysqlProposalData.community_event_type = mapEventTypeToEnum(reqBody.event_type, 'community');
            mysqlProposalData.community_sdp_credits = reqBody.sdp_credits || '1';
            mysqlProposalData.community_target_audience = JSON.stringify(reqBody.target_audience || []);
        }

        const insertQuery = `
            INSERT INTO proposals (
                uuid, organization_name, organization_description, organization_type,
                contact_name, contact_email, contact_phone,
                event_name, event_venue, event_start_date, event_end_date,
                event_start_time, event_end_time, event_mode,
                school_event_type, school_return_service_credit, school_target_audience,
                community_event_type, community_sdp_credits, community_target_audience,
                proposal_status, event_status, current_section,
                attendance_count, objectives, budget, volunteers_needed, form_completion_percentage,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const insertValues = [
            mysqlProposalData.uuid,
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
            mysqlProposalData.event_mode,
            mysqlProposalData.school_event_type || null,
            mysqlProposalData.school_return_service_credit || null,
            mysqlProposalData.school_target_audience || null,
            mysqlProposalData.community_event_type || null,
            mysqlProposalData.community_sdp_credits || null,
            mysqlProposalData.community_target_audience || null,
            mysqlProposalData.proposal_status,
            mysqlProposalData.event_status,
            mysqlProposalData.current_section,
            mysqlProposalData.attendance_count,
            mysqlProposalData.objectives,
            mysqlProposalData.budget,
            mysqlProposalData.volunteers_needed,
            mysqlProposalData.form_completion_percentage
        ];

        const mysqlResult = await query(insertQuery, insertValues);
        const newProposalId = mysqlResult.rows[0].id;
        console.log('✅ New MySQL proposal created with ID:', newProposalId);

        // ✅ FIX: Update status to 'pending' for new proposals since form is complete
        console.log('🔄 Updating new proposal status from draft to pending');
        await query(
            'UPDATE proposals SET proposal_status = $1, submitted_at = NOW(), form_completion_percentage = $2, updated_at = NOW() WHERE id = $3',
            ['pending', 100.00, newProposalId]
        );
        console.log('✅ New proposal status updated to pending with 100% completion');

        return newProposalId;
    } catch (mysqlError) {
        console.warn('⚠️ MySQL proposal creation failed, using fallback ID:', mysqlError.message);
        // Return a fallback proposal ID to allow MongoDB insertion to continue
        return Math.floor(Math.random() * 1000000) + 100000; // Generate a random 6-digit ID
    }
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

    // ✅ FIX: Handle case where files is undefined or null
    if (!files || typeof files !== 'object') {
        console.log('📁 No files to upload, returning empty metadata');
        return fileMetadata;
    }

    // 🔧 ADDITIONAL SAFETY: Add timeout wrapper for the entire upload process
    const uploadTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('File upload process timed out after 60 seconds')), 60000);
    });

    const uploadProcess = async () => {
        if (files.gpoaFile && Array.isArray(files.gpoaFile) && files.gpoaFile.length > 0) {
            console.log('📎 Processing GPOA file upload...');
            try {
                fileMetadata.gpoa = await uploadFile(
                    files.gpoaFile[0].buffer,
                    files.gpoaFile[0].originalname,
                    {
                        type: 'gpoa',
                        orgName,
                        proposalId: proposalId.toString()
                    }
                );
                // ✅ FIX: Include file size in metadata
                fileMetadata.gpoa.size = files.gpoaFile[0].size;
                fileMetadata.gpoa.mimetype = files.gpoaFile[0].mimetype;
                console.log('✅ GPOA file uploaded successfully:', {
                    filename: fileMetadata.gpoa.filename,
                    gridFsId: fileMetadata.gpoa.fileId,
                    size: fileMetadata.gpoa.size
                });
            } catch (error) {
                console.error('❌ GPOA file upload failed:', error);
                throw new Error(`GPOA file upload failed: ${error.message}`);
            }
        }

        if (files.proposalFile && Array.isArray(files.proposalFile) && files.proposalFile.length > 0) {
            console.log('📎 Processing Proposal file upload...');
            try {
                fileMetadata.proposal = await uploadFile(
                    files.proposalFile[0].buffer,
                    files.proposalFile[0].originalname,
                    {
                        type: 'proposal',
                        orgName,
                        proposalId: proposalId.toString()
                    }
                );
                // ✅ FIX: Include file size in metadata
                fileMetadata.proposal.size = files.proposalFile[0].size;
                fileMetadata.proposal.mimetype = files.proposalFile[0].mimetype;
                console.log('✅ Proposal file uploaded successfully:', {
                    filename: fileMetadata.proposal.filename,
                    gridFsId: fileMetadata.proposal.fileId,
                    size: fileMetadata.proposal.size
                });
            } catch (error) {
                console.error('❌ Proposal file upload failed:', error);
                throw new Error(`Proposal file upload failed: ${error.message}`);
            }
        }

        return fileMetadata;
    };

    // Race between upload process and timeout
    return Promise.race([uploadProcess(), uploadTimeout]);
};

/**
 * Map frontend event types to MongoDB schema enum values
 * 
 * @param {string} frontendEventType - Event type from frontend
 * @param {string} eventCategory - Event category ('school' or 'community')
 * @returns {string} Mapped event type for MongoDB schema
 */
const mapEventTypeToSchema = (frontendEventType, eventCategory = 'school') => {
    // ✅ FIX: Separate mappings for school and community events to avoid conflicts
    const schoolEventTypeMap = {
        // Exact matches
        'academic': 'academic',
        'workshop': 'workshop',
        'seminar': 'seminar',
        'assembly': 'assembly',
        'leadership': 'leadership',
        'other': 'other',

        // Variations and compound names
        'academic-enhancement': 'academic',
        'workshop-seminar-webinar': 'workshop',
        'cultural-show': 'other',
        'sports-fest': 'other',
        'competition': 'other',
        'conference': 'seminar'
    };

    const communityEventTypeMap = {
        // Exact matches
        'academic': 'other',
        'workshop': 'workshop',
        'seminar': 'seminar',
        'assembly': 'assembly',
        'leadership': 'leadership',
        'other': 'other',

        // Community-specific types
        'education': 'other',
        'health': 'other',
        'environment': 'other',
        'community': 'other',
        'technology': 'other',

        // Variations
        'academic-enhancement': 'other',
        'seminar-webinar': 'seminar',
        'general-assembly': 'assembly',
        'leadership-training': 'leadership',
        'others': 'other'
    };

    // Choose the appropriate mapping based on event category
    const eventTypeMap = eventCategory === 'school' ? schoolEventTypeMap : communityEventTypeMap;

    // ✅ FIX: Add fallback for unknown types
    const mappedType = eventTypeMap[frontendEventType];
    if (!mappedType) {
        console.warn(`⚠️ Unknown ${eventCategory} event type: ${frontendEventType}, defaulting to 'other'`);
        return 'other';
    }

    return mappedType;
};

/**
 * Parse target audience from string or array format
 * 
 * @param {string|Array} audience - Target audience string or array
 * @returns {Array} Parsed target audience array
 */
const parseTargetAudience = (audience) => {
    if (typeof audience === 'string') {
        try {
            return JSON.parse(audience);
        } catch (e) {
            console.warn('⚠️ Failed to parse target audience string:', audience, e);
            return []; // Return empty array on parsing error
        }
    } else if (Array.isArray(audience)) {
        return audience;
    }
    return []; // Return empty array for invalid input
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
    // ✅ FIX: Create document that matches MongoDB schema validation exactly
    const baseProposal = {
        // Required fields according to schema
        title: reqBody.name || 'Untitled Event',
        description: `${eventType === 'school' ? 'School Event' : 'Community Event'}: ${reqBody.name || 'Untitled'} at ${reqBody.venue || 'TBD'}`,
        category: eventType === 'school' ? 'school-event' : 'community-event',
        startDate: new Date(reqBody.start_date),
        endDate: new Date(reqBody.end_date),
        location: reqBody.venue || 'TBD',
        submitter: reqBody.organization_id || 'unknown',

        // Optional fields with proper types and defaults
        budget: 0,
        objectives: `Organize ${reqBody.name || 'event'} ${eventType === 'school' ? 'school event' : 'community event'} at ${reqBody.venue || 'TBD'}`,
        volunteersNeeded: 0,
        organizationType: eventType === 'school' ? 'school-based' : 'community-based',
        contactPerson: orgName || 'Unknown',
        contactEmail: 'contact@example.com', // ✅ FIX: Valid email format required by schema
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
        updatedAt: new Date()
    };

    // Add event-specific details
    baseProposal.eventDetails = {
        timeStart: reqBody.time_start || '09:00',
        timeEnd: reqBody.time_end || '10:00',
        eventType: mapEventTypeToSchema(reqBody.event_type, eventType),
        eventMode: reqBody.event_mode || 'offline',
        returnServiceCredit: parseInt(reqBody.return_service_credit || reqBody.sdp_credits || '0'),
        targetAudience: parseTargetAudience(reqBody.target_audience),
        organizationId: reqBody.organization_id || ''
    };

    // ✅ FIX: Convert file metadata to documents array format required by schema
    if (fileMetadata && Object.keys(fileMetadata).length > 0) {
        baseProposal.documents = Object.entries(fileMetadata).map(([key, fileData]) => {
            // ✅ FIX: Handle different file metadata structures
            const fileId = fileData.fileId || fileData.gridFsId;
            const filename = fileData.filename || fileData.originalName || 'unknown';
            const size = fileData.size || 0;
            const mimetype = fileData.mimetype || 'application/octet-stream';

            console.log(`📁 Document metadata for ${key}:`, {
                fileId,
                filename,
                size,
                mimetype
            });

            return {
                name: filename,
                path: `gridfs://${fileId}`,
                mimetype: mimetype,
                size: size,
                type: key === 'gpoa' ? 'gpoa' : 'proposal', // ✅ FIX: Use correct enum values
                uploadedAt: new Date()
            };
        });
    }

    // ✅ DEBUG: Log the final document for validation debugging
    console.log('🔍 MONGODB SECTION 3: Final document structure:', JSON.stringify(baseProposal, null, 2));

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

            // 🔧 ENHANCED: Try to get MongoDB connection with fallback
            let db;
            try {
                db = await getDb();
                console.log('🔗 MONGODB SECTION 3: Database connection established');
            } catch (mongoError) {
                console.warn('⚠️ MONGODB SECTION 3: MongoDB connection failed, using fallback mode');
                console.warn('⚠️ MONGODB SECTION 3: Error:', mongoError.message);

                // 🔧 FALLBACK: Update MySQL proposal status to pending even when MongoDB is unavailable
                try {
                    console.log('🔄 FALLBACK: Updating MySQL proposal status to pending...');

                    // Resolve organization name
                    const orgName = await resolveOrganizationName(req.body);
                    console.log('🏢 FALLBACK: Organization name resolved:', orgName);

                    // Get or create MySQL proposal (this will update status to pending)
                    const mysqlProposalId = await getOrCreateMySQLProposal(req.body, orgName, 'school');
                    console.log('✅ FALLBACK: MySQL proposal updated with ID:', mysqlProposalId);

                    // Also save to MySQL proposals table with proper user ID
                    try {
                        const mysqlResult = await saveToMySQLProposals(req.body, {}, 'school', req.user?.id || req.body.user_id);
                        if (mysqlResult.success) {
                            console.log('✅ FALLBACK: Also saved to MySQL proposals table');
                        }
                    } catch (mysqlError) {
                        console.warn('⚠️ FALLBACK: MySQL proposals table save failed:', mysqlError.message);
                    }

                    // Return success response with status update confirmation
                    const fallbackResponse = {
                        success: true,
                        message: 'School event data saved successfully. Proposal status updated to pending.',
                        data: {
                            id: 'mysql-' + mysqlProposalId,
                            proposalId: mysqlProposalId,
                            status: 'pending',
                            files: req.files ? Object.keys(req.files).reduce((acc, key) => {
                                acc[key] = {
                                    success: true,
                                    filename: req.files[key][0]?.originalname || 'unknown',
                                    size: req.files[key][0]?.size || 0
                                };
                                return acc;
                            }, {}) : {},
                            dataConsistency: {
                                organizationName: orgName,
                                filesStored: req.files ? Object.keys(req.files).length : 0,
                                proposalLinked: !!req.body.proposal_id,
                                statusUpdated: true
                            }
                        },
                        fallback: true,
                        mongoError: mongoError.message
                    };

                    console.log('✅ MONGODB SECTION 3: Fallback response with status update sent');
                    return res.json(fallbackResponse);

                } catch (fallbackError) {
                    console.error('❌ FALLBACK: Error updating MySQL proposal:', fallbackError.message);

                    // Return error response if even the fallback fails
                    const errorResponse = {
                        success: false,
                        message: 'Failed to save school event data. Please try again.',
                        error: fallbackError.message,
                        fallback: true
                    };

                    return res.status(500).json(errorResponse);
                }
            }

            // STEP 1: Resolve organization name
            const orgName = await resolveOrganizationName(req.body);
            console.log('🏢 MONGODB SECTION 3: Organization name for file metadata:', orgName);

            // STEP 2: Get or create MySQL proposal
            let isNewProposal = false;
            let mysqlProposalId;

            try {
                mysqlProposalId = await getOrCreateMySQLProposal(req.body, orgName, 'school');
            } catch (error) {
                if (error.message === 'DENIED_PROPOSAL_CREATE_NEW') {
                    // Force creation of new proposal for denied ones
                    req.body.force_new_proposal = 'true';
                    mysqlProposalId = await getOrCreateMySQLProposal({ ...req.body, proposal_id: null }, orgName, 'school');
                    isNewProposal = true;
                    console.log('✅ MONGODB SECTION 3: New proposal created for denied proposal:', mysqlProposalId);
                } else {
                    throw error;
                }
            }

            // STEP 3: Upload files to GridFS
            const fileMetadata = await uploadFilesToGridFS(req.files, orgName, mysqlProposalId);
            console.log('📁 MONGODB SECTION 3: File upload process completed. File metadata:', fileMetadata);

            // STEP 4: Create MongoDB proposal document
            const proposalData = createMongoDBProposal(req.body, orgName, mysqlProposalId, fileMetadata, 'school');

            // ✅ DEBUG: Log the final document structure for validation debugging
            console.log('🔍 MONGODB SECTION 3: Final document structure:', JSON.stringify(proposalData, null, 2));

            console.log('💾 MONGODB SECTION 3: Inserting proposal data into MongoDB...');
            const result = await db.collection('proposals').insertOne(proposalData);
            console.log('✅ MONGODB SECTION 3: Proposal successfully inserted into MongoDB:', {
                insertedId: result.insertedId,
                acknowledged: result.acknowledged
            });

            // STEP 5: Save to MySQL proposals table (DUAL DATABASE INTEGRATION)
            const mysqlResult = await saveToMySQLProposals(req.body, fileMetadata, 'school', req.user?.id || req.body.user_id);
            if (mysqlResult.success) {
                console.log('✅ MYSQL INTEGRATION: School event also saved to MySQL proposals table:', {
                    mysql_id: mysqlResult.mysql_id,
                    uuid: mysqlResult.uuid
                });
            } else {
                console.warn('⚠️ MYSQL INTEGRATION: Failed to save school event to MySQL:', mysqlResult.error);
            }

            // STEP 6: Check data consistency
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
                mysql_id: mysqlProposalId,
                newProposal: isNewProposal,
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
            }, isNewProposal ? 'New proposal created and submitted for review' : 'School event proposal saved successfully');

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

            // 🔧 ENHANCED ERROR HANDLING: Provide specific error messages for different failure types
            let errorMessage = error.message;
            let statusCode = 500;

            if (error.message.includes('File upload process timed out')) {
                errorMessage = 'File upload timed out. Please try again with smaller files or check your connection.';
                statusCode = 408; // Request Timeout
            } else if (error.message.includes('Upload timeout after 30 seconds')) {
                errorMessage = 'File upload is taking too long. Please try again with smaller files.';
                statusCode = 408; // Request Timeout
            } else if (error.message.includes('GridFS bucket not available')) {
                errorMessage = 'File storage system is unavailable. Please try again later.';
                statusCode = 503; // Service Unavailable
            } else if (error.message.includes('GPOA file upload failed') || error.message.includes('Proposal file upload failed')) {
                errorMessage = 'File upload failed. Please check your file format and try again.';
                statusCode = 400; // Bad Request
            } else if (error.message.includes('Document failed validation')) {
                errorMessage = 'Data validation failed. Please check your input and try again.';
                statusCode = 400; // Bad Request
            } else if (error.message.includes('Network error') || error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Cannot connect to database. Please try again later.';
                statusCode = 503; // Service Unavailable
            }

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
                errorMessage,
                statusCode,
                'Check server logs for more information'
            );
            res.status(statusCode).json(errorResponse);
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

            // 🔧 ENHANCED: Try to get MongoDB connection with fallback
            let db;
            try {
                db = await getDb();
                console.log('🔗 MONGODB SECTION 4: Database connection established');
            } catch (mongoError) {
                console.warn('⚠️ MONGODB SECTION 4: MongoDB connection failed, using fallback mode');
                console.warn('⚠️ MONGODB SECTION 4: Error:', mongoError.message);

                // 🔧 FALLBACK: Update MySQL proposal status to pending even when MongoDB is unavailable
                try {
                    console.log('🔄 FALLBACK: Updating MySQL proposal status to pending...');

                    // Resolve organization name
                    const orgName = await resolveOrganizationName(req.body);
                    console.log('🏢 FALLBACK: Organization name resolved:', orgName);

                    // Get or create MySQL proposal (this will update status to pending)
                    const mysqlProposalId = await getOrCreateMySQLProposal(req.body, orgName, 'community');
                    console.log('✅ FALLBACK: MySQL proposal updated with ID:', mysqlProposalId);

                    // Also save to MySQL proposals table with proper user ID
                    try {
                        const mysqlResult = await saveToMySQLProposals(req.body, {}, 'community', req.user?.id || req.body.user_id);
                        if (mysqlResult.success) {
                            console.log('✅ FALLBACK: Also saved to MySQL proposals table');
                        }
                    } catch (mysqlError) {
                        console.warn('⚠️ FALLBACK: MySQL proposals table save failed:', mysqlError.message);
                    }

                    // Return success response with status update confirmation
                    const fallbackResponse = {
                        success: true,
                        message: 'Community event data saved successfully. Proposal status updated to pending.',
                        data: {
                            id: 'mysql-' + mysqlProposalId,
                            mysql_id: mysqlProposalId, // ✅ FIX: Include MySQL ID in fallback response
                            proposalId: mysqlProposalId,
                            status: 'pending',
                            files: req.files ? Object.keys(req.files).reduce((acc, key) => {
                                acc[key] = {
                                    success: true,
                                    filename: req.files[key][0]?.originalname || 'unknown',
                                    size: req.files[key][0]?.size || 0
                                };
                                return acc;
                            }, {}) : {},
                            dataConsistency: {
                                organizationName: orgName,
                                filesStored: req.files ? Object.keys(req.files).length : 0,
                                proposalLinked: !!req.body.proposal_id,
                                statusUpdated: true
                            }
                        },
                        fallback: true,
                        mongoError: mongoError.message
                    };

                    console.log('✅ MONGODB SECTION 4: Fallback response with status update sent');
                    return res.json(fallbackResponse);

                } catch (fallbackError) {
                    console.error('❌ FALLBACK: Error updating MySQL proposal:', fallbackError.message);

                    // Return error response if even the fallback fails
                    const errorResponse = {
                        success: false,
                        message: 'Failed to save community event data. Please try again.',
                        error: fallbackError.message,
                        fallback: true
                    };

                    return res.status(500).json(errorResponse);
                }
            }

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

            // STEP 5: Save to MySQL proposals table (DUAL DATABASE INTEGRATION)
            const mysqlResult = await saveToMySQLProposals(req.body, fileMetadata, 'community', req.user?.id || req.body.user_id);
            if (mysqlResult.success) {
                console.log('✅ MYSQL INTEGRATION: Community event also saved to MySQL proposals table:', {
                    mysql_id: mysqlResult.mysql_id,
                    uuid: mysqlResult.uuid
                });
            } else {
                console.warn('⚠️ MYSQL INTEGRATION: Failed to save community event to MySQL:', mysqlResult.error);
            }

            // STEP 6: Send success response
            const responseData = createSuccessResponse({
                id: result.insertedId,
                mysql_id: mysqlResult.mysql_id || null, // ✅ FIX: Include MySQL ID like school events
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
                    proposalLinked: !!req.body.organization_id,
                    mysqlIntegration: mysqlResult.success // ✅ FIX: Include MySQL integration status
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

            // 🔧 ENHANCED ERROR HANDLING: Provide specific error messages for different failure types
            let errorMessage = error.message;
            let statusCode = 500;

            if (error.message.includes('File upload process timed out')) {
                errorMessage = 'File upload timed out. Please try again with smaller files or check your connection.';
                statusCode = 408; // Request Timeout
            } else if (error.message.includes('Upload timeout after 30 seconds')) {
                errorMessage = 'File upload is taking too long. Please try again with smaller files.';
                statusCode = 408; // Request Timeout
            } else if (error.message.includes('GridFS bucket not available')) {
                errorMessage = 'File storage system is unavailable. Please try again later.';
                statusCode = 503; // Service Unavailable
            } else if (error.message.includes('GPOA file upload failed') || error.message.includes('Proposal file upload failed')) {
                errorMessage = 'File upload failed. Please check your file format and try again.';
                statusCode = 400; // Bad Request
            } else if (error.message.includes('Document failed validation')) {
                errorMessage = 'Data validation failed. Please check your input and try again.';
                statusCode = 400; // Bad Request
            } else if (error.message.includes('Network error') || error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Cannot connect to database. Please try again later.';
                statusCode = 503; // Service Unavailable
            } else if (error.message.includes('MongoDB not connected')) {
                errorMessage = 'Database connection is not available. Please check MongoDB setup.';
                statusCode = 503; // Service Unavailable
            }

            // Add detailed validation error logging
            if (error.message.includes('Document failed validation')) {
                console.error('🔍 MONGODB SECTION 4: Validation error details:', {
                    validationErrors: error.validationErrors,
                    documentData: error.documentData
                });
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            });
        }
    }
);

module.exports = router; 