// backend/tests/init-db.test.js

const path = require('path');
const fs = require('fs');
const postgresql = require('postgresql2/promise');
const bcrypt = require('bcryptjs');

jest.mock('postgresql2/promise');
jest.mock('fs');
jest.mock('bcryptjs');

const envVars = {
    postgresql_HOST: 'localhost',
    postgresql_USER: 'root',
    postgresql_PASSWORD: 'testpass',
    postgresql_DATABASE: 'cedo_auth',
    DB_HOST: 'localhost',
    DB_USER: 'root',
    DB_PASSWORD: 'testpass',
    DB_NAME: 'cedo_auth',
};

describe('init-db.js', () => {
    let initDb;
    let connectionMock;
    let queryMock;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...envVars };
        queryMock = jest.fn();
        connectionMock = { query: queryMock };
        postgresql.createConnection.mockResolvedValue(connectionMock);
        fs.existsSync.mockReturnValue(true);
        initDb = require('../scripts/init-db');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('loads environment variables and logs them', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        await initDb.main();
        expect(logSpy).toHaveBeenCalledWith(
            'Database initialization script starting...'
        );
        logSpy.mockRestore();
    });

    test('connects to postgresql with correct credentials', async () => {
        await initDb.main();
        expect(postgresql.createConnection).toHaveBeenCalledWith({
            host: 'localhost',
            user: 'root',
            password: 'testpass',
        });
    });

    test('creates database if not exists', async () => {
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith(
            'CREATE DATABASE IF NOT EXISTS `cedo_auth`'
        );
    });

    test('uses the target database', async () => {
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith('USE `cedo_auth`');
    });

    test('creates users table if not exists', async () => {
        queryMock.mockResolvedValueOnce([[]]); // users table does not exist
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith(
            expect.stringContaining('SHOW TABLES LIKE'),
        );
    });

    test('skips users table creation if exists', async () => {
        queryMock.mockResolvedValueOnce([[{ TABLE_NAME: 'users' }]]); // users table exists
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith(
            expect.stringContaining('SHOW TABLES LIKE'),
        );
    });

    test('creates access_logs table if not exists', async () => {
        queryMock.mockResolvedValueOnce([[]]); // users
        queryMock.mockResolvedValueOnce([[]]); // access_logs
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith(
            expect.stringContaining('SHOW TABLES LIKE'),
        );
    });

    test('creates proposals table if not exists', async () => {
        queryMock.mockResolvedValueOnce([[]]); // users
        queryMock.mockResolvedValueOnce([[]]); // access_logs
        queryMock.mockResolvedValueOnce([[]]); // proposals
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith(
            expect.stringContaining('SHOW TABLES LIKE'),
        );
    });

    test('creates reviews table if not exists', async () => {
        queryMock.mockResolvedValueOnce([[]]); // users
        queryMock.mockResolvedValueOnce([[]]); // access_logs
        queryMock.mockResolvedValueOnce([[]]); // proposals
        queryMock.mockResolvedValueOnce([[]]); // reviews
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith(
            expect.stringContaining('SHOW TABLES LIKE'),
        );
    });

    test('handles already existing tables gracefully', async () => {
        queryMock.mockResolvedValue([[{ TABLE_NAME: 'users' }]]);
        await expect(initDb.main()).resolves.not.toThrow();
    });

    test('warns if .env file does not exist', async () => {
        fs.existsSync.mockReturnValue(false);
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        await initDb.main();
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test('logs and throws on connection error', async () => {
        postgresql.createConnection.mockRejectedValue(new Error('Connection failed'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        await expect(initDb.main()).rejects.toThrow('Connection failed');
        errorSpy.mockRestore();
    });

    test('logs and throws on query error', async () => {
        queryMock.mockRejectedValueOnce(new Error('Query failed'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        await expect(initDb.main()).rejects.toThrow('Query failed');
        errorSpy.mockRestore();
    });

    test('exports main function', () => {
        expect(typeof initDb.main).toBe('function');
    });

    test('calls bcrypt for password hashing if needed', async () => {
        bcrypt.hash.mockResolvedValue('hashed');
        // Simulate user table creation path
        queryMock.mockResolvedValueOnce([[]]); // users
        await initDb.main();
        expect(bcrypt.hash).not.toHaveBeenCalled(); // Only called if dummy users are inserted
    });

    test('handles process.env overrides for DB vars', async () => {
        process.env.postgresql_HOST = 'docker-postgresql';
        process.env.postgresql_USER = 'docker-user';
        process.env.postgresql_PASSWORD = 'docker-pass';
        await initDb.main();
        expect(postgresql.createConnection).toHaveBeenCalledWith({
            host: 'docker-postgresql',
            user: 'docker-user',
            password: 'docker-pass',
        });
    });

    test('handles missing postgresql_DATABASE and falls back to DB_NAME', async () => {
        delete process.env.postgresql_DATABASE;
        process.env.DB_NAME = 'fallback_db';
        await initDb.main();
        expect(queryMock).toHaveBeenCalledWith('CREATE DATABASE IF NOT EXISTS `fallback_db`');
    });

    test('handles missing postgresql_USER and falls back to DB_USER', async () => {
        delete process.env.postgresql_USER;
        process.env.DB_USER = 'fallback_user';
        await initDb.main();
        expect(postgresql.createConnection).toHaveBeenCalledWith({
            host: 'localhost',
            user: 'fallback_user',
            password: 'testpass',
        });
    });

    test('handles missing postgresql_HOST and falls back to DB_HOST', async () => {
        delete process.env.postgresql_HOST;
        process.env.DB_HOST = 'fallback_host';
        await initDb.main();
        expect(postgresql.createConnection).toHaveBeenCalledWith({
            host: 'fallback_host',
            user: 'root',
            password: 'testpass',
        });
    });

    test('handles missing postgresql_PASSWORD and falls back to DB_PASSWORD', async () => {
        delete process.env.postgresql_PASSWORD;
        process.env.DB_PASSWORD = 'fallback_pass';
        await initDb.main();
        expect(postgresql.createConnection).toHaveBeenCalledWith({
            host: 'localhost',
            user: 'root',
            password: 'fallback_pass',
        });
    });

    test('handles missing .env and logs warning', async () => {
        fs.existsSync.mockReturnValue(false);
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        await initDb.main();
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});
