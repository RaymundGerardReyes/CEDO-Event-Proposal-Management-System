/**
 * Email Service for CEDO Proposal Management System
 * Purpose: Handle all email notifications using Google SMTP
 * Key approaches: Modular design, template-based emails, error handling
 * Refactor: Centralized email service with reusable components
 */

// Load environment variables
require('dotenv').config();

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const emailLoggingService = require('./email-logging.service');

class EmailService {
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
            // Check if email credentials are available
            const emailUser = process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER;
            const emailPassword = process.env.EMAIL_PASSWORD || process.env.GOOGLE_APP_PASSWORD;

            if (!emailUser || !emailPassword) {
                console.warn('⚠️ Email credentials not found. Email service will run in demo mode.');
                console.warn('💡 To enable email notifications, set EMAIL_USER and EMAIL_PASSWORD environment variables.');
                this.isInitialized = false;
                return;
            }

            // Create transporter with Google SMTP configuration
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: emailUser,
                    pass: emailPassword
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection configuration
            await this.transporter.verify();
            this.isInitialized = true;

            console.log('✅ Email service initialized successfully');
            console.log(`📧 SMTP configured for: ${emailUser}`);

            // Load email templates
            await this.loadTemplates();

        } catch (error) {
            console.error('❌ Email service initialization failed:', error.message);
            console.warn('⚠️ Email service will run in demo mode without email capabilities.');
            this.isInitialized = false;
            // Don't throw error, just log it and continue
        }
    }

    /**
     * Load email templates from templates directory
     */
    async loadTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/email');

            // Check if templates directory exists
            try {
                await fs.access(templatesDir);
            } catch {
                console.warn('⚠️ Email templates directory not found, creating default templates');
                await this.createDefaultTemplates();
                return;
            }

            // Load template files
            const templateFiles = await fs.readdir(templatesDir);

            for (const file of templateFiles) {
                if (file.endsWith('.html') || file.endsWith('.txt')) {
                    const templateName = path.basename(file, path.extname(file));
                    const templatePath = path.join(templatesDir, file);
                    const content = await fs.readFile(templatePath, 'utf8');

                    this.templates.set(templateName, {
                        content,
                        type: path.extname(file).substring(1)
                    });

                    console.log(`📄 Loaded email template: ${templateName}`);
                }
            }

            console.log(`✅ Loaded ${this.templates.size} email templates`);

        } catch (error) {
            console.error('❌ Failed to load email templates:', error.message);
            await this.createDefaultTemplates();
        }
    }

    /**
     * Create default email templates if none exist
     */
    async createDefaultTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/email');
            await fs.mkdir(templatesDir, { recursive: true });

            // Proposal submitted template
            const proposalSubmittedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposal Submitted - CEDO</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Proposal Submitted Successfully!</h1>
        </div>
        <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>Your proposal "<strong>{{eventName}}</strong>" has been successfully submitted for review.</p>
            
            <h3>📋 Submission Details:</h3>
            <ul>
                <li><strong>Event Name:</strong> {{eventName}}</li>
                <li><strong>Event Date:</strong> {{eventDate}}</li>
                <li><strong>Event Venue:</strong> {{eventVenue}}</li>
                <li><strong>Proposal ID:</strong> {{proposalId}}</li>
                <li><strong>Submitted:</strong> {{submissionDate}}</li>
            </ul>
            
            <h3>⏳ What's Next?</h3>
            <p>Your proposal is now under review by the CEDO team. You will receive an email notification once the review is complete.</p>
            
            <p><strong>Review Timeline:</strong> Most proposals are reviewed within 3-5 business days.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardUrl}}" class="button">View Proposal Status</a>
            </div>
        </div>
        <div class="footer">
            <p>Best regards,<br>The CEDO Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
    </div>
</body>
</html>`;

            // Proposal approved template
            const proposalApprovedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposal Approved - CEDO</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f0fdf4; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Proposal Approved!</h1>
        </div>
        <div class="content">
            <h2>Congratulations {{userName}}!</h2>
            <p>Your proposal "<strong>{{eventName}}</strong>" has been approved by the CEDO team.</p>
            
            <h3>🎯 Approval Details:</h3>
            <ul>
                <li><strong>Event Name:</strong> {{eventName}}</li>
                <li><strong>Event Date:</strong> {{eventDate}}</li>
                <li><strong>Event Venue:</strong> {{eventVenue}}</li>
                <li><strong>Proposal ID:</strong> {{proposalId}}</li>
                <li><strong>Approved:</strong> {{approvalDate}}</li>
            </ul>
            
            <h3>📝 Next Steps:</h3>
            <p>You can now proceed to submit your post-event documentation and accomplishment reports.</p>
            <p><strong>Important:</strong> Submit your post-event documentation within 7 days after your event completion.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reportsUrl}}" class="button">Submit Post-Event Documentation</a>
            </div>
        </div>
        <div class="footer">
            <p>Best regards,<br>The CEDO Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
    </div>
</body>
</html>`;

            // Proposal rejected template
            const proposalRejectedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposal Not Approved - CEDO</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #fef2f2; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Proposal Not Approved</h1>
        </div>
        <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>Unfortunately, your proposal "<strong>{{eventName}}</strong>" was not approved by the CEDO team.</p>
            
            <h3>📋 Proposal Details:</h3>
            <ul>
                <li><strong>Event Name:</strong> {{eventName}}</li>
                <li><strong>Event Date:</strong> {{eventDate}}</li>
                <li><strong>Event Venue:</strong> {{eventVenue}}</li>
                <li><strong>Proposal ID:</strong> {{proposalId}}</li>
                <li><strong>Reviewed:</strong> {{reviewDate}}</li>
            </ul>
            
            <h3>💬 Feedback:</h3>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                {{adminComments}}
            </div>
            
            <h3>🔄 Next Steps:</h3>
            <p>You can review the feedback above and make the necessary changes to your proposal before resubmitting.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{editUrl}}" class="button">Edit & Resubmit Proposal</a>
            </div>
        </div>
        <div class="footer">
            <p>Best regards,<br>The CEDO Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
    </div>
</body>
</html>`;

            // Save templates
            await fs.writeFile(path.join(templatesDir, 'proposal-submitted.html'), proposalSubmittedHtml);
            await fs.writeFile(path.join(templatesDir, 'proposal-approved.html'), proposalApprovedHtml);
            await fs.writeFile(path.join(templatesDir, 'proposal-rejected.html'), proposalRejectedHtml);

            console.log('✅ Created default email templates');

        } catch (error) {
            console.error('❌ Failed to create default templates:', error.message);
        }
    }

    /**
     * Send email using template with SMTP logging to email_smtp_logs
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
            const textContent = htmlContent
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // Log attempt in email_smtp_logs (status: pending)
            try {
                const smtpHost = this.isInitialized ? (this.transporter?.options?.host || 'smtp.gmail.com') : null;
                const smtpPort = this.isInitialized ? (this.transporter?.options?.port || 587) : null;
                const smtpSecure = this.isInitialized ? !!this.transporter?.options?.secure : false;
                const smtpUser = this.isInitialized ? (this.transporter?.options?.auth?.user || (process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER)) : (process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER);

                const logged = await emailLoggingService.logEmailAttempt({
                    fromEmail: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER,
                    toEmail: to,
                    subject,
                    bodyHtml: htmlContent,
                    bodyText: textContent,
                    smtpServer: smtpHost,
                    smtpPort,
                    smtpSecure,
                    smtpAuthUser: smtpUser,
                    notificationId,
                    proposalId,
                    userId,
                    templateName: template,
                    metadata,
                    attachments,
                    headers: {}
                });
                emailLogId = logged.id;
            } catch (logErr) {
                console.warn('⚠️ Failed to log email attempt:', logErr.message);
            }

            if (!this.isInitialized) {
                console.warn('⚠️ Email service not initialized. Email will not be sent.');
                console.warn('💡 To enable email notifications, set EMAIL_USER and EMAIL_PASSWORD environment variables.');
                if (emailLogId) {
                    await emailLoggingService.updateEmailStatus(emailLogId, 'failed', null, 'Email service not initialized');
                }
                return {
                    success: false,
                    message: 'Email service not initialized. Please configure email credentials.',
                    demo: true,
                    emailLogId
                };
            }

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

            console.log(`✅ Email sent successfully to ${to}`);
            console.log(`📧 Message ID: ${result.messageId}`);
            if (emailLogId) {
                await emailLoggingService.updateEmailStatus(emailLogId, 'sent', result.messageId);
            }

            return {
                success: true,
                messageId: result.messageId,
                emailLogId,
                to,
                subject
            };

        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
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
     * Send proposal submitted notification
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
            subject: '🎉 Proposal Submitted Successfully - CEDO',
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
     * Send proposal approved notification
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
            reportsUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-dashboard/reports`
        };

        return await this.sendEmail({
            to: userEmail,
            subject: '✅ Proposal Approved - CEDO',
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
     * Send proposal rejected notification
     */
    async sendProposalRejectedNotification({ userEmail, userName, proposalData, adminComments, userId = null, proposalId = null }) {
        const data = {
            userName,
            eventName: proposalData.event_name || proposalData.eventName,
            eventDate: proposalData.event_start_date || proposalData.startDate,
            eventVenue: proposalData.event_venue || proposalData.venue,
            proposalId: proposalData.uuid || proposalData.id,
            reviewDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            adminComments: adminComments || 'No specific feedback provided.',
            editUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-dashboard/submit-event`
        };

        return await this.sendEmail({
            to: userEmail,
            subject: '❌ Proposal Not Approved - CEDO',
            template: 'proposal-rejected',
            data,
            userId,
            proposalId,
            metadata: {
                type: 'proposal_rejected',
                userEmail,
                userName,
                proposalData,
                adminComments
            }
        });
    }

    /**
     * Send custom email
     */
    async sendCustomEmail({ to, subject, html, attachments = [] }) {
        return await this.sendEmail({
            to,
            subject,
            template: 'custom',
            data: { content: html },
            attachments
        });
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        if (!this.isInitialized) {
            throw new Error('Email service not initialized');
        }

        try {
            const testResult = await this.transporter.verify();
            return {
                success: true,
                message: 'Email configuration is valid',
                smtp: 'gmail',
                user: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error.code
            };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
