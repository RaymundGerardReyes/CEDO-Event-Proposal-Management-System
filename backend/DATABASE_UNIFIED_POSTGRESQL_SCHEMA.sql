-- ===============================================
-- CEDO UNIFIED POSTGRESQL SCHEMA
-- Replaces MySQL + MongoDB hybrid approach
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ===============================================
-- 1. ORGANIZATIONS TABLE
-- ===============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN ('school-based', 'community-based')),
    contact_person VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 2. PROPOSALS TABLE (Unified for both event types)
-- ===============================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event Details (Works for both school and community events)
    event_name VARCHAR(255) NOT NULL,
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    
    -- Event Type and Mode
    event_type VARCHAR(50) NOT NULL,
    event_mode VARCHAR(20) NOT NULL CHECK (event_mode IN ('online', 'offline', 'hybrid')),
    
    -- Flexible JSON fields for different event types
    target_audience JSONB NOT NULL DEFAULT '[]',  -- ["1st Year", "2nd Year", etc.]
    event_specific_data JSONB DEFAULT '{}',       -- School: return_service_credit, Community: sdp_credits
    
    -- Status and Workflow
    proposal_status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (proposal_status IN ('draft', 'pending', 'approved', 'denied')),
    admin_comments TEXT,
    
    -- File Storage (JSON metadata, actual files in filesystem/cloud)
    files JSONB DEFAULT '{}',  -- {"gpoa": {"filename": "...", "path": "...", "size": 123}, "proposal": {...}}
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ===============================================
-- 3. ACCOMPLISHMENT REPORTS TABLE
-- ===============================================
CREATE TABLE accomplishment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    
    -- Report Details
    description TEXT,
    attendance_count INTEGER,
    event_status VARCHAR(20) NOT NULL CHECK (event_status IN ('completed', 'cancelled', 'postponed')),
    
    -- Files and Signature
    files JSONB DEFAULT '{}',  -- {"report": {"filename": "...", "path": "..."}}
    digital_signature TEXT,   -- Base64 encoded signature or file path
    
    -- Status
    report_status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (report_status IN ('draft', 'pending', 'approved', 'denied')),
    admin_comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ===============================================
-- 4. FILE STORAGE TABLE (Optional - for detailed tracking)
-- ===============================================
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),  -- SHA-256 for deduplication
    
    -- References
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    report_id UUID REFERENCES accomplishment_reports(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,  -- 'gpoa', 'proposal', 'accomplishment_report'
    
    -- Metadata
    uploaded_by VARCHAR(255),  -- User ID or email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 5. INDEXES FOR PERFORMANCE
-- ===============================================

-- Proposals indexes
CREATE INDEX idx_proposals_organization ON proposals(organization_id);
CREATE INDEX idx_proposals_status ON proposals(proposal_status);
CREATE INDEX idx_proposals_type ON proposals(event_type);
CREATE INDEX idx_proposals_dates ON proposals(start_date, end_date);

-- Partial indexes for common queries
CREATE INDEX idx_proposals_pending ON proposals(id) WHERE proposal_status = 'pending';
CREATE INDEX idx_proposals_approved ON proposals(id) WHERE proposal_status = 'approved';

-- JSON indexes for flexible queries
CREATE INDEX idx_proposals_target_audience ON proposals USING GIN(target_audience);
CREATE INDEX idx_proposals_event_data ON proposals USING GIN(event_specific_data);
CREATE INDEX idx_proposals_files ON proposals USING GIN(files);

-- Full-text search index
CREATE INDEX idx_proposals_search ON proposals USING GIN(
    to_tsvector('english', event_name || ' ' || venue || ' ' || COALESCE(admin_comments, ''))
);

-- Reports indexes
CREATE INDEX idx_reports_proposal ON accomplishment_reports(proposal_id);
CREATE INDEX idx_reports_status ON accomplishment_reports(report_status);

-- Files indexes
CREATE INDEX idx_files_proposal ON uploaded_files(proposal_id);
CREATE INDEX idx_files_report ON uploaded_files(report_id);
CREATE INDEX idx_files_hash ON uploaded_files(file_hash);  -- For deduplication

-- ===============================================
-- 6. FUNCTIONS AND TRIGGERS
-- ===============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON accomplishment_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 7. SAMPLE QUERIES FOR YOUR FORMS
-- ===============================================

-- Insert organization (Section 2)
/*
INSERT INTO organizations (name, description, organization_type, contact_person, contact_email, contact_phone)
VALUES ('Student Council', 'University Student Government', 'school-based', 'John Doe', 'john@university.edu', '123-456-7890');
*/

-- Insert school event proposal (Section 3)
/*
INSERT INTO proposals (
    organization_id, event_name, venue, start_date, end_date, time_start, time_end,
    event_type, event_mode, target_audience, event_specific_data, files
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Annual Science Fair',
    'University Gymnasium',
    '2024-03-15',
    '2024-03-15',
    '09:00',
    '17:00',
    'academic-enhancement',
    'offline',
    '["1st Year", "2nd Year", "3rd Year", "4th Year"]',
    '{"return_service_credit": "2"}',
    '{"gpoa": {"filename": "StudentCouncil_GPOA.pdf", "path": "/uploads/files/uuid.pdf", "size": 1024000}}'
);
*/

-- Insert community event proposal (Section 4)
/*
INSERT INTO proposals (
    organization_id, event_name, venue, start_date, end_date, time_start, time_end,
    event_type, event_mode, target_audience, event_specific_data, files
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Leadership Training Workshop',
    'Community Center',
    '2024-04-10',
    '2024-04-12',
    '08:00',
    '16:00',
    'leadership-training',
    'hybrid',
    '["Leaders", "All Levels"]',
    '{"sdp_credits": "2"}',
    '{"gpoa": {"filename": "CommunityOrg_GPOA.pdf", "path": "/uploads/files/uuid2.pdf", "size": 2048000}}'
);
*/

-- Query for Section 1 Overview
/*
SELECT 
    p.id,
    p.event_name,
    p.proposal_status,
    p.event_type,
    o.name as organization_name,
    p.start_date,
    p.end_date,
    ar.report_status,
    p.created_at
FROM proposals p
JOIN organizations o ON p.organization_id = o.id
LEFT JOIN accomplishment_reports ar ON p.id = ar.proposal_id
WHERE o.contact_email = 'user@university.edu'
ORDER BY p.created_at DESC;
*/

-- Search proposals with full-text search
/*
SELECT * FROM proposals 
WHERE to_tsvector('english', event_name || ' ' || venue) @@ to_tsquery('english', 'science & fair');
*/

-- Get proposals by target audience
/*
SELECT * FROM proposals 
WHERE target_audience @> '["1st Year"]';
*/

-- ===============================================
-- 8. BENEFITS OF THIS UNIFIED APPROACH
-- ===============================================

/*
✅ SINGLE DATABASE - No more MySQL/MongoDB confusion
✅ ACID COMPLIANCE - Perfect for academic records
✅ JSON SUPPORT - Flexible for arrays and complex data
✅ FILE METADATA - Store file info in JSON, files in filesystem
✅ FULL-TEXT SEARCH - Built-in search capabilities
✅ ADVANCED INDEXING - Partial, JSON, and GIN indexes
✅ STRONG RELATIONSHIPS - Proper foreign keys and joins
✅ POSTGRESQL FEATURES - Materialized views, partitioning, etc.
✅ VERCEL COMPATIBLE - Works great with Vercel Postgres
✅ SINGLE CODEBASE - One set of database operations
*/

-- ===============================================
-- 9. MIGRATION NOTES
-- ===============================================

/*
TO MIGRATE FROM YOUR CURRENT HYBRID SYSTEM:

1. Export data from MySQL tables
2. Export file metadata from MongoDB
3. Move files to PostgreSQL-managed storage
4. Import data using this schema
5. Update your API endpoints to use PostgreSQL only
6. Remove MongoDB dependencies

EXAMPLE MIGRATION QUERY:
-- Convert MySQL proposals to PostgreSQL
INSERT INTO proposals (organization_id, event_name, venue, ...)
SELECT 
    org_uuid, 
    title as event_name, 
    venue, 
    ...
FROM mysql_proposals;
*/ 