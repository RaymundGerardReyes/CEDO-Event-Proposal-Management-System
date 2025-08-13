# CEDO Event Management System - State Diagram

## Overview
This document provides a comprehensive Mermaid State Diagram for the CEDO Event Management System based on actual code analysis from the frontend and backend implementations. The diagram shows all the states and transitions for user authentication, proposal submission, admin review processes, and system workflows.

## System State Categories

### 1. **User Authentication States**
- Based on `frontend/src/contexts/auth-context.js`
- Google OAuth and email/password authentication flows
- User approval and session management states

### 2. **Proposal Submission States**
- Based on `frontend/src/app/main/student-dashboard/submit-event/eventStateMachine.js`
- Multi-step form progression with XState state machine
- Auto-save and data persistence states

### 3. **Admin Review States**
- Based on `backend/routes/mongodb-unified/admin.routes.js`
- Proposal status transitions (draft, pending, approved, rejected)
- Review comment and decision workflows

### 4. **User Account Management States**
- Based on `backend/models/User.js`
- Account creation, approval, and role-based access states

### 5. **File Upload States**
- Based on hybrid file service implementation
- GridFS and filesystem storage state transitions

## Comprehensive State Diagram

```mermaid
stateDiagram-v2
    direction TB
    
    %% ========================================
    %% INITIAL STATE AND ENTRY POINT
    %% ========================================
    
    [*] --> SystemInitializing
    SystemInitializing --> AuthCheck
    
    %% ========================================
    %% AUTHENTICATION STATE COMPOSITE
    %% ========================================
    
    state AuthenticationFlow {
        direction TB
        
        AuthCheck --> NotAuthenticated : No valid token
        AuthCheck --> TokenValidation : Valid token found
        
        TokenValidation --> AuthorizedUser : Token valid & user approved
        TokenValidation --> NotAuthenticated : Token invalid/expired
        TokenValidation --> UserPendingApproval : Valid token but user not approved
        
        state NotAuthenticated {
            direction TB
            [*] --> SignInPage
            SignInPage --> EmailPasswordAuth : Email/Password chosen
            SignInPage --> GoogleOAuth : Google Sign-In chosen
            
            EmailPasswordAuth --> RecaptchaVerification
            RecaptchaVerification --> CredentialsValidation : reCAPTCHA valid
            RecaptchaVerification --> SignInPage : reCAPTCHA failed
            
            CredentialsValidation --> UserApprovalCheck : Valid credentials
            CredentialsValidation --> SignInPage : Invalid credentials
            
            GoogleOAuth --> GoogleTokenVerification
            GoogleTokenVerification --> ExistingUserCheck : Valid Google token
            GoogleTokenVerification --> SignInPage : Invalid Google token
            
            ExistingUserCheck --> UserApprovalCheck : User exists
            ExistingUserCheck --> CreateGoogleUser : New user
            
            CreateGoogleUser --> UserPendingApproval : Account created
            
            UserApprovalCheck --> JWTGeneration : User approved
            UserApprovalCheck --> UserPendingApproval : User not approved
            
            JWTGeneration --> AuthorizedUser : JWT token generated
        }
        
        state UserPendingApproval {
            direction TB
            [*] --> PendingApprovalDialog
            PendingApprovalDialog --> SignInPage : User acknowledges
            
            note right of PendingApprovalDialog
                User sees: "Account pending approval.
                Please contact an administrator."
            end note
        }
        
        state AuthorizedUser {
            direction TB
            [*] --> RoleBasedRouting
            RoleBasedRouting --> StudentDashboard : Student/Partner role
            RoleBasedRouting --> AdminDashboard : Admin/Head Admin role
            RoleBasedRouting --> SessionManagement
            
            SessionManagement --> SessionTimeout : Inactivity timeout
            SessionTimeout --> NotAuthenticated : Session expired
            SessionManagement --> SessionRefresh : Activity detected
            SessionRefresh --> SessionManagement : Token refreshed
        }
    }
    
    %% ========================================
    %% STUDENT DASHBOARD COMPOSITE STATE
    %% ========================================
    
    state StudentDashboard {
        direction TB
        
        [*] --> DashboardHome
        DashboardHome --> ProposalSubmission : Submit Event clicked
        DashboardHome --> ViewProposals : View Proposals clicked
        DashboardHome --> ProfileManagement : Profile clicked
        
        %% Proposal Submission Flow (XState Machine)
        state ProposalSubmission {
            direction TB
            
            [*] --> Overview
            
            state Overview {
                direction TB
                [*] --> CheckExistingData
                CheckExistingData --> RestoreFormDialog : Saved data found
                CheckExistingData --> EmptyForm : No saved data
                RestoreFormDialog --> LoadSavedData : User chooses restore
                RestoreFormDialog --> EmptyForm : User chooses start fresh
                LoadSavedData --> CurrentSectionRouting
                EmptyForm --> StartProposal
                StartProposal --> EventTypeSelection
            }
            
            state CurrentSectionRouting {
                direction TB
                [*] --> DetermineSection
                DetermineSection --> EventTypeSelection : currentSection = eventTypeSelection
                DetermineSection --> OrganizationInfo : currentSection = organizationInfo  
                DetermineSection --> SchoolEvent : currentSection = schoolEvent
                DetermineSection --> CommunityEvent : currentSection = communityEvent
                DetermineSection --> Reporting : currentSection = reporting
            }
            
            state EventTypeSelection {
                direction TB
                [*] --> SelectEventType
                SelectEventType --> OrganizationInfo : Event type selected
                SelectEventType --> Overview : Previous clicked
            }
            
            state OrganizationInfo {
                direction TB
                [*] --> OrgInfoForm
                OrgInfoForm --> OrgInfoValidation : Next clicked
                OrgInfoForm --> AutoSaveOrgInfo : Auto-save triggered
                OrgInfoForm --> Overview : Previous clicked
                OrgInfoForm --> Overview : Withdraw clicked
                
                OrgInfoValidation --> SchoolEvent : Valid + School type
                OrgInfoValidation --> CommunityEvent : Valid + Community type
                OrgInfoValidation --> OrgInfoForm : Validation failed
                
                AutoSaveOrgInfo --> OrgInfoForm : Data saved
            }
            
            state SchoolEvent {
                direction TB
                [*] --> SchoolEventForm
                SchoolEventForm --> SchoolEventValidation : Next clicked
                SchoolEventForm --> AutoSaveSchoolEvent : Auto-save triggered
                SchoolEventForm --> OrganizationInfo : Previous clicked
                SchoolEventForm --> Overview : Withdraw clicked
                
                SchoolEventValidation --> Reporting : Valid data
                SchoolEventValidation --> SchoolEventForm : Validation failed
                
                AutoSaveSchoolEvent --> SchoolEventForm : Data saved
            }
            
            state CommunityEvent {
                direction TB
                [*] --> CommunityEventForm
                CommunityEventForm --> CommunityEventValidation : Next clicked
                CommunityEventForm --> AutoSaveCommunityEvent : Auto-save triggered
                CommunityEventForm --> OrganizationInfo : Previous clicked
                CommunityEventForm --> Overview : Withdraw clicked
                
                CommunityEventValidation --> Reporting : Valid data
                CommunityEventValidation --> CommunityEventForm : Validation failed
                
                AutoSaveCommunityEvent --> CommunityEventForm : Data saved
            }
            
            state Reporting {
                direction TB
                [*] --> ReportingForm
                ReportingForm --> FileUploadProcess : Files to upload
                ReportingForm --> ReportingValidation : Submit clicked
                ReportingForm --> SchoolEvent : Previous (School type)
                ReportingForm --> CommunityEvent : Previous (Community type)
                
                state FileUploadProcess {
                    direction TB
                    [*] --> FileTypeCheck
                    FileTypeCheck --> GridFSUpload : Large files
                    FileTypeCheck --> FilesystemUpload : Small files
                    GridFSUpload --> FileMetadataStorage
                    FilesystemUpload --> FileMetadataStorage
                    FileMetadataStorage --> ReportingForm : Upload complete
                }
                
                ReportingValidation --> SubmissionConfirmation : Valid data
                ReportingValidation --> ReportingForm : Validation failed
                
                SubmissionConfirmation --> Submitting : User confirms
                SubmissionConfirmation --> ReportingForm : User cancels
                
                state Submitting {
                    direction TB
                    [*] --> SaveToMySQL
                    SaveToMySQL --> SaveToMongoDB : MySQL save success
                    SaveToMySQL --> SubmissionError : MySQL save failed
                    SaveToMongoDB --> UpdateProposalStatus : MongoDB save success
                    SaveToMongoDB --> SubmissionError : MongoDB save failed
                    UpdateProposalStatus --> NotifyAdmin : Status updated
                    NotifyAdmin --> SubmissionSuccess : Notification sent
                }
                
                SubmissionSuccess --> PendingReview : Submission complete
                SubmissionError --> ReportingForm : User retries
            }
            
            state PendingReview {
                direction TB
                [*] --> WaitingForReview
                WaitingForReview --> DashboardHome : Return to dashboard
                
                note right of WaitingForReview
                    Proposal status: "pending"
                    Visible to admins for review
                end note
            }
        }
        
        state ViewProposals {
            direction TB
            [*] --> ProposalsList
            ProposalsList --> ProposalDetails : Proposal selected
            ProposalDetails --> ProposalsList : Back to list
            ProposalDetails --> EditProposal : Edit clicked (if draft)
            EditProposal --> ProposalSubmission : Edit mode
        }
        
        state ProfileManagement {
            direction TB
            [*] --> ViewProfile
            ViewProfile --> EditProfile : Edit clicked
            EditProfile --> ViewProfile : Save clicked
            EditProfile --> ViewProfile : Cancel clicked
        }
    }
    
    %% ========================================
    %% ADMIN DASHBOARD COMPOSITE STATE
    %% ========================================
    
    state AdminDashboard {
        direction TB
        
        [*] --> AdminDashboardHome
        AdminDashboardHome --> ProposalReview : Review Proposals clicked
        AdminDashboardHome --> UserManagement : Manage Users clicked
        AdminDashboardHome --> AdminReports : View Reports clicked
        
        state ProposalReview {
            direction TB
            [*] --> LoadPendingProposals
            LoadPendingProposals --> HybridDataMerge : Proposals loaded
            HybridDataMerge --> ProposalReviewList : Data merged
            
            ProposalReviewList --> ProposalDetailReview : Proposal selected
            
            state ProposalDetailReview {
                direction TB
                [*] --> ReviewingProposal
                ReviewingProposal --> AdminDecision : Review complete
                
                state AdminDecision {
                    direction TB
                    [*] --> DecisionChoice
                    DecisionChoice --> ApprovalProcess : Approve selected
                    DecisionChoice --> RejectionProcess : Reject selected
                    DecisionChoice --> RevisionProcess : Request revision selected
                    
                    state ApprovalProcess {
                        direction TB
                        [*] --> UpdateStatusApproved
                        UpdateStatusApproved --> LogApprovalAction : MySQL updated
                        LogApprovalAction --> NotifyStudentApproval : Audit logged
                        NotifyStudentApproval --> ProposalReviewList : Student notified
                    }
                    
                    state RejectionProcess {
                        direction TB
                        [*] --> RejectionCommentsDialog
                        RejectionCommentsDialog --> UpdateStatusRejected : Comments added
                        UpdateStatusRejected --> SaveCommentsToMongoDB : MySQL updated
                        SaveCommentsToMongoDB --> LogRejectionAction : Comments saved
                        LogRejectionAction --> NotifyStudentRejection : Audit logged
                        NotifyStudentRejection --> ProposalReviewList : Student notified
                    }
                    
                    state RevisionProcess {
                        direction TB
                        [*] --> RevisionCommentsDialog
                        RevisionCommentsDialog --> UpdateStatusRevision : Comments added
                        UpdateStatusRevision --> SaveRevisionComments : MySQL updated
                        SaveRevisionComments --> LogRevisionAction : Comments saved
                        LogRevisionAction --> NotifyStudentRevision : Audit logged
                        NotifyStudentRevision --> ProposalReviewList : Student notified
                    }
                }
            }
        }
        
        state UserManagement {
            direction TB
            [*] --> LoadUsers
            LoadUsers --> UsersList : Users loaded
            UsersList --> UserDetails : User selected
            
            state UserDetails {
                direction TB
                [*] --> ViewUserInfo
                ViewUserInfo --> UserApprovalAction : Approve/Reject clicked
                ViewUserInfo --> UserRoleUpdate : Update role clicked
                ViewUserInfo --> UserDeletion : Delete clicked
                
                state UserApprovalAction {
                    direction TB
                    [*] --> ApprovalDecision
                    ApprovalDecision --> ApproveUser : Approve selected
                    ApprovalDecision --> RejectUser : Reject selected
                    
                    ApproveUser --> UpdateUserApprovalStatus : Approval confirmed
                    UpdateUserApprovalStatus --> LogUserApproval : Database updated
                    LogUserApproval --> SendWelcomeEmail : Action logged
                    SendWelcomeEmail --> UsersList : Email sent
                    
                    RejectUser --> UpdateUserRejectionStatus : Rejection confirmed
                    UpdateUserRejectionStatus --> LogUserRejection : Database updated
                    LogUserRejection --> SendRejectionEmail : Action logged
                    SendRejectionEmail --> UsersList : Email sent
                }
                
                UserRoleUpdate --> UsersList : Role updated
                UserDeletion --> UsersList : User deleted
            }
        }
        
        state AdminReports {
            direction TB
            [*] --> GenerateReports
            GenerateReports --> ReportFilters : Filters applied
            ReportFilters --> ReportGeneration : Generate clicked
            ReportGeneration --> ReportDisplay : Reports generated
            ReportDisplay --> AdminDashboardHome : Back to dashboard
        }
    }
    
    %% ========================================
    %% PROPOSAL STATUS TRACKING (Cross-cutting state)
    %% ========================================
    
    state ProposalLifecycle {
        direction TB
        
        [*] --> Draft
        Draft --> Pending : Submitted by student
        Pending --> Approved : Admin approves
        Pending --> Rejected : Admin rejects
        Pending --> UnderReview : Admin requests revision
        UnderReview --> Pending : Student resubmits
        Approved --> ReportPending : Event completed
        ReportPending --> ReportApproved : Report approved
        ReportPending --> ReportRevision : Report needs revision
        ReportRevision --> ReportPending : Report resubmitted
        ReportApproved --> [*] : Workflow complete
        
        note right of Draft
            status: "draft"
            Editable by student
        end note
        
        note right of Pending
            status: "pending"
            Awaiting admin review
        end note
        
        note right of Approved
            status: "approved"
            Event can proceed
        end note
        
        note right of Rejected
            status: "rejected"/"denied"
            Includes admin comments
        end note
    }
    
    %% ========================================
    %% SYSTEM LOGOUT AND CLEANUP
    %% ========================================
    
    state SystemLogout {
        direction TB
        [*] --> LogoutTriggered
        LogoutTriggered --> ClearJWTToken : Logout requested
        ClearJWTToken --> ClearSessionData : Token cleared
        ClearSessionData --> ClearLocalStorage : Session cleared
        ClearLocalStorage --> LogoutComplete : Storage cleared
        LogoutComplete --> [*] : Redirect to sign-in
    }
    
    %% ========================================
    %% STATE TRANSITIONS AND CONNECTIONS
    %% ========================================
    
    AuthenticationFlow --> StudentDashboard : Student role authenticated
    AuthenticationFlow --> AdminDashboard : Admin role authenticated
    
    StudentDashboard --> SystemLogout : Logout clicked
    AdminDashboard --> SystemLogout : Logout clicked
    
    SystemLogout --> AuthenticationFlow : Logout complete
    
    %% ========================================
    %% STYLING CLASSES
    %% ========================================
    
    classDef authState fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000
    classDef studentState fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef adminState fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef proposalState fill:#e8f5e8,stroke:#388e3c,stroke-width:2px,color:#000
    classDef errorState fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#000
    classDef processState fill:#f1f8e9,stroke:#689f38,stroke-width:2px,color:#000
    classDef systemState fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000
    
    %% Apply styling classes
    class AuthenticationFlow,NotAuthenticated,UserPendingApproval,AuthorizedUser authState
    class StudentDashboard,ProposalSubmission,ViewProposals,ProfileManagement studentState
    class AdminDashboard,ProposalReview,UserManagement,AdminReports adminState
    class ProposalLifecycle,Draft,Pending,Approved,Rejected proposalState
    class SubmissionError,AuthenticationError,ValidationError errorState
    class FileUploadProcess,Submitting,HybridDataMerge,ApprovalProcess processState
    class SystemInitializing,SystemLogout,SessionManagement systemState
```

## State Diagram Features

### 1. **Composite States**
- **AuthenticationFlow**: Complete authentication process with email/password and Google OAuth
- **StudentDashboard**: Multi-section student interface with proposal submission
- **AdminDashboard**: Admin management interface with review workflows
- **ProposalSubmission**: XState-based multi-step form with auto-save

### 2. **Concurrent States**
- **ProposalLifecycle**: Runs independently tracking proposal status
- **SessionManagement**: Manages user sessions and timeouts
- **FileUploadProcess**: Handles hybrid file storage during form submission

### 3. **State Transitions Based on Actual Code**
- **XState Integration**: Uses actual state machine from `eventStateMachine.js`
- **Authentication Flow**: Based on `auth-context.js` and `auth.js` routes
- **Admin Actions**: Based on `admin.routes.js` status update logic
- **Database Operations**: MySQL and MongoDB state transitions

### 4. **Error Handling States**
- **SubmissionError**: Handles form submission failures
- **ValidationError**: Manages form validation states
- **AuthenticationError**: Handles login failures and token issues

### 5. **Real Implementation Details**
- **Auto-save Functionality**: LocalStorage persistence states
- **Hybrid Database**: MySQL and MongoDB integration states
- **Role-based Routing**: Student vs Admin dashboard states
- **reCAPTCHA Verification**: Security validation states

## Code Integration References

This state diagram is based on analysis of these actual code files:

### Frontend State Management
- `frontend/src/app/main/student-dashboard/submit-event/eventStateMachine.js` - XState machine
- `frontend/src/contexts/auth-context.js` - Authentication states
- `frontend/src/app/main/student-dashboard/submit-event/[draftId]/SubmitEventFlow.jsx` - Form flow

### Backend State Transitions
- `backend/routes/auth.js` - Authentication endpoints
- `backend/routes/mongodb-unified/admin.routes.js` - Admin review states
- `backend/models/User.js` - User account states
- `backend/models/Proposal.js` - Proposal status enumeration

### Database States
- MySQL: User approval states, proposal metadata states
- MongoDB: Complex document states, file storage states
- Hybrid integration: Cross-database state synchronization

## Usage Instructions

1. **Copy the Mermaid code** from the code block above
2. **Paste into Mermaid-compatible tools**:
   - [Mermaid Live Editor](https://mermaid.live/)
   - [Mermaid Chart](https://mermaid.ink/)
   - GitHub markdown files
   - VS Code with Mermaid extension
   - Documentation platforms supporting Mermaid

3. **Render the diagram** to see the complete state transitions
4. **Customize styling** by modifying the `classDef` definitions at the bottom

## Key State Flows

### 1. **Student Proposal Submission**
```
Overview → EventTypeSelection → OrganizationInfo → SchoolEvent/CommunityEvent → Reporting → Submitting → PendingReview
```

### 2. **Admin Review Process**
```
LoadPendingProposals → ProposalDetailReview → AdminDecision → (Approve/Reject/RequestRevision) → NotifyStudent
```

### 3. **Authentication Flow**
```
AuthCheck → NotAuthenticated → (EmailAuth/GoogleAuth) → UserApprovalCheck → AuthorizedUser → RoleBasedRouting
```

### 4. **User Account Lifecycle**
```
AccountCreation → UserPendingApproval → AdminApproval → AuthorizedUser → SessionManagement
```

This comprehensive state diagram provides a complete view of all the states and transitions in the CEDO Event Management System as actually implemented in the codebase, serving as both documentation and a reference for understanding the system's behavior. 