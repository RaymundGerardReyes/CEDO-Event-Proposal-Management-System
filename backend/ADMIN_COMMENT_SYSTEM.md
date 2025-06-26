# 💬 Admin Comment System Documentation

## Overview
The admin comment system allows administrators to add rejection/approval comments to proposals, with data stored across both MySQL and MongoDB databases for optimal performance and flexibility.

## Architecture

### 🗄️ Database Structure

#### MySQL (Relational Data)
- **Table**: `proposals`
- **Purpose**: Main proposal data, status tracking
- **Updated Fields**: `proposal_status`, `updated_at`

#### MongoDB (Document Data)
- **Collection**: `proposal_comments`
- **Purpose**: Admin comments, metadata, audit trail
- **Collection**: `proposal_files` (GridFS)
- **Purpose**: File attachments, metadata

### 🔗 Data Linking
- Comments are linked to proposals using `proposalId` (string)
- Both databases reference the same proposal ID for consistency
- Frontend receives unified data from hybrid API endpoints

## API Endpoints

### 1. Update Proposal Status with Comment
```http
PATCH /api/mongodb-unified/admin/proposals/:id/status
Content-Type: application/json

{
  "status": "denied|approved|pending",
  "adminComments": "Reason for rejection/approval"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Proposal denied successfully",
  "proposal": {
    "id": "197",
    "status": "denied",
    "adminComments": "Does not meet guidelines...",
    "updatedAt": "2025-06-24T13:35:21.962Z"
  },
  "comment": {
    "id": "676a1b2a3c4d5e6f7a8b9c0d",
    "saved": true,
    "message": "Admin comment saved to database"
  }
}
```

### 2. Get Proposal with Comments (Hybrid)
```http
GET /api/mongodb-unified/admin/proposals-hybrid
```

**Response includes:**
- All proposal data from MySQL
- File metadata from MongoDB GridFS
- Latest admin comment from MongoDB
- Normalized field names for frontend compatibility

### 3. Get Individual Proposal Details
```http
GET /api/mongodb-unified/admin/proposals/:id
```

**Returns:**
- Complete proposal data (MySQL + MongoDB)
- All files associated with the proposal
- Latest admin comment
- Hybrid data structure

### 4. Get All Comments for a Proposal
```http
GET /api/mongodb-unified/admin/proposals/:id/comments
```

**Response:**
```json
{
  "success": true,
  "proposalId": "197",
  "comments": [
    {
      "_id": "676a1b2a3c4d5e6f7a8b9c0d",
      "proposalId": "197",
      "comment": "Does not meet current guidelines...",
      "status": "denied",
      "adminAction": "rejection",
      "createdAt": "2025-06-24T13:35:22.011Z",
      "metadata": {
        "source": "admin_dashboard",
        "ipAddress": "::1",
        "userAgent": "Mozilla/5.0..."
      }
    }
  ],
  "count": 1
}
```

### 5. Test Database Connections
```http
GET /api/mongodb-unified/admin/test-connections
```

**Purpose:** Verify both MySQL and MongoDB connections are working

## MongoDB Comment Schema

```javascript
{
  _id: ObjectId("676a1b2a3c4d5e6f7a8b9c0d"),
  proposalId: "197",                    // Links to MySQL proposals.id
  comment: "Detailed rejection reason...",
  status: "denied",                     // denied|approved
  adminAction: "rejection",             // rejection|approval
  createdAt: Date("2025-06-24T13:35:22.011Z"),
  updatedAt: Date("2025-06-24T13:35:22.011Z"),
  metadata: {
    source: "admin_dashboard",
    ipAddress: "::1",
    userAgent: "Mozilla/5.0..."
  }
}
```

## Frontend Integration

### Comment Dialog Component
- Located in: `frontend/src/components/dashboard/admin/proposal-table.jsx`
- Triggered by "Deny Proposal" button
- Requires comment before submission
- Shows proposal summary for context
- Validates comment length (max 500 chars)

### State Management
```javascript
const [showCommentDialog, setShowCommentDialog] = useState(false)
const [rejectionComment, setRejectionComment] = useState('')
const [commentLoading, setCommentLoading] = useState(false)
```

### API Call Example
```javascript
const response = await fetch(`${backendUrl}/api/mongodb-unified/admin/proposals/${proposalId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: newStatus,
    adminComments: rejectionComment.trim()
  })
})
```

## Key Features

### ✅ Dual Database Storage
- **MySQL**: Maintains relational integrity, fast queries
- **MongoDB**: Flexible document storage, rich metadata
- **Hybrid API**: Single endpoint for complete data

### ✅ Real-time Updates
- Comments appear immediately after submission
- Frontend state updates before API confirmation
- Automatic refresh from server for persistence verification

### ✅ Data Integrity
- Atomic operations where possible
- Error handling prevents partial saves
- Comprehensive logging for debugging

### ✅ Audit Trail
- All comments timestamped
- IP address and user agent tracking
- Action type classification (rejection/approval)

## Error Handling

### Database Connection Issues
```javascript
// MySQL connection failure - continues with MongoDB-only operation
// MongoDB connection failure - logs error, continues without comment save
// Both connections fail - returns appropriate error response
```

### Comment Save Failures
```javascript
// Comment save failure doesn't block status update
// Error logged but proposal status still changes
// Frontend notified of partial success
```

## Performance Considerations

### Database Connections
- Direct MongoDB connections for simplicity
- Connection pooling for MySQL via existing pool
- Connections properly closed after operations

### Query Optimization
- Indexed queries on `proposalId` field
- Latest comment fetched with `sort({ createdAt: -1 })`
- Minimal data transfer with field selection

## Usage Examples

### 1. Rejecting a Proposal with Comment
```bash
curl -X PATCH http://localhost:5000/api/mongodb-unified/admin/proposals/197/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "denied",
    "adminComments": "The proposed event does not align with current institutional priorities and lacks sufficient detail in the budget section."
  }'
```

### 2. Checking Comment History
```bash
curl http://localhost:5000/api/mongodb-unified/admin/proposals/197/comments
```

### 3. Verifying System Health
```bash
curl http://localhost:5000/api/mongodb-unified/admin/test-connections
```

## Development Notes

### Environment Variables
```env
# MongoDB connection string
MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin

# MySQL connection (handled by existing pool)
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_DATABASE=cedo_auth
```

### Database Collections
- `proposal_comments` - Automatically created on first comment
- `proposal_files.files` - GridFS collection for file storage
- `proposal_files.chunks` - GridFS chunks for large files

## Troubleshooting

### Common Issues

1. **Comments not appearing**
   - Check MongoDB connection
   - Verify `proposalId` matching between databases
   - Check browser console for API errors

2. **Status updates failing**
   - Verify MySQL connection
   - Check proposal ID exists in proposals table
   - Ensure valid status values: `pending|approved|denied`

3. **File downloads not working**
   - Check GridFS bucket configuration
   - Verify file metadata in MongoDB
   - Ensure proper file linking by proposalId

### Debug Endpoints
- `/api/mongodb-unified/admin/test-connections` - Test both databases
- Console logging enabled for all operations
- Error responses include detailed messages

## Future Enhancements

### Potential Improvements
- [ ] Comment editing/deletion functionality
- [ ] Multiple admin users comment threading
- [ ] Email notifications for status changes
- [ ] Comment history pagination
- [ ] Rich text comment support
- [ ] Comment templates for common rejections

### Security Considerations
- [ ] Add authentication middleware
- [ ] Implement role-based access control
- [ ] Sanitize comment input
- [ ] Rate limiting for API endpoints
- [ ] Audit log for admin actions

---

**Last Updated:** June 24, 2025  
**Version:** 1.0.0  
**Tested:** ✅ All endpoints functional 