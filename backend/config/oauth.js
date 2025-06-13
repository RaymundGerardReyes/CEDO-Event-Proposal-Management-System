const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./db');
const crypto = require('crypto');

// Check if OAuth is properly configured
const isOAuthConfigured = () => {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Development-friendly OAuth configuration
const OAUTH_CONFIG = {
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID || 'development-placeholder-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'development-placeholder-secret',
        callbackURL: `${process.env.BASE_URL || 'http://localhost:5000'}/auth/google/callback`,
        scope: ['profile', 'email'],
        // Security enhancements
        passReqToCallback: true,
        state: true // Enable CSRF protection
    }
};

// Enhanced security: Generate secure state parameter for CSRF protection
const generateSecureState = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Enhanced security: Validate state parameter
const validateState = (sessionState, receivedState) => {
    return sessionState && receivedState && sessionState === receivedState;
};

// Only initialize Google Strategy if OAuth is properly configured
if (isOAuthConfigured()) {
    console.log('✅ Google OAuth configured - initializing strategy');

    // Google OAuth Strategy with comprehensive security
    passport.use(new GoogleStrategy({
        clientID: OAUTH_CONFIG.google.clientID,
        clientSecret: OAUTH_CONFIG.google.clientSecret,
        callbackURL: OAUTH_CONFIG.google.callbackURL,
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        console.log('\n=== Google OAuth Strategy Callback ===');
        console.log('Profile ID:', profile.id);
        console.log('Profile Email:', profile.emails?.[0]?.value);
        console.log('Profile Name:', profile.displayName);

        try {
            // Validate state parameter for CSRF protection
            const sessionState = req.session?.oauthState;
            const receivedState = req.query?.state;

            if (!validateState(sessionState, receivedState)) {
                console.error('OAuth State validation failed - potential CSRF attack');
                return done(new Error('Invalid state parameter - security validation failed'), null);
            }

            // Clear the state from session after validation
            if (req.session) {
                delete req.session.oauthState;
            }

            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;
            const picture = profile.photos?.[0]?.value;
            const emailVerified = profile.emails?.[0]?.verified || false;

            if (!email) {
                console.error('Google OAuth: No email provided in profile');
                return done(new Error('No email provided by Google'), null);
            }

            // Check if email is verified (security requirement)
            if (!emailVerified && process.env.REQUIRE_GOOGLE_EMAIL_VERIFIED === 'true') {
                console.error('Google OAuth: Email not verified');
                return done(new Error('Google email not verified'), null);
            }

            // Check for existing user by Google ID
            let [users] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
            let user = users[0];

            if (!user) {
                // Check for existing user by email
                [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
                user = users[0];

                if (user) {
                    // Link Google ID to existing user
                    console.log(`Linking Google ID ${googleId} to existing user ${user.id}`);
                    await pool.query(
                        'UPDATE users SET google_id = ?, name = COALESCE(?, name), avatar = COALESCE(?, avatar), updated_at = NOW() WHERE id = ?',
                        [googleId, name, picture, user.id]
                    );

                    // Fetch updated user
                    [users] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
                    user = users[0];
                } else {
                    // Security: Only allow pre-approved users to sign in
                    // Do not create new users automatically
                    console.log(`User ${email} not found in system - rejecting OAuth login`);
                    return done(new Error('Account not found. Please contact an administrator.'), null);
                }
            } else {
                // Update existing Google user profile if needed
                const needsUpdate = (name && user.name !== name) || (picture && user.avatar !== picture);

                if (needsUpdate) {
                    console.log(`Updating profile for user ${user.id}`);
                    await pool.query(
                        'UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), updated_at = NOW() WHERE id = ?',
                        [name, picture, user.id]
                    );

                    // Fetch updated user
                    [users] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
                    user = users[0];
                }
            }

            // Check if user is approved
            if (!user.is_approved) {
                console.log(`User ${user.id} (${email}) is not approved`);
                return done(new Error('Account pending approval'), null);
            }

            console.log(`Google OAuth successful for user ${user.id} (${email})`);
            return done(null, user);

        } catch (error) {
            console.error('Google OAuth Strategy Error:', error);
            return done(error, null);
        }
    }));
} else {
    console.log('⚠️  Google OAuth not configured - OAuth routes will return errors');
    console.log('📋 To enable Google OAuth:');
    console.log('   Add to your .env file:');
    console.log('   GOOGLE_CLIENT_ID=your-client-id');
    console.log('   GOOGLE_CLIENT_SECRET=your-client-secret');
}

// Passport session management
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user:', id);
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        const user = users[0];

        if (!user) {
            return done(new Error('User not found'), null);
        }

        done(null, user);
    } catch (error) {
        console.error('Deserialize user error:', error);
        done(error, null);
    }
});

module.exports = {
    passport,
    OAUTH_CONFIG,
    generateSecureState,
    validateState
}; 