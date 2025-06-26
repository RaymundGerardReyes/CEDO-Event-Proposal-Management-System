# Comprehensive Drafts & Rejected Proposals Implementation

## Overview

This implementation provides a comprehensive solution for fetching draft and rejected proposals from both MySQL and MongoDB databases with role-based authentication and filtering.

## Key Features

### 🔄 **Hybrid Database Integration**
- **MySQL Integration**: Fetches proposals from the `proposals` table with status filtering
- **MongoDB Integration**: Fetches proposals from the `Proposal` collection using Mongoose
- **Unified Response**: Combines data from both sources into a single, normalized response

### 🔐 **Role-Based Authentication & Authorization**
- **Student/Partner Role**: Can only see their own proposals (filtered by email)
- **Admin/Manager/Reviewer Role**: Can see all proposals across all users
- **JWT Authentication**: Uses the existing auth middleware for secure access

### 📊 **Advanced Filtering & Querying**
- **Status Filtering**: 
  - `draft` - Shows only draft proposals
  - `rejected` - Shows denied, rejected, and revision_requested proposals
  - `all` - Shows both drafts and rejected proposals
- **Pagination**: Supports limit and offset parameters
- **Role-based Data Access**: Automatically filters based on user permissions

## API Endpoints

### Main Endpoint
```
GET /api/proposals/drafts-and-rejected
```

#### Query Parameters:
- `status` (optional): `'all'`, `'draft'`, `'rejected'` (default: `'all'`)
- `includeRejected` (optional): `'true'`, `'false'` (default: `'true'`)
- `limit` (optional): Number of records to return (default: `50`)
- `offset` (optional): Number of records to skip (default: `0`)

#### Headers Required:
- `Authorization: Bearer <JWT_TOKEN>`

#### Example Request:
```javascript
fetch('/api/proposals/drafts-and-rejected?status=all&includeRejected=true&limit=50', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
```

#### Example Response:
```json
{
  "success": true,
  "mysql": [
    {
      "id": "123",
      "source": "mysql",
      "name": "Community Workshop",
      "organizationName": "Tech Community",
      "status": "draft",
      "progress": 60,
      "lastEdited": "2024-01-15T10:30:00Z",
      "adminComments": "",
      "currentSection": "schoolEvent"
    }
  ],
  "mongodb": [
    {
      "id": "507f1f77bcf86cd799439011",
      "source": "mongodb",
      "name": "Environmental Seminar",
      "organizationName": "Green Initiative",
      "status": "rejected",
      "progress": 100,
      "lastEdited": "2024-01-14T15:45:00Z",
      "adminComments": "Needs more detailed budget breakdown"
    }
  ],
  "proposals": [...], // Combined and sorted array
  "total": 25,
  "sources": ["mysql", "mongodb"],
  "metadata": {
    "userId": "45",
    "userRole": "student",
    "userEmail": "student@example.com",
    "queryParams": {...},
    "timestamp": "2024-01-15T12:00:00Z",
    "counts": {
      "mysql": 15,
      "mongodb": 10,
      "total": 25
    }
  }
}
```

### Test Endpoint
```
GET /api/proposals/test-drafts-api
```
- Used for development testing
- Returns user info and API configuration

## Database Schema Mapping

### MySQL (`proposals` table)
```sql
SELECT 
    id, organization_name, organization_type, contact_email, 
    contact_name, event_name, event_venue, event_start_date, 
    event_end_date, proposal_status, report_status, 
    updated_at, created_at, admin_comments, current_section,
    form_completion_percentage
FROM proposals 
WHERE contact_email = ? AND proposal_status IN ('draft', 'denied', 'revision_requested')
```

### MongoDB (`Proposal` collection)
```javascript
Proposal.find({
  contactEmail: email,
  status: { $in: ['draft', 'rejected'] }
})
.sort({ updatedAt: -1 })
.limit(50)
.lean()
```

## Frontend Implementation

### Enhanced Features
1. **Tabs Interface**: Separate views for All, Drafts, and Rejected proposals
2. **Status Badges**: Visual indicators for proposal status and data source
3. **Progress Tracking**: Shows completion percentage and current step
4. **Admin Comments**: Displays rejection feedback for rejected proposals
5. **Responsive Design**: Mobile-first approach with touch-friendly controls
6. **Real-time Updates**: Auto-refresh and visibility change detection

### Key Components
- `StatusBadge`: Shows proposal status with color-coded icons
- `DraftsContent`: Main component with comprehensive data handling
- Authentication integration with `useAuth` hook
- Error handling and loading states

## Security & Performance

### Security Features
- **JWT Authentication**: All endpoints require valid authentication
- **Role-based Access Control**: Users can only access authorized data
- **Input Validation**: Query parameters are validated and sanitized
- **Error Handling**: Secure error messages without exposing sensitive data

### Performance Optimizations
- **Database Query Optimization**: Indexed queries with proper WHERE clauses
- **Pagination Support**: Prevents large data loads
- **Client-side Caching**: Reduces unnecessary API calls
- **Lazy Loading**: Components load data only when needed

## Database Status Mapping

### MySQL Status Values
- `'draft'` → Draft proposals (in progress)
- `'denied'` → Rejected proposals  
- `'revision_requested'` → Proposals needing revision
- `'pending'` → Under review
- `'approved'` → Approved proposals

### MongoDB Status Values
- `'draft'` → Draft proposals
- `'rejected'` → Rejected proposals
- `'pending'` → Under review
- `'approved'` → Approved proposals

## Usage Examples

### For Students/Partners
```javascript
// Fetch only user's own drafts and rejected proposals
const response = await fetchProposals({
  status: 'all',
  includeRejected: true
});
// Result: Only proposals where contact_email matches user's email
```

### For Admins/Managers
```javascript
// Fetch all drafts across all users
const response = await fetchProposals({
  status: 'draft',
  limit: 100
});
// Result: All draft proposals from all users
```

### Frontend Integration
```jsx
import { useAuth } from "@/contexts/auth-context"

function DraftsPage() {
  const { user } = useAuth()
  
  const fetchProposals = useCallback(async () => {
    const token = localStorage.getItem('cedo_token')
    const response = await fetch('/api/proposals/drafts-and-rejected', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    // Handle combined MySQL + MongoDB data
  }, [user])
}
```

## Error Handling

### Common Error Scenarios
1. **Authentication Errors**: Invalid or missing JWT token
2. **Authorization Errors**: User lacks permission for requested data
3. **Database Errors**: MySQL or MongoDB connection issues
4. **Validation Errors**: Invalid query parameters

### Error Response Format
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "User ID not found in request",
  "stack": "..." // Only in development mode
}
```

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live data updates
2. **Advanced Filtering**: Search by organization name, date ranges
3. **Bulk Operations**: Multi-select for batch actions
4. **Export Functionality**: CSV/PDF export of proposals
5. **Notification System**: Alerts for status changes

### Performance Improvements
1. **Database Indexing**: Optimize queries with proper indexes
2. **Caching Layer**: Redis integration for frequently accessed data
3. **API Rate Limiting**: Prevent abuse and ensure fair usage
4. **Background Sync**: Periodic synchronization between databases

## Troubleshooting

### Common Issues
1. **Empty Results**: Check user authentication and role permissions
2. **Slow Performance**: Verify database indexes and query optimization
3. **Authentication Errors**: Ensure JWT token is valid and not expired
4. **Cross-database Inconsistency**: Verify data sync between MySQL and MongoDB

### Debug Endpoints
- `GET /api/proposals/test-drafts-api` - Test authentication and permissions
- `GET /api/proposals/debug/:id` - Debug specific proposal data

### Logging
The implementation includes comprehensive logging for:
- Authentication attempts
- Database queries and performance
- Error conditions and stack traces
- User actions and API usage

## Conclusion

This comprehensive implementation provides a robust, scalable solution for managing draft and rejected proposals across multiple database systems while maintaining security, performance, and user experience standards. 