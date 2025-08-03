/**
 * Comprehensive Flow Test
 * Tests the complete data flow from event type selection through all sections
 */

const API_BASE = 'http://localhost:5000';

// Get token from cookies
function getTokenFromCookies() {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    return null;
}

async function testCompleteFlow() {
    const token = getTokenFromCookies();

    if (!token) {
        console.log('❌ No authentication token found');
        return;
    }

    console.log('🧪 COMPREHENSIVE FLOW TEST');
    console.log('='.repeat(60));

    try {
        // Step 1: Create draft
        console.log('\n1️⃣ Creating draft...');
        const draftResponse = await fetch(`${API_BASE}/api/proposals/drafts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!draftResponse.ok) {
            throw new Error(`Draft creation failed: ${draftResponse.status}`);
        }

        const draftData = await draftResponse.json();
        console.log('✅ Draft created:', draftData);

        // Step 2: Select community-based event type
        console.log('\n2️⃣ Selecting community-based event type...');
        const eventTypeResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftData.draftId}/event-type`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                eventType: 'community-based'
            })
        });

        if (!eventTypeResponse.ok) {
            throw new Error(`Event type selection failed: ${eventTypeResponse.status}`);
        }

        const eventTypeData = await eventTypeResponse.json();
        console.log('✅ Event type selected:', eventTypeData);

        // Step 3: Save Section 2 (Organization Info)
        console.log('\n3️⃣ Saving Section 2 (Organization Info)...');
        const section2Data = {
            title: 'Test Organization',
            description: 'Test organization description',
            organizationType: 'community-based',
            contactPerson: 'Test Contact',
            contactEmail: 'test@example.com',
            contactPhone: '1234567890',
            status: 'draft',
            userId: 17
        };

        const section2Response = await fetch(`${API_BASE}/api/proposals/section2-organization`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(section2Data)
        });

        if (!section2Response.ok) {
            throw new Error(`Section 2 save failed: ${section2Response.status}`);
        }

        const section2Result = await section2Response.json();
        console.log('✅ Section 2 saved:', section2Result);

        // Step 4: Save Section 3 (Community Event Details)
        console.log('\n4️⃣ Saving Section 3 (Community Event Details)...');
        const section3Data = {
            proposal_id: section2Result.id,
            organization_name: 'Test Organization',
            contact_person: 'Test Contact',
            contact_email: 'test@example.com',
            contact_phone: '1234567890',
            name: 'Test Community Event',
            venue: 'Test Venue',
            start_date: '2024-12-15',
            end_date: '2024-12-16',
            start_time: '09:00',
            end_time: '17:00',
            event_mode: 'offline',
            community_event_type: 'seminar-webinar',
            community_sdp_credits: '2',
            community_target_audience: ['Youth', 'Adults'],
            community_gpoa_file: new File(['test'], 'test_gpoa.pdf', { type: 'application/pdf' }),
            community_proposal_file: new File(['test'], 'test_proposal.pdf', { type: 'application/pdf' })
        };

        const formData = new FormData();
        Object.entries(section3Data).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });

        const section3Response = await fetch(`${API_BASE}/api/mongodb-unified/proposals/community-events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!section3Response.ok) {
            throw new Error(`Section 3 save failed: ${section3Response.status}`);
        }

        const section3Result = await section3Response.json();
        console.log('✅ Section 3 saved:', section3Result);

        // Step 5: Check final database state
        console.log('\n5️⃣ Checking final database state...');
        const finalCheckResponse = await fetch(`${API_BASE}/api/proposals/debug/${section2Result.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!finalCheckResponse.ok) {
            throw new Error(`Final check failed: ${finalCheckResponse.status}`);
        }

        const finalData = await finalCheckResponse.json();
        console.log('✅ Final database state:', finalData);

        // Step 6: Verify data consistency
        console.log('\n6️⃣ Verifying data consistency...');
        const mysql = finalData.mysql;
        const mongodb = finalData.mongodb;

        console.log('📊 MySQL Data:');
        console.log(`  - organization_type: ${mysql.organization_type}`);
        console.log(`  - organization_name: ${mysql.organization_name}`);
        console.log(`  - contact_name: ${mysql.contact_name}`);
        console.log(`  - contact_email: ${mysql.contact_email}`);
        console.log(`  - event_name: ${mysql.event_name}`);

        console.log('\n📊 MongoDB Data:');
        console.log(`  - name: ${mongodb.name}`);
        console.log(`  - venue: ${mongodb.venue}`);
        console.log(`  - community_event_type: ${mongodb.community_event_type}`);
        console.log(`  - community_sdp_credits: ${mongodb.community_sdp_credits}`);

        // Step 7: Summary
        console.log('\n📋 SUMMARY:');
        if (mysql.organization_type === 'community-based' &&
            mysql.organization_name === 'Test Organization' &&
            mongodb.name === 'Test Community Event') {
            console.log('✅ SUCCESS: Complete data flow working correctly!');
            console.log('🎉 All sections properly linked between frontend, backend, and database');
        } else {
            console.log('❌ FAILURE: Data flow issues detected');
            console.log('Expected vs Actual:');
            console.log(`  - organization_type: community-based vs ${mysql.organization_type}`);
            console.log(`  - organization_name: Test Organization vs ${mysql.organization_name}`);
            console.log(`  - event_name: Test Community Event vs ${mongodb.name}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Make function available globally
window.testCompleteFlow = testCompleteFlow;

console.log('💡 Run testCompleteFlow() to test the complete data flow');
console.log('🔗 This will test all sections and verify data consistency'); 