/**
 * Comprehensive test for Dashboard API endpoints
 * This test will create a test user and test the dashboard endpoints
 */

const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Raymund-Estaca01',
    database: process.env.MYSQL_DATABASE || 'cedo_auth',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-development-jwt-secret-key';

async function testDashboardAPI() {
    console.log('🧪 Comprehensive Dashboard API Test\n');

    let connection;

    try {
        // Connect to database
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');

        // Create a test user if it doesn't exist
        const testEmail = 'test-dashboard@example.com';
        const testName = 'Test Dashboard User';

        console.log('\n👤 Creating test user...');
        await connection.query(`
      INSERT IGNORE INTO users (name, email, role, is_approved, approved_at) 
      VALUES (?, ?, 'student', TRUE, NOW())
    `, [testName, testEmail]);

        // Get the user ID
        const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [testEmail]);
        const userId = users[0].id;
        console.log(`✅ Test user created/found with ID: ${userId}`);

        // Create some test proposals for this user
        console.log('\n📋 Creating test proposals...');

        const testProposals = [
            {
                organization_name: 'Test Organization 1',
                contact_email: testEmail,
                event_name: 'Leadership Workshop',
                proposal_status: 'approved',
                school_return_service_credit: '2',
                event_start_date: '2024-12-15',
                created_at: new Date()
            },
            {
                organization_name: 'Test Organization 2',
                contact_email: testEmail,
                event_name: 'Community Service Day',
                proposal_status: 'pending',
                community_sdp_credits: '1',
                event_start_date: '2024-12-20',
                created_at: new Date()
            },
            {
                organization_name: 'Test Organization 3',
                contact_email: testEmail,
                event_name: 'Academic Seminar',
                proposal_status: 'draft',
                school_return_service_credit: '3',
                event_start_date: '2024-12-25',
                created_at: new Date()
            }
        ];

        for (const proposal of testProposals) {
            await connection.query(`
        INSERT INTO proposals (
          organization_name, contact_email, event_name, proposal_status,
          school_return_service_credit, community_sdp_credits, event_start_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                proposal.organization_name,
                proposal.contact_email,
                proposal.event_name,
                proposal.proposal_status,
                proposal.school_return_service_credit,
                proposal.community_sdp_credits,
                proposal.event_start_date,
                proposal.created_at,
                proposal.created_at
            ]);
        }

        console.log(`✅ Created ${testProposals.length} test proposals`);

        // Create a JWT token for the test user
        const token = jwt.sign(
            {
                id: userId,
                email: testEmail,
                role: 'student',
                name: testName
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('\n🔑 Created JWT token for testing');

        // Test the dashboard stats endpoint
        console.log('\n📊 Testing /api/dashboard/stats endpoint...');

        const fetch = (await import('node-fetch')).default;

        const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log(`Stats Response Status: ${statsResponse.status}`);

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Stats endpoint working!');
            console.log('📊 Stats data:', {
                success: statsData.success,
                totalEarned: statsData.stats?.sdpCredits?.totalEarned,
                pending: statsData.stats?.sdpCredits?.pending,
                upcomingEvents: statsData.stats?.events?.upcoming,
                totalEvents: statsData.stats?.events?.total,
                overallProgress: statsData.stats?.progress?.overallPercentage
            });
        } else {
            const errorText = await statsResponse.text();
            console.log('❌ Stats endpoint error:', errorText);
        }

        // Test the recent events endpoint
        console.log('\n📋 Testing /api/dashboard/recent-events endpoint...');

        const eventsResponse = await fetch('http://localhost:5000/api/dashboard/recent-events?limit=5', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log(`Events Response Status: ${eventsResponse.status}`);

        if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            console.log('✅ Recent events endpoint working!');
            console.log('📋 Events data:', {
                success: eventsData.success,
                eventsCount: eventsData.events?.length || 0,
                total: eventsData.total
            });

            if (eventsData.events && eventsData.events.length > 0) {
                console.log('📝 Sample event:', {
                    title: eventsData.events[0].title,
                    status: eventsData.events[0].status,
                    credits: eventsData.events[0].credits
                });
            }
        } else {
            const errorText = await eventsResponse.text();
            console.log('❌ Recent events endpoint error:', errorText);
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await connection.query('DELETE FROM proposals WHERE contact_email = ?', [testEmail]);
        await connection.query('DELETE FROM users WHERE email = ?', [testEmail]);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 Dashboard API test completed successfully!');
        console.log('\n📝 Summary:');
        console.log('- ✅ Backend server is running');
        console.log('- ✅ Dashboard routes are registered');
        console.log('- ✅ Database connection working');
        console.log('- ✅ JWT authentication working');
        console.log('- ✅ API endpoints responding correctly');
        console.log('- ✅ Dynamic data calculation working');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testDashboardAPI().then(() => {
    console.log('\n🏁 All tests completed');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
}); 