#!/usr/bin/env node

/**
 * Test Frontend API Call
 * 
 * This script simulates the exact API call that the frontend makes
 */

const axios = require('axios');

async function testFrontendAPICall() {
    console.log('🔧 Testing Frontend API Call...');

    try {
        // Simulate the exact API call the frontend makes
        const response = await axios.get('http://localhost:5000/api/admin/proposals?limit=5&page=1&status=all&sortField=submitted_at&sortDirection=desc', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzEzLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1OTIwMDU4NSwiZXhwIjoxNzU5Mjg2OTg1fQ.SR2k8zAQOKS3mVa785mpGC93V-iOd5Vs1m2ETg1qnuY'
            }
        });

        console.log('✅ Frontend API Call Status:', response.status);
        console.log('📊 Response Data:');
        console.log('================');

        const data = response.data;
        console.log('✅ Success:', data.success);
        console.log('📋 Proposals Count:', data.proposals?.length || 0);

        if (data.proposals && data.proposals.length > 0) {
            console.log('\n🎯 First Proposal Details:');
            console.log('==========================');
            const proposal = data.proposals[0];

            console.log('📝 Event Name:', proposal.eventName);
            console.log('🏢 Organization:', proposal.organization);
            console.log('👤 Contact Name:', proposal.contact?.name);
            console.log('📧 Contact Email:', proposal.contact?.email);
            console.log('📞 Contact Phone:', proposal.contact?.phone);
            console.log('📊 Status:', proposal.status);
            console.log('📅 Date:', proposal.date);
            console.log('🏷️ Type:', proposal.type);
            console.log('📄 Description:', proposal.description);

            console.log('\n🔍 Data Validation:');
            console.log('===================');
            console.log('Event Name is string:', typeof proposal.eventName === 'string');
            console.log('Organization is string:', typeof proposal.organization === 'string');
            console.log('Contact is object:', typeof proposal.contact === 'object');
            console.log('Status is string:', typeof proposal.status === 'string');
            console.log('Date is valid:', proposal.date && !isNaN(new Date(proposal.date).getTime()));
            console.log('Type is string:', typeof proposal.type === 'string');

            console.log('\n📋 All Proposals Summary:');
            console.log('========================');
            data.proposals.forEach((p, index) => {
                console.log(`Proposal ${index + 1}:`);
                console.log(`  - Event: ${p.eventName}`);
                console.log(`  - Org: ${p.organization}`);
                console.log(`  - Contact: ${p.contact?.name}`);
                console.log(`  - Status: ${p.status}`);
                console.log(`  - Date: ${p.date}`);
                console.log(`  - Type: ${p.type}`);
                console.log('');
            });
        }

        console.log('✅ Frontend API Call Test Complete!');

    } catch (error) {
        console.error('❌ Frontend API Call Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFrontendAPICall();





