// backend/routes/auth.js

const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs") // For password hashing
const jwt = require("jsonwebtoken") // For JWT generation and verification
const { check, validationResult } = require("express-validator") // For input validation
const { pool } = require("../config/db") // MySQL connection pool
const auth = require("../middleware/auth") // Custom JWT authentication middleware
const checkRole = require("../middleware/roles") // Custom role checking middleware
const axios = require("axios") // For external API calls (reCAPTCHA)
const validate = require('../middleware/validation')
const sessionManager = require('../middleware/session')
const { OAuth2Client } = require('google-auth-library'); // <--- ADD THIS LINE

// --- Role Definitions and Access Mapping ---
// Define valid user roles (consistent with init-db.js)
const ROLES = {
  STUDENT: 'student',
  HEAD_ADMIN: 'head_admin',
  MANAGER: 'manager',
  PARTNER: 'partner',
  REVIEWER: 'reviewer'
}

// Map roles to their default dashboard path and permissions
const roleAccess = {
  [ROLES.STUDENT]: {
    dashboard: '/student-dashboard',
    permissions: ['view_own_profile', 'submit_requests', 'view_own_requests']
  },
  [ROLES.HEAD_ADMIN]: {
    dashboard: '/admin-dashboard',
    permissions: ['view_all_users', 'manage_users', 'view_all_requests', 'manage_system', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews']
  },
  [ROLES.MANAGER]: {
    dashboard: '/admin-dashboard',
    permissions: ['view_student_requests', 'manage_student_requests', 'view_own_profile', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews']
  },
  [ROLES.PARTNER]: {
    dashboard: '/student-dashboard',
    permissions: ['view_own_profile', 'submit_requests', 'view_own_requests']
  },
  [ROLES.REVIEWER]: {
    dashboard: '/admin-dashboard',
    permissions: ['view_all_proposals', 'view_assigned_proposals', 'submit_reviews']
  }
}

// --- Helper Function to Log Access ---
async function logAccess(userId, role, action) {
  if (!pool) {
    console.error("Access log failed: Database pool is not available.");
    return;
  }
  try {
    await pool.query(
      "INSERT INTO access_logs (user_id, role, action) VALUES (?, ?, ?)",
      [userId, role, action]
    )
  } catch (err) {
    console.error('Failed to log access:', err.message)
  }
}

// --- Initialize Google OAuth2Client ---
// Ensure GOOGLE_CLIENT_ID is in your .env file for the backend
// This should be the SAME Client ID used by your frontend to obtain the ID token
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // <--- ADD THIS LINE

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").trim().not().isEmpty(),
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
    check("role", "Invalid role for registration").isIn([ROLES.STUDENT, ROLES.PARTNER]),
    check("captchaToken", "CAPTCHA verification is required").trim().not().isEmpty(),
    check('organization').custom((value, { req }) => {
      if (req.body.role === ROLES.PARTNER && (value === undefined || value === null || value.trim() === '')) {
        throw new Error('Organization is required for Partner role');
      }
      return true;
    }),
    check('organizationType').optional().isIn(['internal', 'external']),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      name, email, password, role, organization, organization_type, captchaToken // organization_type was organizationType in frontend
    } = req.body

    try {
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      )

      if (!recaptchaResponse.data.success) {
        console.warn("CAPTCHA verification failed:", recaptchaResponse.data['error-codes']);
        return res.status(400).json({ errors: [{ msg: "CAPTCHA verification failed" }] })
      }

      const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
      if (existingUsers.length > 0) {
        return res.status(400).json({ errors: [{ msg: "User already exists" }] })
      }

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      const [result] = await pool.query(
        // Ensure your table uses 'organization_type' if that's the column name
        "INSERT INTO users (name, email, password, role, organization, organization_type, is_approved) VALUES (?, ?, ?, ?, ?, ?, FALSE)",
        [name, email, hashedPassword, role, organization || null, organization_type || null] // Use organization_type
      )
      const newUserId = result.insertId;

      const payload = { user: { id: newUserId, email: email, role: role } }

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, async (err, token) => {
        if (err) {
          console.error("JWT signing error:", err.message);
          return res.status(500).send("Server error during token generation");
        }

        const [createdUsers] = await pool.query("SELECT id, name, email, role, organization, organization_type, avatar, is_approved FROM users WHERE id = ?", [newUserId]);
        const createdUser = createdUsers[0];
        await logAccess(newUserId, role, 'register');

        res.status(201).json({
          token: token,
          user: {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
            organization: createdUser.organization,
            organization_type: createdUser.organization_type,
            avatar: createdUser.avatar,
            is_approved: createdUser.is_approved, // Include approval status
            dashboard: roleAccess[createdUser.role]?.dashboard,
            permissions: roleAccess[createdUser.role]?.permissions
          }
        });
      });
    } catch (err) {
      console.error("Error during user registration:", err.message);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ errors: [{ msg: "User with this email already exists" }] });
      }
      res.status(500).send("Server error")
    }
  },
)

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

    // For Google-created users who haven't set a password, their password hash might be null or a placeholder.
    // Regular login should fail if they try to use it with a password.
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

    const token = sessionManager.generateToken(user); // Assumes sessionManager.generateToken creates your app's JWT
    await sessionManager.logAccess(user.id, 'login'); // Ensure sessionManager.logAccess uses user.role

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
        is_approved: user.is_approved,
        dashboard: roleAccess[user.role]?.dashboard,
        permissions: roleAccess[user.role]?.permissions
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh-token', auth, async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const newToken = await sessionManager.refreshToken(token);
    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', auth, async (req, res, next) => {
  try {
    await sessionManager.logAccess(req.user.id, 'logout'); // Ensure sessionManager.logAccess uses req.user.role
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.get("/roles", (req, res) => {
  res.json(ROLES)
})

router.get("/student-dashboard", [auth, checkRole(ROLES.STUDENT, ROLES.PARTNER)], async (req, res) => {
  try {
    res.json({ message: "Student dashboard data placeholder", userId: req.user.id, role: req.user.role })
  } catch (err) {
    console.error("Error fetching student dashboard data:", err.message)
    res.status(500).send("Server error")
  }
})

router.get("/admin-dashboard", [auth, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER, ROLES.REVIEWER)], async (req, res) => {
  try {
    res.json({ message: "Admin dashboard data placeholder", userId: req.user.id, role: req.user.role })
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err.message)
    res.status(500).send("Server error")
  }
})

router.get("/student-requests", [auth, checkRole(ROLES.MANAGER)], async (req, res) => {
  try {
    res.json({ message: "Student requests data placeholder for Manager", userId: req.user.id })
  } catch (err) {
    console.error("Error fetching student requests data:", err.message)
    res.status(500).send("Server error")
  }
})

// @route   POST api/auth/google
// @desc    Authenticate user with Google (using ID token received from client)
// @access  Public
router.post("/google", async (req, res) => {
  const { token: idToken } = req.body; // The token from frontend is the Google ID Token

  if (!idToken) {
    return res.status(400).json({ message: "Google ID token is required" });
  }

  try {
    console.log("Backend [/google]: Verifying Google ID token with google-auth-library...");
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Must match the client ID that obtained the token
    });
    const googlePayload = ticket.getPayload();

    if (!googlePayload) {
      console.error("Backend [/google]: Google ID token verification failed, no payload.");
      return res.status(401).json({ message: "Google ID token verification failed." });
    }

    const { email, name, picture, sub: googleId, email_verified } = googlePayload;

    console.log("Backend [/google]: Google token verified. Payload:", { googleId, email, name, email_verified });

    if (!email_verified) {
      // You might choose to reject users whose email is not verified by Google,
      // or handle them differently (e.g., require email verification through your system).
      console.warn(`Backend [/google]: User ${email} attempted to sign in, but their Google email is not verified.`);
      // return res.status(403).json({ message: "Google email not verified. Please verify your email with Google first." });
    }

    // --- Check if User Exists in Your DB ---
    // Prioritize google_id for existing Google users, then email for linking accounts
    let [users] = await pool.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
    let user = users[0];

    if (!user) {
      // If no user with google_id, check by email to link an existing email account
      [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      user = users[0];

      if (!user) {
        // --- Create New User if Not Exists (by google_id or email) ---
        console.log(`Backend [/google]: Creating new user for ${email} with Google ID ${googleId}`);
        // New users via Google are set to ROLES.STUDENT by default and require approval.
        // No password is set for Google-only users.
        const [result] = await pool.query(
          "INSERT INTO users (name, email, google_id, avatar, role, is_approved, password) VALUES (?, ?, ?, ?, ?, FALSE, NULL)",
          [name || email.split('@')[0], email, googleId, picture, ROLES.STUDENT] // Default name if not provided
        );
        const [createdUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
        user = createdUsers[0];
        await logAccess(user.id, user.role, 'google_register');
      } else {
        // User exists by email, link Google ID and update avatar/name if necessary
        console.log(`Backend [/google]: Linking existing user ${email} with Google ID ${googleId}`);
        await pool.query(
          "UPDATE users SET google_id = ?, name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?",
          [googleId, name || user.name, picture || user.avatar, user.id]
        );
        // Re-fetch user to get updated data
        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
        user = updatedUsers[0];
      }
    } else {
      // User found by google_id, potentially update name/avatar if changed in Google
      if (user.name !== name || user.avatar !== picture) {
        console.log(`Backend [/google]: Updating name/avatar for existing Google user ${email}`);
        await pool.query(
          "UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?",
          [name || user.name, picture || user.avatar, user.id]
        );
        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
        user = updatedUsers[0];
      }
    }

    // --- Check if User is Approved ---
    // This check is crucial for your application's flow
    if (!user.is_approved) {
      console.log(`Backend [/google]: User ${user.email} (ID: ${user.id}) is not approved.`)
      // For unapproved users, you might not issue a full session token
      // or return specific data indicating pending approval.
      return res.status(403).json({
        message: "Account pending approval. Please contact an administrator.",
        // You can optionally send back limited user info if your frontend needs it
        // to display a specific "pending approval" message or status.
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          is_approved: user.is_approved
        }
      });
    }

    // --- Generate Your Application's JWT ---
    // Use your sessionManager or direct jwt.sign
    // const appToken = sessionManager.generateToken(user);
    const appTokenPayload = { user: { id: user.id, email: user.email, role: user.role } };
    const appToken = jwt.sign(appTokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });


    await logAccess(user.id, user.role, 'google_login');

    res.json({
      token: appToken, // This is YOUR application's token
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        organization_type: user.organization_type,
        avatar: user.avatar,
        is_approved: user.is_approved,
        dashboard: roleAccess[user.role]?.dashboard,
        permissions: roleAccess[user.role]?.permissions
      }
    });

  } catch (error) {
    console.error("Backend [/google]: Error during Google ID token verification or user processing:", error);
    if (error.message && error.message.includes("Token used too late") || error.message.includes("Invalid token signature")) {
      return res.status(401).json({ message: "Google ID token is invalid or expired. Please try signing in again." });
    }
    // General error from google-auth-library or DB issues
    res.status(500).json({ message: "Server error during Google authentication." });
  }
});


module.exports = router;