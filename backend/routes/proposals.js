const express = require("express")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const multer = require("multer")
const path = require("path")
const fs = require("fs") // Used for file system operations
const Proposal = require("../models/Proposal") // Assuming Mongoose Model
const User = require("../models/User") // Assuming Mongoose Model (used for finding reviewers)
const auth = require("../middleware/auth") // Assuming JWT auth middleware
const checkRole = require("../middleware/roles") // Assuming role checking middleware (Note: your import path was checkRole, but middleware file was roles.js - using 'roles')
const nodemailer = require("nodemailer") // Used for sending emails

// --- Multer Configuration for File Uploads ---
// Sets up storage location and filename for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/proposals" // Directory relative to your project root (where server.js is)
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }) // recursive: true allows creating parent directories too
    }
    cb(null, dir) // Null indicates no error
  },
  filename: (req, file, cb) => {
    // Create a unique filename: timestamp + original name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    // Sanitize filename to remove potentially problematic characters
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${uniqueSuffix}-${safeFilename}`); // Null indicates no error
  },
})

// Configures multer instance with storage, limits, and file type filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit (in bytes)
  fileFilter: (req, file, cb) => {
    // Allowed file extensions
    const allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]
    const ext = path.extname(file.originalname).toLowerCase()

    // Check if the file extension is in the allowed list
    if (!allowedTypes.includes(ext)) {
      // Pass an error to the callback if the file type is invalid
      return cb(new Error(`Invalid file type. Only ${allowedTypes.join(", ")} are allowed.`))
    }
    // Accept the file
    cb(null, true)
  },
})

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


// @route   POST api/proposals
// @desc    Create a new proposal
// @access  Private (Typically accessible by 'student' or 'partner' roles)
router.post(
  "/",
  [
    auth, // Authenticates the user and adds req.user
    // Add checkRole here if only specific roles can create proposals
    // E.g., checkRole(ROLES.STUDENT, ROLES.PARTNER),

    upload.array("documents", 5), // Handles file uploads (max 5 files)

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

// @route   GET api/proposals
// @desc    Get all proposals (or filtered list)
// @access  Private (Access control logic within route)
router.get("/", auth, async (req, res) => {
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

// @route   GET api/proposals/:id
// @desc    Get proposal by ID
// @access  Private (Access control logic within route)
router.get("/:id", auth, async (req, res) => {
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

// @route   PUT api/proposals/:id
// @desc    Update a proposal
// @access  Private (Access control logic within route)
// Note: This route handles both text field updates and adding/updating files.
// Deleting files is handled by a separate DELETE route.
router.put(
  "/:id",
  [
    auth, // Authenticate the user
    // Add checkRole here if only specific roles can update certain fields/proposals
    // E.g., Managers/Admins might update status, Partners might update draft content.
    // checkRole(ROLES.STUDENT, ROLES.HEAD_ADMIN, ROLES.MANAGER), // Example: allow students (partners) and admins/managers

    upload.array("documents", 5), // Handle potential document uploads

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

// @route   DELETE api/proposals/:id
// @desc    Delete a proposal
// @access  Private (Access control logic within route)
router.delete("/:id", auth, async (req, res) => {
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

// @route   POST api/proposals/:id/documents
// @desc    Add documents to an existing proposal
// @access  Private (Typically accessible by owner or admin/manager)
router.post("/:id/documents", [auth, upload.array("documents", 5)], async (req, res) => {
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

// @route   DELETE api/proposals/:id/documents/:docId
// @desc    Delete a document from a proposal
// @access  Private (Typically accessible by owner or admin/manager)
router.delete("/:id/documents/:docId", auth, async (req, res) => {
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


// --- Placeholder Routes for Review/Status Management ---

// @route   POST api/proposals/:id/assign-reviewer
// @desc    Assign a reviewer to a proposal
// @access  Private (Admin/Manager only)
// router.post("/:id/assign-reviewer", [auth, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => {
//     const proposalId = req.params.id;
//     const { reviewerId } = req.body; // Expecting the ID of the user to assign

//     try {
//         // Find the proposal
//         const proposal = await Proposal.findById(proposalId);
//         if (!proposal) { return res.status(404).json({ msg: "Proposal not found" }); }

//         // Optional: Verify reviewerId is a valid user with the 'reviewer' role
//         const reviewer = await User.findOne({ _id: reviewerId, role: ROLES.REVIEWER });
//         if (!reviewer) { return res.status(400).json({ msg: "Invalid reviewer ID or user is not a reviewer" }); }

//         // Update the proposal, assuming a field like 'assignedTo' (ref to User)
//         const updatedProposal = await Proposal.findByIdAndUpdate(proposalId,
//             { $set: { assignedTo: reviewerId, status: 'under_review' } }, // Set assignedTo and update status
//             { new: true }
//         ).populate("assignedTo", "name email"); // Populate to return reviewer info

//         // Optional: Send email notification to the assigned reviewer

//         res.json(updatedProposal);

//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server error");
//     }
// });

// @route   POST api/proposals/:id/review
// @desc    Submit a review comment/rating for a proposal
// @access  Private (Reviewer only)
// router.post("/:id/review", [auth, checkRole(ROLES.REVIEWER)], async (req, res) => {
//     const proposalId = req.params.id;
//     const reviewerId = req.user.id; // The authenticated user is the reviewer
//     const { comments, rating } = req.body; // Expecting comments and rating

//     try {
//         // Find the proposal
//         const proposal = await Proposal.findById(proposalId);
//         if (!proposal) { return res.status(404).json({ msg: "Proposal not found" }); }

//         // Optional: Check if this reviewer is assigned to this proposal, or if any reviewer can review
//         // if (proposal.assignedTo && proposal.assignedTo.toString() !== reviewerId) {
//         //    return res.status(403).json({ msg: "Not assigned to review this proposal" });
//         // }

//         // Create a new review comment object
//         const newReviewComment = {
//             reviewer: reviewerId, // Reference to the reviewer user
//             comments: comments,
//             rating: rating, // Assuming rating is a number
//             createdAt: new Date(),
//         };

//         // Add the review comment to the proposal's reviewComments array
//         const updatedProposal = await Proposal.findByIdAndUpdate(proposalId,
//             { $push: { reviewComments: newReviewComment } }, // Push the new comment to the array
//             { new: true }
//         ).populate("reviewComments.reviewer", "name email role"); // Populate the new comment's reviewer info

//         res.json(updatedProposal);

//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server error");
//     }
// });

// @route   POST api/proposals/:id/status
// @desc    Update proposal status (Admin/Manager only)
// @access  Private
// router.post("/:id/status", [auth, checkRole(ROLES.HEAD_ADMIN, ROLES.MANAGER)], async (req, res) => {
//     const proposalId = req.params.id;
//     const { status } = req.body; // Expecting the new status

//     // Validate the status value
//     const allowedStatuses = ['draft', 'pending', 'under_review', 'approved', 'rejected'];
//     if (!status || !allowedStatuses.includes(status)) {
//         return res.status(400).json({ msg: `Invalid or missing status. Allowed: ${allowedStatuses.join(', ')}` });
//     }

//     try {
//         // Find the proposal
//         const proposal = await Proposal.findById(proposalId);
//         if (!proposal) { return res.status(404).json({ msg: "Proposal not found" }); }

//         // Optional: Add logic here to prevent invalid status transitions
//         // E.g., cannot go from rejected to approved without a new submission

//         // Update the status
//         const updatedProposal = await Proposal.findByIdAndUpdate(proposalId,
//             { $set: { status: status } },
//             { new: true }
//         );

//         // Optional: Send email notification to the submitter about the status change

//         res.json(updatedProposal);

//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server error");
//     }
// });


module.exports = router