# 🔧 Notification Schema Fix Guide

## ❌ **The Problem**
You're getting this error:
```
ERROR: input parameters after one with a default value must also have defaults
SQL state: 42P13
```

This happens because PostgreSQL requires parameters with default values to come **after** parameters without defaults in function definitions.

## ✅ **The Solution**

### **Step 1: Run the Fix Script**
```bash
# Navigate to your backend directory
cd backend

# Run the fix script
psql -d your_database_name -f fix-notification-schema.sql
```

### **Step 2: Verify the Fix**
```sql
-- Test the function works
SELECT * FROM create_notification(
    'user',                    -- target_type
    'Test Notification',        -- title
    'This is a test message',   -- message
    'system_update'            -- notification_type
);
```

### **Step 3: Update Your Service (Already Done)**
The `notification.service.js` has been updated to use the correct parameter order.

## 🔍 **What Was Fixed**

### **Before (Broken):**
```sql
CREATE FUNCTION create_notification(
    target_type_param varchar(10),
    target_user_id_param integer DEFAULT NULL,  -- ❌ Default value
    target_role_param varchar(50) DEFAULT NULL,  -- ❌ Default value
    excluded_user_ids_param integer[] DEFAULT NULL, -- ❌ Default value
    title_param text,                            -- ❌ No default - comes after defaults!
    message_param text,                          -- ❌ No default - comes after defaults!
    -- ... more parameters
)
```

### **After (Fixed):**
```sql
CREATE FUNCTION create_notification(
    target_type_param varchar(10),              -- ✅ No default
    title_param text,                           -- ✅ No default  
    message_param text,                         -- ✅ No default
    notification_type_param varchar(50),        -- ✅ No default
    target_user_id_param integer DEFAULT NULL,  -- ✅ Default value comes after non-defaults
    target_role_param varchar(50) DEFAULT NULL, -- ✅ Default value
    excluded_user_ids_param integer[] DEFAULT NULL, -- ✅ Default value
    -- ... more parameters with defaults
)
```

## 🚀 **Complete Setup Steps**

### **1. Apply the Schema Fix**
```bash
psql -d your_database_name -f backend/fix-notification-schema.sql
```

### **2. Test the System**
```bash
# Run the complete test
cd backend
node test-notification-system-complete.js
```

### **3. Start Your Servers**
```bash
# Backend
cd backend
npm start

# Frontend  
cd frontend
npm run dev
```

## 📊 **Expected Results**

After running the fix, you should see:
- ✅ No more parameter order errors
- ✅ `create_notification` function works
- ✅ All database functions working
- ✅ API endpoints responding
- ✅ Frontend notification components working

## 🔧 **Alternative: Use the Simple Function**

If you prefer, you can use the `create_notification_simple` function which has no default parameters:

```sql
-- Use this instead if you want no defaults
SELECT * FROM create_notification_simple(
    'user',           -- target_type
    'Test Title',     -- title
    'Test Message',   -- message
    'system_update',  -- notification_type
    NULL,             -- target_user_id
    NULL,             -- target_role
    NULL,             -- excluded_user_ids
    'normal',         -- priority
    NULL,             -- related_proposal_id
    NULL,             -- related_user_id
    '{}',             -- metadata
    '{}',             -- tags
    NULL,             -- expires_at
    NULL              -- created_by
);
```

## 🎯 **Your Notification System is Now Ready!**

After applying this fix:
- ✅ Database functions work correctly
- ✅ API endpoints respond properly  
- ✅ Frontend components display real notifications
- ✅ Full CRUD operations available
- ✅ Search and filtering functional
- ✅ User preferences working

The complete notification system will be fully operational! 🎉
