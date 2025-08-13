const express = require('express');
const request = require('supertest');
const performance = require('../../middleware/performance');

describe('performance.js middleware', () => {
    describe('performanceMonitor', () => {
        it('should add startTime to req and call next', done => {
            const req = {};
            const res = { on: jest.fn() };
            performance.monitor(req, res, () => {
                expect(req.startTime).toBeDefined();
                expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
                done();
            });
        });

        it('should set X-Response-Time and X-Content-Size headers on finish', done => {
            const req = { method: 'GET', originalUrl: '/test' };
            const res = {
                on: (event, cb) => {
                    res.get = () => 123;
                    res.set = jest.fn();
                    cb();
                    expect(res.set).toHaveBeenCalledWith('X-Response-Time', expect.stringMatching(/ms/));
                    expect(res.set).toHaveBeenCalledWith('X-Content-Size', 123);
                    done();
                }
            };
            performance.monitor(req, res, () => { });
        });

        it('should log slow requests over 1000ms', done => {
            const req = { method: 'POST', originalUrl: '/slow' };
            const res = {
                on: (event, cb) => {
                    const origDateNow = Date.now;
                    Date.now = () => req.startTime + 1500;
                    const spy = jest.spyOn(console, 'warn').mockImplementation();
                    cb();
                    expect(spy).toHaveBeenCalledWith(expect.stringContaining('🐌 Slow request: POST /slow - 1500ms'));
                    spy.mockRestore();
                    Date.now = origDateNow;
                    done();
                },
                get: () => 0,
                set: jest.fn()
            };
            performance.monitor(req, res, () => { });
        });
    });

    describe('compressionMiddleware', () => {
        it('should be a function (middleware)', () => {
            expect(typeof performance.compression).toBe('function');
        });

        it('should handle compression in an express app', async () => {
            const app = express();
            app.use(performance.compression);
            app.get('/', (req, res) => res.send('test response'));

            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            // Compression middleware should be applied without errors
        });

        it('should handle x-no-compression header gracefully', async () => {
            const app = express();
            app.use(performance.compression);
            app.get('/', (req, res) => res.send('test response'));

            const res = await request(app)
                .get('/')
                .set('x-no-compression', 'true');

            expect(res.status).toBe(200);
            // Should not crash with the header
        });
    });

    describe('rateLimiters', () => {
        it('should have general, auth, upload, search, table', () => {
            expect(performance.rateLimiters).toHaveProperty('general');
            expect(performance.rateLimiters).toHaveProperty('auth');
            expect(performance.rateLimiters).toHaveProperty('upload');
            expect(performance.rateLimiters).toHaveProperty('search');
            expect(performance.rateLimiters).toHaveProperty('table');
        });
        it('should return 429 and correct message for auth limiter', async () => {
            const app = express();
            app.use(performance.rateLimiters.auth);
            app.get('/', (req, res) => res.send('ok'));
            for (let i = 0; i < 5; i++) await request(app).get('/');
            const res429 = await request(app).get('/');
            expect(res429.status).toBe(429);
            expect(res429.body).toHaveProperty('error');
            expect(res429.body).toHaveProperty('retryAfter');
        });
        it('should use handler for custom response', async () => {
            const app = express();
            app.use(performance.rateLimiters.upload);
            app.get('/', (req, res) => res.send('ok'));
            for (let i = 0; i < 10; i++) await request(app).get('/');
            const res429 = await request(app).get('/');
            expect(res429.status).toBe(429);
            expect(res429.body.error).toMatch(/Upload limit exceeded/);
        });
    });

    describe('cacheControl', () => {
        it('should set Cache-Control and ETag for GET', done => {
            const req = { method: 'GET' };
            const res = { set: jest.fn() };
            performance.cache()(req, res, () => {
                expect(res.set).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age'));
                expect(res.set).toHaveBeenCalledWith('ETag', expect.any(String));
                done();
            });
        });
        it('should not set headers for non-GET', done => {
            const req = { method: 'POST' };
            const res = { set: jest.fn() };
            performance.cache()(req, res, () => {
                expect(res.set).not.toHaveBeenCalled();
                done();
            });
        });
    });

    describe('securityHeaders', () => {
        it('should be a helmet middleware', () => {
            expect(typeof performance.security).toBe('function');
            // helmet returns a function with length 3 or 4
            expect([3, 4]).toContain(performance.security.length);
        });
        it('should set security headers in an express app', async () => {
            const app = express();
            app.use(performance.security);
            app.get('/', (req, res) => res.send('ok'));
            const res = await request(app).get('/');
            expect(res.headers['x-dns-prefetch-control']).toBeDefined();
            expect(res.headers['x-frame-options']).toBeDefined();
            expect(res.headers['x-content-type-options']).toBeDefined();
            expect(res.headers['x-xss-protection']).toBeDefined();
        });
    });

    describe('requestSizeLimit', () => {
        it('should call next for small requests', done => {
            const req = new express.request.constructor();
            const res = {};
            const next = jest.fn();
            performance.requestSize('100mb')(req, res, next);
            expect(next).toHaveBeenCalled();
            done();
        });
        it('should return 413 for large chunk', done => {
            const req = new express.request.constructor();
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            const mw = performance.requestSize(1); // 1 byte
            mw(req, res, next);
            req.emit('data', Buffer.alloc(2));
            expect(res.status).toHaveBeenCalledWith(413);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Request entity too large' }));
            done();
        });
    });

    describe('dbHealthCheck', () => {
        it('should call next for /health', done => {
            const req = { path: '/health' };
            const next = jest.fn(() => done());
            performance.dbHealth(req, {}, next);
        });
        it('should call next for /api/health', done => {
            const req = { path: '/api/health' };
            const next = jest.fn(() => done());
            performance.dbHealth(req, {}, next);
        });
        it('should call next for other paths', done => {
            const req = { path: '/other' };
            const next = jest.fn(() => done());
            performance.dbHealth(req, {}, next);
        });
    });

    describe('logPerformance', () => {
        it('should log if duration > 100ms', () => {
            const spy = jest.spyOn(console, 'log').mockImplementation();
            const start = Date.now() - 150;
            performance.logPerformance('test', start);
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('⚡ test:'));
            spy.mockRestore();
        });
        it('should not log if duration <= 100ms', () => {
            const spy = jest.spyOn(console, 'log').mockImplementation();
            const start = Date.now();
            performance.logPerformance('test', start);
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('memoryUsage', () => {
        it('should return an object with memory stats', () => {
            const mem = performance.memoryUsage();
            expect(mem).toHaveProperty('rss');
            expect(mem).toHaveProperty('heapTotal');
            expect(mem).toHaveProperty('heapUsed');
            expect(mem).toHaveProperty('external');
        });
    });
}); 