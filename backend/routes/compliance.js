const express = require("express")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Proposal = require("../models/Proposal")
const User = require("../models/User")
const auth = require("../middleware/auth")
const checkRole = require("../middleware/checkRole")
const nodemailer = require("nodemailer")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/compliance"
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".xlsx", ".xls", ".zip"]
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowedTypes.includes(ext)) {
      return cb(new Error("Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, XLSX, XLS, and ZIP are allowed."))
    }
    cb(null, true)
  },
})

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// @route   GET api/compliance
// @desc    Get all proposals with compliance requirements
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const query = { status: "approved" }

    // Filter by compliance status if provided
    if (req.query.complianceStatus) {
      query.complianceStatus = req.query.complianceStatus
    }

    // If user is a partner, only show their proposals
    if (req.user.role === "partner") {
      query.submitter = req.user.id
    }

    const proposals = await Proposal.find(query)
      .populate("submitter", "name email organization")
      .sort({ complianceDueDate: 1 })

    res.json(proposals)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route   POST api/compliance/:proposalId/documents
// @desc    Submit compliance documents
// @access  Private
router.post("/:proposalId/documents", [auth, upload.array("documents", 5)], async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.proposalId)

    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" })
    }

    // Check if user has permission to update this proposal
    if (req.user.role === "partner" && proposal.submitter.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to update this proposal" })
    }

    // Check if proposal is approved
    if (proposal.status !== "approved") {
      return res.status(400).json({ msg: "Only approved proposals can have compliance documents" })
    }

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      // Get document types from request
      const documentTypes = req.body.documentTypes ? JSON.parse(req.body.documentTypes) : []

      if (documentTypes.length !== req.files.length) {
        return res.status(400).json({ msg: "Document types must match the number of uploaded files" })
      }

      // Update compliance documents
      req.files.forEach((file, index) => {
        const docType = documentTypes[index]
        const docIndex = proposal.complianceDocuments.findIndex((doc) => doc.name === docType)

        if (docIndex !== -1) {
          // Update existing document
          proposal.complianceDocuments[docIndex].submitted = true
          proposal.complianceDocuments[docIndex].submittedAt = Date.now()
          proposal.complianceDocuments[docIndex].path = file.path
        } else {
          // Add new document
          proposal.complianceDocuments.push({
            name: docType,
            path: file.path,
            required: false,
            submitted: true,
            submittedAt: Date.now(),
          })
        }
      })

      // Check if all required documents are submitted
      const allRequiredSubmitted = proposal.complianceDocuments
        .filter((doc) => doc.required)
        .every((doc) => doc.submitted)

      if (allRequiredSubmitted) {
        proposal.complianceStatus = "compliant"
      }

      await proposal.save()

      // Notify reviewers
      const reviewers = await User.find({ role: "reviewer" })

      reviewers.forEach((reviewer) => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: reviewer.email,
          subject: `Compliance Documents Submitted for "${proposal.title}"`,
          text: `Hello ${reviewer.name},\n\nCompliance documents have been submitted for the proposal titled "${proposal.title}".\n\nPlease log in to the system to review these documents.\n\nRegards,\nCEDO Team`,
        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Email error:", error)
          } else {
            console.log("Email sent:", info.response)
          }
        })
      })
    }

    res.json(proposal)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Proposal not found" })
    }
    res.status(500).send("Server error")
  }
})

// @route   PUT api/compliance/:proposalId/status
// @desc    Update compliance status
// @access  Private (Admins and Reviewers only)
router.put(
  "/:proposalId/status",
  [
    auth,
    checkRole(["admin", "reviewer"]),
    [body("status", "Status is required").isIn(["pending", "compliant", "overdue"]), body("comment").optional()],
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const proposal = await Proposal.findById(req.params.proposalId)

      if (!proposal) {
        return res.status(404).json({ msg: "Proposal not found" })
      }

      // Update compliance status
      proposal.complianceStatus = req.body.status

      // Add comment if provided
      if (req.body.comment) {
        proposal.reviewComments.push({
          reviewer: req.user.id,
          comment: req.body.comment,
          decision: "compliance",
        })
      }

      await proposal.save()

      // Notify submitter
      const submitter = await User.findById(proposal.submitter)

      if (submitter) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: submitter.email,
          subject: `Compliance Status Updated for "${proposal.title}"`,
          text: `Hello ${submitter.name},\n\nThe compliance status for your proposal titled "${proposal.title}" has been updated to "${req.body.status}".\n\n${req.body.comment ? `Reviewer Comment: ${req.body.comment}` : ""}\n\nRegards,\nCEDO Team`,
        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Email error:", error)
          } else {
            console.log("Email sent:", info.response)
          }
        })
      }

      res.json(proposal)
    } catch (err) {
      console.error(err.message)
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Proposal not found" })
      }
      res.status(500).send("Server error")
    }
  },
)

// @route   GET api/compliance/overdue
// @desc    Get all overdue compliance proposals
// @access  Private (Admins and Reviewers only)
router.get("/overdue", [auth, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    const today = new Date()

    // Find proposals where compliance due date has passed but not compliant
    const proposals = await Proposal.find({
      status: "approved",
      complianceStatus: { $ne: "compliant" },
      complianceDueDate: { $lt: today },
    })
      .populate("submitter", "name email organization")
      .sort({ complianceDueDate: 1 })

    // Update status to overdue
    for (const proposal of proposals) {
      if (proposal.complianceStatus !== "overdue") {
        proposal.complianceStatus = "overdue"
        await proposal.save()

        // Notify submitter
        const submitter = await User.findById(proposal.submitter)

        if (submitter) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: submitter.email,
            subject: `OVERDUE: Compliance Documents for "${proposal.title}"`,
            text: `Hello ${submitter.name},\n\nThis is a reminder that your compliance documents for the proposal titled "${proposal.title}" are now overdue. Please submit the required documents as soon as possible.\n\nRegards,\nCEDO Team`,
          }

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("Email error:", error)
            } else {
              console.log("Email sent:", info.response)
            }
          })
        }
      }
    }

    res.json(proposals)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route   GET api/compliance/stats
// @desc    Get compliance statistics
// @access  Private (Admins and Reviewers only)
router.get("/stats", [auth, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    const stats = {
      compliant: await Proposal.countDocuments({ complianceStatus: "compliant" }),
      pending: await Proposal.countDocuments({ complianceStatus: "pending" }),
      overdue: await Proposal.countDocuments({ complianceStatus: "overdue" }),
      total: await Proposal.countDocuments({ status: "approved" }),
    }

    // Calculate compliance rate
    stats.complianceRate = stats.total > 0 ? ((stats.compliant / stats.total) * 100).toFixed(2) : 0

    res.json(stats)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

module.exports = router
