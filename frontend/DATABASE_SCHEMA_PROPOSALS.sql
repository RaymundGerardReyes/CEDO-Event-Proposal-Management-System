-- ===================================================================
-- CEDO EVENT PROPOSALS - COMPREHENSIVE DATABASE SCHEMA
-- ===================================================================
-- This schema consolidates all 5 sections into a single "proposals" table
-- Sections: Overview, OrgInfo, SchoolEvent, CommunityEvent, Reporting
-- ===================================================================

-- Main Proposals Table (Consolidates ALL 5 Sections)
CREATE TABLE proposals (
    -- ===============================================================
    -- PRIMARY IDENTIFIERS & METADATA
    -- ===============================================================
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()), -- For external references
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- ===============================================================
    -- SECTION 1: OVERVIEW & STATUS (Section1_Overview.jsx)
    -- ===============================================================
    current_section ENUM(
        'overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting'
    ) DEFAULT 'overview',
    
    has_active_proposal BOOLEAN DEFAULT FALSE,
    proposal_status ENUM(
        'draft', 'pending', 'approved', 'denied', 'revision_requested'
    ) DEFAULT 'draft',
    
    report_status ENUM(
        'draft', 'pending', 'approved', 'denied', 'not_applicable'
    ) DEFAULT 'draft',
    
    -- ===============================================================
    -- SECTION 2: ORGANIZATION INFO (Section2_OrgInfo.jsx)
    -- ===============================================================
    organization_name VARCHAR(255) NOT NULL,
    organization_type ENUM('school-based', 'community-based') NOT NULL,
    organization_description TEXT,
    
    -- Contact Information
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    
    -- ===============================================================
    -- POLYMORPHIC EVENT DETAILS (Section3 OR Section4)
    -- Note: Only one type will be filled based on organization_type
    -- ===============================================================
    
    -- Common Event Fields (used by both types)
    event_name VARCHAR(255) NOT NULL,
    event_venue VARCHAR(500) NOT NULL,
    event_start_date DATE NOT NULL,
    event_end_date DATE NOT NULL,
    event_start_time TIME NOT NULL,
    event_end_time TIME NOT NULL,
    event_mode ENUM('online', 'offline', 'hybrid') NOT NULL,
    
    -- ===============================================================
    -- SCHOOL EVENT SPECIFIC FIELDS (Section3_SchoolEvent.jsx)
    -- ===============================================================
    school_event_type ENUM(
        'academic-enhancement', 
        'workshop-seminar-webinar', 
        'conference', 
        'competition', 
        'cultural-show', 
        'sports-fest', 
        'other'
    ) NULL,
    
    school_return_service_credit ENUM('1', '2', '3', 'Not Applicable') NULL,
    school_target_audience JSON NULL, -- ["1st Year", "2nd Year", "Faculty", etc.]
    
    -- File attachments for school events
    school_gpoa_file_name VARCHAR(255) NULL,
    school_gpoa_file_path VARCHAR(500) NULL,
    school_proposal_file_name VARCHAR(255) NULL,
    school_proposal_file_path VARCHAR(500) NULL,
    
    -- ===============================================================
    -- COMMUNITY EVENT SPECIFIC FIELDS (Section4_CommunityEvent.jsx)
    -- ===============================================================
    community_event_type ENUM(
        'academic-enhancement',
        'seminar-webinar',
        'general-assembly',
        'leadership-training',
        'others'
    ) NULL,
    
    community_sdp_credits ENUM('1', '2') NULL,
    community_target_audience JSON NULL, -- ["1st Year", "2nd Year", "Leaders", etc.]
    
    -- File attachments for community events
    community_gpoa_file_name VARCHAR(255) NULL,
    community_gpoa_file_path VARCHAR(500) NULL,
    community_proposal_file_name VARCHAR(255) NULL,
    community_proposal_file_path VARCHAR(500) NULL,
    
    -- ===============================================================
    -- SECTION 5: REPORTING & ACCOMPLISHMENT (Section5_Reporting.jsx)
    -- ===============================================================
    accomplishment_report_file_name VARCHAR(255) NULL,
    accomplishment_report_file_path VARCHAR(500) NULL,
    digital_signature LONGTEXT NULL, -- Base64 encoded signature image
    attendance_count INT NULL,
    event_status ENUM('completed', 'cancelled', 'postponed') NULL,
    report_description TEXT NULL,
    
    -- ===============================================================
    -- ADMINISTRATIVE FIELDS
    -- ===============================================================
    admin_comments TEXT NULL,
    reviewed_by_admin_id BIGINT NULL, -- FK to admin users table
    reviewed_at TIMESTAMP NULL,
    submitted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    
    -- ===============================================================
    -- VALIDATION & METADATA
    -- ===============================================================
    validation_errors JSON NULL, -- Store form validation errors
    form_completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0-100%
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete
    
    -- ===============================================================
    -- INDEXES FOR PERFORMANCE
    -- ===============================================================
    INDEX idx_organization_type (organization_type),
    INDEX idx_proposal_status (proposal_status),
    INDEX idx_report_status (report_status),
    INDEX idx_created_at (created_at),
    INDEX idx_organization_name (organization_name),
    INDEX idx_event_dates (event_start_date, event_end_date),
    INDEX idx_current_section (current_section),
    
    -- ===============================================================
    -- CONSTRAINTS & VALIDATION
    -- ===============================================================
    
    -- Ensure school-specific fields are only filled for school events
    CONSTRAINT chk_school_fields CHECK (
        (organization_type = 'school-based' AND school_event_type IS NOT NULL) OR
        (organization_type = 'community-based' AND school_event_type IS NULL)
    ),
    
    -- Ensure community-specific fields are only filled for community events  
    CONSTRAINT chk_community_fields CHECK (
        (organization_type = 'community-based' AND community_event_type IS NOT NULL) OR
        (organization_type = 'school-based' AND community_event_type IS NULL)
    ),
    
    -- Ensure event dates are logical
    CONSTRAINT chk_event_dates CHECK (event_end_date >= event_start_date),
    
    -- Ensure completion percentage is valid
    CONSTRAINT chk_completion_percentage CHECK (
        form_completion_percentage >= 0 AND form_completion_percentage <= 100
    )
);

-- ===================================================================
-- SUPPORTING TABLES (Optional but Recommended)
-- ===================================================================

-- File Attachments Table (Alternative normalized approach)
CREATE TABLE proposal_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    file_type ENUM('school_gpoa', 'school_proposal', 'community_gpoa', 'community_proposal', 'accomplishment_report') NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    INDEX idx_proposal_file_type (proposal_id, file_type)
);

-- Proposal Status History (Audit Trail)
CREATE TABLE proposal_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_admin_id BIGINT NULL, -- FK to admin users
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    INDEX idx_proposal_history (proposal_id, created_at)
);

-- ===================================================================
-- SAMPLE DATA INSERTION QUERIES
-- ===================================================================

-- Example 1: School-based Event Proposal
INSERT INTO proposals (
    organization_name, organization_type, organization_description,
    contact_name, contact_email, contact_phone,
    event_name, event_venue, event_start_date, event_end_date,
    event_start_time, event_end_time, event_mode,
    school_event_type, school_return_service_credit, school_target_audience,
    current_section, proposal_status
) VALUES (
    'Computer Science Society',
    'school-based',
    'Student organization focused on technology and programming',
    'John Doe',
    'john.doe@university.edu',
    '+1234567890',
    'Annual Hackathon 2024',
    'University Tech Center',
    '2024-03-15',
    '2024-03-17',
    '09:00:00',
    '17:00:00',
    'offline',
    'competition',
    '2',
    '["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty"]',
    'pending',
    'pending'
);

-- Example 2: Community-based Event Proposal
INSERT INTO proposals (
    organization_name, organization_type, organization_description,
    contact_name, contact_email, contact_phone,
    event_name, event_venue, event_start_date, event_end_date,
    event_start_time, event_end_time, event_mode,
    community_event_type, community_sdp_credits, community_target_audience,
    current_section, proposal_status
) VALUES (
    'Local Community Leaders',
    'community-based',
    'Community organization for leadership development',
    'Jane Smith',
    'jane.smith@community.org',
    '+1987654321',
    'Leadership Skills Workshop',
    'Community Center Hall A',
    '2024-04-10',
    '2024-04-10',
    '14:00:00',
    '18:00:00',
    'offline',
    'leadership-training',
    '1',
    '["Leaders", "Alumni", "All Levels"]',
    'pending',
    'pending'
);

-- ===================================================================
-- USEFUL QUERY EXAMPLES
-- ===================================================================

-- Get all pending proposals with organization details
SELECT 
    id, uuid, organization_name, organization_type, event_name,
    event_start_date, event_end_date, contact_name, contact_email,
    proposal_status, created_at
FROM proposals 
WHERE proposal_status = 'pending' 
AND is_deleted = FALSE
ORDER BY created_at DESC;

-- Get school events with their specific details
SELECT 
    id, organization_name, event_name, event_venue,
    school_event_type, school_return_service_credit,
    JSON_UNQUOTE(JSON_EXTRACT(school_target_audience, '$')) as target_audience,
    event_start_date, event_end_date
FROM proposals 
WHERE organization_type = 'school-based' 
AND proposal_status = 'approved'
ORDER BY event_start_date;

-- Get community events with their specific details
SELECT 
    id, organization_name, event_name, event_venue,
    community_event_type, community_sdp_credits,
    JSON_UNQUOTE(JSON_EXTRACT(community_target_audience, '$')) as target_audience,
    event_start_date, event_end_date
FROM proposals 
WHERE organization_type = 'community-based' 
AND proposal_status = 'approved'
ORDER BY event_start_date;

-- Get proposals requiring accomplishment reports
SELECT 
    id, organization_name, event_name, event_end_date,
    report_status, accomplishment_report_file_name
FROM proposals 
WHERE proposal_status = 'approved' 
AND event_end_date < CURDATE()
AND report_status IN ('draft', 'pending')
ORDER BY event_end_date;

-- ===================================================================
-- MIGRATION STRATEGY FROM EXISTING SEPARATE TABLES
-- ===================================================================

-- If you have existing separate tables, you can migrate them like this:
/*
INSERT INTO proposals (
    organization_name, organization_type, contact_name, contact_email,
    event_name, event_venue, event_start_date, event_end_date,
    event_start_time, event_end_time, event_mode,
    school_event_type, school_return_service_credit,
    proposal_status, created_at
)
SELECT 
    o.name as organization_name,
    'school-based' as organization_type,
    o.contact_name,
    o.contact_email,
    s.event_name,
    s.venue as event_venue,
    s.start_date as event_start_date,
    s.end_date as event_end_date,
    s.start_time as event_start_time,
    s.end_time as event_end_time,
    s.mode as event_mode,
    s.event_type as school_event_type,
    s.return_service_credit as school_return_service_credit,
    s.status as proposal_status,
    s.created_at
FROM old_organizations o
JOIN old_school_events s ON o.id = s.organization_id;
*/

-- ===================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- ===================================================================

-- 1. Use proper indexing for common query patterns
-- 2. Consider partitioning by year if data volume is high
-- 3. Use JSON columns for flexible arrays (target_audience)
-- 4. Implement soft deletes to maintain data integrity
-- 5. Add triggers for automatic timestamps and validation
-- 6. Consider read replicas for reporting queries

-- ===================================================================
-- SECURITY CONSIDERATIONS
-- ===================================================================

-- 1. Encrypt sensitive file paths
-- 2. Validate file uploads before storing paths
-- 3. Implement proper access controls per organization_type
-- 4. Add audit logging for all status changes
-- 5. Use UUID for external references to prevent enumeration attacks 