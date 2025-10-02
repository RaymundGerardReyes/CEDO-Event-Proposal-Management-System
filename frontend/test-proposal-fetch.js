#!/usr/bin/env node

/**
 * Test Frontend Proposal Fetching
 * This script tests if the frontend can properly fetch proposals from the backend
 */

const { fetchProposals, fetchProposalStats } = require('./src/services/admin-proposals.service.js');

async function testProposalFetching() {
    console.log('🧪 Testing Frontend Proposal Fetching...');

    try {
        console.log('\n📊 Testing fetchProposalStats...');
        const statsResult = await fetchProposalStats();
        console.log('Stats result:', statsResult);

        console.log('\n📋 Testing fetchProposals...');
        const proposalsResult = await fetchProposals({
            page: 1,
            limit: 10,
            status: 'all'
        });

        console.log('Proposals result:', {
            success: proposalsResult.success,
            proposalsCount: proposalsResult.proposals?.length || 0,
            pagination: proposalsResult.pagination,
            stats: proposalsResult.stats,
            error: proposalsResult.error
        });

        if (proposalsResult.success && proposalsResult.proposals?.length > 0) {
            console.log('\n✅ Successfully fetched proposals!');
            console.log('📋 First proposal:', {
                id: proposalsResult.proposals[0].id,
                eventName: proposalsResult.proposals[0].eventName,
                organization: proposalsResult.proposals[0].organization,
                status: proposalsResult.proposals[0].status
            });
        } else {
            console.log('❌ Failed to fetch proposals');
            console.log('Error:', proposalsResult.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
if (require.main === module) {
    testProposalFetching().catch(console.error);
}

module.exports = { testProposalFetching };






