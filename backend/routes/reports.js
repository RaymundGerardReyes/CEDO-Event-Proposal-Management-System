const express = require("express")
const router = express.Router()
const { Parser } = require("json2csv")
const Proposal = require("../models/Proposal")
const User = require("../models/User")
const { validateToken, validateAdmin, validateFaculty } = require("../middleware/auth")
const checkRole = require("../middleware/checkRole")

// @route   GET api/reports/proposals
// @desc    Generate proposals report
// @access  Private (Admins and Reviewers only)
router.get("/proposals", [validateToken, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    // Build query based on filters
    const query = {}

    if (req.query.status) {
      query.status = req.query.status
    }

    if (req.query.category) {
      query.category = req.query.category
    }

    if (req.query.organizationType) {
      query.organizationType = req.query.organizationType
    }

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      }
    }

    // Get proposals
    const proposals = await Proposal.find(query)
      .populate("submitter", "name email organization")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })

    // Format data for CSV
    const fields = [
      { label: "ID", value: "_id" },
      { label: "Title", value: "title" },
      { label: "Category", value: "category" },
      { label: "Organization Type", value: "organizationType" },
      { label: "Submitter", value: (row) => (row.submitter ? row.submitter.name : "N/A") },
      { label: "Organization", value: (row) => (row.submitter ? row.submitter.organization : "N/A") },
      { label: "Status", value: "status" },
      { label: "Budget", value: "budget" },
      { label: "Volunteers Needed", value: "volunteersNeeded" },
      { label: "Start Date", value: (row) => new Date(row.startDate).toLocaleDateString() },
      { label: "End Date", value: (row) => new Date(row.endDate).toLocaleDateString() },
    ]

    const json2csv = new Parser({ fields })
    const csv = json2csv.parse(proposals)

    res.header("Content-Type", "text/csv")
    res.attachment("proposals.csv")
    return res.send(csv)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

module.exports = router
