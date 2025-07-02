// ==============================
// Backend Server Proposals Admin Service
// MySQL + MongoDB Hybrid Data Service
// ==============================
// This service handles all admin-related database operations for the CEDO application
// Combines MySQL proposal data with MongoDB file metadata for comprehensive admin features

const { pool } = require('../config/db');

// ==============================
// Proposals Data Management
// ==============================

/**
 * Get admin proposals with hybrid MySQL + MongoDB data
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Object} Proposals data with pagination info
 */
async function getAdminProposals(queryParams) {
    console.log('📊 Admin Service: Fetching admin proposals with hybrid data');

    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, category, search, organizationType } = queryParams;

    // ==============================
    // Build MySQL Query with Filters
    // ==============================
    let whereConditions = ['(is_deleted = 0 OR is_deleted IS NULL)'];
    let params = [];

    // Filter by proposal status
    if (status && status !== 'all') {
        whereConditions.push('proposal_status = ?');
        params.push(status);
    }

    // Filter by organization type
    if (organizationType && organizationType !== 'all') {
        whereConditions.push('organization_type = ?');
        params.push(organizationType);
    }

    // Search functionality across multiple fields
    if (search) {
        whereConditions.push('(organization_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR event_name LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // ==============================
    // Execute MySQL Queries
    // ==============================
    const proposalsQuery = `
      SELECT 
        id, organization_name, organization_type, organization_description,
        contact_name, contact_email, contact_phone,
        event_name, event_venue, event_start_date, event_end_date,
        event_start_time, event_end_time, event_mode,
        COALESCE(school_event_type, community_event_type) as event_type,
        proposal_status, event_status, attendance_count,
        created_at, updated_at, admin_comments,
        objectives, budget, volunteersNeeded
      FROM proposals 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM proposals 
      ${whereClause}
    `;

    try {
        const [proposalsResult, countResult] = await Promise.all([
            pool.query(proposalsQuery, [...params, limit, offset]),
            pool.query(countQuery, params)
        ]);

        const proposals = proposalsResult[0];
        const totalCount = countResult[0][0].total_count;

        console.log(`📊 Admin Service: Fetched ${proposals.length} proposals from MySQL`);

        // ==============================
        // Hybrid Enhancement: Merge MongoDB File Data
        // ==============================
        try {
            const { getDb } = require('../config/mongodb');
            const db = await getDb();

            // Convert MySQL IDs to strings for MongoDB lookup
            const idStrings = proposals.map(p => String(p.id));

            console.log('📁 Admin Service: Fetching file metadata from MongoDB for proposals:', idStrings);

            // Find corresponding MongoDB documents with file metadata
            const mongoDocs = await db.collection('proposals')
                .find({ organizationId: { $in: idStrings } }, { projection: { organizationId: 1, files: 1 } })
                .toArray();

            console.log(`📁 Admin Service: Found ${mongoDocs.length} MongoDB documents with file metadata`);

            // Create file mapping for efficient lookup
            const fileMap = {};
            mongoDocs.forEach(doc => {
                fileMap[String(doc.organizationId)] = doc.files || {};
            });

            // Merge file metadata into MySQL proposals
            proposals.forEach(p => {
                p.files = fileMap[String(p.id)] || {};
                p.hasFiles = p.files && Object.keys(p.files).length > 0;
            });

            console.log('✅ Admin Service: Successfully merged MongoDB file metadata');

        } catch (mergeErr) {
            console.warn('⚠️ Admin Service: Unable to merge MongoDB file metadata:', mergeErr.message);
            console.warn('📝 Admin Service: Continuing with MySQL data only');

            // Set default empty file data if MongoDB merge fails
            proposals.forEach(p => {
                p.files = {};
                p.hasFiles = false;
            });
        }

        return { proposals, totalCount, limit, page };

    } catch (error) {
        console.error('❌ Admin Service: Error fetching admin proposals:', error);
        throw new Error('Failed to fetch admin proposals: ' + error.message);
    }
}

// ==============================
// Dashboard Statistics
// ==============================

/**
 * Get comprehensive admin dashboard statistics
 * @returns {Object} Dashboard statistics including counts, trends, and metadata
 */
async function getAdminStats() {
    try {
        console.log('📊 Admin Service: Fetching dashboard statistics from MySQL');

        // Base condition to exclude deleted records
        const baseCondition = '(is_deleted = 0 OR is_deleted IS NULL)';

        // ==============================
        // Proposal Status Distribution
        // ==============================
        const statusQuery = `
            SELECT 
                proposal_status,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            GROUP BY proposal_status
        `;

        // ==============================
        // Recent Activity (Last 30 Days)
        // ==============================
        const recentActivityQuery = `
            SELECT 
                COUNT(*) as recent_count
            FROM proposals 
            WHERE ${baseCondition} 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        // ==============================
        // Events Status Distribution
        // ==============================
        const eventsQuery = `
            SELECT 
                COUNT(*) as total_events,
                COUNT(CASE WHEN event_status = 'completed' THEN 1 END) as completed_events,
                COUNT(CASE WHEN event_status = 'ongoing' THEN 1 END) as ongoing_events,
                COUNT(CASE WHEN event_status = 'scheduled' THEN 1 END) as scheduled_events
            FROM proposals 
            WHERE ${baseCondition}
            AND proposal_status = 'approved'
        `;

        // ==============================
        // Organization Types Distribution
        // ==============================
        const orgTypesQuery = `
            SELECT 
                organization_type,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            GROUP BY organization_type
        `;

        // Execute all statistical queries in parallel for performance
        const [statusResult, recentActivityResult, eventsResult, orgTypesResult] = await Promise.all([
            pool.query(statusQuery),
            pool.query(recentActivityQuery),
            pool.query(eventsQuery),
            pool.query(orgTypesQuery)
        ]);

        // ==============================
        // Process Status Counts
        // ==============================
        const statusCounts = {};
        statusResult[0].forEach(row => {
            statusCounts[row.proposal_status] = parseInt(row.count);
        });

        // ==============================
        // Process Events Data
        // ==============================
        const eventsData = eventsResult[0][0] || {};

        // ==============================
        // Process Organization Types
        // ==============================
        const orgTypes = {};
        orgTypesResult[0].forEach(row => {
            orgTypes[row.organization_type] = parseInt(row.count);
        });

        // ==============================
        // Calculate Trends (Previous 30 Days Comparison)
        // ==============================
        const previousPeriodQuery = `
            SELECT 
                proposal_status,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
            AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY proposal_status
        `;

        const [previousPeriodResult] = await pool.query(previousPeriodQuery);
        const previousCounts = {};
        previousPeriodResult.forEach(row => {
            previousCounts[row.proposal_status] = parseInt(row.count);
        });

        // Helper function to calculate percentage change trends
        const calculateTrend = (current, previous) => {
            if (!previous || previous === 0) {
                return current > 0 ? { direction: 'up', value: '100%' } : { direction: 'neutral', value: '0%' };
            }
            const change = ((current - previous) / previous) * 100;
            return {
                direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
                value: `${Math.abs(Math.round(change))}%`
            };
        };

        // ==============================
        // Compile Final Statistics Object
        // ==============================
        const stats = {
            // Main proposal status counts
            pending: statusCounts.pending || 0,
            approved: statusCounts.approved || 0,
            rejected: statusCounts.rejected || 0,
            draft: statusCounts.draft || 0,

            // Events statistics
            totalEvents: parseInt(eventsData.total_events) || 0,
            completedEvents: parseInt(eventsData.completed_events) || 0,
            ongoingEvents: parseInt(eventsData.ongoing_events) || 0,
            scheduledEvents: parseInt(eventsData.scheduled_events) || 0,

            // Activity metrics
            recentActivity: parseInt(recentActivityResult[0][0].recent_count) || 0,

            // Organization distribution
            organizationTypes: orgTypes,

            // Trend analysis
            trends: {
                pending: calculateTrend(statusCounts.pending || 0, previousCounts.pending || 0),
                approved: calculateTrend(statusCounts.approved || 0, previousCounts.approved || 0),
                rejected: calculateTrend(statusCounts.rejected || 0, previousCounts.rejected || 0),
                draft: calculateTrend(statusCounts.draft || 0, previousCounts.draft || 0)
            },

            // Metadata
            lastUpdated: new Date().toISOString(),
            period: 'last_30_days'
        };

        console.log('📊 Admin Service: Successfully calculated dashboard statistics:', {
            pending: stats.pending,
            approved: stats.approved,
            rejected: stats.rejected,
            totalEvents: stats.totalEvents
        });

        return stats;

    } catch (error) {
        console.error('❌ Admin Service: Error fetching dashboard statistics:', error);
        throw new Error('Failed to fetch dashboard statistics: ' + error.message);
    }
}

// ==============================
// Reporting Data Management
// ==============================

/**
 * Save Section 5 accomplishment reporting data
 * @param {Object} data - Reporting form data
 * @param {Object} files - Uploaded files from multer
 * @returns {Object} Success result with verification
 */
async function saveSection5Reporting(data, files) {
    console.log('📊 Admin Service: Processing Section 5 reporting data');

    const { pool } = require('../config/db');
    const {
        proposal_id,
        report_description,
        event_status,
        attendance_count,
        digital_signature
    } = data;

    if (!proposal_id) {
        throw new Error("Missing proposal_id - required for reporting data");
    }

    // ==============================
    // Process File Uploads
    // ==============================
    const fileFields = {};
    // When using `multer.fields`, `files` is an object: { fieldname: [file, ...], ... }
    if (files && typeof files === 'object' && Object.keys(files).length > 0) {
        console.log('📁 Admin Service: Processing uploaded files for reporting');

        for (const fieldName in files) {
            const fileArray = files[fieldName];
            if (fileArray && fileArray.length > 0) {
                const file = fileArray[0]; // Get the first file for this field
                const baseDbColumn = file.fieldname.replace(/_file$/, '');
                fileFields[`${baseDbColumn}_file_name`] = file.filename;
                fileFields[`${baseDbColumn}_file_path`] = file.path;

                console.log(`📁 Admin Service: Processed file for ${fieldName}: ${file.filename}`);
            }
        }
    }

    // ==============================
    // Prepare Database Update
    // ==============================
    const textFields = {
        report_description,
        event_status,
        attendance_count,
        digital_signature,
        report_status: 'pending' // Set status to pending on submission
    };

    const updateFields = { ...textFields, ...fileFields };

    // Filter out any undefined or null values before creating the query
    const validUpdateFields = Object.entries(updateFields)
        .filter(([key, value]) => value !== undefined && value !== null)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    if (Object.keys(validUpdateFields).length === 0) {
        console.log("⚠️ Admin Service: No valid fields to update for proposal:", proposal_id);
        return { message: "No data provided to update." };
    }

    // ==============================
    // Execute Database Update
    // ==============================
    const setClauses = Object.keys(validUpdateFields)
        .map(key => `${key} = ?`)
        .join(', ');
    const values = Object.values(validUpdateFields);

    const query = `
        UPDATE proposals 
        SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    values.push(proposal_id);

    try {
        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            throw new Error(`Proposal with ID ${proposal_id} not found.`);
        }

        console.log('✅ Admin Service: Successfully saved reporting data for proposal:', proposal_id);

        return {
            success: true,
            message: 'Reporting data saved successfully.',
            affectedRows: result.affectedRows,
            proposalId: proposal_id
        };

    } catch (error) {
        console.error('❌ Admin Service: Database error in saveSection5Reporting:', error);
        throw new Error('Failed to save reporting data to the database: ' + error.message);
    }
}

// ==============================
// Service Exports
// ==============================
module.exports = {
    getAdminProposals,    // Main proposals data with MongoDB hybrid
    getAdminStats,        // Dashboard statistics and analytics
    saveSection5Reporting // Accomplishment reporting functionality
}; 