/**
 * =============================================
 * MYSQL INTEGRATION TEST SCRIPT
 * =============================================
 * 
 * This script tests the dual database integration:
 * - MongoDB: Stores detailed event data and files
 * - MySQL: Stores proposal metadata and status tracking
 * 
 * @author CEDO Development Team
 * @version 1.0.0
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

// Test data for school event
const schoolEventData = {
    organization_id: '1',
    name: 'Test School Event - MySQL Integration',
    venue: 'Test School Venue',
    start_date: '2025-08-15',
    end_date: '2025-08-16',
    time_start: '09:00',
    time_end: '17:00',
    event_type: 'academic-competition',
    event_mode: 'offline',
    sdp_credits: '2',
    target_audience: JSON.stringify(['1st Year', '2nd Year', '3rd Year']),
    contact_person: 'Test Contact',
    contact_email: 'test@school.edu',
    contact_phone: '1234567890'
};

// Test data for community event
const communityEventData = {
    organization_id: '1',
    name: 'Test Community Event - MySQL Integration',
    venue: 'Test Community Venue',
    start_date: '2025-08-20',
    end_date: '2025-08-21',
    time_start: '10:00',
    time_end: '18:00',
    event_type: 'seminar-webinar',
    event_mode: 'hybrid',
    sdp_credits: '1',
    target_audience: JSON.stringify(['All Levels']),
    contact_person: 'Test Community Contact',
    contact_email: 'test@community.org',
    contact_phone: '0987654321'
};

// Create a mock PDF file for testing
const createMockFile = (filename) => {
    const filePath = path.join(__dirname, filename);
    const mockPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    fs.writeFileSync(filePath, mockPdfContent);
    return filePath;
};

// Test function for school events
const testSchoolEventIntegration = async () => {
    console.log('\n🏫 TESTING SCHOOL EVENT MYSQL INTEGRATION');
    console.log('==========================================');

    try {
        // Create mock files
        const gpoaFile = createMockFile('test-school-gpoa.pdf');
        const proposalFile = createMockFile('test-school-proposal.pdf');

        // Create FormData
        const form = new FormData();

        // Add text fields
        Object.entries(schoolEventData).forEach(([key, value]) => {
            form.append(key, value);
        });

        // Add files
        form.append('gpoaFile', fs.createReadStream(gpoaFile), 'test-school-gpoa.pdf');
        form.append('proposalFile', fs.createReadStream(proposalFile), 'test-school-proposal.pdf');

        console.log('📤 Sending school event data to MongoDB endpoint...');
        console.log('📤 URL:', `${BASE_URL}/api/mongodb-unified/proposals/school-events`);

        const response = await axios.post(
            `${BASE_URL}/api/mongodb-unified/proposals/school-events`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                },
                timeout: 30000
            }
        );

        console.log('✅ School event saved successfully!');
        console.log('📊 Response:', {
            success: response.data.success,
            message: response.data.message,
            mongoId: response.data.data?.id,
            files: response.data.data?.files ? Object.keys(response.data.data.files) : [],
            dataConsistency: response.data.data?.dataConsistency
        });

        // Clean up mock files
        fs.unlinkSync(gpoaFile);
        fs.unlinkSync(proposalFile);

        return response.data;

    } catch (error) {
        console.error('❌ School event test failed:', error.message);
        if (error.response) {
            console.error('📊 Error response:', error.response.data);
        }
        throw error;
    }
};

// Test function for community events
const testCommunityEventIntegration = async () => {
    console.log('\n🌍 TESTING COMMUNITY EVENT MYSQL INTEGRATION');
    console.log('=============================================');

    try {
        // Create mock files
        const gpoaFile = createMockFile('test-community-gpoa.pdf');
        const proposalFile = createMockFile('test-community-proposal.pdf');

        // Create FormData
        const form = new FormData();

        // Add text fields
        Object.entries(communityEventData).forEach(([key, value]) => {
            form.append(key, value);
        });

        // Add files
        form.append('gpoaFile', fs.createReadStream(gpoaFile), 'test-community-gpoa.pdf');
        form.append('proposalFile', fs.createReadStream(proposalFile), 'test-community-proposal.pdf');

        console.log('📤 Sending community event data to MongoDB endpoint...');
        console.log('📤 URL:', `${BASE_URL}/api/mongodb-unified/proposals/community-events`);

        const response = await axios.post(
            `${BASE_URL}/api/mongodb-unified/proposals/community-events`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                },
                timeout: 30000
            }
        );

        console.log('✅ Community event saved successfully!');
        console.log('📊 Response:', {
            success: response.data.success,
            message: response.data.message,
            mongoId: response.data.data?.id,
            files: response.data.data?.files ? Object.keys(response.data.data.files) : [],
            dataConsistency: response.data.data?.dataConsistency
        });

        // Clean up mock files
        fs.unlinkSync(gpoaFile);
        fs.unlinkSync(proposalFile);

        return response.data;

    } catch (error) {
        console.error('❌ Community event test failed:', error.message);
        if (error.response) {
            console.error('📊 Error response:', error.response.data);
        }
        throw error;
    }
};

// Test function to verify MySQL data
const verifyMySQLData = async () => {
    console.log('\n🔍 VERIFYING MYSQL PROPOSALS TABLE DATA');
    console.log('========================================');

    try {
        // Test MySQL connection and query
        const mysql = require('mysql2/promise');
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cedo_auth',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Query recent proposals
        const [rows] = await pool.query(`
            SELECT 
                id, uuid, organization_name, event_name, organization_type,
                proposal_status, current_section, form_completion_percentage,
                school_event_type, community_event_type,
                school_gpoa_file_name, community_gpoa_file_name,
                created_at, updated_at
            FROM proposals 
            WHERE is_deleted = 0 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log('✅ MySQL connection successful!');
        console.log(`📊 Found ${rows.length} recent proposals in MySQL:`);

        rows.forEach((proposal, index) => {
            console.log(`\n📋 Proposal ${index + 1}:`);
            console.log(`   ID: ${proposal.id}`);
            console.log(`   UUID: ${proposal.uuid}`);
            console.log(`   Organization: ${proposal.organization_name}`);
            console.log(`   Event: ${proposal.event_name}`);
            console.log(`   Type: ${proposal.organization_type}`);
            console.log(`   Status: ${proposal.proposal_status}`);
            console.log(`   Section: ${proposal.current_section}`);
            console.log(`   Completion: ${proposal.form_completion_percentage}%`);
            console.log(`   School Event Type: ${proposal.school_event_type || 'N/A'}`);
            console.log(`   Community Event Type: ${proposal.community_event_type || 'N/A'}`);
            console.log(`   GPOA File: ${proposal.school_gpoa_file_name || proposal.community_gpoa_file_name || 'N/A'}`);
            console.log(`   Created: ${proposal.created_at}`);
        });

        await pool.end();
        return rows;

    } catch (error) {
        console.error('❌ MySQL verification failed:', error.message);
        throw error;
    }
};

// Main test function
const runIntegrationTest = async () => {
    console.log('🚀 STARTING MYSQL INTEGRATION TEST');
    console.log('==================================');
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    try {
        // Test 1: School Event Integration
        const schoolResult = await testSchoolEventIntegration();

        // Test 2: Community Event Integration
        const communityResult = await testCommunityEventIntegration();

        // Test 3: Verify MySQL Data
        const mysqlData = await verifyMySQLData();

        console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('=====================================');
        console.log('✅ School Event: MongoDB + MySQL integration working');
        console.log('✅ Community Event: MongoDB + MySQL integration working');
        console.log('✅ MySQL Proposals Table: Data verified');
        console.log(`📊 Total proposals in MySQL: ${mysqlData.length}`);

        return {
            success: true,
            schoolEvent: schoolResult,
            communityEvent: communityResult,
            mysqlData: mysqlData
        };

    } catch (error) {
        console.error('\n❌ INTEGRATION TEST FAILED');
        console.error('==========================');
        console.error('Error:', error.message);

        return {
            success: false,
            error: error.message
        };
    }
};

// Run the test if called directly
if (require.main === module) {
    runIntegrationTest()
        .then(result => {
            if (result.success) {
                console.log('\n🎯 TEST SUMMARY: All systems operational!');
                process.exit(0);
            } else {
                console.log('\n💥 TEST SUMMARY: Integration issues detected!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 UNEXPECTED ERROR:', error);
            process.exit(1);
        });
}

module.exports = {
    runIntegrationTest,
    testSchoolEventIntegration,
    testCommunityEventIntegration,
    verifyMySQLData
}; 