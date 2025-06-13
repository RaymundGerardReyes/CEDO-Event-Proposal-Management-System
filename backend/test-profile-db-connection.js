require('dotenv').config();
const { pool } = require('./config/db');

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection for Profile Credentials...\n');

    console.log('Database Configuration:');
    console.log(`- Host: ${process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1'}`);
    console.log(`- Port: ${process.env.DB_PORT || process.env.MYSQL_PORT || 3306}`);
    console.log(`- User: ${process.env.DB_USER || process.env.MYSQL_USER || 'root'}`);
    console.log(`- Database: ${process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth'}`);
    console.log(`- Password: ${process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD ? 'SET' : 'NOT SET'}\n`);

    try {
        // Test basic connection
        console.log('📋 Test 1: Testing basic database connection...');
        const [rows] = await pool.query('SELECT 1 as test');
        console.log('✅ Database connection successful\n');

        // Test 2: Check if users table exists
        console.log('📋 Test 2: Checking users table...');
        const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth']);

        if (tables.length > 0) {
            console.log('✅ Users table found\n');
        } else {
            console.log('❌ Users table not found\n');
            return;
        }

        // Test 3: Check for new profile columns
        console.log('📋 Test 3: Checking profile credentials columns...');
        const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('organization_description', 'phone_number')
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth']);

        if (columns.length === 2) {
            console.log('✅ Profile credentials columns found:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        } else {
            console.log('❌ Profile credentials columns missing');
            console.log('Found columns:', columns.map(c => c.COLUMN_NAME));

            console.log('\n🔧 Would you like me to add the missing columns? Run:');
            console.log('mysql -u your_username -p cedo_auth < add-profile-credentials-columns.sql');
        }

        // Test 4: Sample query on users table
        console.log('\n📋 Test 4: Testing users table structure...');
        const [userColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth']);

        console.log('✅ Users table columns:');
        userColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

        // Test 5: Check if any users exist
        console.log('\n📋 Test 5: Checking existing users...');
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Found ${userCount[0].count} users in database\n`);

        console.log('🎉 All database tests completed successfully!');
        console.log('\n✅ Your profile credentials database setup is ready!');
        console.log('✅ You can now test the API endpoints');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔧 Database Access Issue Solutions:');
            console.log('1. Check your .env file exists in the backend directory');
            console.log('2. Verify database credentials in .env:');
            console.log('   DB_HOST=127.0.0.1');
            console.log('   DB_PORT=3306');
            console.log('   DB_USER=your_mysql_username');
            console.log('   DB_PASSWORD=your_mysql_password');
            console.log('   DB_NAME=cedo_auth');
            console.log('3. Make sure MySQL is running');
            console.log('4. Test connection: mysql -u your_username -p');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n🔧 Database Not Found Solutions:');
            console.log('1. Create the database: CREATE DATABASE cedo_auth;');
            console.log('2. Check database name in .env file');
        } else {
            console.log('\n🔧 Other Database Issues:');
            console.log('1. Ensure MySQL server is running');
            console.log('2. Check firewall settings');
            console.log('3. Verify MySQL port (default: 3306)');
        }
    }
}

// Quick environment check
function checkEnvironment() {
    console.log('🔍 Environment Variables Check:');

    const envVars = [
        'DB_HOST', 'MYSQL_HOST',
        'DB_PORT', 'MYSQL_PORT',
        'DB_USER', 'MYSQL_USER',
        'DB_PASSWORD', 'MYSQL_PASSWORD',
        'DB_NAME', 'MYSQL_DATABASE'
    ];

    const foundVars = {};
    envVars.forEach(varName => {
        if (process.env[varName]) {
            foundVars[varName] = process.env[varName];
        }
    });

    if (Object.keys(foundVars).length === 0) {
        console.log('❌ No database environment variables found!');
        console.log('📝 Create a .env file in backend directory with:');
        console.log(`
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=cedo_auth
    `);
    } else {
        console.log('✅ Found environment variables:');
        Object.entries(foundVars).forEach(([key, value]) => {
            if (key.includes('PASSWORD')) {
                console.log(`   ${key}=***hidden***`);
            } else {
                console.log(`   ${key}=${value}`);
            }
        });
    }
    console.log('');
}

// Run tests
async function runTests() {
    console.log('🚀 Profile Credentials Database Connection Test\n');
    console.log('='.repeat(60));

    checkEnvironment();
    await testDatabaseConnection();

    console.log('\n' + '='.repeat(60));
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testDatabaseConnection, checkEnvironment }; 