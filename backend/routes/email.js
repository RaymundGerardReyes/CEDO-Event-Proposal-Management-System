/**
 * Email API Routes for CEDO Proposal Management System
 * Purpose: Handle email notifications and SMTP operations
 * Key approaches: RESTful API design, error handling, authentication
 * Refactor: Centralized email operations with proper validation
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
const { validateToken } = require('../middleware/auth');

/**
 * POST /api/email/test
 * Test email configuration
 */
router.post('/test', validateToken, async (req, res) => {
    try {
        console.log('🧪 Testing email configuration...');

        const result = await emailService.testEmailConfiguration();

        if (result.success) {
            res.json({
                success: true,
                message: 'Email configuration is working',
                details: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Email configuration failed',
                error: result.message
            });
        }
    } catch (error) {
        console.error('❌ Email test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration',
            error: error.message
        });
    }
});

/**
 * POST /api/email/send-proposal-notification
 * Send proposal submitted notification
 */
router.post('/send-proposal-notification', validateToken, async (req, res) => {
    try {
        const { userEmail, userName, proposalData } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !proposalData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userEmail, userName, proposalData'
            });
        }

        console.log(`📧 Sending proposal notification to ${userEmail}`);

        const numericProposalId = Number(proposalData?.id);
        const result = await emailService.sendProposalSubmittedNotification({
            userEmail,
            userName,
            proposalData,
            userId: req.user?.userId || null,
            proposalId: Number.isFinite(numericProposalId) ? numericProposalId : null
        });

        if (result.demo) {
            res.json({
                success: false,
                message: 'Email service not configured. Email was not sent.',
                demo: true,
                data: result
            });
        } else {
            res.json({
                success: true,
                message: 'Proposal notification sent successfully',
                data: result
            });
        }

    } catch (error) {
        console.error('❌ Failed to send proposal notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send proposal notification',
            error: error.message
        });
    }
});

/**
 * POST /api/email/send-approval-notification
 * Send proposal approved notification
 */
router.post('/send-approval-notification', validateToken, async (req, res) => {
    try {
        const { userEmail, userName, proposalData } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !proposalData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userEmail, userName, proposalData'
            });
        }

        console.log(`✅ Sending approval notification to ${userEmail}`);

        const numericProposalId = Number(proposalData?.id);
        const result = await emailService.sendProposalApprovedNotification({
            userEmail,
            userName,
            proposalData,
            userId: req.user?.userId || null,
            proposalId: Number.isFinite(numericProposalId) ? numericProposalId : null
        });

        if (result.demo) {
            res.json({
                success: false,
                message: 'Email service not configured. Email was not sent.',
                demo: true,
                data: result
            });
        } else {
            res.json({
                success: true,
                message: 'Approval notification sent successfully',
                data: result
            });
        }

    } catch (error) {
        console.error('❌ Failed to send approval notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send approval notification',
            error: error.message
        });
    }
});

/**
 * POST /api/email/send-rejection-notification
 * Send proposal rejected notification
 */
router.post('/send-rejection-notification', validateToken, async (req, res) => {
    try {
        const { userEmail, userName, proposalData, adminComments } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !proposalData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userEmail, userName, proposalData'
            });
        }

        console.log(`❌ Sending rejection notification to ${userEmail}`);

        const numericProposalId = Number(proposalData?.id);
        const result = await emailService.sendProposalRejectedNotification({
            userEmail,
            userName,
            proposalData,
            adminComments,
            userId: req.user?.userId || null,
            proposalId: Number.isFinite(numericProposalId) ? numericProposalId : null
        });

        if (result.demo) {
            res.json({
                success: false,
                message: 'Email service not configured. Email was not sent.',
                demo: true,
                data: result
            });
        } else {
            res.json({
                success: true,
                message: 'Rejection notification sent successfully',
                data: result
            });
        }

    } catch (error) {
        console.error('❌ Failed to send rejection notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send rejection notification',
            error: error.message
        });
    }
});

/**
 * POST /api/email/send-custom
 * Send custom email
 */
router.post('/send-custom', validateToken, async (req, res) => {
    try {
        const { to, subject, html, attachments } = req.body;

        // Validate required fields
        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: to, subject, html'
            });
        }

        console.log(`📧 Sending custom email to ${to}`);

        const result = await emailService.sendCustomEmail({
            to,
            subject,
            html,
            attachments
        });

        res.json({
            success: true,
            message: 'Custom email sent successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Failed to send custom email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send custom email',
            error: error.message
        });
    }
});

/**
 * POST /api/email/send-proposal-approved
 * Send proposal approved notification
 */
router.post('/send-proposal-approved', validateToken, async (req, res) => {
    try {
        const { userEmail, userName, proposalData } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !proposalData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userEmail, userName, proposalData'
            });
        }

        console.log(`📧 Sending proposal approved notification to ${userEmail}`);

        const result = await emailService.sendProposalApprovedNotification({
            userEmail,
            userName,
            proposalData
        });

        res.json({
            success: true,
            message: 'Proposal approved notification sent successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Failed to send proposal approved notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send proposal approved notification',
            error: error.message
        });
    }
});

/**
 * POST /api/email/send-proposal-rejected
 * Send proposal rejected notification
 */
router.post('/send-proposal-rejected', validateToken, async (req, res) => {
    try {
        const { userEmail, userName, proposalData, adminComments } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !proposalData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userEmail, userName, proposalData'
            });
        }

        console.log(`📧 Sending proposal rejected notification to ${userEmail}`);

        const result = await emailService.sendProposalRejectedNotification({
            userEmail,
            userName,
            proposalData,
            adminComments
        });

        res.json({
            success: true,
            message: 'Proposal rejected notification sent successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Failed to send proposal rejected notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send proposal rejected notification',
            error: error.message
        });
    }
});

/**
 * GET /api/email/status
 * Get email service status
 */
router.get('/status', validateToken, async (req, res) => {
    try {
        const isInitialized = emailService.isInitialized;
        const templateCount = emailService.templates.size;

        res.json({
            success: true,
            data: {
                initialized: isInitialized,
                templateCount,
                smtp: 'gmail',
                user: process.env.EMAIL_USER || process.env.GOOGLE_EMAIL_USER
            }
        });
    } catch (error) {
        console.error('❌ Failed to get email status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get email status',
            error: error.message
        });
    }
});

module.exports = router;
