// Test script for the admin stats API
const http = require('http');

function testStatsAPI() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/proposals/admin/stats',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    console.log('🧪 Testing Admin Stats API...');
    console.log(`🔗 URL: http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log(`📊 Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Response received successfully:');
                console.log(JSON.stringify(jsonData, null, 2));

                if (jsonData.success && jsonData.data) {
                    console.log('\n✅ API Test PASSED - Stats data structure is correct');
                    console.log(`📈 Pending: ${jsonData.data.pending}`);
                    console.log(`✅ Approved: ${jsonData.data.approved}`);
                    console.log(`❌ Rejected: ${jsonData.data.rejected}`);
                    console.log(`📝 Draft: ${jsonData.data.draft}`);
                    console.log(`🎯 Total Events: ${jsonData.data.totalEvents}`);
                } else {
                    console.log('❌ API Test FAILED - Unexpected response structure');
                }
            } catch (error) {
                console.log('❌ API Test FAILED - Invalid JSON response:');
                console.log(data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ API Test FAILED - Request error:');
        console.error(error);
    });

    req.end();
}

// Run the test
testStatsAPI(); 