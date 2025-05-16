const jwt = require('jsonwebtoken');
const sessionManager = require('../middleware/session');
const { pool } = require('../config/db');

jest.mock('../config/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

describe('sessionManager', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV, JWT_SECRET: 'testsecret' };
    });
    afterAll(() => {
        process.env = OLD_ENV;
    });

    describe('generateToken', () => {
        it('should generate a valid JWT for a valid user', () => {
            const user = { id: 1, email: 'test@example.com', role: 'student' };
            const token = sessionManager.generateToken(user);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded).toMatchObject({ id: 1, email: 'test@example.com', role: 'student' });
        });
        it('should throw if user object is invalid', () => {
            expect(() => sessionManager.generateToken(null)).toThrow();
            expect(() => sessionManager.generateToken({})).toThrow();
            expect(() => sessionManager.generateToken({ id: 1, email: 'a' })).toThrow();
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token and return user info if user exists and is approved', async () => {
            const user = { id: 2, email: 'verify@example.com', role: 'manager', is_approved: true };
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
            pool.query.mockResolvedValueOnce([[{ id: user.id, email: user.email, role: user.role, is_approved: 1 }]]);
            const result = await sessionManager.verifyToken(token);
            expect(result).toMatchObject({ id: user.id, email: user.email, role: user.role, is_approved: 1 });
        });
        it('should throw if user does not exist or is not approved', async () => {
            const token = jwt.sign({ id: 3, email: 'nope@example.com', role: 'student' }, process.env.JWT_SECRET);
            pool.query.mockResolvedValueOnce([[]]);
            await expect(sessionManager.verifyToken(token)).rejects.toThrow('User not found or not approved');
        });
        it('should throw on invalid token', async () => {
            await expect(sessionManager.verifyToken('badtoken')).rejects.toThrow();
        });
    });

    describe('refreshToken', () => {
        it('should refresh a valid token for an approved user', async () => {
            const user = { id: 4, email: 'refresh@example.com', role: 'reviewer', is_approved: 1 };
            const oldToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
            pool.query.mockResolvedValueOnce([[user]]); // verifyToken
            pool.query.mockResolvedValueOnce([[user]]); // fetch user for new token
            const newToken = await sessionManager.refreshToken(oldToken);
            const decoded = jwt.verify(newToken, process.env.JWT_SECRET);
            expect(decoded).toMatchObject({ id: user.id, email: user.email, role: user.role });
        });
        it('should throw if user is not approved', async () => {
            const user = { id: 5, email: 'notapproved@example.com', role: 'student', is_approved: 0 };
            const oldToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
            pool.query.mockResolvedValueOnce([[user]]); // verifyToken
            pool.query.mockResolvedValueOnce([[user]]); // fetch user for new token
            await expect(sessionManager.refreshToken(oldToken)).rejects.toThrow('User not approved for refresh token');
        });
        it('should throw if user does not exist', async () => {
            const user = { id: 6, email: 'nouser@example.com', role: 'student' };
            const oldToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
            pool.query.mockResolvedValueOnce([[user]]); // verifyToken
            pool.query.mockResolvedValueOnce([[]]); // fetch user for new token
            await expect(sessionManager.refreshToken(oldToken)).rejects.toThrow('User not found for refresh token');
        });
    });

    describe('logAccess', () => {
        it('should insert a log entry if userId and action are provided', async () => {
            pool.query.mockResolvedValueOnce([{}]);
            await sessionManager.logAccess(7, 'student', 'login');
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO access_logs (user_id, role, action, timestamp) VALUES (?, ?, ?, NOW())',
                [7, 'student', 'login']
            );
        });
        it('should not insert if userId or action is missing', async () => {
            await sessionManager.logAccess(null, 'student', 'login');
            await sessionManager.logAccess(8, 'student', null);
            expect(pool.query).not.toHaveBeenCalled();
        });
        it('should handle query errors gracefully', async () => {
            pool.query.mockRejectedValueOnce(new Error('fail'));
            await expect(sessionManager.logAccess(9, 'student', 'fail')).resolves.toBeUndefined();
        });
    });
}); 