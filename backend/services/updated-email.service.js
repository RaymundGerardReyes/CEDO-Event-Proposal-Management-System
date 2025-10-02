/**
 * Updated Email Service with SMTP Logging Integration
 * Purpose: Handle all email notifications with proper email_smtp_logs table integration
 * Key approaches: SMTP logging, delivery tracking, proper data separation
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');

// Database connection for email logging
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class UpdatedEmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
        this.templates = new Map();
    }

    /**
     * Initialize the email service with Google SMTP configuration
     */
    async initialize() {
        try {
            const emailUser = process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER;
            const emailPassword = process.env.EMAIL_PASSWORD || process.env.GOOGLE_APP_PASSWORD;

            if (!emailUser || !emailPassword) {
                console.warn('⚠️ Email credentials not found. Email service will run in demo mode.');
                console.warn('💡 To enable email notifications, set EMAIL_USER and EMAIL_PASSWORD environment variables.');
                return;
            }

            // Create transporter
            this.transporter = nodemailer.createTransporter({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: emailUser,
                    pass: emailPassword
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection
            await this.transporter.verify();
            this.isInitialized = true;

            console.log('✅ Updated email service initialized successfully');
            console.log(`📧 SMTP configured for: ${emailUser}`);

            // Load email templates
            await this.loadEmailTemplates();

        } catch (error) {
            console.error('❌ Failed to initialize updated email service:', error.message);
            this.isInitialized = false;
        }
    }

    /**
     * Load email templates
     */
    async loadEmailTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/email');

            // Check if templates directory exists
            try {
                await fs.access(templatesDir);
            } catch {
                console.log('📄 Creating default email templates...');
                await this.createDefaultTemplates();
                return;
            }

            const templateFiles = await fs.readdir(templatesDir);

            for (const file of templateFiles) {
                if (file.endsWith('.html')) {
                    const templateName = file.replace('.html', '');
                    const templatePath = path.join(templatesDir, file);
                    const content = await fs.readFile(templatePath, 'utf8');

                    this.templates.set(templateName, { content, path: templatePath });
                    console.log(`📄 Loaded email template: ${templateName}`);
                }
            }

            console.log(`✅ Loaded ${this.templates.size} email templates`);

        } catch (error) {
            console.error('❌ Failed to load email templates:', error.message);
        }
    }

    /**
     * Log email attempt in email_smtp_logs table
     */
    async logEmailAttempt({
        fromEmail,
        toEmail,
        subject,
        bodyHtml,
        bodyText,
        userId = null,
        proposalId = null,
        notificationId = null,
        templateName = null,
        metadata = {},
        attachments = []
    }) {
        try {
            const result = await pool.query(`
                INSERT INTO email_smtp_logs (
                    from_email, to_email, subject, body_html, body_text,
                    smtp_server, smtp_port, smtp_secure, smtp_auth_user,
                    user_id, proposal_id, notification_id, template_name,
                    metadata, attachments, status, delivery_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id, uuid
            `, [
                fromEmail, toEmail, subject, bodyHtml, bodyText,
                'smtp.gmail.com', 587, false, process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER,
                userId, proposalId, notificationId, templateName,
                JSON.stringify(metadata), JSON.stringify(attachments), 'pending', 'pending'
            ]);

            console.log(`📧 Email attempt logged in email_smtp_logs: ${result.rows[0].uuid}`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to log email attempt:', error);
            throw error;
        }
    }

    /**
     * Update email status in email_smtp_logs table
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

            console.log(`📧 Email status updated in email_smtp_logs: ${logId} -> ${status}`);
        } catch (error) {
            console.error('❌ Failed to update email status:', error);
            throw error;
        }
    }

    /**
     * Send email using template with SMTP logging
     */
    async sendEmail({
        to,
        subject,
        template,
        data = {},
        attachments = [],
        userId = null,
        proposalId = null,
        notificationId = null,
        metadata = {}
    }) {
        let emailLogId = null;

        try {
            // Log email attempt in email_smtp_logs table
            const emailLog = await this.logEmailAttempt({
                fromEmail: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER,
                toEmail: to,
                subject,
                bodyHtml: null, // Will be set after template processing
                bodyText: null, // Will be set after template processing
                userId,
                proposalId,
                notificationId,
                templateName: template,
                metadata,
                attachments
            });

            emailLogId = emailLog.id;

            if (!this.isInitialized) {
                console.warn('⚠️ Email service not initialized. Email will not be sent.');
                console.warn('💡 To enable email notifications, set EMAIL_USER and EMAIL_PASSWORD environment variables.');

                await this.updateEmailStatus(emailLogId, 'failed', null, 'Email service not initialized');

                return {
                    success: false,
                    message: 'Email service not initialized. Please configure email credentials.',
                    demo: true,
                    emailLogId
                };
            }

            // Get template content
            const templateData = this.templates.get(template);
            if (!templateData) {
                throw new Error(`Template '${template}' not found`);
            }

            // Replace template variables
            let htmlContent = templateData.content;
            for (const [key, value] of Object.entries(data)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlContent = htmlContent.replace(regex, value || '');
            }

            // Generate plain text version
            const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

            // Update email log with processed content
            await this.updateEmailStatus(emailLogId, 'pending', null, null);

            // Prepare email options
            const mailOptions = {
                from: {
                    name: 'CEDO Partnership Management',
                    address: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER
                },
                to,
                subject,
                html: htmlContent,
                text: textContent,
                attachments
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            // Update email log with success
            await this.updateEmailStatus(emailLogId, 'sent', result.messageId);

            console.log(`✅ Email sent successfully to ${to}`);
            console.log(`📧 Message ID: ${result.messageId}`);
            console.log(`📧 Email Log ID: ${emailLogId}`);

            return {
                success: true,
                messageId: result.messageId,
                emailLogId,
                to,
                subject
            };

        } catch (error) {
            console.error('❌ Failed to send email:', error.message);

            // Update email log with failure
            if (emailLogId) {
                await this.updateEmailStatus(emailLogId, 'failed', null, error.message);
            }

            return {
                success: false,
                message: error.message,
                emailLogId,
                to,
                subject
            };
        }
    }

    /**
     * Send proposal submitted notification with SMTP logging
     */
    async sendProposalSubmittedNotification({ userEmail, userName, proposalData, userId = null, proposalId = null }) {
        const data = {
            userName,
            eventName: proposalData.event_name || proposalData.eventName,
            eventDate: proposalData.event_start_date || proposalData.startDate,
            eventVenue: proposalData.event_venue || proposalData.venue,
            proposalId: proposalData.uuid || proposalData.id,
            submissionDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-dashboard`
        };

        return await this.sendEmail({
            to: userEmail,
            subject: `🎉 Proposal Submitted Successfully - CEDO`,
            template: 'proposal-submitted',
            data,
            userId,
            proposalId,
            metadata: {
                type: 'proposal_submitted',
                userEmail,
                userName,
                proposalData
            }
        });
    }

    /**
     * Send proposal approved notification with SMTP logging
     */
    async sendProposalApprovedNotification({ userEmail, userName, proposalData, userId = null, proposalId = null }) {
        const data = {
            userName,
            eventName: proposalData.event_name || proposalData.eventName,
            eventDate: proposalData.event_start_date || proposalData.startDate,
            eventVenue: proposalData.event_venue || proposalData.venue,
            proposalId: proposalData.uuid || proposalData.id,
            approvalDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-dashboard`
        };

        return await this.sendEmail({
            to: userEmail,
            subject: `✅ Proposal Approved - CEDO`,
            template: 'proposal-approved',
            data,
            userId,
            proposalId,
            metadata: {
                type: 'proposal_approved',
                userEmail,
                userName,
                proposalData
            }
        });
    }

    /**
     * Send proposal rejected notification with SMTP logging
     */
    async sendProposalRejectedNotification({ userEmail, userName, proposalData, rejectionReason, userId = null, proposalId = null }) {
        const data = {
            userName,
            eventName: proposalData.event_name || proposalData.eventName,
            eventDate: proposalData.event_start_date || proposalData.startDate,
            eventVenue: proposalData.event_venue || proposalData.venue,
            proposalId: proposalData.uuid || proposalData.id,
            rejectionReason: rejectionReason || 'Please review the feedback and resubmit with the requested changes.',
            rejectionDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-dashboard`
        };

        return await this.sendEmail({
            to: userEmail,
            subject: `❌ Proposal Not Approved - CEDO`,
            template: 'proposal-rejected',
            data,
            userId,
            proposalId,
            metadata: {
                type: 'proposal_rejected',
                userEmail,
                userName,
                proposalData,
                rejectionReason
            }
        });
    }

    /**
     * Get email logs from email_smtp_logs table
     */
    async getEmailLogs(userId = null, limit = 50) {
        try {
            let query = `
                SELECT 
                    id, uuid, from_email, to_email, subject, status, delivery_status,
                    created_at, sent_at, delivery_timestamp, delivery_error,
                    user_id, proposal_id, template_name
                FROM email_smtp_logs 
            `;
            const values = [];
            let paramIndex = 1;

            if (userId) {
                query += ` WHERE user_id = $${paramIndex}`;
                values.push(userId);
                paramIndex++;
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
            values.push(limit);

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get email logs:', error);
            throw error;
        }
    }

    /**
     * Get email statistics from email_smtp_logs table
     */
    async getEmailStatistics(days = 30) {
        try {
            const result = await pool.query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days' THEN 1 END) as recent_count
                FROM email_smtp_logs 
                WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
                GROUP BY status
                ORDER BY count DESC
            `);

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get email statistics:', error);
            throw error;
        }
    }

    /**
     * Create default email templates
     */
    async createDefaultTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/email');
            await fs.mkdir(templatesDir, { recursive: true });

            // Create proposal-submitted template
            const proposalSubmittedTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposal Submitted - CEDO</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5aa0;">🎉 Proposal Submitted Successfully!</h2>
        <p>Dear {{userName}},</p>
        <p>Your proposal has been successfully submitted for review.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Proposal Details:</h3>
            <p><strong>Event Name:</strong> {{eventName}}</p>
            <p><strong>Event Date:</strong> {{eventDate}}</p>
            <p><strong>Event Venue:</p>
            <p><strong>Proposal ID:</strong> {{proposalId}}</p>
            <p><strong>Submission Date:</strong> {{submissionDate}}</p>
        </div>
        
        <p>You can track your proposal status by visiting your dashboard:</p>
        <p><a href="{{dashboardUrl}}" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
        
        <p>Thank you for your submission!</p>
        <p>Best regards,<br>CEDO Partnership Management Team</p>
    </div>
</body>
</html>`;

            await fs.writeFile(path.join(templatesDir, 'proposal-submitted.html'), proposalSubmittedTemplate);
            console.log('✅ Created default email templates');

        } catch (error) {
            console.error('❌ Failed to create default templates:', error.message);
        }
    }
}

module.exports = new UpdatedEmailService();
