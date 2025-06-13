# 🔧 Google Sign-In Troubleshooting Guide

## Problem: "Another Google Sign-In operation is already in progress"

This error occurs when Google Sign-In gets stuck due to **concurrent operations** or **incomplete cleanup**. Here's how to fix it:

---

## 🚨 **IMMEDIATE SOLUTIONS** (Choose One)

### **Option 1: Emergency Reset Button**
If you see the error dialog:
1. Look for the **🔧 Force Reset** button in the error dialog
2. Click it to automatically clean up the stuck operation
3. Try signing in again

### **Option 2: Browser Console Cleanup**
1. **Open browser developer tools**: Press `F12` or `Ctrl+Shift+I`
2. **Go to Console tab**
3. **Copy and paste this script**:

```javascript
// 🔧 EMERGENCY GOOGLE AUTH CLEANUP
console.log('🔧 Cleaning up Google Sign-In...');

// Clear Google operations
if (window.google?.accounts?.id) {
  window.google.accounts.id.cancel();
}

// Clear localStorage
['eventProposalFormData', 'cedoFormData', 'formData', 'submitEventFormData', 'cedo_user'].forEach(key => {
  localStorage.removeItem(key);
});

// Clear cookies
document.cookie = "cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

// Clear Google buttons
document.querySelectorAll('.g_id_signin, [data-client_id]').forEach(el => el.innerHTML = '');

console.log('✅ Cleanup complete! Refresh the page.');
window.location.reload();
```

4. **Press Enter** to run the script
5. **Page will refresh automatically**

### **Option 3: Manual Reset**
1. **Close all browser tabs** with the application
2. **Clear browser data**:
   - Press `Ctrl+Shift+Del` (Windows) or `Cmd+Shift+Del` (Mac)
   - Select "Cookies and other site data" and "Cached images and files"
   - Choose "Last hour" and click "Clear data"
3. **Open application** in new tab
4. **Try signing in again**

---

## 🔍 **ROOT CAUSES & PREVENTION**

### **Why This Happens**
1. **Multiple page refreshes** during sign-in process
2. **Section components making concurrent API calls**
3. **Auto-refresh intervals** not being cleaned up properly
4. **Browser navigation** during Google Sign-In process

### **Prevention Tips**
- ✅ **Don't refresh** the page during Google Sign-In
- ✅ **Wait for the process** to complete before navigating
- ✅ **Use only one browser tab** for the application
- ✅ **Clear browser cache** periodically

---

## 🛠️ **TECHNICAL DETAILS**

### **What the Error Means**
The error indicates that:
- A Google Sign-In promise is already active (`currentGoogleSignInPromiseActions.current` is not null)
- The previous operation wasn't properly cleaned up
- Multiple components are trying to initialize Google Sign-In simultaneously

### **Our Fixes Applied**
1. **Promise timeout management** (30-second auto-cleanup)
2. **Enhanced cleanup on navigation**
3. **Debounced API calls** in Section components
4. **Automatic cleanup on page visibility change**
5. **Emergency reset functionality**

### **Components Affected**
- `AuthContext` - Main Google Sign-In management
- `Section5_Reporting.jsx` - Reduced auto-refresh frequency
- `Section2_OrgInfo.jsx` - Data validation improvements
- `Section3_SchoolEvent.jsx` - File upload optimizations

---

## 📞 **STILL STUCK?**

### **Advanced Troubleshooting**
1. **Check browser console** for additional error messages
2. **Try incognito/private mode** to isolate extension conflicts
3. **Test with different browser** (Chrome, Firefox, Safari)
4. **Disable browser extensions** temporarily

### **Report the Issue**
If the problem persists, please report with:
- **Browser name and version**
- **Exact error message**
- **Steps taken before the error**
- **Browser console logs** (screenshot or copy)

---

## ✅ **SUCCESS INDICATORS**

You'll know the fix worked when:
- ✅ Google Sign-In button loads without errors
- ✅ Sign-In process completes successfully
- ✅ No "operation in progress" error messages
- ✅ Can navigate between sections normally

---

## 📚 **Related Documentation**
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [React Authentication Best Practices](https://reactjs.org/docs/context.html)
- [Next.js App Router Guide](https://nextjs.org/docs/app)

**Last Updated**: January 2025  
**Version**: 1.0.0 