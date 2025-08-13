/**
 * =============================================
 * PROPOSAL SERVICE - Event Proposal Management
 * =============================================
 * 
 * This service handles all proposal-related operations including creation,
 * updates, validation, and status management. It implements hybrid storage
 * architecture with MySQL for relational data and MongoDB for file metadata.
 * 
 * @module services/proposal.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Proposal creation and validation
 * - Status management and tracking
 * - File attachment handling
 * - Search and filtering
 * - Data validation and sanitization
 * - Hybrid MySQL + MongoDB storage
 * - Event type classification
 */

const { pool } = require('../config/db');
const { getDb } = require('../utils/db');
const { Binary } = require('mongodb');
const path = require("path");
const Proposal = require("../models/Proposal");
const ROLES = require('../constants/roles');
const transporter = require('../config/nodemailer.config');
const User = require("../models/User");
const fs = require("fs");

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate proposal data structure
 * 
 * @param {Object} proposalData - Proposal data to validate
 * @returns {Object} Validation result
 */
const validateProposalData = (proposalData) => {
  const errors = [];

  // Required fields validation
  if (!proposalData.organization_name || proposalData.organization_name.trim() === '') {
    errors.push('Organization name is required');
  }

  if (!proposalData.contact_name || proposalData.contact_name.trim() === '') {
    errors.push('Contact person name is required');
  }

  if (!proposalData.contact_email || proposalData.contact_email.trim() === '') {
    errors.push('Contact email is required');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (proposalData.contact_email && !emailRegex.test(proposalData.contact_email)) {
    errors.push('Invalid email format');
  }

  if (!proposalData.organization_type || proposalData.organization_type.trim() === '') {
    errors.push('Organization type is required');
  }

  // Event details validation
  if (!proposalData.event_name || proposalData.event_name.trim() === '') {
    errors.push('Event name is required');
  }

  if (!proposalData.event_venue || proposalData.event_venue.trim() === '') {
    errors.push('Event venue is required');
  }

  if (!proposalData.event_start_date) {
    errors.push('Event start date is required');
  }

  if (!proposalData.event_end_date) {
    errors.push('Event end date is required');
  }

  // Date validation
  if (proposalData.event_start_date && proposalData.event_end_date) {
    const startDate = new Date(proposalData.event_start_date);
    const endDate = new Date(proposalData.event_end_date);

    if (startDate > endDate) {
      errors.push('End date cannot be earlier than start date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize proposal data for database storage
 * 
 * @param {Object} rawData - Raw proposal data
 * @returns {Object} Sanitized proposal data
 */
const sanitizeProposalData = (rawData) => {
  return {
    organization_name: rawData.organization_name?.trim(),
    organization_type: rawData.organization_type?.trim(),
    organization_description: rawData.organization_description?.trim() || '',
    contact_name: rawData.contact_name?.trim(),
    contact_email: rawData.contact_email?.trim().toLowerCase(),
    contact_phone: rawData.contact_phone?.trim() || '',
    event_name: rawData.event_name?.trim(),
    event_venue: rawData.event_venue?.trim(),
    event_mode: rawData.event_mode?.trim() || 'offline',
    event_start_date: rawData.event_start_date,
    event_end_date: rawData.event_end_date,
    event_start_time: rawData.event_start_time || '',
    event_end_time: rawData.event_end_time || '',
    school_event_type: rawData.school_event_type || rawData.event_type || '',
    community_event_type: rawData.community_event_type || rawData.event_type || '',
    proposal_status: rawData.proposal_status || 'draft',
    return_service_credit: rawData.return_service_credit || '0',
    target_audience: rawData.target_audience || '[]',
    created_at: new Date(),
    updated_at: new Date()
  };
};

/**
 * Build search query with filters
 * 
 * @param {Object} searchCriteria - Search criteria
 * @returns {Object} WHERE clause and parameters
 */
const buildSearchQuery = (searchCriteria) => {
  let where = 'WHERE 1=1';
  const params = [];

  if (searchCriteria.organization_name) {
    where += ' AND organization_name LIKE ?';
    params.push(`%${searchCriteria.organization_name.trim()}%`);
  }

  if (searchCriteria.contact_email) {
    where += ' AND contact_email = ?';
    params.push(searchCriteria.contact_email.trim().toLowerCase());
  }

  if (searchCriteria.proposal_status) {
    where += ' AND proposal_status = ?';
    params.push(searchCriteria.proposal_status);
  }

  if (searchCriteria.organization_type) {
    where += ' AND organization_type = ?';
    params.push(searchCriteria.organization_type);
  }

  if (searchCriteria.date_from) {
    where += ' AND created_at >= ?';
    params.push(searchCriteria.date_from);
  }

  if (searchCriteria.date_to) {
    where += ' AND created_at <= ?';
    params.push(searchCriteria.date_to);
  }

  return { where, params };
};

/**
 * Get MongoDB file metadata for a proposal
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} File metadata
 */
const getProposalFileMetadata = async (proposalId) => {
  try {
    const db = await getDb();
    const { GridFSBucket } = require('mongodb');
    const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

    const files = await bucket.find({ 'metadata.proposalId': proposalId.toString() }).toArray();

    const fileMetadata = {};
    files.forEach(file => {
      const fileType = file.metadata.fileType;
      if (fileType) {
        fileMetadata[fileType] = {
          name: file.filename,
          id: file._id.toString(),
          size: file.length,
          uploadDate: file.uploadDate,
          originalName: file.metadata.originalName
        };
      }
    });

    return fileMetadata;
  } catch (error) {
    console.error('Error fetching proposal file metadata:', error);
    return {};
  }
};

// =============================================
// PROPOSAL CRUD OPERATIONS
// =============================================

/**
 * Create a new proposal
 * 
 * @param {Object} proposalData - Proposal data
 * @returns {Promise<Object>} Created proposal with ID
 */
const createProposal = async (proposalData) => {
  try {
    console.log('📝 PROPOSAL: Creating new proposal');

    // Validate proposal data
    const validation = validateProposalData(proposalData);
    if (!validation.isValid) {
      throw new Error(`Proposal validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize data
    const sanitizedData = sanitizeProposalData(proposalData);

    // Insert into MySQL
    const [result] = await pool.query(
      `INSERT INTO proposals (
        organization_name, organization_type, organization_description,
        contact_name, contact_email, contact_phone,
        event_name, event_venue, event_mode,
        event_start_date, event_end_date, event_start_time, event_end_time,
        school_event_type, community_event_type,
        proposal_status, return_service_credit, target_audience,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sanitizedData.organization_name,
        sanitizedData.organization_type,
        sanitizedData.organization_description,
        sanitizedData.contact_name,
        sanitizedData.contact_email,
        sanitizedData.contact_phone,
        sanitizedData.event_name,
        sanitizedData.event_venue,
        sanitizedData.event_mode,
        sanitizedData.event_start_date,
        sanitizedData.event_end_date,
        sanitizedData.event_start_time,
        sanitizedData.event_end_time,
        sanitizedData.school_event_type,
        sanitizedData.community_event_type,
        sanitizedData.proposal_status,
        sanitizedData.return_service_credit,
        sanitizedData.target_audience,
        sanitizedData.created_at,
        sanitizedData.updated_at
      ]
    );

    const proposalId = result.insertId;

    console.log('✅ PROPOSAL: Successfully created proposal:', {
      id: proposalId,
      organization: sanitizedData.organization_name,
      status: sanitizedData.proposal_status
    });

    return {
      id: proposalId,
      ...sanitizedData,
      created_at: sanitizedData.created_at,
      updated_at: sanitizedData.updated_at
    };

  } catch (error) {
    console.error('❌ PROPOSAL: Error creating proposal:', error);
    throw new Error(`Failed to create proposal: ${error.message}`);
  }
};

/**
 * Get proposal by ID
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Proposal details with file metadata
 */
const getProposalById = async (proposalId) => {
  try {
    console.log('🔍 PROPOSAL: Fetching proposal by ID:', proposalId);

    // Get MySQL proposal data
    const [proposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposals.length === 0) {
      throw new Error('Proposal not found');
    }

    const proposal = proposals[0];

    // Get MongoDB file metadata
    const fileMetadata = await getProposalFileMetadata(proposalId);

    const enrichedProposal = {
      ...proposal,
      files: fileMetadata,
      hasFiles: Object.keys(fileMetadata).length > 0
    };

    console.log('✅ PROPOSAL: Successfully fetched proposal:', {
      id: proposalId,
      hasFiles: enrichedProposal.hasFiles
    });

    return enrichedProposal;

  } catch (error) {
    console.error('❌ PROPOSAL: Error fetching proposal:', error);
    throw new Error(`Failed to fetch proposal: ${error.message}`);
  }
};

/**
 * Update proposal
 * 
 * @param {string|number} proposalId - Proposal ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated proposal
 */
const updateProposal = async (proposalId, updateData) => {
  try {
    console.log('🔄 PROPOSAL: Updating proposal:', proposalId);

    // Validate update data
    const validation = validateProposalData({ ...updateData, id: proposalId });
    if (!validation.isValid) {
      throw new Error(`Update validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize update data
    const sanitizedData = sanitizeProposalData(updateData);
    sanitizedData.updated_at = new Date();

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.entries(sanitizedData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    updateValues.push(proposalId);

    const [result] = await pool.query(
      `UPDATE proposals SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      throw new Error('Proposal not found');
    }

    // Get updated proposal
    const updatedProposal = await getProposalById(proposalId);

    console.log('✅ PROPOSAL: Successfully updated proposal:', {
      id: proposalId,
      updatedFields: updateFields.length
    });

    return updatedProposal;

  } catch (error) {
    console.error('❌ PROPOSAL: Error updating proposal:', error);
    throw new Error(`Failed to update proposal: ${error.message}`);
  }
};

/**
 * Delete proposal
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<boolean>} Success status
 */
const deleteProposal = async (proposalId) => {
  try {
    console.log('🗑️ PROPOSAL: Deleting proposal:', proposalId);

    // Check if proposal exists
    const [proposals] = await pool.query(
      'SELECT id FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposals.length === 0) {
      throw new Error('Proposal not found');
    }

    // Delete from MySQL
    const [result] = await pool.query(
      'DELETE FROM proposals WHERE id = ?',
      [proposalId]
    );

    // TODO: Delete associated files from MongoDB GridFS
    // This would require additional implementation

    console.log('✅ PROPOSAL: Successfully deleted proposal:', proposalId);

    return true;

  } catch (error) {
    console.error('❌ PROPOSAL: Error deleting proposal:', error);
    throw new Error(`Failed to delete proposal: ${error.message}`);
  }
};

// =============================================
// SECTION-BASED PROPOSAL FUNCTIONS
// =============================================

/**
 * Save Section 2 proposal data (basic information)
 * 
 * @param {Object} data - Proposal data object
 * @param {string} data.title - Proposal title
 * @param {string} data.description - Proposal description
 * @param {string} data.category - Event category
 * @param {string} data.organizationType - Organization type
 * @param {string} data.contactPerson - Contact person name
 * @param {string} data.contactEmail - Contact email
 * @param {string} data.contactPhone - Contact phone
 * @param {string} data.startDate - Event start date
 * @param {string} data.endDate - Event end date
 * @param {string} data.location - Event location
 * @param {number} data.budget - Event budget
 * @param {string} data.objectives - Event objectives
 * @param {number} data.volunteersNeeded - Number of volunteers needed
 * @param {string} data.status - Proposal status (default: 'draft')
 * @param {number} data.proposal_id - Existing proposal ID (for updates)
 * 
 * @returns {Promise<Object>} Result object with proposal ID
 */
const saveSection2Data = async (data) => {
  const {
    title, description, category, organizationType,
    contactPerson, contactEmail, contactPhone,
    startDate, endDate, location, budget, objectives, volunteersNeeded,
    status = 'draft',
    proposal_id
  } = data;

  if (!title || !contactPerson || !contactEmail) {
    throw new Error('Missing required fields');
  }

  if (proposal_id) {
    const updateQuery = `
        UPDATE proposals 
        SET 
          title = ?, description = ?, category = ?, organizationType = ?,
          contactPerson = ?, contactEmail = ?, contactPhone = ?,
          startDate = ?, endDate = ?, location = ?, budget = ?, 
          objectives = ?, volunteersNeeded = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

    const [result] = await pool.query(updateQuery, [
      title, description, category, organizationType,
      contactPerson, contactEmail, contactPhone,
      startDate, endDate, location, budget,
      objectives, volunteersNeeded, status,
      proposal_id
    ]);
    return { id: proposal_id, affectedRows: result.affectedRows };
  } else {
    const insertQuery = `
        INSERT INTO proposals (
          title, description, category, organizationType,
          contactPerson, contactEmail, contactPhone,
          startDate, endDate, location, budget,
          objectives, volunteersNeeded, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

    const [result] = await pool.query(insertQuery, [
      title, description, category, organizationType,
      contactPerson, contactEmail, contactPhone,
      startDate, endDate, location, budget,
      objectives, volunteersNeeded, status
    ]);
    return { id: result.insertId };
  }
};

/**
 * Save Section 2 organization data (enhanced version with validation)
 * 
 * This function handles organization-specific proposal data with enhanced validation
 * and proper field mapping for the database schema.
 * 
 * @param {Object} data - Proposal data object (same structure as saveSection2Data)
 * @returns {Promise<Object>} Result object with proposal ID
 */
const saveSection2OrgData = async (data) => {
  const {
    title, description, category, organizationType,
    contactPerson, contactEmail, contactPhone,
    startDate, endDate, location, budget, objectives, volunteersNeeded,
    status = 'draft',
    proposal_id
  } = data;

  let validatedOrganizationType = organizationType;
  const validTypes = ['school-based', 'community-based'];
  if (!validTypes.includes(validatedOrganizationType)) {
    console.warn(
      `[WARN] Invalid 'organizationType' received: "${validatedOrganizationType}". ` +
      `Defaulting to 'school-based' to prevent database error.`
    );
    validatedOrganizationType = 'school-based';
  }

  if (!title || !contactPerson || !contactEmail) {
    throw new Error('Missing required fields');
  }

  if (proposal_id) {
    const updateQuery = `
          UPDATE proposals 
          SET organization_name = ?, organization_description = ?, organization_type = ?,
              contact_name = ?, contact_email = ?, contact_phone = ?,
              event_name = ?, event_venue = ?, event_start_date = ?, event_end_date = ?,
              event_start_time = ?, event_end_time = ?,
              school_event_type = ?, community_event_type = ?,
              proposal_status = ?, updated_at = NOW()
          WHERE id = ?
        `;
    // Use the actual event type from the data instead of hardcoding
    // The event type should be passed from the frontend based on user selection
    const schoolEventType = validatedOrganizationType === 'school-based' ? (data.school_event_type || 'other') : null;
    const communityEventType = validatedOrganizationType === 'community-based' ? (data.community_event_type || 'other') : null;

    const updateValues = [
      title, description, validatedOrganizationType,
      contactPerson, contactEmail, contactPhone,
      title + ' Event', location || 'TBD',
      startDate || '2025-01-01',
      endDate || '2025-01-01',
      '09:00:00', '17:00:00',
      schoolEventType,
      communityEventType,
      status, proposal_id
    ];

    const [updateResult] = await pool.query(updateQuery, updateValues);
    if (updateResult.affectedRows === 0) {
      throw new Error('Proposal not found');
    }
    return { id: proposal_id };
  } else {
    const insertQuery = `
          INSERT INTO proposals (
            organization_name, organization_description, organization_type,
            contact_name, contact_email, contact_phone,
            event_name, event_venue, event_start_date, event_end_date,
            event_start_time, event_end_time,
            school_event_type, community_event_type,
            proposal_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

    // Use the actual event type from the data instead of hardcoding
    // The event type should be passed from the frontend based on user selection
    const schoolEventType = validatedOrganizationType === 'school-based' ? (data.school_event_type || 'other') : null;
    const communityEventType = validatedOrganizationType === 'community-based' ? (data.community_event_type || 'other') : null;

    const insertValues = [
      title, description, validatedOrganizationType,
      contactPerson, contactEmail, contactPhone,
      title + ' Event', location || 'TBD',
      startDate || '2025-01-01',
      endDate || '2025-01-01',
      '09:00:00', '17:00:00',
      schoolEventType,
      communityEventType,
      status
    ];

    const [insertResult] = await pool.query(insertQuery, insertValues);
    return { id: insertResult.insertId };
  }
};

/**
 * Save Section 3 event data (event details and status transition)
 * 
 * This function handles event-specific data and manages status transitions:
 * - Updates event venue, dates, times, and types
 * - Automatically transitions from 'draft' to 'pending' status
 * - Validates proposal existence before updates
 * 
 * @param {Object} data - Event data object
 * @param {number} data.proposal_id - Proposal ID to update
 * @param {string} data.venue - Event venue
 * @param {string} data.start_date - Event start date
 * @param {string} data.end_date - Event end date
 * @param {string} data.time_start - Event start time
 * @param {string} data.time_end - Event end time
 * @param {string} data.event_type - Type of event
 * @param {string} data.event_mode - Event mode (online/offline)
 * 
 * @returns {Promise<Object>} Result object with status transition info
 */
const saveSection3EventData = async (data) => {
  const {
    proposal_id, venue, start_date, end_date, time_start, time_end,
    event_type, event_mode
  } = data;

  if (!proposal_id) {
    throw new Error('Missing required field: proposal_id');
  }

  const [currentProposal] = await pool.query(
    'SELECT proposal_status FROM proposals WHERE id = ?',
    [proposal_id]
  );

  if (currentProposal.length === 0) {
    throw new Error('Proposal not found');
  }

  const currentStatus = currentProposal[0].proposal_status;
  let nextStatus = currentStatus;
  if (currentStatus === 'draft') {
    nextStatus = 'pending';
  }

  const updateQuery = `
      UPDATE proposals 
      SET event_venue = ?, 
          event_start_date = ?, 
          event_end_date = ?,
          event_start_time = ?, 
          event_end_time = ?,
          school_event_type = ?,
          event_mode = ?,
          proposal_status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

  const updateValues = [
    venue || 'TBD',
    start_date || null,
    end_date || null,
    time_start || null,
    time_end || null,
    event_type || 'other',
    event_mode || 'offline',
    nextStatus,
    proposal_id
  ];

  const [updateResult] = await pool.query(updateQuery, updateValues);
  if (updateResult.affectedRows === 0) {
    throw new Error('Proposal not found or could not be updated');
  }

  const [verifyProposal] = await pool.query(
    'SELECT proposal_status FROM proposals WHERE id = ?',
    [proposal_id]
  );

  return {
    id: proposal_id,
    previousStatus: currentStatus,
    newStatus: verifyProposal[0]?.proposal_status,
    autoPromoted: currentStatus === 'draft' && verifyProposal[0]?.proposal_status === 'pending'
  };
};

// =============================================
// DEBUG AND UTILITY FUNCTIONS
// =============================================

/**
 * Get debug proposal information from both MySQL and MongoDB
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Debug information from both databases
 */
const getDebugProposalInfo = async (proposalId) => {
  console.log('🔍 DEBUG: Getting proposal info for ID:', proposalId);

  // Helper to check for valid ObjectId
  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);
  // Helper to check for numeric ID
  const isNumericId = (id) => /^\d+$/.test(id);

  // Use Promise.all for parallel execution to improve performance
  const [mongoResult, mysqlResult] = await Promise.allSettled([
    // MongoDB query
    (async () => {
      try {
        let mongoProposal = null;
        if (isValidObjectId(proposalId)) {
          try {
            const objectId = require('mongoose').Types.ObjectId(proposalId);
            mongoProposal = await Proposal.findById(objectId);
          } catch (idError) {
            console.log('🔍 DEBUG: Could not convert to ObjectId:', idError.message);
          }
        }
        // Try to find by proposal_id field (if not found by ObjectId)
        if (!mongoProposal) {
          try {
            mongoProposal = await Proposal.findOne({ proposal_id: proposalId });
          } catch (queryError) {
            console.log('🔍 DEBUG: Alternative query also failed:', queryError.message);
          }
        }
        return {
          found: !!mongoProposal,
          data: mongoProposal ? {
            id: mongoProposal._id,
            title: mongoProposal.title,
            contactEmail: mongoProposal.contactEmail,
            status: mongoProposal.status
          } : null
        };
      } catch (mongoError) {
        console.log('🔍 DEBUG: MongoDB query failed:', mongoError.message);
        return { found: false, data: null, error: mongoError.message };
      }
    })(),

    // MySQL query (only if numeric ID)
    (async () => {
      try {
        if (!isNumericId(proposalId)) return { found: false, data: null, error: 'Not a numeric ID' };
        const [rows] = await pool.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);
        const mysqlProposal = rows[0] || null;
        return {
          found: !!mysqlProposal,
          data: mysqlProposal ? {
            id: mysqlProposal.id,
            organization_name: mysqlProposal.organization_name,
            contact_email: mysqlProposal.contact_email,
            proposal_status: mysqlProposal.proposal_status
          } : null
        };
      } catch (mysqlError) {
        console.log('🔍 DEBUG: MySQL query failed:', mysqlError.message);
        return { found: false, data: null, error: mysqlError.message };
      }
    })()
  ]);

  const result = {
    mongodb: mongoResult.status === 'fulfilled' ? mongoResult.value : { found: false, data: null, error: 'Promise rejected' },
    mysql: mysqlResult.status === 'fulfilled' ? mysqlResult.value : { found: false, data: null, error: 'Promise rejected' }
  };

  // User-friendly error if neither found
  if (!result.mongodb.found && !result.mysql.found) {
    result.error = 'Proposal not found in either database. Please check your ID or complete Section 2 first.';
  }

  console.log('🔍 DEBUG: Query results:', {
    mongodb: result.mongodb.found,
    mysql: result.mysql.found,
    hasData: result.mongodb.found || result.mysql.found
  });

  return result;
};

/**
 * Search proposal by organization name and contact email
 * 
 * @param {string} organization_name - Organization name
 * @param {string} contact_email - Contact email
 * @returns {Promise<Object|null>} Found proposal or null
 */
const searchProposal = async (organization_name, contact_email) => {
  if (!organization_name || !contact_email) {
    throw new Error('Missing required search parameters');
  }

  const searchQuery = `
      SELECT id, organization_name, contact_email, proposal_status, created_at
      FROM proposals 
      WHERE organization_name = ? AND contact_email = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;

  const [rows] = await pool.query(searchQuery, [organization_name, contact_email]);

  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

// =============================================
// MONGODB PROPOSAL FUNCTIONS (Legacy Support)
// =============================================

/**
 * Create MongoDB proposal (legacy function)
 * 
 * @param {Object} user - User object
 * @param {Object} proposalData - Proposal data
 * @param {Array} files - File attachments
 * @returns {Promise<Object>} Created MongoDB proposal
 */
const createMongoProposal = async (user, proposalData, files) => {
  const {
    title, description, category, startDate, endDate, location, budget,
    objectives, volunteersNeeded, organizationType, contactPerson,
    contactEmail, contactPhone, status
  } = proposalData;

  const documents = files ? files.map((file) => ({
    name: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  })) : [];

  const proposal = new Proposal({
    title,
    description,
    category,
    startDate,
    endDate,
    location,
    budget,
    objectives,
    volunteersNeeded,
    submitter: user.id,
    organizationType,
    contactPerson,
    contactEmail,
    contactPhone,
    status: status || "pending",
    documents,
  });

  await proposal.save();

  // Async email notification
  sendNewProposalEmail(proposal, user);

  return proposal;
};

/**
 * Send new proposal email notification
 * 
 * @param {Object} proposal - Proposal object
 * @param {Object} user - User object
 */
const sendNewProposalEmail = async (proposal, user) => {
  try {
    const reviewers = await User.find({ role: ROLES.REVIEWER });

    if (reviewers.length > 0) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        bcc: reviewers.map(r => r.email),
        subject: "New Partnership Proposal Submitted",
        text: `Hello Reviewer,\n\nA new partnership proposal titled "${proposal.title}" has been submitted by ${user.name || user.email} and is awaiting your review.\n\nView proposal here: ${process.env.FRONTEND_URL}/proposals/${proposal._id}\n\nRegards,\nCEDO Team`,
        html: `<p>Hello Reviewer,</p><p>A new partnership proposal titled "<strong>${proposal.title}</strong>" has been submitted by ${user.name || user.email} and is awaiting your review.</p><p><a href="${process.env.FRONTEND_URL}/proposals/${proposal._id}">View Proposal Details</a></p><p>Regards,<br>CEDO Team</p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email notification failed:", error);
        } else {
          console.log("Email notification sent:", info.response);
        }
      });
    } else {
      console.log("No users found with role 'reviewer' to notify.");
    }
  } catch (emailErr) {
    console.error("Error finding reviewers or preparing email:", emailErr.message);
  }
};

/**
 * Get MongoDB proposals with filters
 * 
 * @param {Object} user - User object
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Array of MongoDB proposals
 */
const getMongoProposals = async (user, filters) => {
  const query = {};
  const requestingUserRole = user.role;

  if (requestingUserRole === ROLES.STUDENT || requestingUserRole === ROLES.PARTNER) {
    query.submitter = user.id;
  }

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.organizationType) {
    query.organizationType = filters.organizationType;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
    ];
  }

  const proposals = await Proposal.find(query)
    .populate("submitter", "name email organization")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  return proposals;
};

/**
 * Get MongoDB proposal by ID
 * 
 * @param {string} proposalId - MongoDB proposal ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} MongoDB proposal
 */
const getMongoProposalById = async (proposalId, user) => {
  const proposal = await Proposal.findById(proposalId)
    .populate("submitter", "name email organization")
    .populate("assignedTo", "name email")
    .populate("reviewComments.reviewer", "name email role");

  if (!proposal) {
    return null;
  }

  if (user.role === ROLES.PARTNER && proposal.submitter && proposal.submitter._id.toString() !== user.id) {
    const error = new Error("Not authorized to view this proposal");
    error.statusCode = 403;
    throw error;
  }

  return proposal;
};

/**
 * Update MongoDB proposal
 * 
 * @param {string} proposalId - MongoDB proposal ID
 * @param {Object} user - User object
 * @param {Object} updateData - Update data
 * @param {Array} files - File attachments
 * @returns {Promise<Object>} Updated MongoDB proposal
 */
const updateMongoProposal = async (proposalId, user, updateData, files) => {
  let proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  const isOwner = proposal.submitter.toString() === user.id;
  const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(user.role);

  if (!isOwner && !isAdminOrManager) {
    const err = new Error("Not authorized to update this proposal");
    err.statusCode = 403;
    throw err;
  }

  if (isOwner && !["draft", "pending"].includes(proposal.status)) {
    const err = new Error("Cannot update proposals that are not in 'draft' or 'pending' status");
    err.statusCode = 403;
    throw err;
  }

  if (files && files.length > 0) {
    const newDocuments = files.map((file) => ({
      name: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    }));
    updateData.documents = [...proposal.documents, ...newDocuments];
  }

  const updateFields = { ...updateData };
  if (!isAdminOrManager && updateFields.status !== undefined && updateFields.status !== proposal.status) {
    delete updateFields.status;
  }

  proposal = await Proposal.findByIdAndUpdate(
    proposalId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  return proposal;
};

/**
 * Delete MongoDB proposal
 * 
 * @param {string} proposalId - MongoDB proposal ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Deletion result
 */
const deleteMongoProposal = async (proposalId, user) => {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  const isOwner = proposal.submitter.toString() === user.id;
  const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(user.role);

  if (!isOwner && !isAdminOrManager) {
    const err = new Error("Not authorized to delete this proposal");
    err.statusCode = 403;
    throw err;
  }

  if (isOwner && !["draft", "pending"].includes(proposal.status)) {
    const err = new Error("Cannot delete proposals that have been approved or rejected");
    err.statusCode = 403;
    throw err;
  }

  const deleteFilePromises = proposal.documents.map((doc) => {
    return new Promise((resolve) => {
      fs.unlink(doc.path, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${doc.path}`, err.message);
        } else {
          console.log(`Deleted file: ${doc.path}`);
        }
        resolve();
      });
    });
  });

  await Promise.all(deleteFilePromises);
  await Proposal.findByIdAndDelete(proposalId);

  return { msg: "Proposal removed" };
};

// =============================================
// SEARCH AND FILTERING FUNCTIONS
// =============================================

/**
 * Search proposals by criteria
 * 
 * @param {Object} searchCriteria - Search criteria
 * @returns {Promise<Array>} Matching proposals
 */
const searchProposals = async (searchCriteria) => {
  try {
    console.log('🔍 PROPOSAL: Searching proposals with criteria:', searchCriteria);

    const { where, params } = buildSearchQuery(searchCriteria);

    const [proposals] = await pool.query(
      `SELECT * FROM proposals ${where} ORDER BY created_at DESC`,
      params
    );

    console.log('✅ PROPOSAL: Search completed:', {
      criteria: searchCriteria,
      results: proposals.length
    });

    return proposals;

  } catch (error) {
    console.error('❌ PROPOSAL: Error searching proposals:', error);
    throw new Error(`Failed to search proposals: ${error.message}`);
  }
};

/**
 * Get proposals by status
 * 
 * @param {string} status - Proposal status
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Proposals with given status
 */
const getProposalsByStatus = async (status, options = {}) => {
  try {
    console.log('📋 PROPOSAL: Fetching proposals by status:', status);

    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const [proposals] = await pool.query(
      `SELECT * FROM proposals 
             WHERE proposal_status = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    console.log('✅ PROPOSAL: Successfully fetched proposals by status:', {
      status: status,
      count: proposals.length,
      page: page,
      limit: limit
    });

    return proposals;

  } catch (error) {
    console.error('❌ PROPOSAL: Error fetching proposals by status:', error);
    throw new Error(`Failed to fetch proposals by status: ${error.message}`);
  }
};

// =============================================
// STATUS MANAGEMENT FUNCTIONS
// =============================================

/**
 * Update proposal status
 * 
 * @param {string|number} proposalId - Proposal ID
 * @param {string} newStatus - New status
 * @returns {Promise<Object>} Updated proposal
 */
const updateProposalStatus = async (proposalId, newStatus) => {
  try {
    console.log('🔄 PROPOSAL: Updating proposal status:', {
      proposalId: proposalId,
      newStatus: newStatus
    });

    const validStatuses = ['draft', 'submitted', 'approved', 'rejected', 'denied'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }

    const [result] = await pool.query(
      'UPDATE proposals SET proposal_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, proposalId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Proposal not found');
    }

    const updatedProposal = await getProposalById(proposalId);

    console.log('✅ PROPOSAL: Successfully updated proposal status:', {
      proposalId: proposalId,
      newStatus: newStatus
    });

    return updatedProposal;

  } catch (error) {
    console.error('❌ PROPOSAL: Error updating proposal status:', error);
    throw new Error(`Failed to update proposal status: ${error.message}`);
  }
};

/**
 * Get proposal statistics
 * 
 * @returns {Promise<Object>} Proposal statistics
 */
const getProposalStats = async () => {
  try {
    console.log('📊 PROPOSAL: Generating proposal statistics');

    const [stats] = await pool.query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN proposal_status = 'draft' THEN 1 ELSE 0 END) as drafts,
            SUM(CASE WHEN proposal_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN proposal_status IN ('rejected', 'denied') THEN 1 ELSE 0 END) as rejected
          FROM proposals
        `);

    console.log('✅ PROPOSAL: Successfully generated statistics');

    return stats[0];

  } catch (error) {
    console.error('❌ PROPOSAL: Error generating statistics:', error);
    throw new Error(`Failed to generate proposal statistics: ${error.message}`);
  }
};

// =============================================
// EXPORT FUNCTIONS
// =============================================

module.exports = {
  // CRUD Operations
  createProposal,
  getProposalById,
  updateProposal,
  deleteProposal,

  // Section-based Functions
  saveSection2Data,
  saveSection2OrgData,
  saveSection3EventData,

  // Debug and Utility Functions
  getDebugProposalInfo,
  searchProposal,

  // MongoDB Legacy Functions
  createMongoProposal,
  getMongoProposals,
  getMongoProposalById,
  updateMongoProposal,
  deleteMongoProposal,

  // Search and Filtering
  searchProposals,
  getProposalsByStatus,

  // Status Management
  updateProposalStatus,
  getProposalStats,

  // Utility Functions
  validateProposalData,
  sanitizeProposalData,
  buildSearchQuery,
  getProposalFileMetadata
}; 