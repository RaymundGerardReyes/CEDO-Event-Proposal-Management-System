const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const { pool } = require("../config/db") // MySQL connection pool
const { validateToken, validateAdmin, validateFaculty } = require("../middleware/auth") // Updated authentication middleware
const checkRole = require("../middleware/roles") // Custom role checking middleware
const User = require("../models/User") // Corrected User model import

// --- Role Definitions ---
// Define valid user roles (consistent with init-db.js and auth.js)
const ROLES = {
    STUDENT: 'student',
    HEAD_ADMIN: 'head_admin',
    MANAGER: 'manager',
    PARTNER: 'partner',
    REVIEWER: 'reviewer'
};


// @route   GET api/users/test
// @desc    Test endpoint (no auth required)
// @access  Public
router.get("/test", async (req, res) => {
    try {
        res.json({
            message: "Users API is working!",
            timestamp: new Date().toISOString(),
            endpoint: "/api/users/test"
        });
    } catch (err) {
        console.error("Error in test endpoint:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/users/me
// @desc    Get current authenticated user's details
// @access  Private (Requires JWT auth middleware)
router.get("/me", validateToken, async (req, res) => {
    // 'auth' middleware adds user info to req.user
    try {
        // Fetch user details from database using ID from authenticated user payload
        // Selecting specific non-sensitive fields including password reset status
        const [users] = await pool.query("SELECT id, name, email, role, organization, organization_type, avatar, is_approved, password_reset_required, last_login, created_at FROM users WHERE id = ?", [req.user.id]);

        const user = users[0]; // Get the first user found

        // If user not found (shouldn't happen if auth is correct, but safety check)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Re-map roles to dashboard/permissions for the response if needed (can be done client-side too)
        const roleAccess = { // Define or import roleAccess mapping
            [ROLES.STUDENT]: { dashboard: '/student-dashboard', permissions: ['view_own_profile', 'submit_requests', 'view_own_requests'] },
            [ROLES.head_admin]: { dashboard: '/admin-dashboard', permissions: ['view_all_users', 'manage_users', 'view_all_requests', 'manage_system', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews'] },
            [ROLES.manager]: { dashboard: '/admin-dashboard', permissions: ['view_student_requests', 'manage_student_requests', 'view_own_profile', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews'] },
            [ROLES.PARTNER]: { dashboard: '/student-dashboard', permissions: ['view_own_profile', 'submit_requests', 'view_own_requests'] },
            [ROLES.REVIEWER]: { dashboard: '/admin-dashboard', permissions: ['view_all_proposals', 'view_assigned_proposals', 'submit_reviews'] }
        };


        // Respond with user details including password reset requirement
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                organization_type: user.organization_type,
                avatar: user.avatar,
                is_approved: user.is_approved,
                password_reset_required: user.password_reset_required,
                last_login: user.last_login,
                createdAt: user.created_at,
                dashboard: roleAccess[user.role]?.dashboard, // Use optional chaining for safety
                permissions: roleAccess[user.role]?.permissions // Use optional chaining
            },
            ...(user.password_reset_required && {
                passwordInfo: {
                    mustChangePassword: true,
                    message: "You must change your password before continuing"
                }
            })
        });
    } catch (err) {
        console.error("Error fetching user details (api/users/me):", err.message); // Log specific error
        res.status(500).send("Server error"); // General server error
    }
});


// @route   GET api/users/
// @desc    Get all users (Admin/Manager only)
// @access  Private
router.get("/", [validateToken, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
    try {
        const users = await User.getAll(); // We'll modify User.getAll next
        res.json(users);
    } catch (err) {
        console.error("Error fetching all users:", err.message);
        res.status(500).send("Server error");
    }
});


// @route   POST api/users/approve-student/:id
// @desc    Approve a student account
// @access  Private (Head Admin or Manager only)
router.post("/approve-student/:id", [validateToken, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => {
    try {
        const studentIdToApprove = req.params.id;
        const approverId = req.user.id;

        // Check if the user being approved actually exists and is a student and is currently NOT approved
        const [students] = await pool.query("SELECT id, role, is_approved FROM users WHERE id = ?", [studentIdToApprove]);
        const student = students[0];

        if (!student) {
            return res.status(404).json({ message: "User not found" });
        }
        if (student.role !== ROLES.STUDENT) {
            return res.status(400).json({ message: "User is not a student account" });
        }
        if (student.is_approved) {
            return res.status(400).json({ message: "Account is already approved" });
        }

        // Update user approval status in the database
        await pool.query(
            "UPDATE users SET is_approved = TRUE, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?",
            [approverId, studentIdToApprove]
        );

        // Optional: Send an email notification to the approved student

        res.json({ message: "Student account approved successfully" });
    } catch (err) {
        console.error("Error approving student account:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/users/pending-students
// @desc    Get list of student accounts pending approval
// @access  Private (Head Admin or Manager only)
router.get("/pending-students", [validateToken, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => {
    try {
        // Fetch student users who are not yet approved
        const [students] = await pool.query(
            "SELECT id, name, email, organization, organization_type, avatar, created_at FROM users WHERE role = ? AND is_approved = FALSE",
            [ROLES.STUDENT]
        );
        res.json(students);
    } catch (err) {
        console.error("Error fetching pending students:", err.message);
        res.status(500).send("Server error");
    }
});


// @route   GET api/users/:id
// @desc    Get a specific user by ID
// @access  Private (User themselves or Admin/Manager)
// router.get("/:id", auth, async (req, res) => { /* ... */ });

// @route   PUT api/users/:id
// @desc    Update a user by ID (User themselves or Admin/Manager)
// @access  Private
// router.put("/:id", auth, async (req, res) => { /* ... */ });

// @route   DELETE api/users/:id
// @desc    Delete a user by ID (Admin only)
// @access  Private
// router.delete("/:id", [validateToken, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => { /* ... */ });

// @route   PUT /api/users/:userIdToUpdate/approval
// @desc    Update user approval status
// @access  Private (HEAD_ADMIN only)
router.put("/:userIdToUpdate/approval", [validateToken, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
    try {
        const { userIdToUpdate } = req.params;
        const { is_approved } = req.body; // Expecting { "is_approved": true/false }
        const approverId = req.user.id; // ID of the admin making the change

        if (typeof is_approved !== 'boolean') {
            return res.status(400).json({ message: "Invalid 'is_approved' value. Must be true or false." });
        }

        // First, check if the user exists
        const existingUser = await User.findById(userIdToUpdate);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const updateData = {
            is_approved,
            approved_by: is_approved ? approverId : null, // Set approverId if approved, null if revoked
            approved_at: is_approved ? new Date() : null,   // Set current timestamp if approved, null if revoked
        };

        // We'll need to ensure User.update can handle these fields or create a specific method
        const updatedUser = await User.update(userIdToUpdate, updateData);

        res.json({ message: `User approval status updated successfully.`, user: updatedUser });

    } catch (err) {
        console.error("Error updating user approval:", err.message);
        if (err.message.includes("foreign key constraint fails")) {
            return res.status(400).json({ message: "Invalid approver ID or user ID for approval update." })
        }
        res.status(500).send("Server error");
    }
});

// @route   PUT /api/users/:userIdToUpdate
// @desc    Update user details including organization
// @access  Private (HEAD_ADMIN only)
router.put("/:userIdToUpdate", [validateToken, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
    try {
        const { userIdToUpdate } = req.params;
        const { organization /*, other fields like name, email, role */ } = req.body;
        if (organization === undefined /* && other fields are also undefined */) {
            return res.status(400).json({ message: "No update data provided or organization is required." });
        }
        const updateData = {};
        if (organization !== undefined) updateData.organization = organization;
        // Add other fields to updateData if they are present in req.body
        const updatedUser = await User.update(userIdToUpdate, updateData); // Ensure User.update handles partial updates
        res.json({ message: `User details updated successfully.`, user: updatedUser });
    } catch (err) {
        console.error("Error updating user organization:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/users/
// @desc    Create a new user (HEAD_ADMIN only)
// @access  Private
router.post("/", [validateToken, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
    try {
        const { name, email, role, organization, organization_type, temporary_password } = req.body;

        // Validation
        if (!name || !email || !role) {
            return res.status(400).json({ message: "Name, email, and role are required" });
        }

        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Handle password for manager role
        let hashedPassword = null;
        if (role === ROLES.MANAGER && temporary_password) {
            // Hash the temporary password
            const saltRounds = 12; // High security for passwords
            hashedPassword = await bcrypt.hash(temporary_password, saltRounds);

            console.log(`Generated password for manager ${email}: ${temporary_password}`); // Log for admin reference (remove in production)
        }

        // Create user with or without password
        const [result] = await pool.query(
            "INSERT INTO users (name, email, role, organization, organization_type, password, is_approved, password_reset_required, created_at) VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)",
            [
                name,
                email,
                role,
                organization || null,
                organization_type || null,
                hashedPassword, // Will be null for non-manager users or managers without password
                role === ROLES.MANAGER ? true : false // Require password reset for managers
            ]
        );

        // Get the created user (exclude password from response)
        const [newUsers] = await pool.query(
            "SELECT id, name, email, role, organization, organization_type, is_approved, password_reset_required, created_at FROM users WHERE id = ?",
            [result.insertId]
        );

        const responseMessage = role === ROLES.MANAGER && temporary_password
            ? "Manager user created successfully with temporary password"
            : "User created successfully";

        res.status(201).json({
            message: responseMessage,
            user: newUsers[0],
            ...(role === ROLES.MANAGER && temporary_password && {
                passwordInfo: {
                    hasTemporaryPassword: true,
                    mustChangeOnFirstLogin: true,
                    note: "Password has been securely hashed and stored"
                }
            })
        });

    } catch (err) {
        console.error("Error creating user:", err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            console.error("Database schema issue - check if password and password_reset_required columns exist");
            return res.status(500).json({ message: "Database configuration error. Please contact administrator." });
        }
        res.status(500).send("Server error");
    }
});

// @route   DELETE api/users/:id
// @desc    Delete a user by ID (HEAD_ADMIN only)
// @access  Private
router.delete("/:id", [validateToken, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const requestingUserId = req.user.id;

        // Prevent self-deletion
        if (userIdToDelete == requestingUserId) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }

        // Check if user exists
        const [users] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [userIdToDelete]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userToDelete = users[0];

        // Delete the user
        await pool.query("DELETE FROM users WHERE id = ?", [userIdToDelete]);

        res.json({
            message: "User deleted successfully",
            deletedUser: userToDelete
        });

    } catch (err) {
        console.error("Error deleting user:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/users/login-manager
// @desc    Login for manager users with password
// @access  Public
router.post("/login-manager", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const [users] = await pool.query("SELECT id, name, email, role, password, password_reset_required, is_approved FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];

        // Check if user is a manager
        if (user.role !== ROLES.MANAGER) {
            return res.status(401).json({ message: "This login is only for manager accounts" });
        }

        // Check if user is approved
        if (!user.is_approved) {
            return res.status(401).json({ message: "Account not yet approved. Please contact an administrator." });
        }

        // Check if user has a password set
        if (!user.password) {
            return res.status(401).json({ message: "No password set for this account. Please contact an administrator." });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Update last login
        await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

        // Generate JWT token (you'll need to import jwt and set JWT_SECRET in your environment)
        const jwt = require('jsonwebtoken');
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                password_reset_required: user.password_reset_required
            },
            ...(user.password_reset_required && {
                passwordInfo: {
                    mustChangePassword: true,
                    message: "You must change your password before continuing"
                }
            })
        });

    } catch (err) {
        console.error("Error in manager login:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/users/change-password
// @desc    Change password for authenticated user (especially for managers with temporary passwords)
// @access  Private
router.post("/change-password", validateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters long" });
        }

        // Get user's current password
        const [users] = await pool.query("SELECT password, password_reset_required FROM users WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password and clear password_reset_required flag
        await pool.query(
            "UPDATE users SET password = ?, password_reset_required = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [hashedNewPassword, userId]
        );

        res.json({
            message: "Password changed successfully",
            passwordInfo: {
                passwordChanged: true,
                passwordResetRequired: false
            }
        });

    } catch (err) {
        console.error("Error changing password:", err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;