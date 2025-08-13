// tests/checkRole.middleware.test.js
const checkRole = require('../../middleware/checkRole');
const express = require('express');
const request = require('supertest');

describe('checkRole Middleware', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    it('should allow access for allowed role', async () => {
        app.get('/admin', (req, res, next) => {
            req.user = { role: 'admin' };
            next();
        }, checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/admin');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should deny access for disallowed role', async () => {
        app.get('/admin', (req, res, next) => {
            req.user = { role: 'user' };
            next();
        }, checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/admin');
        expect(res.status).toBe(403);
        expect(res.body.msg).toMatch(/access denied/i);
    });

    it('should return 401 if req.user is missing', async () => {
        app.get('/no-user', checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/no-user');
        expect(res.status).toBe(401);
        expect(res.body.msg).toMatch(/not authorized/i);
    });

    it('should allow access for any of multiple allowed roles', async () => {
        app.get('/multi', (req, res, next) => {
            req.user = { role: 'editor' };
            next();
        }, checkRole(['admin', 'editor']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/multi');
        expect(res.status).toBe(200);
    });

    it('should deny access if user role is not in allowed list', async () => {
        app.get('/multi', (req, res, next) => {
            req.user = { role: 'guest' };
            next();
        }, checkRole(['admin', 'editor']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/multi');
        expect(res.status).toBe(403);
    });

    it('should handle empty allowed roles array', async () => {
        app.get('/empty', (req, res, next) => {
            req.user = { role: 'admin' };
            next();
        }, checkRole([]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/empty');
        expect(res.status).toBe(403);
    });

    it('should allow access for numeric role', async () => {
        app.get('/numeric', (req, res, next) => {
            req.user = { role: 1 };
            next();
        }, checkRole([1, 2]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/numeric');
        expect(res.status).toBe(200);
    });

    it('should deny access for mismatched numeric role', async () => {
        app.get('/numeric', (req, res, next) => {
            req.user = { role: 3 };
            next();
        }, checkRole([1, 2]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/numeric');
        expect(res.status).toBe(403);
    });

    it('should allow access for boolean role', async () => {
        app.get('/bool', (req, res, next) => {
            req.user = { role: true };
            next();
        }, checkRole([true]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/bool');
        expect(res.status).toBe(200);
    });

    it('should deny access for mismatched boolean role', async () => {
        app.get('/bool', (req, res, next) => {
            req.user = { role: false };
            next();
        }, checkRole([true]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/bool');
        expect(res.status).toBe(403);
    });

    it('should allow access for symbol role', async () => {
        const sym = Symbol('admin');
        app.get('/sym', (req, res, next) => {
            req.user = { role: sym };
            next();
        }, checkRole([sym]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/sym');
        expect(res.status).toBe(200);
    });

    it('should deny access for mismatched symbol role', async () => {
        const sym = Symbol('admin');
        app.get('/sym', (req, res, next) => {
            req.user = { role: Symbol('other') };
            next();
        }, checkRole([sym]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/sym');
        expect(res.status).toBe(403);
    });

    it('should allow access for string role in array', async () => {
        app.get('/array', (req, res, next) => {
            req.user = { role: 'user' };
            next();
        }, checkRole(['user']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/array');
        expect(res.status).toBe(200);
    });

    it('should deny access for undefined user role', async () => {
        app.get('/undefined-role', (req, res, next) => {
            req.user = {};
            next();
        }, checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/undefined-role');
        expect(res.status).toBe(403);
    });

    it('should allow access for role with extra user fields', async () => {
        app.get('/extra', (req, res, next) => {
            req.user = { role: 'admin', name: 'Test', id: 123 };
            next();
        }, checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/extra');
        expect(res.status).toBe(200);
    });

    it('should deny access for null user', async () => {
        app.get('/null-user', (req, res, next) => {
            req.user = null;
            next();
        }, checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/null-user');
        expect(res.status).toBe(401);
    });

    it('should deny access for undefined user', async () => {
        app.get('/undefined-user', (req, res, next) => {
            req.user = undefined;
            next();
        }, checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/undefined-user');
        expect(res.status).toBe(401);
    });

    it('should deny access for missing user', async () => {
        app.get('/missing-user', checkRole(['admin']), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/missing-user');
        expect(res.status).toBe(401);
    });

    it('should deny access for empty roles array and undefined user', async () => {
        app.get('/empty-roles', (req, res, next) => {
            req.user = undefined;
            next();
        }, checkRole([]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/empty-roles');
        expect(res.status).toBe(401);
    });

    it('should deny access for empty roles array and null user', async () => {
        app.get('/empty-roles-null', (req, res, next) => {
            req.user = null;
            next();
        }, checkRole([]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).get('/empty-roles-null');
        expect(res.status).toBe(401);
    });
});
