// This file is no longer needed in PostgreSQL-only setup
// All proposal data is stored in PostgreSQL tables, not MongoDB schemas

const ProposalSchema = {
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
    enum: ["education", "health", "environment", "community", "technology", "other", "school-event", "community-event"],
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
    required: function () {
      // Only require budget for non-school events
      return this.category !== 'school-event';
    },
    default: 0,
  },
  objectives: {
    type: String,
    required: function () {
      // Only require objectives for non-school events
      return this.category !== 'school-event';
    },
    default: 'Event objectives',
  },
  volunteersNeeded: {
    type: Number,
    required: function () {
      // Only require volunteersNeeded for non-school events
      return this.category !== 'school-event';
    },
    default: 0,
  },
  submitter: {
    type: String, // Changed from ObjectId to String for testing
    required: true,
    default: 'test-user-id',
  },
  organizationType: {
    type: String,
    enum: ["internal", "external", "school-based", "community-based"],
    required: true,
  },
  // Event-specific details for school events and community events
  eventDetails: {
    timeStart: String,
    timeEnd: String,
    eventType: {
      type: String,
      enum: ["academic", "workshop", "seminar", "assembly", "leadership", "other"],
    },
    eventMode: {
      type: String,
      enum: ["offline", "online", "hybrid"],
    },
    returnServiceCredit: Number,
    targetAudience: [String],
    organizationId: String,
  },
  // Admin comments for proposal reviews
  adminComments: {
    type: String,
    default: '',
  },
  contactPerson: {
    type: String,
    required: function () {
      // Only require contactPerson for non-school events
      return this.category !== 'school-event';
    },
    default: 'Contact Person',
  },
  contactEmail: {
    type: String,
    required: function () {
      // Only require contactEmail for non-school events
      return this.category !== 'school-event';
    },
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
    default: 'contact@example.com',
  },
  contactPhone: {
    type: String,
    required: function () {
      // Only require contactPhone for non-school events
      return this.category !== 'school-event';
    },
    default: '',
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
    type: String, // Changed from ObjectId to String for testing
  },
  documents: [
    {
      name: String,
      path: String,
      mimetype: String,
      size: Number,
      type: {
        type: String,
        enum: ["gpoa", "proposal", "accomplishment", "other"],
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  reviewComments: [
    {
      reviewer: {
        type: String, // Changed from ObjectId to String for testing
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

module.exports = postgresqlose.model("Proposal", ProposalSchema)
