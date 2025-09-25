# API Testing Guide - PostgreSQL Enum Fixes

## 🧪 **API Testing Solutions**

This guide provides comprehensive testing solutions for the PostgreSQL enum mapping fixes using both cURL and Postman.

## 🔍 **Current Issue Analysis**

**Error**: `violates check constraint "proposals_current_section_check"`

**Root Cause**: The `current_section` field was receiving invalid values like `"eventInformation"` instead of valid database values.

**Valid Values**: `'overview'`, `'orgInfo'`, `'schoolEvent'`, `'communityEvent'`, `'reporting'`

## 🛠️ **Fixes Applied**

1. **Frontend Mapping**: Updated `mapCurrentSection()` function to return valid database values
2. **Backend Default**: Changed default from `'overview'` to `'orgInfo'`
3. **Smart Detection**: Automatically determines correct section based on organization type

## 📡 **API Testing with cURL**

### **Test 1: Create/Update Proposal with School Organization**

```bash
curl -X PUT "http://localhost:3001/api/proposals/test-uuid-12345" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "proposal": {
      "uuid": "test-uuid-12345",
      "organization_name": "Test School",
      "organization_type": "school-based",
      "organization_description": "A test school organization",
      "contact_name": "John Doe",
      "contact_email": "john.doe@testschool.edu",
      "contact_phone": "0912-345-6789",
      "event_name": "Academic Workshop",
      "event_venue": "School Auditorium",
      "event_start_date": "2024-12-01",
      "event_end_date": "2024-12-01",
      "event_start_time": "09:00",
      "event_end_time": "17:00",
      "event_mode": "offline",
      "school_event_type": "workshop-seminar-webinar",
      "school_return_service_credit": "3",
      "school_target_audience": ["1st_year", "2nd_year"],
      "current_section": "schoolEvent",
      "proposal_status": "draft",
      "report_status": "draft",
      "event_status": "scheduled",
      "form_completion_percentage": 85.5
    },
    "files": {
      "gpoa": {
        "name": "test-gpoa.pdf",
        "size": 1024,
        "type": "application/pdf",
        "hasData": true
      }
    }
  }'
```

### **Test 2: Create/Update Proposal with Community Organization**

```bash
curl -X PUT "http://localhost:3001/api/proposals/test-uuid-67890" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "proposal": {
      "uuid": "test-uuid-67890",
      "organization_name": "Community Foundation",
      "organization_type": "community-based",
      "organization_description": "A test community organization",
      "contact_name": "Jane Smith",
      "contact_email": "jane.smith@community.org",
      "contact_phone": "0987-654-3210",
      "event_name": "Community Seminar",
      "event_venue": "Community Center",
      "event_start_date": "2024-12-15",
      "event_end_date": "2024-12-15",
      "event_start_time": "14:00",
      "event_end_time": "18:00",
      "event_mode": "online",
      "community_event_type": "seminar-webinar",
      "community_sdp_credits": "2",
      "community_target_audience": ["leaders", "alumni"],
      "current_section": "communityEvent",
      "proposal_status": "draft",
      "report_status": "draft",
      "event_status": "scheduled",
      "form_completion_percentage": 75.0
    },
    "files": {
      "projectProposal": {
        "name": "test-proposal.pdf",
        "size": 2048,
        "type": "application/pdf",
        "hasData": true
      }
    }
  }'
```

### **Test 3: Minimal Proposal Creation**

```bash
curl -X PUT "http://localhost:3001/api/proposals/minimal-uuid-11111" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "proposal": {
      "uuid": "minimal-uuid-11111",
      "organization_name": "Minimal Test Org",
      "organization_type": "school-based",
      "contact_name": "Test User",
      "contact_email": "test@example.com",
      "event_name": "Test Event",
      "event_venue": "Test Venue",
      "event_start_date": "2024-12-01",
      "event_end_date": "2024-12-01"
    }
  }'
```

## 📮 **API Testing with Postman**

### **Collection Setup**

1. **Create New Collection**: "CEDO Proposal API Tests"
2. **Base URL**: `http://localhost:3001`
3. **Authorization**: Bearer Token (set in collection variables)

### **Request 1: School Proposal Test**

**Method**: `PUT`  
**URL**: `{{base_url}}/api/proposals/school-test-uuid-12345`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{jwt_token}}
```

**Body** (JSON):
```json
{
  "proposal": {
    "uuid": "school-test-uuid-12345",
    "organization_name": "Xavier University",
    "organization_type": "school-based",
    "organization_description": "Premier educational institution",
    "contact_name": "Dr. Maria Santos",
    "contact_email": "maria.santos@xu.edu.ph",
    "contact_phone": "088-999-8888",
    "event_name": "Academic Enhancement Workshop",
    "event_venue": "University Auditorium",
    "event_start_date": "2024-12-10",
    "event_end_date": "2024-12-10",
    "event_start_time": "08:00",
    "event_end_time": "17:00",
    "event_mode": "offline",
    "school_event_type": "workshop-seminar-webinar",
    "school_return_service_credit": "3",
    "school_target_audience": ["1st_year", "2nd_year", "3rd_year"],
    "current_section": "schoolEvent",
    "proposal_status": "draft",
    "form_completion_percentage": 90.0
  },
  "files": {
    "gpoa": {
      "name": "workshop-gpoa.pdf",
      "size": 5120,
      "type": "application/pdf",
      "hasData": true
    }
  }
}
```

### **Request 2: Community Proposal Test**

**Method**: `PUT`  
**URL**: `{{base_url}}/api/proposals/community-test-uuid-67890`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{jwt_token}}
```

**Body** (JSON):
```json
{
  "proposal": {
    "uuid": "community-test-uuid-67890",
    "organization_name": "Cagayan de Oro Community Foundation",
    "organization_type": "community-based",
    "organization_description": "Non-profit community development organization",
    "contact_name": "Mr. Roberto Cruz",
    "contact_email": "roberto.cruz@cdocf.org",
    "contact_phone": "088-777-6666",
    "event_name": "Leadership Training Program",
    "event_venue": "Community Center",
    "event_start_date": "2024-12-20",
    "event_end_date": "2024-12-22",
    "event_start_time": "09:00",
    "event_end_time": "16:00",
    "event_mode": "hybrid",
    "community_event_type": "leadership-training",
    "community_sdp_credits": "2",
    "community_target_audience": ["leaders", "alumni"],
    "current_section": "communityEvent",
    "proposal_status": "draft",
    "form_completion_percentage": 85.0
  },
  "files": {
    "projectProposal": {
      "name": "leadership-proposal.pdf",
      "size": 3072,
      "type": "application/pdf",
      "hasData": true
    }
  }
}
```

### **Request 3: Error Testing - Invalid Enum Values**

**Method**: `PUT`  
**URL**: `{{base_url}}/api/proposals/error-test-uuid-99999`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{jwt_token}}
```

**Body** (JSON) - This should fail:
```json
{
  "proposal": {
    "uuid": "error-test-uuid-99999",
    "organization_name": "Error Test Org",
    "organization_type": "invalid-type",
    "contact_name": "Error User",
    "contact_email": "error@example.com",
    "event_name": "Error Event",
    "event_venue": "Error Venue",
    "event_start_date": "2024-12-01",
    "event_end_date": "2024-12-01",
    "current_section": "invalid-section",
    "proposal_status": "invalid-status"
  }
}
```

## 🔍 **Expected Responses**

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "test-uuid-12345",
    "organization_name": "Test School",
    "organization_type": "school-based",
    "current_section": "schoolEvent",
    "proposal_status": "draft",
    "form_completion_percentage": "85.50",
    "created_at": "2024-09-22T21:05:43.787Z",
    "updated_at": "2024-09-22T21:05:43.787Z"
  },
  "message": "Proposal created successfully"
}
```

### **Error Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "Invalid enum value",
  "message": "Validation failed: organization_type must be one of: internal, external, school-based, community-based"
}
```

### **Error Response (500 Internal Server Error)**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Database constraint violation"
}
```

## 🧪 **Test Scenarios**

### **Scenario 1: Valid Enum Values**
- ✅ Test all valid `organization_type` values
- ✅ Test all valid `event_mode` values  
- ✅ Test all valid `current_section` values
- ✅ Test all valid `proposal_status` values

### **Scenario 2: Invalid Enum Values**
- ❌ Test invalid `organization_type` values
- ❌ Test invalid `current_section` values
- ❌ Test invalid `event_mode` values

### **Scenario 3: Edge Cases**
- ✅ Test with minimal required fields
- ✅ Test with null values for optional fields
- ✅ Test with empty strings for required fields
- ✅ Test with very long strings

### **Scenario 4: Data Type Validation**
- ✅ Test with correct date formats
- ✅ Test with correct time formats
- ✅ Test with valid JSONB arrays
- ❌ Test with invalid date formats

## 🔧 **Troubleshooting**

### **Common Issues**

1. **JWT Token Expired**
   ```bash
   # Get new token
   curl -X POST "http://localhost:3001/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "your@email.com", "password": "yourpassword"}'
   ```

2. **Server Not Running**
   ```bash
   # Start backend server
   cd backend
   npm start
   ```

3. **Database Connection Issues**
   ```bash
   # Check database connection
   curl -X GET "http://localhost:3001/api/health"
   ```

### **Debug Commands**

```bash
# Check if server is running
curl -X GET "http://localhost:3001/api/health"

# Test authentication
curl -X GET "http://localhost:3001/api/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check database schema
psql -h localhost -U your_username -d cedo_auth -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'proposals' 
AND column_name IN ('organization_type', 'current_section', 'event_mode');
"
```

## 📊 **Test Results Validation**

### **Success Criteria**
- ✅ All valid enum values accepted
- ✅ Invalid enum values rejected with proper error messages
- ✅ Database constraints enforced
- ✅ Proper audit logging created
- ✅ Response times under 500ms

### **Performance Benchmarks**
- **Simple Proposal**: < 200ms
- **Complex Proposal**: < 500ms
- **Error Responses**: < 100ms

## 🎯 **Next Steps**

1. **Run All Tests**: Execute all cURL commands and Postman requests
2. **Verify Database**: Check that data is correctly inserted
3. **Monitor Logs**: Watch backend logs for any errors
4. **Performance Test**: Run load tests with multiple concurrent requests
5. **Integration Test**: Test with frontend application

---

**Status**: ✅ **READY FOR TESTING**

Use these API tests to verify that the PostgreSQL enum mapping fixes are working correctly.






