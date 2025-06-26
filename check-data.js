const mysql = require('mysql2/promise');

async function checkData() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'cedo_db'
        });

        console.log('🔍 Checking your restored database data...\n');

        // Check users
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Users: ${users[0].count} records`);

        if (users[0].count > 0) {
            const [userSample] = await connection.execute('SELECT email, name, role, created_at FROM users LIMIT 5');
            console.log('📋 Sample users:');
            userSample.forEach(user => {
                console.log(`   - ${user.email} (${user.name}) - ${user.role} - Created: ${user.created_at}`);
            });
        }

        // Check proposals
        const [proposals] = await connection.execute('SELECT COUNT(*) as count FROM proposals');
        console.log(`\n📄 Proposals: ${proposals[0].count} records`);

        if (proposals[0].count > 0) {
            const [proposalSample] = await connection.execute('SELECT title, status, created_at FROM proposals LIMIT 5');
            console.log('📋 Sample proposals:');
            proposalSample.forEach(proposal => {
                console.log(`   - "${proposal.title}" - Status: ${proposal.status} - Created: ${proposal.created_at}`);
            });
        }

        // Check access logs
        const [logs] = await connection.execute('SELECT COUNT(*) as count FROM access_logs');
        console.log(`\n📊 Access Logs: ${logs[0].count} records`);

        await connection.end();
        console.log('\n✅ Database check completed!');

    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

checkData(); 