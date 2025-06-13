const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testMongoDBSchoolEvent() {
    try {
        console.log('🧪 Testing MongoDB School Events API...');

        // Create test data
        const formData = new FormData();

        // Basic school event data
        formData.append('organization_id', '1');
        formData.append('name', 'Test School Event for MongoDB');
        formData.append('venue', 'University Auditorium');
        formData.append('start_date', '2024-03-15');
        formData.append('end_date', '2024-03-15');
        formData.append('time_start', '09:00');
        formData.append('time_end', '17:00');
        formData.append('event_type', 'academic');
        formData.append('event_mode', 'offline');
        formData.append('return_service_credit', '2');
        formData.append('proposal_status', 'pending');
        formData.append('admin_comments', 'Test event for MongoDB validation');
        formData.append('target_audience', JSON.stringify(['1st Year', '2nd Year']));

        // Create test files if they don't exist
        const testDir = './test-files';
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create dummy GPOA file
        const gpoaContent = 'This is a test GPOA file for MongoDB upload testing.';
        const gpoaPath = path.join(testDir, 'test-gpoa.txt');
        fs.writeFileSync(gpoaPath, gpoaContent);

        // Create dummy proposal file
        const proposalContent = 'This is a test proposal document for MongoDB upload testing.';
        const proposalPath = path.join(testDir, 'test-proposal.txt');
        fs.writeFileSync(proposalPath, proposalContent);

        // Append files to form data
        formData.append('gpoaFile', fs.createReadStream(gpoaPath), {
            filename: 'test-gpoa.txt',
            contentType: 'text/plain'
        });

        formData.append('proposalFile', fs.createReadStream(proposalPath), {
            filename: 'test-proposal.txt',
            contentType: 'text/plain'
        });

        // Send request to MongoDB endpoint
        const response = await fetch('http://localhost:5000/api/proposals/school-events', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        console.log('📊 Response Status:', response.status);

        const responseData = await response.text();
        console.log('📄 Response Data:', responseData);

        if (response.ok) {
            const result = JSON.parse(responseData);
            console.log('✅ SUCCESS: School event saved to MongoDB!');
            console.log('📝 Event ID:', result.id);
            console.log('📁 Files uploaded:', result.files);
        } else {
            console.log('❌ FAILED: MongoDB validation error');
            console.log('🔍 Error details:', responseData);
        }

        // Cleanup test files
        fs.unlinkSync(gpoaPath);
        fs.unlinkSync(proposalPath);
        fs.rmdirSync(testDir);

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

// Run the test
testMongoDBSchoolEvent(); 