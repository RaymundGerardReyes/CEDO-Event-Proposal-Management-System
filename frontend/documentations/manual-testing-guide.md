# 🧪 CEDO API Manual Testing Guide

## **📋 Prerequisites**
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000`
- Postman or curl installed

---

## **🔐 Step 1: Authentication Testing**

### **1.1 Health Check (No Auth Required)**
```bash
curl -X GET http://localhost:5000/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-26T01:03:18.923Z"
}
```

### **1.2 Get Current User (Requires Auth)**
```bash
# First, you need to get a token from the frontend
# Visit: http://localhost:3000/auth/sign-in
# After Google OAuth login, check browser localStorage for 'cedo_token'

# Then use the token:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## **📝 Step 2: Draft Management Testing**

### **2.1 Create New Draft**
```bash
curl -X POST http://localhost:5000/api/proposals/drafts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "organizationName": "Test Organization",
    "contactEmail": "test@example.com",
    "eventType": "school-based"
  }'
```

### **2.2 Get Draft by ID**
```bash
curl -X GET http://localhost:5000/api/proposals/drafts/DRAFT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **2.3 Update Draft Section**
```bash
curl -X PATCH http://localhost:5000/api/proposals/drafts/DRAFT_ID_HERE/organization \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "organizationName": "Updated Organization",
    "contactEmail": "updated@example.com",
    "contactName": "John Doe",
    "contactPhone": "+1234567890",
    "organizationType": "school-based"
  }'
```

### **2.4 List All Drafts**
```bash
curl -X GET http://localhost:5000/api/proposals/drafts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## **📋 Step 3: Available Endpoints**

### **✅ Working Endpoints:**
- `GET /api/health` - Health check
- `POST /api/proposals/drafts` - Create draft
- `GET /api/proposals/drafts/:id` - Get draft
- `PATCH /api/proposals/drafts/:id/:section` - Update draft section
- `GET /api/proposals/drafts` - List all drafts
- `DELETE /api/proposals/drafts/:id` - Delete draft

### **❌ Missing Endpoints (Need Implementation):**
- `POST /api/organizations` - Create organization
- `POST /api/reports/accomplishment` - Submit report
- `POST /api/proposals` - Create proposal (different from draft)
- `GET /api/proposals/:id` - Get proposal

---

## **🔧 Step 4: Fix the 404 Issues**

### **Issue 1: Missing Organization Endpoint**
The `/api/organizations` endpoint doesn't exist. You need to:

1. **Check if it's implemented:**
```bash
curl -X GET http://localhost:5000/api/organizations
```

2. **If not implemented, create it in `backend/routes/organizations.js`**

### **Issue 2: Missing Reports Endpoint**
The `/api/reports/accomplishment` endpoint doesn't exist. You need to:

1. **Check if it's implemented:**
```bash
curl -X GET http://localhost:5000/api/reports
```

2. **If not implemented, create it in `backend/routes/reports.js`**

### **Issue 3: Authentication Token**
You need a valid JWT token. To get one:

1. **Start the frontend:**
```bash
cd frontend
npm run dev
```

2. **Visit the sign-in page:**
   - Go to `http://localhost:3000/auth/sign-in`
   - Sign in with Google OAuth
   - Check browser localStorage for `cedo_token`

3. **Use the token in your requests:**
```bash
export TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## **📊 Step 5: Test Results Summary**

### **✅ Working:**
- Health check endpoint
- Draft creation and management
- Basic CRUD operations for drafts

### **❌ Needs Fix:**
- Authentication token setup
- Missing organization endpoints
- Missing reporting endpoints
- Missing proposal endpoints (separate from drafts)

---

## **🚀 Step 6: Next Actions**

1. **Get a valid authentication token**
2. **Implement missing endpoints** (organizations, reports, proposals)
3. **Update the Postman collection** with correct endpoints
4. **Re-run the tests** with proper authentication

---

## **🔍 Debugging Tips**

### **Check Backend Logs:**
```bash
# In the backend directory
npm run dev
# Watch the console for request logs
```

### **Check Frontend Network Tab:**
- Open browser dev tools
- Go to Network tab
- Make requests and check the actual endpoints being called

### **Test Individual Endpoints:**
```bash
# Test each endpoint individually
curl -X GET http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/proposals/drafts
# etc.
```

---

## **📝 Summary**

The main issues are:
1. **Missing authentication token** - Need to get a valid JWT token
2. **Missing API endpoints** - Some endpoints don't exist yet
3. **Incorrect endpoint paths** - Some paths may be different

**Next step:** Get a valid authentication token and test the working endpoints first, then implement the missing ones. 