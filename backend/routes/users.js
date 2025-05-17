const express = require("express")
const router = express.Router()
const { pool } = require("../config/db") // MySQL connection pool
const auth = require("../middleware/auth") // Custom JWT authentication middleware
const checkRole = require("../middleware/roles") // Custom role checking middleware

// --- Role Definitions ---
// Define valid user roles (consistent with init-db.js and auth.js)
const ROLES = {
    STUDENT: 'student',
    HEAD_ADMIN: 'head_admin',
    MANAGER: 'manager',
};


// @route   GET api/users/me
// @desc    Get current authenticated user's details
// @access  Private (Requires JWT auth middleware)
router.get("/me", auth, async (req, res) => {
    // 'auth' middleware adds user info to req.user
    try {
        // Fetch user details from database using ID from authenticated user payload
        // Selecting specific non-sensitive fields
        const [users] = await pool.query("SELECT id, name, email, role, organization, organization_type, avatar, is_approved, created_at FROM users WHERE id = ?", [req.user.id]);

        const user = users[0]; // Get the first user found

        // If user not found (shouldn't happen if auth is correct, but safety check)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Re-map roles to dashboard/permissions for the response if needed (can be done client-side too)
        const roleAccess = { // Define or import roleAccess mapping
            [ROLES.STUDENT]: { dashboard: '/student-dashboard', permissions: ['view_own_profile', 'submit_requests', 'view_own_requests'] },
            [ROLES.HEAD_ADMIN]: { dashboard: '/admin-dashboard', permissions: ['view_all_users', 'manage_users', 'view_all_requests', 'manage_system', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews'] },
            [ROLES.MANAGER]: { dashboard: '/admin-dashboard', permissions: ['view_student_requests', 'manage_student_requests', 'view_own_profile', 'approve_students', 'view_all_proposals', 'manage_all_proposals', 'assign_reviewers', 'manage_reviews'] },
            [ROLES.PARTNER]: { dashboard: '/student-dashboard', permissions: ['view_own_profile', 'submit_requests', 'view_own_requests'] },
            [ROLES.REVIEWER]: { dashboard: '/admin-dashboard', permissions: ['view_all_proposals', 'view_assigned_proposals', 'submit_reviews'] }
        };


        // Respond with user details
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
                createdAt: user.created_at,
                dashboard: roleAccess[user.role]?.dashboard, // Use optional chaining for safety
                permissions: roleAccess[user.role]?.permissions // Use optional chaining
            }
        });
    } catch (err) {
        console.error("Error fetching user details (api/users/me):", err.message); // Log specific error
        res.status(500).send("Server error"); // General server error
    }
});


// @route   POST api/users/approve-student/:id
// @desc    Approve a student account
// @access  Private (Head Admin or Manager only)
router.post("/approve-student/:id", [auth, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => {
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

// @route   GET api/users/pending-students
// @desc    Get list of student accounts pending approval
// @access  Private (Head Admin or Manager only)
router.get("/pending-students", [auth, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => {
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


// --- Additional User-Related Routes (Placeholder) ---

// @route   GET api/users/
// @desc    Get all users (Admin/Manager only)
// @access  Private
// router.get("/", [auth, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => { /* ... */ });

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
// router.delete("/:id", [auth, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => { /* ... */ });


module.exports = router;