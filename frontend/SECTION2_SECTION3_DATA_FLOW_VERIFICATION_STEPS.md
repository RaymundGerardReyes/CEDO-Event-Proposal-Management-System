# SECTION 2 → SECTION 3 DATA FLOW VERIFICATION STEPS

## 🔧 **Critical Fixes Applied**

### 1. **Authentication Token Fix** ✅
- Fixed Section 3 API calls to use proper token (`cedo_token` from cookies)
- Replaced hardcoded `localStorage.getItem('token')` with proper token retrieval

### 2. **State Machine Enhancement** ✅
- Enhanced initial state detection to allow Section 3 access with organization data
- Added fallback logic for missing currentSection in localStorage data
- Improved data recovery mechanisms

### 3. **Enhanced Debug Logging** ✅
- Added comprehensive logging for data source scoring
- Enhanced organization data preservation tracking
- Added critical state machine initialization debugging

## 🧪 **Verification Steps**

### **Step 1: Clear Environment**
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **Step 2: Complete Normal Flow**
1. **Navigate to**: `http://localhost:3002/student-dashboard/submit-event`
2. **Check Console**: Should see initial state logs
3. **Start New Proposal**: Click "Create New Proposal"
4. **Select Event Type**: Choose "School-based event"
5. **Fill Section 2**: 
   - Organization Name: "Test University"
   - Contact Name: "Test Person"
   - Contact Email: "test@example.com"
6. **Click "Save & Continue"**

### **Step 3: Monitor Console Logs**
**Expected Console Output After Section 2 Save:**
```
✅ Section 2 data saved successfully
🔧 CALLING onChange with complete parent state update...
✅ MySQL: New proposal created with ID: [number]
🔧 Organization data in initial: {organizationName: "Test University", contactEmail: "test@example.com"}
✅ ORGANIZATION DATA FOUND: Allowing direct access to Section 3
🏫 RENDERING Section3_SchoolEvent
```

**❌ If you see this instead:**
```
🚨 SAFE START: No meaningful form data - starting at Overview
organizationName: undefined
contactEmail: undefined
```

### **Step 4: Verify Section 3 Debug Panel**
**Expected Section 3 Debug Panel Status:**
- **Organization Name**: ✅ PRESENT (green) - "Test University"
- **Contact Email**: ✅ PRESENT (green) - "test@example.com"
- **Proposal ID**: ✅ PRESENT (green) - [number]
- **Recovery Attempted**: false (not needed)
- **LocalStorage Data Available**: true

### **Step 5: Test Authentication Recovery**
1. **In Section 3**, click "🔄 Force Recovery" button
2. **Check Console**: Should see successful API calls
3. **Expected**: No 401 authentication errors

### **Step 6: Test Data Persistence**
1. **Fill some Section 3 fields** (event name, venue, etc.)
2. **Refresh the page** (F5)
3. **Check**: Should land directly in Section 3 with all data preserved

### **Step 7: Test Direct Navigation**
1. **Navigate directly to**: `http://localhost:3002/student-dashboard/submit-event`
2. **Check**: Should detect existing data and go to Section 3
3. **Verify**: All organization data is present

## 🔍 **Debugging Commands**

### **Check localStorage Data:**
```javascript
// Check all possible localStorage keys
['eventProposalFormData', 'cedoFormData', 'formData', 'submitEventFormData'].forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`${key}:`, {
        organizationName: parsed.organizationName,
        contactEmail: parsed.contactEmail,
        currentSection: parsed.currentSection,
        totalKeys: Object.keys(parsed).length
      });
    } catch (e) {
      console.log(`${key}: Invalid JSON`);
    }
  } else {
    console.log(`${key}: Not found`);
  }
});
```

### **Check Authentication:**
```javascript
// Test authentication token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
    if (cookieValue) return cookieValue.split('=')[1];
    return localStorage.getItem('cedo_token') || localStorage.getItem('token');
  }
  return null;
};

console.log('Auth token:', getAuthToken() ? 'Present' : 'Missing');
```

### **Test API Connection:**
```javascript
// Test backend API
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(data => console.log('Backend status:', data))
  .catch(err => console.error('Backend error:', err));
```

## 🚨 **Common Issues & Solutions**

### **Issue: 401 Authentication Error**
**Symptoms**: `GET /api/users/me 401 (Not Found)`
**Solution**: 
1. Check if user is logged in
2. Verify token in cookies/localStorage
3. Try logging out and back in

### **Issue: State Machine Resets to Overview**
**Symptoms**: `🚨 SAFE START: No meaningful form data`
**Solution**:
1. Check localStorage data using debug commands above
2. Verify Section 2 completed successfully
3. Check console for data preservation logs

### **Issue: Section 3 Shows "MISSING" Organization Data**
**Symptoms**: Red indicators in debug panel
**Solution**:
1. Click "🔄 Force Recovery" in Section 3
2. Check network tab for API call success
3. Verify database has proposal with correct ID

### **Issue: Data Not Persisting Between Sessions**
**Symptoms**: Refresh loses all data
**Solution**:
1. Check browser localStorage in DevTools
2. Verify auto-save is working (check console)
3. Check for JavaScript errors blocking saves

## ✅ **Success Criteria**

The data flow is working correctly if:

1. ✅ **Section 2 saves successfully** without errors
2. ✅ **Section 3 loads with organization data** present
3. ✅ **Debug panel shows all green indicators**
4. ✅ **No 401 authentication errors** in console
5. ✅ **Data persists through page refreshes**
6. ✅ **Direct navigation to Section 3 works** with saved data
7. ✅ **Recovery mechanism works** when needed

## 🔄 **If Issues Persist**

1. **Run the comprehensive test script**:
   ```javascript
   // Copy and paste from test-section2-section3-data-flow.js
   ```

2. **Check backend logs** for any errors

3. **Verify MySQL database** has the proposal data

4. **Check environment configuration**:
   - Frontend: `http://localhost:3002`
   - Backend: `http://localhost:5000`
   - MySQL: `localhost:3306`

---

**Status**: Ready for testing  
**Expected Result**: Complete Section 2 → Section 3 data flow functionality  
**Test Duration**: ~5 minutes 