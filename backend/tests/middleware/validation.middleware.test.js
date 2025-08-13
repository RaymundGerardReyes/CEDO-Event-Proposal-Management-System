// tests/validation.middleware.test.js
const express = require('express');
const request = require('supertest');
const { body, param, query } = require('express-validator');
const validate = require('../../middleware/validation');

describe('Validation Middleware', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    it('should call next() when there are no validation errors', async () => {
        app.post('/test', validate([body('name').exists().isString()]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ name: 'John' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 400 with errors when validation fails', async () => {
        app.post('/test', validate([body('age').exists().isInt()]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ age: 'notanint' });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation error');
        expect(res.body.errors[0].param).toBe('age');
    });

    it('should handle multiple validation errors', async () => {
        app.post('/test', validate([
            body('email').exists().isEmail(),
            body('password').exists().isLength({ min: 6 })
        ]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ email: 'bad', password: '123' });
        expect(res.status).toBe(400);
        expect(res.body.errors.length).toBe(2);
    });

    it('should validate params', async () => {
        app.get('/user/:id', validate([param('id').exists().isInt()]), (req, res) => res.status(200).json({ id: req.params.id }));
        const res = await request(app).get('/user/abc');
        expect(res.status).toBe(400);
        expect(res.body.errors[0].param).toBe('id');
    });

    it('should validate query', async () => {
        app.get('/search', validate([query('q').exists().isLength({ min: 3 })]), (req, res) => res.status(200).json({ q: req.query.q }));
        const res = await request(app).get('/search?q=ab');
        expect(res.status).toBe(400);
        expect(res.body.errors[0].param).toBe('q');
    });

    it('should pass with valid query', async () => {
        app.get('/search', validate([query('q').exists().isLength({ min: 3 })]), (req, res) => res.status(200).json({ q: req.query.q }));
        const res = await request(app).get('/search?q=abcd');
        expect(res.status).toBe(200);
        expect(res.body.q).toBe('abcd');
    });

    it('should format errors with msg, param, location', async () => {
        app.post('/test', validate([body('email').exists().isEmail()]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ email: 'bad' });
        expect(res.status).toBe(400);
        expect(res.body.errors[0]).toHaveProperty('msg');
        expect(res.body.errors[0]).toHaveProperty('param');
        expect(res.body.errors[0]).toHaveProperty('location');
    });

    it('should handle async validations', async () => {
        app.post('/test', validate([
            body('username').exists().custom(async val => {
                if (val === 'taken') throw new Error('Username taken');
            })
        ]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ username: 'taken' });
        expect(res.status).toBe(400);
        expect(res.body.errors[0].msg).toBe('Username taken');
    });

    it('should call next() for valid async validation', async () => {
        app.post('/test', validate([
            body('username').exists().custom(async val => {
                if (val === 'taken') throw new Error('Username taken');
            })
        ]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ username: 'free' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should work with no validations', async () => {
        app.post('/test', validate([]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({});
        expect(res.status).toBe(200);
    });

    it('should not mutate req object on error', async () => {
        app.post('/test', validate([body('age').exists().isInt()]), (req, res) => res.status(200).json({ success: true, age: req.body.age }));
        const res = await request(app).post('/test').send({ age: 'bad' });
        expect(res.status).toBe(400);
        expect(res.body).not.toHaveProperty('age');
    });

    it('should allow custom error messages', async () => {
        app.post('/test', validate([body('age').exists().isInt().withMessage('Age must be an integer')]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ age: 'bad' });
        expect(res.status).toBe(400);
        expect(res.body.errors[0].msg).toBe('Age must be an integer');
    });

    it('should handle multiple locations (body, param, query)', async () => {
        app.get('/user/:id', validate([
            param('id').exists().isInt(),
            query('token').exists().isLength({ min: 10 })
        ]), (req, res) => res.status(200).json({ id: req.params.id, token: req.query.token }));
        const res = await request(app).get('/user/abc?token=short');
        expect(res.status).toBe(400);
        expect(res.body.errors.length).toBe(2);
    });

    it('should not call next() if errors exist', async () => {
        let nextCalled = false;
        app.post('/test', validate([body('age').exists().isInt()]), (req, res) => {
            nextCalled = true;
            res.status(200).json({ success: true });
        });
        const res = await request(app).post('/test').send({ age: 'bad' });
        expect(nextCalled).toBe(false);
        expect(res.status).toBe(400);
    });

    it('should support nested validation chains', async () => {
        app.post('/test', validate([
            body('user.name').exists().isString(),
            body('user.age').exists().isInt()
        ]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ user: { name: 'John', age: 'notanint' } });
        expect(res.status).toBe(400);
        expect(res.body.errors[0].param).toBe('user.age');
    });

    it('should handle empty body gracefully', async () => {
        app.post('/test', validate([body('name').exists().isString()]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send();
        expect(res.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
        app.post('/test', validate([body('email').exists().isEmail()]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({});
        expect(res.status).toBe(400);
        expect(res.body.errors[0].param).toBe('email');
    });

    it('should support custom validators with req access', async () => {
        app.post('/test', validate([
            body('password').exists().custom((val, { req }) => {
                if (val !== req.body.confirm) throw new Error('Passwords do not match');
            })
        ]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ password: 'abc', confirm: 'def' });
        expect(res.status).toBe(400);
        expect(res.body.errors[0].msg).toBe('Passwords do not match');
    });

    it('should allow passing through for valid custom validator', async () => {
        app.post('/test', validate([
            body('confirm').exists(),
            body('password').exists().custom((val, { req }) => {
                if (val !== req.body.confirm) throw new Error('Passwords do not match');
                return true;
            })
        ]), (req, res) => res.status(200).json({ success: true }));
        const res = await request(app).post('/test').send({ password: 'abc', confirm: 'abc' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
