<<<<<<< HEAD
// ==============================
// Backend Server Proposals Admin Service
// MySQL + MongoDB Hybrid Data Service
// ==============================
// This service handles all admin-related database operations for the CEDO application
// Combines MySQL proposal data with MongoDB file metadata for comprehensive admin features
=======
/**
 * =============================================
 * ADMIN SERVICE - Proposal Management & Analytics
 * =============================================
 * 
 * This service handles all admin dashboard operations including proposal management,
 * statistics generation, and administrative functions. It implements hybrid data
 * access combining MySQL and MongoDB for comprehensive admin capabilities.
 * 
 * @module services/admin.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Proposal status management and tracking
 * - Statistical analysis and reporting
 * - Admin comment system
 * - File management integration
 * - Search and filtering capabilities
 * - Pagination support
 * - Data validation and error handling
 */
>>>>>>> f6553a8 (Refactor backend services and configuration files)

const { pool } = require('../config/db');
const { getDb } = require('../utils/db');

<<<<<<< HEAD
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
=======
// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================
>>>>>>> f6553a8 (Refactor backend services and configuration files)

/**
 * Validate admin request parameters
 * 
 * @param {Object} params - Request parameters
 * @returns {Object} Validation result
 */
const validateAdminParams = (params) => {
    const errors = [];

<<<<<<< HEAD
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
=======
    if (params.page && (isNaN(params.page) || params.page < 1)) {
        errors.push('Invalid page number');
>>>>>>> f6553a8 (Refactor backend services and configuration files)
    }

    if (params.limit && (isNaN(params.limit) || params.limit < 1 || params.limit > 100)) {
        errors.push('Invalid limit (must be 1-100)');
    }

<<<<<<< HEAD
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
=======
    if (params.status && !['draft', 'submitted', 'approved', 'rejected', 'denied', 'all'].includes(params.status)) {
        errors.push('Invalid status filter');
    }
>>>>>>> f6553a8 (Refactor backend services and configuration files)

    return {
        isValid: errors.length === 0,
        errors
    };
};

<<<<<<< HEAD
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
=======
/**
 * Build MySQL WHERE clause for filtering
 * 
 * @param {Object} filters - Filter parameters
 * @returns {Object} WHERE clause and parameters
 */
const buildWhereClause = (filters) => {
    let where = 'WHERE 1=1';
    const params = [];

    if (filters.status && filters.status !== 'all') {
        where += ' AND proposal_status = ?';
        params.push(filters.status);
    }

    if (filters.search && filters.search.trim()) {
        where += ' AND (organization_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR event_name LIKE ?)';
        const term = `%${filters.search.trim()}%`;
        params.push(term, term, term, term);
    }

    if (filters.dateFrom) {
        where += ' AND created_at >= ?';
        params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
        where += ' AND created_at <= ?';
        params.push(filters.dateTo);
    }

    return { where, params };
};

/**
 * Calculate proposal statistics
 * 
 * @param {Array} proposals - Array of proposal data
 * @returns {Object} Statistical summary
 */
const calculateStats = (proposals) => {
    const stats = {
        total: proposals.length,
        drafts: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        denied: 0,
        pending: 0
    };

    proposals.forEach(proposal => {
        const status = proposal.proposal_status || proposal.status;
        if (stats.hasOwnProperty(status)) {
            stats[status]++;
        } else {
            stats.pending++;
        }
    });

    return stats;
};

/**
 * Get MongoDB file metadata for proposals
 * 
 * @param {Array} proposalIds - Array of proposal IDs
 * @returns {Promise<Object>} File metadata mapping
 */
const getMongoFileMetadata = async (proposalIds) => {
    try {
        const db = await getDb();
        const { GridFSBucket } = require('mongodb');
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        const fileMetadata = {};

        for (const proposalId of proposalIds) {
            const files = await bucket.find({ 'metadata.proposalId': proposalId.toString() }).toArray();

            const proposalFiles = {};
            files.forEach(file => {
                const fileType = file.metadata.fileType;
                if (fileType) {
                    proposalFiles[fileType] = {
                        name: file.filename,
                        id: file._id.toString(),
                        size: file.length,
                        uploadDate: file.uploadDate
                    };
                }
            });

            if (Object.keys(proposalFiles).length > 0) {
                fileMetadata[proposalId] = proposalFiles;
>>>>>>> f6553a8 (Refactor backend services and configuration files)
            }
        }

<<<<<<< HEAD
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
=======
        return fileMetadata;
    } catch (error) {
        console.error('Error fetching MongoDB file metadata:', error);
        return {};
    }
};

// =============================================
// PROPOSAL MANAGEMENT FUNCTIONS
// =============================================

/**
 * Get all proposals with pagination and filtering
 * 
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.status - Status filter
 * @param {string} options.search - Search term
 * @param {string} options.dateFrom - Start date filter
 * @param {string} options.dateTo - End date filter
 * @returns {Promise<Object>} Paginated proposals with metadata
 */
const getAllProposals = async (options = {}) => {
    try {
        console.log('🔍 ADMIN: Fetching proposals with options:', options);

        // Validate parameters
        const validation = validateAdminParams(options);
        if (!validation.isValid) {
            throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
        }

        const { where, params } = buildWhereClause(options);
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const offset = (page - 1) * limit;
>>>>>>> f6553a8 (Refactor backend services and configuration files)

        // Get total count
        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total FROM proposals ${where}`,
            params
        );
        const totalCount = countRows[0].total;

        // Get proposals with pagination
        const [proposals] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
              event_name, event_venue, event_mode, event_start_date, event_end_date, 
              event_start_time, event_end_time, school_event_type, community_event_type,
              proposal_status, created_at, updated_at, submitted_at
       FROM proposals ${where} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Get file metadata from MongoDB
        const proposalIds = proposals.map(p => p.id);
        const fileMetadata = await getMongoFileMetadata(proposalIds);

        // Enrich proposals with file metadata
        const enrichedProposals = proposals.map(proposal => ({
            ...proposal,
            files: fileMetadata[proposal.id] || {},
            hasFiles: Object.keys(fileMetadata[proposal.id] || {}).length > 0
        }));

        console.log('✅ ADMIN: Successfully fetched proposals:', {
            total: totalCount,
            returned: enrichedProposals.length,
            page: page,
            limit: limit
        });

        return {
            proposals: enrichedProposals,
            pagination: {
                page: page,
                pages: Math.ceil(totalCount / limit),
                total: totalCount,
                limit: limit,
                hasPrev: page > 1,
                hasNext: page < Math.ceil(totalCount / limit)
            }
        };

    } catch (error) {
        console.error('❌ ADMIN: Error fetching proposals:', error);
        throw new Error(`Failed to fetch proposals: ${error.message}`);
    }
};

/**
 * Get proposal by ID with complete details
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Complete proposal details
 */
const getProposalById = async (proposalId) => {
    try {
        console.log('🔍 ADMIN: Fetching proposal details for ID:', proposalId);

        // Get MySQL proposal data
        const [proposals] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
              event_name, event_venue, event_mode, event_start_date, event_end_date, 
              event_start_time, event_end_time, school_event_type, community_event_type,
              proposal_status, created_at, updated_at, submitted_at
       FROM proposals WHERE id = ?`,
            [proposalId]
        );

        if (proposals.length === 0) {
            throw new Error('Proposal not found');
        }

        const proposal = proposals[0];

        // Get MongoDB file metadata
        const fileMetadata = await getMongoFileMetadata([proposalId]);

        // Get admin comments
        const db = await getDb();
        const comments = await db.collection('proposal_comments')
            .find({ proposalId: proposalId.toString() })
            .sort({ createdAt: -1 })
            .toArray();

        const enrichedProposal = {
            ...proposal,
            files: fileMetadata[proposalId] || {},
            hasFiles: Object.keys(fileMetadata[proposalId] || {}).length > 0,
            comments: comments,
            commentCount: comments.length
        };

        console.log('✅ ADMIN: Successfully fetched proposal details:', {
            id: proposalId,
            hasFiles: enrichedProposal.hasFiles,
            commentCount: enrichedProposal.commentCount
        });

        return enrichedProposal;

    } catch (error) {
        console.error('❌ ADMIN: Error fetching proposal details:', error);
        throw new Error(`Failed to fetch proposal details: ${error.message}`);
    }
};

/**
 * Update proposal status
 * 
 * @param {string|number} proposalId - Proposal ID
 * @param {string} newStatus - New status
 * @param {string} adminComment - Optional admin comment
 * @returns {Promise<Object>} Updated proposal
 */
const updateProposalStatus = async (proposalId, newStatus, adminComment = null) => {
    try {
        console.log('🔄 ADMIN: Updating proposal status:', {
            proposalId: proposalId,
            newStatus: newStatus,
            hasComment: !!adminComment
        });

        // Validate status
        const validStatuses = ['draft', 'submitted', 'approved', 'rejected', 'denied'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid status');
        }

        // Update MySQL proposal status
        const [result] = await pool.query(
            'UPDATE proposals SET proposal_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, proposalId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Proposal not found');
        }

        // Add admin comment if provided
        if (adminComment) {
            const db = await getDb();
            await db.collection('proposal_comments').insertOne({
                proposalId: proposalId.toString(),
                comment: adminComment,
                adminName: 'Admin',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Get updated proposal
        const updatedProposal = await getProposalById(proposalId);

        console.log('✅ ADMIN: Successfully updated proposal status:', {
            proposalId: proposalId,
            newStatus: newStatus,
            hasComment: !!adminComment
        });

        return updatedProposal;

    } catch (error) {
        console.error('❌ ADMIN: Error updating proposal status:', error);
        throw new Error(`Failed to update proposal status: ${error.message}`);
    }
};

// =============================================
// STATISTICS AND ANALYTICS FUNCTIONS
// =============================================

/**
 * Get dashboard statistics
 * 
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} Dashboard statistics
 */
const getDashboardStats = async (filters = {}) => {
    try {
        console.log('📊 ADMIN: Generating dashboard statistics');

        const { where, params } = buildWhereClause(filters);

        // Get basic counts
        const [countRows] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN proposal_status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN proposal_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN proposal_status IN ('rejected', 'denied') THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN proposal_status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM proposals ${where}`,
            params
        );

        const stats = countRows[0];

        // Get recent activity
        const [recentProposals] = await pool.query(
            `SELECT id, organization_name, proposal_status, created_at 
       FROM proposals ${where} 
       ORDER BY created_at DESC 
       LIMIT 5`,
            params
        );

        // Get trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [trends] = await pool.query(
            `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        proposal_status
       FROM proposals 
       WHERE created_at >= ? ${where.replace('WHERE 1=1', 'AND')}
       GROUP BY DATE(created_at), proposal_status
       ORDER BY date DESC`,
            [thirtyDaysAgo, ...params]
        );

        console.log('✅ ADMIN: Successfully generated dashboard statistics');

        return {
            stats: {
                total: stats.total || 0,
                drafts: stats.drafts || 0,
                submitted: stats.submitted || 0,
                approved: stats.approved || 0,
                rejected: stats.rejected || 0,
                pending: stats.pending || 0
            },
            recentActivity: recentProposals,
            trends: trends
        };

    } catch (error) {
        console.error('❌ ADMIN: Error generating dashboard statistics:', error);
        throw new Error(`Failed to generate dashboard statistics: ${error.message}`);
    }
};

/**
 * Get proposal trends over time
 * 
 * @param {Object} options - Trend options
 * @param {number} options.days - Number of days to analyze
 * @param {string} options.groupBy - Grouping (day, week, month)
 * @returns {Promise<Array>} Trend data
 */
const getProposalTrends = async (options = {}) => {
    try {
        const days = options.days || 30;
        const groupBy = options.groupBy || 'day';

        console.log('📈 ADMIN: Generating proposal trends:', { days, groupBy });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let groupClause;
        switch (groupBy) {
            case 'week':
                groupClause = 'YEARWEEK(created_at)';
                break;
            case 'month':
                groupClause = 'DATE_FORMAT(created_at, "%Y-%m")';
                break;
            default:
                groupClause = 'DATE(created_at)';
        }

        const [trends] = await pool.query(
            `SELECT 
        ${groupClause} as period,
        COUNT(*) as total,
        SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN proposal_status IN ('rejected', 'denied') THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN proposal_status = 'submitted' THEN 1 ELSE 0 END) as submitted
       FROM proposals 
       WHERE created_at >= ?
       GROUP BY ${groupClause}
       ORDER BY period DESC`,
            [startDate]
        );

        console.log('✅ ADMIN: Successfully generated proposal trends');

        return trends;

    } catch (error) {
        console.error('❌ ADMIN: Error generating proposal trends:', error);
        throw new Error(`Failed to generate proposal trends: ${error.message}`);
    }
};

// =============================================
// SEARCH AND FILTERING FUNCTIONS
// =============================================

/**
 * Search proposals with advanced filtering
 * 
 * @param {Object} searchOptions - Search parameters
 * @param {string} searchOptions.query - Search query
 * @param {Array} searchOptions.statuses - Status filters
 * @param {string} searchOptions.dateFrom - Start date
 * @param {string} searchOptions.dateTo - End date
 * @param {string} searchOptions.organizationType - Organization type filter
 * @returns {Promise<Array>} Search results
 */
const searchProposals = async (searchOptions = {}) => {
    try {
        console.log('🔍 ADMIN: Searching proposals with options:', searchOptions);

        let where = 'WHERE 1=1';
        const params = [];

        if (searchOptions.query) {
            where += ' AND (organization_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR event_name LIKE ?)';
            const term = `%${searchOptions.query.trim()}%`;
            params.push(term, term, term, term);
        }

        if (searchOptions.statuses && searchOptions.statuses.length > 0) {
            const placeholders = searchOptions.statuses.map(() => '?').join(',');
            where += ` AND proposal_status IN (${placeholders})`;
            params.push(...searchOptions.statuses);
        }

        if (searchOptions.dateFrom) {
            where += ' AND created_at >= ?';
            params.push(searchOptions.dateFrom);
        }

        if (searchOptions.dateTo) {
            where += ' AND created_at <= ?';
            params.push(searchOptions.dateTo);
        }

        if (searchOptions.organizationType) {
            where += ' AND organization_type = ?';
            params.push(searchOptions.organizationType);
        }

        const [proposals] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email,
              event_name, proposal_status, created_at
       FROM proposals ${where}
       ORDER BY created_at DESC`,
            params
        );

        console.log('✅ ADMIN: Search completed:', {
            query: searchOptions.query,
            results: proposals.length
        });

        return proposals;

    } catch (error) {
        console.error('❌ ADMIN: Error searching proposals:', error);
        throw new Error(`Failed to search proposals: ${error.message}`);
    }
};

// =============================================
// EXPORT FUNCTIONS
// =============================================

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
<<<<<<< HEAD
    getAdminProposals,    // Main proposals data with MongoDB hybrid
    getAdminStats,        // Dashboard statistics and analytics
    saveSection5Reporting // Accomplishment reporting functionality
=======
    // Proposal Management
    getAllProposals,
    getProposalById,
    updateProposalStatus,

    // Statistics and Analytics
    getDashboardStats,
    getProposalTrends,

    // Search and Filtering
    searchProposals,

    // Utility Functions
    validateAdminParams,
    buildWhereClause,
    calculateStats,
    getMongoFileMetadata
>>>>>>> f6553a8 (Refactor backend services and configuration files)
}; 