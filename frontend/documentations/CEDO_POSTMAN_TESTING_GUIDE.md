# 🧪 CEDO Postman Testing Guide

## 📋 **Prerequisites**

### **1. Environment Setup**
- **Backend URL**: `http://localhost:5000`
- **Frontend URL**: `http://localhost:3000`
- **Postman Collection**: Import the provided collection

### **2. Required Headers**
```
Content-Type: application/json
Accept: application/json
```

---

## 🔐 **Authentication Testing**

### **1. User Registration**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPassword123!",
  "role": "student"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

### **2. User Login**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

### **3. Google OAuth (Optional)**
```http
GET http://localhost:5000/api/auth/google
```

---

## 🏥 **Health & Configuration Testing**

### **1. Backend Health Check**
```http
GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-26T14:48:25.498Z",
  "env": "development",
  "mysql": "connected",
  "mongodb": "connected"
}
```

### **2. Frontend Configuration**
```http
GET http://localhost:5000/api/config
```

**Expected Response:**
```json
{
  "recaptchaSiteKey": "6LcTTzUrAAAAAHd6nbv15aXhrdoZgkywzPwyrQch",
  "timestamp": 1753541322917
}
```

### **3. Frontend Health Check**
```http
GET http://localhost:3000/api/health
```

---

## 🎯 **Route Testing (Frontend)**

### **1. Public Routes (No Auth Required)**
```http
GET http://localhost:3000/
GET http://localhost:3000/auth/sign-in
GET http://localhost:3000/auth/sign-up
GET http://localhost:3000/auth/forgot-password
```

### **2. Protected Routes (Auth Required)**

#### **Student Dashboard**
```http
GET http://localhost:3000/main/student-dashboard
Cookie: cedo_token=YOUR_JWT_TOKEN
```

#### **Admin Dashboard**
```http
GET http://localhost:3000/main/admin-dashboard
Cookie: cedo_token=YOUR_JWT_TOKEN
```

#### **Main Route**
```http
GET http://localhost:3000/main
Cookie: cedo_token=YOUR_JWT_TOKEN
```

### **3. API Routes**
```http
GET http://localhost:3000/api/user
Cookie: cedo_token=YOUR_JWT_TOKEN
```

---

## 📊 **Dashboard API Testing**

### **1. Get Dashboard Stats**
```http
GET http://localhost:5000/api/dashboard/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "sdpCredits": {
      "totalEarned": 12,
      "pending": 3,
      "totalRequired": 36
    },
    "events": {
      "upcoming": 2,
      "total": 8,
      "approved": 5,
      "pending": 2,
      "draft": 1,
      "rejected": 0
    },
    "progress": {
      "overallPercentage": 33,
      "overallText": "12 of 36 credits",
      "categories": {
        "leadership": { "current": 4, "total": 12, "percentage": 33 },
        "communityService": { "current": 5, "total": 12, "percentage": 42 },
        "professionalDevelopment": { "current": 3, "total": 12, "percentage": 25 }
      }
    }
  }
}
```

### **2. Get Recent Events**
```http
GET http://localhost:5000/api/dashboard/recent-events?limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 **Proposal Management Testing**

### **1. Create Proposal**
```http
POST http://localhost:5000/api/proposals
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "organization_name": "Test Organization",
  "organization_type": "school",
  "event_name": "Test Event",
  "event_venue": "Test Venue",
  "event_start_date": "2024-02-01",
  "event_end_date": "2024-02-01",
  "event_start_time": "09:00",
  "event_end_time": "17:00",
  "event_mode": "in-person",
  "school_event_type": "workshop",
  "school_return_service_credit": 3,
  "objectives": "Test objectives",
  "budget": 1000
}
```

### **2. Get User Proposals**
```http
GET http://localhost:5000/api/proposals/user
Authorization: Bearer YOUR_JWT_TOKEN
```

### **3. Get All Proposals (Admin)**
```http
GET http://localhost:5000/api/proposals
Authorization: Bearer YOUR_JWT_TOKEN
```

### **4. Update Proposal**
```http
PUT http://localhost:5000/api/proposals/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "proposal_status": "approved",
  "reviewed_by_admin_id": 1
}
```

---

## 🔍 **Error Testing**

### **1. Invalid Token**
```http
GET http://localhost:3000/main/student-dashboard
Cookie: cedo_token=invalid_token
```

**Expected Response:** Redirect to `/auth/sign-in`

### **2. Expired Token**
```http
GET http://localhost:3000/main/student-dashboard
Cookie: cedo_token=expired_token_here
```

**Expected Response:** Redirect to `/auth/sign-in`

### **3. Missing Token**
```http
GET http://localhost:3000/main/student-dashboard
```

**Expected Response:** Redirect to `/auth/sign-in`

### **4. Wrong Role Access**
```http
GET http://localhost:3000/main/admin-dashboard
Cookie: cedo_token=student_token_here
```

**Expected Response:** Redirect to `/main/student-dashboard`

---

## 📋 **Postman Collection Variables**

### **Environment Variables**
```json
{
  "base_url": "http://localhost:5000",
  "frontend_url": "http://localhost:3000",
  "auth_token": "",
  "user_id": "",
  "user_role": ""
}
```

### **Pre-request Scripts**

#### **For Login Requests:**
```javascript
// Set token after successful login
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.token) {
        pm.environment.set("auth_token", response.token);
        pm.environment.set("user_id", response.user.id);
        pm.environment.set("user_role", response.user.role);
    }
}
```

#### **For Protected Routes:**
```javascript
// Add auth header automatically
const token = pm.environment.get("auth_token");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: `Bearer ${token}`
    });
}
```

---

## 🚀 **Testing Workflow**

### **1. Setup Phase**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Import Postman collection
4. Set environment variables

### **2. Authentication Phase**
1. Test registration
2. Test login
3. Verify token is stored

### **3. Route Testing Phase**
1. Test public routes (no auth)
2. Test protected routes (with auth)
3. Test role-based access
4. Test error scenarios

### **4. API Testing Phase**
1. Test dashboard APIs
2. Test proposal management
3. Test error handling

### **5. Integration Testing Phase**
1. Test complete user flows
2. Test edge cases
3. Test performance

---

## 📊 **Expected Test Results**

### **✅ Success Scenarios**
- All health checks return 200
- Authentication works correctly
- Routes redirect properly based on auth/role
- APIs return correct data
- Error handling works as expected

### **❌ Failure Scenarios**
- 404 errors on valid routes
- Authentication bypass
- Wrong role access
- API errors without proper handling

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **404 Errors**: Check if middleware caching is disabled
2. **Auth Issues**: Verify token format and expiration
3. **CORS Issues**: Check backend CORS configuration
4. **Database Issues**: Verify MySQL and MongoDB connections

### **Debug Commands:**
```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend routes
curl http://localhost:3000/main/student-dashboard

# Check middleware logs
# Look for "Middleware Cookie Debug" messages in frontend console
```

---

## 📞 **Support**

If you encounter issues:
1. Check the middleware logs in the frontend console
2. Verify all services are running
3. Check the comprehensive fix summary document
4. Test with the provided Postman collection

The middleware caching fix should resolve the 404 issues you were experiencing! 