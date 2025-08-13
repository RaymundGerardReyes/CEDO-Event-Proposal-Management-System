# CEDO Event Management System - Class Diagram

## Overview
This document provides a comprehensive Class Diagram for the CEDO Event Management System, showing the fundamental object-oriented blueprint with classes, attributes, methods, and relationships from both frontend (React/Next.js) and backend (Node.js/Express) components.

## System Architecture Overview
- **Frontend**: React/Next.js with TypeScript
- **Backend**: Node.js/Express with MySQL and MongoDB
- **Authentication**: Google OAuth + JWT
- **File Storage**: Hybrid MongoDB GridFS + Filesystem

## Main Class Structure

### Backend Data Models

#### User Class
```javascript
class User {
  // Attributes
  - id: number
  - name: string
  - email: string
  - password: string (hashed)
  - role: string (student|admin|head_admin)
  - organization: string
  - organization_type: string
  - avatar: string
  - google_id: string
  - is_approved: boolean
  - approved_by: number
  - approved_at: Date
  - created_at: Date
  - updated_at: Date
  
  // Methods
  + findById(id: number): User
  + findByEmail(email: string): User
  + findByGoogleId(googleId: string): User
  + create(userData: Object): User
  + update(id: number, userData: Object): User
  + delete(id: number): boolean
  + validatePassword(password: string): boolean
  + getRole(): string
  + isApproved(): boolean
}
```

#### Proposal Class
```javascript
class Proposal {
  // Attributes
  - _id: ObjectId
  - title: string
  - description: string
  - category: string
  - startDate: Date
  - endDate: Date
  - location: string
  - budget: number
  - objectives: string
  - submitter: string
  - organizationType: string
  - status: string (draft|pending|approved|rejected)
  - priority: string
  - documents: Document[]
  - reviewComments: ReviewComment[]
  - createdAt: Date
  - updatedAt: Date
  
  // Methods
  + save(): Proposal
  + findById(id: string): Proposal
  + findBySubmitter(submitter: string): Proposal[]
  + updateStatus(status: string): boolean
  + addReviewComment(comment: ReviewComment): void
  + addDocument(document: Document): void
  + isEditable(): boolean
  + canBeApproved(): boolean
}
```

### Backend Controllers

#### UserController Class
```javascript
class UserController {
  // HTTP Endpoint Methods
  + register(req: Request, res: Response): void
  + login(req: Request, res: Response): void
  + googleAuth(req: Request, res: Response): void
  + logout(req: Request, res: Response): void
  + getProfile(req: Request, res: Response): void
  + updateProfile(req: Request, res: Response): void
  + getAllUsers(req: Request, res: Response): void
  + approveUser(req: Request, res: Response): void
  + searchUsers(req: Request, res: Response): void
  + forgotPassword(req: Request, res: Response): void
  + resetPassword(req: Request, res: Response): void
}
```

#### ProposalController Class
```javascript
class ProposalController {
  // HTTP Endpoint Methods
  + createProposal(req: Request, res: Response): void
  + getProposals(req: Request, res: Response): void
  + getProposalById(req: Request, res: Response): void
  + updateProposal(req: Request, res: Response): void
  + deleteProposal(req: Request, res: Response): void
  + approveProposal(req: Request, res: Response): void
  + rejectProposal(req: Request, res: Response): void
  + addReviewComment(req: Request, res: Response): void
  + uploadDocument(req: Request, res: Response): void
  + getMyProposals(req: Request, res: Response): void
  + submitAccomplishmentReport(req: Request, res: Response): void
}
```

### Backend Services

#### AdminService Class
```javascript
class AdminService {
  // Business Logic Methods
  + getAdminProposals(queryParams: Object): Object
  + getAdminStats(): Object
  + getAdminUsers(queryParams: Object): Object
  + mergeMongoDBFileData(proposals: Proposal[]): void
  + calculateTrend(current: number, previous: number): number
  + validateAdminAccess(userId: string): boolean
  + generateReports(filters: Object): Object
}
```

#### AuthService Class
```javascript
class AuthService {
  // Authentication Methods
  + authenticateUser(credentials: Object): Object
  + generateJWTToken(user: User): string
  + validateToken(token: string): boolean
  + handleGoogleOAuth(googleToken: string): Object
  + refreshToken(token: string): string
  + hashPassword(password: string): string
  + comparePassword(password: string, hash: string): boolean
}
```

### Frontend Components

#### GoogleOAuthButton Component
```javascript
class GoogleOAuthButton {
  // State Properties
  - isLoading: boolean
  - error: string
  - onSuccess: Function
  - onError: Function
  - redirectUrl: string
  
  // Component Methods
  + handleOAuthLogin(): void
  + handleOAuthCallback(): void
  + handleGoogleResponse(response: Object): void
  + render(): JSX.Element
}
```

#### UserDashboard Component
```javascript
class UserDashboard {
  // State Properties
  - user: User
  - proposals: Proposal[]
  - events: Event[]
  - notifications: Notification[]
  
  // Component Methods
  + loadUserData(): void
  + loadProposals(): void
  + loadEvents(): void
  + handleProposalSubmit(proposal: Proposal): void
  + viewProposalStatus(proposalId: string): void
  + updateProfile(userData: Object): void
  + render(): JSX.Element
}
```

#### AdminDashboard Component
```javascript
class AdminDashboard {
  // State Properties
  - adminStats: Object
  - pendingProposals: Proposal[]
  - users: User[]
  - reports: Report[]
  
  // Component Methods
  + loadAdminStats(): void
  + loadPendingProposals(): void
  + loadUsers(): void
  + approveProposal(proposalId: string): void
  + rejectProposal(proposalId: string, comments: string): void
  + approveUser(userId: number): void
  + generateReport(reportType: string): void
  + render(): JSX.Element
}
```

#### ProposalForm Component
```javascript
class ProposalForm {
  // State Properties
  - formData: Object
  - validationErrors: Object
  - isSubmitting: boolean
  - uploadedFiles: File[]
  
  // Component Methods
  + handleInputChange(field: string, value: any): void
  + validateForm(): boolean
  + handleFileUpload(files: File[]): void
  + submitProposal(): void
  + saveDraft(): void
  + resetForm(): void
  + render(): JSX.Element
}
```

### Frontend Context Classes

#### AuthContext
```javascript
class AuthContext {
  // State Properties
  - user: User
  - isAuthenticated: boolean
  - isLoading: boolean
  - token: string
  
  // Context Methods
  + login(credentials: Object): Promise
  + logout(): void
  + handleGoogleLogin(response: Object): Promise
  + refreshToken(): Promise
  + checkAuthStatus(): boolean
  + getUser(): User
  + updateUser(userData: Object): void
}
```

#### APIClient
```javascript
class APIClient {
  // Configuration Properties
  - baseURL: string
  - defaultHeaders: Object
  - timeout: number
  
  // HTTP Methods
  + get(endpoint: string, params?: Object): Promise
  + post(endpoint: string, data: Object): Promise
  + put(endpoint: string, data: Object): Promise
  + delete(endpoint: string): Promise
  + upload(endpoint: string, formData: FormData): Promise
  + setAuthToken(token: string): void
  + handleError(error: Error): void
}
```

## Key Relationships

### Data Flow Relationships
1. **User → Proposal**: One-to-Many (User submits multiple proposals)
2. **Proposal → Document**: One-to-Many (Proposal contains multiple documents)
3. **Proposal → ReviewComment**: One-to-Many (Proposal receives multiple reviews)
4. **User → ReviewComment**: One-to-Many (User creates multiple review comments)

### Component Dependencies
1. **Frontend Components → AuthContext**: All components use authentication state
2. **Frontend Components → APIClient**: Components make API calls through client
3. **Controllers → Services**: Controllers delegate business logic to services
4. **Services → Models**: Services interact with data models
5. **Controllers → Middleware**: Authentication and validation middleware

### Database Integration
1. **User Model → MySQL**: Relational data storage for user accounts
2. **Proposal Model → MongoDB**: Document storage for complex proposal data
3. **HybridFileService**: Manages both MongoDB GridFS and filesystem storage
4. **AdminService**: Merges data from both MySQL and MongoDB sources

## Design Patterns Used

### 1. **Model-View-Controller (MVC)**
- **Models**: User, Proposal (data layer)
- **Views**: React Components (presentation layer)  
- **Controllers**: UserController, ProposalController (business logic)

### 2. **Service Layer Pattern**
- AdminService, AuthService abstract business logic
- Reusable operations across controllers
- Database interaction abstraction

### 3. **Component-Based Architecture**
- Reusable React components
- Props-based data flow
- State management through hooks and context

### 4. **Repository Pattern**
- Data access abstraction in models
- Database independence
- Consistent data operations

### 5. **Context Pattern**
- Global state management (AuthContext)
- Cross-component data sharing
- Authentication state propagation

## Technical Implementation Notes

### Backend Architecture
- **Express.js**: RESTful API endpoints
- **MySQL**: User accounts, authentication data
- **MongoDB**: Proposal documents, file metadata
- **JWT**: Stateless authentication tokens
- **Google OAuth**: Third-party authentication

### Frontend Architecture  
- **Next.js**: React framework with SSR
- **React Hooks**: State management
- **Context API**: Global state
- **Tailwind CSS**: Styling framework
- **TypeScript**: Type safety

### Security Features
- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Controller-level authorization
- **Input Validation**: Middleware-based sanitization
- **File Upload Security**: Type and size validation

This class diagram represents the complete object-oriented architecture of your CEDO Event Management System, showing the clear separation between frontend presentation logic and backend business logic, with well-defined data models and service layers supporting the three-role user system (Student, Admin, Head Admin). 