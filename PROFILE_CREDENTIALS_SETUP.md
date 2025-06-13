# Profile Credentials Setup Guide

This guide walks you through setting up the **Organization Description** and **Phone Number** fields for user profiles with complete database integration.

## 🎯 Features Added

### ✅ Database Schema Updates
- **`organization_description`** - TEXT field for detailed organization info
- **`phone_number`** - VARCHAR(11) field with strict validation (must start with '09')
- Database constraints ensuring phone format: `09XXXXXXXXX` (exactly 11 digits)
- Proper indexing for performance
- Handles NULL values appropriately

### ✅ API Endpoints
- `GET /api/profile` - Fetch complete user profile
- `PUT /api/profile/organization` - Update organization description
- `PUT /api/profile/phone` - Update phone number with validation
- `PUT /api/profile/bulk` - Update multiple fields at once

### ✅ Frontend Integration
- Editable organization description with textarea
- Phone number field with real-time validation
- Error handling and user feedback
- Proper authentication with JWT tokens

## 🚀 Setup Instructions

### Step 1: Update Database Schema

Run the SQL script to add the new columns:

```bash
# Navigate to backend directory
cd backend

# Run the SQL script
mysql -u your_username -p your_database_name < add-profile-credentials-columns.sql
```

Or execute the SQL manually:

```sql
USE cedo_google_auth;

-- Add organization_description column
ALTER TABLE users 
ADD COLUMN organization_description TEXT NULL 
COMMENT 'Detailed description of the user organization';

-- Add phone_number column with validation constraint
ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(11) NULL 
COMMENT 'Phone number in format 09XXXXXXXXX (11 digits starting with 09)';

-- Add constraint to ensure phone number format
ALTER TABLE users 
ADD CONSTRAINT chk_phone_format 
CHECK (phone_number IS NULL OR (phone_number REGEXP '^09[0-9]{9}$' AND LENGTH(phone_number) = 11));

-- Create indexes for performance
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_organization_description ON users(organization_description(100));
```

### Step 2: Verify Database Setup

Test your database setup:

```bash
# Run the test script
node test-profile-credentials.js
```

This will verify:
- ✅ New columns exist
- ✅ Constraints are properly set
- ✅ Phone number validation works
- ✅ Indexes are created

### Step 3: Start Backend Server

Make sure your backend server includes the profile routes:

```bash
cd backend
npm start
```

The server should show:
```
📍 Profile routes available at: http://localhost:5000/api/profile
```

### Step 4: Test API Endpoints

#### Get Profile Data
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Organization Description
```bash
curl -X PUT http://localhost:5000/api/profile/organization \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"organizationDescription": "University of Technology - Research Department"}'
```

#### Update Phone Number
```bash
curl -X PUT http://localhost:5000/api/profile/phone \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "09123456789"}'
```

### Step 5: Test Frontend

1. Start your frontend:
```bash
cd frontend
npm run dev
```

2. Navigate to the profile page
3. Test editing both fields
4. Verify validation works for phone numbers

## 📋 Phone Number Validation Rules

The phone number field enforces strict validation:

### ✅ Valid Examples
- `09123456789` ✅ (Globe/TM)
- `09171234567` ✅ (Globe)
- `09995551234` ✅ (Smart/TNT)
- `09451234567` ✅ (DITO)

### ❌ Invalid Examples
- `0812345678` ❌ (Not starting with 09)
- `091234567890` ❌ (12 digits, too long)
- `0912345678` ❌ (10 digits, too short)
- `abc1234567` ❌ (Contains letters)
- `+639123456789` ❌ (International format not allowed)

## 🗃️ Database Schema

### Updated Users Table Structure

```sql
Table: users
Columns:
├── id int AI PK 
├── name varchar(255) 
├── email varchar(255) 
├── password varchar(255) 
├── role enum('student','head_admin','manager','partner','reviewer') 
├── organization varchar(255) 
├── organization_type enum('internal','external') 
├── organization_description TEXT            -- 🆕 NEW FIELD
├── phone_number VARCHAR(11)                 -- 🆕 NEW FIELD  
├── google_id varchar(255) 
├── avatar varchar(255) 
├── reset_token varchar(255) 
├── reset_token_expires datetime 
├── is_approved tinyint(1) 
├── approved_by int 
├── approved_at timestamp 
├── password_reset_required tinyint(1) 
├── last_login timestamp 
├── created_at timestamp 
└── updated_at timestamp

Constraints:
├── chk_phone_format: phone_number REGEXP '^09[0-9]{9}$'

Indexes:
├── idx_users_phone_number
└── idx_users_organization_description
```

## 🔐 API Security

All profile endpoints require:
- ✅ Valid JWT token in Authorization header
- ✅ User authentication via middleware
- ✅ Input validation and sanitization
- ✅ Unique phone number constraint (no duplicates)

## 🛠️ Troubleshooting

### Database Issues
```sql
-- Check if columns exist
DESCRIBE users;

-- Check constraints
SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'cedo_google_auth' AND TABLE_NAME = 'users';

-- Check indexes
SHOW INDEX FROM users WHERE Column_name IN ('phone_number', 'organization_description');
```

### API Issues
1. Verify JWT token is valid
2. Check server logs for errors
3. Ensure database connection is working
4. Test with Postman or curl

### Frontend Issues
1. Check browser console for errors
2. Verify API_URL environment variable
3. Ensure token is stored correctly
4. Test API endpoints independently

## 📈 Performance Considerations

- **Indexing**: Both new fields are indexed for fast searches
- **Validation**: Client-side validation prevents invalid API calls
- **Caching**: Consider implementing response caching for profile data
- **Database**: TEXT field for organization description handles large content efficiently

## 🔄 Migration Notes

If you have existing users:
- New fields default to NULL (safe migration)
- No data loss during schema update
- Existing functionality remains unchanged
- Users can gradually update their profiles

## 📞 Support

For issues related to this implementation:

1. **Database Setup**: Check `test-profile-credentials.js` output
2. **API Integration**: Review server logs and test endpoints
3. **Frontend**: Check browser console and network tab
4. **Validation**: Refer to phone number format examples above

---

**🎉 Setup Complete!** Your profile credentials system is now ready with Organization Description and Phone Number fields, complete with database integration and validation. 