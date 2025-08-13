const reportService = require('../services/report.service');

const getDashboardStats = async (req, res) => {
    console.log('📊 Dashboard: Fetching real-time statistics from proposals table');
    try {
        const dashboardStats = await reportService.getDashboardStats();
        res.json({
            success: true,
            stats: dashboardStats,
            timestamp: new Date().toISOString(),
            source: 'mysql_realtime'
        });
    } catch (error) {
        console.error('❌ Dashboard: Error fetching real-time statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch real-time statistics',
            message: error.message,
            stats: {
                pending: 0, approved: 0, rejected: 0, total: 0,
                draft: 0, revision: 0, approvalRate: 0,
                trends: {
                    pending: { direction: 'up', value: '0' },
                    approved: { direction: 'up', value: '0%' },
                    rejected: { direction: 'down', value: '0' },
                    total: { direction: 'up', value: '0%' }
                },
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });
    }
};

const getLiveStats = async (req, res) => {
    console.log('📊 Dashboard: Fetching enhanced live statistics');
    try {
        const liveStats = await reportService.getLiveStats();
        res.json({
            success: true,
            stats: liveStats,
            timestamp: new Date().toISOString(),
            source: 'mysql_live'
        });
    } catch (error) {
        console.error('❌ Dashboard: Error fetching live statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live statistics',
            message: error.message,
            timestamp: new Date().toISOString(),
            source: 'error'
        });
    }
};

const getOrganizations = async (req, res) => {
    console.log('📊 Reports: Fetching organizations with filters:', req.query);
    try {
        const filters = {
            category: req.query.category,
            search: req.query.search,
            sort: req.query.sort,
            order: req.query.order
        };

        const organizations = await reportService.getOrganizations(filters);

        res.json({
            success: true,
            organizations: organizations,
            count: organizations.length,
            timestamp: new Date().toISOString(),
            source: 'mysql_realtime'
        });
    } catch (error) {
        console.error('❌ Reports: Error fetching organizations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch organizations',
            message: error.message,
            organizations: [],
            count: 0,
            timestamp: new Date().toISOString(),
            source: 'error'
        });
    }
};

const getAnalytics = async (req, res) => {
    console.log('📊 Reports: Fetching general analytics');
    try {
        const analytics = await reportService.getAnalytics();

        res.json({
            success: true,
            analytics: analytics,
            timestamp: new Date().toISOString(),
            source: 'mysql_realtime'
        });
    } catch (error) {
        console.error('❌ Reports: Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
            message: error.message,
            analytics: null,
            timestamp: new Date().toISOString(),
            source: 'error'
        });
    }
};

const getOrganizationAnalytics = async (req, res) => {
    const { organizationName } = req.params;
    console.log('📊 Reports: Fetching analytics for organization:', organizationName);

    try {
        const orgAnalytics = await reportService.getOrganizationAnalytics(organizationName);

        res.json({
            success: true,
            analytics: orgAnalytics,
            timestamp: new Date().toISOString(),
            source: 'mysql_realtime'
        });
    } catch (error) {
        console.error('❌ Reports: Error fetching organization analytics:', error);

        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to fetch organization analytics',
            message: error.message,
            analytics: null,
            timestamp: new Date().toISOString(),
            source: 'error'
        });
    }
};

const generateReport = async (req, res) => {
    console.log('📊 Reports: Generating comprehensive report with parameters:', req.body);
    try {
        const reportParams = req.body;
        const report = await reportService.generateComprehensiveReport(reportParams);

        res.json({
            success: true,
            report: report,
            timestamp: new Date().toISOString(),
            source: 'mysql_realtime'
        });
    } catch (error) {
        console.error('❌ Reports: Error generating report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate report',
            message: error.message,
            report: null,
            timestamp: new Date().toISOString(),
            source: 'error'
        });
    }
};

module.exports = {
    getDashboardStats,
    getLiveStats,
    getOrganizations: (req, res) => res.json({ success: true }),
    getAnalytics: (req, res) => res.json({ success: true }),
    getOrganizationAnalytics: (req, res) => res.json({ success: true }),
    generateReport,
};