#!/usr/bin/env node

/**
 * Test API Response Format
 * 
 * This script tests the exact API response format to ensure it matches frontend expectations
 */

const axios = require('axios');

async function testAPIResponseFormat() {
    console.log('🔧 Testing API Response Format...');

    try {
        // Test the API endpoint
        const response = await axios.get('http://localhost:5000/api/admin/proposals?limit=1', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzEzLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1OTIwMDU4NSwiZXhwIjoxNzU5Mjg2OTg1fQ.SR2k8zAQOKS3mVa785mpGC93V-iOd5Vs1m2ETg1qnuY'
            }
        });

        console.log('✅ API Response Status:', response.status);
        console.log('📊 Response Structure:');
        console.log('====================');

        const data = response.data;
        console.log('✅ Success:', data.success);
        console.log('📋 Proposals Count:', data.proposals?.length || 0);
        console.log('📄 Pagination:', data.pagination);
        console.log('📊 Stats:', data.stats);

        if (data.proposals && data.proposals.length > 0) {
            const proposal = data.proposals[0];
            console.log('\n🎯 Sample Proposal Structure:');
            console.log('=============================');
            console.log('✅ ID:', proposal.id);
            console.log('✅ UUID:', proposal.uuid);
            console.log('✅ Event Name:', proposal.eventName);
            console.log('✅ Organization:', proposal.organization);
            console.log('✅ Organization Type:', proposal.organizationType);
            console.log('✅ Contact:', proposal.contact);
            console.log('✅ Status:', proposal.status);
            console.log('✅ Date:', proposal.date);
            console.log('✅ Type:', proposal.type);
            console.log('✅ Event Type:', proposal.eventType);
            console.log('✅ Description:', proposal.description);
            console.log('✅ Location:', proposal.location);
            console.log('✅ Files:', proposal.files);
            console.log('✅ File Count:', proposal.fileCount);

            console.log('\n🔍 Field Mapping Analysis:');
            console.log('=========================');
            console.log('✅ eventName:', proposal.eventName ? '✓ Present' : '❌ Missing');
            console.log('✅ organization:', proposal.organization ? '✓ Present' : '❌ Missing');
            console.log('✅ contact.name:', proposal.contact?.name ? '✓ Present' : '❌ Missing');
            console.log('✅ contact.email:', proposal.contact?.email ? '✓ Present' : '❌ Missing');
            console.log('✅ contact.phone:', proposal.contact?.phone ? '✓ Present' : '❌ Missing');
            console.log('✅ status:', proposal.status ? '✓ Present' : '❌ Missing');
            console.log('✅ date:', proposal.date ? '✓ Present' : '❌ Missing');
            console.log('✅ type:', proposal.type ? '✓ Present' : '❌ Missing');

            console.log('\n📋 Expected vs Actual:');
            console.log('======================');
            console.log('Expected: eventName → Actual:', proposal.eventName);
            console.log('Expected: organization → Actual:', proposal.organization);
            console.log('Expected: contact.name → Actual:', proposal.contact?.name);
            console.log('Expected: contact.email → Actual:', proposal.contact?.email);
            console.log('Expected: contact.phone → Actual:', proposal.contact?.phone);
            console.log('Expected: status → Actual:', proposal.status);
            console.log('Expected: date → Actual:', proposal.date);
            console.log('Expected: type → Actual:', proposal.type);
        }

        console.log('\n✅ API Response Format Test Complete!');

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAPIResponseFormat();





