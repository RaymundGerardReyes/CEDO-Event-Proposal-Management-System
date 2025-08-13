# 🔐 **How to Get Authentication Token for CEDO API Tests**

## **📋 Quick Steps**

### **Step 1: Start Frontend Server**
```bash
cd frontend
npm run dev
```

### **Step 2: Open Browser**
Visit: `http://localhost:3000/auth/sign-in`

### **Step 3: Sign In**
- Click "Sign in with Google"
- Complete Google OAuth process
- You should be redirected to the dashboard

### **Step 4: Get Token from Browser**
1. **Open Developer Tools** (F12)
2. **Go to Application tab** (or Storage)
3. **Click on localStorage** (left sidebar)
4. **Look for these keys:**
   - `cedo_token`
   - `token`
   - `auth_token`
   - `jwt_token`
5. **Copy the token value**

### **Step 5: Update Environment File**
```bash
# Edit cedo-api-environment.json
# Replace the empty token value with your copied token
```

### **Step 6: Run Tests**
```bash
newman run "cedo-api-tests.postman_collection.json" -e "cedo-api-environment.json" --reporters cli
```

---

## **🔍 Alternative Methods**

### **Method 1: Check Network Tab**
1. Open DevTools → Network tab
2. Make any authenticated request
3. Look for the Authorization header in the request

### **Method 2: Check Console**
1. Open DevTools → Console tab
2. Type: `localStorage.getItem('cedo_token')`
3. Copy the returned value

### **Method 3: Check Application Storage**
1. Open DevTools → Application
2. Go to Storage → Local Storage
3. Look for your domain (localhost:3000)
4. Find the token key

---

## **⚠️ Troubleshooting**

### **No Token Found?**
- Make sure you're signed in
- Check if the token has a different name
- Try refreshing the page
- Check if token is in sessionStorage instead

### **Token Expired?**
- Sign out and sign back in
- Check if there's a refresh token
- Generate a new token

### **Still Having Issues?**
1. Check browser console for errors
2. Verify frontend is running on port 3000
3. Check if backend is running on port 5000
4. Try a different browser

---

## **📝 Example Token Format**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImVtYWlsIjoiZXhhbXBsZUBnbWFpbC5jb20iLCJpYXQiOjE3MzI1NjQ4MDAsImV4cCI6MTczMjU2ODQwMH0.example_signature
```

---

## **✅ Success Indicators**
- Token starts with `eyJ`
- Token is long (usually 200+ characters)
- Tests pass with 200 status codes
- No more 401 Unauthorized errors

---

## **🚀 Quick Test**
After getting the token, test it:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": 17,
  "email": "example@gmail.com",
  "name": "Example User"
}
``` 