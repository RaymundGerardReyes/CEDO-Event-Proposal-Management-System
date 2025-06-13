# API Integration Documentation

## Frontend ↔ Backend User Management Integration

This document explains how the frontend whitelist management page (`/admin-dashboard/settings`) connects to the backend user API endpoints.

## 📁 File Structure

```
frontend/
├── src/
│   ├── lib/api/users.js                    # API service layer
│   └── app/(main)/admin-dashboard/settings/page.jsx  # UI component
backend/
└── routes/users.js                         # API endpoints
```

## 🔗 API Endpoints Mapping

### Backend Endpoints (`backend/routes/users.js`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `GET` | `/api/users/` | Get all users (whitelist) | HEAD_ADMIN only |
| `GET` | `/api/users/me` | Get current user details | Private |
| `GET` | `/api/users/pending-students` | Get pending student approvals | HEAD_ADMIN, MANAGER |
| `POST` | `/api/users/` | Create new user | HEAD_ADMIN only |
| `PUT` | `/api/users/:id/approval` | Update user approval status | HEAD_ADMIN only |
| `PUT` | `/api/users/:id` | Update user details | HEAD_ADMIN only |
| `DELETE` | `/api/users/:id` | Delete user | HEAD_ADMIN only |
| `POST` | `/api/users/approve-student/:id` | Approve student account | HEAD_ADMIN, MANAGER |

### Frontend API Service (`frontend/src/lib/api/users.js`)

| Function | Backend Endpoint | Purpose |
|----------|------------------|---------|
| `getAllUsers()` | `GET /users/` | Load whitelist users |
| `getCurrentUser()` | `GET /users/me` | Get auth user info |
| `getPendingStudents()` | `GET /users/pending-students` | Load pending approvals |
| `createUser(userData)` | `POST /users/` | Add user to whitelist |
| `updateUser(id, data)` | `PUT /users/:id` | Update user details |
| `updateUserApproval(id, approved)` | `PUT /users/:id/approval` | Approve/deny user |
| `deleteUser(id)` | `DELETE /users/:id` | Remove from whitelist |
| `approveStudent(id)` | `POST /users/approve-student/:id` | Quick student approval |

## 🔧 Configuration

### Environment Variables

**Frontend (`.env`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend**
- Database connection in `config/db.js`
- JWT secret for authentication
- Role-based access control middleware

## 🛡️ Authentication & Authorization

### Frontend Auth Token
```javascript
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  return null;
};
```

### Backend Middleware
```javascript
// Authentication required
router.get("/", [auth, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
  // Only HEAD_ADMIN can access
});
```

## 💡 Usage Example

### Adding a New User

**Frontend Call:**
```javascript
const userData = {
  name: "John Doe",
  email: "john@example.com", 
  role: "student",
  organization: "University"
};

const response = await usersApi.createUser(userData);
```

**Backend Processing:**
1. Validates JWT token (auth middleware)
2. Checks user role is HEAD_ADMIN (checkRole middleware)
3. Validates input data
4. Checks for duplicate email
5. Inserts into database
6. Returns created user object

### Loading Whitelist

**Frontend Call:**
```javascript
const users = await usersApi.getAllUsers();
setWhitelistedUsers(users.map(user => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  organization: user.organization || '',
  addedAt: user.created_at,
  is_approved: user.is_approved
})));
```

## 🚀 Key Features

### ✅ Complete CRUD Operations
- **Create**: Add users to whitelist
- **Read**: View all whitelisted users
- **Update**: Modify user details/approval status  
- **Delete**: Remove users from whitelist

### ✅ Security Features
- JWT token authentication
- Role-based access control
- Input validation
- Duplicate email prevention
- Self-deletion protection

### ✅ Error Handling
- Network error handling
- Validation error messages
- User-friendly toast notifications
- Loading states during API calls

## 🎯 Integration Points

### 1. Settings Page Component
```javascript
// Load users on component mount
useEffect(() => {
  if (AuthRoles && authUser?.role === AuthRoles.head_admin) {
    loadWhitelistedUsers()
  }
}, [loadWhitelistedUsers, AuthRoles, authUser])
```

### 2. API Service Layer
```javascript
// Centralized API configuration
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  };
  return fetch(`${API_BASE_URL}${endpoint}`, config);
};
```

### 3. Backend Route Handlers
```javascript
// Example: Create user endpoint
router.post("/", [auth, checkRole(ROLES.HEAD_ADMIN)], async (req, res) => {
  try {
    const { name, email, role, organization } = req.body;
    // Validation & processing...
    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    res.status(500).send("Server error");
  }
});
```

## 🔍 Testing

1. **Start Backend**: Ensure MySQL database and Node.js backend are running
2. **Start Frontend**: `npm run dev` in frontend directory  
3. **Access**: Navigate to `/admin-dashboard/settings` as HEAD_ADMIN user
4. **Test Operations**: Add, view, edit, delete users in the whitelist

## 📝 Notes

- All API calls require authentication
- Only HEAD_ADMIN users can manage the whitelist
- Real-time updates reflect in the UI immediately
- Export functionality works with filtered data
- Form validation prevents invalid submissions 