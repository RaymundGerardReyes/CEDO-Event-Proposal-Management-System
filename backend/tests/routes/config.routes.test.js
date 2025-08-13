// backend/tests/config.routes.test.js
// Unit tests for backend/routes/config.js

const request = require('supertest');
const express = require('express');
const configRouter = require('../../routes/config');

describe('Config Route', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use('/api/config', configRouter);
        jest.clearAllMocks();
    });

    it('should return recaptchaSiteKey if set', async () => {
        process.env.RECAPTCHA_SITE_KEY = 'test-key';
        const res = await request(app).get('/api/config');
        expect(res.status).toBe(200);
        expect(res.body.recaptchaSiteKey).toBe('test-key');
    });

    it('should return 500 if recaptchaSiteKey is not set', async () => {
        delete process.env.RECAPTCHA_SITE_KEY;
        const res = await request(app).get('/api/config');
        expect(res.status).toBe(500);
        expect(res.body.msg).toMatch(/server configuration error/i);
    });

    it('should handle unexpected errors', async () => {
        // Simulate error by replacing res.json
        const origJson = express.response.json;
        express.response.json = () => { throw new Error('fail'); };
        process.env.RECAPTCHA_SITE_KEY = 'test-key';
        const res = await request(app).get('/api/config');
        expect(res.status).toBe(500);
        express.response.json = origJson;
    });
});
