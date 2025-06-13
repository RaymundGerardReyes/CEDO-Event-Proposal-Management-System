# 🔗 Database Connection Setup

## Environment Variables Required

Create a `.env.local` file in your `frontend/` directory with the following variables:

```env
# Database Configuration (MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cedo_auth

# Alternative Environment Variable Names (for compatibility)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=cedo_auth

# JWT Configuration
JWT_SECRET_DEV=your_jwt_secret_here
JWT_SECRET=your_jwt_secret_here

# Backend API Configuration (Optional)
BACKEND_URL=http://localhost:5000
```

## Database Connection Test

The API route will automatically test the database connection and provide detailed error messages if the connection fails.

## Profile System Integration

### ✅ **Real Database Features Implemented:**

1. **Direct MySQL Connection**: Uses your existing `cedo_auth` database
2. **User Data Fetching**: Queries the `users` table directly
3. **Password Hashing**: Uses bcryptjs for secure password updates
4. **Field Validation**: Enforces database constraints
5. **Error Handling**: Provides detailed error messages for debugging

### 🎯 **Supported Operations:**

- **GET /api/user**: Fetch real user data from database
- **PUT /api/user**: Update user fields (password, organization) in database
- **Automatic JWT verification**: Uses your backend's JWT secret
- **Database connection testing**: Validates connection before queries

### 📊 **Database Fields Retrieved:**

```sql
SELECT 
  id, 
  name, 
  email, 
  role, 
  organization, 
  organization_type,
  avatar, 
  is_approved, 
  password_reset_required,
  last_login, 
  created_at, 
  updated_at 
FROM users 
WHERE id = ?
```

### 🔒 **Security Features:**

- **Password never returned**: Always masked with ••••••••
- **Password hashing**: Uses bcryptjs with salt rounds = 10
- **Field restrictions**: Only password and organization can be updated
- **JWT verification**: Validates tokens using your backend's secret
- **Input validation**: Prevents SQL injection and validates input

### 🚀 **Usage Example:**

```javascript
// Frontend automatically fetches real data:
const response = await fetch('/api/user', {
  method: 'GET',
  credentials: 'include',
});

// Returns actual database data:
{
  "id": 123,
  "name": "John Doe", 
  "email": "john@example.com",
  "role": "student",
  "organization": "University of Example",
  "password": "••••••••",
  // ... other real database fields
}
```

## Testing Your Database Connection

1. **Start your backend**: `cd backend && npm start`
2. **Start your frontend**: `cd frontend && npm run dev`
3. **Test the API**: Navigate to `/api/user` in browser
4. **Check console logs**: Look for database connection messages

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Ensure MySQL server is running
   - Check DB credentials in .env.local
   - Verify database `cedo_auth` exists

2. **JWT Verification Failed**
   - Ensure JWT_SECRET matches your backend
   - Check if user is properly authenticated
   - Verify cookie contains valid token

3. **User Not Found**
   - Ensure user exists in database
   - Check user ID extraction from JWT
   - Verify middleware is working correctly

---

**Status**: ✅ **Professional Database Integration Complete**

Your profile system now connects directly to your MySQL database with proper security, validation, and error handling! 