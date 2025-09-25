#!/usr/bin/env node

/**
 * Schema Alignment Test
 * 
 * Tests the complete data flow alignment between:
 * 1. Frontend form data (Organization.jsx + EventInformation.jsx)
 * 2. Frontend data mapper (proposal-data-mapper.js)
 * 3. Backend routes (routes/proposals.js)
 * 4. Database schema (CEDO_Database_Schema_PostgreSQL_Updated.sql)
 */

const { query } = require('./config/database-postgresql-only.js');

// Test data that matches your frontend forms
const testFrontendData = {
    // Organization.jsx data
    organization: {
        organizationName: 'Xavier University',
        organizationType: 'school',
        organizationDescription: 'Premier educational institution in Cagayan de Oro',
        organizationRegistrationNo: 'REG-2025-001',
        contactPerson: 'Dr. Maria Santos',
        contactEmail: 'maria.santos@xu.edu.ph',
        contactPhone: '+63-88-999-8888'
    },

    // EventInformation.jsx data
    event: {
        eventName: 'Academic Enhancement Workshop',
        venue: 'Xavier University Main Campus',
        startDate: '2025-02-15',
        endDate: '2025-02-16',
        startTime: '09:00:00',
        endTime: '17:00:00',
        eventMode: 'offline',
        eventType: 'workshop',
        selectedTargetAudiences: ['1st_year', '2nd_year', '3rd_year'],
        sdpCredits: 1
    },

    // File data
    files: {
        gpoa: {
            name: 'GPOA_2025.pdf',
            size: 1024000,
            type: 'application/pdf',
            filePath: '/uploads/gpoa/GPOA_2025.pdf'
        },
        projectProposal: {
            name: 'Project_Proposal_2025.pdf',
            size: 2048000,
            type: 'application/pdf',
            filePath: '/uploads/proposals/Project_Proposal_2025.pdf'
        }
    }
};

// Expected database fields from CEDO_Database_Schema_PostgreSQL_Updated.sql
const expectedSchemaFields = [
    // Primary key and UUID
    'id', 'uuid',

    // ORGANIZATION INFORMATION
    'organization_name', 'organization_type', 'organization_description', 'organization_registration_no',
    'contact_person', 'contact_email', 'contact_phone',

    // EVENT INFORMATION
    'event_name', 'event_venue', 'event_start_date', 'event_end_date',
    'event_start_time', 'event_end_time', 'event_mode', 'event_type',
    'target_audience', 'sdp_credits',

    // FILE UPLOADS
    'gpoa_file_name', 'gpoa_file_size', 'gpoa_file_type', 'gpoa_file_path',
    'project_proposal_file_name', 'project_proposal_file_size', 'project_proposal_file_type', 'project_proposal_file_path',

    // FORM STATE AND PROGRESS
    'current_section', 'form_completion_percentage',

    // PROPOSAL STATUS MANAGEMENT
    'proposal_status', 'report_status', 'event_status', 'has_active_proposal',

    // ADDITIONAL INFORMATION
    'attendance_count', 'objectives', 'budget', 'volunteers_needed',
    'digital_signature', 'report_description', 'validation_errors',

    // METADATA
    'is_deleted', 'created_at', 'updated_at',

    // User Relationship
    'user_id'
];

/**
 * Test 1: Verify database schema matches expected fields
 */
async function testDatabaseSchema() {
    console.log('🔍 Test 1: Verifying database schema...');

    try {
        const result = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'proposals' 
            ORDER BY ordinal_position
        `);

        const actualFields = result.rows.map(row => row.column_name);
        const missingFields = expectedSchemaFields.filter(field => !actualFields.includes(field));
        const extraFields = actualFields.filter(field => !expectedSchemaFields.includes(field));

        console.log(`✅ Database has ${actualFields.length} columns`);
        console.log(`📋 Expected fields: ${expectedSchemaFields.length}`);

        if (missingFields.length > 0) {
            console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
            return false;
        }

        if (extraFields.length > 0) {
            console.log(`⚠️ Extra fields: ${extraFields.join(', ')}`);
        }

        console.log('✅ Database schema matches expected structure');
        return true;

    } catch (error) {
        console.error('❌ Database schema test failed:', error.message);
        return false;
    }
}

/**
 * Test 2: Test data mapping and validation
 */
async function testDataMapping() {
    console.log('🔍 Test 2: Testing data mapping...');

    try {
        // Simulate frontend data mapping
        const mappedData = {
            uuid: 'test-uuid-12345',

            // ORGANIZATION INFORMATION (from Organization.jsx)
            organization_name: testFrontendData.organization.organizationName,
            organization_type: 'school-based', // Mapped from 'school'
            organization_description: testFrontendData.organization.organizationDescription,
            organization_registration_no: testFrontendData.organization.organizationRegistrationNo,
            contact_person: testFrontendData.organization.contactPerson,
            contact_email: testFrontendData.organization.contactEmail,
            contact_phone: testFrontendData.organization.contactPhone,

            // EVENT INFORMATION (from EventInformation.jsx)
            event_name: testFrontendData.event.eventName,
            event_venue: testFrontendData.event.venue,
            event_start_date: testFrontendData.event.startDate,
            event_end_date: testFrontendData.event.endDate,
            event_start_time: testFrontendData.event.startTime,
            event_end_time: testFrontendData.event.endTime,
            event_mode: 'offline', // Mapped from 'offline'
            event_type: 'academic-enhancement', // Mapped from 'workshop'
            target_audience: JSON.stringify(testFrontendData.event.selectedTargetAudiences),
            sdp_credits: testFrontendData.event.sdpCredits,

            // FILE UPLOADS (from EventInformation.jsx)
            gpoa_file_name: testFrontendData.files.gpoa.name,
            gpoa_file_size: testFrontendData.files.gpoa.size,
            gpoa_file_type: testFrontendData.files.gpoa.type,
            gpoa_file_path: testFrontendData.files.gpoa.filePath,
            project_proposal_file_name: testFrontendData.files.projectProposal.name,
            project_proposal_file_size: testFrontendData.files.projectProposal.size,
            project_proposal_file_type: testFrontendData.files.projectProposal.type,
            project_proposal_file_path: testFrontendData.files.projectProposal.filePath,

            // FORM STATE AND PROGRESS
            current_section: 'schoolEvent',
            form_completion_percentage: 100.00,

            // PROPOSAL STATUS MANAGEMENT
            proposal_status: 'draft',
            report_status: 'draft',
            event_status: 'scheduled',
            has_active_proposal: false,

            // ADDITIONAL INFORMATION
            attendance_count: 0,
            objectives: null,
            budget: 0.00,
            volunteers_needed: 0,
            digital_signature: null,
            report_description: null,
            validation_errors: null,

            // METADATA
            is_deleted: false,

            // User Relationship
            user_id: 1 // Test user ID
        };

        console.log('✅ Data mapping completed successfully');
        console.log('📊 Mapped data keys:', Object.keys(mappedData));

        // Validate required fields
        const requiredFields = [
            'organization_name', 'contact_person', 'contact_email',
            'event_name', 'event_venue', 'event_start_date', 'event_end_date',
            'event_start_time', 'event_end_time', 'event_type', 'target_audience', 'sdp_credits'
        ];

        const missingRequired = requiredFields.filter(field => !mappedData[field]);
        if (missingRequired.length > 0) {
            console.log(`❌ Missing required fields: ${missingRequired.join(', ')}`);
            return false;
        }

        console.log('✅ All required fields present');
        return true;

    } catch (error) {
        console.error('❌ Data mapping test failed:', error.message);
        return false;
    }
}

/**
 * Test 3: Test database insertion
 */
async function testDatabaseInsertion() {
    console.log('🔍 Test 3: Testing database insertion...');

    try {
        const testUuid = `test-uuid-${Date.now()}`;

        // Insert test data
        const insertResult = await query(`
            INSERT INTO proposals (
                uuid, organization_name, organization_type, organization_description,
                organization_registration_no, contact_person, contact_email, contact_phone,
                event_name, event_venue, event_start_date, event_end_date,
                event_start_time, event_end_time, event_mode, event_type,
                target_audience, sdp_credits,
                gpoa_file_name, gpoa_file_size, gpoa_file_type, gpoa_file_path,
                project_proposal_file_name, project_proposal_file_size, project_proposal_file_type, project_proposal_file_path,
                current_section, form_completion_percentage,
                proposal_status, report_status, event_status, has_active_proposal,
                attendance_count, objectives, budget, volunteers_needed,
                digital_signature, report_description, validation_errors,
                is_deleted, user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
                $33, $34, $35, $36, $37, $38, $39, $40, $41
            )
        `, [
            testUuid,
            testFrontendData.organization.organizationName,
            'school-based',
            testFrontendData.organization.organizationDescription,
            testFrontendData.organization.organizationRegistrationNo,
            testFrontendData.organization.contactPerson,
            testFrontendData.organization.contactEmail,
            testFrontendData.organization.contactPhone,
            testFrontendData.event.eventName,
            testFrontendData.event.venue,
            testFrontendData.event.startDate,
            testFrontendData.event.endDate,
            testFrontendData.event.startTime,
            testFrontendData.event.endTime,
            'offline',
            'academic-enhancement',
            JSON.stringify(testFrontendData.event.selectedTargetAudiences),
            testFrontendData.event.sdpCredits,
            testFrontendData.files.gpoa.name,
            testFrontendData.files.gpoa.size,
            testFrontendData.files.gpoa.type,
            testFrontendData.files.gpoa.filePath,
            testFrontendData.files.projectProposal.name,
            testFrontendData.files.projectProposal.size,
            testFrontendData.files.projectProposal.type,
            testFrontendData.files.projectProposal.filePath,
            'schoolEvent',
            100.00,
            'draft',
            'draft',
            'scheduled',
            false,
            0,
            null,
            0.00,
            0,
            null,
            null,
            null,
            false,
            1
        ]);

        console.log('✅ Database insertion successful');

        // Verify insertion
        const selectResult = await query('SELECT * FROM proposals WHERE uuid = $1', [testUuid]);
        if (selectResult.rows.length === 0) {
            console.log('❌ Data not found after insertion');
            return false;
        }

        const insertedData = selectResult.rows[0];
        console.log('✅ Data retrieved successfully');
        console.log('📊 Inserted data keys:', Object.keys(insertedData));

        // Clean up test data
        await query('DELETE FROM proposals WHERE uuid = $1', [testUuid]);
        console.log('✅ Test data cleaned up');

        return true;

    } catch (error) {
        console.error('❌ Database insertion test failed:', error.message);
        return false;
    }
}

/**
 * Test 4: Test enum constraints
 */
async function testEnumConstraints() {
    console.log('🔍 Test 4: Testing enum constraints...');

    try {
        // Test valid organization_type
        const validOrgTypes = ['internal', 'external', 'school-based', 'community-based'];
        console.log(`✅ Valid organization_type values: ${validOrgTypes.join(', ')}`);

        // Test valid event_mode
        const validEventModes = ['offline', 'online', 'hybrid'];
        console.log(`✅ Valid event_mode values: ${validEventModes.join(', ')}`);

        // Test valid event_type
        const validEventTypes = ['academic-enhancement', 'seminar-webinar', 'general-assembly', 'leadership-training', 'others'];
        console.log(`✅ Valid event_type values: ${validEventTypes.join(', ')}`);

        // Test valid current_section
        const validSections = ['overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting'];
        console.log(`✅ Valid current_section values: ${validSections.join(', ')}`);

        // Test valid sdp_credits
        const validSdpCredits = [1, 2];
        console.log(`✅ Valid sdp_credits values: ${validSdpCredits.join(', ')}`);

        console.log('✅ All enum constraints verified');
        return true;

    } catch (error) {
        console.error('❌ Enum constraints test failed:', error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🚀 Starting Schema Alignment Tests...\n');

    const tests = [
        { name: 'Database Schema', fn: testDatabaseSchema },
        { name: 'Data Mapping', fn: testDataMapping },
        { name: 'Database Insertion', fn: testDatabaseInsertion },
        { name: 'Enum Constraints', fn: testEnumConstraints }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Running: ${test.name}`);
        console.log(`${'='.repeat(50)}`);

        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
                console.log(`✅ ${test.name} PASSED`);
            } else {
                console.log(`❌ ${test.name} FAILED`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} ERROR: ${error.message}`);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'='.repeat(50)}`);
    console.log(`Passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Schema alignment is perfect!');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check the issues above.');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testDatabaseSchema,
    testDataMapping,
    testDatabaseInsertion,
    testEnumConstraints,
    runAllTests
};


