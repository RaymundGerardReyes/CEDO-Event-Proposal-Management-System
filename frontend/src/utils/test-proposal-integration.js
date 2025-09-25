/**
 * Test Proposal Integration
 * 
 * Simple test utility to verify the integration between localStorage and PostgreSQL
 * This can be run in the browser console to test the complete flow
 */

import { checkProposalExists } from '../services/proposal-service.js';
import { mapFormDataToProposal, prepareFileDataForUpload, validateProposalData } from './proposal-data-mapper.js';

/**
 * Test the complete proposal integration flow
 * @param {string} uuid - Test UUID to use
 */
export async function testProposalIntegration(uuid = 'test-uuid-12345') {
    console.log('🧪 Starting proposal integration test...');

    try {
        // Step 1: Test data mapping
        console.log('📊 Testing data mapping...');
        const mappedData = await mapFormDataToProposal(uuid);
        console.log('✅ Data mapping result:', mappedData);

        // Step 2: Test validation
        console.log('✅ Testing data validation...');
        const validation = validateProposalData(mappedData);
        console.log('✅ Validation result:', validation);

        // Step 3: Test file preparation
        console.log('📎 Testing file preparation...');
        const fileData = await prepareFileDataForUpload(uuid);
        console.log('✅ File data result:', fileData);

        // Step 4: Test proposal existence check
        console.log('🔍 Testing proposal existence check...');
        const existenceCheck = await checkProposalExists(uuid);
        console.log('✅ Existence check result:', existenceCheck);

        console.log('🎉 All tests completed successfully!');
        return {
            success: true,
            mappedData,
            validation,
            fileData,
            existenceCheck
        };

    } catch (error) {
        console.error('❌ Test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test with mock data
 * @param {string} uuid - Test UUID to use
 */
export async function testWithMockData(uuid = 'test-mock-uuid-67890') {
    console.log('🧪 Starting mock data test...');

    // Create mock localStorage data
    const mockOrgData = {
        values: {
            organizationName: 'Test Organization',
            organizationType: 'school',
            organizationDescription: 'A test organization',
            contactPerson: 'John Doe',
            contactEmail: 'john.doe@test.com',
            contactPhone: '0912-345-6789'
        }
    };

    const mockEventData = {
        values: {
            eventName: 'Test Event',
            venue: 'Test Venue',
            startDate: '2024-12-01',
            endDate: '2024-12-02',
            startTime: '09:00',
            endTime: '17:00',
            eventType: 'seminar-webinar',
            sdpCredits: '3'
        },
        selectedTargetAudiences: ['1st-year', '2nd-year'],
        gpoa: {
            name: 'test-gpoa.pdf',
            size: 1024,
            type: 'application/pdf',
            dataUrl: 'data:application/pdf;base64,test-data',
            timestamp: Date.now()
        },
        projectProposal: {
            name: 'test-proposal.pdf',
            size: 2048,
            type: 'application/pdf',
            dataUrl: 'data:application/pdf;base64,test-data',
            timestamp: Date.now()
        }
    };

    // Store mock data in localStorage
    localStorage.setItem(`form-${uuid}-organization`, JSON.stringify(mockOrgData));
    localStorage.setItem(`form-${uuid}-eventInformation`, JSON.stringify(mockEventData));

    console.log('📝 Mock data stored in localStorage');

    // Run the integration test
    const result = await testProposalIntegration(uuid);

    // Clean up mock data
    localStorage.removeItem(`form-${uuid}-organization`);
    localStorage.removeItem(`form-${uuid}-eventInformation`);

    console.log('🧹 Mock data cleaned up');

    return result;
}

/**
 * Test draft validation (should pass with partial data)
 * @param {string} uuid - Test UUID to use
 */
export async function testDraftValidation(uuid = 'test-draft-uuid-12345') {
    console.log('🧪 Testing draft validation with partial data...');

    // Create mock localStorage data with only partial information
    const mockOrgData = {
        values: {
            organizationName: 'Partial Organization',
            contactPerson: 'Jane Doe'
            // Missing contactEmail, contactPhone, etc.
        }
    };

    const mockEventData = {
        values: {
            eventName: 'Partial Event'
            // Missing venue, dates, etc.
        }
    };

    // Store mock data in localStorage
    localStorage.setItem(`form-${uuid}-organization`, JSON.stringify(mockOrgData));
    localStorage.setItem(`form-${uuid}-eventInformation`, JSON.stringify(mockEventData));

    console.log('📝 Partial mock data stored in localStorage');

    try {
        // Test draft validation (should pass)
        const mappedData = await mapFormDataToProposal(uuid);
        const draftValidation = validateProposalData(mappedData, { isDraft: true, strict: false });

        console.log('✅ Draft validation result:', draftValidation);

        // Test strict validation (should fail)
        const strictValidation = validateProposalData(mappedData, { isDraft: false, strict: true });
        console.log('✅ Strict validation result:', strictValidation);

        return {
            success: true,
            draftValidation,
            strictValidation,
            message: 'Draft validation test completed'
        };

    } catch (error) {
        console.error('❌ Draft validation test failed:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        // Clean up mock data
        localStorage.removeItem(`form-${uuid}-organization`);
        localStorage.removeItem(`form-${uuid}-eventInformation`);
        console.log('🧹 Partial mock data cleaned up');
    }
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
    window.testProposalIntegration = testProposalIntegration;
    window.testWithMockData = testWithMockData;
    window.testDraftValidation = testDraftValidation;
}
