const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const { pool } = require("../config/db") // MySQL connection pool
const { validateToken, validateAdmin, validateFaculty } = require("../middleware/auth") // Updated authentication middleware
const checkRole = require("../middleware/roles") // Custom role checking middleware
const User = require("../models/User") // Corrected User model import
const UserController = require("../controllers/userController")

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
router.get("/test", UserController.test);

// @route   GET api/users/me
// @desc    Get current authenticated user's details
// @access  Private (Requires JWT auth middleware)
router.get("/me", validateToken, UserController.getCurrentUser);


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
router.post("/", [validateToken, checkRole(ROLES.HEAD_ADMIN)], UserController.createUser);

// @route   DELETE api/users/:id
// @desc    Delete a user by ID (HEAD_ADMIN only)
// @access  Private
router.delete("/:id", [validateToken, checkRole(ROLES.HEAD_ADMIN)], UserController.deleteUser);

// @route   POST api/users/login-manager
// @desc    Login for manager users with password
// @access  Public
router.post("/login-manager", UserController.loginManager);

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