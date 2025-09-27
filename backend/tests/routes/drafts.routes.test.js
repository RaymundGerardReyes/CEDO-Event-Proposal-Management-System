// backend/tests/drafts.routes.test.js
// Unit tests for backend/routes/drafts.js

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import draftsRouter from '../../routes/drafts';

const app = express();
app.use(express.json());
// Mount at root so test paths match router definitions exactly
app.use('/', draftsRouter);

describe('Drafts Routes', () => {
    beforeEach(() => { });

    it('creates a new draft', async () => {
        const res = await request(app).post('/proposals/drafts');
        expect(res.status).toBe(200);
        expect(typeof res.body.draftId).toBe('string');
        expect(res.body.draftId.length).toBeGreaterThan(0);
        expect(res.body.status).toBe('draft');
    });

    it('fetches a draft by id', async () => {
        const create = await request(app).post('/proposals/drafts');
        const id = create.body.draftId;
        const res = await request(app).get(`/proposals/drafts/${id}`);
        expect(res.status).toBe(200);
        expect(res.body.draftId).toBe(id);
        expect(res.body.form_data).toBeDefined();
    });

    it('returns 404 for missing draft', async () => {
        const res = await request(app).get('/proposals/drafts/does-not-exist');
        expect(res.status).toBe(404);
    });

    it('updates a draft section', async () => {
        const create = await request(app).post('/proposals/drafts');
        const id = create.body.draftId;
        const res = await request(app)
            .patch(`/api/proposals/drafts/${id}/section1`)
            .send({ foo: 'bar' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const fetched = await request(app).get(`/proposals/drafts/${id}`);
        expect(fetched.body.form_data.section1).toEqual({ foo: 'bar' });
    });

    it('returns 404 when updating non-existent draft', async () => {
        const res = await request(app)
            .patch('/api/proposals/drafts/does-not-exist/section1')
            .send({ foo: 'bar' });
        expect(res.status).toBe(404);
    });

    it('submits a draft', async () => {
        const create = await request(app).post('/proposals/drafts');
        const id = create.body.draftId;
        const res = await request(app).post(`/proposals/drafts/${id}/submit`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const fetched = await request(app).get(`/proposals/drafts/${id}`);
        expect(fetched.body.status).toBe('submitted');
    });

    it('returns 404 when submitting non-existent draft', async () => {
        const res = await request(app).post('/proposals/drafts/does-not-exist/submit');
        expect(res.status).toBe(404);
    });

    it('lists drafts', async () => {
        await request(app).post('/proposals/drafts');
        await request(app).post('/proposals/drafts');
        const res = await request(app).get('/proposals/drafts');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.drafts)).toBe(true);
        expect(res.body.count).toBeGreaterThanOrEqual(2);
    });

    it('handles create-update-submit-fetch sequence', async () => {
        const create = await request(app).post('/proposals/drafts');
        const id = create.body.draftId;
        await request(app).patch(`/api/proposals/drafts/${id}/sectionA`).send({ a: 1 });
        await request(app).post(`/proposals/drafts/${id}/submit`);
        const res = await request(app).get(`/proposals/drafts/${id}`);
        expect(res.body.status).toBe('submitted');
        expect(res.body.form_data.sectionA).toEqual({ a: 1 });
    });
});
