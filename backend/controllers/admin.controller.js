const adminService = require('../services/admin.service');

const getProposalsForAdmin = async (req, res) => {
    console.log('📊 Admin: Fetching proposals for admin dashboard from PostgreSQL');
    try {
        const { proposals, totalCount, limit, page } = await adminService.getAdminProposals(req.query);

        const totalPages = Math.ceil(totalCount / limit);
        const formattedProposals = proposals.map(proposal => ({
            id: proposal.id,
            eventName: proposal.event_name || proposal.organization_name,
            venue: proposal.event_venue,
            organization: proposal.organization_name,
            submittedAt: proposal.created_at,
            startDate: proposal.event_start_date,
            status: proposal.proposal_status,
            contactPerson: proposal.contact_name,
            contactEmail: proposal.contact_email,
            contactPhone: proposal.contact_phone,
            organizationType: proposal.organization_type,
            eventType: proposal.event_type,
            description: proposal.organization_description,
            expectedParticipants: proposal.attendance_count || 0,
            intendedGoal: proposal.objectives,
            requiredResources: proposal.budget || 0,
            eventStatus: proposal.event_status,
            adminComments: proposal.admin_comments,
            files: proposal.files || {},
            updatedAt: proposal.updated_at
        }));

        res.json({
            success: true,
            proposals: formattedProposals,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit: limit
            },
            filters: req.query
        });

    } catch (error) {
        console.error('❌ Admin: Error fetching proposals from PostgreSQL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch proposals',
            message: error.message
        });
    }
};

const getAdminStats = async (req, res) => {
    console.log('📊 Admin: Fetching dashboard statistics for admin panel');
    try {
        const stats = await adminService.getAdminStats();

        res.json({
            success: true,
            data: stats,
            message: 'Dashboard statistics retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Admin: Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    getProposalsForAdmin,
    getAdminStats,
}; 