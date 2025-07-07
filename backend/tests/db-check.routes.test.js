// backend/tests/db-check.routes.test.js
// Unit tests for backend/routes/db-check.js

const request = require('supertest');
const express = require('express');
const dbCheckRouter = require('../routes/db-check');
const { pool } = require('../config/db');

jest.mock('../config/db');

const app = express();
app.use(express.json());
app.use('/api', dbCheckRouter);

describe('DB Check Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.MYSQL_DATABASE = 'cedo_auth';
    });

    describe('GET /db-check', () => {
        it('should return healthy if DB connection works', async () => {
            pool.query.mockResolvedValueOnce([[{ '1': 1 }]]);
            const res = await request(app).get('/api/db-check');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
        it('should return 500 if DB connection fails', async () => {
            pool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).get('/api/db-check');
            expect(res.status).toBe(500);
            expect(res.body.status).toBe('error');
        });
    });

    describe('GET /tables-check', () => {
        function mockTable(name, exists = true) {
            return exists ? [{ TABLE_NAME: name }] : [];
        }
        it('should return all tables as present', async () => {
            pool.query
                .mockResolvedValueOnce(mockTable('users'))
                .mockResolvedValueOnce(mockTable('access_logs'))
                .mockResolvedValueOnce(mockTable('proposals'))
                .mockResolvedValueOnce(mockTable('reviews'))
                .mockResolvedValueOnce(mockTable('organizations'))
                .mockResolvedValueOnce(mockTable('organization_types'))
                .mockResolvedValueOnce(mockTable('organization_type_links'));
            const res = await request(app).get('/api/tables-check');
            expect(res.status).toBe(200);
            expect(res.body.tables.users).toBe(true);
            expect(res.body.tables.access_logs).toBe(true);
            expect(res.body.tables.proposals).toBe(true);
            expect(res.body.tables.reviews).toBe(true);
            expect(res.body.tables.organizations).toBe(true);
            expect(res.body.tables.organization_types).toBe(true);
            expect(res.body.tables.organization_type_links).toBe(true);
        });
        it('should return false for missing tables', async () => {
            pool.query
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);
            const res = await request(app).get('/api/tables-check');
            expect(res.status).toBe(200);
            Object.values(res.body.tables).forEach(val => expect(val).toBe(false));
        });
        it('should return 500 on error', async () => {
            pool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).get('/api/tables-check');
            expect(res.status).toBe(500);
            expect(res.body.status).toBe('error');
        });
    });

    describe('POST /init-tables', () => {
        it('should return success if init-db.main resolves', async () => {
            jest.resetModules();
            jest.doMock('../scripts/init-db', () => ({ main: jest.fn().mockResolvedValue() }));
            const router = require('../routes/db-check');
            const app2 = express();
            app2.use(express.json());
            app2.use('/api', router);
            const res = await request(app2).post('/api/init-tables');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
        it('should return 500 if init-db.main rejects', async () => {
            jest.resetModules();
            jest.doMock('../scripts/init-db', () => ({ main: jest.fn().mockRejectedValue(new Error('fail')) }));
            const router = require('../routes/db-check');
            const app2 = express();
            app2.use(express.json());
            app2.use('/api', router);
            const res = await request(app2).post('/api/init-tables');
            expect(res.status).toBe(500);
            expect(res.body.status).toBe('error');
        });
    });

    // Additional edge cases for coverage
    it('should use default db name if env not set', async () => {
        delete process.env.MYSQL_DATABASE;
        pool.query.mockResolvedValue([{ TABLE_NAME: 'users' }]);
        await request(app).get('/api/tables-check');
        expect(pool.query).toHaveBeenCalled();
    });

    it('should handle multiple errors in /tables-check', async () => {
        pool.query.mockRejectedValue(new Error('fail'));
        const res = await request(app).get('/api/tables-check');
        expect(res.status).toBe(500);
    });
});
