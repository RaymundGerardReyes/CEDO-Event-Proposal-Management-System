const express = require("express")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const multer = require("multer")
const path = require("path")
const fs = require("fs") // Used for file system operations
const Proposal = require("../models/Proposal") // Assuming Mongoose Model
const User = require("../models/User") // Assuming Mongoose Model (used for finding reviewers)
const { validateToken, validateAdmin } = require("../middleware/auth") // Updated JWT auth middleware
const checkRole = require("../middleware/roles") // Assuming role checking middleware (Note: your import path was checkRole, but middleware file was roles.js - using 'roles')
const nodemailer = require("nodemailer") // Used for sending emails
const { pool } = require('../config/db'); // Your MySQL connection
const mysql = require('mysql2/promise');

// ===================================================================
// MYSQL COMPATIBILITY FOR SECTION 2 ORGANIZATION DATA
// ===================================================================
// Simple route to handle Section 2 organization info saves

// Use the existing working database connection pool from config/db.js
// This ensures consistent MySQL connection configuration across the application

// --- Multer Configuration for File Uploads ---
// Fixed for Node.js 20+ compatibility - using promises version of fs
const fsPromises = require('fs').promises;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create proposal-specific upload directory
    const proposalId = req.body.proposal_id || 'draft_' + Date.now();
    const uploadDir = path.join(__dirname, '../uploads/proposals', proposalId.toString());

    // Use promises version of fs.mkdir to avoid callback issues in Node.js 20+
    fsPromises.mkdir(uploadDir, { recursive: true })
      .then(() => {
        cb(null, uploadDir);
      })
      .catch((error) => {
        cb(error);
      });
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const uniqueName = `${baseName}_${timestamp}${extension}`;
    cb(null, uniqueName);
  }
});

// Configures multer instance with storage, limits, and file type filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'));
    }
  }
});

// --- Nodemailer Configuration for Emails ---
// Creates a transporter object using SMTP or other service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", // Email service (e.g., 'gmail')
  auth: {
    user: process.env.EMAIL_USER, // Sender's email address (from .env)
    pass: process.env.EMAIL_PASSWORD, // Sender's email password/app-specific password (from .env)
  },
  // Optional: Add TLS/SSL options if needed by your service
  // secure: true, // true for 465, false for other ports
  // tls: {
  //   rejectUnauthorized: false // Use this with caution, only if absolutely necessary
  // }
})

// --- Roles Definition ---
// Assuming roles are defined similarly to auth.js or imported
const ROLES = {
  STUDENT: 'student', // Based on init-db.js, using 'student'
  HEAD_ADMIN: 'head_admin',
  MANAGER: 'manager',
  // 'partner' role used in your code - might need alignment with 'student'
  // 'reviewer' role used in your code - might need definition and handling
  PARTNER: 'partner', // Defined based on usage in routes
  REVIEWER: 'reviewer', // Defined based on usage in create route
  // Consider mapping 'partner' to 'student' if they are the same concept
};

// ===================================================================
// MYSQL COMPATIBILITY ROUTE FOR SECTION 2 (Testing without auth)
// ===================================================================

// @route   POST api/proposals/section2
// @desc    Save Section 2 organization data to MySQL (for testing)
// @access  Public (no auth required for testing)
router.post("/section2", async (req, res) => {
  console.log('📥 Backend: Received Section 2 organization data:', req.body);

  // 🔍 Debug the specific required fields
  console.log('🔍 Backend: Required field values:');
  console.log(`  title: "${req.body.title}" (type: ${typeof req.body.title}, length: ${req.body.title?.length || 0})`);
  console.log(`  contactPerson: "${req.body.contactPerson}" (type: ${typeof req.body.contactPerson}, length: ${req.body.contactPerson?.length || 0})`);
  console.log(`  contactEmail: "${req.body.contactEmail}" (type: ${typeof req.body.contactEmail}, length: ${req.body.contactEmail?.length || 0})`);

  const {
    title, description, category, organizationType,
    contactPerson, contactEmail, contactPhone,
    startDate, endDate, location, budget, objectives, volunteersNeeded,
    status = 'draft',
    proposal_id
  } = req.body;

  try {
    let connection;
    let result;

    // Basic validation
    if (!title || !contactPerson || !contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'contactPerson', 'contactEmail']
      });
    }

    // Use pool.query() directly like the main server does
    // connection = await pool.getConnection();

    if (proposal_id) {
      // Update existing proposal
      console.log('🔄 Updating existing proposal:', proposal_id);

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

      [result] = await pool.query(updateQuery, [
        title, description, category, organizationType,
        contactPerson, contactEmail, contactPhone,
        startDate, endDate, location, budget,
        objectives, volunteersNeeded, status,
        proposal_id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Proposal not found' });
      }

      res.json({
        id: proposal_id,
        message: 'Section 2 data updated successfully',
        affectedRows: result.affectedRows
      });

    } else {
      // Create new proposal
      console.log('✨ Creating new proposal from Section 2 data');

      const insertQuery = `
        INSERT INTO proposals (
          title, description, category, organizationType,
          contactPerson, contactEmail, contactPhone,
          startDate, endDate, location, budget,
          objectives, volunteersNeeded, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      [result] = await pool.query(insertQuery, [
        title, description, category, organizationType,
        contactPerson, contactEmail, contactPhone,
        startDate, endDate, location, budget,
        objectives, volunteersNeeded, status
      ]);

      res.status(201).json({
        id: result.insertId,
        message: 'Section 2 data saved successfully',
        insertId: result.insertId
      });
    }

    console.log('✅ MySQL Section 2 operation completed successfully');

  } catch (error) {
    console.error('❌ MySQL Error saving Section 2 data:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST api/proposals/section2-organization
// @desc    Save Section 2 organization data to MySQL proposals table
// @access  Public (no auth required for testing)
router.post("/section2-organization", async (req, res) => {
  console.log('📥 MySQL: Received Section 2 organization data:', req.body);

  // 🔍 Debug the specific required fields
  console.log('🔍 MySQL: Required field values:');
  console.log(`  title: "${req.body.title}" (type: ${typeof req.body.title}, length: ${req.body.title?.length || 0})`);
  console.log(`  contactPerson: "${req.body.contactPerson}" (type: ${typeof req.body.contactPerson}, length: ${req.body.contactPerson?.length || 0})`);
  console.log(`  contactEmail: "${req.body.contactEmail}" (type: ${typeof req.body.contactEmail}, length: ${req.body.contactEmail?.length || 0})`);

  const {
    title, description, category, organizationType,
    contactPerson, contactEmail, contactPhone,
    startDate, endDate, location, budget, objectives, volunteersNeeded,
    status = 'draft',
    proposal_id
  } = req.body;

  try {
    // Basic validation
    if (!title || !contactPerson || !contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'contactPerson', 'contactEmail'],
        received: {
          title: title || 'missing',
          contactPerson: contactPerson || 'missing',
          contactEmail: contactEmail || 'missing'
        }
      });
    }

    console.log('✅ MySQL: All required fields provided');

    let connection;

    try {
      // Use pool.query() directly like the main server does
      // connection = await pool.getConnection();

      // Check if updating existing proposal
      if (proposal_id) {
        console.log('🔄 MySQL: Updating existing proposal:', proposal_id);

        const updateQuery = `
          UPDATE proposals 
          SET organization_name = ?, organization_description = ?, organization_type = ?,
              contact_name = ?, contact_email = ?, contact_phone = ?,
              event_name = ?, event_venue = ?, event_start_date = ?, event_end_date = ?,
              event_start_time = ?, event_end_time = ?,
              school_event_type = ?, community_event_type = ?,
              proposal_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        // Set type-specific fields based on organization type
        const schoolEventType = organizationType === 'school-based' ? 'other' : null;
        const communityEventType = organizationType === 'community-based' ? 'others' : null;

        const updateValues = [
          title, description, organizationType,
          contactPerson, contactEmail, contactPhone,
          title + ' Event', location || 'TBD',
          startDate || '2025-01-01', // Default start date if not provided  
          endDate || '2025-01-01',   // Default end date if not provided
          '09:00:00', '17:00:00', // Default event times
          schoolEventType,        // Required for school-based
          communityEventType,     // Required for community-based
          status, proposal_id
        ];

        const [updateResult] = await pool.query(updateQuery, updateValues);

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({
            error: 'Proposal not found',
            proposal_id: proposal_id
          });
        }

        console.log('✅ MySQL: Proposal updated successfully:', proposal_id);

        res.status(200).json({
          id: proposal_id,
          message: 'Section 2 organization data updated successfully in MySQL',
          data: {
            title, description, category: category || 'partnership', organizationType,
            contactPerson, contactEmail, contactPhone, status
          },
          timestamp: new Date().toISOString()
        });

      } else {
        console.log('➕ MySQL: Creating new proposal');

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

        // Set type-specific fields based on organization type
        const schoolEventType = organizationType === 'school-based' ? 'other' : null;
        const communityEventType = organizationType === 'community-based' ? 'others' : null;

        const insertValues = [
          title, description, organizationType,
          contactPerson, contactEmail, contactPhone,
          title + ' Event', location || 'TBD',
          startDate || '2025-01-01', // Default start date if not provided
          endDate || '2025-01-01',   // Default end date if not provided
          '09:00:00', '17:00:00', // Default event times
          schoolEventType,        // Required for school-based
          communityEventType,     // Required for community-based
          status
        ];

        const [insertResult] = await pool.query(insertQuery, insertValues);
        const newProposalId = insertResult.insertId;

        console.log('✅ MySQL: New proposal created with ID:', newProposalId);

        res.status(201).json({
          id: newProposalId,
          message: 'Section 2 organization data saved successfully to MySQL',
          data: {
            title, description, category: category || 'partnership', organizationType,
            contactPerson, contactEmail, contactPhone, status
          },
          timestamp: new Date().toISOString()
        });
      }

    } catch (queryError) {
      throw queryError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('❌ MySQL: Error saving Section 2 data:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST api/proposals/section3-event
// @desc    Update proposal with Section 3 event details
// @access  Public (no auth required for testing)
router.post("/section3-event", async (req, res) => {
  console.log('📥 MySQL: Received Section 3 event data:', req.body);

  const {
    proposal_id,
    venue,
    start_date,
    end_date,
    time_start,
    time_end,
    event_type,
    event_mode,
    return_service_credit,
    target_audience,
    status = 'pending'
  } = req.body;

  // ✅ ENHANCED DEBUG: Log event type validation
  console.log('🔧 EVENT TYPE VALIDATION:');
  console.log('  Received event_type:', event_type);
  console.log('  Valid enum values: academic-enhancement, workshop-seminar-webinar, conference, competition, cultural-show, sports-fest, other');

  const validEventTypes = ['academic-enhancement', 'workshop-seminar-webinar', 'conference', 'competition', 'cultural-show', 'sports-fest', 'other'];
  const isValidEventType = validEventTypes.includes(event_type);
  console.log('  Is valid:', isValidEventType);

  if (!isValidEventType) {
    console.warn('⚠️ WARNING: Invalid event_type received, will use fallback "other"');
  }

  try {
    // Basic validation
    if (!proposal_id) {
      return res.status(400).json({
        error: 'Missing required field: proposal_id'
      });
    }

    console.log('✅ MySQL: Updating existing proposal with event details:', proposal_id);

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
      event_type || 'other', // ✅ FIXED: Use valid enum value 'other' instead of 'academic'
      event_mode || 'offline',
      status,
      proposal_id
    ];

    const [updateResult] = await pool.query(updateQuery, updateValues);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        error: 'Proposal not found',
        proposal_id: proposal_id
      });
    }

    console.log('✅ MySQL: Proposal updated with event details successfully:', proposal_id);

    res.status(200).json({
      id: proposal_id,
      message: 'Section 3 event data updated successfully in MySQL',
      data: {
        venue, start_date, end_date, time_start, time_end,
        event_type, event_mode, return_service_credit,
        target_audience, status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ MySQL: Error updating Section 3 event data:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET api/proposals/debug/:id
// @desc    Debug endpoint to get detailed proposal information
// @access  Public (for debugging)
router.get("/debug/:id", async (req, res) => {
  console.log('🔍 Debug: Getting proposal details for ID:', req.params.id);

  try {
    const proposalId = req.params.id;

    // First try MongoDB
    let mongoProposal = null;
    try {
      const Proposal = require("../models/Proposal");
      mongoProposal = await Proposal.findById(proposalId);
      console.log('🔍 MongoDB proposal:', mongoProposal ? 'Found' : 'Not found');
    } catch (mongoError) {
      console.log('🔍 MongoDB error (expected if using MySQL ID):', mongoError.message);
    }

    // Then try MySQL
    let mysqlProposal = null;
    try {
      const [rows] = await pool.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);
      mysqlProposal = rows[0] || null;
      console.log('🔍 MySQL proposal:', mysqlProposal ? 'Found' : 'Not found');
    } catch (mysqlError) {
      console.log('🔍 MySQL error:', mysqlError.message);
    }

    res.json({
      success: true,
      proposalId: proposalId,
      mongodb: {
        found: !!mongoProposal,
        data: mongoProposal ? {
          id: mongoProposal._id,
          title: mongoProposal.title,
          contactEmail: mongoProposal.contactEmail,
          status: mongoProposal.status
        } : null
      },
      mysql: {
        found: !!mysqlProposal,
        data: mysqlProposal ? {
          id: mysqlProposal.id,
          organization_name: mysqlProposal.organization_name,
          contact_email: mysqlProposal.contact_email,
          proposal_status: mysqlProposal.proposal_status
        } : null
      },
      recommendations: {
        hasData: !!(mongoProposal || mysqlProposal),
        source: mongoProposal ? 'MongoDB' : mysqlProposal ? 'MySQL' : 'None',
        nextStep: !mongoProposal && !mysqlProposal ? 'Complete Section 2 first' : 'Data found, proceed to Section 3'
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST api/proposals/search
// @desc    Search for proposal by organization name and contact email
// @access  Public (no auth required for testing)
router.post("/search", async (req, res) => {
  console.log('🔍 MySQL: Searching for proposal:', req.body);

  const { organization_name, contact_email } = req.body;

  // Basic validation
  if (!organization_name || !contact_email) {
    return res.status(400).json({
      error: 'Missing required search parameters',
      required: ['organization_name', 'contact_email']
    });
  }

  try {
    const searchQuery = `
      SELECT id, organization_name, contact_email, proposal_status, created_at
      FROM proposals 
      WHERE organization_name = ? AND contact_email = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const [rows] = await pool.query(searchQuery, [organization_name, contact_email]);

    if (rows.length === 0) {
      console.log('🔍 MySQL: No proposal found for:', { organization_name, contact_email });
      return res.status(404).json({
        error: 'No proposal found',
        message: 'No proposal found with the given organization name and contact email'
      });
    }

    const proposal = rows[0];
    console.log('✅ MySQL: Found proposal:', proposal);

    res.status(200).json({
      id: proposal.id,
      organization_name: proposal.organization_name,
      contact_email: proposal.contact_email,
      proposal_status: proposal.proposal_status,
      created_at: proposal.created_at,
      message: 'Proposal found successfully'
    });

  } catch (error) {
    console.error('❌ MySQL: Error searching for proposal:', error);
    res.status(500).json({
      error: 'Database error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST api/proposals/section2-mock
// @desc    Mock Section 2 endpoint for testing without database
// @access  Public (no auth required for testing)
router.post("/section2-mock", async (req, res) => {
  console.log('📥 MOCK: Received Section 2 organization data:', req.body);

  // 🔍 Debug the specific required fields
  console.log('🔍 MOCK: Required field values:');
  console.log(`  title: "${req.body.title}" (type: ${typeof req.body.title}, length: ${req.body.title?.length || 0})`);
  console.log(`  contactPerson: "${req.body.contactPerson}" (type: ${typeof req.body.contactPerson}, length: ${req.body.contactPerson?.length || 0})`);
  console.log(`  contactEmail: "${req.body.contactEmail}" (type: ${typeof req.body.contactEmail}, length: ${req.body.contactEmail?.length || 0})`);

  const {
    title, description, category, organizationType,
    contactPerson, contactEmail, contactPhone,
    startDate, endDate, location, budget, objectives, volunteersNeeded,
    status = 'draft',
    proposal_id
  } = req.body;

  try {
    // Basic validation
    if (!title || !contactPerson || !contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'contactPerson', 'contactEmail'],
        received: {
          title: title || 'missing',
          contactPerson: contactPerson || 'missing',
          contactEmail: contactEmail || 'missing'
        }
      });
    }

    console.log('✅ MOCK: All required fields provided');

    // Simulate successful database save
    const mockId = proposal_id || 'mock_' + Date.now();

    const mockResult = {
      id: mockId,
      message: 'MOCK: Section 2 data saved successfully (no database)',
      data: {
        title,
        description,
        category,
        organizationType,
        contactPerson,
        contactEmail,
        contactPhone,
        status
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ MOCK: Returning successful response:', mockResult);

    res.status(201).json(mockResult);

  } catch (error) {
    console.error('❌ MOCK: Error processing request:', error);
    res.status(500).json({
      error: 'MOCK: Processing error',
      message: error.message
    });
  }
});

// ===================================================================
// UNIFIED PROPOSALS API ROUTES - WORKS WITH NEW PROPOSALS TABLE
// ===================================================================
// This replaces separate school-events and community-events routes
// All data goes to the single 'proposals' table

// @route   POST api/proposals
// @desc    Create a new proposal
// @access  Private (Typically accessible by 'student' or 'partner' roles)
router.post(
  "/",
  [
    validateToken, // Authenticates the user and adds req.user
    // Add checkRole here if only specific roles can create proposals
    // E.g., checkRole(ROLES.STUDENT, ROLES.PARTNER),

    upload.fields([
      { name: 'school_gpoa_file', maxCount: 1 },
      { name: 'school_proposal_file', maxCount: 1 },
      { name: 'community_gpoa_file', maxCount: 1 },
      { name: 'community_proposal_file', maxCount: 1 },
      { name: 'accomplishment_report_file', maxCount: 1 }
    ]),

    // Validation using express-validator
    body("title", "Title is required").trim().not().isEmpty(), // Trim whitespace
    body("description", "Description is required").trim().not().isEmpty(),
    body("category", "Category is required").trim().not().isEmpty(),
    body("startDate", "Start date is required and must be a valid date").not().isEmpty().isISO8601().toDate(), // Validate date format
    body("endDate", "End date is required and must be a valid date").not().isEmpty().isISO8601().toDate(), // Validate date format
    body("location", "Location is required").trim().not().isEmpty(),
    body("budget", "Budget is required and must be a number").trim().not().isEmpty().isNumeric(), // Validate as number
    body("objectives", "Objectives are required").trim().not().isEmpty(),
    body("volunteersNeeded", "Number of volunteers is required and must be an integer").trim().not().isEmpty().isInt({ gt: 0 }), // Validate as positive integer
    body("organizationType", "Organization type is required").trim().not().isEmpty(),
    body("contactPerson", "Contact person is required").trim().not().isEmpty(),
    body("contactEmail", "Contact email is required and must be a valid email").trim().isEmail(),
    body("contactPhone", "Contact phone is required").trim().not().isEmpty(),
    body("status", "Invalid status value").optional().isIn(["draft", "pending"]), // Only allow 'draft' or 'pending' on creation

    // Custom validation example: Ensure end date is after start date
    body('endDate').custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    })
  ],
  async (req, res) => {
    // Check for validation errors after auth and upload middleware
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => { // Use async unlink
            if (err) console.error('Failed to delete file after validation error:', err);
          });
        });
      }
      return res.status(400).json({ errors: errors.array() })
    }

    // Destructure body fields - status is handled below
    const {
      title, description, category, startDate, endDate, location, budget,
      objectives, volunteersNeeded, organizationType, contactPerson,
      contactEmail, contactPhone, status // Status from body (optional, defaults to pending)
    } = req.body

    try {
      // Process uploaded files array from multer
      const documents = req.files ? req.files.map((file) => ({
        name: file.originalname,
        path: file.path, // Store the file path
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      })) : []; // Ensure documents is an array even if no files are uploaded


      // Create new proposal document using Mongoose Model
      // Use req.user.id from the auth middleware as the submitter
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
        submitter: req.user.id, // User ID from authenticated user
        organizationType,
        contactPerson,
        contactEmail,
        contactPhone,
        status: status || "pending", // Default status to 'pending' if not provided
        documents, // Attach document metadata
      })

      // Save the proposal document to MongoDB
      await proposal.save()

      // --- Send Notification Email ---
      // Find users with the 'reviewer' role to notify them
      // Note: This assumes your User model/schema includes a 'role' field
      try {
        // Using Mongoose find (consistent with this file's pattern)
        const reviewers = await User.find({ role: ROLES.REVIEWER }); // Find reviewers by role

        if (reviewers.length > 0) {
          // Prepare email options
          const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address from .env
            bcc: reviewers.map(r => r.email), // Send as Blind Carbon Copy to all reviewers
            subject: "New Partnership Proposal Submitted", // Email subject
            text: `Hello Reviewer,\n\nA new partnership proposal titled "${title}" has been submitted by ${req.user.name || req.user.email} and is awaiting your review.\n\nView proposal here: ${process.env.FRONTEND_URL}/proposals/${proposal._id}\n\nRegards,\nCEDO Team`, // Plain text body
            html: `<p>Hello Reviewer,</p><p>A new partnership proposal titled "<strong>${title}</strong>" has been submitted by ${req.user.name || req.user.email} and is awaiting your review.</p><p><a href="${process.env.FRONTEND_URL}/proposals/${proposal._id}">View Proposal Details</a></p><p>Regards,<br>CEDO Team</p>` // HTML body
          }

          // Send the email (async, but we don't wait for it to finish the response)
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              // Log email errors, but don't fail the HTTP request
              console.error("Email notification failed:", error);
            } else {
              console.log("Email notification sent:", info.response);
            }
          });
        } else {
          console.log("No users found with role 'reviewer' to notify.");
        }
      } catch (emailErr) {
        // Catch errors specifically during the email sending process
        console.error("Error finding reviewers or preparing email:", emailErr.message);
        // Continue without sending email, request should still succeed
      }


      // Respond with the created proposal (and its generated ID)
      res.status(201).json(proposal)

    } catch (err) {
      console.error("Error creating proposal:", err.message) // Log the specific error message
      // Check if the error is from Mongoose validation or another source
      if (err.name === 'ValidationError') {
        return res.status(400).json({ errors: Object.values(err.errors).map(e => ({ msg: e.message, param: e.path })) });
      }
      // Clean up uploaded files if DB save fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => { // Use async unlink
            if (unlinkErr) console.error('Failed to delete file after DB error:', unlinkErr);
          });
        });
      }
      // General server error response
      res.status(500).send("Server error")
    }
  },
)

// @route   GET api/proposals
// @desc    Get all proposals (or filtered list)
// @access  Private (Access control logic within route)
router.get("/", validateToken, async (req, res) => {
  try {
    // Build the query object for Mongoose find()
    const query = {};
    const requestingUserRole = req.user.role;

    // --- Access Control ---
    // Example: Restrict 'student'/'partner' to only their own proposals
    // Your code uses 'partner'. Ensure consistency with ROLES in auth.js ('student')
    if (requestingUserRole === ROLES.STUDENT || requestingUserRole === ROLES.PARTNER) {
      query.submitter = req.user.id; // Filter by the authenticated user's ID
    }
    // Admins/Managers can potentially see all, no filter needed here by default

    // --- Filtering ---
    // Filter by status if provided in query params
    if (req.query.status) {
      // Add validation if status must be one of a specific enum
      query.status = req.query.status;
    }

    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by organization type if provided
    if (req.query.organizationType) {
      query.organizationType = req.query.organizationType;
    }

    // --- Searching ---
    // Search by title or description if provided using regex (MongoDB feature)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i'); // 'i' for case-insensitive
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // --- Execution ---
    // Find proposals based on the constructed query
    const proposals = await Proposal.find(query)
      // Populate related fields (assuming submitter and assignedTo are Ref ObjectIds)
      .populate("submitter", "name email organization") // Only fetch name, email, organization from submitter
      .populate("assignedTo", "name email") // Only fetch name, email from assigned user (e.g., reviewer/manager)
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    // Respond with the fetched proposals
    res.json(proposals)

  } catch (err) {
    console.error("Error fetching proposals list:", err.message) // Log the specific error message
    res.status(500).send("Server error") // Generic server error response
  }
})

// @route   GET api/proposals/:id
// @desc    Get proposal by ID
// @access  Private (Access control logic within route)
router.get("/:id", validateToken, async (req, res) => {
  try {
    // Find proposal by ID and populate related fields
    const proposal = await Proposal.findById(req.params.id)
      .populate("submitter", "name email organization")
      .populate("assignedTo", "name email")
      // Assuming reviewComments is an array of objects with a 'reviewer' field referencing User
      .populate("reviewComments.reviewer", "name email role")

    // Check if proposal was found
    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" })
    }

    // --- Access Control ---
    // Allow partner (student) role to view only their own proposals
    // Check if the user is a 'partner' AND if the submitter ID does NOT match the requesting user ID
    // proposal.submitter._id is Mongoose ObjectId, req.user.id is likely a string/number from JWT payload
    // Ensure comparison is correct (toString() is common for Mongoose ObjectIds)
    if (req.user.role === ROLES.PARTNER && proposal.submitter && proposal.submitter._id.toString() !== req.user.id) {
      // If not the submitter and not an admin/manager role (implicitly checked by the first part of the IF), deny access
      // A more explicit check might be:
      // if (![ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(req.user.role) && proposal.submitter && proposal.submitter._id.toString() !== req.user.id) { ... }
      return res.status(403).json({ msg: "Not authorized to view this proposal" })
    }
    // Admins and Managers implicitly have access because they don't hit the condition above

    // Respond with the proposal
    res.json(proposal)

  } catch (err) {
    console.error("Error fetching proposal by ID:", err.message) // Log the specific error message
    // Check if the error is due to an invalid MongoDB ObjectId format
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Proposal not found" }) // Send 404 for invalid ID format
    }
    // General server error response for other errors
    res.status(500).send("Server error")
  }
})

// @route   PUT api/proposals/:id
// @desc    Update a proposal
// @access  Private (Access control logic within route)
// Note: This route handles both text field updates and adding/updating files.
// Deleting files is handled by a separate DELETE route.
router.put(
  "/:id",
  [
    validateToken, // Authenticate the user
    // Add checkRole here if only specific roles can update certain fields/proposals
    // E.g., Managers/Admins might update status, Partners might update draft content.
    // checkRole(ROLES.STUDENT, ROLES.HEAD_ADMIN, ROLES.MANAGER), // Example: allow students (partners) and admins/managers

    upload.fields([
      { name: 'school_gpoa_file', maxCount: 1 },
      { name: 'school_proposal_file', maxCount: 1 },
      { name: 'community_gpoa_file', maxCount: 1 },
      { name: 'community_proposal_file', maxCount: 1 },
      { name: 'accomplishment_report_file', maxCount: 1 }
    ]), // Handle potential document uploads

    // Validation rules for fields that can be updated (optional() makes the field not required)
    body("title", "Title is required").optional().trim().not().isEmpty(),
    body("description", "Description is required").optional().trim().not().isEmpty(),
    body("category", "Category is required").optional().trim().not().isEmpty(),
    body("startDate", "Start date must be a valid date").optional().isISO8601().toDate(),
    body("endDate", "End date must be a valid date").optional().isISO8601().toDate(),
    body("location", "Location is required").optional().trim().not().isEmpty(),
    body("budget", "Budget must be a number").optional().trim().not().isEmpty().isNumeric(),
    body("objectives", "Objectives are required").optional().trim().not().isEmpty(),
    body("volunteersNeeded", "Number of volunteers must be an integer").optional().trim().not().isEmpty().isInt({ gt: 0 }),
    body("contactPerson", "Contact person is required").optional().trim().not().isEmpty(),
    body("contactEmail", "Contact email must be a valid email").optional().trim().isEmail(),
    body("contactPhone", "Contact phone is required").optional().trim().not().isEmpty(),
    body("status", "Invalid status value").optional().isIn(["draft", "pending", "approved", "rejected", "under_review"]), // Allow more statuses on update

    // Custom validation example: Ensure end date is after start date if both are provided
    body('endDate').optional().custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    })
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to delete file after validation error:', err);
          });
        });
      }
      return res.status(400).json({ errors: errors.array() })
    }

    const proposalId = req.params.id;
    const requestingUser = req.user; // Authenticated user

    try {
      // Find the existing proposal by ID
      let proposal = await Proposal.findById(proposalId)

      // Check if proposal exists
      if (!proposal) {
        // Clean up uploaded files if proposal not found
        if (req.files) {
          req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Failed to delete file after proposal not found:', err);
            });
          });
        }
        return res.status(404).json({ msg: "Proposal not found" })
      }

      // --- Access Control & Status Restrictions ---
      const isOwner = proposal.submitter.toString() === requestingUser.id;
      const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(requestingUser.role);
      const isReviewer = requestingUser.role === ROLES.REVIEWER; // If you add a reviewer role

      // Check if user has permission to update this proposal AT ALL
      if (!isOwner && !isAdminOrManager && !isReviewer) { // Adjust roles as needed
        // Clean up uploaded files if not authorized
        if (req.files) {
          req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Failed to delete file after unauthorized update:', err);
            });
          });
        }
        return res.status(403).json({ msg: "Not authorized to update this proposal" });
      }

      // Additional check: Partners (students) can only update specific statuses
      if (isOwner && !["draft", "pending"].includes(proposal.status)) {
        // Clean up uploaded files if status restriction applies
        if (req.files) {
          req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Failed to delete file after status restriction:', err);
            });
          });
        }
        return res.status(403).json({ msg: "Cannot update proposals that are not in 'draft' or 'pending' status" });
      }

      // --- Process Document Uploads ---
      // Add newly uploaded documents to the existing documents array
      if (req.files && req.files.length > 0) {
        const newDocuments = req.files.map((file) => ({
          name: file.originalname,
          path: file.path, // Store the file path
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
        }));
        proposal.documents = [...proposal.documents, ...newDocuments];
      }

      // --- Update Proposal Fields ---
      // Build an object with fields to update from the request body
      const updateFields = { ...req.body };
      delete updateFields.documents; // Documents are handled separately

      // Apply updates based on role if necessary (e.g., only admin/manager can change status)
      if (!isAdminOrManager && updateFields.status !== undefined && updateFields.status !== proposal.status) {
        // Prevent non-admins/managers from changing status if it was in the body
        delete updateFields.status; // Remove status from fields to update
        // Optional: Log this attempt or return a specific message
        console.warn(`User ${requestingUser.id} attempted to change status on proposal ${proposalId} without sufficient role.`);
      }
      // Add other role-based field restrictions here if needed

      // Use Mongoose findByIdAndUpdate to update the document
      // This is a potentially simpler approach than modifying the found document and calling .save()
      // Ensure you use { new: true } to get the updated document back
      proposal = await Proposal.findByIdAndUpdate(proposalId, {
        $set: updateFields, // Apply the updateFields
        $push: req.files && req.files.length > 0 ? { documents: { $each: req.files.map(file => ({ name: file.originalname, path: file.path, mimetype: file.mimetype, size: file.size, uploadedAt: new Date() })) } } : undefined // Push new documents if files were uploaded
        // Using $push with $each is a more atomic way to add multiple items to an array in Mongoose
      }, { new: true, runValidators: true }) // { new: true } returns the updated doc, { runValidators: true } runs schema validators

      // Note: If using $set and modifying proposal.documents directly before save(),
      // Mongoose might handle updates differently. findByIdAndUpdate with $push/$set is often preferred for atomic updates.


      // Respond with the updated proposal
      res.json(proposal)

    } catch (err) {
      console.error("Error updating proposal:", err.message) // Log the specific error message
      // Check for specific error types
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Proposal not found" }) // 404 for invalid ID format
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ errors: Object.values(err.errors).map(e => ({ msg: e.message, param: e.path })) });
      }
      // Clean up uploaded files on any other error
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Failed to delete file after update error:', unlinkErr);
          });
        });
      }
      // General server error
      res.status(500).send("Server error")
    }
  },
)

// @route   DELETE api/proposals/:id
// @desc    Delete a proposal
// @access  Private (Access control logic within route)
router.delete("/:id", validateToken, async (req, res) => {
  const proposalId = req.params.id;
  const requestingUser = req.user;

  try {
    // Find the proposal to be deleted
    const proposal = await Proposal.findById(proposalId);

    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" });
    }

    // --- Access Control & Status Restrictions ---
    const isOwner = proposal.submitter.toString() === requestingUser.id;
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(requestingUser.role);

    // Check if user has permission to delete
    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ msg: "Not authorized to delete this proposal" });
    }

    // Only allow owners to delete if in draft or pending status
    if (isOwner && !["draft", "pending"].includes(proposal.status)) {
      return res.status(403).json({ msg: "Cannot delete proposals that have been approved or rejected" });
    }
    // Admins/Managers might be allowed to delete regardless of status - your current code allows this if they pass the first check

    // --- Delete Associated Files ---
    // Delete files from the file system asynchronously
    const deleteFilePromises = proposal.documents.map((doc) => {
      return new Promise((resolve, reject) => {
        fs.unlink(doc.path, (err) => { // Use async unlink
          if (err) {
            // Log the error but resolve, so one failed file deletion doesn't stop the whole request
            console.error(`Failed to delete file: ${doc.path}`, err.message);
            resolve(); // Consider it 'handled' so promise.all doesn't fail
          } else {
            console.log(`Deleted file: ${doc.path}`);
            resolve();
          }
        });
      });
    });

    // Wait for all file deletion attempts to finish
    await Promise.all(deleteFilePromises);
    // Note: If file deletion is critical, you might want stricter error handling here


    // --- Delete Proposal from Database ---
    // Use findByIdAndDelete for a potentially simpler deletion than find + remove()
    await Proposal.findByIdAndDelete(proposalId);
    // Or keep your original: await proposal.remove(); // Note: remove() is deprecated in recent Mongoose versions, use deleteOne() or deleteMany()


    // Respond with success message
    res.json({ msg: "Proposal removed" })

  } catch (err) {
    console.error("Error deleting proposal:", err.message) // Log the specific error message
    // Check for specific error types
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Proposal not found" }) // 404 for invalid ID format
    }
    // General server error
    res.status(500).send("Server error")
  }
})

// @route   POST api/proposals/:id/documents
// @desc    Add documents to an existing proposal
// @access  Private (Typically accessible by owner or admin/manager)
router.post("/:id/documents", [validateToken, upload.array("documents", 5)], async (req, res) => {
  const proposalId = req.params.id;
  const requestingUser = req.user;

  // Check if files were actually uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: "No documents uploaded" });
  }

  try {
    // Find the proposal
    const proposal = await Proposal.findById(proposalId)

    // Check if proposal exists
    if (!proposal) {
      // Clean up uploaded files if proposal not found
      req.files.forEach(file => { fs.unlink(file.path, (err) => { if (err) console.error('Failed to delete file after proposal not found:', err); }); });
      return res.status(404).json({ msg: "Proposal not found" });
    }

    // --- Access Control ---
    const isOwner = proposal.submitter.toString() === requestingUser.id;
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(requestingUser.role);

    // Check if user has permission to add documents (Owner or Admin/Manager)
    if (!isOwner && !isAdminOrManager) {
      // Clean up uploaded files if not authorized
      req.files.forEach(file => { fs.unlink(file.path, (err) => { if (err) console.error('Failed to delete file after unauthorized:', err); }); });
      return res.status(403).json({ msg: "Not authorized to add documents to this proposal" });
    }

    // --- Process Uploaded Files ---
    const newDocuments = req.files.map((file) => ({
      name: file.originalname,
      path: file.path, // Store the file path
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    }));

    // --- Update Proposal ---
    // Use $push to atomically add documents to the array
    const updatedProposal = await Proposal.findByIdAndUpdate(proposalId, {
      $push: { documents: { $each: newDocuments } }
    }, { new: true, runValidators: true }) // { new: true } returns the updated doc


    // Respond with the updated proposal (including new documents)
    res.json(updatedProposal);

  } catch (err) {
    console.error("Error adding documents to proposal:", err.message); // Log the specific error message
    // Check for specific error types
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Proposal not found" }); // 404 for invalid ID format
    }
    // Clean up uploaded files on any other error
    req.files.forEach(file => { fs.unlink(file.path, (unlinkErr) => { if (unlinkErr) console.error('Failed to delete file after error:', unlinkErr); }); });
    // General server error
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/proposals/:id/documents/:docId
// @desc    Delete a document from a proposal
// @access  Private (Typically accessible by owner or admin/manager)
router.delete("/:id/documents/:docId", validateToken, async (req, res) => {
  const proposalId = req.params.id;
  const docId = req.params.docId;
  const requestingUser = req.user;

  try {
    // Find the proposal
    const proposal = await Proposal.findById(proposalId);

    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" });
    }

    // --- Access Control ---
    const isOwner = proposal.submitter.toString() === requestingUser.id;
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(requestingUser.role);

    // Check if user has permission to delete documents (Owner or Admin/Manager)
    if (!isOwner && !isAdminOrManager) {
      return res.status(403).json({ msg: "Not authorized to delete documents from this proposal" });
    }


    // Find the index of the document to delete
    const docIndex = proposal.documents.findIndex((doc) => doc._id && doc._id.toString() === docId);

    // Check if document was found
    if (docIndex === -1) {
      return res.status(404).json({ msg: "Document not found on this proposal" });
    }

    const documentToDelete = proposal.documents[docIndex];

    // --- Delete the file from the file system ---
    try {
      fs.unlink(documentToDelete.path, (err) => { // Use async unlink
        if (err) {
          console.error(`Failed to delete file from disk: ${documentToDelete.path}`, err.message);
          // Decide whether to return an error here or just log and remove from DB.
          // Logging and removing from DB is often safer to keep DB consistent.
        } else {
          console.log(`Deleted file from disk: ${documentToDelete.path}`);
        }
      });
    } catch (fileError) {
      console.error(`Error initiating file delete for ${documentToDelete.path}:`, fileError.message);
      // Continue to remove from DB even if file delete fails
    }


    // --- Remove the document from the database array ---
    // Use $pull to remove the document by its _id
    const updatedProposal = await Proposal.findByIdAndUpdate(proposalId, {
      $pull: { documents: { _id: docId } } // Remove element where _id matches docId
    }, { new: true, runValidators: true }); // { new: true } returns the updated doc

    // Respond with the updated proposal
    res.json(updatedProposal);

  } catch (err) {
    console.error("Error deleting document from proposal:", err.message); // Log the specific error message
    // Check for specific error types
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Proposal or document not found (Invalid ID format)" }); // 404 for invalid ID format
    }
    // General server error
    res.status(500).send("Server error");
  }
});

// ===================================================================
// SCHOOL EVENTS SPECIFIC ENDPOINT - FOR SECTION 3 COMPATIBILITY
// ===================================================================

// @route   POST api/proposals/school-events
// @desc    Create a school-based event proposal with file uploads
// @access  Public (for testing - add auth later)
router.post('/school-events', [
  upload.fields([
    { name: 'gpoaFile', maxCount: 1 },
    { name: 'proposalFile', maxCount: 1 }
  ]),
  // Basic validation for required fields
  body('organization_id', 'Organization ID is required').not().isEmpty(),
  body('name', 'Event name is required').trim().not().isEmpty(),
  body('venue', 'Venue is required').trim().not().isEmpty(),
  body('start_date', 'Start date is required').not().isEmpty(),
  body('end_date', 'End date is required').not().isEmpty(),
  body('time_start', 'Start time is required').not().isEmpty(),
  body('time_end', 'End time is required').not().isEmpty(),
  body('event_type', 'Event type is required').not().isEmpty(),
  body('event_mode', 'Event mode is required').not().isEmpty(),
  body('contact_person', 'Contact person is required').trim().not().isEmpty(),
  body('contact_email', 'Contact email is required').trim().isEmail(),
], async (req, res) => {
  console.log('📥 Backend: Received school event data:', req.body);
  console.log('📁 Backend: Received files:', req.files);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Clean up uploaded files if validation fails
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Failed to delete file after validation error:', err);
        });
      });
    }
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    organization_id, name, venue, start_date, end_date, time_start, time_end,
    event_type, event_mode, return_service_credit, proposal_status,
    target_audience, contact_person, contact_email, contact_phone, admin_comments
  } = req.body;

  try {
    // Process uploaded files
    const documents = [];
    if (req.files) {
      if (req.files.gpoaFile) {
        documents.push({
          name: req.files.gpoaFile[0].originalname,
          path: req.files.gpoaFile[0].path,
          type: 'gpoa',
          mimetype: req.files.gpoaFile[0].mimetype,
          size: req.files.gpoaFile[0].size,
          uploadedAt: new Date()
        });
      }
      if (req.files.proposalFile) {
        documents.push({
          name: req.files.proposalFile[0].originalname,
          path: req.files.proposalFile[0].path,
          type: 'proposal',
          mimetype: req.files.proposalFile[0].mimetype,
          size: req.files.proposalFile[0].size,
          uploadedAt: new Date()
        });
      }
    }

    // Parse target_audience if it's a JSON string
    let parsedTargetAudience = [];
    try {
      if (typeof target_audience === 'string') {
        parsedTargetAudience = JSON.parse(target_audience);
      } else if (Array.isArray(target_audience)) {
        parsedTargetAudience = target_audience;
      }
    } catch (parseError) {
      console.warn('Failed to parse target_audience:', parseError);
    }

    // Create a new proposal document for MongoDB
    const proposal = new Proposal({
      title: name,
      description: `School-based event: ${name}`,
      category: 'school-event',
      organizationType: 'school-based',
      startDate: new Date(start_date),
      endDate: new Date(end_date),
      location: venue,
      budget: 0, // Default budget
      objectives: `School event objectives for ${name}`,
      volunteersNeeded: 0, // Default volunteers
      submitter: organization_id, // Use organization_id as submitter for now
      contactPerson: contact_person,
      contactEmail: contact_email,
      contactPhone: contact_phone || '0000000000',
      status: proposal_status || 'draft',
      documents: documents,
      // School-specific fields stored in a nested object
      schoolEventDetails: {
        timeStart: time_start,
        timeEnd: time_end,
        eventType: event_type,
        eventMode: event_mode,
        returnServiceCredit: parseInt(return_service_credit) || 0,
        targetAudience: parsedTargetAudience,
        adminComments: admin_comments || ''
      }
    });

    // Save to MongoDB
    const savedProposal = await proposal.save();

    console.log('✅ Backend: School event saved to MongoDB:', savedProposal._id);

    // Return success response
    res.status(201).json({
      id: savedProposal._id,
      message: 'School event proposal created successfully',
      data: {
        id: savedProposal._id,
        name: savedProposal.title,
        venue: savedProposal.location,
        status: savedProposal.status,
        documents: documents.map(doc => ({
          name: doc.name,
          type: doc.type,
          size: doc.size
        }))
      }
    });

  } catch (err) {
    console.error('❌ Backend: Error creating school event proposal:', err);

    // Clean up uploaded files if database save fails
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete file after DB error:', unlinkErr);
        });
      });
    }

    // Check for specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create school event proposal'
    });
  }
});

// ===================================================================
// ADMIN ROUTES - FOR ADMIN DASHBOARD
// ===================================================================

// @route   GET api/proposals/admin/proposals
// @desc    Get all proposals for admin dashboard with pagination and filtering
// @access  Private (Admin/Manager only)
router.get('/admin/proposals', async (req, res) => {
  console.log('📊 Admin: Fetching proposals for admin dashboard');
  console.log('📊 Query params:', req.query);

  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Extract filter parameters
    const { status, category, search, organizationType } = req.query;

    // Build query for both MySQL and MongoDB
    let query = {};

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (organizationType) {
      query.organizationType = organizationType;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { contactPerson: searchRegex },
        { contactEmail: searchRegex }
      ];
    }

    console.log('📊 MongoDB query:', query);

    // Fetch proposals from MongoDB with pagination
    const proposals = await Proposal.find(query)
      .populate('submitter', 'name email organization')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Proposal.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    console.log(`📊 Found ${proposals.length} proposals (${totalCount} total)`);

    // Format response data
    const formattedProposals = proposals.map(proposal => ({
      id: proposal._id,
      title: proposal.title,
      organization: proposal.submitter?.organization || 'Unknown Organization',
      submittedOn: proposal.createdAt.toISOString().split('T')[0],
      status: proposal.status,
      assignedTo: proposal.assignedTo?.name || 'Unassigned',
      description: proposal.description,
      proposedVenue: proposal.location,
      proposedSchedule: proposal.startDate ? proposal.startDate.toISOString().split('T')[0] : null,
      expectedParticipants: proposal.volunteersNeeded || 0,
      intendedGoal: proposal.objectives,
      requiredResources: proposal.budget || 0,
      contactPerson: proposal.contactPerson,
      contactEmail: proposal.contactEmail,
      contactPhone: proposal.contactPhone,
      category: proposal.category,
      organizationType: proposal.organizationType
    }));

    // Response with pagination metadata
    res.json({
      success: true,
      data: formattedProposals,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limit
      },
      filters: {
        status,
        category,
        search,
        organizationType
      }
    });

  } catch (error) {
    console.error('❌ Admin: Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposals',
      message: error.message
    });
  }
});

// @route   GET api/proposals/admin/stats
// @desc    Get proposal statistics for admin dashboard
// @access  Private (Admin/Manager only)
router.get('/admin/stats', async (req, res) => {
  console.log('📊 Admin: Fetching proposal statistics');

  try {
    // Get counts by status
    const pendingCount = await Proposal.countDocuments({ status: 'pending' });
    const approvedCount = await Proposal.countDocuments({ status: 'approved' });
    const rejectedCount = await Proposal.countDocuments({ status: 'rejected' });
    const totalCount = await Proposal.countDocuments();

    // Calculate approval rate
    const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    console.log('📊 Stats calculated:', {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: totalCount,
      approvalRate: approvalRate
    });

    res.json({
      success: true,
      stats: {
        pendingReview: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount,
        approvalRate: approvalRate
      }
    });

  } catch (error) {
    console.error('❌ Admin: Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// @route   PATCH api/proposals/admin/proposals/:id/status
// @desc    Update proposal status (approve, reject, etc.)
// @access  Private (Admin/Manager only)
router.patch('/admin/proposals/:id/status', async (req, res) => {
  console.log('📊 Admin: Updating proposal status');
  console.log('📊 Proposal ID:', req.params.id);
  console.log('📊 Request body:', req.body);

  try {
    const proposalId = req.params.id;
    const { status, adminComments } = req.body;

    // Validate the new status
    const validStatuses = ['pending', 'approved', 'rejected', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update the proposal
    const proposal = await Proposal.findByIdAndUpdate(
      proposalId,
      {
        status: status,
        adminComments: adminComments || '',
        updatedAt: new Date()
      },
      {
        new: true, // Return the updated document
        runValidators: true // Run schema validations
      }
    ).populate('submitter', 'name email organization');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
        message: `No proposal found with ID: ${proposalId}`
      });
    }

    console.log('✅ Admin: Proposal status updated successfully');
    console.log('📊 Updated proposal:', {
      id: proposal._id,
      title: proposal.title,
      oldStatus: 'unknown', // We don't have the old status here
      newStatus: proposal.status
    });

    // Return success response
    res.json({
      success: true,
      message: `Proposal ${status} successfully`,
      proposal: {
        id: proposal._id,
        title: proposal.title,
        status: proposal.status,
        adminComments: proposal.adminComments,
        updatedAt: proposal.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Admin: Error updating proposal status:', error);

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    // Handle MongoDB CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
        message: 'The provided proposal ID is not valid'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update proposal status',
      message: error.message
    });
  }
});

// ===================================================================
// ERROR HANDLING MIDDLEWARE
// ===================================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size cannot exceed 5MB'
      });
    }
  }

  console.error('Unhandled error in proposals router:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

module.exports = router