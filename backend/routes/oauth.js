// backend/routes/oauth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { passport, generateSecureState } = require('../config/oauth');
const sessionManager = require('../middleware/session');
const { verifyGoogleToken } = require('../utils/googleAuth');
const ROLES = require('../constants/roles');

// Check if OAuth is configured
const isOAuthConfigured = () => {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Role access configuration
const roleAccess = {
    [ROLES.HEAD_ADMIN]: {
        dashboard: "/admin-dashboard",
        permissions: [
            "view_all_users",
            "manage_users",
            "view_all_requests",
            "manage_system",
            "approve_students",
            "view_all_proposals",
            "manage_all_proposals",
            "assign_reviewers",
            "manage_reviews",
        ],
    },
    [ROLES.MANAGER]: {
        dashboard: "/admin-dashboard",
        permissions: [
            "view_student_requests",
            "manage_student_requests",
            "view_own_profile",
            "approve_students",
            "view_all_proposals",
            "manage_all_proposals",
            "assign_reviewers",
            "manage_reviews",
        ],
    },
    [ROLES.STUDENT]: {
        dashboard: "/student-dashboard",
        permissions: ["view_own_profile", "submit_requests", "view_own_requests"],
    },
    [ROLES.PARTNER]: {
        dashboard: "/student-dashboard",
        permissions: ["view_own_profile", "submit_requests", "view_own_requests"],
    },
    [ROLES.REVIEWER]: {
        dashboard: "/admin-dashboard",
        permissions: ["view_all_proposals", "view_assigned_proposals", "submit_reviews"],
    },
};

/**
 * Google OAuth initiation route with CSRF protection
 * GET /auth/google
 */
router.get('/google', (req, res, next) => {
    console.log('\n=== Google OAuth Initiation ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Client IP:', req.ip);
    console.log('User Agent:', req.get('User-Agent'));

    // Check if OAuth is configured
    if (!isOAuthConfigured()) {
        console.error('Google OAuth not configured');
        return res.status(500).json({
            error: 'OAuth not configured',
            message: 'Google OAuth credentials not set up. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
            configured: false
        });
    }

    try {
        // Generate and store secure state parameter for CSRF protection
        const state = generateSecureState();

        // Store state in session for validation
        if (!req.session) {
            console.error('Session not available - OAuth cannot proceed');
            return res.status(500).json({
                error: 'Session configuration error',
                message: 'Unable to initiate OAuth flow'
            });
        }

        req.session.oauthState = state;

        // Store the frontend redirect URL if provided
        const redirectUrl = req.query.redirect_url || process.env.FRONTEND_URL || 'http://localhost:3000';
        req.session.oauthRedirectUrl = redirectUrl;

        console.log('Generated OAuth state:', state.substring(0, 8) + '...');
        console.log('Stored redirect URL:', redirectUrl);

        // Initiate Google OAuth with state parameter
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: state,
            // Additional security options
            accessType: 'offline', // For refresh tokens if needed
            prompt: 'select_account' // Allow user to choose account
        })(req, res, next);

    } catch (error) {
        console.error('OAuth initiation error:', error);
        res.status(500).json({
            error: 'OAuth initiation failed',
            message: 'Unable to start OAuth flow'
        });
    }
});

/**
 * Google OAuth callback route with comprehensive error handling
 * GET /auth/google/callback
 */
router.get('/google/callback', (req, res, next) => {
    console.log('\n=== Google OAuth Callback ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Query params:', req.query);

    // Handle OAuth errors from Google
    if (req.query.error) {
        console.error('OAuth error from Google:', req.query.error);
        const frontendUrl = req.session?.oauthRedirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

        // Clear session data
        if (req.session) {
            delete req.session.oauthState;
            delete req.session.oauthRedirectUrl;
        }

        return res.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(req.query.error)}&description=${encodeURIComponent(req.query.error_description || 'OAuth authentication failed')}`);
    }

    // Use Passport to handle the callback
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/auth/oauth/failure'
    })(req, res, async (err) => {
        try {
            if (err) {
                console.error('OAuth authentication error:', err.message);
                const frontendUrl = req.session?.oauthRedirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

                // Clear session data
                if (req.session) {
                    delete req.session.oauthState;
                    delete req.session.oauthRedirectUrl;
                }

                // Redirect with specific error messages
                let errorCode = 'OAUTH_ERROR';
                let errorMessage = 'Authentication failed';

                if (err.message.includes('not found') || err.message.includes('not approved')) {
                    errorCode = 'ACCOUNT_NOT_FOUND';
                    errorMessage = 'Account not found or not approved';
                } else if (err.message.includes('email not verified')) {
                    errorCode = 'EMAIL_NOT_VERIFIED';
                    errorMessage = 'Google email not verified';
                } else if (err.message.includes('security validation failed')) {
                    errorCode = 'SECURITY_ERROR';
                    errorMessage = 'Security validation failed';
                }

                return res.redirect(`${frontendUrl}/auth/error?error=${errorCode}&message=${encodeURIComponent(errorMessage)}`);
            }

            if (!req.user) {
                console.error('No user returned from OAuth');
                const frontendUrl = req.session?.oauthRedirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

                // Clear session data
                if (req.session) {
                    delete req.session.oauthState;
                    delete req.session.oauthRedirectUrl;
                }

                return res.redirect(`${frontendUrl}/auth/error?error=NO_USER&message=${encodeURIComponent('Authentication completed but no user data received')}`);
            }

            const user = req.user;
            console.log(`OAuth successful for user ${user.id} (${user.email})`);

            // Generate JWT token
            const token = sessionManager.generateToken(user);

            // Log access
            await sessionManager.logAccess(user.id, user.role, 'google_oauth');

            // Get redirect URL from session
            const frontendUrl = req.session?.oauthRedirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

            // Clear session data
            if (req.session) {
                delete req.session.oauthState;
                delete req.session.oauthRedirectUrl;
            }

            // Set secure HTTP-only cookie with JWT
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/'
            };

            res.cookie('auth_token', token, cookieOptions);

            // Redirect to frontend with success status
            const dashboardUrl = roleAccess[user.role]?.dashboard || '/dashboard';
            res.redirect(`${frontendUrl}/auth/success?redirect=${encodeURIComponent(dashboardUrl)}`);

        } catch (error) {
            console.error('OAuth callback processing error:', error);
            const frontendUrl = req.session?.oauthRedirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

            // Clear session data
            if (req.session) {
                delete req.session.oauthState;
                delete req.session.oauthRedirectUrl;
            }

            res.redirect(`${frontendUrl}/auth/error?error=PROCESSING_ERROR&message=${encodeURIComponent('Authentication processing failed')}`);
        }
    });
});

/**
 * OAuth failure route
 * GET /auth/oauth/failure
 */
router.get('/failure', (req, res) => {
    console.log('\n=== OAuth Failure Route ===');
    console.log('Timestamp:', new Date().toISOString());

    const frontendUrl = req.session?.oauthRedirectUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

    // Clear session data
    if (req.session) {
        delete req.session.oauthState;
        delete req.session.oauthRedirectUrl;
    }

    res.redirect(`${frontendUrl}/auth/error?error=OAUTH_FAILURE&message=${encodeURIComponent('OAuth authentication failed')}`);
});

/**
 * Get current user info from token (for frontend state management)
 * GET /auth/oauth/me
 */
router.get('/me', async (req, res) => {
    try {
        // Check for token in cookies or Authorization header
        let token = req.cookies?.auth_token;

        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                error: 'No authentication token',
                message: 'Please sign in'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_DEV);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Token does not contain user ID'
            });
        }

        // Get current user from database
        const { pool, query } = require('../config/database');
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        if (!user.is_approved) {
            return res.status(403).json({
                error: 'Account not approved',
                message: 'Account pending approval'
            });
        }

        // Return user info
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                organization_type: user.organization_type,
                avatar: user.avatar,
                is_approved: Boolean(user.is_approved),
                google_id: user.google_id,
                dashboard: roleAccess[user.role]?.dashboard,
                permissions: roleAccess[user.role]?.permissions,
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please sign in again'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Please sign in again'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Unable to verify authentication'
        });
    }
});

/**
 * OAuth logout route
 * POST /auth/oauth/logout
 */
router.post('/logout', (req, res) => {
    console.log('\n=== OAuth Logout ===');
    console.log('Timestamp:', new Date().toISOString());

    try {
        // Clear the auth cookie
        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        // Clear session if exists
        if (req.session) {
            if (typeof req.session.destroy === 'function') {
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Session destruction error:', err);
                    }
                });
            } else {
                // Fallback: just clear the session object
                req.session = null;
            }
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'Unable to complete logout'
        });
    }
});

router.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        const payload = await verifyGoogleToken(token);

        // Check if user exists in your database or create a new one
        const user = await findOrCreateUser(payload);

        // Generate a JWT token for session management
        const authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ authToken, user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

module.exports = router; 