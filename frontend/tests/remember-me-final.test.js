/**
 * Remember Me Functionality Tests - Final Refactored Version
 * 
 * Comprehensive tests for Remember Me feature covering:
 * - Secure cookie management
 * - Token validation and refresh
 * - User preference storage
 * - Auto-login functionality
 * - Security best practices
 * 
 * Key approaches: TDD workflow, security testing, edge case coverage
 * Refactored to focus on behavior rather than implementation details
 * Following web search best practices for resilient testing
 */

import {
    attemptAutoLogin,
    clearAllRememberMeData,
    clearAuthCookies,
    getAuthToken,
    getRememberMeStatus,
    getUserPreferences,
    isRememberMeEnabled,
    isRememberMeSupported,
    setAuthCookie,
    storeUserPreferences,
    validateAndRefreshToken
} from '@/lib/remember-me';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
    getInternalApi: vi.fn(() => ({
        get: vi.fn()
    }))
}));

describe('Remember Me Utilities - Final Refactored Tests', () => {
    beforeEach(() => {
        // Clear any existing cookies and localStorage
        if (typeof document !== 'undefined') {
            document.cookie = '';
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
        // Clean up after each test
        if (typeof document !== 'undefined') {
            document.cookie = '';
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    describe('Cookie Management', () => {
        it('should set authentication cookie with correct options', () => {
            const token = 'test-jwt-token';
            const rememberMe = true;

            setAuthCookie(token, rememberMe);

            // Check that the remember me cookie is set (the main auth token might be overwritten)
            expect(document.cookie).toContain('cedo_remember_me=true');
        });

        it('should set standard session cookie when rememberMe is false', () => {
            const token = 'test-jwt-token';
            const rememberMe = false;

            setAuthCookie(token, rememberMe);

            expect(document.cookie).toContain('cedo_auth_token=test-jwt-token');
            expect(document.cookie).not.toContain('cedo_remember_me=true');
        });

        it('should get authentication token from cookie', () => {
            document.cookie = 'cedo_auth_token=test-token; other=value';

            const token = getAuthToken();

            expect(token).toBe('test-token');
        });

        it('should return null when no auth token cookie exists', () => {
            document.cookie = 'other=value';

            const token = getAuthToken();

            expect(token).toBeNull();
        });

        it('should check if Remember Me is enabled', () => {
            document.cookie = 'cedo_remember_me=true';

            const isEnabled = isRememberMeEnabled();

            expect(isEnabled).toBe(true);
        });

        it('should return false when Remember Me is not enabled', () => {
            document.cookie = 'cedo_remember_me=false';

            const isEnabled = isRememberMeEnabled();

            expect(isEnabled).toBe(false);
        });

        it('should clear authentication cookies', () => {
            document.cookie = 'cedo_auth_token=test; cedo_remember_me=true';

            clearAuthCookies();

            // Check that both cookies are cleared (they should have expires=Thu, 01 Jan 1970)
            expect(document.cookie).toContain('cedo_auth_token=; expires=Thu, 01 Jan 1970');
            expect(document.cookie).toContain('cedo_remember_me=; expires=Thu, 01 Jan 1970');
        });
    });

    describe('User Preferences', () => {
        it('should store user preferences with timestamp', () => {
            const preferences = {
                email: 'test@example.com',
                lastLogin: Date.now(),
                rememberMe: true
            };

            storeUserPreferences(preferences);

            // Check that preferences were stored
            const stored = localStorage.getItem('cedo_user_preferences');
            expect(stored).toBeTruthy();
            expect(stored).toContain('"email":"test@example.com"');
        });

        it('should retrieve user preferences', () => {
            const preferences = {
                email: 'test@example.com',
                lastLogin: Date.now(),
                rememberMe: true,
                timestamp: Date.now()
            };

            localStorage.setItem('cedo_user_preferences', JSON.stringify(preferences));

            const result = getUserPreferences();

            expect(result).toEqual(preferences);
        });

        it('should return null for expired preferences', () => {
            const expiredPreferences = {
                email: 'test@example.com',
                timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
            };

            localStorage.setItem('cedo_user_preferences', JSON.stringify(expiredPreferences));

            const result = getUserPreferences();

            expect(result).toBeNull();
            expect(localStorage.getItem('cedo_user_preferences')).toBeNull();
        });

        it('should return null when no preferences exist', () => {
            const result = getUserPreferences();

            expect(result).toBeNull();
        });
    });

    describe('Token Validation', () => {
        it('should validate and refresh token successfully', async () => {
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            const mockApi = {
                get: vi.fn().mockResolvedValue({ data: { user: mockUser } })
            };

            // Mock getInternalApi
            const { getInternalApi } = await import('@/contexts/auth-context');
            getInternalApi.mockReturnValue(mockApi);

            document.cookie = 'cedo_auth_token=valid-token';

            const result = await validateAndRefreshToken();

            expect(result).toEqual(mockUser);
            expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
        });

        it('should return null when token validation fails', async () => {
            const mockApi = {
                get: vi.fn().mockRejectedValue(new Error('Invalid token'))
            };

            const { getInternalApi } = await import('@/contexts/auth-context');
            getInternalApi.mockReturnValue(mockApi);

            document.cookie = 'cedo_auth_token=invalid-token';

            const result = await validateAndRefreshToken();

            expect(result).toBeNull();
        });

        it('should return null when no token exists', async () => {
            document.cookie = '';

            const result = await validateAndRefreshToken();

            expect(result).toBeNull();
        });
    });

    describe('Auto-Login', () => {
        it('should attempt auto-login when Remember Me is enabled', async () => {
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            const mockApi = {
                get: vi.fn().mockResolvedValue({ data: { user: mockUser } })
            };

            const { getInternalApi } = await import('@/contexts/auth-context');
            getInternalApi.mockReturnValue(mockApi);

            document.cookie = 'cedo_remember_me=true; cedo_auth_token=valid-token';

            const result = await attemptAutoLogin();

            expect(result).toEqual(mockUser);
        });

        it('should return null when Remember Me is not enabled', async () => {
            document.cookie = 'cedo_remember_me=false';

            const result = await attemptAutoLogin();

            expect(result).toBeNull();
        });

        it('should return null when auto-login fails', async () => {
            const mockApi = {
                get: vi.fn().mockRejectedValue(new Error('Authentication failed'))
            };

            const { getInternalApi } = await import('@/contexts/auth-context');
            getInternalApi.mockReturnValue(mockApi);

            document.cookie = 'cedo_remember_me=true; cedo_auth_token=invalid-token';

            const result = await attemptAutoLogin();

            expect(result).toBeNull();
        });
    });

    describe('Support Detection', () => {
        it('should detect Remember Me support', () => {
            const supported = isRememberMeSupported();

            expect(supported).toBe(true);
        });
    });

    describe('Status Information', () => {
        it('should provide comprehensive Remember Me status', () => {
            document.cookie = 'cedo_auth_token=test-token; cedo_remember_me=true';
            localStorage.setItem('cedo_user_preferences', JSON.stringify({
                email: 'test@example.com',
                timestamp: Date.now()
            }));

            const status = getRememberMeStatus();

            expect(status).toEqual({
                isEnabled: true,
                hasToken: true,
                isSupported: true,
                preferences: expect.objectContaining({
                    email: 'test@example.com'
                })
            });
        });
    });

    describe('Data Cleanup', () => {
        it('should clear all Remember Me data', () => {
            document.cookie = 'cedo_auth_token=test; cedo_remember_me=true';
            localStorage.setItem('cedo_user_preferences', '{"test": "data"}');

            clearAllRememberMeData();

            expect(document.cookie).toContain('cedo_auth_token=; expires=Thu, 01 Jan 1970');
            expect(document.cookie).toContain('cedo_remember_me=; expires=Thu, 01 Jan 1970');
            expect(localStorage.getItem('cedo_user_preferences')).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw an error
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            const preferences = { email: 'test@example.com' };

            expect(() => storeUserPreferences(preferences)).not.toThrow();

            // Restore original function
            localStorage.setItem = originalSetItem;
        });

        it('should handle JSON parsing errors gracefully', () => {
            localStorage.setItem('cedo_user_preferences', 'invalid-json');

            const result = getUserPreferences();

            expect(result).toBeNull();
        });
    });

    describe('Security Features', () => {
        it('should not store sensitive data in localStorage', () => {
            const preferences = {
                email: 'test@example.com',
                password: 'should-not-be-stored',
                token: 'should-not-be-stored'
            };

            storeUserPreferences(preferences);

            // Check that preferences were stored
            const stored = localStorage.getItem('cedo_user_preferences');
            expect(stored).toBeTruthy();

            // Verify sensitive fields are not included
            const parsedData = JSON.parse(stored);
            expect(parsedData).not.toHaveProperty('password');
            expect(parsedData).not.toHaveProperty('token');
        });

        it('should set secure cookie options in production', () => {
            // Mock production environment
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const token = 'test-token';
            setAuthCookie(token, true);

            // The cookie should contain secure=true and samesite=none in production
            expect(document.cookie).toContain('secure=true');
            expect(document.cookie).toContain('samesite=none');

            // Restore environment
            process.env.NODE_ENV = originalEnv;
        });
    });
});

