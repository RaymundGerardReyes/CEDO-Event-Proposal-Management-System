const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/proposals';

// Test data that matches what Section3 frontend sends
const testSchoolEventData = () => {
    const form = new FormData();

    // Add all required fields exactly as Section3 sends them
    form.append('organization_id', '1');
    form.append('name', 'Test School Event');
    form.append('venue', 'University Auditorium');
    form.append('start_date', '2024-01-15');
    form.append('end_date', '2024-01-15');
    form.append('time_start', '09:00');
    form.append('time_end', '17:00');
    form.append('event_type', 'academic');
    form.append('event_mode', 'offline');
    form.append('return_service_credit', '1');
    form.append('proposal_status', 'pending');
    form.append('target_audience', JSON.stringify(['1st Year', '2nd Year']));
    form.append('contact_person', 'John Doe');
    form.append('contact_email', 'john.doe@example.com');
    form.append('contact_phone', '1234567890');
    form.append('admin_comments', '');

    return form;
};

const testValidation = async () => {
    try {
        console.log('🧪 Testing Section 3 school-events validation...');

        const formData = testSchoolEventData();

        console.log('📤 Sending test data to /school-events endpoint...');
        console.log('📋 Form data fields:');

        // Better way to log form data fields
        const entries = [];
        for (let [key, value] of formData.entries()) {
            entries.push(`  ${key}: ${value}`);
        }
        console.log(entries.join('\n'));

        const response = await axios.post(`${BASE_URL}/school-events`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 10000,
        });

        console.log('✅ Success! Response:', response.data);

    } catch (error) {
        console.error('❌ Validation Test Failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));

        if (error.response?.data?.errors) {
            console.error('🔍 Detailed validation errors:');
            error.response.data.errors.forEach((err, index) => {
                console.error(`  ${index + 1}. Field: ${err.param || 'unknown'}`);
                console.error(`     Message: ${err.msg}`);
                console.error(`     Value: "${err.value}"`);
                console.error(`     Location: ${err.location}`);
            });
        }

        if (error.code === 'ECONNREFUSED') {
            console.error('🚫 Cannot connect to backend. Make sure the server is running on port 5000.');
        }
    }
};

const testMissingFields = async () => {
    console.log('\n🧪 Testing with missing required fields...');

    const form = new FormData();
    // Only send some fields to see which validations trigger
    form.append('organization_id', '1');
    form.append('name', 'Test Event');
    // Missing other required fields intentionally

    try {
        const response = await axios.post(`${BASE_URL}/school-events`, form, {
            headers: {
                ...form.getHeaders(),
            },
        });
        console.log('✅ Unexpected success:', response.data);
    } catch (error) {
        console.log('❌ Expected validation errors for missing fields:');
        if (error.response?.data?.errors) {
            error.response.data.errors.forEach((err) => {
                console.log(`  - ${err.param}: ${err.msg}`);
            });
        }
    }
};

const testEmptyFields = async () => {
    console.log('\n🧪 Testing with empty fields...');

    const form = new FormData();
    form.append('organization_id', '');
    form.append('name', '');
    form.append('venue', '');
    form.append('start_date', '');
    form.append('end_date', '');
    form.append('time_start', '');
    form.append('time_end', '');
    form.append('event_type', '');
    form.append('event_mode', '');
    form.append('contact_person', '');
    form.append('contact_email', '');

    try {
        const response = await axios.post(`${BASE_URL}/school-events`, form, {
            headers: {
                ...form.getHeaders(),
            },
        });
        console.log('✅ Unexpected success:', response.data);
    } catch (error) {
        console.log('❌ Expected validation errors for empty fields:');
        if (error.response?.data?.errors) {
            error.response.data.errors.forEach((err) => {
                console.log(`  - ${err.param}: ${err.msg}`);
            });
        }
    }
};

// Run tests
const runAllTests = async () => {
    try {
        await testValidation();
        await testMissingFields();
        await testEmptyFields();
    } catch (error) {
        console.error('Test runner error:', error.message);
    }
};

if (require.main === module) {
    runAllTests();
}

module.exports = { testValidation, testMissingFields, testEmptyFields }; 