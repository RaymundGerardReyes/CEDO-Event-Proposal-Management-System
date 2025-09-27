/**
 * Comprehensive Admin Routes Debugging Script
 * Tests route registration, middleware, and actual functionality
 */

const express = require('express');
const request = require('supertest');
const path = require('path');

// Import the main server
const app = require('./server');

console.log('🔍 COMPREHENSIVE ADMIN ROUTES DEBUGGING');
console.log('=====================================\n');

// Test 1: Check if admin routes are registered
console.log('📋 Test 1: Route Registration Check');
console.log('----------------------------------');

// Get all registered routes
const routes = [];
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
        });
    } else if (middleware.name === 'router') {
        // This is a router middleware
        if (middleware.regexp.source.includes('admin')) {
            console.log('✅ Found admin router middleware');
            console.log(`   Mounted at: ${middleware.regexp.source}`);
        }
    }
});

// Check for admin routes specifically
const adminRoutes = routes.filter(route =>
    route.path.includes('/admin') ||
    route.path.includes('download')
);

console.log(`📊 Total routes found: ${routes.length}`);
console.log(`📊 Admin-related routes: ${adminRoutes.length}`);

if (adminRoutes.length > 0) {
    console.log('✅ Admin routes found:');
    adminRoutes.forEach(route => {
        console.log(`   ${route.methods.join(', ').toUpperCase()} ${route.path}`);
    });
} else {
    console.log('❌ No admin routes found!');
}

console.log('\n📋 Test 2: Direct Route Testing');
console.log('--------------------------------');

// Test the specific download route
const testDownloadRoute = async () => {
    try {
        console.log('🧪 Testing GET /api/admin/proposals/52/download/projectProposal');

        const response = await request(app)
            .get('/api/admin/proposals/52/download/projectProposal')
            .expect(404); // We expect 404 since proposal 52 might not exist

        console.log('📊 Response status:', response.status);
        console.log('📊 Response body:', response.body);

        if (response.status === 404) {
            console.log('✅ Route exists but proposal not found (expected)');
        } else {
            console.log('❌ Unexpected response');
        }

    } catch (error) {
        console.log('❌ Route test failed:', error.message);
    }
};

// Test route existence with a non-existent route
const testNonExistentRoute = async () => {
    try {
        console.log('🧪 Testing GET /api/admin/nonexistent');

        const response = await request(app)
            .get('/api/admin/nonexistent')
            .expect(404);

        console.log('📊 Non-existent route response:', response.status);

    } catch (error) {
        console.log('❌ Non-existent route test failed:', error.message);
    }
};

// Test admin proposals list route
const testAdminProposalsRoute = async () => {
    try {
        console.log('🧪 Testing GET /api/admin/proposals');

        const response = await request(app)
            .get('/api/admin/proposals');

        console.log('📊 Admin proposals route status:', response.status);

        if (response.status === 401) {
            console.log('✅ Route exists but requires authentication (expected)');
        } else if (response.status === 200) {
            console.log('✅ Route exists and accessible');
        } else {
            console.log('❌ Unexpected response:', response.status);
        }

    } catch (error) {
        console.log('❌ Admin proposals route test failed:', error.message);
    }
};

// Run all tests
const runAllTests = async () => {
    await testDownloadRoute();
    console.log('');
    await testNonExistentRoute();
    console.log('');
    await testAdminProposalsRoute();

    console.log('\n📋 Test 3: Route Stack Analysis');
    console.log('--------------------------------');

    // Analyze the route stack
    console.log('🔍 Analyzing Express route stack...');

    app._router.stack.forEach((middleware, index) => {
        if (middleware.name === 'router') {
            console.log(`📦 Router ${index}:`);
            console.log(`   Name: ${middleware.name}`);
            console.log(`   Regexp: ${middleware.regexp.source}`);
            console.log(`   Keys: ${JSON.stringify(middleware.keys)}`);

            // Check if this is the admin router
            if (middleware.regexp.source.includes('admin')) {
                console.log('   ✅ This is the admin router!');
            }
        }
    });

    console.log('\n🎯 Debugging Complete!');
    console.log('=====================');
};

runAllTests().catch(console.error);
