const mongoose = require("mongoose")

const ProposalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [1000, "Description cannot be more than 1000 characters"],
  },
  category: {
    type: String,
    required: [true, "Please select a category"],
    enum: ["education", "health", "environment", "community", "technology", "other"],
  },
  startDate: {
    type: Date,
    required: [true, "Please add a start date"],
  },
  endDate: {
    type: Date,
    required: [true, "Please add an end date"],
  },
  location: {
    type: String,
    required: [true, "Please add a location"],
  },
  budget: {
    type: Number,
    required: [true, "Please add a budget"],
  },
  objectives: {
    type: String,
    required: [true, "Please add objectives"],
  },
  volunteersNeeded: {
    type: Number,
    required: [true, "Please specify the number of volunteers needed"],
  },
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  organizationType: {
    type: String,
    enum: ["internal", "external"],
    required: true,
  },
  contactPerson: {
    type: String,
    required: [true, "Please add a contact person"],
  },
  contactEmail: {
    type: String,
    required: [true, "Please add a contact email"],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
  },
  contactPhone: {
    type: String,
    required: [true, "Please add a contact phone number"],
  },
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  documents: [
    {
      name: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  reviewComments: [
    {
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: String,
      decision: {
        type: String,
        enum: ["approve", "reject", "revise"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  complianceStatus: {
    type: String,
    enum: ["not_applicable", "pending", "compliant", "overdue"],
    default: "not_applicable",
  },
  complianceDocuments: [
    {
      name: String,
      path: String,
      required: Boolean,
      submitted: {
        type: Boolean,
        default: false,
      },
      submittedAt: Date,
    },
  ],
  complianceDueDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Set updatedAt before update
ProposalSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() })
})

module.exports = mongoose.model("Proposal", ProposalSchema)
