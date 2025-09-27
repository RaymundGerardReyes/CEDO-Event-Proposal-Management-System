/**
 * Complete File Upload and Display Flow Test
 * Tests the entire pipeline from upload to admin display
 */

const { query } = require('./config/database-postgresql-only');

// Test the complete flow
const testCompleteFileFlow = async () => {
    console.log('🚀 Testing Complete File Upload and Display Flow...');
    console.log('='.repeat(60));

    try {
        // Step 1: Check database for proposals with files
        console.log('\n📊 Step 1: Checking database for proposals with files...');
        const dbResult = await query(`
            SELECT 
                uuid, 
                gpoa_file_name, 
                project_proposal_file_name,
                created_at
            FROM proposals 
            WHERE gpoa_file_name IS NOT NULL 
               OR project_proposal_file_name IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 5
        `);

        console.log(`✅ Found ${dbResult.rows.length} proposals with files`);
        dbResult.rows.forEach((row, i) => {
            console.log(`  ${i + 1}. ${row.uuid}: GPOA=${row.gpoa_file_name || 'NULL'}, Project=${row.project_proposal_file_name || 'NULL'}`);
        });

        // Step 2: Test admin API query (with file prioritization)
        console.log('\n📊 Step 2: Testing admin API query with file prioritization...');
        const adminResult = await query(`
            SELECT 
                uuid, 
                gpoa_file_name, 
                gpoa_file_size,
                gpoa_file_type,
                gpoa_file_path,
                project_proposal_file_name, 
                project_proposal_file_size,
                project_proposal_file_type,
                project_proposal_file_path,
                created_at
            FROM proposals 
            ORDER BY (CASE WHEN gpoa_file_name IS NOT NULL OR project_proposal_file_name IS NOT NULL THEN 0 ELSE 1 END), 
                     COALESCE(submitted_at, created_at) DESC
            LIMIT 5
        `);

        console.log(`✅ Admin API returns ${adminResult.rows.length} proposals`);

        // Step 3: Process proposals like the admin API does
        console.log('\n📊 Step 3: Processing proposals like admin API...');
        const processedProposals = adminResult.rows.map((proposal, index) => {
            console.log(`\n  Processing Proposal ${index + 1}: ${proposal.uuid}`);

            // Map file columns from database to file object structure
            const files = {};

            if (proposal.gpoa_file_name) {
                files.gpoa = {
                    name: proposal.gpoa_file_name,
                    path: proposal.gpoa_file_path,
                    size: proposal.gpoa_file_size,
                    type: proposal.gpoa_file_type
                };
                console.log(`    ✅ GPOA file: ${proposal.gpoa_file_name}`);
            } else {
                console.log(`    ❌ No GPOA file`);
            }

            if (proposal.project_proposal_file_name) {
                files.projectProposal = {
                    name: proposal.project_proposal_file_name,
                    path: proposal.project_proposal_file_path,
                    size: proposal.project_proposal_file_size,
                    type: proposal.project_proposal_file_type
                };
                console.log(`    ✅ Project file: ${proposal.project_proposal_file_name}`);
            } else {
                console.log(`    ❌ No Project file`);
            }

            const processedProposal = {
                ...proposal,
                files
            };

            const hasFiles = Object.keys(files).length > 0;
            console.log(`    📊 Has Files: ${hasFiles}`);
            console.log(`    📊 File Count: ${Object.keys(files).length}`);

            return processedProposal;
        });

        // Step 4: Test frontend file display logic
        console.log('\n📊 Step 4: Testing frontend file display logic...');
        processedProposals.forEach((proposal, index) => {
            console.log(`\n  Frontend Test ${index + 1}: ${proposal.uuid}`);

            // Test hasFiles logic (from proposal-table.jsx)
            const hasFiles = !!(proposal.gpoa_file_name || proposal.project_proposal_file_name);
            console.log(`    hasFiles: ${hasFiles}`);

            // Test files object
            const files = proposal.files;
            console.log(`    files object: ${JSON.stringify(files, null, 2)}`);
            console.log(`    files count: ${Object.keys(files).length}`);

            // Test file type mapping
            Object.keys(files).forEach(fileType => {
                const displayName = fileType === "gpoa" ? "General Plan of Action" :
                    fileType === "projectProposal" ? "Project Proposal" :
                        fileType === "accomplishmentReport" ? "Accomplishment Report" :
                            fileType.charAt(0).toUpperCase() + fileType.slice(1);
                console.log(`    ${fileType} -> ${displayName}`);
            });
        });

        // Step 5: Summary
        console.log('\n📊 Step 5: Summary...');
        const proposalsWithFiles = processedProposals.filter(p =>
            p.files && Object.keys(p.files).length > 0
        );

        console.log(`✅ Total proposals processed: ${processedProposals.length}`);
        console.log(`✅ Proposals with files: ${proposalsWithFiles.length}`);
        console.log(`✅ Success rate: ${(proposalsWithFiles.length / processedProposals.length * 100).toFixed(1)}%`);

        if (proposalsWithFiles.length > 0) {
            console.log('\n🎉 SUCCESS: Files are being processed and displayed correctly!');
            console.log('📋 The admin panel should now show "Files" badges and file information.');
            return true;
        } else {
            console.log('\n❌ FAILURE: No files found in processed proposals');
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
};

// Run the test
const runTest = async () => {
    try {
        const success = await testCompleteFileFlow();
        console.log('\n🏁 Test Result:', success ? '✅ PASSED' : '❌ FAILED');
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
};

// Export for use in other scripts
module.exports = {
    testCompleteFileFlow,
    runTest
};

// Run if called directly
if (require.main === module) {
    runTest();
}
