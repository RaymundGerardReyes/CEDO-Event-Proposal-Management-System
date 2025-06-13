const mysql = require('mysql2/promise');

async function checkAndFixTableStructure() {
    console.log('🔍 Checking and fixing table structure...\n');

    const config = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'Raymund@Estaca01',
        database: 'cedo_auth'
    };

    try {
        const connection = await mysql.createConnection(config);

        // Check current table structure
        console.log('📋 Current proposals table structure:');
        const [columns] = await connection.execute('DESCRIBE proposals');
        console.table(columns);

        const columnNames = columns.map(col => col.Field);
        console.log('\n📝 Current columns:', columnNames);

        // Expected columns
        const expectedColumns = ['id', 'title', 'contactPerson', 'contactEmail', 'contactPhone', 'description', 'organizationType', 'status', 'created_at', 'updated_at'];
        const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));

        if (missingColumns.length > 0) {
            console.log('\n❌ Missing columns:', missingColumns);
            console.log('🔧 Fixing table structure...');

            // Drop and recreate the table with correct structure
            await connection.execute('DROP TABLE IF EXISTS proposals');
            console.log('✅ Old table dropped');

            await connection.execute(`
                CREATE TABLE proposals (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    contactPerson VARCHAR(255) NOT NULL,
                    contactEmail VARCHAR(255) NOT NULL,
                    contactPhone VARCHAR(50),
                    description TEXT,
                    organizationType VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ New table created with correct structure');

            // Verify new structure
            const [newColumns] = await connection.execute('DESCRIBE proposals');
            console.log('\n📋 New table structure:');
            console.table(newColumns);
        } else {
            console.log('\n✅ Table structure is correct!');
        }

        // Test insert/select operation
        console.log('\n🧪 Testing database operations...');
        const [result] = await connection.execute(
            'INSERT INTO proposals (title, contactPerson, contactEmail, status) VALUES (?, ?, ?, ?)',
            ['Test Proposal', 'Test User', 'test@example.com', 'draft']
        );
        console.log('✅ INSERT operation successful, ID:', result.insertId);

        const [rows] = await connection.execute('SELECT * FROM proposals WHERE id = ?', [result.insertId]);
        console.log('✅ SELECT operation successful:', rows[0]);

        // Clean up test data
        await connection.execute('DELETE FROM proposals WHERE id = ?', [result.insertId]);
        console.log('✅ Test data cleaned up');

        await connection.end();
        console.log('\n🎉 Table structure fixed and tested successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAndFixTableStructure(); 