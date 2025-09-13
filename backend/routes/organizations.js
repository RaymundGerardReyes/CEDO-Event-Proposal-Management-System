// backend/routes/organizations.js
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/database'); // Universal database connection

router.post('/create', async (req, res) => {
  const {
    organizationName,
    organizationTypes,
    organizationDescription,
    contactName,
    contactEmail,
    contactPhone,
  } = req.body;

  try {
    // Validate required fields
    if (!organizationName || !contactName || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Organization name, contact name, and contact email are required'
      });
    }

    // Insert into organizations table using pool.query
    const [orgResult] = await pool.query(
      'INSERT INTO organizations (name, description, contact_name, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?)',
      [organizationName, organizationDescription, contactName, contactEmail, contactPhone]
    );
    const organizationId = orgResult.insertId;

    // Insert into organization_type_links using proper type_id lookup
    if (organizationTypes && organizationTypes.length > 0) {
      for (const typeName of organizationTypes) {
        // Look up the type_id from organization_types table
        const [typeResult] = await pool.query(
          'SELECT id FROM organization_types WHERE name = ?',
          [typeName]
        );

        if (typeResult.length > 0) {
          const typeId = typeResult[0].id;
          await pool.query(
            'INSERT INTO organization_type_links (organization_id, type_id) VALUES (?, ?)',
            [organizationId, typeId]
          );
        } else {
          console.warn(`Organization type '${typeName}' not found in organization_types table`);
        }
      }
    }

    res.status(201).json({ success: true, organizationId });
  } catch (err) {
    console.error('Database error in organizations/create:', err);

    // Check for specific MySQL errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        success: false,
        error: 'Database tables not initialized. Please run the database initialization script.'
      });
    }

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Organization with this information already exists'
      });
    }

    res.status(500).json({ success: false, error: 'Database operation failed' });
  }
});

module.exports = router;