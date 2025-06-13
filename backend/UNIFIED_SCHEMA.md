# 📊 **Unified Database Schema for Submit-Event Flow**

## 📋 **Overview**

This document outlines the unified database schema that handles all 5 sections of the submit-event workflow, supporting both **MySQL** (legacy) and **MongoDB** (new) implementations.

## 🏗️ **Database Architecture**

### **Dual Database Strategy**
- **MySQL**: Maintains existing legacy data and basic CRUD operations
- **MongoDB**: New implementation for enhanced file handling and flexible schema

## 📝 **Section Flow & Data Model**

### **Section 1: Overview**
- **Purpose**: Entry point and status tracking
- **Data**: `hasActiveProposal`, `proposalStatus`, `reportStatus`

### **Section 2: Organization Information**
```javascript
{
  organizationName: String,
  organizationTypes: ["school-based", "community-based"],
  organizationDescription: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String
}
```

### **Section 3: School-Based Events** (if `organizationTypes` includes "school-based")
```javascript
{
  schoolEventName: String,
  schoolVenue: String,
  schoolStartDate: Date,
  schoolEndDate: Date,
  schoolTimeStart: String, // HH:MM format
  schoolTimeEnd: String,   // HH:MM format
  schoolEventType: ["academic-enhancement", "workshop-seminar-webinar", "conference", "competition", "cultural-show", "sports-fest", "other"],
  schoolEventMode: ["online", "offline", "hybrid"],
  schoolReturnServiceCredit: ["1", "2", "3", "Not Applicable"],
  schoolTargetAudience: ["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Faculty", "Staff", "Alumni", "External Guests"],
  schoolGPOAFile: File,
  schoolProposalFile: File
}
```

### **Section 4: Community-Based Events** (if `organizationTypes` includes "community-based")
```javascript
{
  communityEventName: String,
  communityVenue: String,
  communityStartDate: Date,
  communityEndDate: Date,
  communityTimeStart: String, // HH:MM format
  communityTimeEnd: String,   // HH:MM format
  communityEventType: ["academic", "seminar", "assembly", "leadership", "other"],
  communityEventMode: ["online", "offline", "hybrid"],
  communitySDPCredits: ["1", "2"],
  communityTargetAudience: ["1st Year", "2nd Year", "3rd Year", "4th Year", "All Levels", "Leaders", "Alumni"],
  communityGPOAFile: File,
  communityProposalFile: File
}
```

### **Section 5: Reporting & Documentation**
```javascript
{
  reportDescription: String,
  attendanceCount: Number,
  eventStatus: ["completed", "cancelled", "postponed"],
  accomplishmentReport: File,
  signature: String // Base64 digital signature
}
```

## 🗄️ **MongoDB Schema (Proposal Model)**

```javascript
const ProposalSchema = new mongoose.Schema({
  // Core proposal information
  title: String,
  description: String,
  category: ["school-event", "community-event"],
  startDate: Date,
  endDate: Date,
  location: String,
  
  // User and organization
  submitter: String,
  organizationType: ["school-based", "community-based"],
  
  // Event-specific details
  eventDetails: {
    timeStart: String,
    timeEnd: String,
    eventType: ["academic", "workshop", "seminar", "assembly", "leadership", "other"],
    eventMode: ["offline", "online", "hybrid"],
    returnServiceCredit: Number,
    targetAudience: [String],
    organizationId: String
  },
  
  // Contact information
  contactPerson: String,
  contactEmail: String,
  contactPhone: String,
  
  // Status and workflow
  status: ["draft", "pending", "approved", "rejected"],
  adminComments: String,
  
  // File attachments
  documents: [{
    name: String,
    path: String,
    mimetype: String,
    size: Number,
    type: ["gpoa", "proposal", "accomplishment", "other"],
    uploadedAt: Date
  }],
  
  // Review system
  reviewComments: [{
    reviewer: String,
    comment: String,
    decision: ["approve", "reject", "revise"],
    createdAt: Date
  }],
  
  // Compliance tracking
  complianceStatus: ["not_applicable", "pending", "compliant", "overdue"],
  complianceDocuments: [{
    name: String,
    path: String,
    required: Boolean,
    submitted: Boolean,
    submittedAt: Date
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
});
```

## 🛣️ **API Endpoints**

### **School Events**
- `POST /api/proposals/school-events` - Create school event proposal
- `GET /api/proposals/school-events` - List school events
- `GET /api/proposals/school-events/:id` - Get specific school event
- `PUT /api/proposals/school-events/:id` - Update school event

### **Community Events**
- `POST /api/proposals/community-events` - Create community event proposal
- `GET /api/proposals/community-events` - List community events
- `GET /api/proposals/community-events/:id` - Get specific community event
- `PUT /api/proposals/community-events/:id` - Update community event

### **General Proposals**
- `GET /api/proposals` - List all proposals
- `GET /api/proposals/:id` - Get proposal by ID
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal
- `POST /api/proposals/:id/documents` - Add documents
- `DELETE /api/proposals/:id/documents/:docId` - Remove document

## 📁 **File Storage Strategy**

### **File Types**
- **GPOA**: General Plan of Action documents
- **Proposal**: Project proposal documents
- **Accomplishment**: Post-event reports
- **Other**: Miscellaneous attachments

### **File Naming Convention**
- **GPOA**: `OrganizationName_GPOA.pdf/docx/xlsx`
- **Proposal**: `OrganizationName_PP.pdf/docx/xlsx`
- **Report**: `OrganizationName_AR.pdf/docx`

### **Storage Location**
- **Physical Files**: `backend/uploads/proposals/`
- **Metadata**: MongoDB `documents` array
- **Max Size**: 5MB per file
- **Allowed Types**: PDF, Word (.doc/.docx), Excel (.xls/.xlsx)

## 🔄 **Workflow States**

### **Proposal Workflow**
1. **draft** → User is editing
2. **pending** → Submitted for review
3. **approved** → Admin approved
4. **rejected** → Admin denied (can be edited and resubmitted)

### **Report Workflow**
1. **draft** → User is preparing report
2. **pending** → Report submitted for review
3. **approved** → Report approved
4. **rejected** → Report denied (can be edited and resubmitted)

## 🔐 **Authentication & Authorization**

### **User Roles**
- **student**: Can create and edit their own proposals
- **head_admin**: Full access to all proposals and reviews
- **manager**: Can review and approve proposals
- **reviewer**: Can add review comments

### **Access Control**
- Users can only view/edit their own proposals
- Admins and managers can view all proposals
- Reviewers can add comments to assigned proposals

## 🔧 **Validation Rules**

### **Common Validations**
- Required fields marked with `*` in UI
- Date validation (start date < end date)
- Time format validation (HH:MM)
- File type and size validation
- Email format validation

### **Business Rules**
- Organization must select at least one type (school-based OR community-based)
- Target audience must have at least one selection
- Files must follow naming convention
- Cannot edit proposals in "pending" or "approved" status

## 🚀 **Implementation Status**

### ✅ **Completed**
- MongoDB schema design
- Dual database integration
- Section 3 (School Events) MongoDB saving
- Section 4 (Community Events) MongoDB saving
- File upload and metadata storage
- Validation system
- API endpoints for both event types

### 🔄 **In Progress**
- Section 5 (Reporting) integration
- File download endpoints
- Admin review interface

### 📋 **To Do**
- Data migration scripts
- Full authentication re-enabling
- Performance optimization
- Error handling enhancement

## 🐛 **Testing & Debugging**

### **Test Files**
- `backend/test-mongodb-school-events.js` - MongoDB connectivity test
- `backend/test-school-events-api.js` - School events API test

### **Debug Endpoints**
- `GET /health` - Server health check
- `GET /api/db-check` - Database connection check
- `GET /api/tables-check` - MySQL tables check

### **Logs**
- MongoDB operations logged with detailed debug info
- File upload/validation errors logged
- Validation failures with field-specific messages

## 📞 **Support & Maintenance**

For issues or questions about the unified schema:
1. Check the debug logs in browser console
2. Verify MongoDB and backend server status
3. Test API endpoints with provided test scripts
4. Review validation error messages for specific field issues

---

**Last Updated**: Generated during Section 4 Community Events implementation  
**Schema Version**: 2.0 (Dual Database Support)  
**Compatibility**: MongoDB 4.4+, MySQL 8.0+, Node.js 16+ 