/**
 * =============================================
 * REPORT SERVICE - Reporting & Analytics
 * =============================================
 * 
 * This service handles all reporting and analytics operations including
 * data aggregation, statistical analysis, and report generation. It
 * provides comprehensive insights across the hybrid database architecture.
 * 
 * @module services/report.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Comprehensive data analytics
 * - Statistical reporting
 * - Trend analysis
 * - Performance metrics
 * - Data visualization support
 * - Export capabilities
 */

const { pool } = require('../config/db');
const { getDb } = require('../utils/db');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate report parameters
 * 
 * @param {Object} params - Report parameters
 * @returns {Object} Validation result
 */
const validateReportParams = (params) => {
    const errors = [];

    if (params.dateFrom && params.dateTo) {
        const fromDate = new Date(params.dateFrom);
        const toDate = new Date(params.dateTo);
        if (fromDate > toDate) {
            errors.push('Start date cannot be after end date');
        }
    }

    if (params.limit && (isNaN(params.limit) || params.limit < 1 || params.limit > 1000)) {
        errors.push('Invalid limit (must be 1-1000)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Calculate percentage change
 * 
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

/**
 * Format date range for queries
 * 
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @returns {Object} Formatted date range
 */
const formatDateRange = (dateFrom, dateTo) => {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const to = dateTo ? new Date(dateTo) : new Date();

    return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0]
    };
};

/**
 * Aggregate data by time period
 * 
 * @param {Array} data - Raw data array
 * @param {string} period - Time period (day, week, month)
 * @returns {Array} Aggregated data
 */
const aggregateByTimePeriod = (data, period = 'month') => {
    const aggregated = {};

    data.forEach(item => {
        let key;
        const date = new Date(item.created_at || item.date);

        switch (period) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            default:
                key = date.toISOString().split('T')[0];
        }

        if (!aggregated[key]) {
            aggregated[key] = {
                period: key,
                count: 0,
                total: 0
            };
        }

        aggregated[key].count++;
        if (item.value) aggregated[key].total += item.value;
    });

    return Object.values(aggregated).sort((a, b) => a.period.localeCompare(b.period));
};

// =============================================
// PROPOSAL ANALYTICS FUNCTIONS
// =============================================

/**
 * Get proposal statistics report
 * 
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Proposal statistics
 */
const getProposalStatistics = async (filters = {}) => {
    try {
        console.log('📊 REPORT: Generating proposal statistics');

        const validation = validateReportParams(filters);
        if (!validation.isValid) {
            throw new Error(`Invalid report parameters: ${validation.errors.join(', ')}`);
        }

        const { from, to } = formatDateRange(filters.dateFrom, filters.dateTo);

        // Get basic statistics
        const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_proposals,
        SUM(CASE WHEN proposal_status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN proposal_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN proposal_status IN ('rejected', 'denied') THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN proposal_status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
    `, [from, to]);

        // Get organization type distribution
        const [orgTypes] = await pool.query(`
      SELECT 
        organization_type,
        COUNT(*) as count
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY organization_type
      ORDER BY count DESC
    `, [from, to]);

        // Get event mode distribution
        const [eventModes] = await pool.query(`
      SELECT 
        event_mode,
        COUNT(*) as count
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY event_mode
      ORDER BY count DESC
    `, [from, to]);

        const report = {
            period: { from, to },
            summary: stats[0],
            organizationTypes: orgTypes,
            eventModes: eventModes,
            generatedAt: new Date().toISOString()
        };

        console.log('✅ REPORT: Successfully generated proposal statistics');

        return report;

    } catch (error) {
        console.error('❌ REPORT: Error generating proposal statistics:', error);
        throw new Error(`Failed to generate proposal statistics: ${error.message}`);
    }
};

/**
 * Get proposal trends over time
 * 
 * @param {Object} options - Trend options
 * @returns {Promise<Array>} Trend data
 */
const getProposalTrends = async (options = {}) => {
    try {
        console.log('📈 REPORT: Generating proposal trends');

        const { from, to } = formatDateRange(options.dateFrom, options.dateTo);
        const period = options.period || 'month';

        let groupBy;
        switch (period) {
            case 'day':
                groupBy = 'DATE(created_at)';
                break;
            case 'week':
                groupBy = 'YEARWEEK(created_at)';
                break;
            case 'month':
                groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                break;
            default:
                groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        }

        const [trends] = await pool.query(`
      SELECT 
        ${groupBy} as period,
        COUNT(*) as total,
        SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN proposal_status IN ('rejected', 'denied') THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN proposal_status = 'submitted' THEN 1 ELSE 0 END) as submitted
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `, [from, to]);

        const aggregatedTrends = aggregateByTimePeriod(trends, period);

        console.log('✅ REPORT: Successfully generated proposal trends');

        return {
            trends: aggregatedTrends,
            period: period,
            dateRange: { from, to }
        };

    } catch (error) {
        console.error('❌ REPORT: Error generating proposal trends:', error);
        throw new Error(`Failed to generate proposal trends: ${error.message}`);
    }
};

// =============================================
// PERFORMANCE METRICS FUNCTIONS
// =============================================

/**
 * Get system performance metrics
 * 
 * @param {Object} filters - Performance filters
 * @returns {Promise<Object>} Performance metrics
 */
const getPerformanceMetrics = async (filters = {}) => {
    try {
        console.log('⚡ REPORT: Generating performance metrics');

        const { from, to } = formatDateRange(filters.dateFrom, filters.dateTo);

        // Get proposal processing times
        const [processingTimes] = await pool.query(`
      SELECT 
        proposal_status,
        AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_processing_hours,
        MIN(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as min_processing_hours,
        MAX(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as max_processing_hours
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY proposal_status
    `, [from, to]);

        // Get daily submission rates
        const [dailySubmissions] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as submissions
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [from, to]);

        // Get approval rates
        const [approvalRates] = await pool.query(`
      SELECT 
        organization_type,
        COUNT(*) as total,
        SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
        (SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as approval_rate
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY organization_type
    `, [from, to]);

        const metrics = {
            processingTimes: processingTimes,
            dailySubmissions: dailySubmissions,
            approvalRates: approvalRates,
            period: { from, to },
            generatedAt: new Date().toISOString()
        };

        console.log('✅ REPORT: Successfully generated performance metrics');

        return metrics;

    } catch (error) {
        console.error('❌ REPORT: Error generating performance metrics:', error);
        throw new Error(`Failed to generate performance metrics: ${error.message}`);
    }
};

/**
 * Get user activity metrics
 * 
 * @param {Object} filters - Activity filters
 * @returns {Promise<Object>} Activity metrics
 */
const getUserActivityMetrics = async (filters = {}) => {
    try {
        console.log('👥 REPORT: Generating user activity metrics');

        const { from, to } = formatDateRange(filters.dateFrom, filters.dateTo);

        // Get organization activity
        const [orgActivity] = await pool.query(`
      SELECT 
        organization_name,
        COUNT(*) as proposal_count,
        MAX(created_at) as last_activity,
        MIN(created_at) as first_activity
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY organization_name
      ORDER BY proposal_count DESC
      LIMIT 10
    `, [from, to]);

        // Get contact person activity
        const [contactActivity] = await pool.query(`
      SELECT 
        contact_name,
        contact_email,
        COUNT(*) as proposal_count,
        MAX(created_at) as last_activity
      FROM proposals 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY contact_name, contact_email
      ORDER BY proposal_count DESC
      LIMIT 10
    `, [from, to]);

        const activityMetrics = {
            topOrganizations: orgActivity,
            topContacts: contactActivity,
            period: { from, to },
            generatedAt: new Date().toISOString()
        };

        console.log('✅ REPORT: Successfully generated user activity metrics');

        return activityMetrics;

    } catch (error) {
        console.error('❌ REPORT: Error generating user activity metrics:', error);
        throw new Error(`Failed to generate user activity metrics: ${error.message}`);
    }
};

// =============================================
// FILE ANALYTICS FUNCTIONS
// =============================================

/**
 * Get file upload analytics
 * 
 * @param {Object} filters - File analytics filters
 * @returns {Promise<Object>} File analytics
 */
const getFileUploadAnalytics = async (filters = {}) => {
    try {
        console.log('📁 REPORT: Generating file upload analytics');

        const { from, to } = formatDateRange(filters.dateFrom, filters.dateTo);

        // Get MongoDB file statistics
        const db = await getDb();
        const collection = db.collection('proposal_files.files');

        const fileStats = await collection.aggregate([
            {
                $match: {
                    'metadata.uploadDate': {
                        $gte: new Date(from),
                        $lte: new Date(to)
                    }
                }
            },
            {
                $group: {
                    _id: '$metadata.fileType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$length' },
                    avgSize: { $avg: '$length' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();

        // Get daily upload trends
        const dailyUploads = await collection.aggregate([
            {
                $match: {
                    'metadata.uploadDate': {
                        $gte: new Date(from),
                        $lte: new Date(to)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$metadata.uploadDate'
                        }
                    },
                    count: { $sum: 1 },
                    totalSize: { $sum: '$length' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

        const fileAnalytics = {
            fileTypes: fileStats,
            dailyUploads: dailyUploads,
            period: { from, to },
            generatedAt: new Date().toISOString()
        };

        console.log('✅ REPORT: Successfully generated file upload analytics');

        return fileAnalytics;

    } catch (error) {
        console.error('❌ REPORT: Error generating file upload analytics:', error);
        throw new Error(`Failed to generate file upload analytics: ${error.message}`);
    }
};

// =============================================
// EXPORT FUNCTIONS
// =============================================

module.exports = {
    // Proposal Analytics
    getProposalStatistics,
    getProposalTrends,

    // Performance Metrics
    getPerformanceMetrics,
    getUserActivityMetrics,

    // File Analytics
    getFileUploadAnalytics,

    // Utility Functions
    validateReportParams,
    calculatePercentageChange,
    formatDateRange,
    aggregateByTimePeriod
}; 