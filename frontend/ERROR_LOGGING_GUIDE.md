# Error Logging Best Practices

## ❌ Problem: Empty `{}` Error Objects

When you use `console.error('Message:', error)` with Error objects, they often show as empty `{}` in the console because Error objects don't serialize well.

### Bad Examples:
```javascript
// ❌ Shows: "Router hooks error: {}"
console.error('Router hooks error:', error)

// ❌ Shows: "Failed to load: {}"
console.error('Failed to load:', err)
```

## ✅ Solutions

### Option 1: Use safeConsoleError utility
```javascript
import { safeConsoleError } from '@/utils/error-logging-enhanced';

// ✅ Shows detailed error information
safeConsoleError('Router hooks error:', error);
```

### Option 2: Manual detailed logging
```javascript
// ✅ Shows complete error details
const errorDetails = {
    message: error?.message || 'Unknown error',
    name: error?.name || 'Error',
    stack: error?.stack || 'No stack trace',
    type: typeof error
};

console.error('Router hooks error:', errorDetails);
console.error('Raw error object:', error);
```

### Option 3: Use existing utilities
```javascript
import { logError } from '@/utils/error-logging-enhanced';

// ✅ Comprehensive error logging
logError('Router hooks error', error, 'RouterStabilizer');
```

## 🔍 Quick Fix Pattern

Replace this pattern:
```javascript
} catch (error) {
    console.error('Some message:', error)  // ❌ Shows {}
}
```

With this:
```javascript
} catch (error) {
    console.error('Some message:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
    });
    console.error('Raw error:', error);
}
```

## 📋 Files Already Fixed

- ✅ `frontend/src/components/RouterStabilizer.jsx`
- ✅ `frontend/src/app/student-dashboard/submit-event/[draftId]/reporting/page.jsx`
- ✅ `frontend/src/app/student-dashboard/submit-event/[draftId]/reporting/hooks/useReportingData.js`

## 🎯 Priority Files to Fix

High-impact files that should be updated:
- `frontend/src/components/dashboard/admin/proposal-table.jsx`
- `frontend/src/app/admin-dashboard/reports/page.jsx`
- `frontend/src/contexts/NotificationContext.jsx`
- `frontend/src/app/student-dashboard/submit-event/[draftId]/components/SubmitEventFlow.jsx`








