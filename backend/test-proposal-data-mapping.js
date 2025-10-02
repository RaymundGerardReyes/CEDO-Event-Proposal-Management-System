#!/usr/bin/env node

/**
 * Test Proposal Data Mapping
 * This script tests what data is actually being returned by the API
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

async function testProposalDataMapping() {
    console.log('🧪 Testing Proposal Data Mapping...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Get a sample proposal with all fields
        console.log('\n📋 Getting sample proposal data...');
        const result = await pool.query(`
            SELECT 
                id,
                uuid,
                event_name,
                organization_name,
                organization_description,
                objectives,
                contact_person,
                contact_email,
                contact_phone,
                proposal_status,
                event_start_date,
                event_end_date,
                event_type,
                event_venue,
                budget,
                volunteers_needed,
                attendance_count,
                sdp_credits,
                gpoa_file_name,
                project_proposal_file_name,
                created_at,
                updated_at
            FROM proposals 
            ORDER BY created_at DESC 
            LIMIT 3;
        `);

        if (result.rows.length > 0) {
            console.log(`\n📊 Found ${result.rows.length} proposals:`);

            result.rows.forEach((proposal, index) => {
                console.log(`\n${index + 1}. ${proposal.event_name}:`);
                console.log(`   ID: ${proposal.id}`);
                console.log(`   Organization: ${proposal.organization_name}`);
                console.log(`   Organization Description: "${proposal.organization_description || 'NULL'}"`);
                console.log(`   Objectives: "${proposal.objectives || 'NULL'}"`);
                console.log(`   Contact: ${proposal.contact_person} (${proposal.contact_email})`);
                console.log(`   Status: ${proposal.proposal_status}`);
                console.log(`   Event Date: ${proposal.event_start_date}`);
                console.log(`   Event Type: ${proposal.event_type}`);
                console.log(`   Event Venue: ${proposal.event_venue}`);
                console.log(`   Budget: ${proposal.budget}`);
                console.log(`   Volunteers: ${proposal.volunteers_needed}`);
                console.log(`   Attendance: ${proposal.attendance_count}`);
                console.log(`   SDP Credits: ${proposal.sdp_credits}`);
                console.log(`   GPOA File: ${proposal.gpoa_file_name || 'None'}`);
                console.log(`   Project File: ${proposal.project_proposal_file_name || 'None'}`);
                console.log(`   Created: ${proposal.created_at}`);
            });

            // Test the exact API query
            console.log('\n🧪 Testing API query result...');
            const apiResult = await pool.query(`
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
                LIMIT 1;
            `);

            if (apiResult.rows.length > 0) {
                const proposal = apiResult.rows[0];
                console.log('\n📊 API Query Result:');
                console.log(`   Event Name: "${proposal.event_name}"`);
                console.log(`   Organization: "${proposal.organization_name}"`);
                console.log(`   Organization Description: "${proposal.organization_description || 'NULL'}"`);
                console.log(`   Objectives: "${proposal.objectives || 'NULL'}"`);
                console.log(`   Event Date: "${proposal.event_start_date}"`);
                console.log(`   Event Type: "${proposal.event_type}"`);
                console.log(`   Status: "${proposal.proposal_status}"`);
                console.log(`   File Count: ${proposal.file_count}`);
                console.log(`   User: "${proposal.user_name || 'NULL'}"`);

                // Test what the frontend would receive
                console.log('\n🎯 Frontend Mapping Test:');
                const frontendProposal = {
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
                    type: proposal.event_type,
                    description: proposal.organization_description || proposal.objectives || '',
                    location: proposal.event_venue,
                    budget: proposal.budget,
                    files: [],
                    hasFiles: proposal.file_count > 0,
                    fileCount: proposal.file_count
                };

                console.log('   Mapped Description:', `"${frontendProposal.description}"`);
                console.log('   Mapped Date:', `"${frontendProposal.date}"`);
                console.log('   Has Files:', frontendProposal.hasFiles);
                console.log('   File Count:', frontendProposal.fileCount);
            }

        } else {
            console.log('❌ No proposals found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run the test
if (require.main === module) {
    testProposalDataMapping().catch(console.error);
}

module.exports = { testProposalDataMapping };






