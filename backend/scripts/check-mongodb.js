#!/usr/bin/env node

/**
 * MongoDB Status Check Script
 * 
 * Quick script to check MongoDB installation and connection status
 */

const { checkMongoInstalled, checkMongoService } = require('./setup-mongodb.js');

console.log('🔍 MongoDB Status Check');
console.log('======================');

// Check installation
console.log('\n1. Installation Status:');
if (checkMongoInstalled()) {
  console.log('✅ MongoDB is installed');
} else {
  console.log('❌ MongoDB is not installed');
  console.log('💡 Run: npm run setup-mongodb');
  process.exit(1);
}

// Check service
console.log('\n2. Service Status:');
if (checkMongoService()) {
  console.log('✅ MongoDB service is running');
  console.log('✅ Ready for connections');
} else {
  console.log('❌ MongoDB service is not running');
  console.log('💡 Please start MongoDB service');
  console.log('💡 Windows: Start MongoDB service in Services');
  console.log('💡 macOS: brew services start mongodb/brew/mongodb-community');
  console.log('💡 Linux: sudo systemctl start mongod');
  process.exit(1);
}

console.log('\n🎉 MongoDB is ready!');
