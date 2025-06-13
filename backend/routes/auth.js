/**
 * Authentication Routes
 * 
 * Provides secure authentication endpoints for the CEDO application.
 * Implements both traditional email/password authentication and modern
 * Google OAuth 2.0 authentication using Google Identity Services.
 * 
 * Features:
 * - Email/password authentication with bcrypt hashing
 * - Google OAuth 2.0 with ID token verification
 * - reCAPTCHA v3 integration for bot protection
 * - Role-based access control and dashboard routing
 * - Comprehensive error handling and security measures
 * - Session management and token generation
 * 
 * Security Measures:
 * - Password hashing with bcrypt (cost factor 12)
 * - JWT token generation with secure secrets
 * - Google ID token verification on server-side
 * - reCAPTCHA validation for form submissions
 * - User approval system for access control
 * - Comprehensive input validation and sanitization
 * 
 * @see https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
 * @see https://www.sitepoint.com/google-auth-react-express/
 * 
 * @module routes/auth
 */

// backend/routes/auth.js

const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const { pool } = require("../config/db")
const authMiddleware = require("../middleware/auth")
const sessionManager = require("../middleware/session")
const { verifyGoogleToken } = require("../utils/googleAuth")
const { createAssessment } = require('../utils/recaptchaAssessment');
const { verifyRecaptchaToken } = require('../utils/recaptcha');

/**
 * User Role Constants
 * 
 * Defines all available user roles in the system for consistent
 * role-based access control across the application.
 */
const ROLES = {
  STUDENT: "student",
  HEAD_ADMIN: "head_admin",
  MANAGER: "manager",
  PARTNER: "partner",
  REVIEWER: "reviewer",
}

/**
 * Role-Based Access Control Configuration
 * 
 * Maps each user role to their default dashboard and available permissions.
 * This configuration ensures proper authorization and user experience
 * based on the user's role within the system.
 * 
 * Dashboard Routing:
 * - Students and Partners → Student Dashboard
 * - Admins, Managers, Reviewers → Admin Dashboard
 * 
 * Permission System:
 * - Granular permissions for fine-grained access control
 * - Hierarchical permission inheritance
 * - Future-proof extensibility for new features
 */
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


/**
 * Email/Password Authentication Endpoint
 * 
 * Handles traditional email and password authentication with enhanced security features.
 * Implements bcrypt password verification and reCAPTCHA bot protection.
 * 
 * Process Flow:
 * 1. Validates email and password presence
 * 2. Verifies reCAPTCHA token for bot protection
 * 3. Looks up user in database by email
 * 4. Compares password using bcrypt
 * 5. Checks user approval status
 * 6. Generates JWT token for session
 * 7. Returns authentication response
 * 
 * Security Features:
 * - bcrypt password hashing verification
 * - reCAPTCHA v3 bot protection
 * - User approval system
 * - Comprehensive input validation
 * - Secure error messages (no user enumeration)
 * 
 * @route POST /auth/login
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {string} req.body.captchaToken - reCAPTCHA verification token
 * @returns {Object} Authentication response with JWT and user data
 */
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


/**
 * Google OAuth 2.0 Authentication Endpoint
 * 
 * Handles Google Sign-In authentication using ID tokens from Google Identity Services.
 * This endpoint follows Google's recommended server-side verification process
 * for secure authentication.
 * 
 * Process Flow:
 * 1. Receives ID token from frontend (Google Identity Services)
 * 2. Verifies token authenticity with Google's servers
 * 3. Extracts user information from verified token
 * 4. Checks/creates user account in database
 * 5. Validates user approval status
 * 6. Generates application JWT token
 * 7. Returns user data and authentication token
 * 
 * Security Features:
 * - Server-side ID token verification
 * - User approval system
 * - Automatic profile updates
 * - Email verification checks
 * - Database transaction safety
 * 
 * @route POST /auth/google
 * @param {string} req.body.token - Google ID token from frontend
 * @returns {Object} Authentication response with JWT and user data
 * 
 * @see https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
 */
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

    let users, user, isNewUser = false;

    try {
      console.log(`Backend [/google]: Checking for existing user by Google ID: ${googleId}`);
      [users] = await pool.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
      user = users[0];
      if (user) {
        console.log(`Backend [/google]: Found existing user by Google ID: ${user.id}, Email: ${user.email}`);
      } else {
        console.log(`Backend [/google]: No user found with Google ID ${googleId}.`);
      }
    } catch (dbError) {
      console.error("Backend [/google] DB Error: Error checking for existing Google user:", dbError.message);
      return res.status(500).json({
        message: "Could not verify user account (google_id lookup). Please try again later.",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        reason: "DB_LOOKUP_GOOGLE_ID_FAILED"
      });
    }

    if (!user) {
      console.log(`Backend [/google]: Checking for existing user by email: ${email}`);
      try {
        [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        user = users[0];
        if (user) {
          console.log(`Backend [/google]: Found existing user by email: ${user.id}. Will link Google ID.`);
        } else {
          console.log(`Backend [/google]: No user found by email ${email}. Will create new user.`);
        }
      } catch (dbError) {
        console.error("Backend [/google] DB Error: Error checking for existing user by email:", dbError.message);
        return res.status(500).json({
          message: "Could not verify user account (email lookup). Please try again later.",
          error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
          reason: "DB_LOOKUP_EMAIL_FAILED"
        });
      }

      if (!user) {
        // For security: Only allow existing users to sign in with Google
        // Do not create new users automatically to prevent unauthorized data storage
        console.log(`Backend [/google]: User ${email} not found in system. Rejecting Google sign-in attempt.`);
        return res.status(403).json({
          message: "Account not found. Please contact an administrator to create your account first.",
          reason: "USER_NOT_FOUND",
          email: email // Optional: include email for admin reference
        });
      } else {
        // User found by email - link Google ID if not already linked
        console.log(`Backend [/google]: Linking Google ID ${googleId} to existing user ${user.id} (Email: ${email})`);
        try {
          await pool.query(
            "UPDATE users SET google_id = ?, name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?",
            [googleId, name || user.name, picture || user.avatar, user.id]
          );
          const [updatedUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
          user = updatedUsers[0];
          console.log(`Backend [/google]: Successfully linked Google ID to user ${user.id}.`);
        } catch (dbError) {
          console.error(`Backend [/google] DB Error: Database error updating user (linking Google ID):`, dbError.message);
          return res.status(500).json({
            message: "Could not update your account (linking Google ID). Please try again later.",
            error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
            reason: "DB_LINK_GOOGLE_ID_FAILED"
          });
        }
      }
    } else {
      // User found by Google ID - update profile if needed
      console.log(`Backend [/google]: User ${user.id} (Email: ${user.email}) found by Google ID. Checking for profile updates.`);
      if ((name && user.name !== name) || (picture && user.avatar !== picture)) {
        console.log(`Backend [/google]: Profile differences found. Updating name/avatar for user ${user.id}.`);
        try {
          await pool.query("UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?", [
            name || user.name,
            picture || user.avatar,
            user.id,
          ]);
          const [updatedUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
          user = updatedUsers[0];
          console.log(`Backend [/google]: Successfully updated profile information for user ${user.id}.`);
        } catch (dbError) {
          console.error(`Backend [/google] DB Error: Database error updating user profile (name/avatar):`, dbError.message);
          console.warn(`Backend [/google]: Continuing with existing user data for ${user.id} despite profile update failure.`);
        }
      } else {
        console.log(`Backend [/google]: No profile updates needed for user ${user.id}.`);
      }
    }

    console.log(`Backend [/google]: Checking approval status for User ID: ${user.id}, Email: ${user.email}. Is Approved: ${user.is_approved}`);
    if (!user.is_approved) {
      console.warn(`Backend [/google] Authorization Denied: User ${user.id} (Email: ${user.email}) IS NOT APPROVED.`);
      return res.status(403).json({
        message: "Account pending approval. Please contact an administrator.",
        reason: "USER_NOT_APPROVED",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          is_approved: Boolean(user.is_approved),
        }
      });
    }

    console.log(`Backend [/google]: User ${user.id} (Email: ${email}) IS APPROVED. Generating app token.`);
    const appToken = sessionManager.generateToken(user);
    await sessionManager.logAccess(user.id, user.role, "google_login");
    console.log(`Backend [/google]: User ${user.id} (Email: ${email}) successfully authenticated via Google.`);

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

  } catch (error) {
    console.error("Backend [/google] Critical Error: Unhandled exception in Google sign-in process:", error);
    next(error); // Pass to the main error handler
  } finally {
    console.log('--- Backend /auth/google Endpoint Finished ---\n');
  }
});

module.exports = router;
