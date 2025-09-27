/**
 * =============================================
 * ADMIN SERVICE - Proposal Management & Statistics
 * =============================================
 * 
 * This service handles all admin-related operations for proposals:
 * - Fetching proposals with filtering and pagination
 * - Generating dashboard statistics
 * - PostgreSQL file integration
 * 
 * @author CEDO Development Team
 * @version 1.0.0
 */

const { pool, query } = require('../config/database-postgresql-only');

/**
 * =============================================
 * PROPOSAL MANAGEMENT FUNCTIONS
 * =============================================
 */

/**
 * Fetch proposals for admin dashboard with filtering and pagination
 * 
 * @param {Object} queryParams - Query parameters for filtering
 * @param {number} queryParams.page - Page number (default: 1)
 * @param {number} queryParams.limit - Items per page (default: 10)
 * @param {string} queryParams.status - Filter by proposal status
 * @param {string} queryParams.category - Filter by event category
 * @param {string} queryParams.search - Search in organization/contact/event names
 * @param {string} queryParams.organizationType - Filter by organization type
 * 
 * @returns {Promise<Object>} Object containing proposals, pagination info, and file metadata
 */
async function getAdminProposals(queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, category, search, organizationType } = queryParams;

    let whereConditions = ['(is_deleted = false OR is_deleted IS NULL)'];
    let params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
        whereConditions.push(`proposal_status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }
    if (organizationType && organizationType !== 'all') {
        whereConditions.push(`organization_type = $${paramIndex}`);
        params.push(organizationType);
        paramIndex++;
    }
    if (search) {
        whereConditions.push(`(organization_name LIKE $${paramIndex} OR contact_person LIKE $${paramIndex + 1} OR contact_email LIKE $${paramIndex + 2} OR event_name LIKE $${paramIndex + 3})`);
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        paramIndex += 4;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const proposalsQuery = `
      SELECT 
        id, organization_name, organization_type, organization_description,
        contact_person, contact_email, contact_phone,
        event_name, event_venue, event_start_date, event_end_date,
        event_start_time, event_end_time, event_mode, event_type,
        proposal_status, event_status, attendance_count,
        created_at, updated_at, admin_comments,
        objectives, budget,
        gpoa_file_name, gpoa_file_size, gpoa_file_type, gpoa_file_path,
        project_proposal_file_name, project_proposal_file_size, project_proposal_file_type, project_proposal_file_path
      FROM proposals 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM proposals 
      ${whereClause}
    `;

    const [proposalsResult, countResult] = await Promise.all([
        query(proposalsQuery, [...params, limit, offset]),
        query(countQuery, params)
    ]);

    const proposals = proposalsResult.rows;
    const totalCount = parseInt(countResult.rows[0].total_count);

    // =============================================
    // POSTGRESQL FILE INTEGRATION
    // =============================================
    // Files are stored directly in PostgreSQL using bytea or file paths
    // No additional file integration needed for PostgreSQL-only setup
    console.log('📁 AdminService: Using PostgreSQL file storage for', proposals.length, 'proposals');

    return { proposals, totalCount, limit, page };
}

/**
 * =============================================
 * STATISTICS FUNCTIONS
 * =============================================
 */

/**
 * Generate comprehensive dashboard statistics for admin panel
 * 
 * Calculates:
 * - Proposal status counts (pending, approved, rejected, draft)
 * - Event statistics (total, completed, ongoing, scheduled)
 * - Recent activity (last 30 days)
 * - Organization type distribution
 * - Trend analysis (comparing current vs previous period)
 * 
 * @returns {Promise<Object>} Dashboard statistics object
 */
async function getAdminStats() {
    try {
        console.log('📊 Admin Service: Fetching dashboard statistics from PostgreSQL');

        // =============================================
        // BASE CONDITIONS & QUERY SETUP
        // =============================================
        const baseCondition = '(is_deleted = 0 OR is_deleted IS NULL)';

        // =============================================
        // STATISTICS QUERIES
        // =============================================

        // 1. Proposal Status Counts
        const statusQuery = `
            SELECT 
                proposal_status,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            GROUP BY proposal_status
        `;

        // 2. Recent Activity (last 30 days)
        const recentActivityQuery = `
            SELECT 
                COUNT(*) as recent_count
            FROM proposals 
            WHERE ${baseCondition} 
            AND created_at >= NOW() - INTERVAL '30 days'
        `;

        // 3. Event Statistics (only for approved proposals)
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

        // 4. Organization Type Distribution
        const orgTypesQuery = `
            SELECT 
                organization_type,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            GROUP BY organization_type
        `;

        // =============================================
        // EXECUTE QUERIES & PROCESS RESULTS
        // =============================================

        // Execute all queries in parallel for performance
        const [statusResult, recentActivityResult, eventsResult, orgTypesResult] = await Promise.all([
            query(statusQuery),
            query(recentActivityQuery),
            query(eventsQuery),
            query(orgTypesQuery)
        ]);

        // Process status counts into key-value pairs
        const statusCounts = {};
        statusResult.rows.forEach(row => {
            statusCounts[row.proposal_status] = parseInt(row.count);
        });

        // Process events data (default to empty object if no results)
        const eventsData = eventsResult.rows[0] || {};

        // Process organization types into key-value pairs
        const orgTypes = {};
        orgTypesResult.rows.forEach(row => {
            orgTypes[row.organization_type] = parseInt(row.count);
        });

        // =============================================
        // TREND ANALYSIS
        // =============================================

        // Get previous period data for trend comparison (30-60 days ago)
        const previousPeriodQuery = `
            SELECT 
                proposal_status,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            AND created_at >= NOW() - INTERVAL '60 days'
            AND created_at < NOW() - INTERVAL '30 days'
            GROUP BY proposal_status
        `;

        const previousPeriodResult = await query(previousPeriodQuery);
        const previousCounts = {};
        previousPeriodResult.rows.forEach(row => {
            previousCounts[row.proposal_status] = parseInt(row.count);
        });

        /**
         * Calculate trend direction and percentage change
         * 
         * @param {number} current - Current period count
         * @param {number} previous - Previous period count
         * @returns {Object} Trend object with direction and percentage
         */
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

        // =============================================
        // COMPILE FINAL STATISTICS OBJECT
        // =============================================

        const stats = {
            // =============================================
            // MAIN STATISTICS
            // =============================================
            // Note: 'rejected' includes both 'rejected' and 'denied' statuses
            pending: statusCounts.pending || 0,
            approved: statusCounts.approved || 0,
            rejected: (statusCounts.rejected || 0) + (statusCounts.denied || 0),
            draft: statusCounts.draft || 0,

            // =============================================
            // EVENT STATISTICS (only for approved proposals)
            // =============================================
            totalEvents: parseInt(eventsData.total_events) || 0,
            completedEvents: parseInt(eventsData.completed_events) || 0,
            ongoingEvents: parseInt(eventsData.ongoing_events) || 0,
            scheduledEvents: parseInt(eventsData.scheduled_events) || 0,

            // =============================================
            // ACTIVITY & ORGANIZATION STATISTICS
            // =============================================
            recentActivity: parseInt(recentActivityResult[0][0].recent_count) || 0,
            organizationTypes: orgTypes,

            // =============================================
            // TREND ANALYSIS
            // =============================================
            // Note: Rejected trends combine both 'rejected' and 'denied' statuses
            trends: {
                pending: calculateTrend(statusCounts.pending || 0, previousCounts.pending || 0),
                approved: calculateTrend(statusCounts.approved || 0, previousCounts.approved || 0),
                rejected: calculateTrend(
                    (statusCounts.rejected || 0) + (statusCounts.denied || 0),
                    (previousCounts.rejected || 0) + (previousCounts.denied || 0)
                ),
                draft: calculateTrend(statusCounts.draft || 0, previousCounts.draft || 0)
            },

            // =============================================
            // METADATA
            // =============================================
            lastUpdated: new Date().toISOString(),
            period: 'last_30_days'
        };

        // =============================================
        // LOG SUCCESS & RETURN RESULTS
        // =============================================
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

/**
 * =============================================
 * MODULE EXPORTS
 * =============================================
 * 
 * Exported functions for use in controllers:
 * - getAdminProposals: Fetch proposals with filtering and file integration
 * - getAdminStats: Generate comprehensive dashboard statistics
 */
module.exports = {
    getAdminProposals,
    getAdminStats,
}; 