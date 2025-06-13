const mysql = require('mysql2/promise');

async function testMySQLConnection() {
    console.log('🧪 Testing MySQL Connection...\n');

    const config = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'Raymund@Estaca01',
        database: 'cedo_auth'
    };

    try {
        console.log('📋 Connection config:', {
            host: config.host,
            port: config.port,
            user: config.user,
            database: config.database
        });

        const connection = await mysql.createConnection(config);
        console.log('✅ MySQL connection successful!');

        // Test basic query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Basic query test:', rows[0]);

        // Test database access
        const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
        console.log('✅ Current database:', dbResult[0]);

        // Check if proposals table exists
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('✅ Available tables:', tables.map(t => Object.values(t)[0]));

        await connection.end();
        console.log('\n🎉 All MySQL tests passed! Ready to start the server.');

    } catch (error) {
        console.log('❌ MySQL connection failed:', error.message);
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Make sure MySQL service is running');
        console.log('2. Check credentials in .env file');
        console.log('3. Verify database "cedo_auth" exists');
        return false;
    }

    return true;
}

testMySQLConnection(); 