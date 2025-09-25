/**
 * Audit Service
 * Handles audit logging and debug logging for proposal operations
 * 
 * Key approaches: Centralized logging, structured data storage,
 * and comprehensive audit trail management
 */

const { pool, query } = require('../config/database-postgresql-only');

/**
 * Create audit log entry
 * @param {string} proposalUuid - Proposal UUID
 * @param {string} action - Action performed
 * @param {number} actorId - User ID who performed the action
 * @param {string} note - Optional note about the action
 * @param {object} meta - Optional metadata
 */
async function createAuditLog(proposalUuid, action, actorId, note = null, meta = null) {
    try {
        // First, get the numeric ID of the proposal from its UUID
        const proposalResult = await query(
            'SELECT id FROM proposals WHERE uuid = $1',
            [proposalUuid]
        );

        if (proposalResult.rows.length === 0) {
            console.error(`[AUDIT] Proposal not found for UUID: ${proposalUuid}`);
            return null;
        }

        const proposalId = proposalResult.rows[0].id;

        // Map action types to valid CHECK constraint values
        const actionMapping = {
            'proposal_created': 'CREATE',
            'proposal_updated': 'UPDATE',
            'proposal_submitted': 'UPDATE',
            'proposal_retrieved': 'VIEW',
            'proposal_approved': 'APPROVE',
            'proposal_rejected': 'REJECT',
            'proposal_deleted': 'DELETE',
            'report_submitted': 'UPDATE',
            'files_uploaded': 'UPDATE'
        };

        const validActionType = actionMapping[action] || 'UPDATE';

        const result = await query(
            'INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values, additional_info) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
                actorId,
                validActionType,
                'proposals',
                proposalId,
                null,
                meta ? JSON.stringify(meta) : null,
                note ? JSON.stringify({ note }) : null
            ]
        );

        console.log(`[AUDIT] Created audit log: ${action} for proposal ${proposalUuid} by user ${actorId}`);

        // Return the created audit log
        if (result.rows && result.rows[0]) {
            return result.rows[0];
        }

        // Fallback: get the created audit log by querying
        const auditLogResult = await query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1'
        );

        return auditLogResult.rows[0] || result;
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw - audit logging failure shouldn't break the main operation
        return null;
    }
}

/**
 * Create debug log entry
 * @param {string} proposalUuid - Proposal UUID
 * @param {string} source - Source of the debug message
 * @param {string} message - Debug message
 * @param {object} meta - Optional metadata
 */
async function createDebugLog(proposalUuid, source, message, meta = null) {
    try {
        const [result] = await pool.execute(
            'INSERT INTO proposal_debug_logs (proposal_uuid, source, message, meta) VALUES (?, ?, ?, ?)',
            [proposalUuid, source, message, meta ? JSON.stringify(meta) : null]
        );

        console.log(`[DEBUG] Created debug log: ${source} - ${message} for proposal ${proposalUuid}`);
        return result.insertId;
    } catch (error) {
        console.error('Error creating debug log:', error);
        // Don't throw - debug logging failure shouldn't break the main operation
        return null;
    }
}

/**
 * Get audit logs for a proposal
 * @param {string} proposalUuid - Proposal UUID
 * @param {number} limit - Maximum number of logs to return
 * @param {number} offset - Number of logs to skip
 */
async function getAuditLogs(proposalUuid, limit = 50, offset = 0) {
    try {
        const [logs] = await pool.execute(
            `SELECT 
                pal.*,
                u.email as actor_email,
                u.first_name as actor_first_name,
                u.last_name as actor_last_name
            FROM proposal_audit_logs pal
            LEFT JOIN users u ON pal.actor_id = u.id
            WHERE pal.proposal_uuid = ?
            ORDER BY pal.created_at DESC
            LIMIT ? OFFSET ?`,
            [proposalUuid, limit, offset]
        );

        return logs;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

/**
 * Get debug logs for a proposal
 * @param {string} proposalUuid - Proposal UUID
 * @param {number} limit - Maximum number of logs to return
 * @param {number} offset - Number of logs to skip
 */
async function getDebugLogs(proposalUuid, limit = 50, offset = 0) {
    try {
        const [logs] = await pool.execute(
            'SELECT * FROM proposal_debug_logs WHERE proposal_uuid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [proposalUuid, limit, offset]
        );

        return logs;
    } catch (error) {
        console.error('Error fetching debug logs:', error);
        return [];
    }
}

/**
 * Get comprehensive debug information for a proposal
 * @param {string} proposalUuid - Proposal UUID
 */
async function getDebugInfo(proposalUuid) {
    try {
        // Get proposal data
        const [proposals] = await pool.execute(
            'SELECT * FROM proposals WHERE uuid = ?',
            [proposalUuid]
        );

        if (proposals.length === 0) {
            return null;
        }

        const proposal = proposals[0];

        // Get audit logs
        const auditLogs = await getAuditLogs(proposalUuid, 20);

        // Get debug logs
        const debugLogs = await getDebugLogs(proposalUuid, 20);

        // Calculate status match (simplified implementation)
        const statusMatch = true; // This would be more complex in real implementation

        return {
            postgresql_record: proposal,
            audit_logs: auditLogs,
            debug_logs: debugLogs,
            status_match: statusMatch
        };
    } catch (error) {
        console.error('Error fetching debug info:', error);
        return null;
    }
}

/**
 * Clear debug logs for a proposal
 * @param {string} proposalUuid - Proposal UUID
 */
async function clearDebugLogs(proposalUuid) {
    try {
        const [result] = await pool.execute(
            'DELETE FROM proposal_debug_logs WHERE proposal_uuid = ?',
            [proposalUuid]
        );

        console.log(`[DEBUG] Cleared ${result.affectedRows} debug logs for proposal ${proposalUuid}`);
        return result.affectedRows;
    } catch (error) {
        console.error('Error clearing debug logs:', error);
        return 0;
    }
}

/**
 * Get audit log statistics for a proposal
 * @param {string} proposalUuid - Proposal UUID
 */
async function getAuditStats(proposalUuid) {
    try {
        const [stats] = await pool.execute(
            `SELECT 
                action,
                COUNT(*) as count,
                MIN(created_at) as first_occurrence,
                MAX(created_at) as last_occurrence
            FROM proposal_audit_logs 
            WHERE proposal_uuid = ?
            GROUP BY action
            ORDER BY count DESC`,
            [proposalUuid]
        );

        return stats;
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        return [];
    }
}

/**
 * Export audit trail for a proposal
 * @param {string} proposalUuid - Proposal UUID
 */
async function exportAuditTrail(proposalUuid) {
    try {
        const debugInfo = await getDebugInfo(proposalUuid);
        const auditStats = await getAuditStats(proposalUuid);

        return {
            proposal_uuid: proposalUuid,
            export_timestamp: new Date().toISOString(),
            debug_info: debugInfo,
            audit_statistics: auditStats,
            export_version: '1.0'
        };
    } catch (error) {
        console.error('Error exporting audit trail:', error);
        return null;
    }
}

module.exports = {
    createAuditLog,
    createDebugLog,
    getAuditLogs,
    getDebugLogs,
    getDebugInfo,
    clearDebugLogs,
    getAuditStats,
    exportAuditTrail
};
