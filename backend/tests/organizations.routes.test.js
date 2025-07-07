// backend/tests/organizations.routes.test.js
const request = require('supertest');
const express = require('express');
const organizationsRouter = require('../routes/organizations');

jest.mock('../config/db', () => {
    const mPool = {
        query: jest.fn()
    };
    return { pool: mPool };
});

const { pool } = require('../config/db');

describe('POST /create (organizations)', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/organizations', organizationsRouter);
        jest.clearAllMocks();
    });

    it('should create organization and link types (happy path)', async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 42 }]) // org insert
            .mockResolvedValueOnce([[{ id: 1 }]]) // type lookup
            .mockResolvedValueOnce([{}]); // type link insert

        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'Test Org',
                organizationTypes: ['University'],
                organizationDescription: 'A test org',
                contactName: 'Alice',
                contactEmail: 'alice@test.com',
                contactPhone: '1234567890',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(42);
        expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/organizations/create')
            .send({ organizationName: '', contactName: '', contactEmail: '' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/required/);
    });

    it('should insert org without types if none provided', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 99 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'NoType Org',
                organizationDescription: 'No types',
                contactName: 'Bob',
                contactEmail: 'bob@test.com',
                contactPhone: '555',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(99);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should warn and skip unknown organization types', async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 7 }])
            .mockResolvedValueOnce([[]]); // type not found
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'UnknownType Org',
                organizationTypes: ['NonexistentType'],
                organizationDescription: 'desc',
                contactName: 'C',
                contactEmail: 'c@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('not found'));
        consoleWarn.mockRestore();
    });

    it('should handle multiple organization types', async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 8 }])
            .mockResolvedValueOnce([[{ id: 2 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ id: 3 }]])
            .mockResolvedValueOnce([{}]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'MultiType Org',
                organizationTypes: ['TypeA', 'TypeB'],
                organizationDescription: 'desc',
                contactName: 'D',
                contactEmail: 'd@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(pool.query).toHaveBeenCalledTimes(5);
    });

    it('should handle MySQL ER_NO_SUCH_TABLE error', async () => {
        pool.query.mockRejectedValueOnce({ code: 'ER_NO_SUCH_TABLE' });
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'Org',
                contactName: 'E',
                contactEmail: 'e@test.com',
            });
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/not initialized/i);
    });

    it('should handle MySQL ER_DUP_ENTRY error', async () => {
        pool.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'Org',
                contactName: 'F',
                contactEmail: 'f@test.com',
            });
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/already exists/i);
    });

    it('should handle generic DB error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB fail'));
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'Org',
                contactName: 'G',
                contactEmail: 'g@test.com',
            });
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/operation failed/i);
    });

    it('should handle empty organizationTypes array', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 123 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'EmptyTypes',
                organizationTypes: [],
                contactName: 'H',
                contactEmail: 'h@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(123);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should handle missing organizationDescription and contactPhone', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 321 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'NoDescPhone',
                contactName: 'I',
                contactEmail: 'i@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(321);
    });

    it('should not call type lookup if organizationTypes is not an array', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 555 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'NotArray',
                organizationTypes: null,
                contactName: 'J',
                contactEmail: 'j@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should handle type lookup returning multiple rows (use first)', async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 888 }])
            .mockResolvedValueOnce([[{ id: 9 }, { id: 10 }]])
            .mockResolvedValueOnce([{}]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'MultiRowType',
                organizationTypes: ['TypeX'],
                contactName: 'K',
                contactEmail: 'k@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('should handle whitespace in organizationTypes', async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 999 }])
            .mockResolvedValueOnce([[{ id: 11 }]])
            .mockResolvedValueOnce([{}]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'WhitespaceType',
                organizationTypes: ['  TypeY  '],
                contactName: 'L',
                contactEmail: 'l@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('should handle very long organizationName', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1001 }]);
        const longName = 'A'.repeat(256);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: longName,
                contactName: 'M',
                contactEmail: 'm@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1001);
    });

    it('should handle special characters in input', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1002 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'Org!@#$',
                contactName: 'N!@#$',
                contactEmail: 'n@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1002);
    });

    it('should handle empty string organizationTypes', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1003 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'EmptyStringType',
                organizationTypes: [''],
                contactName: 'O',
                contactEmail: 'o@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1003);
    });

    it('should handle numeric organizationTypes', async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 1004 }])
            .mockResolvedValueOnce([[{ id: 12 }]])
            .mockResolvedValueOnce([{}]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'NumericType',
                organizationTypes: [123],
                contactName: 'P',
                contactEmail: 'p@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1004);
    });

    it('should handle organizationTypes with null/undefined values', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1005 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'NullType',
                organizationTypes: [null, undefined],
                contactName: 'Q',
                contactEmail: 'q@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1005);
    });

    it('should handle SQL injection attempt in organizationName', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1006 }]);
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'Org"); DROP TABLE organizations;--',
                contactName: 'R',
                contactEmail: 'r@test.com',
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1006);
    });

    it('should handle extremely long contactEmail', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1007 }]);
        const longEmail = 'x'.repeat(200) + '@test.com';
        const res = await request(app)
            .post('/organizations/create')
            .send({
                organizationName: 'LongEmailOrg',
                contactName: 'S',
                contactEmail: longEmail,
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.organizationId).toBe(1007);
    });
});
