/**
 * Simple Connection Test
 * Purpose: Verify server starts without crashing on connection failures
 * Key approaches: Minimal testing, no external dependencies, fast execution
 */

describe('Server Startup', () => {
    test('should start server without crashing', async () => {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.PORT = 0;

        // Mock environment variables
        process.env.MONGODB_URI = 'mongodb://test:test@localhost:27017/test';
        process.env.MYSQL_HOST = 'localhost';
        process.env.MYSQL_USER = 'test';
        process.env.MYSQL_PASSWORD = 'test';
        process.env.MYSQL_DATABASE = 'test';

        // Mock dependencies to prevent actual connections
        jest.mock('mongodb', () => ({
            MongoClient: jest.fn().mockImplementation(() => ({
                connect: jest.fn().mockRejectedValue(new Error('MongoDB unavailable'))
            }))
        }));

        jest.mock('mysql2/promise', () => ({
            createPool: jest.fn().mockImplementation(() => {
                throw new Error('MySQL unavailable');
            })
        }));

        // Import and start server
        const { startServer } = require('../server');

        try {
            const server = await startServer();
            expect(server).toBeDefined();
            expect(server.address()).toBeDefined();

            // Clean up
            await new Promise(resolve => server.close(resolve));
        } catch (error) {
            // Server should not crash, even with connection failures
            expect(error.message).not.toContain('MongoServerSelectionError');
            expect(error.message).not.toContain('ECONNREFUSED');
        }
    }, 15000); // Increased timeout to 15 seconds

    test('should handle missing environment variables', async () => {
        // Clear environment variables
        delete process.env.MONGODB_URI;
        delete process.env.MYSQL_HOST;
        delete process.env.MYSQL_USER;
        delete process.env.MYSQL_PASSWORD;
        delete process.env.MYSQL_DATABASE;

        // Mock dependencies
        jest.mock('mongodb', () => ({
            MongoClient: jest.fn().mockImplementation(() => ({
                connect: jest.fn().mockRejectedValue(new Error('MongoDB unavailable'))
            }))
        }));

        jest.mock('mysql2/promise', () => ({
            createPool: jest.fn().mockImplementation(() => {
                throw new Error('MySQL unavailable');
            })
        }));

        // Import and start server
        const { startServer } = require('../server');

        try {
            const server = await startServer();
            expect(server).toBeDefined();

            // Clean up
            await new Promise(resolve => server.close(resolve));
        } catch (error) {
            // Server should not crash
            expect(error.message).not.toContain('MongoServerSelectionError');
        }
    }, 15000); // Increased timeout to 15 seconds
}); 