/**
 * API Response Testing Script
 * Tests the complete API response chain for file display
 */

const { query } = require('./config/database-postgresql-only');

// Test 1: Check Database File Storage
const testDatabaseFileStorage = async () => {
    console.log('🧪 Test 1: Checking database file storage...');

    try {
        // Get all proposals with file information
        const result = await query(`
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
                proposal_status,
                created_at
            FROM proposals 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log('📊 Database Results:');
        result.rows.forEach((row, index) => {
            console.log(`\n  Proposal ${index + 1}:`);
            console.log(`    UUID: ${row.uuid}`);
            console.log(`    Status: ${row.proposal_status}`);
            console.log(`    GPOA File: ${row.gpoa_file_name || 'NULL'}`);
            console.log(`    Project File: ${row.project_proposal_file_name || 'NULL'}`);
            console.log(`    Has Files: ${!!(row.gpoa_file_name || row.project_proposal_file_name)}`);
        });

        return result.rows;
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        return [];
    }
};

// Test 2: Simulate Admin API Response Processing
const testAdminAPIProcessing = async () => {
    console.log('\n🧪 Test 2: Testing admin API processing...');

    try {
        // Simulate the admin API query
        const result = await query(`
            SELECT * FROM proposals 
            ORDER BY COALESCE(submitted_at, created_at) DESC 
            LIMIT 5
        `);

        console.log('📊 Raw Database Results:');
        result.rows.forEach((row, index) => {
            console.log(`\n  Proposal ${index + 1}:`);
            console.log(`    UUID: ${row.uuid}`);
            console.log(`    GPOA File Name: ${row.gpoa_file_name || 'NULL'}`);
            console.log(`    Project File Name: ${row.project_proposal_file_name || 'NULL'}`);
        });

        // Process proposals like the admin API does
        const processedProposals = result.rows.map((proposal, index) => {
            console.log(`\n  Processing Proposal ${index + 1}:`);

            // Map file columns from database to file object structure
            const files = {};

            if (proposal.gpoa_file_name) {
                files.gpoa = {
                    name: proposal.gpoa_file_name,
                    path: proposal.gpoa_file_path,
                    size: proposal.gpoa_file_size,
                    type: proposal.gpoa_file_type
                };
                console.log(`    ✅ GPOA file added: ${proposal.gpoa_file_name}`);
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
                console.log(`    ✅ Project file added: ${proposal.project_proposal_file_name}`);
            } else {
                console.log(`    ❌ No Project file`);
            }

            const processedProposal = {
                ...proposal,
                files
            };

            console.log(`    📊 Final Files Object:`, JSON.stringify(files, null, 2));
            console.log(`    📊 Has Files: ${Object.keys(files).length > 0}`);

            return processedProposal;
        });

        return processedProposals;
    } catch (error) {
        console.error('❌ Admin API processing test failed:', error.message);
        return [];
    }
};

// Test 3: Test File Upload Endpoint Logic
const testFileUploadLogic = async () => {
    console.log('\n🧪 Test 3: Testing file upload logic...');

    try {
        // Check if there are any proposals with files
        const result = await query(`
            SELECT 
                uuid,
                gpoa_file_name,
                project_proposal_file_name,
                created_at
            FROM proposals 
            WHERE gpoa_file_name IS NOT NULL 
               OR project_proposal_file_name IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 3
        `);

        if (result.rows.length === 0) {
            console.log('❌ No proposals with files found in database');
            console.log('💡 This suggests file uploads are not working');
            return false;
        }

        console.log('✅ Found proposals with files:');
        result.rows.forEach((row, index) => {
            console.log(`\n  Proposal ${index + 1}:`);
            console.log(`    UUID: ${row.uuid}`);
            console.log(`    GPOA: ${row.gpoa_file_name || 'NULL'}`);
            console.log(`    Project: ${row.project_proposal_file_name || 'NULL'}`);
        });

        return true;
    } catch (error) {
        console.error('❌ File upload logic test failed:', error.message);
        return false;
    }
};

// Test 4: Test Complete API Response Chain
const testCompleteAPIResponseChain = async () => {
    console.log('\n🧪 Test 4: Testing complete API response chain...');

    try {
        // Step 1: Check database
        const dbResults = await testDatabaseFileStorage();

        // Step 2: Test admin processing
        const processedResults = await testAdminAPIProcessing();

        // Step 3: Test file upload logic
        const uploadResults = await testFileUploadLogic();

        // Summary
        console.log('\n📊 API Response Chain Summary:');
        console.log(`  Database Records: ${dbResults.length}`);
        console.log(`  Processed Records: ${processedResults.length}`);
        console.log(`  Upload Logic: ${uploadResults ? '✅ PASS' : '❌ FAIL'}`);

        // Check if any processed proposals have files
        const proposalsWithFiles = processedResults.filter(p =>
            p.files && Object.keys(p.files).length > 0
        );

        console.log(`  Proposals with Files: ${proposalsWithFiles.length}`);

        if (proposalsWithFiles.length > 0) {
            console.log('✅ Files are being processed correctly');
            return true;
        } else {
            console.log('❌ No files found in processed proposals');
            return false;
        }
    } catch (error) {
        console.error('❌ Complete API response chain test failed:', error.message);
        return false;
    }
};

// Test 5: Debug Specific Proposal
const debugSpecificProposal = async (uuid) => {
    console.log(`\n🧪 Test 5: Debugging specific proposal ${uuid}...`);

    try {
        const result = await query(`
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
                proposal_status,
                created_at,
                updated_at
            FROM proposals 
            WHERE uuid = $1
        `, [uuid]);

        if (result.rows.length === 0) {
            console.log('❌ Proposal not found');
            return false;
        }

        const proposal = result.rows[0];
        console.log('📊 Proposal Details:');
        console.log(`  UUID: ${proposal.uuid}`);
        console.log(`  Status: ${proposal.proposal_status}`);
        console.log(`  Created: ${proposal.created_at}`);
        console.log(`  Updated: ${proposal.updated_at}`);
        console.log(`  GPOA File: ${proposal.gpoa_file_name || 'NULL'}`);
        console.log(`  GPOA Size: ${proposal.gpoa_file_size || 'NULL'}`);
        console.log(`  GPOA Type: ${proposal.gpoa_file_type || 'NULL'}`);
        console.log(`  GPOA Path: ${proposal.gpoa_file_path || 'NULL'}`);
        console.log(`  Project File: ${proposal.project_proposal_file_name || 'NULL'}`);
        console.log(`  Project Size: ${proposal.project_proposal_file_size || 'NULL'}`);
        console.log(`  Project Type: ${proposal.project_proposal_file_type || 'NULL'}`);
        console.log(`  Project Path: ${proposal.project_proposal_file_path || 'NULL'}`);

        // Test file object construction
        const files = {};
        if (proposal.gpoa_file_name) {
            files.gpoa = {
                name: proposal.gpoa_file_name,
                path: proposal.gpoa_file_path,
                size: proposal.gpoa_file_size,
                type: proposal.gpoa_file_type
            };
        }
        if (proposal.project_proposal_file_name) {
            files.projectProposal = {
                name: proposal.project_proposal_file_name,
                path: proposal.project_proposal_file_path,
                size: proposal.project_proposal_file_size,
                type: proposal.project_proposal_file_type
            };
        }

        console.log('📊 Constructed Files Object:');
        console.log(JSON.stringify(files, null, 2));
        console.log(`📊 Has Files: ${Object.keys(files).length > 0}`);

        return Object.keys(files).length > 0;
    } catch (error) {
        console.error('❌ Debug specific proposal failed:', error.message);
        return false;
    }
};

// Run all tests
const runAPITests = async () => {
    console.log('🚀 Starting API Response Testing Suite...');
    console.log('='.repeat(60));

    try {
        // Run all tests
        await testCompleteAPIResponseChain();

        // Debug specific proposal if provided
        const testUUID = process.argv[2];
        if (testUUID) {
            await debugSpecificProposal(testUUID);
        }

        console.log('\n🏁 API Testing Complete');
    } catch (error) {
        console.error('❌ API testing failed:', error);
    }
};

// Export for use in other scripts
module.exports = {
    testDatabaseFileStorage,
    testAdminAPIProcessing,
    testFileUploadLogic,
    testCompleteAPIResponseChain,
    debugSpecificProposal,
    runAPITests
};

// Run if called directly
if (require.main === module) {
    runAPITests();
}
