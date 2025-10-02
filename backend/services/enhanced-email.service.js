/**
 * Enhanced Email Service with SMTP Logging
 * Purpose: Handle all email notifications with comprehensive SMTP logging
 * Key approaches: Modular design, template-based emails, error handling, SMTP logging
 * Refactor: Centralized email service with email tracking and delivery status
 */

// Load environment variables
require('dotenv').config();

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const emailLoggingService = require('./email-logging.service');

class EnhancedEmailService {
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

            console.log('✅ Email service initialized successfully');
            console.log(`📧 SMTP configured for: ${emailUser}`);

            // Load email templates
            await this.loadEmailTemplates();

        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
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
     * Send email using template with comprehensive logging
     */
    async sendEmail({
        to,
        subject,
        template,
        data = {},
        attachments = [],
        notificationId = null,
        proposalId = null,
        userId = null,
        metadata = {}
    }) {
        let emailLogId = null;

        try {
            // Log email attempt before sending
            const emailLog = await emailLoggingService.logEmailAttempt({
                fromEmail: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER,
                toEmail: to,
                subject,
                bodyHtml: null, // Will be set after template processing
                bodyText: null, // Will be set after template processing
                smtpServer: 'smtp.gmail.com',
                smtpPort: 587,
                smtpSecure: false,
                smtpAuthUser: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER,
                notificationId,
                proposalId,
                userId,
                templateName: template,
                metadata,
                attachments,
                headers: {}
            });

            emailLogId = emailLog.id;

            if (!this.isInitialized) {
                console.warn('⚠️ Email service not initialized. Email will not be sent.');
                console.warn('💡 To enable email notifications, set EMAIL_USER and EMAIL_PASSWORD environment variables.');

                await emailLoggingService.updateEmailStatus(emailLogId, 'failed', null, 'Email service not initialized');

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
            await emailLoggingService.updateEmailStatus(emailLogId, 'pending', null, null);

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
            await emailLoggingService.updateEmailStatus(emailLogId, 'sent', result.messageId);

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
                await emailLoggingService.updateEmailStatus(emailLogId, 'failed', null, error.message);
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
     * Send proposal submitted notification with logging
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
            subject: `Proposal Submitted: ${data.eventName}`,
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
     * Send proposal approved notification with logging
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
            subject: `Proposal Approved: ${data.eventName}`,
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
     * Send proposal rejected notification with logging
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
            subject: `Proposal Not Approved: ${data.eventName}`,
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
     * Get email statistics
     */
    async getEmailStatistics(days = 30) {
        return await emailLoggingService.getEmailStatistics(days);
    }

    /**
     * Get user email logs
     */
    async getUserEmailLogs(userId, limit = 50) {
        return await emailLoggingService.getUserEmailLogs(userId, limit);
    }

    /**
     * Get proposal email logs
     */
    async getProposalEmailLogs(proposalId, limit = 50) {
        return await emailLoggingService.getProposalEmailLogs(proposalId, limit);
    }

    /**
     * Clean up old email logs
     */
    async cleanupOldLogs(days = 90) {
        return await emailLoggingService.cleanupOldLogs(days);
    }
}

module.exports = new EnhancedEmailService();
