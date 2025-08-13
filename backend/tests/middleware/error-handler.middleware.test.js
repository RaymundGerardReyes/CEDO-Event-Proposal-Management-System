// tests/middleware/error-handler.middleware.test.js
const express = require('express');
const request = require('supertest');
const createErrorHandler = require('../../middleware/error-handler');

const setupTestEnv = (env) => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const app = express();
    app.use(express.json());

    const errorHandler = createErrorHandler({ env, logger });

    app.get('/error', (req, res, next) => next(new Error('Test error')));
    app.get('/validation', (req, res, next) => {
        const err = new Error('Validation failed');
        err.name = 'ValidationError';
        err.errors = {
            field1: { message: 'Field1 is required', path: 'field1' },
            field2: { message: 'Field2 is invalid', path: 'field2' }
        };
        next(err);
    });
    app.get('/jwt', (req, res, next) => {
        const err = new Error('jwt malformed');
        err.name = 'JsonWebTokenError';
        next(err);
    });
    app.get('/expired', (req, res, next) => {
        const err = new Error('jwt expired');
        err.name = 'TokenExpiredError';
        next(err);
    });
    app.get('/duplicate', (req, res, next) => {
        const err = new Error('Duplicate entry');
        err.code = 'ER_DUP_ENTRY';
        next(err);
    });
    app.get('/user-not-approved', (req, res, next) => {
        next(new Error('User not found or not approved'));
    });
    app.get('/axios', (req, res, next) => {
        const err = new Error('Axios error');
        err.response = { status: 400, data: { message: 'Bad request from axios' } };
        next(err);
    });
    app.get('/unknown', (req, res, next) => {
        const err = { message: 'Unknown error' };
        next(err);
    });
    app.get('/headers-sent', (req, res, next) => {
        res.send('done');
        setTimeout(() => next(new Error('Late error')), 10);
    });
    app.get('/no-user', (req, res, next) => {
        const err = new Error('Unauthorized');
        err.status = 401;
        next(err);
    });
    app.get('/no-ip', (req, res, next) => {
        req.ip = undefined;
        const err = new Error('Unauthorized');
        err.status = 401;
        next(err);
    });
    app.get('/no-path', (req, res, next) => {
        req.path = undefined;
        const err = new Error('Unauthorized');
        err.status = 401;
        next(err);
    });
    app.get('/no-method', (req, res, next) => {
        req.method = undefined;
        const err = new Error('Unauthorized');
        err.status = 401;
        next(err);
    });
    app.get('/no-message', (req, res, next) => next({}));
    app.get('/no-stack', (req, res, next) => next({ message: 'No stack' }));
    app.get('/forbidden', (req, res, next) => {
        const err = new Error('Forbidden');
        err.status = 403;
        next(err);
    });

    app.use(errorHandler);

    return { app, logger };
};

const expectLoggerCalledWith = (loggerFn, pattern) => {
    expect(loggerFn).toHaveBeenCalledWith(
        expect.stringMatching(pattern),
        expect.any(Object)
    );
};

describe('Error Handler Middleware', () => {
    it('should handle generic errors with 500', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/error');
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/server error/i);
    });

    it('should handle validation errors with 400 and error details', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/validation');
        expect(res.status).toBe(400);
        expect(res.body.errors).toHaveLength(2);
    });

    it('should handle JWT and expired token errors with 401', async () => {
        const { app } = setupTestEnv('production');
        const jwt = await request(app).get('/jwt');
        expect(jwt.status).toBe(401);
        const expired = await request(app).get('/expired');
        expect(expired.status).toBe(401);
    });

    it('should handle duplicate entry errors with 400', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/duplicate');
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/duplicate/i);
    });

    it('should handle user not approved with 401', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/user-not-approved');
        expect(res.status).toBe(401);
    });

    it('should handle axios errors with 400', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/axios');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Bad request from axios');
    });

    it('should handle unknown errors with 500', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/unknown');
        expect(res.status).toBe(500);
    });

    it('should not send error response if headers already sent', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/headers-sent');
        expect(res.status).toBe(200);
    });

    it('should log error details in development mode', async () => {
        const { app, logger } = setupTestEnv('development');
        await request(app).get('/error');
        expectLoggerCalledWith(logger.error, /error:/i);
    });

    it('should log security events for 401 and 403', async () => {
        const { app, logger } = setupTestEnv('production');
        await request(app).get('/jwt');
        await request(app).get('/forbidden');
        expectLoggerCalledWith(logger.warn, /security event/i);
    });

    it('should not include stack in production mode', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/error');
        expect(res.body.stack).toBeUndefined();
    });

    it.each(['/no-user', '/no-ip', '/no-path', '/no-method'])(
        'should handle missing fields %s gracefully and log security warnings',
        async (route) => {
            const { app, logger } = setupTestEnv('production');
            await request(app).get(route);
            expect(logger.warn).toHaveBeenCalled();
        }
    );

    it('should handle errors with missing error.message', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/no-message');
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/server error/i);
    });

    it('should handle errors with missing error.stack', async () => {
        const { app } = setupTestEnv('production');
        const res = await request(app).get('/no-stack');
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('No stack');
    });
});
