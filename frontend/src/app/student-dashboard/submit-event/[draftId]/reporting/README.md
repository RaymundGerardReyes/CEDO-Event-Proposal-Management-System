# 📋 Reporting Section - Accomplishment Reports

## Overview

The Reporting Section enables students to submit final accomplishment reports after their event proposals have been approved by administrators. This comprehensive system includes status-based access control, form validation, file uploads with naming conventions, and event amendment tracking.

## 🎯 Key Features

### Status-Based Access Control
- **Locked until approved**: Reporting section is only accessible after proposal approval
- **Dynamic UI**: Interface changes based on proposal and report status
- **Progress tracking**: Visual indicators for form completion and submission status

### Accomplishment Report Submission
- **Event details**: Final event name, completion narrative, and outcome reporting
- **File upload**: PDF/DOC/DOCX uploads with strict naming conventions
- **Validation**: Comprehensive form validation with real-time feedback
- **Auto-save**: Automatic form data persistence with localStorage fallback

### Event Amendment Tracking
- **Change detection**: Optional form for reporting logistical changes
- **Amendment details**: Final venue, dates, times, and event mode updates
- **Reason tracking**: Documentation of why changes were necessary

### Admin Feedback Integration
- **Revision support**: Display admin comments when reports need revisions
- **Status tracking**: Real-time status updates from backend
- **Comment display**: Read-only admin feedback with clear action items

## 📁 Directory Structure

```
reporting/
├── page.jsx                           # Main reporting page
├── components/                        # UI Components
│   ├── ProposalStatusDisplay.jsx     # Status and metadata display
│   ├── AdminFeedbackDisplay.jsx      # Admin comments display
│   ├── AccomplishmentReportForm.jsx  # Main report submission form
│   └── EventAmendmentForm.jsx        # Event amendment form
├── hooks/                            # Custom React hooks
│   └── useReportingData.js          # Reporting data management
├── services/                         # API and business logic
│   └── reportingService.js          # Reporting API operations
├── types/                           # Type definitions
│   └── index.js                     # JSDoc type annotations
└── README.md                        # This documentation
```

## 🔧 Components

### Main Page (`page.jsx`)
**Purpose**: Central orchestrator for the reporting flow
**Features**:
- Status-based access control
- Dynamic component rendering
- Error handling and loading states
- localStorage integration for offline capability

**Key Logic**:
```javascript
// Check if reporting is accessible
const isReportingAccessible = proposalStatus === 'approved';
const isReportInRevision = reportStatus === 'revision';
const isReportApproved = reportStatus === 'approved';
```

### Proposal Status Display (`ProposalStatusDisplay.jsx`)
**Purpose**: Display current proposal and report status
**Information Shown**:
- Proposal status (draft, pending, approved, denied)
- Report status (draft, pending, revision, approved)
- MySQL proposal ID
- Submission timestamps
- Status explanations

### Admin Feedback Display (`AdminFeedbackDisplay.jsx`)
**Purpose**: Show admin comments when report needs revision
**Features**:
- Conditional rendering (only shows in revision status)
- Read-only comment display
- Action item instructions
- Visual hierarchy with alerts

### Accomplishment Report Form (`AccomplishmentReportForm.jsx`)
**Purpose**: Main form for submitting accomplishment reports
**Fields**:
- **Event Name**: Final name of the implemented event
- **Completion Details**: Narrative summary of event execution
- **Outcome Reporting**: Results, impact, and success metrics
- **File Upload**: PDF/DOC/DOCX with naming convention validation

**File Naming Convention**:
```
{OrganizationName}_AR.{extension}
Example: "Student_Council_AR.pdf"
```

### Event Amendment Form (`EventAmendmentForm.jsx`)
**Purpose**: Track changes from original proposal
**Fields**:
- Final venue, dates, times, and event mode
- Reason for changes
- Conditional form (only shows when changes are indicated)

## 🎣 Custom Hooks

### useReportingData
**Purpose**: Centralized state management for reporting functionality
**Features**:
- Form data management
- Validation logic
- Auto-save functionality
- Progress tracking
- Error handling

**Usage**:
```javascript
const {
    formData,
    isLoading,
    isSubmitting,
    error,
    validationErrors,
    updateFormData,
    submitReport,
    validateForm
} = useReportingData(initialData);
```

## 🔌 Services

### ReportingService
**Purpose**: API operations and business logic
**Methods**:
- `submitAccomplishmentReport()` - Submit report with file upload
- `submitEventAmendments()` - Submit event changes
- `getProposalStatus()` - Fetch current status
- `getReportStatusWithRetry()` - Retry logic for status fetching
- `validateFileName()` - File naming convention validation

**Error Handling**:
- Retry logic with exponential backoff
- Comprehensive error messages
- Graceful degradation with localStorage

## 📊 Status Flow

### Proposal Status Flow
```
Draft → Pending → Approved → [Reporting Available]
                ↓
              Denied → [Resubmit Required]
```

### Report Status Flow
```
Draft → Pending → Approved
        ↓
      Revision → [Admin Comments] → Pending → Approved
```

### Access Control Matrix
| Proposal Status | Report Status | Access Level | Available Actions |
|----------------|---------------|--------------|-------------------|
| draft | - | Locked | None |
| pending | - | Locked | None |
| denied | - | Locked | Resubmit proposal |
| approved | draft | Full Access | Submit report |
| approved | pending | Read-only | View submitted report |
| approved | revision | Full Access | Update report |
| approved | approved | Read-only | View approved report |

## 🔒 File Upload Requirements

### Supported Formats
- PDF (.pdf)
- Microsoft Word (.doc, .docx)

### Naming Convention
Files must follow the pattern: `{OrganizationName}_AR.{extension}`
- Organization name with spaces replaced by underscores
- Must include "_AR" suffix
- Case-sensitive validation

### Validation Logic
```javascript
const validateFileName = (fileName, organizationName) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const fileNameWithoutExt = fileName.split('.')[0];
    const expectedPrefix = organizationName.replace(/\s+/g, '_');
    
    return {
        isValid: ['pdf', 'doc', 'docx'].includes(fileExtension) &&
                fileNameWithoutExt.includes(expectedPrefix),
        error: !isValid ? 'Invalid file name or format' : null
    };
};
```

## 🎨 UI/UX Features

### Status-Based Rendering
- **Locked State**: Yellow warning with status explanation
- **Active Form**: Full form with validation and auto-save
- **Revision State**: Orange alerts with admin feedback
- **Approved State**: Green success with read-only display

### Progress Indicators
- Form completion percentage
- File upload status
- Submission progress
- Auto-save indicators

### Error Handling
- Real-time validation feedback
- Network error recovery
- File upload error handling
- Graceful degradation

## 🔄 Data Flow

### Initial Load
1. Load from localStorage for immediate access
2. Fetch latest status from backend
3. Update localStorage with fresh data
4. Render appropriate UI based on status

### Form Submission
1. Validate form data
2. Upload file with naming validation
3. Submit to backend API
4. Update status and localStorage
5. Show success/error feedback

### Auto-Save
1. Debounced save to localStorage
2. Progress tracking
3. Error recovery
4. Offline capability

## 🧪 Testing Considerations

### Unit Tests
- Component rendering with different statuses
- Form validation logic
- File naming validation
- Error handling scenarios

### Integration Tests
- End-to-end submission flow
- Status updates from backend
- File upload functionality
- Auto-save behavior

### Edge Cases
- Network failures
- Invalid file formats
- Large file uploads
- Concurrent submissions

## 🚀 Performance Optimizations

### Lazy Loading
- Components loaded on demand
- Suspense boundaries for async operations
- Progressive enhancement

### Caching Strategy
- localStorage for offline capability
- Debounced auto-save
- Optimistic updates

### Error Recovery
- Retry logic with exponential backoff
- Graceful degradation
- User-friendly error messages

## 🔧 Configuration

### Environment Variables
```javascript
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### API Endpoints
```javascript
const ENDPOINTS = {
    ACCOMPLISHMENT_REPORTS: '/api/mongodb-unified/reports/accomplishment-reports',
    EVENT_AMENDMENTS: '/api/mongodb-unified/reports/event-amendments',
    PROPOSAL_STATUS: '/api/mongodb-unified/reports/proposal'
};
```

## 📝 Usage Examples

### Basic Implementation
```javascript
import { ReportingPage } from './reporting/page';

// The page automatically handles:
// - Status checking
// - Access control
// - Form rendering
// - Error handling
```

### Custom Hook Usage
```javascript
import { useReportingData } from './hooks/useReportingData';

const MyComponent = () => {
    const {
        formData,
        updateFormData,
        submitReport,
        canSubmit
    } = useReportingData(initialData);

    return (
        <form onSubmit={submitReport}>
            {/* Form fields */}
        </form>
    );
};
```

### Service Usage
```javascript
import { ReportingService } from './services/reportingService';

// Submit report
const result = await ReportingService.submitAccomplishmentReport({
    proposalId: '123',
    eventName: 'Science Fair 2024',
    completionDetails: 'Event was successfully completed...',
    outcomeReporting: '150 students participated...',
    accomplishmentReportFile: file
});
```

## 🐛 Troubleshooting

### Common Issues

**File Upload Fails**
- Check file naming convention
- Verify file format (PDF/DOC/DOCX)
- Ensure file size is reasonable

**Form Not Submitting**
- Check all required fields are filled
- Verify proposal is approved
- Check network connectivity

**Status Not Updating**
- Refresh page to fetch latest status
- Check localStorage for cached data
- Verify backend API is responding

### Debug Tools
- Development mode shows debug panels
- Console logging for all operations
- Network tab for API calls
- localStorage inspection for data

## 🔮 Future Enhancements

### Planned Features
- Rich text editor for reports
- Image uploads for event documentation
- Email notifications for status changes
- Advanced file validation
- Bulk report submission

### Performance Improvements
- Virtual scrolling for large datasets
- Service worker for offline support
- Optimistic UI updates
- Advanced caching strategies

---

**🎉 The Reporting Section provides a comprehensive, user-friendly system for accomplishment report submission with robust validation, error handling, and status tracking!** 