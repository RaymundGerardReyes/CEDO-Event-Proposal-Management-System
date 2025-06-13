-- Add Profile Credentials columns to existing users table
-- This script adds organization_description and phone_number fields

USE cedo_auth;

-- Add organization_description column
ALTER TABLE users 
ADD COLUMN organization_description TEXT NULL 
COMMENT 'Detailed description of the user organization';

-- Add phone_number column with validation constraint
ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(11) NULL 
COMMENT 'Phone number in format 09XXXXXXXXX (11 digits starting with 09)';

-- Add constraint to ensure phone number format (11 digits starting with 09)
ALTER TABLE users 
ADD CONSTRAINT chk_phone_format 
CHECK (phone_number IS NULL OR (phone_number REGEXP '^09[0-9]{9}$' AND LENGTH(phone_number) = 11));

-- Create index for better performance on phone number searches
CREATE INDEX idx_users_phone_number ON users(phone_number);

-- Create index for organization description searches (if needed)
CREATE INDEX idx_users_organization_description ON users(organization_description(100));

-- Verify the table structure
DESCRIBE users;

-- Show the updated table with new columns
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cedo_google_auth' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('organization_description', 'phone_number')
ORDER BY ORDINAL_POSITION; 