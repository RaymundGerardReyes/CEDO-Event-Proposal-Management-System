/**
 * Frontend File Display Testing Utility
 * Tests the file display logic in proposal-table.jsx
 */

// Mock proposal data for testing
export const createMockProposal = (hasFiles = true) => {
    const baseProposal = {
        id: 1,
        uuid: 'test-uuid-123',
        organization_name: 'Test Organization',
        event_name: 'Test Event',
        proposal_status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (hasFiles) {
        return {
            ...baseProposal,
            gpoa_file_name: 'test-gpoa.pdf',
            gpoa_file_size: 1024,
            gpoa_file_type: 'application/pdf',
            gpoa_file_path: '/uploads/test-gpoa.pdf',
            project_proposal_file_name: 'test-proposal.pdf',
            project_proposal_file_size: 2048,
            project_proposal_file_type: 'application/pdf',
            project_proposal_file_path: '/uploads/test-proposal.pdf'
        };
    }

    return baseProposal;
};

// Test file detection logic
export const testFileDetection = (proposal) => {
    console.log('🧪 Testing file detection logic...');

    // Test hasFiles logic (from proposal-table.jsx)
    const hasFiles = !!(proposal.gpoa_file_name || proposal.project_proposal_file_name);
    console.log('  GPOA File Name:', proposal.gpoa_file_name || 'NULL');
    console.log('  Project File Name:', proposal.project_proposal_file_name || 'NULL');
    console.log('  Has Files:', hasFiles);

    return hasFiles;
};

// Test files object construction
export const testFilesObjectConstruction = (proposal) => {
    console.log('🧪 Testing files object construction...');

    // Construct files object (from proposal-table.jsx)
    const files = {
        ...(proposal.gpoa_file_name && {
            gpoa: {
                name: proposal.gpoa_file_name,
                size: proposal.gpoa_file_size,
                type: proposal.gpoa_file_type,
                path: proposal.gpoa_file_path
            }
        }),
        ...(proposal.project_proposal_file_name && {
            projectProposal: {
                name: proposal.project_proposal_file_name,
                size: proposal.project_proposal_file_size,
                type: proposal.project_proposal_file_type,
                path: proposal.project_proposal_file_path
            }
        })
    };

    console.log('  Constructed Files Object:', files);
    console.log('  File Count:', Object.keys(files).length);
    console.log('  Has Files:', Object.keys(files).length > 0);

    return files;
};

// Test file type mapping
export const testFileTypeMapping = (files) => {
    console.log('🧪 Testing file type mapping...');

    const fileTypeMap = {
        'gpoa': 'General Plan of Action',
        'projectProposal': 'Project Proposal',
        'accomplishmentReport': 'Accomplishment Report'
    };

    Object.keys(files).forEach(fileType => {
        const displayName = fileTypeMap[fileType] || fileType.charAt(0).toUpperCase() + fileType.slice(1);
        console.log(`  ${fileType} -> ${displayName}`);
    });

    return fileTypeMap;
};

// Test complete file display flow
export const testCompleteFileDisplay = () => {
    console.log('🧪 Testing complete file display flow...');

    // Test with files
    console.log('\n📊 Testing with files:');
    const proposalWithFiles = createMockProposal(true);
    const hasFilesWithFiles = testFileDetection(proposalWithFiles);
    const filesWithFiles = testFilesObjectConstruction(proposalWithFiles);
    const mappingWithFiles = testFileTypeMapping(filesWithFiles);

    // Test without files
    console.log('\n📊 Testing without files:');
    const proposalWithoutFiles = createMockProposal(false);
    const hasFilesWithoutFiles = testFileDetection(proposalWithoutFiles);
    const filesWithoutFiles = testFilesObjectConstruction(proposalWithoutFiles);
    const mappingWithoutFiles = testFileTypeMapping(filesWithoutFiles);

    // Results
    console.log('\n📊 Test Results:');
    console.log('  With Files - Has Files:', hasFilesWithFiles);
    console.log('  With Files - File Count:', Object.keys(filesWithFiles).length);
    console.log('  Without Files - Has Files:', hasFilesWithoutFiles);
    console.log('  Without Files - File Count:', Object.keys(filesWithoutFiles).length);

    return {
        withFiles: {
            hasFiles: hasFilesWithFiles,
            fileCount: Object.keys(filesWithFiles).length,
            files: filesWithFiles
        },
        withoutFiles: {
            hasFiles: hasFilesWithoutFiles,
            fileCount: Object.keys(filesWithoutFiles).length,
            files: filesWithoutFiles
        }
    };
};

// Test React component props
export const testReactComponentProps = (proposal) => {
    console.log('🧪 Testing React component props...');

    const files = testFilesObjectConstruction(proposal);
    const hasFiles = testFileDetection(proposal);

    // Simulate the props that would be passed to the component
    const componentProps = {
        proposal: {
            ...proposal,
            files,
            hasFiles
        }
    };

    console.log('  Component Props:', JSON.stringify(componentProps, null, 2));

    return componentProps;
};

// Run all tests
export const runFileDisplayTests = () => {
    console.log('🚀 Starting Frontend File Display Tests...');
    console.log('='.repeat(50));

    try {
        const results = testCompleteFileDisplay();
        console.log('\n🎯 Test Results:', results);

        const allTestsPassed = results.withFiles.hasFiles && !results.withoutFiles.hasFiles;
        console.log('\n🏁 All Tests Passed:', allTestsPassed ? '✅ YES' : '❌ NO');

        return results;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
};

// Export for use in components
export default {
    createMockProposal,
    testFileDetection,
    testFilesObjectConstruction,
    testFileTypeMapping,
    testCompleteFileDisplay,
    testReactComponentProps,
    runFileDisplayTests
};
