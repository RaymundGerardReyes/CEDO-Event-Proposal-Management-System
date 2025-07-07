// backend/tests/profile.routes.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = require('../routes/profile');

jest.mock('mysql2/promise', () => ({
    createConnection: jest.fn(),
}));

const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'student',
    organization: 'TestOrg',
    organization_description: 'Desc',
    phone_number: '09123456789',
    avatar: 'avatar.png',
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
};

const signToken = (payload, opts = {}) =>
    jwt.sign(payload, 'jwtsecret', { expiresIn: '1h', ...opts });

const mockConn = {
    execute: jest.fn(),
    end: jest.fn(),
};

const mysql = require('mysql2/promise');
mysql.createConnection.mockResolvedValue(mockConn);

process.env.JWT_SECRET_DEV = 'jwtsecret';
process.env.JWT_SECRET = 'jwtsecret';

const app = express();
app.use(express.json());
app.use('/api/profile', router);

describe('Profile Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/profile', () => {
        it('should require access token', async () => {
            const res = await request(app).get('/api/profile');
            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/access token/i);
        });
        it('should reject malformed JWT', async () => {
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer notajwt');
            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/malformed/i);
        });
        it('should reject invalid JWT', async () => {
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer invalid.token.here');
            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/invalid/i);
        });
        it('should reject expired JWT', async () => {
            const expired = signToken({ id: 1 }, { expiresIn: '-1s' });
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${expired}`);
            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/expired/i);
        });
        it('should return 404 if user not found', async () => {
            mockConn.execute.mockResolvedValueOnce([[]]);
            const token = signToken({ id: 999 });
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/not found/i);
        });
        it('should return user profile if found', async () => {
            mockConn.execute.mockResolvedValueOnce([[mockUser]]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('test@example.com');
        });
        it('should handle DB error', async () => {
            mockConn.execute.mockRejectedValueOnce(new Error('fail'));
            const token = signToken({ id: 1 });
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            expect(res.body.error).toMatch(/failed to fetch/i);
        });
    });

    describe('PUT /api/profile/organization', () => {
        it('should require access token', async () => {
            const res = await request(app).put('/api/profile/organization').send({});
            expect(res.status).toBe(401);
        });
        it('should reject too long description', async () => {
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/organization')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'a'.repeat(5001) });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/less than 5000/i);
        });
        it('should update organization description', async () => {
            mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/organization')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'New desc' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.organizationDescription).toBe('New desc');
        });
        it('should return 404 if user not found', async () => {
            mockConn.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/organization')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'desc' });
            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/not found/i);
        });
        it('should handle DB error', async () => {
            mockConn.execute.mockRejectedValueOnce(new Error('fail'));
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/organization')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'desc' });
            expect(res.status).toBe(500);
            expect(res.body.error).toMatch(/failed to update/i);
        });
    });

    describe('PUT /api/profile/phone', () => {
        it('should require access token', async () => {
            const res = await request(app).put('/api/profile/phone').send({});
            expect(res.status).toBe(401);
        });
        it('should reject invalid phone format', async () => {
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '12345' });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/must be exactly 11 digits/i);
        });
        it('should reject phone already in use', async () => {
            mockConn.execute
                .mockResolvedValueOnce([[{ id: 2 }]]) // phone exists
                .mockResolvedValueOnce([{ affectedRows: 0 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '09123456789' });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/already in use/i);
        });
        it('should update phone number', async () => {
            mockConn.execute
                .mockResolvedValueOnce([[]]) // phone not in use
                .mockResolvedValueOnce([{ affectedRows: 1 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '09123456789' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.phoneNumber).toBe('09123456789');
        });
        it('should allow null phone number', async () => {
            mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: null });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.phoneNumber).toBe(null);
        });
        it('should return 404 if user not found', async () => {
            mockConn.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ affectedRows: 0 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '09123456789' });
            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/not found/i);
        });
        it('should handle DB error', async () => {
            mockConn.execute.mockRejectedValueOnce(new Error('fail'));
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '09123456789' });
            expect(res.status).toBe(500);
            expect(res.body.error).toMatch(/failed to update/i);
        });
    });

    describe('PUT /api/profile/bulk', () => {
        it('should require access token', async () => {
            const res = await request(app).put('/api/profile/bulk').send({});
            expect(res.status).toBe(401);
        });
        it('should reject too long organizationDescription', async () => {
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'a'.repeat(5001) });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/less than 5000/i);
        });
        it('should reject invalid phone format', async () => {
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '12345' });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/must be exactly 11 digits/i);
        });
        it('should reject phone already in use', async () => {
            mockConn.execute
                .mockResolvedValueOnce([[{ id: 2 }]]) // phone exists
                .mockResolvedValueOnce([{ affectedRows: 0 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ phoneNumber: '09123456789' });
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/already in use/i);
        });
        it('should update both fields', async () => {
            mockConn.execute
                .mockResolvedValueOnce([[]]) // phone not in use
                .mockResolvedValueOnce([{ affectedRows: 1 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'desc', phoneNumber: '09123456789' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.organizationDescription).toBe('desc');
            expect(res.body.data.phoneNumber).toBe('09123456789');
        });
        it('should allow null phone and org description', async () => {
            mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: null, phoneNumber: null });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.organizationDescription).toBe(null);
            expect(res.body.data.phoneNumber).toBe(null);
        });
        it('should return 404 if user not found', async () => {
            mockConn.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ affectedRows: 0 }]);
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'desc', phoneNumber: '09123456789' });
            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/not found/i);
        });
        it('should handle DB error', async () => {
            mockConn.execute.mockRejectedValueOnce(new Error('fail'));
            const token = signToken({ id: 1 });
            const res = await request(app)
                .put('/api/profile/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ organizationDescription: 'desc', phoneNumber: '09123456789' });
            expect(res.status).toBe(500);
            expect(res.body.error).toMatch(/failed to update/i);
        });
    });

    // Edge/stress/extra
    it('should allow empty org description and phone', async () => {
        mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ organizationDescription: '', phoneNumber: '' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('should allow whitespace org description', async () => {
        mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/organization')
            .set('Authorization', `Bearer ${token}`)
            .send({ organizationDescription: '   ' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('should allow whitespace phone', async () => {
        mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/phone')
            .set('Authorization', `Bearer ${token}`)
            .send({ phoneNumber: '   ' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/must be exactly 11 digits/i);
    });
    it('should handle special characters in org description', async () => {
        mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/organization')
            .set('Authorization', `Bearer ${token}`)
            .send({ organizationDescription: '!@#$%^&*()' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('should handle special characters in phone', async () => {
        mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/phone')
            .set('Authorization', `Bearer ${token}`)
            .send({ phoneNumber: '09-1234-5678' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/must be exactly 11 digits/i);
    });
    it('should handle extremely long phone', async () => {
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/phone')
            .set('Authorization', `Bearer ${token}`)
            .send({ phoneNumber: '09' + '1'.repeat(20) });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/must be exactly 11 digits/i);
    });
    it('should handle extremely long org description', async () => {
        const token = signToken({ id: 1 });
        const res = await request(app)
            .put('/api/profile/organization')
            .set('Authorization', `Bearer ${token}`)
            .send({ organizationDescription: 'a'.repeat(10000) });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/less than 5000/i);
    });
});
