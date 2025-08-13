// backend/tests/users.routes.test.js
const request = require('supertest');
const express = require('express');
const router = require('../../routes/users');

jest.mock('bcryptjs', () => ({
    hash: jest.fn(async (pw) => 'hashed_' + pw),
    compare: jest.fn(async (pw, hash) => pw === 'correct' || hash === 'hashed_correct'),
}));

jest.mock('../models/User', () => ({
    getAll: jest.fn(async () => [{ id: 1, name: 'A' }]),
    findById: jest.fn(async (id) => id === '404' ? null : { id }),
    update: jest.fn(async (id, data) => ({ id, ...data })),
}));
const User = require('../../models/User');

jest.mock('../middleware/auth', () => ({
    validateToken: (req, res, next) => { req.user = { id: 1, role: 'head_admin' }; next(); },
    validateAdmin: (req, res, next) => next(),
    validateFaculty: (req, res, next) => next(),
}));
jest.mock('../middleware/roles', () => () => (req, res, next) => next());

const mockPool = { query: jest.fn() };
jest.mock('../config/db', () => ({ pool: mockPool }));

process.env.JWT_SECRET = 'jwtsecret';

const app = express();
app.use(express.json());
app.use('/api/users', router);

describe('Users Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /test', () => {
        it('should return working message', async () => {
            const res = await request(app).get('/api/users/test');
            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/working/i);
        });
    });

    describe('GET /me', () => {
        it('should return user details', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 1, name: 'A', role: 'student', is_approved: 1, password_reset_required: 0 }]]);
            const res = await request(app).get('/api/users/me');
            expect(res.status).toBe(200);
            expect(res.body.user.id).toBe(1);
        });
        it('should return 404 if user not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).get('/api/users/me');
            expect(res.status).toBe(404);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).get('/api/users/me');
            expect(res.status).toBe(500);
        });
    });

    describe('GET /', () => {
        it('should return all users', async () => {
            const res = await request(app).get('/api/users/');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('should handle server error', async () => {
            User.getAll.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).get('/api/users/');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /approve-student/:id', () => {
        it('should approve student', async () => {
            mockPool.query
                .mockResolvedValueOnce([[{ id: 2, role: 'student', is_approved: 0 }]])
                .mockResolvedValueOnce([{}]);
            const res = await request(app).post('/api/users/approve-student/2');
            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/approved/i);
        });
        it('should 404 if student not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).post('/api/users/approve-student/404');
            expect(res.status).toBe(404);
        });
        it('should 400 if not student', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 2, role: 'admin', is_approved: 0 }]]);
            const res = await request(app).post('/api/users/approve-student/2');
            expect(res.status).toBe(400);
        });
        it('should 400 if already approved', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 2, role: 'student', is_approved: 1 }]]);
            const res = await request(app).post('/api/users/approve-student/2');
            expect(res.status).toBe(400);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).post('/api/users/approve-student/2');
            expect(res.status).toBe(500);
        });
    });

    describe('GET /pending-students', () => {
        it('should return pending students', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 3, name: 'B' }]]);
            const res = await request(app).get('/api/users/pending-students');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).get('/api/users/pending-students');
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:userIdToUpdate/approval', () => {
        it('should update approval status', async () => {
            User.findById.mockResolvedValueOnce({ id: 4 });
            User.update.mockResolvedValueOnce({ id: 4, is_approved: true });
            const res = await request(app).put('/api/users/4/approval').send({ is_approved: true });
            expect(res.status).toBe(200);
            expect(res.body.user.is_approved).toBe(true);
        });
        it('should 400 if is_approved not boolean', async () => {
            const res = await request(app).put('/api/users/4/approval').send({ is_approved: 'yes' });
            expect(res.status).toBe(400);
        });
        it('should 404 if user not found', async () => {
            User.findById.mockResolvedValueOnce(null);
            const res = await request(app).put('/api/users/404/approval').send({ is_approved: true });
            expect(res.status).toBe(404);
        });
        it('should 400 on foreign key error', async () => {
            User.findById.mockResolvedValueOnce({ id: 4 });
            User.update.mockRejectedValueOnce(new Error('foreign key constraint fails'));
            const res = await request(app).put('/api/users/4/approval').send({ is_approved: true });
            expect(res.status).toBe(400);
        });
        it('should handle server error', async () => {
            User.findById.mockResolvedValueOnce({ id: 4 });
            User.update.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).put('/api/users/4/approval').send({ is_approved: true });
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:userIdToUpdate', () => {
        it('should update user details', async () => {
            User.update.mockResolvedValueOnce({ id: 5, organization: 'Org' });
            const res = await request(app).put('/api/users/5').send({ organization: 'Org' });
            expect(res.status).toBe(200);
            expect(res.body.user.organization).toBe('Org');
        });
        it('should 400 if no update data', async () => {
            const res = await request(app).put('/api/users/5').send({});
            expect(res.status).toBe(400);
        });
        it('should handle server error', async () => {
            User.update.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).put('/api/users/5').send({ organization: 'Org' });
            expect(res.status).toBe(500);
        });
    });

    describe('POST /', () => {
        it('should create user', async () => {
            mockPool.query
                .mockResolvedValueOnce([[]]) // no existing
                .mockResolvedValueOnce([{ insertId: 6 }])
                .mockResolvedValueOnce([[{ id: 6, name: 'C', role: 'student', is_approved: 1 }]]);
            const res = await request(app).post('/api/users/').send({ name: 'C', email: 'c@x.com', role: 'student' });
            expect(res.status).toBe(201);
            expect(res.body.user.id).toBe(6);
        });
        it('should 400 if missing fields', async () => {
            const res = await request(app).post('/api/users/').send({ name: 'C' });
            expect(res.status).toBe(400);
        });
        it('should 400 if invalid role', async () => {
            const res = await request(app).post('/api/users/').send({ name: 'C', email: 'c@x.com', role: 'bad' });
            expect(res.status).toBe(400);
        });
        it('should 400 if user exists', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]);
            const res = await request(app).post('/api/users/').send({ name: 'C', email: 'c@x.com', role: 'student' });
            expect(res.status).toBe(400);
        });
        it('should create manager with password', async () => {
            mockPool.query
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{ insertId: 7 }])
                .mockResolvedValueOnce([[{ id: 7, name: 'D', role: 'manager', is_approved: 1 }]]);
            const res = await request(app).post('/api/users/').send({ name: 'D', email: 'd@x.com', role: 'manager', temporary_password: 'pw' });
            expect(res.status).toBe(201);
            expect(res.body.user.id).toBe(7);
            expect(res.body.passwordInfo).toBeDefined();
        });
        it('should handle ER_DUP_ENTRY', async () => {
            mockPool.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
            const res = await request(app).post('/api/users/').send({ name: 'C', email: 'c@x.com', role: 'student' });
            expect(res.status).toBe(400);
        });
        it('should handle ER_BAD_FIELD_ERROR', async () => {
            mockPool.query.mockRejectedValueOnce({ code: 'ER_BAD_FIELD_ERROR' });
            const res = await request(app).post('/api/users/').send({ name: 'C', email: 'c@x.com', role: 'student' });
            expect(res.status).toBe(500);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).post('/api/users/').send({ name: 'C', email: 'c@x.com', role: 'student' });
            expect(res.status).toBe(500);
        });
    });

    describe('DELETE /:id', () => {
        it('should delete user', async () => {
            mockPool.query
                .mockResolvedValueOnce([[{ id: 8, name: 'E', email: 'e@x.com' }]])
                .mockResolvedValueOnce([{}]);
            const res = await request(app).delete('/api/users/8');
            expect(res.status).toBe(200);
            expect(res.body.deletedUser.id).toBe(8);
        });
        it('should 400 if self-delete', async () => {
            const res = await request(app).delete('/api/users/1');
            expect(res.status).toBe(400);
        });
        it('should 404 if user not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).delete('/api/users/9');
            expect(res.status).toBe(404);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).delete('/api/users/8');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /login-manager', () => {
        it('should login manager', async () => {
            mockPool.query
                .mockResolvedValueOnce([[{ id: 10, name: 'F', email: 'f@x.com', role: 'manager', password: 'hashed_correct', password_reset_required: 1, is_approved: 1 }]])
                .mockResolvedValueOnce([{}]);
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'correct' });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
        });
        it('should 400 if missing fields', async () => {
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com' });
            expect(res.status).toBe(400);
        });
        it('should 401 if user not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'correct' });
            expect(res.status).toBe(401);
        });
        it('should 401 if not manager', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 10, name: 'F', email: 'f@x.com', role: 'student', password: 'hashed_correct', is_approved: 1 }]]);
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'correct' });
            expect(res.status).toBe(401);
        });
        it('should 401 if not approved', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 10, name: 'F', email: 'f@x.com', role: 'manager', password: 'hashed_correct', is_approved: 0 }]]);
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'correct' });
            expect(res.status).toBe(401);
        });
        it('should 401 if no password', async () => {
            mockPool.query.mockResolvedValueOnce([[{ id: 10, name: 'F', email: 'f@x.com', role: 'manager', password: null, is_approved: 1 }]]);
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'correct' });
            expect(res.status).toBe(401);
        });
        it('should 401 if password invalid', async () => {
            require('bcryptjs').compare.mockImplementationOnce(async () => false);
            mockPool.query.mockResolvedValueOnce([[{ id: 10, name: 'F', email: 'f@x.com', role: 'manager', password: 'hashed_wrong', is_approved: 1 }]]);
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'wrong' });
            expect(res.status).toBe(401);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).post('/api/users/login-manager').send({ email: 'f@x.com', password: 'correct' });
            expect(res.status).toBe(500);
        });
    });

    describe('POST /change-password', () => {
        it('should change password', async () => {
            mockPool.query
                .mockResolvedValueOnce([[{ password: 'hashed_correct', password_reset_required: 1 }]])
                .mockResolvedValueOnce([{}]);
            const res = await request(app).post('/api/users/change-password').send({ currentPassword: 'correct', newPassword: 'newpassword' });
            expect(res.status).toBe(200);
            expect(res.body.passwordInfo.passwordChanged).toBe(true);
        });
        it('should 400 if missing fields', async () => {
            const res = await request(app).post('/api/users/change-password').send({ currentPassword: 'correct' });
            expect(res.status).toBe(400);
        });
        it('should 400 if new password too short', async () => {
            const res = await request(app).post('/api/users/change-password').send({ currentPassword: 'correct', newPassword: 'short' });
            expect(res.status).toBe(400);
        });
        it('should 404 if user not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).post('/api/users/change-password').send({ currentPassword: 'correct', newPassword: 'newpassword' });
            expect(res.status).toBe(404);
        });
        it('should 401 if current password incorrect', async () => {
            require('bcryptjs').compare.mockImplementationOnce(async () => false);
            mockPool.query.mockResolvedValueOnce([[{ password: 'hashed_correct', password_reset_required: 1 }]]);
            const res = await request(app).post('/api/users/change-password').send({ currentPassword: 'wrong', newPassword: 'newpassword' });
            expect(res.status).toBe(401);
        });
        it('should handle server error', async () => {
            mockPool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).post('/api/users/change-password').send({ currentPassword: 'correct', newPassword: 'newpassword' });
            expect(res.status).toBe(500);
        });
    });
});
