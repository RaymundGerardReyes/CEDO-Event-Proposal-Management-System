// Simple test script to start the server
console.log('🚀 Starting CEDO Server Test...');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Set default port
const PORT = process.env.PORT || 5000;

console.log('📋 Environment Check:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - PORT: ${PORT}`);
console.log(`   - DB_TYPE: ${process.env.DB_TYPE || 'postgresql'}`);
console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);

try {
    console.log('📋 Loading server...');
    const { app, startServer } = require('./server.js');

    console.log('📋 Starting server...');
    startServer().then(() => {
        console.log(`✅ Server started successfully on port ${PORT}`);
    }).catch(err => {
        console.error('❌ Server startup failed:', err);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Error loading server:', error);
    process.exit(1);
}
