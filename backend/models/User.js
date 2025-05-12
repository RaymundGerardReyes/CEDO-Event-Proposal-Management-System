const { pool } = require("../config/db")
const bcrypt = require("bcryptjs")

const User = {
  // Find user by ID
  findById: async (id) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, email, role, organization, organizationType, avatar, createdAt FROM users WHERE id = ?",
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
      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(userData.password, salt)

      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, organization, organizationType, google_id, avatar) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.name,
          userData.email,
          hashedPassword,
          userData.role || "partner",
          userData.organization,
          userData.organizationType,
          userData.googleId || null,
          userData.avatar || null,
        ],
      )

      return { id: result.insertId, ...userData, password: undefined }
    } catch (error) {
      throw error
    }
  },

  // Update user
  update: async (id, userData) => {
    try {
      let query = "UPDATE users SET "
      const values = []
      const updateFields = []

      // Only update fields that are provided
      if (userData.name) {
        updateFields.push("name = ?")
        values.push(userData.name)
      }

      if (userData.email) {
        updateFields.push("email = ?")
        values.push(userData.email)
      }

      if (userData.password) {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(userData.password, salt)
        updateFields.push("password = ?")
        values.push(hashedPassword)
      }

      if (userData.role) {
        updateFields.push("role = ?")
        values.push(userData.role)
      }

      if (userData.organization) {
        updateFields.push("organization = ?")
        values.push(userData.organization)
      }

      if (userData.organizationType) {
        updateFields.push("organizationType = ?")
        values.push(userData.organizationType)
      }

      if (userData.googleId) {
        updateFields.push("google_id = ?")
        values.push(userData.googleId)
      }

      if (userData.avatar) {
        updateFields.push("avatar = ?")
        values.push(userData.avatar)
      }

      if (userData.resetPasswordToken) {
        updateFields.push("resetPasswordToken = ?")
        values.push(userData.resetPasswordToken)
      }

      if (userData.resetPasswordExpire) {
        updateFields.push("resetPasswordExpire = ?")
        values.push(userData.resetPasswordExpire)
      }

      // If no fields to update, return
      if (updateFields.length === 0) {
        return { id }
      }

      query += updateFields.join(", ") + " WHERE id = ?"
      values.push(id)

      await pool.query(query, values)

      return { id, ...userData }
    } catch (error) {
      throw error
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
        "SELECT id, name, email, role, organization, organizationType, avatar, createdAt FROM users",
      )
      return rows
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
