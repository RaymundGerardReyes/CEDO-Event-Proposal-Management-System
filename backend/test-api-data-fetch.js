#!/usr/bin/env node

/**
 * Test API Data Fetching
 * 
 * This test verifies what data is actually being returned by the API
 * and helps debug why the frontend is showing "TBD" and empty values
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
};

async function testDatabaseData() {
    console.log('🔧 Testing Database Data...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Test connection
        console.log('🔌 Testing connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful!');

        // Get sample proposals with all fields
        console.log('\n📊 Fetching sample proposals...');
        const result = await pool.query(`
            SELECT 
                id,
                uuid,
                event_name,
                organization_name,
                organization_type,
                contact_person,
                contact_email,
                contact_phone,
                proposal_status,
                event_start_date,
                event_end_date,
                event_start_time,
                event_end_time,
                event_type,
                event_venue,
                budget,
                volunteers_needed,
                attendance_count,
                sdp_credits,
                objectives,
                admin_comments,
                created_at,
                updated_at,
                submitted_at,
                reviewed_at,
                approved_at
            FROM proposals 
            ORDER BY created_at DESC 
            LIMIT 3
        `);

        if (result.rows.length > 0) {
            console.log(`✅ Found ${result.rows.length} proposals`);

            result.rows.forEach((proposal, index) => {
                console.log(`\n📋 Proposal ${index + 1}:`);
                console.log(`   ID: ${proposal.id}`);
                console.log(`   UUID: ${proposal.uuid}`);
                console.log(`   Event Name: ${proposal.event_name || 'NULL'}`);
                console.log(`   Organization: ${proposal.organization_name || 'NULL'}`);
                console.log(`   Organization Type: ${proposal.organization_type || 'NULL'}`);
                console.log(`   Contact Person: ${proposal.contact_person || 'NULL'}`);
                console.log(`   Contact Email: ${proposal.contact_email || 'NULL'}`);
                console.log(`   Contact Phone: ${proposal.contact_phone || 'NULL'}`);
                console.log(`   Status: ${proposal.proposal_status || 'NULL'}`);
                console.log(`   Event Start Date: ${proposal.event_start_date || 'NULL'}`);
                console.log(`   Event End Date: ${proposal.event_end_date || 'NULL'}`);
                console.log(`   Event Start Time: ${proposal.event_start_time || 'NULL'}`);
                console.log(`   Event End Time: ${proposal.event_end_time || 'NULL'}`);
                console.log(`   Event Type: ${proposal.event_type || 'NULL'}`);
                console.log(`   Event Venue: ${proposal.event_venue || 'NULL'}`);
                console.log(`   Budget: ${proposal.budget || 'NULL'}`);
                console.log(`   Objectives: ${proposal.objectives || 'NULL'}`);
                console.log(`   Created At: ${proposal.created_at || 'NULL'}`);
                console.log(`   Submitted At: ${proposal.submitted_at || 'NULL'}`);
            });
        } else {
            console.log('⚠️  No proposals found in database');
        }

        // Test the exact query that the API uses
        console.log('\n🧪 Testing API Query...');
        const apiQuery = `
            SELECT p.*, 
                   u.name as user_name,
                   u.email as user_email,
                   CASE 
                       WHEN p.gpoa_file_name IS NOT NULL AND p.project_proposal_file_name IS NOT NULL THEN 2
                       WHEN p.gpoa_file_name IS NOT NULL OR p.project_proposal_file_name IS NOT NULL THEN 1
                       ELSE 0
                   END as file_count
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.submitted_at DESC
            LIMIT 3
        `;

        const apiResult = await pool.query(apiQuery);

        if (apiResult.rows.length > 0) {
            console.log(`✅ API query returned ${apiResult.rows.length} results`);

            const proposal = apiResult.rows[0];
            console.log('\n📊 Sample API Result:');
            console.log(`   ID: ${proposal.id}`);
            console.log(`   Event Name: ${proposal.event_name || 'NULL'}`);
            console.log(`   Organization: ${proposal.organization_name || 'NULL'}`);
            console.log(`   Status: ${proposal.proposal_status || 'NULL'}`);
            console.log(`   Date: ${proposal.event_start_date || 'NULL'}`);
            console.log(`   Type: ${proposal.organization_type || 'NULL'}`);
            console.log(`   File Count: ${proposal.file_count || 0}`);

            // Simulate the data transformation
            const transformedProposal = {
                id: proposal.id,
                uuid: proposal.uuid,
                eventName: proposal.event_name,
                organization: proposal.organization_name,
                organizationType: proposal.organization_type,
                contact: {
                    name: proposal.contact_person,
                    email: proposal.contact_email,
                    phone: proposal.contact_phone
                },
                status: proposal.proposal_status,
                date: proposal.event_start_date,
                type: proposal.organization_type,
                eventType: proposal.event_type,
                description: proposal.objectives || `Event: ${proposal.event_name}`,
                location: proposal.event_venue,
                budget: proposal.budget,
                volunteersNeeded: proposal.volunteers_needed,
                attendanceCount: proposal.attendance_count,
                sdpCredits: proposal.sdp_credits,
                startDate: proposal.event_start_date,
                endDate: proposal.event_end_date,
                startTime: proposal.event_start_time,
                endTime: proposal.event_end_time,
                createdAt: proposal.created_at,
                updatedAt: proposal.updated_at,
                submittedAt: proposal.submitted_at,
                reviewedAt: proposal.reviewed_at,
                approvedAt: proposal.approved_at
            };

            console.log('\n🔄 Transformed Data:');
            console.log(`   Event Name: ${transformedProposal.eventName || 'NULL'}`);
            console.log(`   Organization: ${transformedProposal.organization || 'NULL'}`);
            console.log(`   Contact: ${transformedProposal.contact?.name || 'NULL'} (${transformedProposal.contact?.email || 'NULL'})`);
            console.log(`   Status: ${transformedProposal.status || 'NULL'}`);
            console.log(`   Date: ${transformedProposal.date || 'NULL'}`);
            console.log(`   Type: ${transformedProposal.type || 'NULL'}`);
            console.log(`   Description: ${transformedProposal.description || 'NULL'}`);

            // Check for empty or null values that might cause "TBD" display
            const emptyFields = [];
            if (!transformedProposal.eventName) emptyFields.push('eventName');
            if (!transformedProposal.organization) emptyFields.push('organization');
            if (!transformedProposal.contact?.name) emptyFields.push('contact.name');
            if (!transformedProposal.contact?.email) emptyFields.push('contact.email');
            if (!transformedProposal.status) emptyFields.push('status');
            if (!transformedProposal.date) emptyFields.push('date');
            if (!transformedProposal.type) emptyFields.push('type');

            if (emptyFields.length > 0) {
                console.log(`\n⚠️  Empty fields that might cause "TBD" display: ${emptyFields.join(', ')}`);
            } else {
                console.log('\n✅ All required fields have data');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🧹 Database connection closed');
        }
    }
}

// Run the test
if (require.main === module) {
    testDatabaseData().catch(console.error);
}

module.exports = { testDatabaseData };





