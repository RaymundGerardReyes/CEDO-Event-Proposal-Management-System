/**
 * Unit Tests for Enhanced Remember Me Hook
 * 
 * Comprehensive testing of Remember Me functionality including:
 * - Cookie management
 * - localStorage operations
 * - Auto-login functionality
 * - Error handling
 * - Security features
 */

import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useEnhancedRememberMe } from '@/hooks/use-enhanced-remember-me';
import { act, renderHook } from '@testing-library/react';

import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/contexts/auth-context');
vi.mock('@/components/ui/use-toast');
vi.mock('@/lib/remember-me');

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Override the setup file's cookie mock with our own
let mockCookie = '';
delete document.cookie;
Object.defineProperty(document, 'cookie', {
    get: () => mockCookie,
    set: (value) => {
        mockCookie = value;
    },
    configurable: true
});

describe('useEnhancedRememberMe', () => {
    const mockSignIn = vi.fn();
    const mockToast = vi.fn();

    const mockAuthContext = {
        signIn: mockSignIn,
        user: null,
        isLoading: false,
        isInitialized: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();

        useAuth.mockReturnValue(mockAuthContext);
        useToast.mockReturnValue({ toast: mockToast });

        // Reset document.cookie
        mockCookie = '';

        // Reset fetch mock
        fetch.mockClear();
    });

    describe('Initialization', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            expect(result.current.rememberMeStatus).toEqual({
                isEnabled: false,
                hasToken: false,
                isSupported: false,
                isLoading: false,
                lastError: null
            });
            expect(result.current.isAutoLoginAttempted).toBe(false);
            expect(result.current.storedPreferences).toBe(null);
        });

        it('should detect browser support', () => {
            // Mock localStorage and cookie support
            localStorageMock.setItem.mockImplementation(() => { });
            localStorageMock.getItem.mockReturnValue('test');

            const { result } = renderHook(() => useEnhancedRememberMe());

            expect(result.current.isRememberMeSupported).toBe(true);
        });

        it('should handle unsupported browsers', () => {
            // Mock no localStorage support
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage not available');
            });

            const { result } = renderHook(() => useEnhancedRememberMe());

            expect(result.current.isRememberMeSupported).toBe(false);
        });
    });

    describe('Cookie Management', () => {
        it('should set secure cookies correctly', async () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);
            });

            expect(document.cookie).toContain('cedo_auth_token=test-token');
            expect(document.cookie).toContain('cedo_remember_me=true');
        });

        it('should get cookie values correctly', () => {
            mockCookie = 'cedo_auth_token=test-token; cedo_remember_me=true';

            const { result } = renderHook(() => useEnhancedRememberMe());

            act(() => {
                result.current.updateStatus();
            });

            expect(result.current.rememberMeStatus.hasToken).toBe(true);
            expect(result.current.rememberMeStatus.isEnabled).toBe(true);
        });

        it('should clear cookies on logout', async () => {
            mockCookie = 'cedo_auth_token=test-token; cedo_remember_me=true';

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.handleRememberMeLogout();
            });

            // Check that cookies are cleared (set to expired)
            expect(mockCookie).toContain('cedo_auth_token=; expires=');
            expect(mockCookie).toContain('cedo_remember_me=; expires=');
        });
    });

    describe('localStorage Management', () => {
        it('should store user preferences', async () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'cedo_user_preferences',
                expect.stringContaining('"email":"test@example.com"')
            );
        });

        it('should retrieve stored preferences', () => {
            const mockPreferences = {
                email: 'test@example.com',
                lastLogin: Date.now(),
                rememberMe: true
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify({
                value: mockPreferences,
                timestamp: Date.now(),
                expires: Date.now() + 30 * 24 * 60 * 60 * 1000
            }));

            const { result } = renderHook(() => useEnhancedRememberMe());

            // The hook automatically loads preferences on initialization
            expect(result.current.getStoredPreferences()).toEqual(mockPreferences);
        });

        it('should handle localStorage quota exceeded', async () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            // Mock quota exceeded error on first call, success on retry
            localStorageMock.setItem
                .mockImplementationOnce(() => {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                })
                .mockImplementationOnce(() => { }); // Success on retry

            await act(async () => {
                const success = await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);

                expect(success).toBe(true);
            });
        });

        it('should handle corrupted localStorage data', () => {
            localStorageMock.getItem.mockReturnValue('invalid-json');

            const { result } = renderHook(() => useEnhancedRememberMe());

            act(() => {
                const preferences = result.current.getStoredPreferences();
                expect(preferences).toBe(null);
            });

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('cedo_user_preferences');
        });
    });

    describe('Auto-login Functionality', () => {
        it('should attempt auto-login when Remember Me is enabled', async () => {
            // Mock valid token
            mockCookie = 'cedo_auth_token=valid-token; cedo_remember_me=true';

            // Mock successful token validation
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ user: { email: 'test@example.com' } })
            });

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.attemptAutoLogin();
            });

            expect(fetch).toHaveBeenCalledWith('/api/auth/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                credentials: 'include'
            });
        });

        it('should not attempt auto-login when user is already logged in', async () => {
            useAuth.mockReturnValue({
                ...mockAuthContext,
                user: { email: 'test@example.com' }
            });

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                const success = await result.current.attemptAutoLogin();
                expect(success).toBeUndefined();
            });

            expect(fetch).not.toHaveBeenCalled();
        });

        it('should handle auto-login failure gracefully', async () => {
            mockCookie = 'cedo_auth_token=invalid-token; cedo_remember_me=true';

            // Mock failed token validation
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401
            });

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                const success = await result.current.attemptAutoLogin();
                expect(success).toBe(false);
            });

            // Should clear invalid cookies
            expect(mockCookie).toContain('cedo_auth_token=; expires=');
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors during token validation', async () => {
            mockCookie = 'cedo_auth_token=test-token; cedo_remember_me=true';

            // Mock network error
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.attemptAutoLogin();
            });

            expect(result.current.rememberMeStatus.lastError).toBe('Network error');
        });

        it('should handle localStorage errors gracefully', async () => {
            // Mock localStorage error that's not QuotaExceededError
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                const success = await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);

                expect(success).toBe(false);
            });

            expect(mockToast).toHaveBeenCalledWith({
                title: "Remember Me Failed",
                description: "Could not save your login preferences. Please try again.",
                variant: "destructive"
            });
        });
    });

    describe('Security Features', () => {
        it('should use secure cookie settings in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);
            });

            // Check that secure cookies are set (production settings)
            expect(document.cookie).toContain('cedo_auth_token=test-token');
            expect(document.cookie).toContain('cedo_remember_me=true');

            process.env.NODE_ENV = originalEnv;
        });

        it('should use relaxed settings in development', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const { result } = renderHook(() => useEnhancedRememberMe());

            await act(async () => {
                await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);
            });

            // Check that cookies are set (development settings)
            expect(document.cookie).toContain('cedo_auth_token=test-token');
            expect(document.cookie).toContain('cedo_remember_me=true');

            process.env.NODE_ENV = originalEnv;
        });

        it('should expire old preferences', () => {
            const oldPreferences = {
                value: { email: 'test@example.com' },
                timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
                expires: Date.now() - 24 * 60 * 60 * 1000 // Expired
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(oldPreferences));

            const { result } = renderHook(() => useEnhancedRememberMe());

            act(() => {
                const preferences = result.current.getStoredPreferences();
                expect(preferences).toBe(null);
            });

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('cedo_user_preferences');
        });
    });

    describe('Status Management', () => {
        it('should update status when cookies change', () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            // Initially no cookies
            expect(result.current.rememberMeStatus.hasToken).toBe(false);
            expect(result.current.rememberMeStatus.isEnabled).toBe(false);

            // Set cookies
            act(() => {
                mockCookie = 'cedo_auth_token=test-token; cedo_remember_me=true';
                result.current.updateStatus();
            });

            expect(result.current.rememberMeStatus.hasToken).toBe(true);
            expect(result.current.rememberMeStatus.isEnabled).toBe(true);
        });

        it('should provide comprehensive status information', () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            const status = result.current.getRememberMeStatus();

            expect(status).toEqual({
                isEnabled: false,
                hasToken: false,
                isSupported: false,
                isLoading: false,
                lastError: null,
                preferences: null,
                isAutoLoginAttempted: false,
                isInitialized: true
            });
        });
    });

    describe('Integration Tests', () => {
        it('should complete full Remember Me flow', async () => {
            const { result } = renderHook(() => useEnhancedRememberMe());

            // 1. Login with Remember Me
            await act(async () => {
                const success = await result.current.handleRememberMeLogin({
                    token: 'test-token',
                    email: 'test@example.com'
                }, true);

                expect(success).toBe(true);
            });

            // 2. Check status
            expect(result.current.rememberMeStatus.isEnabled).toBe(true);
            expect(result.current.rememberMeStatus.hasToken).toBe(true);

            // 3. Get preferences
            const preferences = result.current.getStoredPreferences();
            expect(preferences.email).toBe('test@example.com');

            // 4. Logout
            await act(async () => {
                await result.current.handleRememberMeLogout();
            });

            // 5. Check cleanup
            expect(result.current.rememberMeStatus.isEnabled).toBe(false);
            expect(result.current.rememberMeStatus.hasToken).toBe(false);
        });
    });
});
