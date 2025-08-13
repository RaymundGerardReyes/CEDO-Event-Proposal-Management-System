// backend/routes/compliance.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const { validateToken } = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const nodemailer = require("nodemailer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/compliance";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".xlsx", ".xls", ".zip"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) return cb(new Error("Invalid file type"));
    cb(null, true);
  },
});

// Email helper
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("Email error:", err);
    else console.log("Email sent:", info.response);
  });
};

// GET /api/compliance
router.get("/", validateToken, async (req, res) => {
  try {
    const query = { status: "approved" };
    if (req.query.complianceStatus) query.complianceStatus = req.query.complianceStatus;
    if (req.user.role === "partner") query.submitter = req.user.id;

    const proposals = await Proposal.find(query)
      .populate("submitter", "name email organization")
      .sort({ complianceDueDate: 1 });

    res.json(proposals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// POST /api/compliance/:proposalId/documents
router.post("/:proposalId/documents", [validateToken, upload.array("documents", 5)], async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

    // Authorization check
    if (req.user.role === "partner" && proposal.submitter.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: "Not authorized to update this proposal" });
    }

    if (proposal.status !== "approved") {
      return res.status(400).json({ msg: "Only approved proposals can have compliance documents" });
    }

    const files = req.files || [];
    const documentTypes = req.body.documentTypes ? JSON.parse(req.body.documentTypes) : [];

    if (documentTypes.length !== files.length) {
      return res.status(400).json({ msg: "Document types must match the number of uploaded files" });
    }

    files.forEach((file, i) => {
      const docType = documentTypes[i];
      const idx = proposal.complianceDocuments.findIndex((doc) => doc.name === docType);
      if (idx !== -1) {
        proposal.complianceDocuments[idx].submitted = true;
        proposal.complianceDocuments[idx].submittedAt = new Date();
        proposal.complianceDocuments[idx].path = file.path;
      } else {
        proposal.complianceDocuments.push({
          name: docType,
          path: file.path,
          required: false,
          submitted: true,
          submittedAt: new Date(),
        });
      }
    });

    const allSubmitted = proposal.complianceDocuments
      .filter((doc) => doc.required)
      .every((doc) => doc.submitted);

    if (allSubmitted) proposal.complianceStatus = "compliant";

    await proposal.save();

    const reviewers = await User.find({ role: "reviewer" }) || [];
    reviewers.forEach((reviewer) => {
      sendMail(
        reviewer.email,
        `Compliance Documents Submitted for "${proposal.title}"`,
        `Hello ${reviewer.name},\n\nCompliance documents for "${proposal.title}" have been submitted.\n\nRegards,\nCEDO Team`
      );
    });

    res.json(proposal);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") return res.status(404).json({ msg: "Proposal not found" });
    res.status(500).send("Server error");
  }
});

// PUT /api/compliance/:proposalId/status
router.put(
  "/:proposalId/status",
  [
    validateToken,
    checkRole(["admin", "reviewer"]),
    [body("status").isIn(["pending", "compliant", "overdue"]), body("comment").optional()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const proposal = await Proposal.findById(req.params.proposalId);
      if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

      proposal.complianceStatus = req.body.status;
      if (req.body.comment) {
        proposal.reviewComments.push({
          reviewer: req.user.id,
          comment: req.body.comment,
          decision: "compliance",
        });
      }

      await proposal.save();

      const submitter = await User.findById(proposal.submitter);
      if (submitter) {
        sendMail(
          submitter.email,
          `Compliance Status Updated for "${proposal.title}"`,
          `Hello ${submitter.name},\n\nThe compliance status for "${proposal.title}" has been updated to "${req.body.status}".\n\n${req.body.comment ? "Comment: " + req.body.comment : ""}\n\nRegards,\nCEDO Team`
        );
      }

      res.json(proposal);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") return res.status(404).json({ msg: "Proposal not found" });
      res.status(500).send("Server error");
    }
  }
);

// GET /api/compliance/overdue
router.get("/overdue", [validateToken, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    const today = new Date();
    const proposals = await Proposal.find({
      status: "approved",
      complianceStatus: { $ne: "compliant" },
      complianceDueDate: { $lt: today },
    }).populate("submitter", "name email organization").sort({ complianceDueDate: 1 });

    for (const proposal of proposals) {
      if (proposal.complianceStatus !== "overdue") {
        proposal.complianceStatus = "overdue";
        await proposal.save();

        const submitter = await User.findById(proposal.submitter);
        if (submitter) {
          sendMail(
            submitter.email,
            `OVERDUE: Compliance Documents for "${proposal.title}"`,
            `Hello ${submitter.name},\n\nYour compliance documents for "${proposal.title}" are now overdue. Please submit them ASAP.\n\nRegards,\nCEDO Team`
          );
        }
      }
    }

    res.json(proposals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// GET /api/compliance/stats
router.get("/stats", [validateToken, checkRole(["admin", "reviewer"])], async (req, res) => {
  try {
    const [compliant, pending, overdue, total] = await Promise.all([
      Proposal.countDocuments({ complianceStatus: "compliant" }),
      Proposal.countDocuments({ complianceStatus: "pending" }),
      Proposal.countDocuments({ complianceStatus: "overdue" }),
      Proposal.countDocuments({ status: "approved" }),
    ]);
    const complianceRate = total > 0 ? ((compliant / total) * 100).toFixed(2) : "0.00";
    res.json({ compliant, pending, overdue, total, complianceRate });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
