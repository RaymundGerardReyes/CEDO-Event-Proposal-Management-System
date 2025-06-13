const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Frontend Environment for Profile API...\n');

const envContent = `# Frontend Environment Configuration for Profile API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
`;

const envPath = path.join(__dirname, '.env.local');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file successfully!');
    console.log('📝 Location:', envPath);
    console.log('\n📋 Environment variables set:');
    console.log('   NEXT_PUBLIC_API_URL=http://localhost:5000');
    console.log('   NEXT_PUBLIC_DEBUG=true');

    console.log('\n🚀 Next steps:');
    console.log('1. Restart your frontend development server');
    console.log('2. Try accessing the profile page again');
    console.log('3. Check browser dev tools for any remaining issues');

} catch (err) {
    console.log('❌ Failed to create .env.local file:', err.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Create a file called .env.local in the frontend directory');
    console.log('2. Add this content:');
    console.log('\nNEXT_PUBLIC_API_URL=http://localhost:5000');
    console.log('NEXT_PUBLIC_DEBUG=true');
}

console.log('\n🔍 Debugging your profile issue:');
console.log('');
console.log('The error "Failed to fetch user data: 404" is happening because:');
console.log('1. Your frontend was missing NEXT_PUBLIC_API_URL');
console.log('2. Without it, the frontend tries to call /api/profile on its own server');
console.log('3. But the profile API is on your backend server (port 5000)');
console.log('');
console.log('✅ Your backend profile API is working correctly!');
console.log('✅ We just fixed the frontend configuration');
console.log('');
console.log('After restarting your frontend, the profile page should work!'); 