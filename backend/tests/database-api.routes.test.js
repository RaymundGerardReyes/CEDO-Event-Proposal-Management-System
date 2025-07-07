// backend/tests/database-api.routes.test.js
// Unit tests for backend/routes/database-api.js

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { pool } = require('../config/db');
const databaseApiRouter = require('../routes/database-api');

jest.mock('../config/db');
jest.mock('mongoose', () => ({
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

    describe('MySQL CRUD', () => {
        it('GET /mysql/:table returns rows', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1 }]]).mockResolvedValueOnce([[{ total: 1 }]]);
            const res = await request(app).get('/api/database/mysql/users');
            expect(res.status).toBe(200);
            expect(res.body.data[0].id).toBe(1);
        });
        it('GET /mysql/:table/:id returns record', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 2 }]]);
            const res = await request(app).get('/api/database/mysql/users/2');
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(2);
        });
        it('GET /mysql/:table/:id 404 if not found', async () => {
            pool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).get('/api/database/mysql/users/99');
            expect(res.status).toBe(404);
        });
        it('POST /mysql/:table creates record', async () => {
            pool.query.mockResolvedValueOnce([{ insertId: 3 }]);
            const res = await request(app).post('/api/database/mysql/users').send({ name: 'A' });
            expect(res.status).toBe(201);
            expect(res.body.data.id).toBe(3);
        });
        it('POST /mysql/:table 400 if no data', async () => {
            const res = await request(app).post('/api/database/mysql/users').send({});
            expect(res.status).toBe(400);
        });
        it('PUT /mysql/:table/:id updates record', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).put('/api/database/mysql/users/1').send({ name: 'B' });
            expect(res.status).toBe(200);
        });
        it('PUT /mysql/:table/:id 404 if not found', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const res = await request(app).put('/api/database/mysql/users/99').send({ name: 'B' });
            expect(res.status).toBe(404);
        });
        it('PUT /mysql/:table/:id 400 if no data', async () => {
            const res = await request(app).put('/api/database/mysql/users/1').send({});
            expect(res.status).toBe(400);
        });
        it('DELETE /mysql/:table/:id deletes record', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).delete('/api/database/mysql/users/1');
            expect(res.status).toBe(200);
        });
        it('DELETE /mysql/:table/:id 404 if not found', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const res = await request(app).delete('/api/database/mysql/users/99');
            expect(res.status).toBe(404);
        });
    });

    describe('MongoDB CRUD', () => {
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
            mongoose.connection.db.collection.mockReturnValue(mockCollection);
        });
        it('GET /mongodb/:collection returns documents', async () => {
            const res = await request(app).get('/api/database/mongodb/test');
            expect(res.status).toBe(200);
            expect(res.body.data[0]._id).toBe('abc');
        });
        it('GET /mongodb/:collection/:id returns document', async () => {
            const res = await request(app).get('/api/database/mongodb/test/abc');
            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe('abc');
        });
        it('GET /mongodb/:collection/:id 404 if not found', async () => {
            mockCollection.findOne.mockResolvedValue(null);
            const res = await request(app).get('/api/database/mongodb/test/xyz');
            expect(res.status).toBe(404);
        });
        it('POST /mongodb/:collection creates document', async () => {
            const res = await request(app).post('/api/database/mongodb/test').send({ foo: 'bar' });
            expect(res.status).toBe(201);
            expect(res.body.data._id).toBe('abc');
        });
        it('POST /mongodb/:collection 400 if no data', async () => {
            const res = await request(app).post('/api/database/mongodb/test').send({});
            expect(res.status).toBe(400);
        });
        it('PUT /mongodb/:collection/:id updates document', async () => {
            const res = await request(app).put('/api/database/mongodb/test/abc').send({ foo: 'baz' });
            expect(res.status).toBe(200);
        });
        it('PUT /mongodb/:collection/:id 404 if not found', async () => {
            mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });
            const res = await request(app).put('/api/database/mongodb/test/xyz').send({ foo: 'baz' });
            expect(res.status).toBe(404);
        });
        it('PUT /mongodb/:collection/:id 400 if no data', async () => {
            const res = await request(app).put('/api/database/mongodb/test/abc').send({});
            expect(res.status).toBe(400);
        });
        it('DELETE /mongodb/:collection/:id deletes document', async () => {
            const res = await request(app).delete('/api/database/mongodb/test/abc');
            expect(res.status).toBe(200);
        });
        it('DELETE /mongodb/:collection/:id 404 if not found', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
            const res = await request(app).delete('/api/database/mongodb/test/xyz');
            expect(res.status).toBe(404);
        });
    });

    describe('Schema & Sync', () => {
        it('GET /schema/mysql returns schema', async () => {
            pool.query.mockResolvedValueOnce([{ users: 'users' }]).mockResolvedValueOnce([{ Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null }]);
            const res = await request(app).get('/api/database/schema/mysql');
            expect(res.status).toBe(200);
            expect(res.body.schema.users[0].name).toBe('id');
        });
        it('GET /schema/mongodb returns schema', async () => {
            mongoose.connection.db.listCollections.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ name: 'test' }]) });
            mongoose.connection.db.collection.mockReturnValue({ findOne: jest.fn().mockResolvedValue({ foo: 'bar' }) });
            const res = await request(app).get('/api/database/schema/mongodb');
            expect(res.status).toBe(200);
            expect(res.body.schema.test[0].name).toBe('foo');
        });
        it('POST /sync/mysql-to-mongodb syncs data', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
            mongoose.connection.db.collection.mockReturnValue({ insertMany: jest.fn().mockResolvedValue({ insertedCount: 1 }) });
            const res = await request(app).post('/api/database/sync/mysql-to-mongodb').send({ sourceTable: 'users', targetCollection: 'users' });
            expect(res.status).toBe(200);
            expect(res.body.insertedCount).toBe(1);
        });
        it('POST /sync/mysql-to-mongodb 400 if missing params', async () => {
            const res = await request(app).post('/api/database/sync/mysql-to-mongodb').send({});
            expect(res.status).toBe(400);
        });
        it('POST /sync/mongodb-to-mysql syncs data', async () => {
            mongoose.connection.db.collection.mockReturnValue({ find: jest.fn().mockReturnThis(), toArray: jest.fn().mockResolvedValue([{ foo: 'bar' }]) });
            pool.query.mockResolvedValueOnce([{ Field: 'foo' }]);
            pool.query.mockResolvedValue();
            const res = await request(app).post('/api/database/sync/mongodb-to-mysql').send({ sourceCollection: 'test', targetTable: 'test' });
            expect(res.status).toBe(200);
        });
        it('POST /sync/mongodb-to-mysql 400 if missing params', async () => {
            const res = await request(app).post('/api/database/sync/mongodb-to-mysql').send({});
            expect(res.status).toBe(400);
        });
    });
});
