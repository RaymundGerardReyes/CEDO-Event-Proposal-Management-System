// Test script for school events API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function testSchoolEventsAPI() {
    console.log('Testing School Events API...\n');

    try {
        // Test 1: Create a school event (without files first)
        console.log('Test 1: Creating a school event...');
        const eventData = {
            organization_id: 1,
            name: 'Test Academic Workshop',
            venue: 'Main Conference Room',
            start_date: '2024-06-15',
            end_date: '2024-06-15',
            time_start: '09:00',
            time_end: '17:00',
            event_type: 'academic',
            event_mode: 'offline',
            return_service_credit: 2,
            proposal_status: 'pending',
            admin_comments: 'Test event for API validation'
        };

        const response = await axios.post(`${BASE_URL}/school-events`, eventData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ School event created successfully');
        console.log('Response:', response.data);
        console.log('Event ID:', response.data.id);

        const eventId = response.data.id;

        // Test 2: Get all school events
        console.log('\nTest 2: Getting all school events...');
        const getAllResponse = await axios.get(`${BASE_URL}/school-events`);
        console.log('✅ Retrieved all school events');
        console.log('Count:', getAllResponse.data.length);

        // Test 3: Get specific school event
        console.log('\nTest 3: Getting specific school event...');
        const getOneResponse = await axios.get(`${BASE_URL}/school-events/${eventId}`);
        console.log('✅ Retrieved specific school event');
        console.log('Event:', getOneResponse.data);

        console.log('\n🎉 All tests passed! School Events API is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

// Run the test
testSchoolEventsAPI(); 