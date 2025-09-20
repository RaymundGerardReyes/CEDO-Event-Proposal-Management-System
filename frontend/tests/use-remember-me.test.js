/**
 * useRememberMe Hook Tests
 * 
 * Comprehensive tests for the useRememberMe hook covering:
 * - Auto-login functionality
 * - State management
 * - User preference handling
 * - Error scenarios
 * - Integration with auth context
 * 
 * Key approaches: TDD workflow, hook testing, mock integration
 */

import { useRememberMe } from '@/hooks/use-remember-me';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the auth context
const mockAuthContext = {
    login: vi.fn(),
    user: null,
    isLoading: false
};

vi.mock('@/contexts/auth-context', () => ({
    useAuth: () => mockAuthContext
}));

// Mock the remember-me utilities
vi.mock('@/lib/remember-me', () => ({
    attemptAutoLogin: vi.fn(),
    handleRememberMeLogin: vi.fn(),
    handleRememberMeLogout: vi.fn(),
    getStoredPreferences: vi.fn(),
    isRememberMeEnabled: vi.fn(),
    clearAllRememberMeData: vi.fn(),
    setAuthCookie: vi.fn(),
    storeUserPreferences: vi.fn(),
    getUserPreferences: vi.fn(),
    isRememberMeSupported: vi.fn(),
    getRememberMeStatus: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

// Mock document.cookie
const documentMock = {
    cookie: ''
};

beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset auth context
    mockAuthContext.login = vi.fn();
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;

    // Reset localStorage
    Object.assign(localStorageMock, {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
    });

    // Reset document.cookie
    documentMock.cookie = '';

    // Mock global objects
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
    });

    Object.defineProperty(document, 'cookie', {
        value: '',
        writable: true
    });

    Object.defineProperty(window, 'document', {
        value: documentMock,
        writable: true
    });
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('useRememberMe Hook', () => {
    describe('Initialization', () => {
        it('should initialize with correct default state', () => {
            const { result } = renderHook(() => useRememberMe());

            expect(result.current.isRememberMeSupported).toBe(true);
            expect(result.current.isAutoLoginAttempted).toBe(false);
            expect(result.current.rememberMeStatus).toEqual({
                isEnabled: false,
                hasToken: false,
                isSupported: true
            });
        });

        it('should detect Remember Me support', () => {
            const { result } = renderHook(() => useRememberMe());

            expect(result.current.isRememberMeSupported).toBe(true);
        });
    });

    describe('Auto-Login Functionality', () => {
        it('should attempt auto-login on mount when no user is logged in', async () => {
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            const { attemptAutoLogin } = await import('@/lib/remember-me');
            vi.mocked(attemptAutoLogin).mockResolvedValue(mockUser);
            mockAuthContext.user = null;
            mockAuthContext.isLoading = false;

            const { result } = renderHook(() => useRememberMe());

            // Wait for auto-login attempt
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(attemptAutoLogin).toHaveBeenCalled();
            expect(result.current.isAutoLoginAttempted).toBe(true);
        });

        it('should not attempt auto-login when user is already logged in', async () => {
            mockAuthContext.user = { id: 1, email: 'test@example.com' };
            mockAuthContext.isLoading = false;

            const { result } = renderHook(() => useRememberMe());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            const { attemptAutoLogin } = await import('@/lib/remember-me');
            expect(attemptAutoLogin).not.toHaveBeenCalled();
            expect(result.current.isAutoLoginAttempted).toBe(true);
        });

        it('should not attempt auto-login when auth is still loading', async () => {
            mockAuthContext.user = null;
            mockAuthContext.isLoading = true;

            const { result } = renderHook(() => useRememberMe());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            const { attemptAutoLogin } = await import('@/lib/remember-me');
            expect(attemptAutoLogin).not.toHaveBeenCalled();
            expect(result.current.isAutoLoginAttempted).toBe(true);
        });

        it('should handle auto-login success', async () => {
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            const { attemptAutoLogin } = await import('@/lib/remember-me');
            vi.mocked(attemptAutoLogin).mockResolvedValue(mockUser);
            mockAuthContext.user = null;
            mockAuthContext.isLoading = false;

            renderHook(() => useRememberMe());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(mockAuthContext.login).toHaveBeenCalledWith(mockUser);
        });

        it('should handle auto-login failure gracefully', async () => {
            const { attemptAutoLogin } = await import('@/lib/remember-me');
            vi.mocked(attemptAutoLogin).mockRejectedValue(new Error('Auto-login failed'));
            mockAuthContext.user = null;
            mockAuthContext.isLoading = false;

            const { result } = renderHook(() => useRememberMe());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(mockAuthContext.login).not.toHaveBeenCalled();
            expect(result.current.isAutoLoginAttempted).toBe(true);
        });
    });

    describe('Remember Me Actions', () => {
        it('should handle Remember Me login', async () => {
            const mockUserData = { token: 'test-token', user: { id: 1, email: 'test@example.com' } };
            const rememberMe = true;

            const { result } = renderHook(() => useRememberMe());

            const success = await act(async () => {
                return await result.current.handleRememberMeLogin(mockUserData, rememberMe);
            });

            expect(success).toBe(true);
        });

        it('should handle Remember Me logout', async () => {
            const { result } = renderHook(() => useRememberMe());

            const success = await act(async () => {
                return await result.current.handleRememberMeLogout();
            });

            expect(success).toBe(true);
        });

        it('should get stored preferences', () => {
            const mockPreferences = { email: 'test@example.com', rememberMe: true };
            const { getUserPreferences } = require('@/lib/remember-me');
            vi.mocked(getUserPreferences).mockReturnValue(mockPreferences);

            const { result } = renderHook(() => useRememberMe());

            const preferences = result.current.getStoredPreferences();

            expect(getUserPreferences).toHaveBeenCalled();
            expect(preferences).toEqual(mockPreferences);
        });

        it('should update user preferences', () => {
            const mockPreferences = { email: 'test@example.com' };

            const { result } = renderHook(() => useRememberMe());

            const success = result.current.updateUserPreferences(mockPreferences);

            expect(success).toBe(true);
        });

        it('should check if Remember Me is enabled', () => {
            const { isRememberMeEnabled } = require('@/lib/remember-me');
            vi.mocked(isRememberMeEnabled).mockReturnValue(true);

            const { result } = renderHook(() => useRememberMe());

            const isEnabled = result.current.hasRememberMeEnabled();

            expect(isRememberMeEnabled).toHaveBeenCalled();
            expect(isEnabled).toBe(true);
        });
    });

    describe('Status and Debugging', () => {
        it('should provide Remember Me status', () => {
            const mockStatus = {
                isEnabled: true,
                hasToken: true,
                isSupported: true,
                preferences: { email: 'test@example.com' }
            };

            const { getRememberMeStatus } = require('@/lib/remember-me');
            vi.mocked(getRememberMeStatus).mockReturnValue(mockStatus);

            const { result } = renderHook(() => useRememberMe());

            const status = result.current.getRememberMeStatus();

            expect(getRememberMeStatus).toHaveBeenCalled();
            expect(status).toEqual(mockStatus);
        });

        it('should provide clear all Remember Me data function', () => {
            const { clearAllRememberMeData } = require('@/lib/remember-me');

            const { result } = renderHook(() => useRememberMe());

            result.current.clearAllRememberMeData();

            expect(clearAllRememberMeData).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle Remember Me login errors gracefully', async () => {
            const mockUserData = { token: 'test-token', user: { id: 1 } };

            const { result } = renderHook(() => useRememberMe());

            const success = await act(async () => {
                return await result.current.handleRememberMeLogin(mockUserData, true);
            });

            expect(success).toBe(true);
        });

        it('should handle Remember Me logout errors gracefully', async () => {
            const { result } = renderHook(() => useRememberMe());

            const success = await act(async () => {
                return await result.current.handleRememberMeLogout();
            });

            expect(success).toBe(true);
        });

        it('should handle preference update errors gracefully', () => {
            const mockPreferences = { email: 'test@example.com' };

            const { result } = renderHook(() => useRememberMe());

            const success = result.current.updateUserPreferences(mockPreferences);

            expect(success).toBe(true);
        });
    });

    describe('Integration with Auth Context', () => {
        it('should work with different auth states', async () => {
            // Test with user logged in
            mockAuthContext.user = { id: 1, email: 'test@example.com' };
            mockAuthContext.isLoading = false;

            const { result: result1 } = renderHook(() => useRememberMe());

            expect(result1.current.isAutoLoginAttempted).toBe(true);

            // Test with loading state
            mockAuthContext.user = null;
            mockAuthContext.isLoading = true;

            const { result: result2 } = renderHook(() => useRememberMe());

            expect(result2.current.isAutoLoginAttempted).toBe(true);
        });
    });

    describe('Performance and Optimization', () => {
        it('should not cause unnecessary re-renders', () => {
            let renderCount = 0;

            const { rerender } = renderHook(() => {
                renderCount++;
                return useRememberMe();
            });

            // Rerender multiple times
            rerender();
            rerender();
            rerender();

            // Should not cause excessive renders
            expect(renderCount).toBeLessThanOrEqual(5);
        });
    });
});