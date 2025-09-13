/**
 * Unified Proposal Data Access Layer
 * Purpose: Centralized CRUD operations for proposals with consistent error handling
 * Key approaches: Single responsibility, comprehensive validation, unified error responses
 */

const { pool, query } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

// ===================================================================
// CORE PROPOSAL OPERATIONS
// ===================================================================

/**
 * Get proposal by ID (supports both UUID and descriptive IDs)
 * @param {string} id - Proposal UUID or descriptive ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Proposal data
 */
async function getProposalById(id, options = {}) {
    try {
        // Reduced logging: Only log non-routine fetches

        // Handle descriptive IDs (legacy support)
        const isDescriptiveId = id.includes('-event') || id.includes('community') || id.includes('school');

        let query, params;

        if (isDescriptiveId) {
            // For descriptive IDs, return a mock proposal structure
            const eventType = id.includes('community') ? 'community-based' : 'school-based';
            return {
                id: id,
                uuid: id,
                proposal_status: 'draft',
                organization_type: eventType,
                created_at: new Date(),
                updated_at: new Date(),
                form_data: {
                    eventType: eventType,
                    selectedEventType: eventType
                }
            };
        }

        // For UUIDs, query the database
        query = `SELECT * FROM proposals WHERE uuid = ?`;
        params = [id];

        // Add status filter if specified
        if (options.status) {
            query += ` AND proposal_status = ?`;
            params.push(options.status);
        }

        const [rows] = await pool.query(query, params);

        if (rows.length === 0) {
            // 🔧 AUTO-CREATE MISSING PROPOSALS
            console.log('⚠️ Proposal not found, attempting to create it...');

            try {
                // Get the current user ID from the request context
                const userId = options.userId || 17; // Default to user 17 if not provided

                // Create the missing proposal with pending status since it's being submitted
                const now = new Date();
                const [result] = await pool.query(
                    `INSERT INTO proposals (
                        uuid, user_id, proposal_status, report_status, created_at, updated_at,
                        organization_name, organization_type, contact_name, contact_email,
                        event_name, event_start_date, event_end_date, form_completion_percentage
                    ) VALUES (
                        ?, ?, 'pending', 'pending', ?, ?,
                        'Draft Organization', 'school-based', 'Contact Person', 'contact@example.com',
                        'Draft Event', '2025-01-01', '2025-01-01', 100.00
                    )`,
                    [id, userId, now, now]
                );

                console.log('📝 Auto-created proposal:', result.insertId);
                console.log('✅ Auto-created proposal with pending status since form is being submitted');

                // Fetch the newly created proposal
                const [newRows] = await pool.query('SELECT * FROM proposals WHERE uuid = ?', [id]);
                if (newRows.length > 0) {
                    const proposal = newRows[0];

                    // Parse form_data if it exists
                    if (proposal.form_data && typeof proposal.form_data === 'string') {
                        try {
                            proposal.form_data = JSON.parse(proposal.form_data);
                        } catch (error) {
                            console.warn('⚠️ Failed to parse form_data:', error);
                            proposal.form_data = {};
                        }
                    }

                    console.log('✅ Auto-created proposal retrieved successfully:', {
                        id: proposal.uuid,
                        status: proposal.proposal_status,
                        userId: proposal.user_id,
                        createdAt: proposal.created_at
                    });
                    return proposal;
                }
            } catch (createError) {
                console.error('❌ Failed to auto-create proposal:', createError);
            }

            // Enhanced error message with more context
            const errorMessage = `Proposal not found with UUID: ${id}`;
            console.error('❌ Proposal not found:', {
                uuid: id,
                query: query,
                params: params,
                timestamp: new Date().toISOString()
            });
            throw new Error(errorMessage);
        }

        const proposal = rows[0];

        // Parse form_data if it exists
        if (proposal.form_data && typeof proposal.form_data === 'string') {
            try {
                proposal.form_data = JSON.parse(proposal.form_data);
            } catch (error) {
                console.warn('⚠️ Failed to parse form_data:', error);
                proposal.form_data = {};
            }
        }

        console.log('✅ Proposal retrieved successfully:', {
            id: proposal.uuid,
            status: proposal.proposal_status,
            userId: proposal.user_id,
            createdAt: proposal.created_at
        });
        return proposal;
    } catch (error) {
        console.error('❌ Error getting proposal by ID:', error);
        throw error;
    }
}

/**
 * Create a new proposal draft
 * @param {Object} data - Proposal data
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Created proposal data
 */
async function createProposal(data, userId) {
    try {
        console.log('📝 Creating new proposal for user:', userId);

        if (!userId || isNaN(Number(userId))) {
            throw new Error('Invalid user ID for proposal creation');
        }

        const uuid = uuidv4();
        const now = new Date();
        userId = Number(userId);

        // Get user's organization type
        const [userRows] = await pool.query(
            `SELECT organization_type FROM users WHERE id = ?`,
            [userId]
        );

        const userOrganizationType = userRows.length > 0 ? userRows[0].organization_type : null;

        // Insert proposal with default values
        const [result] = await pool.query(
            `INSERT INTO proposals (
                uuid, user_id, proposal_status, report_status, created_at, updated_at,
                organization_name, organization_type, contact_name, contact_email,
                event_name, event_start_date, event_end_date, form_completion_percentage
            ) VALUES (
                ?, ?, 'draft', 'draft', ?, ?,
                'Draft Organization', ?, 'Contact Person', 'contact@example.com',
                'Draft Event', '2025-01-01', '2025-01-01', 0.00
            )`,
            [uuid, userId, now, now, userOrganizationType]
        );

        const createdProposal = {
            draftId: uuid,
            id: result.insertId,
            userId: userId,
            organizationType: userOrganizationType,
            status: 'draft'
        };

        console.log('✅ Proposal created successfully:', createdProposal);
        return createdProposal;
    } catch (error) {
        console.error('❌ Error creating proposal:', error);
        throw error;
    }
}

/**
 * Update proposal by ID
 * @param {string} id - Proposal UUID
 * @param {Object} data - Update data
 * @param {Object} options - Update options
 * @returns {Promise<Object>} Updated proposal data
 */
async function updateProposal(id, data, options = {}) {
    try {
        console.log('🔄 Updating proposal:', id);

        // Handle descriptive IDs (legacy support)
        const isDescriptiveId = id.includes('-event') || id.includes('community') || id.includes('school');

        if (isDescriptiveId) {
            console.log('⚠️ Descriptive ID detected, skipping database update');
            return { success: true, id: id };
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        // Handle different update types
        if (data.eventType) {
            updateFields.push('organization_type = ?');
            updateValues.push(data.eventType);
        }

        if (data.section && data.payload) {
            // Handle section updates by updating specific columns based on section
            console.log('🔄 Updating section:', data.section, 'with payload:', data.payload);

            // Map section data to specific columns
            if (data.section === 'organization') {
                if (data.payload.organizationName && data.payload.organizationName.trim()) {
                    updateFields.push('organization_name = ?');
                    updateValues.push(data.payload.organizationName.trim());
                }
                if (data.payload.contactName && data.payload.contactName.trim()) {
                    updateFields.push('contact_name = ?');
                    updateValues.push(data.payload.contactName.trim());
                }
                if (data.payload.contactEmail && data.payload.contactEmail.trim()) {
                    updateFields.push('contact_email = ?');
                    updateValues.push(data.payload.contactEmail.trim());
                }
                if (data.payload.contactPhone && data.payload.contactPhone.trim()) {
                    updateFields.push('contact_phone = ?');
                    updateValues.push(data.payload.contactPhone.trim());
                }
                if (data.payload.organizationType && data.payload.organizationType.trim()) {
                    updateFields.push('organization_type = ?');
                    updateValues.push(data.payload.organizationType.trim());
                }
            } else if (data.section === 'school-event') {
                // Check if payload has any meaningful data
                const hasMeaningfulData = Object.entries(data.payload).some(([key, value]) => {
                    // Skip file fields by key name
                    if (key === 'schoolGPOAFile' || key === 'schoolProposalFile') return false;
                    if (Array.isArray(value)) return value.length > 0;
                    if (value instanceof Date) return true;
                    return value && value !== '' && value !== null;
                });

                if (!hasMeaningfulData) {
                    console.log('⏭️ Skipping update - no meaningful data in payload');
                    return { success: true, message: 'No meaningful data to update' };
                }

                // Map frontend field names to MySQL column names according to init-db.js schema
                if (data.payload.schoolEventName && data.payload.schoolEventName.trim()) {
                    updateFields.push('event_name = ?');
                    updateValues.push(data.payload.schoolEventName.trim());
                }
                if (data.payload.schoolVenue && data.payload.schoolVenue.trim()) {
                    updateFields.push('event_venue = ?');
                    updateValues.push(data.payload.schoolVenue.trim());
                }
                if (data.payload.schoolStartDate) {
                    updateFields.push('event_start_date = ?');
                    // Convert ISO date string to MySQL DATE format
                    try {
                        const startDate = new Date(data.payload.schoolStartDate);
                        if (isNaN(startDate.getTime())) {
                            console.warn('⚠️ Invalid start date:', data.payload.schoolStartDate);
                        } else {
                            updateValues.push(startDate.toISOString().split('T')[0]);
                        }
                    } catch (error) {
                        console.error('❌ Error converting start date:', error);
                    }
                }
                if (data.payload.schoolEndDate) {
                    updateFields.push('event_end_date = ?');
                    // Convert ISO date string to MySQL DATE format
                    try {
                        const endDate = new Date(data.payload.schoolEndDate);
                        if (isNaN(endDate.getTime())) {
                            console.warn('⚠️ Invalid end date:', data.payload.schoolEndDate);
                        } else {
                            updateValues.push(endDate.toISOString().split('T')[0]);
                        }
                    } catch (error) {
                        console.error('❌ Error converting end date:', error);
                    }
                }
                if (data.payload.schoolTimeStart && data.payload.schoolTimeStart.trim()) {
                    updateFields.push('event_start_time = ?');
                    updateValues.push(data.payload.schoolTimeStart.trim());
                }
                if (data.payload.schoolTimeEnd && data.payload.schoolTimeEnd.trim()) {
                    updateFields.push('event_end_time = ?');
                    updateValues.push(data.payload.schoolTimeEnd.trim());
                }
                if (data.payload.schoolEventType && data.payload.schoolEventType.trim()) {
                    updateFields.push('school_event_type = ?');
                    updateValues.push(data.payload.schoolEventType.trim());
                }
                if (data.payload.schoolReturnServiceCredit && data.payload.schoolReturnServiceCredit.trim()) {
                    updateFields.push('school_return_service_credit = ?');
                    updateValues.push(data.payload.schoolReturnServiceCredit.trim());
                }
                if (data.payload.schoolTargetAudience && Array.isArray(data.payload.schoolTargetAudience) && data.payload.schoolTargetAudience.length > 0) {
                    updateFields.push('school_target_audience = ?');
                    updateValues.push(JSON.stringify(data.payload.schoolTargetAudience));
                }

                // Only update organization type if we have other meaningful data
                if (updateFields.length > 0) {
                    updateFields.push('organization_type = ?');
                    updateValues.push('school-based');
                }
            } else if (data.section === 'community-event') {
                // Check if payload has any meaningful data
                const hasMeaningfulData = Object.entries(data.payload).some(([key, value]) => {
                    // Skip file fields by key name
                    if (key === 'communityGPOAFile' || key === 'communityProposalFile') return false;
                    if (Array.isArray(value)) return value.length > 0;
                    if (value instanceof Date) return true;
                    return value && value !== '' && value !== null;
                });

                if (!hasMeaningfulData) {
                    console.log('⏭️ Skipping update - no meaningful data in payload');
                    return { success: true, message: 'No meaningful data to update' };
                }

                // Map frontend field names to MySQL column names according to init-db.js schema
                if (data.payload.communityEventName && data.payload.communityEventName.trim()) {
                    updateFields.push('event_name = ?');
                    updateValues.push(data.payload.communityEventName.trim());
                }
                if (data.payload.communityVenue && data.payload.communityVenue.trim()) {
                    updateFields.push('event_venue = ?');
                    updateValues.push(data.payload.communityVenue.trim());
                }
                if (data.payload.communityStartDate) {
                    updateFields.push('event_start_date = ?');
                    // Convert ISO date string to MySQL DATE format
                    try {
                        const startDate = new Date(data.payload.communityStartDate);
                        if (isNaN(startDate.getTime())) {
                            console.warn('⚠️ Invalid start date:', data.payload.communityStartDate);
                        } else {
                            updateValues.push(startDate.toISOString().split('T')[0]);
                        }
                    } catch (error) {
                        console.error('❌ Error converting start date:', error);
                    }
                }
                if (data.payload.communityEndDate) {
                    updateFields.push('event_end_date = ?');
                    // Convert ISO date string to MySQL DATE format
                    try {
                        const endDate = new Date(data.payload.communityEndDate);
                        if (isNaN(endDate.getTime())) {
                            console.warn('⚠️ Invalid end date:', data.payload.communityEndDate);
                        } else {
                            updateValues.push(endDate.toISOString().split('T')[0]);
                        }
                    } catch (error) {
                        console.error('❌ Error converting end date:', error);
                    }
                }
                if (data.payload.communityTimeStart && data.payload.communityTimeStart.trim()) {
                    updateFields.push('event_start_time = ?');
                    updateValues.push(data.payload.communityTimeStart.trim());
                }
                if (data.payload.communityTimeEnd && data.payload.communityTimeEnd.trim()) {
                    updateFields.push('event_end_time = ?');
                    updateValues.push(data.payload.communityTimeEnd.trim());
                }
                if (data.payload.communityEventType && data.payload.communityEventType.trim()) {
                    updateFields.push('community_event_type = ?');
                    updateValues.push(data.payload.communityEventType.trim());
                }
                if (data.payload.communityEventMode && data.payload.communityEventMode.trim()) {
                    updateFields.push('event_mode = ?');
                    updateValues.push(data.payload.communityEventMode.trim());
                }
                if (data.payload.communitySDPCredits && data.payload.communitySDPCredits.trim()) {
                    updateFields.push('community_sdp_credits = ?');
                    updateValues.push(data.payload.communitySDPCredits.trim());
                }
                if (data.payload.communityTargetAudience && Array.isArray(data.payload.communityTargetAudience) && data.payload.communityTargetAudience.length > 0) {
                    updateFields.push('community_target_audience = ?');
                    updateValues.push(JSON.stringify(data.payload.communityTargetAudience));
                }

                // Only update organization type if we have other meaningful data
                if (updateFields.length > 0) {
                    updateFields.push('organization_type = ?');
                    updateValues.push('community-based');
                }
            }

            // Update current section - map frontend section names to database ENUM values
            const sectionMapping = {
                'overview': 'overview',
                'organization': 'orgInfo',
                'school-event': 'schoolEvent',
                'community-event': 'communityEvent',
                'reporting': 'reporting'
            };

            const mappedSection = sectionMapping[data.section] || data.section;
            updateFields.push('current_section = ?');
            updateValues.push(mappedSection);
        }

        // Add standard fields
        if (data.proposal_status) {
            updateFields.push('proposal_status = ?');
            updateValues.push(data.proposal_status);
        }

        if (data.organization_name) {
            updateFields.push('organization_name = ?');
            updateValues.push(data.organization_name);
        }

        if (data.contact_name) {
            updateFields.push('contact_name = ?');
            updateValues.push(data.contact_name);
        }

        if (data.contact_email) {
            updateFields.push('contact_email = ?');
            updateValues.push(data.contact_email);
        }

        if (data.event_name) {
            updateFields.push('event_name = ?');
            updateValues.push(data.event_name);
        }

        // Always update the updated_at timestamp
        updateFields.push('updated_at = NOW()');
        updateValues.push(id);

        if (updateFields.length === 1) { // Only updated_at field
            console.log('⚠️ No specific fields to update, only updating timestamp');
            return { success: true, message: 'No specific fields to update' };
        }

        const query = `UPDATE proposals SET ${updateFields.join(', ')} WHERE uuid = ?`;
        console.log('🔄 Executing query:', query);
        console.log('🔄 Query parameters:', updateValues);

        const [result] = await pool.query(query, updateValues);

        if (result.affectedRows === 0) {
            throw new Error('Proposal not found or no changes made');
        }

        console.log('✅ Proposal updated successfully:', { id, affectedRows: result.affectedRows });
        return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
        console.error('❌ Error updating proposal:', error);
        throw error;
    }
}

/**
 * Delete proposal by ID
 * @param {string} id - Proposal UUID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteProposal(id) {
    try {
        console.log('🗑️ Deleting proposal:', id);

        // Handle descriptive IDs (legacy support)
        const isDescriptiveId = id.includes('-event') || id.includes('community') || id.includes('school');

        if (isDescriptiveId) {
            console.log('⚠️ Descriptive ID detected, skipping database deletion');
            return { success: true, id: id };
        }

        const [result] = await pool.query(
            `DELETE FROM proposals WHERE uuid = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Proposal not found');
        }

        console.log('✅ Proposal deleted successfully:', { id, affectedRows: result.affectedRows });
        return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
        console.error('❌ Error deleting proposal:', error);
        throw error;
    }
}

/**
 * Get user's drafts and rejected proposals
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of proposals
 */
async function getUserProposals(userId, options = {}) {
    try {
        console.log('📋 Getting proposals for user:', userId);

        let query = `SELECT * FROM proposals WHERE user_id = ?`;
        const params = [userId];

        // Add status filter if specified
        if (options.status) {
            query += ` AND proposal_status = ?`;
            params.push(options.status);
        }

        // Add limit if specified
        if (options.limit) {
            query += ` LIMIT ?`;
            params.push(options.limit);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows] = await pool.query(query, params);

        // Parse form_data for each proposal
        const proposals = rows.map(proposal => {
            if (proposal.form_data && typeof proposal.form_data === 'string') {
                try {
                    proposal.form_data = JSON.parse(proposal.form_data);
                } catch (error) {
                    console.warn('⚠️ Failed to parse form_data for proposal:', proposal.uuid);
                    proposal.form_data = {};
                }
            }
            return proposal;
        });

        console.log('✅ Retrieved proposals for user:', { userId, count: proposals.length });
        return proposals;
    } catch (error) {
        console.error('❌ Error getting user proposals:', error);
        throw error;
    }
}

// ===================================================================
// SPECIALIZED OPERATIONS
// ===================================================================

/**
 * Save event type selection for a proposal
 * @param {string} id - Proposal UUID
 * @param {string} eventType - Event type ('school-based' or 'community-based')
 * @param {number} userId - User ID (optional)
 * @returns {Promise<Object>} Update result
 */
async function saveEventTypeSelection(id, eventType, userId = null) {
    try {
        console.log('🎯 Saving event type selection:', { id, eventType, userId });

        // 🔧 ENHANCED: Check database connection
        if (!pool) {
            console.error('❌ Database pool is undefined');
            throw new Error('Database connection not available');
        }

        // Validate inputs
        if (!id) {
            console.error('❌ Invalid ID provided:', id);
            throw new Error('Invalid proposal ID');
        }

        if (!eventType || !['school-based', 'community-based'].includes(eventType)) {
            console.error('❌ Invalid event type:', eventType);
            throw new Error('Invalid event type. Must be "school-based" or "community-based"');
        }

        console.log('✅ Input validation passed');

        // Handle descriptive IDs (legacy support)
        const isDescriptiveId = id.includes('-event') || id.includes('community') || id.includes('school');

        if (isDescriptiveId) {
            console.log('⚠️ Descriptive ID detected, skipping database update');
            const result = { success: true, eventType, userUpdated: false };
            console.log('✅ Returning result for descriptive ID:', result);
            return result;
        }

        // Check if proposal exists
        console.log('🔍 Checking if proposal exists:', id);
        const [draftCheck] = await pool.query(
            `SELECT id, proposal_status, user_id FROM proposals WHERE uuid = ?`,
            [id]
        );

        console.log('🔍 Draft check result:', {
            found: draftCheck.length > 0,
            count: draftCheck.length,
            data: draftCheck[0] || null
        });

        if (!draftCheck || draftCheck.length === 0) {
            console.log('❌ Proposal not found in database');
            throw new Error('Proposal not found');
        }

        const proposal = draftCheck[0];

        // 🔧 ENHANCED: Robust null checks
        if (!proposal) {
            console.error('❌ Proposal object is null or undefined');
            throw new Error('Proposal data is invalid');
        }

        console.log('✅ Proposal found:', {
            id: proposal.id,
            status: proposal.proposal_status,
            userId: proposal.user_id
        });

        // Update proposal status if needed
        if (proposal.proposal_status !== 'draft') {
            console.log('⚠️ Updating proposal status from', proposal.proposal_status, 'to draft');
            await pool.query(
                `UPDATE proposals SET proposal_status = 'draft', updated_at = NOW() WHERE uuid = ?`,
                [id]
            );
            console.log('✅ Updated proposal status to "draft"');
        }

        // Update proposal's organization_type
        console.log('🔄 Updating proposal organization_type to:', eventType);
        const [proposalResult] = await pool.query(
            `UPDATE proposals SET organization_type = ?, updated_at = NOW() WHERE uuid = ?`,
            [eventType, id]
        );

        console.log('✅ Proposal update result:', {
            affectedRows: proposalResult.affectedRows,
            insertId: proposalResult.insertId
        });

        if (!proposalResult || proposalResult.affectedRows === 0) {
            console.error('❌ No rows affected by proposal update');
            throw new Error('Failed to update proposal');
        }

        // Update user's organization_type if userId provided
        let userUpdated = false;
        if (userId) {
            console.log('🔄 Updating user organization_type for userId:', userId);
            const [userResult] = await pool.query(
                `UPDATE users SET organization_type = ?, updated_at = NOW() WHERE id = ?`,
                [eventType, userId]
            );
            userUpdated = userResult.affectedRows > 0;
            console.log('✅ User organization_type updated:', { userId, eventType, userUpdated });
        }

        // 🔧 ENHANCED: Ensure we return a valid object
        const result = {
            success: true,
            eventType: eventType, // Explicitly set the eventType
            userUpdated: userUpdated
        };

        console.log('✅ Event type selection saved successfully:', result);
        console.log('✅ Result object structure:', {
            hasSuccess: 'success' in result,
            hasEventType: 'eventType' in result,
            hasUserUpdated: 'userUpdated' in result,
            eventTypeValue: result.eventType
        });

        return result;
    } catch (error) {
        console.error('❌ Error saving event type selection:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            id: id,
            eventType: eventType,
            userId: userId
        });
        throw error;
    }
}

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
    getProposalById,
    createProposal,
    updateProposal,
    deleteProposal,
    getUserProposals,
    saveEventTypeSelection
}; 