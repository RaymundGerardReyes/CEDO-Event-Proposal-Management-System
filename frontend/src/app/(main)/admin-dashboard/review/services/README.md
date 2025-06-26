# Review Service API Documentation

## Overview

This document outlines the backend API endpoints that need to be implemented to support the review dialog functionality.

## Required API Endpoints

### 1. Add Comment to Proposal
```
POST /api/proposals/{proposalId}/comments
```

**Request Body:**
```json
{
  "comment": "string",
  "timestamp": "ISO 8601 datetime"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment_id",
    "comment": "string",
    "timestamp": "ISO 8601 datetime",
    "author": {
      "id": "user_id",
      "name": "Admin Name",
      "role": "admin"
    }
  }
}
```

### 2. Submit Review Decision
```
POST /api/proposals/{proposalId}/review
```

**Request Body:**
```json
{
  "decision": "approve|reject|revision",
  "comment": "string (optional)",
  "reviewedAt": "ISO 8601 datetime",
  "reviewerId": "admin_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proposalId": "string",
    "status": "approved|rejected|revision_requested",
    "reviewedAt": "ISO 8601 datetime",
    "reviewedBy": "admin_user_id"
  }
}
```

### 3. Get Proposal Details (Enhanced)
```
GET /api/proposals/{proposalId}/details
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "status": "pending|approved|rejected|revision_requested",
    "submittedAt": "ISO 8601 datetime",
    "submitter": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "details": {
      "purpose": "string",
      "organization": {
        "name": "string",
        "type": ["array", "of", "types"],
        "description": "string"
      },
      "comments": [
        {
          "id": "string",
          "text": "string",
          "timestamp": "ISO 8601 datetime",
          "author": {
            "name": "string",
            "role": "admin|submitter"
          }
        }
      ]
    }
  }
}
```

### 4. Update Proposal Status
```
PATCH /api/proposals/{proposalId}/status
```

**Request Body:**
```json
{
  "status": "approved|rejected|revision_requested|pending",
  "updatedAt": "ISO 8601 datetime"
}
```

### 5. Request Documentation
```
POST /api/proposals/{proposalId}/request-documentation
```

**Request Body:**
```json
{
  "message": "string (optional)",
  "requestedAt": "ISO 8601 datetime",
  "requesterId": "admin_user_id"
}
```

## Authentication

All endpoints should require admin authentication. Include the following header:
```
Authorization: Bearer {jwt_token}
```

## Error Responses

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

## Implementation Notes

1. **Current State**: The frontend currently uses local state management for demo purposes
2. **Migration**: Once backend endpoints are implemented, uncomment the API calls in `useReviewDialog.js`
3. **Error Handling**: Implement proper error handling with user-friendly messages
4. **Real-time Updates**: Consider implementing WebSocket updates for real-time comment updates
5. **Permissions**: Ensure proper role-based access control for admin operations

## Testing

When implementing these endpoints, test with:
- Valid proposal IDs
- Invalid proposal IDs (404 responses)
- Unauthorized access (401/403 responses)
- Malformed request bodies (400 responses)
- Server errors (500 responses) 