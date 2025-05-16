// backend/routes/auth.js

const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken") // Still needed if any direct signing remains, though ideally all via sessionManager
const { check, validationResult } = require("express-validator")
const { pool } = require("../config/db")
const authMiddleware = require("../middleware/auth") // Renamed for clarity from 'auth'
const checkRole = require("../middleware/roles")
const axios = require("axios")
const validate = require('../middleware/validation')
const sessionManager = require('../middleware/session')
const { OAuth2Client } = require('google-auth-library');

const ROLES = {
  STUDENT: 'student',
  HEAD_ADMIN: 'head_admin',
  MANAGER: 'manager',
  PARTNER: 'partner',
  REVIEWER: 'reviewer'
};

const roleAccess = {
  [ROLES.STUDENT]: { dashboard: '/student-dashboard', permissions: ['view_own_profile', 'submit_requests', 'view_own_requests'] },
  [ROLES.HEAD_ADMIN]: { dashboard: '/admin-dashboard', permissions: ['view_all_users', 'manage_users', 'view_all_requests', 'manage_system', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews'] },
  [ROLES.MANAGER]: { dashboard: '/admin-dashboard', permissions: ['view_student_requests', 'manage_student_requests', 'view_own_profile', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews'] },
  [ROLES.PARTNER]: { dashboard: '/student-dashboard', permissions: ['view_own_profile', 'submit_requests', 'view_own_requests'] },
  [ROLES.REVIEWER]: { dashboard: '/admin-dashboard', permissions: ['view_all_proposals', 'view_assigned_proposals', 'submit_reviews'] }
};

// Local logAccess helper - this is fine, but sessionManager.logAccess is now enhanced
// If you intend to use sessionManager.logAccess globally, you can remove this local one
// or ensure calls are consistently made to one or the other.
// For now, I'll assume sessionManager.logAccess is preferred.
/*
async function logAccess(userId, role, action) {
    // ... (your existing local logAccess)
}
*/

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post(
  "/register",
  [
    check("name", "Name is required").trim().not().isEmpty(),
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
    check("role", "Invalid role for registration").isIn([ROLES.STUDENT, ROLES.PARTNER]),
    check("captchaToken", "CAPTCHA verification is required").trim().not().isEmpty(),
    check('organization').custom((value, { req }) => {
      if (req.body.role === ROLES.PARTNER && (!value || value.trim() === '')) {
        throw new Error('Organization is required for Partner role');
      }
      return true;
    }),
    check('organizationType').optional().isIn(['internal', 'external']),
  ],
  async (req, res, next) => { // Added next for error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, organization, organization_type, captchaToken } = req.body;

    try {
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
      );
      console.log("reCAPTCHA Response:", recaptchaResponse.data);

      if (!recaptchaResponse.data.success) {
        console.warn("CAPTCHA verification failed:", recaptchaResponse.data['error-codes']);
        return res.status(400).json({ errors: [{ msg: "CAPTCHA verification failed" }] });
      }

      const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ errors: [{ msg: "User already exists" }] });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await pool.query(
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved) VALUES (?, ?, ?, ?, ?, ?, FALSE)",
        [name, email, hashedPassword, role, organization || null, organization_type || null]
      );
      const newUserId = result.insertId;

      // Fetch the newly created user to pass to generateToken and for the response
      const [createdUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [newUserId]);
      if (createdUsers.length === 0) {
        throw new Error("Failed to retrieve created user."); // Should not happen
      }
      const createdUserForToken = createdUsers[0];

      const token = sessionManager.generateToken(createdUserForToken); // Use sessionManager

      // Log access using sessionManager's logAccess (which now takes role)
      await sessionManager.logAccess(createdUserForToken.id, createdUserForToken.role, 'register');

      res.status(201).json({
        token: token,
        user: {
          id: createdUserForToken.id,
          name: createdUserForToken.name,
          email: createdUserForToken.email,
          role: createdUserForToken.role,
          organization: createdUserForToken.organization,
          organization_type: createdUserForToken.organization_type,
          avatar: createdUserForToken.avatar,
          is_approved: Boolean(createdUserForToken.is_approved), // Cast to boolean
          dashboard: roleAccess[createdUserForToken.role]?.dashboard,
          permissions: roleAccess[createdUserForToken.role]?.permissions
        }
      });
    } catch (err) {
      // If it's a duplicate entry error specifically from the INSERT query
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ errors: [{ msg: "User with this email already exists" }] });
      }
      // For other errors, pass to the main error handler
      next(err);
    }
  }
);

const loginValidation = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists()
];

router.post('/login', validate(loginValidation), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = users[0];

    if (!user.password) {
      return res.status(400).json({ message: 'Please sign in using Google or reset your password if you wish to use email/password login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.is_approved) {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    const token = sessionManager.generateToken(user);
    // Use sessionManager.logAccess and pass the role
    await sessionManager.logAccess(user.id, user.role, 'login');

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        organization_type: user.organization_type,
        avatar: user.avatar,
        is_approved: Boolean(user.is_approved), // Cast to boolean
        dashboard: roleAccess[user.role]?.dashboard,
        permissions: roleAccess[user.role]?.permissions
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh-token', authMiddleware, async (req, res, next) => { // Use renamed authMiddleware
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // req.user is populated by authMiddleware and should contain id, role from verifyToken
    const newToken = await sessionManager.refreshToken(token); // refreshToken internally calls verifyToken
    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authMiddleware, async (req, res, next) => { // Use renamed authMiddleware
  try {
    // req.user is populated by authMiddleware
    await sessionManager.logAccess(req.user.id, req.user.role, 'logout');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.get("/roles", (req, res) => {
  res.json(ROLES);
});

// These dashboard routes are examples; in a larger app, they might be in their own files.
router.get("/student-dashboard", [authMiddleware, checkRole(ROLES.STUDENT, ROLES.PARTNER)], (req, res) => {
  res.json({ message: "Student dashboard data placeholder", userId: req.user.id, role: req.user.role });
});

router.get("/admin-dashboard", [authMiddleware, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.REVIEWER)], (req, res) => {
  res.json({ message: "Admin dashboard data placeholder", userId: req.user.id, role: req.user.role });
});

router.post("/google", async (req, res, next) => { // Added next
  const { token: idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Google ID token is required" });
  }

  try {
    // console.log("Backend [/google]: Verifying Google ID token with google-auth-library...");
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const googlePayload = ticket.getPayload();

    if (!googlePayload) {
      // console.error("Backend [/google]: Google ID token verification failed, no payload.");
      return res.status(401).json({ message: "Google ID token verification failed." });
    }

    const { email, name, picture, sub: googleId, email_verified } = googlePayload;

    if (!email_verified && process.env.REQUIRE_GOOGLE_EMAIL_VERIFIED === 'true') { // Optional: Enforce email verification
      console.warn(`Backend [/google]: User ${email} attempted sign-in, but Google email not verified.`);
      return res.status(403).json({ message: "Google email not verified. Please verify your email with Google." });
    }

    let [users] = await pool.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
    let user = users[0];
    let isNewUser = false;

    if (!user) {
      [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      user = users[0];

      if (!user) {
        isNewUser = true;
        const [result] = await pool.query(
          "INSERT INTO users (name, email, google_id, avatar, role, is_approved, password) VALUES (?, ?, ?, ?, ?, FALSE, NULL)",
          [name || email.split('@')[0], email, googleId, picture, ROLES.STUDENT]
        );
        const [createdUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
        user = createdUsers[0];
        await sessionManager.logAccess(user.id, user.role, 'google_register');
      } else {
        // User exists by email, link Google ID
        await pool.query(
          "UPDATE users SET google_id = ?, name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?",
          [googleId, name || user.name, picture || user.avatar, user.id]
        );
        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
        user = updatedUsers[0];
      }
    } else {
      // User found by google_id, potentially update name/avatar
      if ((name && user.name !== name) || (picture && user.avatar !== picture)) {
        await pool.query(
          "UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?",
          [name || user.name, picture || user.avatar, user.id]
        );
        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
        user = updatedUsers[0];
      }
    }

    if (!user.is_approved) {
      return res.status(403).json({
        message: "Account pending approval. Please contact an administrator.",
        user: { // Send back some user info for the client to display
          id: user.id, name: user.name, email: user.email, role: user.role,
          avatar: user.avatar, is_approved: Boolean(user.is_approved)
        }
      });
    }

    const appToken = sessionManager.generateToken(user); // Use sessionManager
    await sessionManager.logAccess(user.id, user.role, 'google_login');

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
        is_approved: Boolean(user.is_approved), // Cast to boolean
        google_id: user.google_id, // Include google_id in the response
        dashboard: roleAccess[user.role]?.dashboard,
        permissions: roleAccess[user.role]?.permissions
      }
    });

  } catch (error) {
    // console.error("Backend [/google]: Error during Google sign-in process:", error);
    if (error.message && (error.message.includes("Token used too late") || error.message.includes("Invalid token signature") || error.message.includes("No pem found for envelope"))) {
      return res.status(401).json({ message: "Google ID token is invalid or expired. Please try signing in again." });
    }
    next(error); // Pass to the main error handler
  }
});

module.exports = router;