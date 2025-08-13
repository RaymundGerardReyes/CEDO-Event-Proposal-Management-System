// tests/middleware/session.middleware.test.js

const sessionManager = require('../../middleware/session');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const logger = require('../../config/logger');

jest.spyOn(logger, 'warn').mockImplementation(() => { });
jest.spyOn(logger, 'error').mockImplementation(() => { });

const secret = 'test-jwt-secret';
sessionManager.__setTestSecret(secret);

const mockUser = {
    id: 1,
    role: 'admin',
    email: 'test@example.com',
    name: 'Test User',
    approved: 1,
};

describe('Session Middleware', () => {
    describe('generateToken', () => {
        it('generates valid JWT', () => {
            const token = sessionManager.generateToken(mockUser);
            const decoded = jwt.verify(token, secret);
            expect(decoded).toMatchObject({
                id: mockUser.id,
                role: mockUser.role,
                email: mockUser.email,
                approved: mockUser.approved,
            });
        });

        it('throws if secret is missing', () => {
            sessionManager.__setTestSecret('');
            expect(() => sessionManager.generateToken(mockUser)).toThrow();
            sessionManager.__setTestSecret(secret);
        });
    });

    describe('verifyToken', () => {
        it('verifies valid token', () => {
            const token = sessionManager.generateToken(mockUser);
            const decoded = sessionManager.verifyToken(token);
            expect(decoded.id).toBe(mockUser.id);
        });

        it('throws on invalid token', () => {
            expect(() => sessionManager.verifyToken('x.y.z')).toThrow();
        });

        it('throws if secret is missing', () => {
            const token = sessionManager.generateToken(mockUser);
            sessionManager.__setTestSecret('');
            expect(() => sessionManager.verifyToken(token)).toThrow();
            sessionManager.__setTestSecret(secret);
        });
    });

    describe('refreshToken', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('refreshes for valid approved user', async () => {
            const token = sessionManager.generateToken(mockUser);
            pool.query = jest.fn().mockResolvedValue([[mockUser]]);
            const newToken = await sessionManager.refreshToken(token);
            const decoded = jwt.verify(newToken, secret);
            expect(decoded.id).toBe(mockUser.id);
        });

        it('throws if user not found', async () => {
            const token = sessionManager.generateToken(mockUser);
            pool.query = jest.fn().mockResolvedValue([[]]);
            await expect(sessionManager.refreshToken(token)).rejects.toThrow('User not found for refresh token');
        });

        it('throws if user not approved', async () => {
            const token = sessionManager.generateToken(mockUser);
            pool.query = jest.fn().mockResolvedValue([[{ ...mockUser, approved: 0 }]]);
            await expect(sessionManager.refreshToken(token)).rejects.toThrow('User not approved for refresh token');
        });

        const missingFields = ['id', 'email', 'role', 'approved'];
        test.each(missingFields)('throws if user field %s is missing or malformed', async (field) => {
            const user = { ...mockUser };
            delete user[field];
            const token = sessionManager.generateToken(mockUser);
            pool.query = jest.fn().mockResolvedValue([[user]]);
            await expect(sessionManager.refreshToken(token)).rejects.toThrow(`User field ${field} is missing or malformed`);
        });

        it('throws if verifyToken fails', async () => {
            jest.spyOn(sessionManager, 'verifyToken').mockImplementation(() => {
                throw new Error('bad token');
            });
            await expect(sessionManager.refreshToken('bad-token')).rejects.toThrow('bad token');
        });
    });

    describe('logAccess', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('logs access to DB', async () => {
            pool.query = jest.fn().mockResolvedValue([{}]);
            await sessionManager.logAccess(1, 'admin', 'login');
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO access_logs (user_id, role, action, timestamp) VALUES (?, ?, ?, NOW())',
                [1, 'admin', 'login']
            );
        });

        it('warns if userId missing', async () => {
            await sessionManager.logAccess(null, 'admin', 'login');
            expect(logger.warn).toHaveBeenCalledWith('Missing userId in logAccess');
        });

        it('warns if action missing', async () => {
            await sessionManager.logAccess(1, 'admin', null);
            expect(logger.warn).toHaveBeenCalledWith('Missing action in logAccess');
        });

        it('handles db errors silently', async () => {
            pool.query = jest.fn().mockRejectedValue(new Error('DB fail'));
            await sessionManager.logAccess(1, 'admin', 'login');
            expect(logger.error).toHaveBeenCalledWith('Failed to log access:', 'DB fail');
        });
    });

    describe('Edge cases', () => {
        it('throws if secret is empty', () => {
            sessionManager.__setTestSecret('');
            expect(() => sessionManager.generateToken(mockUser)).toThrow();
            sessionManager.__setTestSecret(secret);
        });

        it('throws for malformed decoded user', async () => {
            jest.spyOn(sessionManager, 'verifyToken').mockReturnValue({ id: 999 });
            pool.query = jest.fn().mockResolvedValue([[]]);
            await expect(sessionManager.refreshToken('tok')).rejects.toThrow('User not found for refresh token');
        });
    });
});
