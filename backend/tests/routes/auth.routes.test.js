// backend/tests/auth.routes.test.js
// Unit tests for backend/routes/auth.js

const request = require('supertest');
const express = require('express');
const sessionManager = require('../../middleware/session');
const { pool, query } = require('../../config/database-postgresql-only');
const authRouter = require('../../routes/auth');
const jwt = require('jsonwebtoken');

jest.mock('../../middleware/session');
jest.mock('../../config/db');
jest.mock('../../utils/recaptcha');
jest.mock('../../utils/recaptchaAssessment');
jest.mock('../../utils/googleAuth');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GOOGLE_CLIENT_ID_BACKEND = 'test-google-client-id';
        process.env.JWT_SECRET_DEV = 'test-jwt-secret';
    });

    describe('POST /auth/login', () => {
        it('should return 400 if email or password is missing', async () => {
            const res = await request(app).post('/auth/login').send({ email: '', password: '' });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/email and password/i);
        });

        it('should return 400 if reCAPTCHA token is invalid', async () => {
            require('../../utils/recaptcha').verifyRecaptchaToken.mockResolvedValue(false);
            const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'pw', captchaToken: 'bad' });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/recaptcha/i);
        });

        it('should return 401 if user not found', async () => {
            require('../../utils/recaptcha').verifyRecaptchaToken.mockResolvedValue(true);
            pool.query.mockResolvedValue([[]]);
            const res = await request(app).post('/auth/login').send({ email: 'nouser@b.com', password: 'pw', captchaToken: 'good' });
            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/invalid credentials/i);
        });

        it('should return 401 if user has no password', async () => {
            require('../../utils/recaptcha').verifyRecaptchaToken.mockResolvedValue(true);
            pool.query.mockResolvedValue([[{ id: 1, email: 'a@b.com', password: null }]]);
            const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'pw', captchaToken: 'good' });
            expect(res.status).toBe(401);
        });

        it('should return 401 if password does not match', async () => {
            require('../../utils/recaptcha').verifyRecaptchaToken.mockResolvedValue(true);
            pool.query.mockResolvedValue([[{ id: 1, email: 'a@b.com', password: 'hashed' }]]);
            require('bcryptjs').compare = jest.fn().mockResolvedValue(false);
            const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'wrong', captchaToken: 'good' });
            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not approved', async () => {
            require('../../utils/recaptcha').verifyRecaptchaToken.mockResolvedValue(true);
            pool.query.mockResolvedValue([[{ id: 1, email: 'a@b.com', password: 'hashed', is_approved: 0 }]]);
            require('bcryptjs').compare = jest.fn().mockResolvedValue(true);
            const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'pw', captchaToken: 'good' });
            expect(res.status).toBe(403);
            expect(res.body.reason).toBe('USER_NOT_APPROVED');
        });

        it('should return 200 and user data if login is successful', async () => {
            require('../../utils/recaptcha').verifyRecaptchaToken.mockResolvedValue(true);
            pool.query.mockResolvedValue([[{ id: 1, email: 'a@b.com', password: 'hashed', is_approved: 1, role: 'student', name: 'Test', organization: 'Org', organization_type: 'Type', avatar: '', google_id: null }]]);
            require('bcryptjs').compare = jest.fn().mockResolvedValue(true);
            sessionManager.generateToken.mockReturnValue('token');
            sessionManager.logAccess.mockResolvedValue();
            const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'pw', captchaToken: 'good' });
            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.token).toBe('token');
        });
    });

    describe('POST /auth/google', () => {
        it('should return 400 if no ID token is provided', async () => {
            const res = await request(app).post('/auth/google').send({});
            expect(res.status).toBe(400);
        });

        it('should return 500 if GOOGLE_CLIENT_ID_BACKEND is not set', async () => {
            delete process.env.GOOGLE_CLIENT_ID_BACKEND;
            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });
            expect(res.status).toBe(500);
        });

        it('should return 401 if verifyGoogleToken throws audience error', async () => {
            process.env.GOOGLE_CLIENT_ID_BACKEND = 'test-google-client-id';
            require('../../utils/googleAuth').verifyGoogleToken.mockImplementation(() => { throw new Error('audience mismatch'); });
            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });
            expect(res.status).toBe(401);
            expect(res.body.reason).toMatch(/audience/i);
        });

        it('should return 401 if verifyGoogleToken throws expired error', async () => {
            require('../../utils/googleAuth').verifyGoogleToken.mockImplementation(() => { throw new Error('expired'); });
            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });
            expect(res.status).toBe(401);
            expect(res.body.reason).toMatch(/expired/i);
        });

        it('should return 403 if email not verified and required', async () => {
            process.env.REQUIRE_GOOGLE_EMAIL_VERIFIED = 'true';
            require('../../utils/googleAuth').verifyGoogleToken.mockResolvedValue({ email: 'a@b.com', name: 'Test', picture: '', sub: 'gid', email_verified: false });
            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });
            expect(res.status).toBe(403);
            expect(res.body.reason).toBe('GOOGLE_EMAIL_NOT_VERIFIED');
        });

        it('should return 403 if user not found by Google ID or email', async () => {
            require('../../utils/googleAuth').verifyGoogleToken.mockResolvedValue({ email: 'a@b.com', name: 'Test', picture: '', sub: 'gid', email_verified: true });

            // Mock DB to find no one by google_id, then no one by email
            pool.query
                .mockResolvedValueOnce([[]]) // For google_id lookup
                .mockResolvedValueOnce([[]]); // For email lookup

            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });

            expect(res.status).toBe(403);
            expect(res.body.reason).toBe('USER_NOT_FOUND');
        });

        it('should link Google ID if user found by email', async () => {
            require('../../utils/googleAuth').verifyGoogleToken.mockResolvedValue({ email: 'a@b.com', name: 'Test', picture: '', sub: 'new-gid', email_verified: true });

            // Mock DB: 1. No user by google_id, 2. User found by email, 3. Successful update
            pool.query
                .mockResolvedValueOnce([[]]) // 1. google_id lookup
                .mockResolvedValueOnce([[{ id: 2, email: 'a@b.com', name: 'Test', avatar: '', is_approved: 1, role: 'student' }]]) // 2. email lookup
                .mockResolvedValueOnce([{}]); // 3. update query

            sessionManager.generateToken.mockReturnValue('token');
            sessionManager.logAccess.mockResolvedValue();

            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });

            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.token).toBe('token');
        });

        it('should update profile if user found by Google ID and info differs', async () => {
            require('../../utils/googleAuth').verifyGoogleToken.mockResolvedValue({ email: 'a@b.com', name: 'NewName', picture: 'pic', sub: 'gid', email_verified: true });
            pool.query.mockResolvedValueOnce([[{ id: 3, email: 'a@b.com', name: 'OldName', avatar: 'oldpic', is_approved: 1, role: 'student', google_id: 'gid' }]]); // google_id
            pool.query.mockResolvedValueOnce([[{ id: 3, email: 'a@b.com', name: 'NewName', avatar: 'pic', is_approved: 1, role: 'student', google_id: 'gid' }]]); // after update
            sessionManager.generateToken.mockReturnValue('token');
            sessionManager.logAccess.mockResolvedValue();
            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });
            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.token).toBe('token');
        });

        it('should return 403 if user is not approved (Google)', async () => {
            require('../../utils/googleAuth').verifyGoogleToken.mockResolvedValue({ email: 'a@b.com', name: 'Test', picture: '', sub: 'gid', email_verified: true });

            // Mock DB to return one user who is NOT approved
            pool.query.mockResolvedValueOnce([[{ id: 4, email: 'a@b.com', name: 'Test', avatar: '', is_approved: 0, role: 'student', google_id: 'gid' }]]);

            const res = await request(app).post('/auth/google').send({ token: 'idtoken' });

            expect(res.status).toBe(403);
            expect(res.body.reason).toBe('USER_NOT_APPROVED');
        });
    });

    describe('POST /auth/logout', () => {
        it('should return 200 on logout', async () => {
            const userPayload = { user: { id: 1, role: 'student' } };
            const token = 'fake-token';

            // Mock jwt.verify to "validate" our fake token
            jwt.verify = jest.fn().mockReturnValue(userPayload);

            // Mock the DB call that follows verification
            pool.query.mockResolvedValue([[{ id: 1, is_approved: 1 }]]);

            sessionManager.logAccess.mockResolvedValue();

            const res = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/logout successful/i);
        });
    });

    describe('GET /auth/me', () => {
        it('should return 401 if no token provided', async () => {
            const res = await request(app).get('/auth/me');
            expect(res.status).toBe(401);
        });

        it('should return 401 if token is invalid', async () => {
            sessionManager.verifyToken.mockReturnValue(null);
            const res = await request(app).get('/auth/me').set('Authorization', 'Bearer badtoken');
            expect(res.status).toBe(401);
        });

        it('should return 401 if user not found', async () => {
            sessionManager.verifyToken.mockReturnValue({ user: { id: 99 } });
            pool.query.mockResolvedValue([[]]);
            const res = await request(app).get('/auth/me').set('Authorization', 'Bearer sometoken');
            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not approved', async () => {
            sessionManager.verifyToken.mockReturnValue({ user: { id: 1 } });
            pool.query.mockResolvedValue([[{ id: 1, is_approved: 0 }]]);
            const res = await request(app).get('/auth/me').set('Authorization', 'Bearer sometoken');
            expect(res.status).toBe(403);
            expect(res.body.reason).toBe('USER_NOT_APPROVED');
        });

        it('should return 200 and user data if token and user are valid', async () => {
            sessionManager.verifyToken.mockReturnValue({ user: { id: 1 } });
            pool.query.mockResolvedValue([[{ id: 1, name: 'Test', email: 'a@b.com', role: 'student', organization: 'Org', organization_type: 'Type', avatar: '', is_approved: 1, google_id: 'gid' }]]);
            const res = await request(app).get('/auth/me').set('Authorization', 'Bearer sometoken');
            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe('a@b.com');
        });
    });
});
