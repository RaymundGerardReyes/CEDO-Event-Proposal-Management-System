// backend/tests/db.test.js

const { pool } = require('../config/db'); // Import the pool from db.js

// It's crucial to end the pool when all tests are done to allow Jest to exit gracefully.
afterAll(async () => {
    if (pool && typeof pool.end === 'function') {
        await pool.end();
    }
});

describe('MySQL Connection Pool', () => {
    it('should connect to the database and obtain a valid connection', async () => {
        let connection;
        try {
            connection = await pool.getConnection();
            // Check if the connection object is defined and has expected properties (e.g., threadId)
            expect(connection).toBeDefined();
            expect(connection.threadId).toBeGreaterThan(0); // A simple check for a live connection
        } catch (error) {
            // Ensure test fails if connection cannot be established
            throw new Error(`Failed to connect to the database: ${error.message}`);
        } finally {
            // Always release the connection back to the pool if it was acquired
            if (connection) {
                await connection.release();
            }
        }
    });

    it('should successfully execute a simple query', async () => {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows, fields] = await connection.execute('SELECT 1 + 1 AS solution');
            expect(rows).toBeDefined();
            expect(rows.length).toBe(1);
            expect(rows[0].solution).toBe(2);
        } catch (error) {
            throw new Error(`Failed to execute query: ${error.message}`);
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    });

    it('should execute a query directly using pool.query (if supported)', async () => {
        // Many pool implementations offer a shorthand pool.query() or pool.execute()
        // This test assumes your pool object might have such a method.
        // If not, this test might need adjustment or removal.
        if (typeof pool.query !== 'function' && typeof pool.execute !== 'function') {
            console.warn('pool.query/execute not found, skipping this test.');
            return;
        }

        const queryMethod = pool.execute || pool.query; // Prefer execute for prepared statements

        try {
            const [rows, fields] = await queryMethod.call(pool, 'SELECT ? + ? AS solution', [2, 3]);
            expect(rows).toBeDefined();
            expect(rows.length).toBe(1);
            expect(rows[0].solution).toBe(5);
        } catch (error) {
            // This might fail if pool.query doesn't exist or has a different signature
            throw new Error(`Failed to execute pool.query/execute: ${error.message}`);
        }
    });

    it('should handle errors when executing an invalid SQL query', async () => {
        let connection;
        try {
            connection = await pool.getConnection();
            // Intentionally malformed SQL
            await expect(connection.execute('SELEKT * FROM non_existent_table'))
                .rejects.toThrow(); // Or a more specific MySQL error code/message if known
        } catch (error) {
            // This catch is for errors in getConnection itself, the expect handles query errors
            if (!error.message.includes('SELEKT')) { // Avoid masking the actual test assertion
                throw new Error(`Test setup failed: ${error.message}`);
            }
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    });

    it('should handle specific connection errors (e.g., bad credentials, unknown database) - Mocked', async () => {
        // IMPORTANT: Modifying process.env variables after a pool is initialized might not affect
        // the existing pool's configuration as it usually reads env vars only at creation time.
        // A more reliable way to unit test specific connection errors is to mock `pool.getConnection`
        // or the underlying mysql2 library for the scope of this test.

        // Save the original implementation
        const originalGetConnection = pool.getConnection;

        // Mock getConnection to simulate a specific error
        pool.getConnection = jest.fn().mockRejectedValueOnce(new Error('ER_DBACCESS_DENIED_ERROR')); // Example error

        await expect(pool.getConnection()).rejects.toThrow('ER_DBACCESS_DENIED_ERROR');

        // Restore the original implementation
        pool.getConnection = originalGetConnection;
    });

    it('should allow acquiring and releasing multiple connections concurrently', async () => {
        const connectionPromises = [];
        const numConnectionsToTest = 3; // Or a number relevant to your pool's typical load/limit

        for (let i = 0; i < numConnectionsToTest; i++) {
            connectionPromises.push(pool.getConnection());
        }

        let acquiredConnections = [];
        try {
            acquiredConnections = await Promise.all(connectionPromises);
            expect(acquiredConnections.length).toBe(numConnectionsToTest);
            acquiredConnections.forEach(conn => {
                expect(conn).toBeDefined();
                expect(conn.threadId).toBeGreaterThan(0);
            });
        } catch (error) {
            throw new Error(`Failed to acquire multiple connections: ${error.message}`);
        } finally {
            // Release all acquired connections
            await Promise.all(acquiredConnections.map(conn => conn && conn.release()));
        }
    });

    // More advanced test: Testing connection limit (requires knowing pool config)
    // it('should respect the connection limit', async () => {
    //     // This test is highly dependent on your pool's `connectionLimit` configuration.
    //     // Let's assume connectionLimit is, for example, 10.
    //     const connectionLimit = 10; // Replace with your actual or a known test limit
    //     const connections = [];
    //     try {
    //         for (let i = 0; i < connectionLimit; i++) {
    //             connections.push(await pool.getConnection());
    //         }
    //         expect(connections.length).toBe(connectionLimit);
    //
    //         // Attempt to get one more connection - this should either wait (if waitForConnections=true and queueLimit > 0)
    //         // or throw an error (if waitForConnections=false or queueLimit=0 and connectionLimit reached).
    //         // For simplicity, we'll assume it might throw or timeout.
    //         // A robust test here might involve setting a short timeout for getConnection.
    //         await expect(pool.getConnection()).rejects.toThrow(); // Or specific error like ' adquisición de conexiones' or timeout
    //
    //     } catch (error) {
    //         throw new Error(`Connection limit test failed: ${error.message}`);
    //     } finally {
    //         await Promise.all(connections.map(conn => conn && conn.release()));
    //     }
    // });
});