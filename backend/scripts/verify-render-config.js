#!/usr/bin/env node
/**
 * Render Configuration Verification Script
 * 
 * This script helps verify that all required environment variables
 * are properly configured for Render deployment.
 */

require('dotenv').config();

console.log('🔍 Render Configuration Verification');
console.log('=====================================\n');

// Required environment variables for Render
const requiredVars = {
    // Database Configuration
    'DB_TYPE': 'postgresql',
    'POSTGRES_HOST': 'dpg-d3245345373b8rneg-a.oregon-postgres.render.com',
    'POSTGRES_PORT': '5432',
    'POSTGRES_DATABASE': 'cedo_auth',
    'POSTGRES_USER': 'cedo_auth_user',
    'POSTGRES_PASSWORD': 'nok8+@(*DHJHAHAHAHAiS',

    // Application Configuration
    'NODE_ENV': 'production',
    'PORT': '10000',
    'JWT_SECRET': 'your-jwt-secret-key',
    'GOOGLE_CLIENT_ID': 'your-google-client-id',
    'GOOGLE_CLIENT_SECRET': 'your-google-client-secret',
    'RECAPTCHA_SECRET_KEY': 'your-recaptcha-secret',

    // postgresql (if using)
    'postgresql_URI': 'postgresql+srv://your-postgresql-connection-string',

    // Frontend URLs
    'FRONTEND_URL': 'https://your-frontend-service.onrender.com',
    'ALLOWED_ORIGINS': 'https://your-frontend-service.onrender.com'
};

console.log('📋 Required Environment Variables for Render:');
console.log('==============================================\n');

let allConfigured = true;

Object.entries(requiredVars).forEach(([key, exampleValue]) => {
    const currentValue = process.env[key];
    const status = currentValue ? '✅ SET' : '❌ MISSING';
    const displayValue = currentValue ?
        (key.includes('PASSWORD') || key.includes('SECRET') ?
            '***' + currentValue.slice(-4) : currentValue) :
        exampleValue;

    console.log(`${status} ${key}=${displayValue}`);

    if (!currentValue) {
        allConfigured = false;
    }
});

console.log('\n📊 Configuration Status:');
console.log('========================');
console.log(allConfigured ? '✅ All required variables are configured!' : '❌ Some variables are missing!');

if (!allConfigured) {
    console.log('\n🔧 To fix this:');
    console.log('1. Go to your Render service dashboard');
    console.log('2. Click on "Environment" tab');
    console.log('3. Add the missing environment variables');
    console.log('4. Redeploy your service');
}

console.log('\n🌐 Render Service URLs:');
console.log('=======================');
console.log('Backend: https://your-backend-service.onrender.com');
console.log('Frontend: https://your-frontend-service.onrender.com');
console.log('Database: dpg-d3245345373b8rneg-a.oregon-postgres.render.com:5432');

