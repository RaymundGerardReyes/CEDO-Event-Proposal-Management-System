const fs = require('fs');
const path = require('path');

console.log('🔧 Creating .env file for Profile Credentials...\n');

const envTemplate = `# Database Configuration for Profile Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=cedo_auth

# Alternative MySQL environment variables (fallback)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_DATABASE=cedo_auth

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Application Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Google OAuth (if needed)
GOOGLE_CLIENT_ID_BACKEND=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Configuration
COOKIE_SECRET=your_cookie_secret_key_here
`;

const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('📝 Current .env content:');
    try {
        const currentEnv = fs.readFileSync(envPath, 'utf8');
        console.log(currentEnv);
    } catch (err) {
        console.log('❌ Could not read existing .env file');
    }

    console.log('\n🔧 To update your .env file with profile credentials support:');
    console.log('1. Make sure these variables are set:');
    console.log('   - DB_HOST (or MYSQL_HOST)');
    console.log('   - DB_PORT (or MYSQL_PORT)');
    console.log('   - DB_USER (or MYSQL_USER)');
    console.log('   - DB_PASSWORD (or MYSQL_PASSWORD)');
    console.log('   - DB_NAME (or MYSQL_DATABASE)');

    console.log('\n💡 If your database password is empty, you might need to set a password for MySQL root user');
    console.log('   - Connect to MySQL: mysql -u root');
    console.log('   - Set password: ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'your_password\';');
    console.log('   - Flush privileges: FLUSH PRIVILEGES;');

} else {
    try {
        fs.writeFileSync(envPath, envTemplate);
        console.log('✅ Created .env file successfully!');
        console.log('📝 Location:', envPath);

        console.log('\n🔧 IMPORTANT: Update the following in your .env file:');
        console.log('1. DB_PASSWORD - Set your MySQL root password');
        console.log('2. DB_NAME - Confirm database name (currently: cedo_auth)');
        console.log('3. JWT_SECRET - Set a secure random string');
        console.log('4. COOKIE_SECRET - Set a secure random string');

        console.log('\n💡 If you don\'t have a MySQL password set:');
        console.log('   Option 1: Set DB_PASSWORD to empty string: DB_PASSWORD=');
        console.log('   Option 2: Set a password in MySQL (recommended for security)');

    } catch (err) {
        console.log('❌ Failed to create .env file:', err.message);
    }
}

console.log('\n🚀 Next steps:');
console.log('1. Edit the .env file with your actual database credentials');
console.log('2. Test connection: node test-profile-db-connection.js');
console.log('3. If successful, test API: node test-profile-credentials.js');

// Quick database connection test
async function quickConnectionTest() {
    console.log('\n🔍 Quick MySQL Connection Test...');

    try {
        require('dotenv').config();
        const mysql = require('mysql2/promise');

        const config = {
            host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
            port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
            user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
            database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth'
        };

        console.log('Testing with config:', {
            ...config,
            password: config.password ? '***hidden***' : 'EMPTY'
        });

        const connection = await mysql.createConnection(config);
        await connection.execute('SELECT 1');
        await connection.end();

        console.log('✅ Database connection successful!');
        console.log('🎉 Your profile credentials setup is ready!');

    } catch (error) {
        console.log('❌ Database connection failed:', error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔧 Fix: Update DB_PASSWORD in .env file');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n🔧 Fix: Create database or update DB_NAME in .env');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Fix: Start MySQL server');
        }
    }
}

// Run the test after a brief delay
setTimeout(quickConnectionTest, 1000); 