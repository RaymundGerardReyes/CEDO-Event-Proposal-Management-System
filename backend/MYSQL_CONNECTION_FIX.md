# MySQL Connection Fix - Complete Solution

## Problem Identified
The error "Access denied for user 'root'@'localhost' (using password: NO)" was occurring because:

1. **Port Mismatch**: The new routes were trying to connect to port 3307, but MySQL is running on port 3306
2. **Connection Method Mismatch**: The new routes were using `pool.getConnection()` while the main server uses `pool.query()`
3. **Configuration Inconsistency**: The new routes had their own MySQL configuration instead of using the shared pool

## Fixes Applied

### 1. Updated Database Configuration (`config/db.js`)
- ✅ Changed default port from 3307 to 3306 (the actual MySQL port)
- ✅ Added port configuration to connection parameters
- ✅ Updated debug logging to include port information

### 2. Fixed Route Database Connections (`routes/proposals.js`)
- ✅ Removed separate MySQL configuration in routes
- ✅ Updated routes to use the shared `pool` from `config/db.js`
- ✅ Changed from `pool.getConnection()` + `connection.execute()` to `pool.query()` (matches main server)
- ✅ Removed connection release code (not needed with `pool.query()`)
- ✅ Fixed both `/section2` and `/section2-organization` endpoints

### 3. Connection Method Alignment
**Before (Failing):**
```javascript
const connection = await pool.getConnection();
const [result] = await connection.execute(query, values);
connection.release();
```

**After (Working):**
```javascript
const [result] = await pool.query(query, values);
```

## Testing Instructions

### 1. Restart the Server
```bash
# Stop current server (if running)
npm stop
# Or manually kill Node.js processes

# Start server
npm start
```

### 2. Test the Fixed Endpoint
```bash
# Test Section 2 organization endpoint
curl -X POST http://localhost:5000/api/proposals/section2-organization \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Organization","contactPerson":"John Doe","contactEmail":"john@example.com"}'
```

**Expected Success Response:**
```json
{
  "id": 123,
  "message": "Section 2 organization data saved successfully to MySQL",
  "data": {
    "title": "Test Organization",
    "contactPerson": "John Doe",
    "contactEmail": "john@example.com",
    "status": "draft"
  },
  "timestamp": "2025-06-05T10:00:00.000Z"
}
```

### 3. Test Frontend Integration
1. Open the frontend application
2. Navigate to the Submit Event flow
3. Fill out Section 2 (Organization Information)
4. Click "Save & Continue"
5. Should now save to MySQL and proceed to Section 3

### 4. Verify Database Storage
```sql
-- Connect to MySQL and check the data
USE cedo_auth;
SELECT * FROM proposals ORDER BY created_at DESC LIMIT 5;
```

## Root Cause Analysis

The main server connection was working because:
1. It uses `pool.query()` directly
2. It connects to the correct port (3306)
3. It uses the shared configuration from `config/db.js`

The new routes were failing because:
1. They used `pool.getConnection()` which requires different error handling
2. They had hardcoded port 3307 in some configurations
3. They created separate MySQL configurations instead of reusing the working one

## Verification Commands

### Check MySQL is Running
```bash
netstat -an | findstr :3306
# Should show MySQL listening on port 3306
```

### Test Database Pool Directly
```bash
node test-pool-connection.js
# Should show successful connection and table access
```

### Check Server Logs
Look for these success messages:
- ✅ "MySQL database connected successfully"
- ✅ "proposals table exists: YES"
- ✅ "MySQL: New proposal created with ID: [number]"

## Additional Notes

- The fix maintains the hybrid architecture (MySQL for proposals, MongoDB for files)
- All existing functionality remains intact
- The mock endpoint (`/section2-mock`) still works for testing without database
- Error handling and validation remain the same

## If Issues Persist

1. **Check MySQL Authentication:**
   ```bash
   mysql -u root -e "SELECT 1"
   # Should connect without password prompt
   ```

2. **Run Authentication Fix:**
   ```bash
   node fix-mysql-auth.js
   ```

3. **Verify Environment Variables:**
   ```bash
   echo $DB_HOST $DB_PORT $DB_USER
   # Should show localhost, 3306, root (or empty)
   ```

4. **Check Server Startup Logs:**
   Look for "MySQL database connected successfully" message

The fix ensures that all database operations use the same proven connection method that the main server uses successfully. 