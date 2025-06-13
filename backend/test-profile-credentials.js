const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration - Updated to match your actual setup
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth',
    port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306
};

async function testProfileCredentialsSetup() {
    console.log('🔍 Testing Profile Credentials Database Setup...\n');

    let connection;

    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful');

        // Test 1: Check if new columns exist
        console.log('\n📋 Test 1: Checking table structure...');
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('organization_description', 'phone_number')
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

        if (columns.length === 2) {
            console.log('✅ New columns found:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
                if (col.COLUMN_COMMENT) {
                    console.log(`     Comment: ${col.COLUMN_COMMENT}`);
                }
            });
        } else {
            console.log('❌ Missing columns. Expected: organization_description, phone_number');
            console.log('Found columns:', columns.map(c => c.COLUMN_NAME));
        }

        // Test 2: Check constraints
        console.log('\n📋 Test 2: Checking constraints...');
        const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
      FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [dbConfig.database]);

        const phoneConstraint = constraints.find(c => c.CONSTRAINT_NAME === 'chk_phone_format');
        if (phoneConstraint) {
            console.log('✅ Phone number constraint found');
            console.log(`   Rule: ${phoneConstraint.CHECK_CLAUSE}`);
        } else {
            console.log('❌ Phone number constraint not found');
        }

        // Test 3: Test phone number validation
        console.log('\n📋 Test 3: Testing phone number validation...');

        const testPhones = [
            { number: '09123456789', expected: true, description: 'Valid Philippine mobile' },
            { number: '09987654321', expected: true, description: 'Valid Philippine mobile' },
            { number: '0812345678', expected: false, description: 'Invalid - not starting with 09' },
            { number: '091234567890', expected: false, description: 'Invalid - 12 digits' },
            { number: '0912345678', expected: false, description: 'Invalid - 10 digits' },
            { number: 'abc1234567', expected: false, description: 'Invalid - contains letters' }
        ];

        // Create a test user first (if not exists)
        try {
            await connection.execute(`
        INSERT IGNORE INTO users (name, email, password, role) 
        VALUES ('Test User', 'test@example.com', 'hashedpassword', 'student')
      `);
        } catch (err) {
            // User might already exist, which is fine
        }

        const [testUser] = await connection.execute(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            ['test@example.com']
        );

        if (testUser.length === 0) {
            console.log('❌ Could not create test user');
            return;
        }

        const userId = testUser[0].id;

        for (const test of testPhones) {
            try {
                await connection.execute(
                    'UPDATE users SET phone_number = ? WHERE id = ?',
                    [test.number, userId]
                );

                if (test.expected) {
                    console.log(`✅ ${test.number} - ${test.description} - ACCEPTED`);
                } else {
                    console.log(`❌ ${test.number} - ${test.description} - SHOULD HAVE BEEN REJECTED`);
                }
            } catch (err) {
                if (!test.expected) {
                    console.log(`✅ ${test.number} - ${test.description} - CORRECTLY REJECTED`);
                } else {
                    console.log(`❌ ${test.number} - ${test.description} - INCORRECTLY REJECTED: ${err.message}`);
                }
            }
        }

        // Test 4: Test organization description
        console.log('\n📋 Test 4: Testing organization description...');

        const testDescriptions = [
            'Short description',
            'A much longer organization description that contains multiple sentences and provides detailed information about the organization, its mission, vision, and goals.',
            null // Test NULL value
        ];

        for (const desc of testDescriptions) {
            try {
                await connection.execute(
                    'UPDATE users SET organization_description = ? WHERE id = ?',
                    [desc, userId]
                );
                console.log(`✅ Organization description ${desc ? `(${desc.length} chars)` : '(NULL)'} - ACCEPTED`);
            } catch (err) {
                console.log(`❌ Organization description failed: ${err.message}`);
            }
        }

        // Test 5: Verify indexes
        console.log('\n📋 Test 5: Checking indexes...');
        const [indexes] = await connection.execute(`
      SHOW INDEX FROM users WHERE Column_name IN ('phone_number', 'organization_description')
    `);

        const phoneIndex = indexes.find(i => i.Column_name === 'phone_number');
        const orgIndex = indexes.find(i => i.Column_name === 'organization_description');

        if (phoneIndex) {
            console.log('✅ Phone number index found');
        } else {
            console.log('❌ Phone number index not found');
        }

        if (orgIndex) {
            console.log('✅ Organization description index found');
        } else {
            console.log('❌ Organization description index not found');
        }

        // Clean up test data
        await connection.execute(
            'UPDATE users SET phone_number = NULL, organization_description = NULL WHERE id = ?',
            [userId]
        );

        console.log('\n🎉 Profile Credentials Database Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test API endpoints
async function testProfileAPI() {
    console.log('\n🌐 Testing Profile API Endpoints...\n');

    // Note: This would require a running server and valid JWT token
    // For now, just show the expected endpoints
    console.log('Expected API Endpoints:');
    console.log('📍 GET /api/profile - Get user profile data');
    console.log('📍 PUT /api/profile/organization - Update organization description');
    console.log('📍 PUT /api/profile/phone - Update phone number');
    console.log('📍 PUT /api/profile/bulk - Update multiple fields at once');

    console.log('\nTo test these endpoints:');
    console.log('1. Start your backend server: npm start (in backend directory)');
    console.log('2. Get a JWT token by logging in');
    console.log('3. Use tools like Postman or curl to test the endpoints');

    console.log('\nExample curl commands:');
    console.log(`
curl -X GET http://localhost:5000/api/profile \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X PUT http://localhost:5000/api/profile/organization \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"organizationDescription": "Sample organization description"}'

curl -X PUT http://localhost:5000/api/profile/phone \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "09123456789"}'
  `);
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting Profile Credentials Integration Tests\n');
    console.log('='.repeat(60));

    await testProfileCredentialsSetup();
    await testProfileAPI();

    console.log('\n' + '='.repeat(60));
    console.log('📝 Summary:');
    console.log('1. Run the SQL script: backend/add-profile-credentials-columns.sql');
    console.log('2. Start your backend server');
    console.log('3. Test the frontend profile page');
    console.log('4. Verify data persistence in database');
}

// Execute if run directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testProfileCredentialsSetup,
    testProfileAPI,
    runAllTests
}; 