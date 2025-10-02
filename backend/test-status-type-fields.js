#!/usr/bin/env node

/**
 * Test Status and Type Fields
 * 
 * This script specifically tests the status and type field mapping
 */

const axios = require('axios');

async function testStatusTypeFields() {
    console.log('🔧 Testing Status and Type Fields...');

    try {
        // Test the API endpoint
        const response = await axios.get('http://localhost:5000/api/admin/proposals?limit=2', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzEzLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1OTIwMDU4NSwiZXhwIjoxNzU5Mjg2OTg1fQ.SR2k8zAQOKS3mVa785mpGC93V-iOd5Vs1m2ETg1qnuY'
            }
        });

        console.log('✅ API Response Status:', response.status);

        const data = response.data;
        if (data.proposals && data.proposals.length > 0) {
            const proposal = data.proposals[0];

            console.log('\n🎯 Raw API Data:');
            console.log('================');
            console.log('✅ Raw status field:', proposal.status);
            console.log('✅ Raw type field:', proposal.type);
            console.log('✅ Raw proposal_status field:', proposal.proposal_status);
            console.log('✅ Raw organization_type field:', proposal.organization_type);

            console.log('\n🔄 Testing Frontend Transformation:');
            console.log('===================================');

            // Mock the normalizeProposal function
            function normalizeProposal(raw) {
                if (!raw || typeof raw !== 'object') return null;

                const files = raw.files && typeof raw.files === 'object' && !Array.isArray(raw.files)
                    ? raw.files
                    : {};

                const status = raw.status || raw.proposal_status || 'pending';

                return {
                    id: raw.id ?? null,
                    uuid: raw.uuid ?? String(raw.id ?? ''),
                    // API already returns the correct field names - use them directly
                    organization: raw.organization || '',
                    eventName: raw.eventName || '',
                    status,
                    adminComments: raw.adminComments || '',
                    contact: {
                        name: raw.contact?.name || '',
                        email: raw.contact?.email || '',
                        phone: raw.contact?.phone || '',
                    },
                    organizationType: raw.organizationType || '',
                    venue: raw.location || '',
                    // Frontend expects 'date' field for event start date
                    date: raw.date || '',
                    startDate: raw.startDate || '',
                    endDate: raw.endDate || '',
                    startTime: raw.startTime || '',
                    endTime: raw.endTime || '',
                    // Map type to organization_type as per database schema
                    type: raw.type || '',
                    eventType: raw.eventType || '',
                    eventMode: raw.eventMode || '',
                    createdAt: raw.createdAt || '',
                    updatedAt: raw.updatedAt || '',
                    submittedAt: raw.submittedAt || '',
                    approvedAt: raw.approvedAt || '',
                    reviewedAt: raw.reviewedAt || '',
                    hasFiles: !!(files && Object.keys(files).length > 0),
                    files,
                    // Additional fields for details view
                    description: raw.description || '',
                    budget: raw.budget || 0,
                    volunteersNeeded: raw.volunteersNeeded || 0,
                    attendanceCount: raw.attendanceCount || 0,
                    targetAudience: raw.targetAudience || [],
                    sdpCredits: raw.sdpCredits || 0,
                    // keep raw for debugging if needed
                    _raw: raw,
                };
            }

            const transformedProposal = normalizeProposal(proposal);

            console.log('\n✅ Transformed Data:');
            console.log('====================');
            console.log('✅ Transformed status:', transformedProposal.status);
            console.log('✅ Transformed type:', transformedProposal.type);
            console.log('✅ Transformed organization:', transformedProposal.organization);
            console.log('✅ Transformed eventName:', transformedProposal.eventName);
            console.log('✅ Transformed contact.name:', transformedProposal.contact.name);

            console.log('\n🔍 Field Analysis:');
            console.log('==================');
            console.log('Status field present:', !!transformedProposal.status);
            console.log('Type field present:', !!transformedProposal.type);
            console.log('Status value:', transformedProposal.status);
            console.log('Type value:', transformedProposal.type);
            console.log('Status type:', typeof transformedProposal.status);
            console.log('Type type:', typeof transformedProposal.type);

            console.log('\n📋 Expected vs Actual:');
            console.log('======================');
            console.log('Expected status: pending → Actual:', transformedProposal.status);
            console.log('Expected type: school-based → Actual:', transformedProposal.type);

            // Test all proposals
            console.log('\n📊 All Proposals Status and Type:');
            console.log('=================================');
            data.proposals.forEach((p, index) => {
                const transformed = normalizeProposal(p);
                console.log(`Proposal ${index + 1}:`);
                console.log(`  - Status: ${transformed.status}`);
                console.log(`  - Type: ${transformed.type}`);
                console.log('');
            });
        }

        console.log('✅ Status and Type Fields Test Complete!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testStatusTypeFields();





