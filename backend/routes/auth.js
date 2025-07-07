// backend/routes/auth.js

const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
// const jwt = require("jsonwebtoken") // Not directly used here for /google route
const { pool } = require("../config/db")
const authMiddleware = require("../middleware/auth")
// const checkRole = require("../middleware/roles") // Not directly used here for /google route
// const axios = require("axios") // Not directly used here for /google route
// const validate = require("../middleware/validation") // Not directly used here for /google route
const sessionManager = require("../middleware/session")
// const { OAuth2Client } = require("google-auth-library") // Client is initialized in verifyGoogleToken
const { verifyGoogleToken } = require("../utils/googleAuth")
const { createAssessment } = require('../utils/recaptchaAssessment');
const { verifyRecaptchaToken } = require('../utils/recaptcha');

const ROLES = {
  STUDENT: "student",
  HEAD_ADMIN: "head_admin",
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer",
}

const roleAccess = {
  [ROLES.STUDENT]: {
    dashboard: "/student-dashboard",
    permissions: ["view_own_profile", "submit_requests", "view_own_requests"],
  },
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
  [ROLES.PARTNER]: {
    dashboard: "/student-dashboard",
    permissions: ["view_own_profile", "submit_requests", "view_own_requests"],
  },
  [ROLES.REVIEWER]: {
    dashboard: "/admin-dashboard",
    permissions: ["view_all_proposals", "view_assigned_proposals", "submit_reviews"],
  },
}

// GOOGLE_CLIENT_ID_BACKEND is used by utils/googleAuth.js, ensure it's set in your .env
// We'll log its presence within the route for clarity during requests.
if (!process.env.GOOGLE_CLIENT_ID_BACKEND) {
  console.error("FATAL ERROR: GOOGLE_CLIENT_ID_BACKEND not defined in environment variables. Google Sign-In will not function.")
}
if (!process.env.JWT_SECRET_DEV) {
  console.error("FATAL ERROR: JWT_SECRET_DEV not defined in environment variables. Standard login will not function.")
}


// ... (your existing /login, /refresh-token, /logout, /roles, dashboard routes) ...
// Ensure the routes above this are correct and complete as in your original file.
// The change is focused on the /google route below.


// --- Standard Email/Password Login Route ---
router.post('/login', async (req, res, next) => {
  console.log('\n--- Backend /auth/login Endpoint Hit ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  const { email, password, captchaToken: token } = req.body;
  const recaptchaAction = "sign_in";

  if (!email || !password) {
    console.error('Backend [/login] Error: Email or password not provided.');
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Log the received token for debugging
  console.log("Received reCAPTCHA token (aliased as 'token' in backend):", token);

  try {
    const isValid = await verifyRecaptchaToken(token, req.ip);
    if (!isValid) {
      console.error("Invalid reCAPTCHA token received.");
      return res.status(400).json({ message: "Invalid reCAPTCHA token." });
    }

    console.log(`Backend [/login]: Attempting to find user by email: ${email}`);
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      console.warn(`Backend [/login]: No user found with email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Ensure user has a password (e.g., they didn't register via Google only)
    if (!user.password) {
      console.warn(`Backend [/login]: User ${email} found but has no password set. Possibly a Google-only account.`);
      return res.status(401).json({ message: 'Invalid credentials. Try signing in with Google or reset password if applicable.' });
    }

    console.log(`Backend [/login]: User found (ID: ${user.id}). Comparing password...`);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn(`Backend [/login]: Password mismatch for user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log(`Backend [/login]: Password match for user: ${email}. Checking approval status...`);
    if (!user.is_approved) {
      console.warn(`Backend [/login] Authorization Denied: User ${user.id} (Email: ${email}) IS NOT APPROVED.`);
      return res.status(403).json({
        message: "Account pending approval. Please contact an administrator.",
        reason: "USER_NOT_APPROVED",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_approved: Boolean(user.is_approved),
        }
      });
    }

    console.log(`Backend [/login]: User ${user.id} (Email: ${email}) IS APPROVED. Generating app token.`);
    const appToken = sessionManager.generateToken(user); // Use your sessionManager
    await sessionManager.logAccess(user.id, user.role, "email_login");
    console.log(`Backend [/login]: User ${user.id} (Email: ${email}) successfully authenticated via email/password.`);

    res.json({
      token: appToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        organization_type: user.organization_type,
        avatar: user.avatar,
        is_approved: Boolean(user.is_approved),
        google_id: user.google_id, // Include google_id if available
        dashboard: roleAccess[user.role]?.dashboard,
        permissions: roleAccess[user.role]?.permissions,
      },
    });
  } catch (error) {
    console.error(`Backend [/login] Critical Error: Unhandled exception in login process for ${email}:`, error);
    // Pass to the main error handler
    next(error);
  } finally {
    console.log('--- Backend /auth/login Endpoint Finished ---\n');
  }
});


// --- Google Sign-In Route ---
router.post("/google", async (req, res, next) => {
  const idTokenFromFrontend = req.body.token

  console.log('\n--- Backend /auth/google Endpoint Hit ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Received ID Token from Frontend:', idTokenFromFrontend ? `${idTokenFromFrontend.substring(0, 20)}...` : "NOT PROVIDED");

  if (!idTokenFromFrontend) {
    console.error('Backend [/google] Error: No ID token received from frontend.');
    return res.status(400).json({ message: "Google ID token is required" });
  }

  try {
    const googleClientIdForVerification = process.env.GOOGLE_CLIENT_ID_BACKEND;
    console.log('Backend [/google]: Verifying with GOOGLE_CLIENT_ID_BACKEND:', googleClientIdForVerification ? `${googleClientIdForVerification.substring(0, 6)}...` : "NOT SET or NOT VISIBLE HERE");

    if (!googleClientIdForVerification) {
      console.error("Backend [/google] Error: GOOGLE_CLIENT_ID_BACKEND not configured on the server for this route.");
      return res.status(500).json({
        message: "Server configuration error: Google authentication is not properly configured."
      });
    }

    let googlePayload;
    try {
      console.log("Backend [/google]: Attempting to verify Google ID token via verifyGoogleToken util...");
      googlePayload = await verifyGoogleToken(idTokenFromFrontend);
      console.log(`Backend [/google]: Token successfully verified by util. Email: ${googlePayload.email}`);
    } catch (verifyError) {
      console.error("Backend [/google]: verifyGoogleToken util FAILED. Error:", verifyError.message);
      if (verifyError.message.includes("expired") || verifyError.message.includes("Token used too late")) {
        return res.status(401).json({ message: verifyError.message, reason: "TOKEN_EXPIRED_OR_USED_LATE" });
      }
      if (verifyError.message.includes("audience") || verifyError.message.includes("Client ID mismatch")) {
        return res.status(401).json({ message: verifyError.message, reason: "AUDIENCE_MISMATCH_OR_CLIENT_ID_ERROR" });
      }
    }

    const { email, name, picture, sub: googleId, email_verified } = googlePayload;
    console.log(`Backend [/google]: Extracted Payload - Email: ${email}, Name: ${name}, GoogleID: ${googleId}, Verified: ${email_verified}`);

    if (!email_verified && process.env.REQUIRE_GOOGLE_EMAIL_VERIFIED === "true") {
      console.warn(`Backend [/google]: User ${email} attempted sign-in, but Google email not verified (and verification is required).`);
      return res.status(403).json({ message: "Google email not verified. Please verify your email with Google.", reason: "GOOGLE_EMAIL_NOT_VERIFIED" });
    }

    try {
      await pool.query("SELECT 1");
      console.log(`Backend [/google]: Database connection test successful.`);
    } catch (dbError) {
      console.error("Backend [/google] Critical Error: Database connection failed:", dbError.message);
      return res.status(500).json({
        message: "Database connection error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        reason: "DB_CONNECTION_FAILED"
      });
    }

    try {
      console.log(`Backend [/google]: Checking for existing user by Google ID: ${googleId}`);
      let [users] = await pool.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
      let user = users[0];

      // Step 1: Find user by Google ID or Email
      if (!user) {
        console.log(`Backend [/google]: No user found by google_id. Checking by email: ${email}`);
        let [usersByEmail] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        // Step 2: If not found by either, deny access
        if (usersByEmail.length === 0) {
          console.warn(`Backend [/google]: User not found by google_id or email. Access denied.`);
          return res.status(403).json({ reason: "USER_NOT_FOUND", message: "User not found" });
        }

        // Step 3: If found by email, link Google ID and set as current user
        user = usersByEmail[0];
        console.log(`Backend [/google]: Linking google_id ${googleId} to user ${user.id}`);
        await pool.query("UPDATE users SET google_id = ? WHERE id = ?", [googleId, user.id]);
        user.google_id = googleId; // Update in-memory object
      }

      // Step 4: Now that we have a user, check if they are approved
      if (!user.is_approved) {
        console.warn(`Backend [/google] Auth Denied: User ${user.id} is not approved.`);
        return res.status(403).json({ reason: "USER_NOT_APPROVED", message: "User not approved" });
      }

      // Step 5: Update profile if necessary
      if (user.name !== name || user.avatar !== picture) {
        console.log(`Backend [/google]: Profile differences found for user ${user.id}. Updating.`);
        await pool.query("UPDATE users SET name = ?, avatar = ? WHERE id = ?", [name, picture, user.id]);
        // Update in-memory user object
        user.name = name;
        user.avatar = picture;
      }

      console.log(`Backend [/google]: User ${user.id} (Email: ${user.email}) IS APPROVED. Generating app token.`);
      const appToken = sessionManager.generateToken(user);
      await sessionManager.logAccess(user.id, user.role, "google_login");
      console.log(`Backend [/google]: User ${user.id} (Email: ${user.email}) successfully authenticated via Google.`);

      res.json({
        token: appToken,
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
        },
      });

    } catch (dbError) {
      console.error("Backend [/google] DB Error:", dbError.message);
      return res.status(500).json({
        message: "A database error occurred during Google Sign-In.",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      });
    }

  } catch (error) {
    console.error(`Backend [/google] Critical Error: Unhandled exception in Google sign-in for ${email}:`, error);
    next(error);
  } finally {
    console.log('--- Backend /auth/google Endpoint Finished ---\n');
  }
});

/**
 * Logout Endpoint
 * @route POST /auth/logout
 */
router.post('/logout', authMiddleware.validateToken, async (req, res) => {
  console.log('\n--- Backend /auth/logout Endpoint Hit ---');
  console.log('Timestamp:', new Date().toISOString());
  try {
    const userId = req.user.id;
    // Perform any server-side logout logic if needed (e.g., invalidating a refresh token)
    await sessionManager.logAccess(userId, req.user.role, 'logout');
    console.log(`Backend [/logout]: Logout successful for user ID: ${userId}`);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(`Backend [/logout] Error:`, error);
    res.status(500).json({ message: 'Server error during logout' });
  } finally {
    console.log('--- Backend /auth/logout Endpoint Finished ---\n');
  }
});

/**
 * Get current user endpoint
 * @route GET /auth/me
 */
router.get('/me', async (req, res, next) => {
  console.log('\n--- Backend /auth/me Endpoint Hit ---');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = sessionManager.verifyToken(token);

    if (!decoded || !decoded.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get fresh user data from database
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.user.id]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.is_approved) {
      return res.status(403).json({
        message: 'Account pending approval',
        reason: 'USER_NOT_APPROVED'
      });
    }

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
      },
    });
  } catch (error) {
    console.error('Backend [/me] Error:', error);
    res.status(401).json({ message: 'Invalid token' });
  } finally {
    console.log('--- Backend /auth/me Endpoint Finished ---\n');
  }
});

module.exports = router;

