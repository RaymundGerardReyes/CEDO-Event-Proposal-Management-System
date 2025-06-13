// ===============================================
// CEDO UNIFIED MONGODB SCHEMA
// MongoDB-only solution with file metadata storage
// ===============================================

/*
MONGODB COLLECTIONS STRUCTURE:

1. organizations - Organization details from Section 2
2. proposals - Event proposals from Section 3 & 4  
3. accomplishment_reports - Reports from Section 5
4. file_metadata - File information (optional separate collection)

Files stored in filesystem/cloud, metadata in MongoDB documents
*/

// ===============================================
// 1. ORGANIZATIONS COLLECTION
// ===============================================
const organizationSchema = {
    _id: ObjectId,
    name: String,                    // Organization name
    description: String,             // Organization description  
    organizationType: String,        // 'school-based' or 'community-based'
    contactPerson: String,           // Contact person name
    contactEmail: String,            // Contact email
    contactPhone: String,            // Contact phone
    createdAt: Date,
    updatedAt: Date
}

// Example document:
const organizationExample = {
    _id: ObjectId("507f1f77bcf86cd799439011"),
    name: "Student Council",
    description: "University Student Government",
    organizationType: "school-based",
    contactPerson: "John Doe",
    contactEmail: "john@university.edu",
    contactPhone: "123-456-7890",
    createdAt: new Date(),
    updatedAt: new Date()
}

// ===============================================
// 2. PROPOSALS COLLECTION (Unified for both event types)
// ===============================================
const proposalSchema = {
    _id: ObjectId,
    organizationId: ObjectId,        // Reference to organizations collection

    // Event Details (Works for both school and community events)
    eventName: String,
    venue: String,
    startDate: Date,
    endDate: Date,
    timeStart: String,               // "09:00"
    timeEnd: String,                 // "17:00"

    // Event Type and Mode
    eventType: String,               // 'academic-enhancement', 'workshop', etc.
    eventMode: String,               // 'online', 'offline', 'hybrid'

    // Flexible fields for different event types
    targetAudience: [String],        // ["1st Year", "2nd Year", etc.]
    eventSpecificData: {             // School: returnServiceCredit, Community: sdpCredits
        returnServiceCredit: String,   // For school events
        sdpCredits: String            // For community events
    },

    // Status and Workflow
    proposalStatus: String,          // 'draft', 'pending', 'approved', 'denied'
    adminComments: String,

    // 🎯 FILE METADATA STORAGE (Your requested approach)
    files: {
        gpoa: {
            filename: String,            // "StudentCouncil_GPOA.pdf"
            originalName: String,        // Original filename from user
            path: String,                // "/uploads/files/uuid.pdf"
            size: Number,                // 1024000 (bytes)
            mimeType: String,            // "application/pdf"
            uploadedAt: Date,            // Upload timestamp
            fileHash: String             // SHA-256 for deduplication (optional)
        },
        proposal: {
            filename: String,
            originalName: String,
            path: String,
            size: Number,
            mimeType: String,
            uploadedAt: Date,
            fileHash: String
        }
    },

    // Timestamps
    createdAt: Date,
    updatedAt: Date,
    submittedAt: Date,
    reviewedAt: Date
}

// Example school event proposal:
const schoolProposalExample = {
    _id: ObjectId("507f1f77bcf86cd799439012"),
    organizationId: ObjectId("507f1f77bcf86cd799439011"),

    // Event details
    eventName: "Annual Science Fair",
    venue: "University Gymnasium",
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-03-15"),
    timeStart: "09:00",
    timeEnd: "17:00",

    eventType: "academic-enhancement",
    eventMode: "offline",
    targetAudience: ["1st Year", "2nd Year", "3rd Year", "4th Year"],

    eventSpecificData: {
        returnServiceCredit: "2"
    },

    proposalStatus: "pending",
    adminComments: "",

    // 🎯 YOUR FILE METADATA APPROACH
    files: {
        gpoa: {
            filename: "StudentCouncil_GPOA.pdf",
            originalName: "General Plan of Action.pdf",
            path: "/uploads/files/uuid-gpoa-123.pdf",
            size: 1024000,
            mimeType: "application/pdf",
            uploadedAt: new Date("2024-01-15T10:30:00Z"),
            fileHash: "sha256-abcd1234..."
        },
        proposal: {
            filename: "StudentCouncil_PP.pdf",
            originalName: "Project Proposal Document.pdf",
            path: "/uploads/files/uuid-proposal-456.pdf",
            size: 2048000,
            mimeType: "application/pdf",
            uploadedAt: new Date("2024-01-15T10:35:00Z"),
            fileHash: "sha256-efgh5678..."
        }
    },

    createdAt: new Date(),
    updatedAt: new Date(),
    submittedAt: new Date(),
    reviewedAt: null
}

// Example community event proposal:
const communityProposalExample = {
    _id: ObjectId("507f1f77bcf86cd799439013"),
    organizationId: ObjectId("507f1f77bcf86cd799439011"),

    eventName: "Leadership Training Workshop",
    venue: "Community Center",
    startDate: new Date("2024-04-10"),
    endDate: new Date("2024-04-12"),
    timeStart: "08:00",
    timeEnd: "16:00",

    eventType: "leadership-training",
    eventMode: "hybrid",
    targetAudience: ["Leaders", "All Levels"],

    eventSpecificData: {
        sdpCredits: "2"
    },

    proposalStatus: "approved",

    files: {
        gpoa: {
            filename: "CommunityOrg_GPOA.pdf",
            path: "/uploads/files/uuid2-gpoa.pdf",
            size: 1500000,
            mimeType: "application/pdf",
            uploadedAt: new Date()
        },
        proposal: {
            filename: "CommunityOrg_PP.docx",
            path: "/uploads/files/uuid2-proposal.docx",
            size: 3000000,
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadedAt: new Date()
        }
    }
}

// ===============================================
// 3. ACCOMPLISHMENT REPORTS COLLECTION  
// ===============================================
const accomplishmentReportSchema = {
    _id: ObjectId,
    proposalId: ObjectId,            // Reference to proposals collection

    // Report Details
    description: String,
    attendanceCount: Number,
    eventStatus: String,             // 'completed', 'cancelled', 'postponed'

    // Files and Signature (using same metadata approach)
    files: {
        accomplishmentReport: {
            filename: String,
            originalName: String,
            path: String,
            size: Number,
            mimeType: String,
            uploadedAt: Date
        }
    },

    digitalSignature: String,        // Base64 encoded or file path

    // Status
    reportStatus: String,            // 'draft', 'pending', 'approved', 'denied'
    adminComments: String,

    // Timestamps
    createdAt: Date,
    updatedAt: Date,
    submittedAt: Date,
    reviewedAt: Date
}

// ===============================================
// 4. MONGODB INDEXES FOR PERFORMANCE
// ===============================================

/*
// Create indexes for efficient queries
db.organizations.createIndex({ "contactEmail": 1 })
db.organizations.createIndex({ "organizationType": 1 })

db.proposals.createIndex({ "organizationId": 1 })
db.proposals.createIndex({ "proposalStatus": 1 })
db.proposals.createIndex({ "eventType": 1 })
db.proposals.createIndex({ "startDate": 1, "endDate": 1 })
db.proposals.createIndex({ "targetAudience": 1 })

// Text search index for searching events
db.proposals.createIndex({
  "eventName": "text",
  "venue": "text", 
  "adminComments": "text"
})

db.accomplishment_reports.createIndex({ "proposalId": 1 })
db.accomplishment_reports.createIndex({ "reportStatus": 1 })
*/

// ===============================================
// 5. API INTEGRATION EXAMPLES
// ===============================================

// Save organization (Section 2)
const saveOrganization = async (orgData) => {
    return await db.collection('organizations').insertOne({
        name: orgData.organizationName,
        description: orgData.organizationDescription,
        organizationType: orgData.organizationType,
        contactPerson: orgData.contactName,
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
        createdAt: new Date(),
        updatedAt: new Date()
    })
}

// Save school event proposal (Section 3) with file metadata
const saveSchoolEventProposal = async (eventData, fileMetadata) => {
    return await db.collection('proposals').insertOne({
        organizationId: ObjectId(eventData.organizationId),

        // Event details
        eventName: eventData.schoolEventName,
        venue: eventData.schoolVenue,
        startDate: new Date(eventData.schoolStartDate),
        endDate: new Date(eventData.schoolEndDate),
        timeStart: eventData.schoolTimeStart,
        timeEnd: eventData.schoolTimeEnd,

        eventType: eventData.schoolEventType,
        eventMode: eventData.schoolEventMode,
        targetAudience: eventData.schoolTargetAudience,

        eventSpecificData: {
            returnServiceCredit: eventData.schoolReturnServiceCredit
        },

        proposalStatus: 'pending',

        // 🎯 YOUR FILE METADATA APPROACH
        files: {
            gpoa: fileMetadata.gpoa,
            proposal: fileMetadata.proposal
        },

        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date()
    })
}

// Save community event proposal (Section 4) with file metadata
const saveCommunityEventProposal = async (eventData, fileMetadata) => {
    return await db.collection('proposals').insertOne({
        organizationId: ObjectId(eventData.organizationId),

        eventName: eventData.communityEventName,
        venue: eventData.communityVenue,
        startDate: new Date(eventData.communityStartDate),
        endDate: new Date(eventData.communityEndDate),
        timeStart: eventData.communityTimeStart,
        timeEnd: eventData.communityTimeEnd,

        eventType: eventData.communityEventType,
        eventMode: eventData.communityEventMode,
        targetAudience: eventData.communityTargetAudience,

        eventSpecificData: {
            sdpCredits: eventData.communitySDPCredits
        },

        proposalStatus: 'pending',

        // 🎯 YOUR FILE METADATA APPROACH  
        files: {
            gpoa: fileMetadata.gpoa,
            proposal: fileMetadata.proposal
        },

        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date()
    })
}

// Save accomplishment report (Section 5) with file metadata
const saveAccomplishmentReport = async (reportData, fileMetadata, signatureData) => {
    return await db.collection('accomplishment_reports').insertOne({
        proposalId: ObjectId(reportData.proposalId),

        description: reportData.reportDescription,
        attendanceCount: parseInt(reportData.attendanceCount),
        eventStatus: reportData.eventStatus,

        files: {
            accomplishmentReport: fileMetadata.accomplishmentReport
        },

        digitalSignature: signatureData,
        reportStatus: 'pending',

        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date()
    })
}

// Query for Section 1 Overview
const getUserProposals = async (userEmail) => {
    return await db.collection('proposals').aggregate([
        {
            $lookup: {
                from: 'organizations',
                localField: 'organizationId',
                foreignField: '_id',
                as: 'organization'
            }
        },
        {
            $lookup: {
                from: 'accomplishment_reports',
                localField: '_id',
                foreignField: 'proposalId',
                as: 'reports'
            }
        },
        {
            $match: {
                'organization.contactEmail': userEmail
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]).toArray()
}

// ===============================================
// 6. FILE HANDLING FUNCTIONS
// ===============================================

// Function to generate file metadata when uploading
const generateFileMetadata = (file, fileType, organizationName) => {
    const timestamp = new Date()
    const uuid = require('crypto').randomUUID()
    const extension = file.originalname.split('.').pop()

    return {
        filename: `${organizationName}_${fileType.toUpperCase()}.${extension}`,
        originalName: file.originalname,
        path: `/uploads/files/${uuid}.${extension}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: timestamp,
        fileHash: null // Calculate if needed
    }
}

// ===============================================
// 7. BENEFITS OF MONGODB-ONLY APPROACH
// ===============================================

/*
✅ FAMILIAR TECHNOLOGY - Continue with MongoDB you already know
✅ DOCUMENT FLEXIBILITY - Perfect for varying file metadata
✅ EMBEDDED DOCUMENTS - File metadata directly in proposals  
✅ ARRAY SUPPORT - Native support for targetAudience arrays
✅ AGGREGATION PIPELINE - Powerful queries across collections
✅ GRIDFS COMPATIBLE - Can switch to GridFS later if needed
✅ NO NEW LEARNING - Stick with your current MongoDB knowledge
✅ QUICK IMPLEMENTATION - Minimal changes to existing code
✅ HORIZONTAL SCALING - MongoDB scales well as you grow
✅ JSON-NATIVE - Perfect match for your JavaScript/Node.js stack
*/

module.exports = {
    organizationSchema,
    proposalSchema,
    accomplishmentReportSchema,
    saveOrganization,
    saveSchoolEventProposal,
    saveCommunityEventProposal,
    saveAccomplishmentReport,
    getUserProposals,
    generateFileMetadata
} 