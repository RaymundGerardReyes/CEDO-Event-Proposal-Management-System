# Account Error Dialog Components

This directory contains specialized dialog components for handling Google Sign-In authentication errors in a user-friendly way.

## Components

### 1. AccountNotFoundDialog

**Purpose**: Handles the scenario where a user tries to sign in with Google but their account doesn't exist in the system.

**When it appears**:
- User attempts Google Sign-In
- Backend returns 403 error with reason `"USER_NOT_FOUND"`
- The user's email is not found in the database

**Features**:
- ⚠️ Clear error explanation with user's email
- 📧 Pre-filled email template for contacting administrators
- 🔄 "Try Again" option for users
- 📋 Step-by-step guidance for users
- 📞 Administrator contact information

**Usage**:
```jsx
import { AccountNotFoundDialog } from "@/components/auth/AccountNotFoundDialog";

<AccountNotFoundDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  userEmail="user@example.com"
/>
```

### 2. AccountPendingDialog

**Purpose**: Handles the scenario where a user's account exists but is waiting for administrator approval.

**When it appears**:
- User attempts Google Sign-In
- Backend returns 403 error with reason `"USER_NOT_APPROVED"`
- User account exists but `is_approved = false`

**Features**:
- ⏳ Clear pending status explanation
- 📧 Follow-up email template for approval requests
- 🔄 "Check Again" option to retry sign-in
- 📋 What happens next information
- 📞 Administrator contact information

**Usage**:
```jsx
import { AccountPendingDialog } from "@/components/auth/AccountPendingDialog";

<AccountPendingDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  userEmail="user@example.com"
/>
```

## Integration with AuthContext

These dialogs are automatically integrated into the `AuthContext` and will appear when the corresponding authentication errors occur. The integration happens in the `handleGoogleCredentialResponse` function.

### Automatic Email Extraction

The dialogs automatically extract the user's email from the Google Sign-In token to personalize the error message:

```javascript
// Extract email from the Google response
let userEmail = null;
try {
  if (credentialResponse?.token) {
    const tokenPayload = JSON.parse(atob(credentialResponse.token.split('.')[1]));
    userEmail = tokenPayload.email;
  }
} catch (e) {
  console.warn('Could not extract email from token:', e);
}
```

### Dialog State Management

The AuthContext manages the dialog states:

```javascript
const [accountNotFoundDialog, setAccountNotFoundDialog] = useState({
  isOpen: false,
  userEmail: null,
});

const [accountPendingDialog, setAccountPendingDialog] = useState({
  isOpen: false,
  userEmail: null,
});
```

## Backend Error Response Format

These dialogs expect specific error response formats from the backend:

### Account Not Found
```json
{
  "status": 403,
  "data": {
    "message": "Account not found. Please contact an administrator to create your account first.",
    "reason": "USER_NOT_FOUND"
  }
}
```

### Account Pending Approval
```json
{
  "status": 403,
  "data": {
    "message": "Your account is currently pending approval. Please contact an administrator to activate your account.",
    "reason": "USER_NOT_APPROVED"
  }
}
```

## Testing

You can test these dialogs using the test page at `/test-dialogs` (development only).

## Design System

Both dialogs follow the application's design system:

- **Shadcn/UI Components**: Built using Dialog, Button, and other UI primitives
- **Tailwind CSS**: Styled with utility classes
- **Lucide Icons**: Uses consistent iconography
- **Color Scheme**: 
  - Account Not Found: Orange theme (warning)
  - Account Pending: Yellow theme (info)

## Email Templates

### Account Not Found Email Template
```
Subject: Account Access Request - CEDO Partnership Management System

Dear Administrator,

I am trying to access the CEDO Partnership Management System but received an "Account not found" error.

Details:
- Email: [user@example.com]
- Date: [current date]
- System: CEDO Partnership Management Platform

Could you please create an account for me or provide guidance on the account setup process?

Thank you for your assistance.

Best regards,
[Your Name]
```

### Account Pending Email Template
```
Subject: Account Approval Request - CEDO Partnership Management System

Dear Administrator,

I am writing to follow up on my account approval for the CEDO Partnership Management System.

Details:
- Email: [user@example.com]
- Date: [current date]
- Status: Pending Approval
- System: CEDO Partnership Management Platform

Could you please review and approve my account? I am ready to begin using the system for partnership management activities.

Thank you for your time and consideration.

Best regards,
[Your Name]
```

## Benefits

1. **Improved User Experience**: Clear, actionable error messages instead of generic toasts
2. **Reduced Support Burden**: Users know exactly what to do and how to contact support
3. **Professional Appearance**: Branded, consistent error handling
4. **Self-Service**: Pre-filled email templates reduce friction for users
5. **Clear Communication**: Users understand the approval process and next steps

## Future Enhancements

Potential improvements for these dialogs:

- **Real-time Status Updates**: Check approval status automatically
- **Progressive Enhancement**: Show estimated approval times
- **Multi-language Support**: Localization for different languages
- **Analytics Integration**: Track common error scenarios
- **Custom Contact Methods**: Support for different administrator contact preferences 