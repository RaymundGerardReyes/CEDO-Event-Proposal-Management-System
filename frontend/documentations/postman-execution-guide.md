# 🚀 **CEDO API Postman Testing - Complete Execution Guide**

## **📋 File Overview**

You now have these files ready for testing:
- ✅ `cedo-api-environment.json` - Environment variables
- ✅ `cedo-api-tests.postman_collection.json` - Test collection
- ✅ `run-api-tests.sh` - Test runner script
- ✅ `manual-testing-guide.md` - Manual testing instructions

---

## **🔧 Step 1: Verify Backend Server**

First, ensure your backend is running:

```bash
# Check if backend is running
curl -X GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2025-07-26T01:03:18.923Z"}
```

---

## **🔐 Step 2: Get Authentication Token**

### **Method 1: Frontend OAuth (Recommended)**

1. **Start the frontend server:**
```bash
cd frontend
npm run dev
```

2. **Open browser and navigate to:**
   ```
   http://localhost:3000/auth/sign-in
   ```

3. **Sign in with Google OAuth**

4. **Get the token from browser:**
   - Open Developer Tools (F12)
   - Go to Application/Storage tab
   - Look for `localStorage`
   - Find the key `cedo_token` or similar
   - Copy the token value

### **Method 2: Direct API Call (If available)**

```bash
# If you have credentials, try direct login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

---

## **📝 Step 3: Update Environment Variables**

### **Option A: Using Postman Desktop App**

1. **Import the collection:**
   - Open Postman
   - Click "Import"
   - Select `cedo-api-tests.postman_collection.json`

2. **Import the environment:**
   - Click "Import" again
   - Select `cedo-api-environment.json`

3. **Set the token:**
   - Click the environment dropdown (top right)
   - Select "CEDO API Environment"
   - Click the eye icon to edit
   - Set the `token` variable to your JWT token
   - Click "Save"

### **Option B: Using Newman (Command Line)**

1. **Update the environment file:**
```bash
# Edit cedo-api-environment.json
# Replace the empty token value with your actual token
```

2. **Or set token via command line:**
```bash
export TOKEN="your_jwt_token_here"
```

---

## **🧪 Step 4: Run the Tests**

### **Method 1: Using Newman (Recommended)**

```bash
# Make sure you're in the frontend directory
cd frontend

# Run all tests
newman run "cedo-api-tests.postman_collection.json" \
  -e "cedo-api-environment.json" \
  --reporters cli,json \
  --reporter-json-export "test-results/api-test-results.json"
```

### **Method 2: Using the Script**

```bash
# Make the script executable (if not already)
chmod +x run-api-tests.sh

# Run the tests
./run-api-tests.sh
```

### **Method 3: Individual Test Execution**

```bash
# Test health check only
newman run "cedo-api-tests.postman_collection.json" \
  -e "cedo-api-environment.json" \
  --folder "🔐 Authentication" \
  --reporters cli

# Test draft management only
newman run "cedo-api-tests.postman_collection.json" \
  -e "cedo-api-environment.json" \
  --folder "📝 Draft Management" \
  --reporters cli
```

---

## **📊 Step 5: Expected Test Results**

### **✅ Should Pass:**
- Health Check (200 OK)
- Create New Draft (200 OK)
- List All Drafts (200 OK)
- Non-existent Draft (404 Not Found)

### **❌ May Fail (Expected):**
- Get Current User (401 Unauthorized) - If no valid token
- Update Draft Section (404 Not Found) - If endpoint not implemented
- Invalid Token (401 Unauthorized) - Should fail with invalid token

---

## **🔍 Step 6: Troubleshooting**

### **Issue 1: "Newman not found"**
```bash
# Install Newman globally
npm install -g newman
```

### **Issue 2: "Collection file not found"**
```bash
# Check if files exist
ls -la *.json

# If missing, recreate them using the provided content
```

### **Issue 3: "401 Unauthorized"**
```bash
# Check if token is valid
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# If fails, get a new token from frontend
```

### **Issue 4: "404 Not Found"**
```bash
# Check if backend is running
curl -X GET http://localhost:5000/api/health

# Check if endpoint exists
curl -X GET http://localhost:5000/api/proposals/drafts
```

---

## **📈 Step 7: Advanced Testing**

### **Custom Test Data**

Create a custom environment for different test scenarios:

```json
{
  "name": "CEDO Test Data",
  "values": [
    {
      "key": "testOrganizationName",
      "value": "Test Organization",
      "enabled": true
    },
    {
      "key": "testContactEmail",
      "value": "test@example.com",
      "enabled": true
    }
  ]
}
```

### **Performance Testing**

```bash
# Run with iterations
newman run "cedo-api-tests.postman_collection.json" \
  -e "cedo-api-environment.json" \
  --iteration-count 10 \
  --reporters cli,json \
  --reporter-json-export "performance-results.json"
```

### **Environment-Specific Testing**

```bash
# Test against different environments
newman run "cedo-api-tests.postman_collection.json" \
  -e "cedo-api-environment.json" \
  --env-var "baseUrl=http://staging.example.com" \
  --reporters cli
```

---

## **📋 Step 8: Test Results Analysis**

### **Understanding the Output**

```bash
# Newman output example:
┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │               14 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │               14 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │               14 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │               27 │               17 │
├─────────────────────────┴──────────────────┴──────────────────┤
│ total run duration: 1442ms                                    │
└───────────────────────────────────────────────────────────────┘
```

### **Key Metrics:**
- **executed**: Number of requests that ran
- **failed**: Number of requests that failed
- **assertions**: Number of test assertions
- **duration**: Total test execution time

---

## **🚀 Step 9: Next Steps After Testing**

### **If Tests Pass:**
1. ✅ API is working correctly
2. ✅ All endpoints are functional
3. ✅ Authentication is working

### **If Tests Fail:**
1. 🔧 Fix authentication issues
2. 🔧 Implement missing endpoints
3. 🔧 Update endpoint paths
4. 🔧 Re-run tests

### **Continuous Testing:**
```bash
# Add to your CI/CD pipeline
npm install -g newman
newman run "cedo-api-tests.postman_collection.json" \
  -e "cedo-api-environment.json" \
  --reporters cli,json \
  --reporter-json-export "test-results.json"
```

---

## **📞 Support**

If you encounter issues:

1. **Check the manual testing guide:** `manual-testing-guide.md`
2. **Verify backend is running:** `curl http://localhost:5000/api/health`
3. **Check token validity:** Use the token in a simple curl request
4. **Review Newman documentation:** https://learning.postman.com/docs/running-collections/using-newman-cli/

---

## **✅ Success Checklist**

- [ ] Backend server is running
- [ ] Frontend server is running (for OAuth)
- [ ] Valid JWT token obtained
- [ ] Environment file updated with token
- [ ] Newman installed globally
- [ ] Test collection imported
- [ ] Tests executed successfully
- [ ] Results analyzed
- [ ] Issues identified and documented

**🎉 You're now ready to test your CEDO API comprehensively!** 