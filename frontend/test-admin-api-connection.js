#!/usr/bin/env node

/**
 * Test script to verify admin API connection
 * Run with: node test-admin-api-connection.js
 */

// Dynamic import for node-fetch compatibility with Node.js 20+
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

console.log('🧪 Testing Admin API Connection...\n');
console.log(`Backend URL: ${BACKEND_URL}`);

async function testConnection() {
    try {
        // Test 1: Backend Health Check
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        const healthData = await healthResponse.json();

        if (healthResponse.ok) {
            console.log('✅ Backend health check passed:', healthData);
        } else {
            console.log('❌ Backend health check failed:', healthResponse.status, healthData);
            return;
        }

        // Test 2: MongoDB Connection Check
        console.log('\n2️⃣ Testing MongoDB connection...');
        try {
            const dbResponse = await fetch(`${BACKEND_URL}/api/db-check`);
            const dbData = await dbResponse.json();

            if (dbResponse.ok) {
                console.log('✅ Database connection check passed:', dbData);
            } else {
                console.log('⚠️ Database connection check failed:', dbResponse.status, dbData);
            }
        } catch (dbError) {
            console.log('⚠️ Database check endpoint not available:', dbError.message);
        }

        // Test 3: Admin Proposals Endpoint
        console.log('\n3️⃣ Testing admin proposals endpoint...');
        const adminResponse = await fetch(`${BACKEND_URL}/api/proposals/admin/proposals?page=1&limit=5`);

        console.log('Response status:', adminResponse.status, adminResponse.statusText);
        console.log('Response headers:', Object.fromEntries(adminResponse.headers.entries()));

        if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            console.log('✅ Admin proposals endpoint working!');
            console.log('Data preview:', {
                success: adminData.success,
                proposalCount: adminData.proposals?.length || 0,
                pagination: adminData.pagination
            });

            if (adminData.proposals && adminData.proposals.length > 0) {
                console.log('Sample proposal:', {
                    id: adminData.proposals[0].id,
                    eventName: adminData.proposals[0].eventName,
                    status: adminData.proposals[0].status
                });
            }
        } else {
            const errorText = await adminResponse.text();
            console.log('❌ Admin proposals endpoint failed:', errorText);
        }

        // Test 4: Frontend API Route
        console.log('\n4️⃣ Testing frontend API route...');
        try {
            const frontendResponse = await fetch(`http://localhost:3000/api/admin/proposals?page=1&limit=5`);

            if (frontendResponse.ok) {
                const frontendData = await frontendResponse.json();
                console.log('✅ Frontend API route working!');
                console.log('Data preview:', {
                    success: frontendData.success,
                    proposalCount: frontendData.proposals?.length || 0
                });
            } else {
                const errorText = await frontendResponse.text();
                console.log('❌ Frontend API route failed:', frontendResponse.status, errorText);
            }
        } catch (frontendError) {
            console.log('⚠️ Frontend not running or API route not accessible:', frontendError.message);
        }

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure backend is running: cd backend && npm start');
        console.log('2. Make sure frontend is running: cd frontend && npm run dev');
        console.log('3. Check backend URL in .env file');
        console.log('4. Verify MongoDB is connected');
        console.log('5. Check for CORS issues');
    }
}

// Run the test
testConnection().then(() => {
    console.log('\n🏁 Test completed!');
}).catch(error => {
    console.error('❌ Test failed:', error);
}); 