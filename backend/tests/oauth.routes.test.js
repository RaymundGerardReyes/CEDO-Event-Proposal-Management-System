// backend/tests/oauth.routes.test.js
// Unit tests for backend/routes/oauth.js

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const router = require('../routes/oauth');

jest.mock('../config/oauth', () => ({
    passport: {
        authenticate: jest.fn(() => (req, res, next) => next()),
    },
    generateSecureState: jest.fn(() => 'securestate123'),
}));
jest.mock('../middleware/session', () => ({
    generateToken: jest.fn(() => 'mocked.jwt.token'),
    logAccess: jest.fn(() => Promise.resolve()),
}));
jest.mock('../utils/googleAuth', () => ({
    verifyGoogleToken: jest.fn(async (token) => ({
        email: 'test@example.com',
        name: 'Test User',
        sub: 'googleid123',
    })),
}));

const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    is_approved: 1,
    organization: 'TestOrg',
    organization_type: 'University',
    avatar: 'avatar.png',
    google_id: 'googleid123',
};

// Mock DB pool
jest.mock('../config/db', () => ({
    pool: {
        query: jest.fn(async (sql, params) => {
            if (sql.includes('FROM users')) {
                if (params[0] === 1) return [[mockUser]];
                return [[]];
            }
            if (sql.includes('FROM organization_types')) {
                return [[{ id: 2 }]];
            }
            if (sql.includes('INSERT INTO organizations')) {
                return [{ insertId: 99 }];
            }
            if (sql.includes('INSERT INTO organization_type_links')) {
                return [{}];
            }
            return [[]];
        }),
    },
}));

process.env.GOOGLE_CLIENT_ID = 'mockid';
process.env.GOOGLE_CLIENT_SECRET = 'mocksecret';
process.env.JWT_SECRET_DEV = 'jwtsecret';
process.env.JWT_SECRET = 'jwtsecret';
process.env.FRONTEND_URL = 'http://frontend';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
    req.cookies = req.cookies || {};
    next();
});
app.use('/auth/oauth', router);

// Helper to sign JWT
const signToken = (payload, opts = {}) => jwt.sign(payload, process.env.JWT_SECRET_DEV, { expiresIn: '1h', ...opts });

describe('OAuth Routes', () => {
    describe('GET /auth/oauth/google', () => {
        it('should return 500 if OAuth not configured', async () => {
            process.env.GOOGLE_CLIENT_ID = '';
            const res = await request(app).get('/auth/oauth/google');
            expect(res.status).toBe(500);
            expect(res.body.error).toBe('OAuth not configured');
            process.env.GOOGLE_CLIENT_ID = 'mockid';
        });
        it('should return 500 if session not available', async () => {
            const app2 = express();
            app2.use(express.json());
            app2.use('/auth/oauth', (req, res, next) => { req.session = null; next(); }, router);
            const res = await request(app2).get('/auth/oauth/google');
            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Session configuration error');
        });
        it('should call passport.authenticate and set session state', async () => {
            const res = await request(app).get('/auth/oauth/google?redirect_url=http://frontend/after');
            expect(res.status).not.toBe(500);
        });
    });

    describe('GET /auth/oauth/google/callback', () => {
        it('should handle OAuth error from Google', async () => {
            const agent = request.agent(app);
            const res = await agent.get('/auth/oauth/google/callback?error=access_denied&error_description=desc');
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('/auth/error?error=access_denied');
        });
        it('should handle authentication error', async () => {
            const mockPassport = require('../config/oauth').passport;
            mockPassport.authenticate.mockImplementationOnce(() => (req, res, next) => next(new Error('not found')));
            const agent = request.agent(app);
            agent.app.request.session = { oauthRedirectUrl: 'http://frontend' };
            const res = await agent.get('/auth/oauth/google/callback');
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('ACCOUNT_NOT_FOUND');
        });
        it('should handle no user returned', async () => {
            const mockPassport = require('../config/oauth').passport;
            mockPassport.authenticate.mockImplementationOnce(() => (req, res, next) => { req.user = null; next(); });
            const agent = request.agent(app);
            agent.app.request.session = { oauthRedirectUrl: 'http://frontend' };
            const res = await agent.get('/auth/oauth/google/callback');
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('NO_USER');
        });
        it('should handle successful OAuth and set cookie', async () => {
            const mockPassport = require('../config/oauth').passport;
            mockPassport.authenticate.mockImplementationOnce(() => (req, res, next) => { req.user = mockUser; next(); });
            const agent = request.agent(app);
            agent.app.request.session = { oauthRedirectUrl: 'http://frontend' };
            const res = await agent.get('/auth/oauth/google/callback');
            expect(res.status).toBe(302);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers.location).toContain('/auth/success');
        });
        it('should handle callback processing error', async () => {
            const mockPassport = require('../config/oauth').passport;
            mockPassport.authenticate.mockImplementationOnce(() => (req, res, next) => { throw new Error('fail'); });
            const agent = request.agent(app);
            agent.app.request.session = { oauthRedirectUrl: 'http://frontend' };
            const res = await agent.get('/auth/oauth/google/callback');
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('PROCESSING_ERROR');
        });
    });

    describe('GET /auth/oauth/failure', () => {
        it('should redirect to frontend error page', async () => {
            const agent = request.agent(app);
            agent.app.request.session = { oauthRedirectUrl: 'http://frontend' };
            const res = await agent.get('/auth/oauth/failure');
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('OAUTH_FAILURE');
        });
    });

    describe('GET /auth/oauth/me', () => {
        it('should return 401 if no token', async () => {
            const res = await request(app).get('/auth/oauth/me');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('No authentication token');
        });
        it('should return 401 if token invalid', async () => {
            const res = await request(app).get('/auth/oauth/me').set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid token');
        });
        it('should return 401 if token expired', async () => {
            const expired = signToken({ userId: 1 }, { expiresIn: '-1s' });
            const res = await request(app).get('/auth/oauth/me').set('Authorization', `Bearer ${expired}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Token expired');
        });
        it('should return 401 if token missing userId', async () => {
            const token = signToken({});
            const res = await request(app).get('/auth/oauth/me').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid token');
        });
        it('should return 404 if user not found', async () => {
            const token = signToken({ userId: 999 });
            const res = await request(app).get('/auth/oauth/me').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('User not found');
        });
        it('should return 403 if user not approved', async () => {
            const notApprovedUser = { ...mockUser, is_approved: 0 };
            require('../config/db').pool.query.mockImplementationOnce(async () => [[notApprovedUser]]);
            const token = signToken({ userId: 1 });
            const res = await request(app).get('/auth/oauth/me').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Account not approved');
        });
        it('should return user info if valid', async () => {
            require('../config/db').pool.query.mockImplementationOnce(async () => [[mockUser]]);
            const token = signToken({ userId: 1 });
            const res = await request(app).get('/auth/oauth/me').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('test@example.com');
            expect(res.body.user.role).toBe('student');
        });
        it('should handle internal server error', async () => {
            require('../config/db').pool.query.mockImplementationOnce(() => { throw new Error('fail'); });
            const token = signToken({ userId: 1 });
            const res = await request(app).get('/auth/oauth/me').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Internal server error');
        });
    });

    describe('POST /auth/oauth/logout', () => {
        it('should clear cookie and destroy session', async () => {
            const agent = request.agent(app);
            const res = await agent.post('/auth/oauth/logout');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        it('should handle logout error', async () => {
            const app2 = express();
            app2.use(express.json());
            app2.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
            app2.use('/auth/oauth', (req, res, next) => { throw new Error('fail'); }, router);
            const res = await request(app2).post('/auth/oauth/logout');
            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Logout failed');
        });
    });

    describe('POST /auth/oauth/auth/google', () => {
        it('should verify Google token and return authToken', async () => {
            const res = await request(app)
                .post('/auth/oauth/auth/google')
                .send({ token: 'validtoken' });
            expect(res.status).toBe(200);
            expect(res.body.authToken).toBeDefined();
            expect(res.body.user.email).toBe('test@example.com');
        });
        it('should handle Google token verification error', async () => {
            const { verifyGoogleToken } = require('../utils/googleAuth');
            verifyGoogleToken.mockImplementationOnce(() => { throw new Error('invalid token'); });
            const res = await request(app)
                .post('/auth/oauth/auth/google')
                .send({ token: 'badtoken' });
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('invalid token');
        });
    });
});

// Helper for findOrCreateUser (mocked for POST /auth/google)
async function findOrCreateUser(payload) {
    return mockUser;
}
