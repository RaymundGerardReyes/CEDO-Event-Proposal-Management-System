# CEDO Event Management System - Activity Diagram

## Overview
This document provides a comprehensive Mermaid Activity Diagram for the CEDO Event Management System based on actual code analysis from the frontend and backend implementations. The diagram shows all activities, decision points, parallel processes, and swim lanes for different actors in the system.

## Activity Categories

### 1. **User Authentication Activities**
- Based on `frontend/src/contexts/auth-context.js` and `backend/routes/auth.js`
- Email/password authentication with reCAPTCHA verification
- Google OAuth integration activities
- User approval workflow activities

### 2. **Proposal Submission Activities**
- Based on `frontend/src/app/main/student-dashboard/submit-event/SubmitEventFlow.jsx`
- Multi-step form progression activities
- Auto-save and localStorage persistence activities
- Form validation and error handling activities

### 3. **Admin Review Activities**
- Based on `backend/routes/mongodb-unified/admin.routes.js`
- Proposal review and decision-making activities
- Comment management and notification activities
- Status update and audit logging activities

### 4. **File Management Activities**
- Based on hybrid file service implementation
- File upload and validation activities
- GridFS vs filesystem storage decision activities
- Metadata management activities

### 5. **Database Operations Activities**
- MySQL and MongoDB parallel operations
- Hybrid data merging activities
- Transaction management and error handling

## Comprehensive Activity Diagram

```mermaid
flowchart TD
    %% ========================================
    %% SWIMLANE DEFINITIONS (Virtual Swimlanes)
    %% ========================================
    
    subgraph Student_Lane ["👨‍🎓 Student Activities"]
        direction TB
        
        %% Initial Student Activities
        Start([🚀 User Visits CEDO System])
        Start --> CheckAuth{🔐 Authenticated?}
        
        %% Authentication Activities
        CheckAuth -->|No| SignInActivity[📱 Navigate to Sign-In Page]
        SignInActivity --> AuthMethod{Choose Authentication Method}
        
        %% Email/Password Authentication Branch
        AuthMethod -->|Email/Password| EmailForm[📝 Fill Email & Password Form]
        EmailForm --> ReCaptcha[🤖 Complete reCAPTCHA Verification]
        ReCaptcha --> SubmitCredentials[🔑 Submit Login Credentials]
        
        %% Google OAuth Authentication Branch  
        AuthMethod -->|Google Sign-In| GoogleButton[🌐 Click Google Sign-In Button]
        GoogleButton --> GoogleAuth[🔐 Authenticate with Google]
        GoogleAuth --> GoogleToken[🎫 Receive Google ID Token]
        
        %% Continue to dashboard after auth
        CheckAuth -->|Yes| LoadDashboard[📊 Load Student Dashboard]
        
        %% Dashboard Activities
        LoadDashboard --> DashboardAction{Choose Dashboard Action}
        DashboardAction -->|Submit Event| StartProposal[📋 Start New Proposal]
        DashboardAction -->|View Proposals| ViewProposals[👀 View My Proposals]
        DashboardAction -->|Manage Profile| ManageProfile[👤 Edit Profile]
        
        %% Proposal Submission Activities
        StartProposal --> CheckSavedData{📂 Saved Data Exists?}
        CheckSavedData -->|Yes| RestoreDialog[🔄 Show Restore Data Dialog]
        CheckSavedData -->|No| OverviewSection[📝 Fill Overview Section]
        RestoreDialog -->|Restore| LoadSavedData[💾 Load Saved Form Data]
        RestoreDialog -->|Start Fresh| OverviewSection
        LoadSavedData --> DetermineSection[🧭 Determine Current Section]
        
        OverviewSection --> EventTypeSelection[🎯 Select Event Type]
        EventTypeSelection --> OrgInfoSection[🏢 Fill Organization Info]
        
        %% Auto-save Activities (Parallel)
        OrgInfoSection --> AutoSaveOrg[💾 Auto-save Organization Data]
        AutoSaveOrg --> ValidateOrgInfo{✅ Validate Organization Data}
        ValidateOrgInfo -->|Valid| EventTypeCheck{Event Type?}
        ValidateOrgInfo -->|Invalid| ShowOrgErrors[❌ Show Validation Errors]
        ShowOrgErrors --> OrgInfoSection
        
        %% School Event vs Community Event Branch
        EventTypeCheck -->|School Event| SchoolEventSection[🏫 Fill School Event Details]
        EventTypeCheck -->|Community Event| CommunityEventSection[🌍 Fill Community Event Details]
        
        %% School Event Activities
        SchoolEventSection --> AutoSaveSchool[💾 Auto-save School Data]
        AutoSaveSchool --> ValidateSchoolEvent{✅ Validate School Event}
        ValidateSchoolEvent -->|Valid| ReportingSection[📊 Fill Reporting Section]
        ValidateSchoolEvent -->|Invalid| ShowSchoolErrors[❌ Show Validation Errors]
        ShowSchoolErrors --> SchoolEventSection
        
        %% Community Event Activities
        CommunityEventSection --> AutoSaveCommunity[💾 Auto-save Community Data]
        AutoSaveCommunity --> ValidateCommunityEvent{✅ Validate Community Event}
        ValidateCommunityEvent -->|Valid| ReportingSection
        ValidateCommunityEvent -->|Invalid| ShowCommunityErrors[❌ Show Validation Errors]
        ShowCommunityErrors --> CommunityEventSection
        
        %% Reporting and File Upload Activities
        ReportingSection --> FileUploadCheck{📎 Files to Upload?}
        FileUploadCheck -->|Yes| SelectFiles[📁 Select Files for Upload]
        FileUploadCheck -->|No| ValidateReporting{✅ Validate Reporting Data}
        
        SelectFiles --> ValidateFiles[🔍 Validate File Types & Sizes]
        ValidateFiles --> FileUploadProcess[📤 Upload Files]
        
        %% Final Submission Activities
        ValidateReporting -->|Valid| SubmissionDialog[✅ Show Submission Confirmation]
        ValidateReporting -->|Invalid| ShowReportingErrors[❌ Show Validation Errors]
        ShowReportingErrors --> ReportingSection
        
        SubmissionDialog -->|Confirm| FinalSubmission[🚀 Submit Final Proposal]
        SubmissionDialog -->|Cancel| ReportingSection
        
        FinalSubmission --> SubmissionSuccess[🎉 Show Success Message]
        SubmissionSuccess --> BackToDashboard[🏠 Return to Dashboard]
        BackToDashboard --> LoadDashboard
    end
    
    subgraph Backend_Lane ["⚙️ Backend Processing Activities"]
        direction TB
        
        %% Authentication Processing
        ReceiveLogin[📥 Receive Login Request]
        ReceiveGoogleToken[📥 Receive Google Token]
        
        %% Email/Password Processing
        ReceiveLogin --> VerifyReCaptcha[🤖 Verify reCAPTCHA Token]
        VerifyReCaptcha --> VerifyReCaptchaResult{reCAPTCHA Valid?}
        VerifyReCaptchaResult -->|No| AuthError[❌ Authentication Error]
        VerifyReCaptchaResult -->|Yes| ValidateCredentials[🔍 Validate User Credentials]
        
        ValidateCredentials --> CredentialsValid{Credentials Valid?}
        CredentialsValid -->|No| AuthError
        CredentialsValid -->|Yes| CheckUserApproval[👥 Check User Approval Status]
        
        %% Google OAuth Processing
        ReceiveGoogleToken --> VerifyGoogleToken[🔐 Verify Google ID Token]
        VerifyGoogleToken --> GoogleTokenValid{Google Token Valid?}
        GoogleTokenValid -->|No| AuthError
        GoogleTokenValid -->|Yes| FindOrCreateUser[👤 Find or Create Google User]
        FindOrCreateUser --> CheckUserApproval
        
        %% User Approval Check
        CheckUserApproval --> UserApproved{User Approved?}
        UserApproved -->|No| PendingApprovalResponse[⏳ Send Pending Approval Response]
        UserApproved -->|Yes| GenerateJWT[🎫 Generate JWT Token]
        GenerateJWT --> SendAuthSuccess[✅ Send Authentication Success]
        
        %% Proposal Processing
        ReceiveProposal[📥 Receive Proposal Submission]
        ReceiveProposal --> ValidateProposalData[✅ Validate Proposal Data]
        ValidateProposalData --> ProposalDataValid{Data Valid?}
        ProposalDataValid -->|No| ValidationError[❌ Send Validation Error]
        ProposalDataValid -->|Yes| SaveToMySQL[💾 Save to MySQL Database]
        SaveToMySQL --> SaveToMongoDB[💾 Save to MongoDB Database]
        SaveToMongoDB --> UpdateProposalStatus[📝 Update Proposal Status to 'Pending']
        UpdateProposalStatus --> NotifyAdmins[📧 Notify Admins of New Proposal]
        NotifyAdmins --> SendSubmissionSuccess[✅ Send Submission Success]
        
        %% File Processing Activities (Parallel)
        ReceiveFiles[📥 Receive File Upload]
        ReceiveFiles --> ProcessFilesParallel{📊 Process Files in Parallel}
        
        %% File Size Decision
        ProcessFilesParallel -->|Large Files| GridFSUpload[🗄️ Upload to MongoDB GridFS]
        ProcessFilesParallel -->|Small Files| FilesystemUpload[📁 Upload to Filesystem]
        
        GridFSUpload --> GridFSMetadata[📋 Store GridFS Metadata]
        FilesystemUpload --> FilesystemMetadata[📋 Store Filesystem Metadata]
        
        GridFSMetadata --> FileProcessingComplete[✅ File Processing Complete]
        FilesystemMetadata --> FileProcessingComplete
    end
    
    subgraph Admin_Lane ["👨‍💼 Admin Activities"]
        direction TB
        
        %% Admin Dashboard Activities
        AdminStart([🚀 Admin Accesses System])
        AdminStart --> AdminAuth{🔐 Admin Authenticated?}
        AdminAuth -->|No| AdminSignIn[📱 Admin Sign-In Process]
        AdminAuth -->|Yes| AdminDashboard[📊 Load Admin Dashboard]
        
        AdminSignIn --> AdminDashboard
        AdminDashboard --> AdminAction{Choose Admin Action}
        
        %% Proposal Review Activities
        AdminAction -->|Review Proposals| LoadPendingProposals[📋 Load Pending Proposals]
        LoadPendingProposals --> MergeHybridData[🔄 Merge MySQL + MongoDB Data]
        MergeHybridData --> DisplayProposalList[📄 Display Proposal List]
        DisplayProposalList --> SelectProposal[👆 Select Proposal to Review]
        
        SelectProposal --> LoadProposalDetails[📖 Load Proposal Details]
        LoadProposalDetails --> ReviewProposal[👁️ Review Proposal Content]
        ReviewProposal --> AdminDecision{Admin Decision}
        
        %% Admin Decision Branches
        AdminDecision -->|Approve| ApprovalProcess[✅ Start Approval Process]
        AdminDecision -->|Reject| RejectionProcess[❌ Start Rejection Process]
        AdminDecision -->|Request Revision| RevisionProcess[🔄 Start Revision Process]
        
        %% Approval Process Activities
        ApprovalProcess --> UpdateStatusApproved[📝 Update Status to 'Approved']
        UpdateStatusApproved --> LogApprovalAction[📊 Log Approval in Audit Trail]
        LogApprovalAction --> NotifyStudentApproval[📧 Send Approval Notification]
        NotifyStudentApproval --> AdminDashboard
        
        %% Rejection Process Activities
        RejectionProcess --> AddRejectionComments[💬 Add Rejection Comments]
        AddRejectionComments --> UpdateStatusRejected[📝 Update Status to 'Rejected']
        UpdateStatusRejected --> SaveCommentsToMongoDB[💾 Save Comments to MongoDB]
        SaveCommentsToMongoDB --> LogRejectionAction[📊 Log Rejection in Audit Trail]
        LogRejectionAction --> NotifyStudentRejection[📧 Send Rejection Notification]
        NotifyStudentRejection --> AdminDashboard
        
        %% Revision Process Activities
        RevisionProcess --> AddRevisionComments[💬 Add Revision Comments]
        AddRevisionComments --> UpdateStatusRevision[📝 Update Status to 'Under Review']
        UpdateStatusRevision --> SaveRevisionComments[💾 Save Revision Comments]
        SaveRevisionComments --> LogRevisionAction[📊 Log Revision in Audit Trail]
        LogRevisionAction --> NotifyStudentRevision[📧 Send Revision Notification]
        NotifyStudentRevision --> AdminDashboard
        
        %% User Management Activities
        AdminAction -->|Manage Users| LoadUsersList[👥 Load Users List]
        LoadUsersList --> SelectUser[👆 Select User to Manage]
        SelectUser --> UserAction{User Management Action}
        
        UserAction -->|Approve User| ApproveUserAccount[✅ Approve User Account]
        UserAction -->|Reject User| RejectUserAccount[❌ Reject User Account]
        UserAction -->|Update Role| UpdateUserRole[🔄 Update User Role]
        UserAction -->|Delete User| DeleteUserAccount[🗑️ Delete User Account]
        
        ApproveUserAccount --> SendWelcomeEmail[📧 Send Welcome Email]
        RejectUserAccount --> SendRejectionEmail[📧 Send Rejection Email]
        UpdateUserRole --> AdminDashboard
        DeleteUserAccount --> AdminDashboard
        SendWelcomeEmail --> AdminDashboard
        SendRejectionEmail --> AdminDashboard
        
        %% Reporting Activities
        AdminAction -->|Generate Reports| ConfigureReportFilters[⚙️ Configure Report Filters]
        ConfigureReportFilters --> GenerateReportData[📊 Generate Report Data]
        GenerateReportData --> DisplayReport[📈 Display Generated Report]
        DisplayReport --> ExportReport{Export Report?}
        ExportReport -->|Yes| ExportToFormat[📄 Export to PDF/CSV]
        ExportReport -->|No| AdminDashboard
        ExportToFormat --> AdminDashboard
    end
    
    subgraph Database_Lane ["🗄️ Database Activities"]
        direction TB
        
        %% Parallel Database Operations
        DatabaseStart([🔧 Database Operations Start])
        DatabaseStart --> DatabaseType{Database Type}
        
        %% MySQL Operations
        DatabaseType -->|MySQL| MySQLConnect[🔗 Connect to MySQL]
        MySQLConnect --> MySQLOperation{MySQL Operation Type}
        
        MySQLOperation -->|User Auth| MySQLUserQuery[👤 Query User Table]
        MySQLOperation -->|Proposal Meta| MySQLProposalQuery[📋 Query Proposals Table]
        MySQLOperation -->|User Management| MySQLUserUpdate[🔄 Update User Status]
        MySQLOperation -->|Audit Log| MySQLAuditInsert[📊 Insert Audit Log]
        
        MySQLUserQuery --> MySQLResult[📊 Return MySQL Result]
        MySQLProposalQuery --> MySQLResult
        MySQLUserUpdate --> MySQLResult
        MySQLAuditInsert --> MySQLResult
        
        %% MongoDB Operations
        DatabaseType -->|MongoDB| MongoConnect[🔗 Connect to MongoDB]
        MongoConnect --> MongoOperation{MongoDB Operation Type}
        
        MongoOperation -->|Proposal Data| MongoProposalQuery[📋 Query Proposals Collection]
        MongoOperation -->|File Storage| MongoGridFSOperation[📁 GridFS File Operation]
        MongoOperation -->|Comments| MongoCommentsInsert[💬 Insert Review Comments]
        MongoOperation -->|Metadata| MongoMetadataUpdate[📋 Update File Metadata]
        
        MongoProposalQuery --> MongoResult[📊 Return MongoDB Result]
        MongoGridFSOperation --> MongoResult
        MongoCommentsInsert --> MongoResult
        MongoMetadataUpdate --> MongoResult
        
        %% Hybrid Data Merging
        MySQLResult --> HybridMerge[🔄 Merge MySQL + MongoDB Data]
        MongoResult --> HybridMerge
        HybridMerge --> FinalResult[📋 Return Combined Result]
    end
    
    subgraph System_Lane ["🖥️ System Activities"]
        direction TB
        
        %% System Initialization
        SystemInit([⚡ System Initialization])
        SystemInit --> LoadConfiguration[⚙️ Load System Configuration]
        LoadConfiguration --> InitializeServices[🔧 Initialize Services]
        InitializeServices --> SystemReady[✅ System Ready]
        
        %% Session Management
        SystemReady --> SessionManager[🕐 Session Management]
        SessionManager --> SessionActivity{Session Activity}
        
        SessionActivity -->|User Activity| RefreshSession[🔄 Refresh User Session]
        SessionActivity -->|Timeout| ExpireSession[⏰ Expire Inactive Session]
        SessionActivity -->|Logout| ClearSession[🧹 Clear Session Data]
        
        RefreshSession --> SessionManager
        ExpireSession --> SessionManager
        ClearSession --> SessionManager
        
        %% Error Handling
        SystemReady --> ErrorHandler[⚠️ Global Error Handler]
        ErrorHandler --> ErrorType{Error Type}
        
        ErrorType -->|Authentication| AuthErrorResponse[🔐 Authentication Error Response]
        ErrorType -->|Validation| ValidationErrorResponse[✅ Validation Error Response]
        ErrorType -->|Database| DatabaseErrorResponse[🗄️ Database Error Response]
        ErrorType -->|File Upload| FileErrorResponse[📁 File Upload Error Response]
        ErrorType -->|System| SystemErrorResponse[🖥️ System Error Response]
        
        %% Logging Activities
        SystemReady --> LoggingService[📝 Logging Service]
        LoggingService --> LogActivity{Log Activity Type}
        
        LogActivity -->|User Action| UserActionLog[👤 Log User Action]
        LogActivity -->|System Event| SystemEventLog[🖥️ Log System Event]
        LogActivity -->|Error Event| ErrorEventLog[⚠️ Log Error Event]
        LogActivity -->|Performance| PerformanceLog[📊 Log Performance Metrics]
    end
    
    %% ========================================
    %% CROSS-SWIMLANE CONNECTIONS
    %% ========================================
    
    %% Student to Backend Connections
    SubmitCredentials -.-> ReceiveLogin
    GoogleToken -.-> ReceiveGoogleToken
    FinalSubmission -.-> ReceiveProposal
    FileUploadProcess -.-> ReceiveFiles
    
    %% Backend to Student Connections
    SendAuthSuccess -.-> LoadDashboard
    AuthError -.-> SignInActivity
    PendingApprovalResponse -.-> SignInActivity
    SendSubmissionSuccess -.-> SubmissionSuccess
    ValidationError -.-> ShowReportingErrors
    
    %% Backend to Database Connections
    ValidateCredentials -.-> MySQLUserQuery
    SaveToMySQL -.-> MySQLProposalQuery
    SaveToMongoDB -.-> MongoProposalQuery
    GridFSUpload -.-> MongoGridFSOperation
    FilesystemUpload -.-> MongoMetadataUpdate
    
    %% Admin to Backend Connections
    LoadPendingProposals -.-> MergeHybridData
    UpdateStatusApproved -.-> MySQLProposalQuery
    UpdateStatusRejected -.-> MySQLProposalQuery
    SaveCommentsToMongoDB -.-> MongoCommentsInsert
    
    %% Database to Backend Connections
    MySQLResult -.-> HybridMerge
    MongoResult -.-> HybridMerge
    FinalResult -.-> SendSubmissionSuccess
    
    %% System Error Handling Connections
    AuthError -.-> AuthErrorResponse
    ValidationError -.-> ValidationErrorResponse
    
    %% ========================================
    %% PARALLEL ACTIVITY SYNCHRONIZATION
    %% ========================================
    
    %% File Processing Synchronization
    FileProcessingComplete --> ValidateReporting
    
    %% Database Synchronization
    HybridMerge --> DisplayProposalList
    
    %% ========================================
    %% STYLING CLASSES
    %% ========================================
    
    classDef studentActivity fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000
    classDef backendActivity fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef adminActivity fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef databaseActivity fill:#e8f5e8,stroke:#388e3c,stroke-width:2px,color:#000
    classDef systemActivity fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000
    classDef decisionPoint fill:#fff3e0,stroke:#e65100,stroke-width:3px,color:#000
    classDef startEnd fill:#f1f8e9,stroke:#689f38,stroke-width:3px,color:#000
    classDef errorActivity fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#000
    classDef parallelActivity fill:#f9fbe7,stroke:#827717,stroke-width:2px,color:#000
    
    %% Apply Student Activity Styles
    class Start,LoadDashboard,StartProposal,OverviewSection,EventTypeSelection,OrgInfoSection,SchoolEventSection,CommunityEventSection,ReportingSection,SelectFiles,SubmissionDialog,FinalSubmission,SubmissionSuccess,BackToDashboard studentActivity
    
    %% Apply Backend Activity Styles
    class ReceiveLogin,ReceiveGoogleToken,VerifyReCaptcha,ValidateCredentials,VerifyGoogleToken,GenerateJWT,ReceiveProposal,ValidateProposalData,SaveToMySQL,SaveToMongoDB,UpdateProposalStatus,NotifyAdmins,SendSubmissionSuccess backendActivity
    
    %% Apply Admin Activity Styles
    class AdminStart,AdminDashboard,LoadPendingProposals,SelectProposal,ReviewProposal,ApprovalProcess,RejectionProcess,RevisionProcess,LoadUsersList,ApproveUserAccount,GenerateReportData adminActivity
    
    %% Apply Database Activity Styles
    class DatabaseStart,MySQLConnect,MongoConnect,MySQLUserQuery,MongoProposalQuery,HybridMerge,FinalResult databaseActivity
    
    %% Apply System Activity Styles
    class SystemInit,LoadConfiguration,InitializeServices,SystemReady,SessionManager,ErrorHandler,LoggingService systemActivity
    
    %% Apply Decision Point Styles
    class CheckAuth,AuthMethod,CheckSavedData,ValidateOrgInfo,EventTypeCheck,ValidateSchoolEvent,ValidateCommunityEvent,FileUploadCheck,ValidateReporting,VerifyReCaptchaResult,CredentialsValid,GoogleTokenValid,UserApproved,ProposalDataValid,AdminDecision,UserAction,DatabaseType,MySQLOperation,MongoOperation decisionPoint
    
    %% Apply Start/End Styles
    class Start,AdminStart,SystemInit,DatabaseStart startEnd
    
    %% Apply Error Activity Styles
    class AuthError,ShowOrgErrors,ShowSchoolErrors,ShowCommunityErrors,ShowReportingErrors,ValidationError,AuthErrorResponse,ValidationErrorResponse,DatabaseErrorResponse errorActivity
    
    %% Apply Parallel Activity Styles
    class AutoSaveOrg,AutoSaveSchool,AutoSaveCommunity,ProcessFilesParallel,GridFSUpload,FilesystemUpload,RefreshSession,UserActionLog parallelActivity
```

## Activity Diagram Features

### 1. **Swim Lanes (Virtual)**
- **Student Lane**: User-facing activities and interactions
- **Backend Lane**: Server-side processing and business logic
- **Admin Lane**: Administrative activities and workflows
- **Database Lane**: Data persistence and retrieval activities
- **System Lane**: Infrastructure and support activities

### 2. **Decision Points**
- **Authentication Choices**: Email/password vs Google OAuth
- **Event Type Selection**: School event vs Community event
- **File Size Decisions**: GridFS vs Filesystem storage
- **Admin Decisions**: Approve/Reject/Request Revision
- **Database Type**: MySQL vs MongoDB operations

### 3. **Parallel Activities**
- **Auto-save Operations**: Concurrent localStorage updates
- **File Processing**: Parallel upload to different storage systems
- **Database Operations**: Simultaneous MySQL and MongoDB operations
- **Session Management**: Concurrent session monitoring
- **Logging Activities**: Parallel audit trail updates

### 4. **Synchronization Points**
- **File Processing Complete**: Synchronizes before form validation
- **Hybrid Data Merge**: Synchronizes MySQL and MongoDB results
- **Authentication Success**: Synchronizes before dashboard load
- **Proposal Submission**: Synchronizes before admin notification

### 5. **Error Handling Activities**
- **Authentication Errors**: Invalid credentials or tokens
- **Validation Errors**: Form validation failures
- **Database Errors**: Connection or query failures
- **File Upload Errors**: Size or type validation failures
- **System Errors**: Infrastructure or service failures

## Code Integration References

This activity diagram is based on analysis of these actual code files:

### Frontend Activities
- `frontend/src/app/main/student-dashboard/submit-event/SubmitEventFlow.jsx` - Multi-step form activities
- `frontend/src/contexts/auth-context.js` - Authentication activities
- `frontend/src/app/main/admin-dashboard/` - Admin dashboard activities
- `frontend/src/app/main/student-dashboard/drafts/page.jsx` - Proposal management activities

### Backend Activities
- `backend/routes/auth.js` - Authentication processing activities
- `backend/routes/mongodb-unified/admin.routes.js` - Admin workflow activities
- `backend/controllers/proposal.controller.js` - Proposal processing activities
- `backend/services/` - Business logic activities

### Database Activities
- `backend/models/User.js` - User data activities
- `backend/models/Proposal.js` - Proposal data activities
- `backend/config/db.js` - MySQL connection activities
- `backend/config/mongodb.js` - MongoDB connection activities

## Usage Instructions

1. **Copy the Mermaid code** from the code block above
2. **Paste into Mermaid-compatible tools**:
   - [Mermaid Live Editor](https://mermaid.live/)
   - [Mermaid Chart](https://mermaid.ink/) as referenced in the [search results](https://docs.mermaidchart.com/mermaid-oss/intro/getting-started.html)
   - GitHub markdown files
   - VS Code with Mermaid extension
   - Tools like [Mermrender](https://github.com/Schachte/Mermrender) for API-based rendering

3. **Render the diagram** to see the complete activity flow
4. **Customize styling** by modifying the `classDef` definitions at the bottom

## Key Activity Flows

### 1. **Student Proposal Submission Flow**
```
Start → SignIn → Dashboard → StartProposal → EventType → Organization → SchoolEvent/CommunityEvent → Reporting → FileUpload → Submit → Success
```

### 2. **Admin Review Flow**
```
AdminDashboard → LoadProposals → SelectProposal → ReviewContent → MakeDecision → UpdateStatus → NotifyStudent → Dashboard
```

### 3. **Authentication Flow**
```
SignInPage → AuthMethod → (EmailAuth|GoogleAuth) → VerifyCredentials → CheckApproval → GenerateJWT → LoadDashboard
```

### 4. **File Upload Flow**
```
SelectFiles → ValidateFiles → CheckFileSize → (GridFS|Filesystem) → StoreMetadata → ProcessingComplete
```

### 5. **Database Operations Flow**
```
ReceiveRequest → DetermineType → (MySQL|MongoDB) → ExecuteQuery → MergeResults → ReturnResponse
```

## Activity Synchronization

### 1. **Fork Activities**
- File upload processing (GridFS and Filesystem in parallel)
- Database operations (MySQL and MongoDB simultaneously)
- Session management (refresh and monitoring concurrently)

### 2. **Join Activities**
- File processing completion before form submission
- Hybrid data merging before response
- Authentication success before dashboard load

### 3. **Decision Activities**
- Authentication method selection
- Event type determination
- Admin decision making
- File storage type selection

## Modern Development Integration

As highlighted in the [LLM + Mermaid article](https://mike-vincent.medium.com/llm-mermaid-how-modern-teams-create-uml-diagrams-without-lucidchart-e54c56350804), this activity diagram demonstrates how modern teams can create comprehensive UML diagrams using AI-powered tools and Mermaid syntax, eliminating the need for traditional diagramming software while maintaining professional quality and version control integration.

This comprehensive activity diagram provides a complete view of all activities and their relationships in the CEDO Event Management System, serving as both documentation and a reference for understanding the system's behavioral flow and parallel processing capabilities. 