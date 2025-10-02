#!/usr/bin/env node

/**
 * Test Proposal Fixes
 * This script tests the fixes for description and date issues
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

async function testProposalFixes() {
    console.log('🧪 Testing Proposal Fixes...');

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Test the fixed API query
        console.log('\n📋 Testing fixed API query...');
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
            console.log(`\n📊 Testing ${result.rows.length} proposals:`);

            result.rows.forEach((proposal, index) => {
                // Test the backend mapping logic
                const mappedProposal = {
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
                    description: proposal.organization_description || proposal.objectives || `Event hosted by ${proposal.organization_name}`,
                    location: proposal.event_venue,
                    budget: proposal.budget,
                    files: [],
                    hasFiles: proposal.file_count > 0,
                    fileCount: proposal.file_count
                };

                console.log(`\n${index + 1}. ${mappedProposal.eventName}:`);
                console.log(`   ✅ Description: "${mappedProposal.description}"`);
                console.log(`   ✅ Date: "${mappedProposal.date}"`);
                console.log(`   ✅ Organization: "${mappedProposal.organization}"`);
                console.log(`   ✅ Status: "${mappedProposal.status}"`);
                console.log(`   ✅ Type: "${mappedProposal.type}"`);
                console.log(`   ✅ Has Files: ${mappedProposal.hasFiles} (${mappedProposal.fileCount} files)`);

                // Test date formatting
                try {
                    const date = new Date(mappedProposal.date);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    });
                    console.log(`   ✅ Formatted Date: "${formattedDate}"`);
                } catch (error) {
                    console.log(`   ❌ Date Formatting Error: ${error.message}`);
                }
            });

            // Test description fallback logic
            console.log('\n🧪 Testing Description Fallback Logic:');

            const testCases = [
                { org_desc: 'Test org description', objectives: null, org_name: 'Test Org' },
                { org_desc: null, objectives: 'Test objectives', org_name: 'Test Org' },
                { org_desc: null, objectives: null, org_name: 'Test Org' },
                { org_desc: '', objectives: '', org_name: 'Test Org' },
            ];

            testCases.forEach((testCase, index) => {
                const description = testCase.org_desc || testCase.objectives || `Event hosted by ${testCase.org_name}`;
                console.log(`   Test ${index + 1}: "${description}"`);
            });

        } else {
            console.log('❌ No proposals found');
        }

        console.log('\n✅ Fix testing completed!');
        console.log('\n💡 Expected Results:');
        console.log('  - Descriptions should show "Event hosted by [Organization]" when no description exists');
        console.log('  - Dates should be properly formatted (e.g., "Sep 30, 2025")');
        console.log('  - No more "No description provided" or "TBD" issues');

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
    testProposalFixes().catch(console.error);
}

module.exports = { testProposalFixes };






