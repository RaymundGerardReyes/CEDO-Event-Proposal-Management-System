-- Add Section 5 (Post-Event Reporting) columns to proposals table
-- Run this script to support Section 5 functionality

USE cedo_events;

-- Add attendance tracking file columns
ALTER TABLE proposals 
ADD COLUMN pre_registration_file_name VARCHAR(255) NULL AFTER accomplishment_report_file_path,
ADD COLUMN pre_registration_file_path VARCHAR(500) NULL AFTER pre_registration_file_name,
ADD COLUMN final_attendance_file_name VARCHAR(255) NULL AFTER pre_registration_file_path,
ADD COLUMN final_attendance_file_path VARCHAR(500) NULL AFTER final_attendance_file_name;

-- Show updated table structure
DESCRIBE proposals; 