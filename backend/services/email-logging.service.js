/**
 * Email SMTP Logging Service
 * Purpose: Log all email notifications sent through SMTP in dedicated table
 * Key approaches: Comprehensive email tracking, delivery status, error logging, retry logic
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class EmailLoggingService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 300000; // 5 minutes
    }

    /**
     * Log email attempt before sending
     */
    async logEmailAttempt({
        fromEmail,
        toEmail,
        ccEmail = null,
        bccEmail = null,
        subject,
        bodyHtml,
        bodyText,
        smtpServer,
        smtpPort,
        smtpSecure = false,
        smtpAuthUser,
        notificationId = null,
        proposalId = null,
        userId = null,
        templateName = null,
        metadata = {},
        attachments = [],
        headers = {}
    }) {
        try {
            const result = await pool.query(`
                INSERT INTO email_smtp_logs (
                    from_email, to_email, cc_email, bcc_email, subject, body_html, body_text,
                    smtp_server, smtp_port, smtp_secure, smtp_auth_user,
                    notification_id, proposal_id, user_id, template_name,
                    metadata, attachments, headers, status, delivery_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING id, uuid
            `, [
                fromEmail, toEmail, ccEmail, bccEmail, subject, bodyHtml, bodyText,
                smtpServer, smtpPort, smtpSecure, smtpAuthUser,
                notificationId, proposalId, userId, templateName,
                JSON.stringify(metadata), JSON.stringify(attachments), JSON.stringify(headers),
                'pending', 'pending'
            ]);

            console.log(`📧 Email attempt logged: ${result.rows[0].uuid}`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to log email attempt:', error);
            throw error;
        }
    }

    /**
     * Update email status after sending
     */
    async updateEmailStatus(logId, status, messageId = null, error = null) {
        try {
            const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
            const values = [logId, status];
            let paramIndex = 3;

            if (messageId) {
                updateFields.push(`message_id = $${paramIndex}`);
                values.push(messageId);
                paramIndex++;
            }

            if (error) {
                updateFields.push(`delivery_error = $${paramIndex}`);
                values.push(error);
                paramIndex++;
            }

            if (status === 'sent') {
                updateFields.push('sent_at = CURRENT_TIMESTAMP');
            } else if (status === 'failed') {
                updateFields.push('failed_at = CURRENT_TIMESTAMP');
            }

            await pool.query(`
                UPDATE email_smtp_logs 
                SET ${updateFields.join(', ')}
                WHERE id = $1
            `, values);

            console.log(`📧 Email status updated: ${logId} -> ${status}`);
        } catch (error) {
            console.error('❌ Failed to update email status:', error);
            throw error;
        }
    }

    /**
     * Update delivery status from SMTP server
     */
    async updateDeliveryStatus(logId, deliveryStatus, deliveryTimestamp = null, deliveryError = null) {
        try {
            const updateFields = ['delivery_status = $2', 'updated_at = CURRENT_TIMESTAMP'];
            const values = [logId, deliveryStatus];
            let paramIndex = 3;

            if (deliveryTimestamp) {
                updateFields.push(`delivery_timestamp = $${paramIndex}`);
                values.push(deliveryTimestamp);
                paramIndex++;
            }

            if (deliveryError) {
                updateFields.push(`delivery_error = $${paramIndex}`);
                values.push(deliveryError);
                paramIndex++;
            }

            await pool.query(`
                UPDATE email_smtp_logs 
                SET ${updateFields.join(', ')}
                WHERE id = $1
            `, values);

            console.log(`📧 Delivery status updated: ${logId} -> ${deliveryStatus}`);
        } catch (error) {
            console.error('❌ Failed to update delivery status:', error);
            throw error;
        }
    }

    /**
     * Log retry attempt
     */
    async logRetryAttempt(logId, nextRetryAt = null) {
        try {
            const result = await pool.query(`
                UPDATE email_smtp_logs 
                SET retry_count = retry_count + 1,
                    next_retry_at = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING retry_count
            `, [logId, nextRetryAt]);

            console.log(`📧 Retry attempt logged: ${logId} (attempt ${result.rows[0].retry_count})`);
            return result.rows[0].retry_count;
        } catch (error) {
            console.error('❌ Failed to log retry attempt:', error);
            throw error;
        }
    }

    /**
     * Get emails by status
     */
    async getEmailsByStatus(status, limit = 100) {
        try {
            const result = await pool.query(`
                SELECT * FROM email_smtp_logs 
                WHERE status = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `, [status, limit]);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get emails by status:', error);
            throw error;
        }
    }

    /**
     * Get failed emails for retry
     */
    async getFailedEmailsForRetry() {
        try {
            const result = await pool.query(`
                SELECT * FROM email_smtp_logs 
                WHERE status = 'failed' 
                AND retry_count < max_retries
                AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP)
                ORDER BY created_at ASC
            `);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get failed emails for retry:', error);
            throw error;
        }
    }

    /**
     * Get email statistics
     */
    async getEmailStatistics(days = 30) {
        try {
            const result = await pool.query(`
                SELECT 
                    status,
                    delivery_status,
                    COUNT(*) as count,
                    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days' THEN 1 END) as recent_count
                FROM email_smtp_logs 
                WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
                GROUP BY status, delivery_status
                ORDER BY status, delivery_status
            `);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get email statistics:', error);
            throw error;
        }
    }

    /**
     * Get email logs for a specific user
     */
    async getUserEmailLogs(userId, limit = 50) {
        try {
            const result = await pool.query(`
                SELECT 
                    id, uuid, from_email, to_email, subject, status, delivery_status,
                    created_at, sent_at, delivery_timestamp, delivery_error
                FROM email_smtp_logs 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `, [userId, limit]);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get user email logs:', error);
            throw error;
        }
    }

    /**
     * Get email logs for a specific proposal
     */
    async getProposalEmailLogs(proposalId, limit = 50) {
        try {
            const result = await pool.query(`
                SELECT 
                    id, uuid, from_email, to_email, subject, status, delivery_status,
                    created_at, sent_at, delivery_timestamp, delivery_error
                FROM email_smtp_logs 
                WHERE proposal_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `, [proposalId, limit]);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get proposal email logs:', error);
            throw error;
        }
    }

    /**
     * Clean up old email logs (older than specified days)
     */
    async cleanupOldLogs(days = 90) {
        try {
            const result = await pool.query(`
                DELETE FROM email_smtp_logs 
                WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'
                AND status IN ('delivered', 'failed', 'bounced')
            `);

            console.log(`📧 Cleaned up ${result.rowCount} old email logs`);
            return result.rowCount;
        } catch (error) {
            console.error('❌ Failed to cleanup old email logs:', error);
            throw error;
        }
    }
}

module.exports = new EmailLoggingService();
