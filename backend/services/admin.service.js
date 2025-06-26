const { pool } = require('../config/db');

async function getAdminProposals(queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, category, search, organizationType } = queryParams;

    let whereConditions = ['(is_deleted = 0 OR is_deleted IS NULL)'];
    let params = [];

    if (status && status !== 'all') {
        whereConditions.push('proposal_status = ?');
        params.push(status);
    }
    if (organizationType && organizationType !== 'all') {
        whereConditions.push('organization_type = ?');
        params.push(organizationType);
    }
    if (search) {
        whereConditions.push('(organization_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR event_name LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

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

    const [proposalsResult, countResult] = await Promise.all([
        pool.query(proposalsQuery, [...params, limit, offset]),
        pool.query(countQuery, params)
    ]);

    const proposals = proposalsResult[0];
    const totalCount = countResult[0][0].total_count;

    // --- Hybrid enhancement: attach file metadata from MongoDB (GridFS bucket) ---
    try {
        const { getDb } = require('../config/mongodb');
        const db = await getDb();
        // Mongo stores organizationId as string or ObjectId → normalise to string
        const idStrings = proposals.map(p => String(p.id));

        const mongoDocs = await db.collection('proposals')
            .find({ organizationId: { $in: idStrings } }, { projection: { organizationId: 1, files: 1 } })
            .toArray();

        const fileMap = {};
        mongoDocs.forEach(doc => {
            fileMap[String(doc.organizationId)] = doc.files || {};
        });

        proposals.forEach(p => {
            p.files = fileMap[String(p.id)] || {};
        });
    } catch (mergeErr) {
        console.warn('📁 AdminService: Unable to merge Mongo file metadata:', mergeErr.message);
    }

    return { proposals, totalCount, limit, page };
}

async function getAdminStats() {
    try {
        console.log('📊 Admin Service: Fetching dashboard statistics from MySQL');

        // Base condition to exclude deleted records
        const baseCondition = '(is_deleted = 0 OR is_deleted IS NULL)';

        // Get proposal status counts
        const statusQuery = `
            SELECT 
                proposal_status,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            GROUP BY proposal_status
        `;

        // Get recent activity (last 30 days)
        const recentActivityQuery = `
            SELECT 
                COUNT(*) as recent_count
            FROM proposals 
            WHERE ${baseCondition} 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        // Get total events count
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

        // Get organization types distribution
        const orgTypesQuery = `
            SELECT 
                organization_type,
                COUNT(*) as count
            FROM proposals 
            WHERE ${baseCondition}
            GROUP BY organization_type
        `;

        // Execute all queries in parallel
        const [statusResult, recentActivityResult, eventsResult, orgTypesResult] = await Promise.all([
            pool.query(statusQuery),
            pool.query(recentActivityQuery),
            pool.query(eventsQuery),
            pool.query(orgTypesQuery)
        ]);

        // Process status counts
        const statusCounts = {};
        statusResult[0].forEach(row => {
            statusCounts[row.proposal_status] = parseInt(row.count);
        });

        // Process events data
        const eventsData = eventsResult[0][0] || {};

        // Process organization types
        const orgTypes = {};
        orgTypesResult[0].forEach(row => {
            orgTypes[row.organization_type] = parseInt(row.count);
        });

        // Calculate trends (comparing with previous 30 days)
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

        // Calculate percentage changes
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

        const stats = {
            // Main stats
            pending: statusCounts.pending || 0,
            approved: statusCounts.approved || 0,
            rejected: statusCounts.rejected || 0,
            draft: statusCounts.draft || 0,

            // Events stats
            totalEvents: parseInt(eventsData.total_events) || 0,
            completedEvents: parseInt(eventsData.completed_events) || 0,
            ongoingEvents: parseInt(eventsData.ongoing_events) || 0,
            scheduledEvents: parseInt(eventsData.scheduled_events) || 0,

            // Recent activity
            recentActivity: parseInt(recentActivityResult[0][0].recent_count) || 0,

            // Organization types
            organizationTypes: orgTypes,

            // Trends
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

module.exports = {
    getAdminProposals,
    getAdminStats,
}; 