// tests/db-check.middleware.test.js
const dbCheck = require('../../middleware/db-check');
const { pool } = require('../../config/db');

describe('DB Check Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('tableExists', () => {
        it('should return true if table exists', async () => {
            pool.query = jest.fn().mockResolvedValue([[{ count: 1 }]]);
            const exists = await dbCheck.tableExists('users');
            expect(exists).toBe(true);
        });

        it('should return false if table does not exist', async () => {
            pool.query = jest.fn().mockResolvedValue([[{ count: 0 }]]);
            const exists = await dbCheck.tableExists('users');
            expect(exists).toBe(false);
        });

        it('should return false and log error on query failure', async () => {
            const error = jest.spyOn(console, 'error').mockImplementation(() => { });
            pool.query = jest.fn().mockRejectedValue(new Error('fail'));
            const exists = await dbCheck.tableExists('users');
            expect(exists).toBe(false);
            expect(error).toHaveBeenCalled();
            error.mockRestore();
        });
    });

    describe('createUsersTable', () => {
        it('should create users table if not exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockResolvedValue([{}]);
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createUsersTable();
            expect(queryMock).toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE users/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should not create users table if exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(true);
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SELECT COUNT\(\*\)/.test(sql)) return Promise.resolve([[{ count: 1 }]]);
                return Promise.resolve([{}]);
            });
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createUsersTable();
            expect(queryMock).not.toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE users/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should throw and log error on failure', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockRejectedValue(new Error('fail'));
            const error = jest.spyOn(console, 'error').mockImplementation(() => { });
            await expect(dbCheck.createUsersTable()).rejects.toThrow();
            expect(error).toHaveBeenCalled();
            error.mockRestore();
            queryMock.mockRestore();
        });
    });

    describe('createAccessLogsTable', () => {
        it('should create access_logs table if not exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockResolvedValue([{}]);
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createAccessLogsTable();
            expect(queryMock).toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE access_logs/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should not create access_logs table if exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(true);
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SELECT COUNT\(\*\)/.test(sql)) return Promise.resolve([[{ count: 1 }]]);
                return Promise.resolve([{}]);
            });
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createAccessLogsTable();
            expect(queryMock).not.toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE access_logs/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should throw and log error on failure', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockRejectedValue(new Error('fail'));
            const error = jest.spyOn(console, 'error').mockImplementation(() => { });
            await expect(dbCheck.createAccessLogsTable()).rejects.toThrow();
            expect(error).toHaveBeenCalled();
            error.mockRestore();
            queryMock.mockRestore();
        });
    });

    describe('createProposalsTable', () => {
        it('should create proposals table if not exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockResolvedValue([{}]);
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createProposalsTable();
            expect(queryMock).toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE proposals/));
            log.mockRestore();
            queryMock.mockRestore();
        });
        it('should not create proposals table if exists', async () => {
            // Mock the actual tableExists function that's being called
            const mockTableExists = jest.fn().mockResolvedValue(true);
            // Simulate all required columns present (as returned by postgresql driver)
            const allFields = [
                { Field: 'id' },
                { Field: 'digital_signature' },
                { Field: 'accomplishment_report_file_name' },
                { Field: 'accomplishment_report_file_path' },
                { Field: 'pre_registration_file_name' },
                { Field: 'pre_registration_file_path' },
                { Field: 'final_attendance_file_name' },
                { Field: 'final_attendance_file_path' },
                { Field: 'attendance_count' },
                { Field: 'event_status' },
                { Field: 'report_description' }
            ];
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SHOW COLUMNS FROM proposals/.test(sql)) return Promise.resolve([[...allFields]]); // Always nested array
                // Defensive: simulate no CREATE/ALTER calls
                if (/CREATE TABLE proposals/.test(sql) || /ALTER TABLE proposals/.test(sql)) return Promise.reject(new Error('Should not be called'));
                return Promise.resolve([{}]);
            });
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createProposalsTable(mockTableExists);
            expect(mockTableExists).toHaveBeenCalledWith('proposals');
            expect(queryMock).not.toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE proposals/));
            expect(queryMock).not.toHaveBeenCalledWith(expect.stringMatching(/ALTER TABLE proposals/));
            log.mockRestore();
            queryMock.mockRestore();
        });
    });

    describe('proposals table column logic', () => {
        it('should alter proposals table if missing columns', async () => {
            const mockTableExists = jest.fn().mockResolvedValue(true);
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SHOW COLUMNS FROM proposals/.test(sql)) return Promise.resolve([[{ Field: 'id' }]]); // Always nested array
                if (/ALTER TABLE proposals/.test(sql)) return Promise.resolve([{}]);
                return Promise.resolve([{}]);
            });
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createProposalsTable(mockTableExists);
            expect(mockTableExists).toHaveBeenCalledWith('proposals');
            expect(queryMock).toHaveBeenCalledWith(expect.stringMatching(/ALTER TABLE proposals/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should log if all Section-5 columns present', async () => {
            const mockTableExists = jest.fn().mockResolvedValue(true);
            const allFields = [
                { Field: 'id' },
                { Field: 'digital_signature' },
                { Field: 'accomplishment_report_file_name' },
                { Field: 'accomplishment_report_file_path' },
                { Field: 'pre_registration_file_name' },
                { Field: 'pre_registration_file_path' },
                { Field: 'final_attendance_file_name' },
                { Field: 'final_attendance_file_path' },
                { Field: 'attendance_count' },
                { Field: 'event_status' },
                { Field: 'report_description' }
            ];
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SHOW COLUMNS FROM proposals/.test(sql)) return Promise.resolve([[...allFields]]); // Always nested array
                return Promise.resolve([{}]);
            });
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createProposalsTable(mockTableExists);
            expect(mockTableExists).toHaveBeenCalledWith('proposals');
            expect(log.mock.calls.some(call => /All Section-5 columns present/.test(call[0]))).toBe(true);
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should log and not throw on column check error', async () => {
            const mockTableExists = jest.fn().mockResolvedValue(true);
            const queryMock = jest.spyOn(pool, 'query').mockResolvedValue([[{ Field: 'id' }]]);
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            queryMock.mockImplementationOnce(() => { throw new Error('fail'); });
            const error = jest.spyOn(console, 'error').mockImplementation(() => { });
            await dbCheck.createProposalsTable(mockTableExists);
            expect(mockTableExists).toHaveBeenCalledWith('proposals');
            expect(error).toHaveBeenCalled();
            log.mockRestore();
            error.mockRestore();
            queryMock.mockRestore();
        });
    });

    describe('createReviewsTable', () => {
        it('should create reviews table if not exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockResolvedValue([{}]);
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createReviewsTable();
            expect(queryMock).toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE reviews/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should not create reviews table if exists', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(true);
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SELECT COUNT\(\*\)/.test(sql)) return Promise.resolve([[{ count: 1 }]]);
                return Promise.resolve([{}]);
            });
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.createReviewsTable();
            expect(queryMock).not.toHaveBeenCalledWith(expect.stringMatching(/CREATE TABLE reviews/));
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should throw and log error on failure', async () => {
            jest.spyOn(dbCheck, 'tableExists').mockResolvedValue(false);
            const queryMock = jest.spyOn(pool, 'query').mockRejectedValue(new Error('fail'));
            const error = jest.spyOn(console, 'error').mockImplementation(() => { });
            await expect(dbCheck.createReviewsTable()).rejects.toThrow();
            expect(error).toHaveBeenCalled();
            error.mockRestore();
            queryMock.mockRestore();
        });
    });

    describe('ensureTablesExist', () => {
        it('should skip table creation if db unreachable', async () => {
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => { });
            pool.query = jest.fn().mockRejectedValueOnce(new Error('fail'));
            await dbCheck.ensureTablesExist();
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/skipping table creation/i));
            warn.mockRestore();
        });

        it('should create all tables and default admin if users empty', async () => {
            pool.query = jest.fn()
                .mockResolvedValueOnce([{}]) // SELECT 1
                .mockResolvedValueOnce([{}]) // createUsersTable
                .mockResolvedValueOnce([{}]) // createAccessLogsTable
                .mockResolvedValueOnce([{}]) // createProposalsTable
                .mockResolvedValueOnce([{}]) // createReviewsTable
                .mockResolvedValueOnce([{ count: 0 }]) // SELECT COUNT(*)
                .mockResolvedValueOnce([{}]); // INSERT admin
            jest.spyOn(dbCheck, 'createUsersTable').mockResolvedValue();
            jest.spyOn(dbCheck, 'createAccessLogsTable').mockResolvedValue();
            jest.spyOn(dbCheck, 'createProposalsTable').mockResolvedValue();
            jest.spyOn(dbCheck, 'createReviewsTable').mockResolvedValue();
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.ensureTablesExist();
            expect(log).toHaveBeenCalledWith(expect.stringMatching(/default admin user created successfully/i));
            log.mockRestore();
        });

        it('should not create default admin if users exist', async () => {
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SELECT 1/.test(sql)) return Promise.resolve([{}]);
                if (/SELECT COUNT\(\*\) as count FROM users/.test(sql)) return Promise.resolve([{ count: 1 }]);
                return Promise.resolve([{}]);
            });
            jest.spyOn(dbCheck, 'createUsersTable').mockResolvedValue();
            jest.spyOn(dbCheck, 'createAccessLogsTable').mockResolvedValue();
            jest.spyOn(dbCheck, 'createProposalsTable').mockResolvedValue();
            jest.spyOn(dbCheck, 'createReviewsTable').mockResolvedValue();
            const log = jest.spyOn(console, 'log').mockImplementation(() => { });
            await dbCheck.ensureTablesExist();
            expect(log.mock.calls.some(call => /default admin user created successfully/i.test(call[0]))).toBe(false);
            log.mockRestore();
            queryMock.mockRestore();
        });

        it('should log error but not throw on table creation error', async () => {
            const queryMock = jest.spyOn(pool, 'query').mockImplementation((sql) => {
                if (/SELECT 1/.test(sql)) return Promise.resolve([{}]);
                if (/SELECT COUNT\(\*\) as count FROM users/.test(sql)) return Promise.resolve([[{ count: 0 }]]);
                return Promise.resolve([{}]);
            });

            // Mock the actual functions that are being called
            const originalCreateUsersTable = dbCheck.createUsersTable;
            dbCheck.createUsersTable = jest.fn().mockRejectedValue(new Error('fail'));

            // Move this BEFORE the function call!
            const error = jest.spyOn(console, 'error').mockImplementation(() => { });

            await expect(dbCheck.ensureTablesExist()).resolves.not.toThrow();
            expect(error).toHaveBeenCalled();

            error.mockRestore();
            queryMock.mockRestore();
            dbCheck.createUsersTable = originalCreateUsersTable;
        });
    });
});