#!/usr/bin/env node

// Quick setup script for PostgreSQL configuration
const fs = require('fs');
const path = require('path');

console.log('🐘 CEDO PostgreSQL Setup Script');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    console.log('📝 Please edit backend/.env and set:');
    console.log('   DB_TYPE=postgresql');
    console.log('   DB_PASSWORD=your_actual_postgres_password');
    console.log('   POSTGRES_PASSWORD=your_actual_postgres_password');
} else {
    console.log('📝 Creating .env file from template...');

    if (fs.existsSync(envExamplePath)) {
        // Copy example to .env
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created from template');
        console.log('📝 Please edit backend/.env and set your PostgreSQL password');
    } else {
        console.log('❌ env.example file not found');
        console.log('📝 Please create backend/.env manually with:');
        console.log('   DB_TYPE=postgresql');
        console.log('   DB_PASSWORD=your_postgres_password');
        console.log('   POSTGRES_PASSWORD=your_postgres_password');
    }
}

console.log('\n🚀 Next Steps:');
console.log('1. Edit backend/.env and set your PostgreSQL password');
console.log('2. Run: npm run test-postgres');
console.log('3. Run: npm run init-postgres');
console.log('4. Run: npm run dev');
console.log('\n📚 See POSTGRESQL_SETUP_GUIDE.md for detailed instructions');
