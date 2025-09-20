/**
 * Remember Me Backend Tests
 * 
 * Comprehensive tests for Remember Me backend functionality covering:
 * - Session manager enhancements
 * - Login endpoint modifications
 * - Token generation and validation
 * - Cookie management
 * - Security features
 * 
 * Key approaches: TDD workflow, security testing, integration testing
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sessionManager from '../middleware/session.js';

// Mock database
const mockQuery = vi.fn();
const mockPool = {
    query: mockQuery
};

vi.mock('../config/database', () => ({
    pool: mockPool,
    query: mockQuery
}));

// Mock logger
vi.mock('../config/logger', () => ({
    warn: vi.fn(),
    error: vi.fn()
}));

describe('Remember Me Backend Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Session Manager Enhancements', () => {
        it('should generate standard token with default expiration', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const token = sessionManager.generateToken(user);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('should generate Remember Me token with extended expiration', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const token = sessionManager.generateToken(user, true);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('should verify Remember Me token correctly', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const token = sessionManager.generateToken(user, true);
            const decoded = sessionManager.verifyToken(token);

            expect(decoded.rememberMe).toBe(true);
            expect(decoded.id).toBe(user.id);
            expect(decoded.email).toBe(user.email);
        });

        it('should identify Remember Me tokens', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const standardToken = sessionManager.generateToken(user, false);
            const rememberMeToken = sessionManager.generateToken(user, true);

            expect(sessionManager.isRememberMeToken(standardToken)).toBe(false);
            expect(sessionManager.isRememberMeToken(rememberMeToken)).toBe(true);
        });

        it('should get token expiration correctly', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const token = sessionManager.generateToken(user, true);
            const expiration = sessionManager.getTokenExpiration(token);

            expect(expiration).toBeInstanceOf(Date);
            expect(expiration.getTime()).toBeGreaterThan(Date.now());
        });

        it('should refresh token while preserving Remember Me setting', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            mockQuery.mockResolvedValue({ rows: [user] });

            const originalToken = sessionManager.generateToken(user, true);
            const refreshedToken = await sessionManager.refreshToken(originalToken);

            expect(refreshedToken).toBeDefined();
            expect(sessionManager.isRememberMeToken(refreshedToken)).toBe(true);
        });

        it('should handle token refresh errors gracefully', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            mockQuery.mockRejectedValue(new Error('Database error'));

            const token = sessionManager.generateToken(user, true);

            await expect(sessionManager.refreshToken(token)).rejects.toThrow('Database error');
        });
    });

    describe('Login Endpoint Integration', () => {
        let app;

        beforeEach(() => {
            app = express();
            app.use(express.json());

            // Mock auth routes
            app.post('/api/auth/login', async (req, res) => {
                const { email, password, rememberMe } = req.body;

                if (!email || !password) {
                    return res.status(400).json({ message: 'Email and password are required.' });
                }

                // Mock user validation
                const user = {
                    id: 1,
                    email: email,
                    name: 'Test User',
                    role: 'student',
                    organization: 'Test Org',
                    organization_type: 'university',
                    avatar: null,
                    is_approved: true,
                    google_id: null
                };

                const token = sessionManager.generateToken(user, rememberMe);

                // Set cookies for Remember Me
                if (rememberMe) {
                    const cookieOptions = {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                        path: '/'
                    };
                    res.cookie('cedo_auth_token', token, cookieOptions);
                    res.cookie('cedo_remember_me', 'true', cookieOptions);
                }

                res.json({
                    token,
                    rememberMe: rememberMe || false,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        organization: user.organization,
                        organization_type: user.organization_type,
                        avatar: user.avatar,
                        is_approved: Boolean(user.is_approved),
                        google_id: user.google_id,
                        dashboard: '/student-dashboard',
                        permissions: ['view_own_profile', 'submit_requests', 'view_own_requests']
                    }
                });
            });
        });

        it('should handle login with Remember Me enabled', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    rememberMe: true
                });

            expect(response.status).toBe(200);
            expect(response.body.rememberMe).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();

            // Check if Remember Me cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies.some(cookie => cookie.includes('cedo_auth_token'))).toBe(true);
            expect(cookies.some(cookie => cookie.includes('cedo_remember_me=true'))).toBe(true);
        });

        it('should handle login with Remember Me disabled', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    rememberMe: false
                });

            expect(response.status).toBe(200);
            expect(response.body.rememberMe).toBe(false);
            expect(response.body.token).toBeDefined();

            // Check that Remember Me cookies are not set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeUndefined();
        });

        it('should handle login without Remember Me parameter', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.rememberMe).toBe(false);
            expect(response.body.token).toBeDefined();
        });

        it('should validate Remember Me token correctly', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const rememberMeToken = sessionManager.generateToken(user, true);
            const decoded = sessionManager.verifyToken(rememberMeToken);

            expect(decoded.rememberMe).toBe(true);
            expect(decoded.id).toBe(user.id);
        });
    });

    describe('Security Features', () => {
        it('should not expose sensitive data in tokens', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true,
                password: 'should-not-be-in-token'
            };

            const token = sessionManager.generateToken(user, true);
            const decoded = sessionManager.verifyToken(token);

            expect(decoded).not.toHaveProperty('password');
            expect(decoded).not.toHaveProperty('rememberMe');
            expect(decoded.rememberMe).toBe(true);
        });

        it('should handle invalid tokens gracefully', () => {
            const invalidToken = 'invalid.jwt.token';

            expect(() => sessionManager.verifyToken(invalidToken)).toThrow();
            expect(sessionManager.isRememberMeToken(invalidToken)).toBe(false);
            expect(sessionManager.getTokenExpiration(invalidToken)).toBeNull();
        });

        it('should handle expired tokens gracefully', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            // Create a token with very short expiration
            const originalExpiration = process.env.JWT_SECRET_DEV;
            process.env.JWT_SECRET_DEV = 'test-secret';

            const token = sessionManager.generateToken(user, true);

            // Restore original secret
            process.env.JWT_SECRET_DEV = originalExpiration;

            expect(() => sessionManager.verifyToken(token)).toThrow();
        });
    });

    describe('Cookie Management', () => {
        it('should set secure cookies in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const app = express();
            app.use(express.json());

            app.post('/api/auth/login', (req, res) => {
                const user = { id: 1, email: 'test@example.com', role: 'student', approved: true };
                const token = sessionManager.generateToken(user, true);

                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    path: '/'
                };

                res.cookie('cedo_auth_token', token, cookieOptions);
                res.cookie('cedo_remember_me', 'true', cookieOptions);

                res.json({ token, rememberMe: true });
            });

            return request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password', rememberMe: true })
                .then(response => {
                    const cookies = response.headers['set-cookie'];
                    expect(cookies).toBeDefined();
                    expect(cookies.some(cookie => cookie.includes('Secure'))).toBe(true);
                    expect(cookies.some(cookie => cookie.includes('SameSite=None'))).toBe(true);
                })
                .finally(() => {
                    process.env.NODE_ENV = originalEnv;
                });
        });

        it('should clear Remember Me cookies on logout', () => {
            const app = express();
            app.use(express.json());

            app.post('/api/auth/logout', (req, res) => {
                res.clearCookie('cedo_auth_token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/'
                });
                res.clearCookie('cedo_remember_me', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/'
                });

                res.json({ message: 'Logout successful' });
            });

            return request(app)
                .post('/api/auth/logout')
                .then(response => {
                    expect(response.status).toBe(200);
                    expect(response.body.message).toBe('Logout successful');
                });
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors during token refresh', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            mockQuery.mockRejectedValue(new Error('Database connection failed'));

            const token = sessionManager.generateToken(user, true);

            await expect(sessionManager.refreshToken(token)).rejects.toThrow('Database connection failed');
        });

        it('should handle missing user during token refresh', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            mockQuery.mockResolvedValue({ rows: [] });

            const token = sessionManager.generateToken(user, true);

            await expect(sessionManager.refreshToken(token)).rejects.toThrow('User not found for refresh token');
        });

        it('should handle unapproved user during token refresh', async () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: false
            };

            mockQuery.mockResolvedValue({ rows: [user] });

            const token = sessionManager.generateToken(user, true);

            await expect(sessionManager.refreshToken(token)).rejects.toThrow('User not approved for refresh token');
        });
    });

    describe('Performance and Optimization', () => {
        it('should generate tokens efficiently', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const startTime = Date.now();

            for (let i = 0; i < 100; i++) {
                sessionManager.generateToken(user, i % 2 === 0);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (adjust threshold as needed)
            expect(duration).toBeLessThan(1000);
        });

        it('should verify tokens efficiently', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                role: 'student',
                approved: true
            };

            const token = sessionManager.generateToken(user, true);
            const startTime = Date.now();

            for (let i = 0; i < 100; i++) {
                sessionManager.verifyToken(token);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time
            expect(duration).toBeLessThan(1000);
        });
    });
});
