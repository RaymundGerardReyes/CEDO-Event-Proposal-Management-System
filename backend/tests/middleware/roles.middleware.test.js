// tests/middleware/roles.middleware.test.js

const express = require('express');
const request = require('supertest');
const requireRole = require('../../middleware/roles');

describe('Roles Middleware (Isolated)', () => {
    const createApp = ({ role }, middleware) => {
        const app = express();
        app.use(express.json());

        app.get('/test', (req, res, next) => {
            if (role !== undefined) req.user = { role };
            next();
        }, middleware, (req, res) => {
            res.status(200).json({ success: true });
        });

        return app;
    };

    const runTest = async (options, expectedStatus, expectedBody) => {
        const { role, allowedRoles } = options;
        const app = createApp({ role }, requireRole(allowedRoles));
        const res = await request(app).get('/test');
        expect(res.status).toBe(expectedStatus);
        if (expectedBody) {
            Object.entries(expectedBody).forEach(([key, val]) => {
                expect(res.body[key]).toMatch(val instanceof RegExp ? val : new RegExp(val, 'i'));
            });
        }
    };

    it('allows access for a single allowed role', async () => {
        await runTest({ role: 'admin', allowedRoles: 'admin' }, 200);
    });

    it('denies access for disallowed role', async () => {
        await runTest({ role: 'user', allowedRoles: 'admin' }, 403, { error: 'forbidden' });
    });

    it('allows any of multiple allowed roles', async () => {
        await runTest({ role: 'editor', allowedRoles: ['admin', 'editor'] }, 200);
    });

    it('denies if role not in allowed list', async () => {
        await runTest({ role: 'guest', allowedRoles: ['admin', 'editor'] }, 403);
    });

    it('handles nested arrays of roles', async () => {
        await runTest({ role: 'admin', allowedRoles: ['admin', 'user'] }, 200);
    });

    it('returns 401 if req.user is missing', async () => {
        await runTest({ role: undefined, allowedRoles: 'admin' }, 401, { error: 'unauthorized' });
    });

    it('returns 401 if req.user.role is undefined', async () => {
        const app = express();
        app.get('/test', (req, res, next) => {
            req.user = {}; next();
        }, requireRole('admin'), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/test');
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/unauthorized/i);
    });

    it('denies access for empty allowedRoles', async () => {
        await runTest({ role: 'admin', allowedRoles: [] }, 403);
    });

    it('allows numeric roles', async () => {
        await runTest({ role: 1, allowedRoles: [1, 2] }, 200);
    });

    it('denies mismatched numeric role', async () => {
        await runTest({ role: 3, allowedRoles: [1, 2] }, 403);
    });

    it('allows extra fields in user', async () => {
        const app = express();
        app.get('/test', (req, res, next) => {
            req.user = { role: 'admin', name: 'Test', id: 123 };
            next();
        }, requireRole('admin'), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/test');
        expect(res.status).toBe(200);
    });

    it('allows boolean role match', async () => {
        await runTest({ role: true, allowedRoles: true }, 200);
    });

    it('denies boolean role mismatch', async () => {
        await runTest({ role: false, allowedRoles: true }, 403);
    });

    it('allows symbol role match', async () => {
        const sym = Symbol('admin');
        await runTest({ role: sym, allowedRoles: sym }, 200);
    });

    it('denies mismatched symbol role', async () => {
        await runTest({ role: Symbol('admin'), allowedRoles: Symbol('admin') }, 403);
    });

    it('logs access granted', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => { });
        await runTest({ role: 'admin', allowedRoles: 'admin' }, 200);
        expect(log).toHaveBeenCalledWith(expect.stringMatching(/access granted/i));
        log.mockRestore();
    });

    it('handles logging failures gracefully', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => { throw new Error('fail'); });
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => { });
        await runTest({ role: 'admin', allowedRoles: 'admin' }, 200);
        expect(warn).toHaveBeenCalledWith(expect.stringMatching(/failed to log/i), expect.any(String));
        log.mockRestore();
        warn.mockRestore();
    });
});
