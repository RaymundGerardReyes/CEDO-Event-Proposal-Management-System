#!/usr/bin/env node

/**
 * Test File Fields in Database
 * 
 * This script tests if file fields are properly stored in the database
 */

const { pool, query } = require('./config/database-postgresql-only');

async function testFileFields() {
    console.log('🔧 Testing File Fields in Database...');
    console.log('====================================');

    try {
        // Test 1: Check if any proposals have file information
        console.log('\n1. 📋 Checking proposals with file information...');
        const fileCheckResult = await query(`
            SELECT 
                id, 
                uuid, 
                event_name,
                gpoa_file_name,
                gpoa_file_size,
                gpoa_file_type,
                project_proposal_file_name,
                project_proposal_file_size,
                project_proposal_file_type
            FROM proposals 
            WHERE (gpoa_file_name IS NOT NULL OR project_proposal_file_name IS NOT NULL)
            LIMIT 5
        `);

        console.log(`✅ Found ${fileCheckResult.rows.length} proposals with file information:`);
        fileCheckResult.rows.forEach((proposal, index) => {
            console.log(`   ${index + 1}. ID: ${proposal.id}, Event: ${proposal.event_name}`);
            console.log(`      GPOA File: ${proposal.gpoa_file_name || 'NULL'}`);
            console.log(`      Project File: ${proposal.project_proposal_file_name || 'NULL'}`);
        });

        // Test 2: Check all proposals for file fields
        console.log('\n2. 📊 Checking all proposals for file fields...');
        const allProposalsResult = await query(`
            SELECT 
                id, 
                event_name,
                gpoa_file_name,
                project_proposal_file_name
            FROM proposals 
            ORDER BY id DESC
            LIMIT 10
        `);

        console.log(`📋 File field analysis for ${allProposalsResult.rows.length} recent proposals:`);
        allProposalsResult.rows.forEach((proposal, index) => {
            const hasGpoa = proposal.gpoa_file_name ? '✓' : '✗';
            const hasProject = proposal.project_proposal_file_name ? '✓' : '✗';
            console.log(`   ${index + 1}. ID: ${proposal.id} | GPOA: ${hasGpoa} | Project: ${hasProject}`);
        });

        // Test 3: Check specific proposal by UUID
        console.log('\n3. 🎯 Testing specific proposal by UUID...');
        const uuidResult = await query(`
            SELECT 
                id, 
                uuid, 
                event_name,
                gpoa_file_name,
                project_proposal_file_name
            FROM proposals 
            WHERE uuid IS NOT NULL 
            LIMIT 1
        `);

        if (uuidResult.rows.length > 0) {
            const testProposal = uuidResult.rows[0];
            console.log(`✅ Testing proposal: ${testProposal.event_name}`);
            console.log(`   UUID: ${testProposal.uuid}`);
            console.log(`   GPOA File: ${testProposal.gpoa_file_name || 'NULL'}`);
            console.log(`   Project File: ${testProposal.project_proposal_file_name || 'NULL'}`);
        }

        // Test 4: Check if files are being created in the files array
        console.log('\n4. 📁 Testing file array creation...');
        const fileArrayResult = await query(`
            SELECT 
                id,
                event_name,
                gpoa_file_name,
                gpoa_file_size,
                gpoa_file_type,
                project_proposal_file_name,
                project_proposal_file_size,
                project_proposal_file_type
            FROM proposals 
            WHERE id = $1
        `, [1]);

        if (fileArrayResult.rows.length > 0) {
            const proposal = fileArrayResult.rows[0];
            console.log('✅ File array creation test:');

            const files = [];
            if (proposal.gpoa_file_name) {
                files.push({
                    id: `gpoa-${proposal.id}`,
                    name: proposal.gpoa_file_name,
                    size: proposal.gpoa_file_size ? `${(proposal.gpoa_file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                    type: proposal.gpoa_file_type || 'application/pdf',
                    fileType: 'gpoa'
                });
            }
            if (proposal.project_proposal_file_name) {
                files.push({
                    id: `project-${proposal.id}`,
                    name: proposal.project_proposal_file_name,
                    size: proposal.project_proposal_file_size ? `${(proposal.project_proposal_file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
                    type: proposal.project_proposal_file_type || 'application/pdf',
                    fileType: 'projectProposal'
                });
            }

            console.log(`   Files array length: ${files.length}`);
            files.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.name} (${file.size})`);
            });
        }

        console.log('\n🎉 File Fields Test Complete!');
        console.log('==============================');
        console.log('✅ Database file fields checked');
        console.log('✅ File array creation tested');
        console.log('✅ UUID-based file retrieval tested');

        console.log('\n🔍 Expected Results:');
        console.log('====================');
        console.log('✅ If files exist in database: Should show file names');
        console.log('✅ If no files in database: Should show "Not provided"');
        console.log('✅ File array should be created correctly');
        console.log('✅ Frontend should display file status correctly');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('   - Error message:', error.message);
        console.error('   - Error code:', error.code);
    } finally {
        await pool.end();
    }
}

// Run the test
testFileFields();





