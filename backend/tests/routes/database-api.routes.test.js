// backend/tests/database-api.routes.test.js
// Unit tests for backend/routes/database-api.js

const request = require('supertest');
const express = require('express');
const postgresqlose = require('postgresqlose');
const { pool, query } = require('../../config/database-postgresql-only');
const databaseApiRouter = require('../../routes/database-api');

jest.mock('../config/db');
jest.mock('postgresqlose', () => ({
    connection: { db: { collection: jest.fn(), listCollections: jest.fn() } },
    Types: { ObjectId: jest.fn((id) => id) }
}));

const app = express();
app.use(express.json());
app.use('/api/database', databaseApiRouter);

describe('Database API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('postgresql CRUD', () => {
        it('GET /postgresql/:table returns rows', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1 }]]).mockResolvedValueOnce([[{ total: 1 }]]);
            const res = await request(app).get('/api/database/postgresql/users');
            expect(res.status).toBe(200);
            expect(res.body.data[0].id).toBe(1);
        });
        it('GET /postgresql/:table/:id returns record', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 2 }]]);
            const res = await request(app).get('/api/database/postgresql/users/2');
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(2);
        });
        it('GET /postgresql/:table/:id 404 if not found', async () => {
            pool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).get('/api/database/postgresql/users/99');
            expect(res.status).toBe(404);
        });
        it('POST /postgresql/:table creates record', async () => {
            pool.query.mockResolvedValueOnce([{ insertId: 3 }]);
            const res = await request(app).post('/api/database/postgresql/users').send({ name: 'A' });
            expect(res.status).toBe(201);
            expect(res.body.data.id).toBe(3);
        });
        it('POST /postgresql/:table 400 if no data', async () => {
            const res = await request(app).post('/api/database/postgresql/users').send({});
            expect(res.status).toBe(400);
        });
        it('PUT /postgresql/:table/:id updates record', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).put('/api/database/postgresql/users/1').send({ name: 'B' });
            expect(res.status).toBe(200);
        });
        it('PUT /postgresql/:table/:id 404 if not found', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const res = await request(app).put('/api/database/postgresql/users/99').send({ name: 'B' });
            expect(res.status).toBe(404);
        });
        it('PUT /postgresql/:table/:id 400 if no data', async () => {
            const res = await request(app).put('/api/database/postgresql/users/1').send({});
            expect(res.status).toBe(400);
        });
        it('DELETE /postgresql/:table/:id deletes record', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).delete('/api/database/postgresql/users/1');
            expect(res.status).toBe(200);
        });
        it('DELETE /postgresql/:table/:id 404 if not found', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const res = await request(app).delete('/api/database/postgresql/users/99');
            expect(res.status).toBe(404);
        });
    });

    describe('postgresql CRUD', () => {
        let mockCollection;
        beforeEach(() => {
            mockCollection = {
                find: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                toArray: jest.fn().mockResolvedValue([{ _id: 'abc' }]),
                countDocuments: jest.fn().mockResolvedValue(1),
                findOne: jest.fn().mockResolvedValue({ _id: 'abc' }),
                insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc' }),
                updateOne: jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
                insertMany: jest.fn().mockResolvedValue({ insertedCount: 1 })
            };
            postgresqlose.connection.db.collection.mockReturnValue(mockCollection);
        });
        it('GET /postgresql/:collection returns documents', async () => {
            const res = await request(app).get('/api/database/postgresql/test');
            expect(res.status).toBe(200);
            expect(res.body.data[0]._id).toBe('abc');
        });
        it('GET /postgresql/:collection/:id returns document', async () => {
            const res = await request(app).get('/api/database/postgresql/test/abc');
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe('abc');
        });
        it('GET /postgresql/:collection/:id 404 if not found', async () => {
            mockCollection.findOne.mockResolvedValue(null);
            const res = await request(app).get('/api/database/postgresql/test/xyz');
            expect(res.status).toBe(404);
        });
        it('POST /postgresql/:collection creates document', async () => {
            const res = await request(app).post('/api/database/postgresql/test').send({ foo: 'bar' });
            expect(res.status).toBe(201);
            expect(res.body.data._id).toBe('abc');
        });
        it('POST /postgresql/:collection 400 if no data', async () => {
            const res = await request(app).post('/api/database/postgresql/test').send({});
            expect(res.status).toBe(400);
        });
        it('PUT /postgresql/:collection/:id updates document', async () => {
            const res = await request(app).put('/api/database/postgresql/test/abc').send({ foo: 'baz' });
            expect(res.status).toBe(200);
        });
        it('PUT /postgresql/:collection/:id 404 if not found', async () => {
            mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });
            const res = await request(app).put('/api/database/postgresql/test/xyz').send({ foo: 'baz' });
            expect(res.status).toBe(404);
        });
        it('PUT /postgresql/:collection/:id 400 if no data', async () => {
            const res = await request(app).put('/api/database/postgresql/test/abc').send({});
            expect(res.status).toBe(400);
        });
        it('DELETE /postgresql/:collection/:id deletes document', async () => {
            const res = await request(app).delete('/api/database/postgresql/test/abc');
            expect(res.status).toBe(200);
        });
        it('DELETE /postgresql/:collection/:id 404 if not found', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
            const res = await request(app).delete('/api/database/postgresql/test/xyz');
            expect(res.status).toBe(404);
        });
    });

    describe('Schema & Sync', () => {
        it('GET /schema/postgresql returns schema', async () => {
            pool.query.mockResolvedValueOnce([{ users: 'users' }]).mockResolvedValueOnce([{ Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null }]);
            const res = await request(app).get('/api/database/schema/postgresql');
            expect(res.status).toBe(200);
            expect(res.body.schema.users[0].name).toBe('id');
        });
        it('GET /schema/postgresql returns schema', async () => {
            postgresqlose.connection.db.listCollections.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ name: 'test' }]) });
            postgresqlose.connection.db.collection.mockReturnValue({ findOne: jest.fn().mockResolvedValue({ foo: 'bar' }) });
            const res = await request(app).get('/api/database/schema/postgresql');
            expect(res.status).toBe(200);
            expect(res.body.schema.test[0].name).toBe('foo');
        });
        it('POST /sync/postgresql-to-postgresql syncs data', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
            postgresqlose.connection.db.collection.mockReturnValue({ insertMany: jest.fn().mockResolvedValue({ insertedCount: 1 }) });
            const res = await request(app).post('/api/database/sync/postgresql-to-postgresql').send({ sourceTable: 'users', targetCollection: 'users' });
            expect(res.status).toBe(200);
            expect(res.body.insertedCount).toBe(1);
        });
        it('POST /sync/postgresql-to-postgresql 400 if missing params', async () => {
            const res = await request(app).post('/api/database/sync/postgresql-to-postgresql').send({});
            expect(res.status).toBe(400);
        });
        it('POST /sync/postgresql-to-postgresql syncs data', async () => {
            postgresqlose.connection.db.collection.mockReturnValue({ find: jest.fn().mockReturnThis(), toArray: jest.fn().mockResolvedValue([{ foo: 'bar' }]) });
            pool.query.mockResolvedValueOnce([{ Field: 'foo' }]);
            pool.query.mockResolvedValue();
            const res = await request(app).post('/api/database/sync/postgresql-to-postgresql').send({ sourceCollection: 'test', targetTable: 'test' });
            expect(res.status).toBe(200);
        });
        it('POST /sync/postgresql-to-postgresql 400 if missing params', async () => {
            const res = await request(app).post('/api/database/sync/postgresql-to-postgresql').send({});
            expect(res.status).toBe(400);
        });
    });
});
