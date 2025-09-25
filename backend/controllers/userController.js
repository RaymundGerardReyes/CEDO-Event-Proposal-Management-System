const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, query } = require("../config/database-postgresql-only");
const User = require("../models/User");

// --- Role Definitions ---
const ROLES = {
    STUDENT: "student",
    HEAD_ADMIN: "head_admin",
    MANAGER: "manager",
    PARTNER: "partner",
    REVIEWER: "reviewer",
};

module.exports = {
    // Public: quick ping for health-check of Users API
    async test(req, res) {
        try {
            res.json({
                message: "Users API is working! (controller)",
                timestamp: new Date().toISOString(),
                endpoint: "/api/users/test",
            });
        } catch (err) {
            console.error("UserController.test:", err.message);
            res.status(500).send("Server error");
        }
    },

    // Private: return details of currently authenticated user
    async getCurrentUser(req, res) {
        try {
            const [users] = await pool.query(
                "SELECT id, name, email, role, organization, organization_type, avatar, is_approved, password_reset_required, last_login, created_at, organization_description, phone_number FROM users WHERE id = ?",
                [req.user.id],
            );

            const user = users[0];
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const roleAccess = {
                [ROLES.STUDENT]: {
                    dashboard: "/student-dashboard",
                    permissions: [
                        "view_own_profile",
                        "submit_requests",
                        "view_own_requests",
                    ],
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
                    permissions: [
                        "view_own_profile",
                        "submit_requests",
                        "view_own_requests",
                    ],
                },
                [ROLES.REVIEWER]: {
                    dashboard: "/admin-dashboard",
                    permissions: [
                        "view_all_proposals",
                        "view_assigned_proposals",
                        "submit_reviews",
                    ],
                },
            };

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
                    organizationDescription: user.organization_description || "",
                    contactPhone: user.phone_number || "",
                    dashboard: roleAccess[user.role]?.dashboard,
                    permissions: roleAccess[user.role]?.permissions,
                },
                ...(user.password_reset_required && {
                    passwordInfo: {
                        mustChangePassword: true,
                        message: "You must change your password before continuing",
                    },
                }),
            });
        } catch (err) {
            console.error("UserController.getCurrentUser:", err.message);
            res.status(500).send("Server error");
        }
    },

    // HEAD_ADMIN: create a new user (with optional temporary password)
    async createUser(req, res) {
        try {
            const {
                name,
                email,
                role,
                organization,
                organization_type,
                temporary_password,
            } = req.body;

            if (!name || !email || !role) {
                return res.status(400).json({ message: "Name, email, and role are required" });
            }
            if (!Object.values(ROLES).includes(role)) {
                return res.status(400).json({ message: "Invalid role specified" });
            }

            // Prevent duplicates
            const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
            if (existingUsers.length) {
                return res.status(400).json({ message: "User with this email already exists" });
            }

            // Hash manager password if supplied
            let hashedPassword = null;
            if (role === ROLES.MANAGER && temporary_password) {
                hashedPassword = await bcrypt.hash(temporary_password, 12);
            }

            // Insert
            const [result] = await pool.query(
                "INSERT INTO users (name, email, role, organization, organization_type, password, is_approved, password_reset_required, created_at) VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)",
                [
                    name,
                    email,
                    role,
                    organization || null,
                    organization_type || null,
                    hashedPassword,
                    role === ROLES.MANAGER ? true : false,
                ],
            );

            const [newUsers] = await pool.query(
                "SELECT id, name, email, role, organization, organization_type, is_approved, password_reset_required, created_at FROM users WHERE id = ?",
                [result.insertId],
            );

            const responseMessage =
                role === ROLES.MANAGER && temporary_password
                    ? "Manager user created successfully with temporary password"
                    : "User created successfully";

            res.status(201).json({
                message: responseMessage,
                user: newUsers[0],
                ...(role === ROLES.MANAGER && temporary_password && {
                    passwordInfo: {
                        hasTemporaryPassword: true,
                        mustChangeOnFirstLogin: true,
                        note: "Password has been securely hashed and stored",
                    },
                }),
            });
        } catch (err) {
            console.error("UserController.createUser:", err.message);
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ message: "User with this email already exists" });
            }
            res.status(500).send("Server error");
        }
    },

    // HEAD_ADMIN: delete user
    async deleteUser(req, res) {
        try {
            const userIdToDelete = req.params.id;
            const requestingUserId = req.user.id;

            if (userIdToDelete == requestingUserId) {
                return res.status(400).json({ message: "Cannot delete your own account" });
            }

            const [users] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [userIdToDelete]);
            if (!users.length) return res.status(404).json({ message: "User not found" });

            const userToDelete = users[0];
            await pool.query("DELETE FROM users WHERE id = ?", [userIdToDelete]);
            res.json({ message: "User deleted successfully", deletedUser: userToDelete });
        } catch (err) {
            console.error("UserController.deleteUser:", err.message);
            res.status(500).send("Server error");
        }
    },

    // Manager login
    async loginManager(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            const [users] = await pool.query(
                "SELECT id, name, email, role, password, password_reset_required, is_approved FROM users WHERE email = ?",
                [email],
            );
            if (!users.length) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const user = users[0];
            if (user.role !== ROLES.MANAGER) {
                return res.status(401).json({ message: "This login is only for manager accounts" });
            }
            if (!user.is_approved) {
                return res.status(401).json({ message: "Account not yet approved. Please contact an administrator." });
            }
            if (!user.password) {
                return res.status(401).json({ message: "No password set for this account. Please contact an administrator." });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

            const payload = { user: { id: user.id, email: user.email, role: user.role } };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

            res.json({
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password_reset_required: user.password_reset_required,
                },
                ...(user.password_reset_required && {
                    passwordInfo: {
                        mustChangePassword: true,
                        message: "You must change your password before continuing",
                    },
                }),
            });
        } catch (err) {
            console.error("UserController.loginManager:", err.message);
            res.status(500).send("Server error");
        }
    },
}; 