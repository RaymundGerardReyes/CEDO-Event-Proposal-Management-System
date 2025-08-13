# 🔍 Root Cause Analysis: `/main` Prefix in Dashboard Routes

## 🎯 **Problem Identified**

Your application has **duplicate dashboard structures** causing the `/main` prefix issue:

```
❌ Current URLs:
http://localhost:3000/main/admin-dashboard
http://localhost:3000/main/student-dashboard

✅ Expected URLs:
http://localhost:3000/admin-dashboard  
http://localhost:3000/student-dashboard
```

## 🔍 **Root Cause Analysis**

### **1. Duplicate File Structure** 📁

You have **TWO sets of dashboard pages**:

```
frontend/src/app/
├── main/
│   ├── admin-dashboard/
│   │   └── page.jsx          ← DUPLICATE #1
│   └── student-dashboard/
│       └── page.jsx          ← DUPLICATE #1
└── admin-dashboard/          ← MISSING!
└── student-dashboard/
    └── page.jsx              ← DUPLICATE #2 (exists)
```

**The Issue**: 
- Your dashboards are inside `frontend/src/app/main/` folder
- Next.js treats this as `/main/admin-dashboard` route
- But you want `/admin-dashboard` route

### **2. Backend Configuration is Correct** ✅

Your backend (`backend/routes/auth.js`) correctly defines:
```javascript
const roleAccess = {
  [ROLES.STUDENT]: {
    dashboard: "/student-dashboard",     // ✅ No /main prefix
  },
  [ROLES.HEAD_ADMIN]: {
    dashboard: "/admin-dashboard",       // ✅ No /main prefix
  },
  [ROLES.MANAGER]: {
    dashboard: "/admin-dashboard",       // ✅ No /main prefix
  },
  [ROLES.REVIEWER]: {
    dashboard: "/admin-dashboard",       // ✅ No /main prefix
  },
}
```

### **3. Frontend Routing is Compensating** 🔄

Your middleware and auth components were **updated to use `/main/` prefix** to match the file structure:

```javascript
// frontend/src/middleware.js
function getDashboardForRole(role) {
  switch (role) {
    case UserRoles.HEAD_ADMIN:
    case UserRoles.MANAGER:
      return "/main/admin-dashboard";     // ❌ Added /main to match files
    case UserRoles.STUDENT:
      return "/main/student-dashboard";   // ❌ Added /main to match files
  }
}
```

## 🎯 **The Real Solution**

You need to **move the dashboard pages** from `/main/` to the root level:

### **Current Structure (Wrong)**:
```
frontend/src/app/
├── main/
│   ├── admin-dashboard/page.jsx    ← Move this
│   └── student-dashboard/page.jsx  ← Move this
└── student-dashboard/page.jsx      ← Already exists here
```

### **Correct Structure (Target)**:
```
frontend/src/app/
├── admin-dashboard/
│   └── page.jsx                    ← Should be here
└── student-dashboard/
    └── page.jsx                    ← Already here
```

## 📋 **Files That Need to be Updated**

### **1. Move Dashboard Pages** 📁
```bash
# Move admin dashboard
mv frontend/src/app/main/admin-dashboard/ frontend/src/app/admin-dashboard/

# The student dashboard already exists at the correct location
# You can remove the duplicate in /main/
```

### **2. Update Routing Logic** 🔄

**Files to revert back to clean paths**:

1. **`frontend/src/middleware.js`**:
```javascript
// Change from:
return "/main/admin-dashboard";
// Back to:
return "/admin-dashboard";
```

2. **`frontend/src/components/auth/AuthGuard.jsx`**:
```javascript
// Change from:
return '/main/admin-dashboard';
// Back to:
return '/admin-dashboard';
```

3. **`frontend/src/hooks/use-auth-validation.js`**:
```javascript
// Change from:
return '/main/admin-dashboard';
// Back to:
return '/admin-dashboard';
```

4. **`frontend/src/app/auth/sign-in/page.jsx`**:
```javascript
// Change from:
targetPath = "/main/admin-dashboard";
// Back to:
targetPath = "/admin-dashboard";
```

5. **`frontend/src/contexts/auth-context.js`**:
```javascript
// Change from:
return "/main/admin-dashboard";
// Back to:
return "/admin-dashboard";
```

### **3. Fix Internal Links** 🔗

**Files with hardcoded `/main/` links**:

1. **`frontend/src/app/main/page.jsx`** - Update links
2. **`frontend/src/app/student-dashboard/submit-event/[draftId]/layout/layout.jsx`** - Update dashboard links
3. **`frontend/src/app/student-dashboard/submit-event/[draftId]/error-handling/error.jsx`** - Update dashboard links
4. **`frontend/src/app/student-dashboard/not-found.jsx`** - Update dashboard links
5. **`frontend/src/app/student-dashboard/error.jsx`** - Update dashboard links

## 🚨 **Critical Discovery**

Looking at your file structure, I found:

1. **`frontend/src/app/main/admin-dashboard/page.jsx`** - 61KB file (your main admin dashboard)
2. **`frontend/src/app/student-dashboard/page.jsx`** - Already exists at correct location
3. **`frontend/src/app/main/student-dashboard/page.jsx`** - Duplicate that should be removed

## 🎯 **The Fix Strategy**

### **Phase 1: File Structure** 📁
1. Move `frontend/src/app/main/admin-dashboard/` → `frontend/src/app/admin-dashboard/`
2. Remove duplicate `frontend/src/app/main/student-dashboard/`
3. Keep existing `frontend/src/app/student-dashboard/`

### **Phase 2: Code Updates** 🔄
1. Revert all `/main/` prefixes back to clean paths
2. Update hardcoded links
3. Remove legacy redirect logic

### **Phase 3: Cleanup** 🧹
1. Remove empty `frontend/src/app/main/` folder
2. Update test files
3. Update documentation

## 📊 **Impact Analysis**

### **Files to Move**: 1
- `frontend/src/app/main/admin-dashboard/` (61KB, 1234 lines)

### **Files to Update**: 10+
- Middleware, auth components, contexts, sign-in page
- Error pages, layout files with hardcoded links
- Test files and documentation

### **Files to Remove**: 1
- `frontend/src/app/main/student-dashboard/` (duplicate)

## ✅ **Expected Outcome**

After the fix:
```
✅ http://localhost:3000/admin-dashboard
✅ http://localhost:3000/student-dashboard
❌ No more /main/ prefix in URLs
✅ Clean, semantic URLs
✅ Matches backend expectations
✅ Consistent with Next.js conventions
```

## 🎯 **Next Steps**

1. **Backup**: Create backup of current state
2. **Move Files**: Relocate admin dashboard to correct location
3. **Update Code**: Revert routing logic to clean paths
4. **Test**: Verify all authentication flows work
5. **Cleanup**: Remove duplicates and legacy code

The `/main` prefix is an architectural artifact from having dashboards in the wrong folder structure. Moving them to the correct location will resolve this completely.


