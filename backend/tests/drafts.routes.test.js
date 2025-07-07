// backend/tests/drafts.routes.test.js
// Unit tests for backend/routes/drafts.js

const request = require('supertest');
const express = require('express');
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-draft-id') }));
const draftsRouter = require('../routes/drafts');

const app = express();
app.use(express.json());
app.use('/api', draftsRouter);

describe('Drafts Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new draft', async () => {
        const res = await request(app).post('/api/proposals/drafts');
        expect(res.status).toBe(200);
        expect(res.body.draftId).toBe('mock-draft-id');
    });

    it('should fetch a draft by id', async () => {
        await request(app).post('/api/proposals/drafts');
        const res = await request(app).get('/api/proposals/drafts/mock-draft-id');
        expect(res.status).toBe(200);
        expect(res.body.draftId).toBe('mock-draft-id');
    });

    it('should return 404 for missing draft', async () => {
        const res = await request(app).get('/api/proposals/drafts/does-not-exist');
        expect(res.status).toBe(404);
    });

    it('should update a draft section', async () => {
        await request(app).post('/api/proposals/drafts');
        const res = await request(app)
            .patch('/api/proposals/drafts/mock-draft-id/section1')
            .send({ foo: 'bar' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 404 for updating missing draft', async () => {
        const res = await request(app)
            .patch('/api/proposals/drafts/does-not-exist/section1')
            .send({ foo: 'bar' });
        expect(res.status).toBe(404);
    });

    it('should submit a draft', async () => {
        await request(app).post('/api/proposals/drafts');
        const res = await request(app).post('/api/proposals/drafts/mock-draft-id/submit');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 404 for submitting missing draft', async () => {
        const res = await request(app).post('/api/proposals/drafts/does-not-exist/submit');
        expect(res.status).toBe(404);
    });

    // Additional edge and stress cases
    it('should allow multiple drafts', async () => {
        require('uuid').v4.mockReturnValueOnce('id1').mockReturnValueOnce('id2');
        await request(app).post('/api/proposals/drafts');
        await request(app).post('/api/proposals/drafts');
        const res1 = await request(app).get('/api/proposals/drafts/id1');
        const res2 = await request(app).get('/api/proposals/drafts/id2');
        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
    });

    it('should update multiple sections', async () => {
        await request(app).post('/api/proposals/drafts');
        await request(app).patch('/api/proposals/drafts/mock-draft-id/section1').send({ foo: 1 });
        await request(app).patch('/api/proposals/drafts/mock-draft-id/section2').send({ bar: 2 });
        const res = await request(app).get('/api/proposals/drafts/mock-draft-id');
        expect(res.body.payload.section1).toEqual({ foo: 1 });
        expect(res.body.payload.section2).toEqual({ bar: 2 });
    });

    it('should update updatedAt on patch', async () => {
        await request(app).post('/api/proposals/drafts');
        const res1 = await request(app).patch('/api/proposals/drafts/mock-draft-id/section1').send({ foo: 1 });
        const res2 = await request(app).get('/api/proposals/drafts/mock-draft-id');
        expect(res2.body.updatedAt).toBeDefined();
    });

    it('should set status to submitted on submit', async () => {
        await request(app).post('/api/proposals/drafts');
        await request(app).post('/api/proposals/drafts/mock-draft-id/submit');
        const res = await request(app).get('/api/proposals/drafts/mock-draft-id');
        expect(res.body.status).toBe('submitted');
    });

    it('should not break if submit is called twice', async () => {
        await request(app).post('/api/proposals/drafts');
        await request(app).post('/api/proposals/drafts/mock-draft-id/submit');
        const res = await request(app).post('/api/proposals/drafts/mock-draft-id/submit');
        expect(res.status).toBe(200);
    });

    it('should not break if patch is called after submit', async () => {
        await request(app).post('/api/proposals/drafts');
        await request(app).post('/api/proposals/drafts/mock-draft-id/submit');
        const res = await request(app).patch('/api/proposals/drafts/mock-draft-id/section3').send({ baz: 3 });
        expect(res.status).toBe(200);
    });

    it('should keep payload as object', async () => {
        await request(app).post('/api/proposals/drafts');
        await request(app).patch('/api/proposals/drafts/mock-draft-id/section1').send({ foo: 1 });
        const res = await request(app).get('/api/proposals/drafts/mock-draft-id');
        expect(typeof res.body.payload).toBe('object');
    });

    it('should not allow non-existent draft operations', async () => {
        let res = await request(app).patch('/api/proposals/drafts/none/section').send({});
        expect(res.status).toBe(404);
        res = await request(app).post('/api/proposals/drafts/none/submit');
        expect(res.status).toBe(404);
    });

    // Stress: create, update, submit, fetch in sequence
    it('should handle create-update-submit-fetch sequence', async () => {
        await request(app).post('/api/proposals/drafts');
        await request(app).patch('/api/proposals/drafts/mock-draft-id/sectionA').send({ a: 1 });
        await request(app).post('/api/proposals/drafts/mock-draft-id/submit');
        const res = await request(app).get('/api/proposals/drafts/mock-draft-id');
        expect(res.body.status).toBe('submitted');
        expect(res.body.payload.sectionA).toEqual({ a: 1 });
    });
});
