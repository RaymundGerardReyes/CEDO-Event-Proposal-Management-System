# 🔧 Section2_OrgInfo Debug Guide

## ✅ Fixed Issues

### 1. **"stateToProgress is not defined" Error - FIXED**
**Problem:** The debug console was trying to access `stateToProgress` variable outside its scope.

**Solution:** Updated the debug console to define its own `stateToProgressMap` variable locally.

### 2. **Enhanced Debug Console - IMPROVED**
The "Log Full State" button now provides comprehensive debugging without scope errors.

## 🧪 Testing Section2_OrgInfo Functionality

### **Current Status:** 
You've successfully navigated to the Organization Information section! The form is displaying correctly with all required fields.

### **Expected Behavior:**
```
✅ Organization Name field should accept input
✅ Radio buttons (School-based/Community-based) should be selectable  
✅ Contact fields should work normally
✅ Previous button should go back to Event Type Selection
✅ Save & Continue should validate and proceed
```

## 🔍 Debugging Steps for Current Issues

### **Step 1: Check Console Logs**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for these debug messages when interacting with the form:

```
📝 Section2 Input Change: { name: "organizationName", value: "..." }
📋 Current localFormData before change: {...}
📤 Sending minimal update to parent (no currentSection overwrite): {...}
```

### **Step 2: Test Form Input**
1. **Type in Organization Name field** - Should see console logs
2. **Select radio button** - Should see organization type logs
3. **Fill contact fields** - Should see input change logs

If you don't see these logs, there's an event handler issue.

### **Step 3: Test Enhanced Debug Console**
1. **Click the red bug icon** (🐛) to open debug console
2. **Click "🔍 Log Full State"** - Should show comprehensive analysis
3. **Click "📋 Analyze Form Fields"** - Should show field completion status

### **Step 4: Test Quick Debugging**
Copy this into browser console:
```javascript
// Test form update directly
window.__SUBMIT_EVENT_DEBUG__.handlers.handleFormUpdate({
  organizationName: "Test Organization",
  organizationTypes: ["school-based"],
  contactName: "Test User",
  contactEmail: "test@example.com"
})
```

## 🎯 Specific Troubleshooting

### **Issue: Form fields not updating when typing**

**Diagnosis:**
```javascript
// Check if event handlers are working
console.log('onFormUpdate type:', typeof window.__SUBMIT_EVENT_DEBUG__.handlers.handleFormUpdate)
```

**Expected:** Should show `function`

**Solutions:**
1. Refresh the page and try again
2. Check console for JavaScript errors
3. Verify you're on the correct section

### **Issue: Radio buttons not working**

**Diagnosis:** Look for this log when clicking radio buttons:
```
=== ORGANIZATION TYPE SELECTION DEBUG ===
Selected value: school-based
```

**Solutions:**
1. Click directly on radio button circles, not just labels
2. Check console for selection logs
3. Verify RadioGroup component is rendering

### **Issue: Save & Continue button not working**

**Diagnosis:** Check validation logs:
```
=== SECTION2 HANDLENEXT DEBUG ===
Local form data before sync: {...}
Organization types before sync: [...]
```

**Common Causes:**
1. **Missing required fields** - Fill all required fields (marked with *)
2. **Validation errors** - Check console for validation messages
3. **Organization type not selected** - Must select School-based or Community-based

### **Issue: Previous button not working**

**Diagnosis:** Should navigate back to Event Type Selection.

**Solutions:**
1. Check if button is clickable (not disabled)
2. Look for navigation logs in console
3. Verify state machine transitions

## 🚀 Quick Test Commands

### **Test 1: Fill School Organization**
```javascript
window.SubmitEventDebug.quickTest("school")
```

### **Test 2: Fill Community Organization**  
```javascript
window.SubmitEventDebug.quickTest("community")
```

### **Test 3: Comprehensive Analysis**
```javascript
window.SubmitEventDebug.analyzeFlow()
```

## 🎭 Manual Testing Scenarios

### **Scenario 1: New School Event User**
1. **Organization Name:** "School Science Club"
2. **Type:** Select "School-based" 
3. **Contact Person:** "Dr. Smith"
4. **Email:** "smith@school.edu"
5. **Click:** Save & Continue
6. **Expected:** Navigate to School Event section

### **Scenario 2: New Community Event User**
1. **Organization Name:** "Community Center"
2. **Type:** Select "Community-based"
3. **Contact Person:** "Jane Doe" 
4. **Email:** "jane@community.org"
5. **Click:** Save & Continue
6. **Expected:** Navigate to Community Event section

### **Scenario 3: Test Validation**
1. **Leave all fields empty**
2. **Click:** Save & Continue
3. **Expected:** Show validation errors for required fields

## 📊 Debug Console Features

### **Enhanced "Log Full State" now includes:**
- ✅ 13 comprehensive analysis categories
- ✅ Automatic issue detection
- ✅ Performance monitoring
- ✅ Data consistency checking
- ✅ Export functionality for bug reports

### **Additional Debug Actions:**
- **🧪 Test Transitions** - Preview state machine transitions
- **📋 Analyze Form Fields** - Table view of field completion  
- **⚡ Performance Check** - Browser performance metrics
- **🎭 Simulate Scenarios** - Test with sample data

## 🆘 If Still Not Working

### **Emergency Reset:**
```javascript
// Clear all data and reload
localStorage.removeItem('eventProposalFormData')
window.location.reload()
```

### **Check for Critical Errors:**
1. Look for red error messages in console
2. Check Network tab for failed requests
3. Verify React components are loading properly

### **Report Bug with Debug Data:**
1. Click "🔍 Log Full State"
2. Click "📤 Export Debug Report" 
3. Copy the JSON output
4. Include current behavior vs expected behavior

## 🎉 Success Indicators

### **Form Working Correctly:**
- ✅ Typing in fields shows console logs
- ✅ Radio button selection shows logs  
- ✅ Debug console shows current data
- ✅ Previous/Next navigation works
- ✅ Data persists between sections

### **Ready to Proceed:**
- ✅ Organization name filled
- ✅ Organization type selected
- ✅ Contact person and email filled
- ✅ No validation errors
- ✅ Save & Continue navigates to next section

The Section2_OrgInfo component is now properly integrated with comprehensive debugging. The enhanced debug console should help identify any remaining issues quickly! 