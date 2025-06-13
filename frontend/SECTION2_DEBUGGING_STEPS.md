# Section 2 Form Debugging Steps

## Issue
Getting "Missing required fields" error from backend even after filling the form.

## Debugging Steps

### Step 1: Test Simple HTML Form
1. Open `debug-section2-form.html` in your browser
2. Click "Fill Test Data"
3. Click "Test FormData Extraction" 
4. If this works, the issue is in the React component

### Step 2: Test React Form Data Extraction
1. Go to Section 2 in the app
2. Click "Fill Test Data" (blue button)
3. Click "Debug Form Fields" (yellow button)
4. Check console logs - are the values being extracted correctly?

### Step 3: Test API Data Flow
1. Fill the form manually or use "Fill Test Data"
2. Click "Test Database Save" (purple button)
3. Check console logs:
   - Are the values being extracted from the form?
   - Are they being sent to the API correctly?
   - What does the backend receive?

### Step 4: Check Browser Network Tab
1. Open browser DevTools → Network tab
2. Fill the form and submit
3. Look for the POST request to `/api/proposals/section2`
4. Check the request payload - are the values there?

### Step 5: Check Backend Logs
1. Look at the backend console logs
2. Should see debug output like:
   ```
   📥 Backend: Received Section 2 organization data: {...}
   🔍 Backend: Required field values:
   ```

## Common Issues & Solutions

### Issue: Form fields are empty in FormData extraction
**Solution**: Check if inputs have correct `name` attributes:
```html
<input name="organizationName" ... />
<input name="contactName" ... />
<input name="contactEmail" ... />
```

### Issue: Values are being sent but backend receives empty strings
**Solution**: Check the API mapping in `proposalAPI.js`:
```javascript
formData.append('title', proposalData.organizationName);
formData.append('contactPerson', proposalData.contactName);
formData.append('contactEmail', proposalData.contactEmail);
```

### Issue: Backend validation is too strict
**Solution**: Check validation logic in `backend/routes/proposals.js`:
```javascript
if (!title || !contactPerson || !contactEmail) {
  return res.status(400).json({
    error: 'Missing required fields',
    required: ['title', 'contactPerson', 'contactEmail']
  });
}
```

## Debug Console Commands

### Test form extraction in browser console:
```javascript
const form = document.querySelector('#section2-form');
const formData = new FormData(form);
console.log('organizationName:', formData.get('organizationName'));
console.log('contactName:', formData.get('contactName'));
console.log('contactEmail:', formData.get('contactEmail'));
```

### Test API call directly:
```javascript
fetch('http://localhost:5000/api/proposals/section2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Org',
    contactPerson: 'Test Person',
    contactEmail: 'test@example.com',
    description: 'Test description',
    category: 'partnership',
    organizationType: 'school-based',
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    location: 'Test Location',
    budget: '1000',
    objectives: 'Test objectives',
    volunteersNeeded: '5',
    status: 'draft'
  })
}).then(r => r.json()).then(console.log);
```

## Expected Console Output

### Working Form Data Extraction:
```
🔍 === FORM DEBUGGING ===
Raw form field values:
organizationName: "Test Organization"
contactName: "John Doe"
contactEmail: "john@example.com"
✅ All required fields have values
```

### Working API Call:
```
🔍 API: Raw proposalData received: {organizationName: "Test Org", ...}
🔄 API: Field mapping:
  organizationName → title: "Test Organization" → "Test Organization"
✅ API Success response: {id: 123, message: "Section 2 data saved successfully"}
```

### Working Backend:
```
📥 Backend: Received Section 2 organization data: {title: "Test Organization", ...}
🔍 Backend: Required field values:
  title: "Test Organization" (type: string, length: 17)
✅ MySQL Section 2 operation completed successfully
``` 