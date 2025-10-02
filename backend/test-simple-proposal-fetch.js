#!/usr/bin/env node

/**
 * Simple Proposal Fetch Test
 * Tests the backend with your exact database schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
};

async function testSimpleProposalFetch() {
    console.log('🧪 Testing Simple Proposal Fetch...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Test the exact query from your backend
        console.log('\n📋 Testing main proposals query...');
        const result = await pool.query(`
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
            LIMIT 5;
        `);

        if (result.rows.length > 0) {
            console.log(`\n✅ Found ${result.rows.length} proposals:`);

            result.rows.forEach((proposal, index) => {
                console.log(`\n${index + 1}. ${proposal.event_name}:`);
                console.log(`   Organization: ${proposal.organization_name}`);
                console.log(`   Contact: ${proposal.contact_person} (${proposal.contact_email})`);
                console.log(`   Status: ${proposal.proposal_status}`);
                console.log(`   Date: ${proposal.event_start_date}`);
                console.log(`   Type: ${proposal.event_type}`);
                console.log(`   Files: ${proposal.file_count}`);
                console.log(`   Description: "${proposal.organization_description || proposal.objectives || 'N/A'}"`);
                console.log(`   Objectives: "${proposal.objectives || 'N/A'}"`);
                console.log(`   Budget: ${proposal.budget}`);
                console.log(`   Volunteers: ${proposal.volunteers_needed}`);
                console.log(`   SDP Credits: ${proposal.sdp_credits}`);
            });

            // Test the processed data mapping
            console.log('\n🎯 Testing Frontend Mapping:');
            const sampleProposal = result.rows[0];

            const mappedProposal = {
                id: sampleProposal.id,
                uuid: sampleProposal.uuid,
                eventName: sampleProposal.event_name,
                organization: sampleProposal.organization_name,
                organizationType: sampleProposal.organization_type,
                contact: {
                    name: sampleProposal.contact_person,
                    email: sampleProposal.contact_email,
                    phone: sampleProposal.contact_phone
                },
                status: sampleProposal.proposal_status,
                date: sampleProposal.event_start_date,
                type: sampleProposal.event_type,
                description: sampleProposal.organization_description || sampleProposal.objectives || `Event: ${sampleProposal.event_name}`,
                location: sampleProposal.event_venue,
                budget: sampleProposal.budget,
                volunteersNeeded: sampleProposal.volunteers_needed,
                attendanceCount: sampleProposal.attendance_count,
                sdpCredits: sampleProposal.sdp_credits,
                hasFiles: sampleProposal.file_count > 0,
                fileCount: sampleProposal.file_count
            };

            console.log('\n📊 Mapped Proposal Data:');
            console.log(`   Event Name: "${mappedProposal.eventName}"`);
            console.log(`   Organization: "${mappedProposal.organization}"`);
            console.log(`   Description: "${mappedProposal.description}"`);
            console.log(`   Date: "${mappedProposal.date}"`);
            console.log(`   Status: "${mappedProposal.status}"`);
            console.log(`   Type: "${mappedProposal.type}"`);
            console.log(`   Has Files: ${mappedProposal.hasFiles} (${mappedProposal.fileCount})`);
            console.log(`   Budget: ${mappedProposal.budget}`);
            console.log(`   Volunteers: ${mappedProposal.volunteersNeeded}`);
            console.log(`   SDP Credits: ${mappedProposal.sdpCredits}`);

        } else {
            console.log('❌ No proposals found');
        }

        console.log('\n✅ Simple test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

if (require.main === module) {
    testSimpleProposalFetch().catch(console.error);
}

module.exports = { testSimpleProposalFetch };






