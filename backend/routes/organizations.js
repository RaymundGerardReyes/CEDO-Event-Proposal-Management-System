// backend/routes/organizations.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database-postgresql-only'); // Universal database connection

// GET /api/organizations - Get all organizations for autocomplete
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        contact_name,
        contact_email,
        contact_phone,
        organization_type,
        is_active,
        created_at
      FROM organizations 
      WHERE is_active = true
      ORDER BY name ASC
    `);

    const organizations = result.rows.map(org => ({
      id: org.id,
      name: org.name,
      description: org.description,
      contactName: org.contact_name,
      contactEmail: org.contact_email,
      contactPhone: org.contact_phone,
      organizationType: org.organization_type,
      isActive: org.is_active,
      verified: true, // All organizations in DB are considered verified
      createdAt: org.created_at
    }));

    res.json({
      success: true,
      organizations
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations',
      details: error.message
    });
  }
});

// GET /api/organizations/search - Search organizations by name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        organizations: []
      });
    }

    const result = await query(`
      SELECT 
        id,
        name,
        description,
        contact_name,
        contact_email,
        contact_phone,
        organization_type,
        is_active
      FROM organizations 
      WHERE is_active = true 
        AND LOWER(name) LIKE LOWER($1)
      ORDER BY name ASC
      LIMIT 20
    `, [`%${q}%`]);

    const organizations = result.rows.map(org => ({
      id: org.id,
      name: org.name,
      description: org.description,
      contactName: org.contact_name,
      contactEmail: org.contact_email,
      contactPhone: org.contact_phone,
      organizationType: org.organization_type,
      isActive: org.is_active,
      verified: true,
      type: getOrganizationTypeLabel(org.organization_type)
    }));

    res.json({
      success: true,
      organizations
    });

  } catch (error) {
    console.error('Error searching organizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search organizations',
      details: error.message
    });
  }
});

// POST /api/organizations - Create new organization
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      contactName,
      contactEmail,
      contactPhone,
      organizationType = 'school-based'
    } = req.body;

    // Validate required fields
    if (!name || !contactName || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Organization name, contact name, and contact email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Insert into organizations table using PostgreSQL syntax
    // Note: We'll use a workaround for the email_smtp_config constraint
    const result = await query(`
      INSERT INTO organizations (name, description, contact_name, contact_email, contact_phone, organization_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, contact_name, contact_email, contact_phone, organization_type, is_active, created_at
    `, [name, description, contactName, contactEmail, contactPhone, organizationType]);

    const newOrg = result.rows[0];

    res.status(201).json({
      success: true,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        description: newOrg.description,
        contactName: newOrg.contact_name,
        contactEmail: newOrg.contact_email,
        contactPhone: newOrg.contact_phone,
        organizationType: newOrg.organization_type,
        isActive: newOrg.is_active,
        verified: true,
        createdAt: newOrg.created_at
      }
    });

  } catch (error) {
    console.error('Error creating organization:', error);

    // Handle PostgreSQL specific errors
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Organization with this name already exists'
      });
    }

    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({
        success: false,
        error: 'Invalid organization type'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create organization',
      details: error.message
    });
  }
});

// Helper function to get organization type label
function getOrganizationTypeLabel(type) {
  const typeLabels = {
    'school-based': 'Educational Institution',
    'community-based': 'Community Organization',
    'internal': 'Internal Organization',
    'external': 'External Organization'
  };
  return typeLabels[type] || 'Organization';
}

module.exports = router;