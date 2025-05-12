const express = require("express")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const Proposal = require("../models/Proposal")
const User = require("../models/User")
const auth = require("../middleware/auth")
const checkRole = require("../middleware/checkRole")
const nodemailer = require("nodemailer")

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// @route   POST api/reviews/:proposalId
// @desc    Review a proposal
// @access  Private (Reviewers and Admins only)
router.post(
  "/:proposalId",
  [
    auth,
    checkRole(["admin", "reviewer"]),
    [
      body("decision", "Decision is required").isIn(["approve", "reject", "revise"]),
      body("comment", "Comment is required").not().isEmpty(),
    ],
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

      const { decision, comment, complianceChecklist } = req.body

      // Add review comment
      proposal.reviewComments.push({
        reviewer: req.user.id,
        comment,
        decision,
      })

      // Update proposal status based on decision
      if (decision === "approve") {
        proposal.status = "approved"

        // Set compliance due date (30 days from approval)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)
        proposal.complianceDueDate = dueDate

        // Set default compliance documents required
        proposal.complianceDocuments = [
          { name: "Final Report", required: true, submitted: false },
          { name: "Attendance Sheets", required: true, submitted: false },
          { name: "Budget Report", required: true, submitted: false },
          { name: "Photo Documentation", required: true, submitted: false },
        ]

        proposal.complianceStatus = "pending"
      } else if (decision === "reject") {
        proposal.status = "rejected"
      }

      // Save compliance checklist if provided
      if (complianceChecklist) {
        proposal.complianceChecklist = complianceChecklist
      }

      // Save proposal
      await proposal.save()

      // Get submitter details
      const submitter = await User.findById(proposal.submitter)

      // Send notification email to submitter
      if (submitter) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: submitter.email,
          subject: `Your Proposal "${proposal.title}" has been ${decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Returned for Revision"}`,
          text: `Hello ${submitter.name},\n\nYour partnership proposal titled "${proposal.title}" has been ${decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "returned for revision"}.\n\nReviewer Comments: ${comment}\n\n${decision === "approve" ? "Please note that you will need to submit compliance documentation within 30 days." : ""}\n\nRegards,\nCEDO Team`,
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

// @route   GET api/reviews/pending
// @desc    Get all pending proposals for review
// @access  Private (Reviewers and Admins only)
router.get("/pending", [auth, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    const proposals = await Proposal.find({ status: "pending" })
      .populate("submitter", "name email organization")
      .sort({ createdAt: -1 })

    res.json(proposals)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route   PUT api/reviews/:proposalId/assign
// @desc    Assign a reviewer to a proposal
// @access  Private (Admins only)
router.put(
  "/:proposalId/assign",
  [auth, checkRole(["admin"]), [body("reviewerId", "Reviewer ID is required").not().isEmpty()]],
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

      // Check if reviewer exists and has reviewer role
      const reviewer = await User.findById(req.body.reviewerId)
      if (!reviewer || reviewer.role !== "reviewer") {
        return res.status(400).json({ msg: "Invalid reviewer" })
      }

      // Assign reviewer
      proposal.assignedTo = req.body.reviewerId
      await proposal.save()

      // Send notification email to reviewer
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reviewer.email,
        subject: `Proposal Assigned for Review: "${proposal.title}"`,
        text: `Hello ${reviewer.name},\n\nYou have been assigned to review the partnership proposal titled "${proposal.title}".\n\nPlease log in to the system to review this proposal.\n\nRegards,\nCEDO Team`,
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Email error:", error)
        } else {
          console.log("Email sent:", info.response)
        }
      })

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

// @route   GET api/reviews/stats
// @desc    Get review statistics
// @access  Private (Admins and Reviewers only)
router.get("/stats", [auth, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    const stats = {
      pending: await Proposal.countDocuments({ status: "pending" }),
      approved: await Proposal.countDocuments({ status: "approved" }),
      rejected: await Proposal.countDocuments({ status: "rejected" }),
      total: await Proposal.countDocuments(),
    }

    // Calculate approval rate
    stats.approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(2) : 0

    res.json(stats)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

module.exports = router
