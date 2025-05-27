const { pool } = require("../config/db")
const bcrypt = require("bcryptjs")

const User = {
  // Find user by ID
  findById: async (id) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, email, role, organization, organization_type, avatar, created_at, updated_at, is_approved, approved_by, approved_at, google_id FROM users WHERE id = ?",
        [id],
      )
      return rows[0]
    } catch (error) {
      throw error
    }
  },

  // Find user by email
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
      return rows[0]
    } catch (error) {
      throw error
    }
  },

  // Find user by Google ID
  findByGoogleId: async (googleId) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE google_id = ?", [googleId])
      return rows[0]
    } catch (error) {
      throw error
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      // Hash password if provided (it might not be for Google OAuth users initially)
      let hashedPassword = userData.password;
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(userData.password, salt);
      }

      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, organization, organization_type, google_id, avatar, is_approved, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, // Ensure created_at and updated_at are set
        [
          userData.name,
          userData.email,
          hashedPassword, // This can be null if password not provided
          userData.role || "partner", // Default role
          userData.organization,
          userData.organization_type, // Corrected field name
          userData.googleId || null,
          userData.avatar || null,
          userData.is_approved || false, // Default to not approved
        ],
      )

      // Return the newly created user's ID and other non-sensitive data
      // Exclude password from the returned object
      const { password, ...newUser } = userData;
      return { id: result.insertId, ...newUser, is_approved: userData.is_approved || false, googleId: userData.googleId || null, avatar: userData.avatar || null };

    } catch (error) {
      // Check for duplicate email error (ER_DUP_ENTRY)
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("for key 'users.email'")) {
        throw new Error('Email already exists.');
      }
      console.error("Error in User.create:", error);
      throw error;
    }
  },

  // Update user
  update: async (id, userData) => {
    try {
      let query = "UPDATE users SET ";
      const values = [];
      const updateFields = [];

      // Only update fields that are provided
      if (userData.name !== undefined) {
        updateFields.push("name = ?");
        values.push(userData.name);
      }

      if (userData.email !== undefined) {
        updateFields.push("email = ?");
        values.push(userData.email);
      }

      if (userData.password) { // Only hash and update if a new password is provided
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        updateFields.push("password = ?");
        values.push(hashedPassword);
      }

      if (userData.role !== undefined) {
        updateFields.push("role = ?");
        values.push(userData.role);
      }

      if (userData.organization !== undefined) {
        updateFields.push("organization = ?");
        values.push(userData.organization);
      }

      if (userData.organization_type !== undefined) { // Corrected field name
        updateFields.push("organization_type = ?");
        values.push(userData.organization_type);
      }

      if (userData.google_id !== undefined) {
        updateFields.push("google_id = ?");
        values.push(userData.google_id);
      }

      if (userData.avatar !== undefined) {
        updateFields.push("avatar = ?");
        values.push(userData.avatar);
      }

      if (userData.is_approved !== undefined) {
        updateFields.push("is_approved = ?");
        values.push(userData.is_approved);
      }

      if (userData.approved_by !== undefined) { // Can be null
        updateFields.push("approved_by = ?");
        values.push(userData.approved_by);
      }

      if (userData.approved_at !== undefined) { // Can be null
        updateFields.push("approved_at = ?");
        values.push(userData.approved_at);
      }

      if (userData.reset_token !== undefined) {
        updateFields.push("reset_token = ?");
        values.push(userData.reset_token);
      }

      if (userData.reset_token_expires !== undefined) {
        updateFields.push("reset_token_expires = ?");
        values.push(userData.reset_token_expires);
      }

      // If no fields to update (excluding updated_at), return current user data
      if (updateFields.length === 0) {
        // Still, we should fetch and return the user to reflect any potential background changes
        // or simply return the input data if no actual update was needed.
        // For now, let's fetch the user data to be safe.
        const [currentUser] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
        if (currentUser.length > 0) {
          // Exclude password before returning
          const { password, ...userWithoutPassword } = currentUser[0];
          return userWithoutPassword;
        }
        return { id, message: "No fields provided to update." }; // Or throw an error/return null
      }

      // Always update the updated_at timestamp
      updateFields.push("updated_at = CURRENT_TIMESTAMP");

      query += updateFields.join(", ") + " WHERE id = ?";
      values.push(id);

      await pool.query(query, values);

      // Fetch and return the updated user data to confirm changes
      // This ensures all fields, including those set by DB triggers or CURRENT_TIMESTAMP, are fresh
      const [updatedRows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
      if (updatedRows.length > 0) {
        // Exclude password before returning
        const { password, ...userWithoutPassword } = updatedRows[0];
        return userWithoutPassword;
      }
      // Should not happen if update was successful and ID is correct
      throw new Error("Failed to retrieve user after update.");

    } catch (error) {
      // Check for duplicate email error on update
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("for key 'users.email'")) {
        throw new Error('Email already exists.');
      }
      console.error("Error in User.update:", error);
      throw error;
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      await pool.query("DELETE FROM users WHERE id = ?", [id])
      return { id }
    } catch (error) {
      throw error
    }
  },

  // Get all users
  getAll: async () => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, email, role, is_approved, created_at, organization, organization_type, avatar, approved_by, approved_at, google_id, updated_at FROM users",
      )
      // Convert is_approved to boolean if it's stored as TINYINT(1)
      return rows.map(user => ({
        ...user,
        is_approved: Boolean(user.is_approved)
      }));
    } catch (error) {
      throw error
    }
  },

  // Compare password
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword)
  },
}

module.exports = User
