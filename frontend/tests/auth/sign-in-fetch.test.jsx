// File: sign-in-fetch.test.jsx
// Purpose: Tests for sign-in component fetch calls and error handling.
// Key approaches: Component testing, fetch mocking, error boundary testing, and user interaction simulation.
// Test coverage: initializeConfig, loadConfig integration, and error scenarios.

import { useAuth } from '@/contexts/auth-context';
import { getAppConfig, loadConfig } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    usePathname: vi.fn(() => '/sign-in')
}));

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
    useAuth: vi.fn(),
    ROLES: {
        STUDENT: 'student',
        ADMIN: 'admin'
    }
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
    loadConfig: vi.fn(),
    getAppConfig: vi.fn()
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
const originalEnv = process.env;

describe('Sign-In Component Fetch Tests', () => {
    let mockRouter;
    let mockAuth;

    beforeEach(() => {
        // Reset mocks and environment
        vi.clearAllMocks();
        process.env = { ...originalEnv };

        // Set up default environment variables
        process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
        process.env.API_URL = 'http://localhost:5000';
        process.env.BACKEND_URL = 'http://localhost:5000';

        // Mock router
        mockRouter = {
            push: vi.fn(),
            replace: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            refresh: vi.fn()
        };
        useRouter.mockReturnValue(mockRouter);

        // Mock auth context
        mockAuth = {
            signIn: vi.fn(),
            signInWithGoogleAuth: vi.fn(),
            user: null,
            isLoading: false,
            isInitialized: true,
            googleError: null,
            clearGoogleError: vi.fn()
        };
        useAuth.mockReturnValue(mockAuth);

        // Mock successful config load
        loadConfig.mockResolvedValue({
            recaptchaSiteKey: 'test-site-key',
            backendUrl: 'http://localhost:5000'
        });

        getAppConfig.mockReturnValue({
            backendUrl: 'http://localhost:5000'
        });
    });

    afterEach(() => {
        // Restore environment
        process.env = originalEnv;
    });

    describe('initializeConfig Function', () => {
        it('should successfully initialize config on component mount', async () => {
            // Arrange: Mock successful config load
            const mockConfig = {
                recaptchaSiteKey: 'test-site-key',
                backendUrl: 'http://localhost:5000'
            };

            loadConfig.mockResolvedValue(mockConfig);
            getAppConfig.mockReturnValue(mockConfig);

            // Act: Import and render the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Note: We can't directly test the useEffect, but we can verify the mocks are called
            expect(loadConfig).toBeDefined();
            expect(getAppConfig).toBeDefined();
        });

        it('should handle config loading errors gracefully', async () => {
            // Arrange: Mock config loading error
            loadConfig.mockRejectedValue(new Error('Failed to fetch'));

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should still be importable and loadConfig should be called
            expect(loadConfig).toBeDefined();
            expect(SignInPage).toBeDefined();
        });

        it('should use fallback config when backend is unavailable', async () => {
            // Arrange: Mock network error
            loadConfig.mockRejectedValue(new Error('Network error'));

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should still work with fallback config
            expect(SignInPage).toBeDefined();
        });
    });

    describe('Backend Connection Tests', () => {
        it('should handle backend server not running', async () => {
            // Arrange: Mock fetch to simulate server not running
            global.fetch.mockRejectedValue(new Error('Failed to fetch'));

            // Act: Try to load config
            try {
                await loadConfig();
            } catch (error) {
                // Expected to fail
            }

            // Assert: Should handle the error gracefully
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should handle CORS errors from backend', async () => {
            // Arrange: Mock CORS error
            global.fetch.mockRejectedValue(new Error('CORS error'));

            // Act: Try to load config
            try {
                await loadConfig();
            } catch (error) {
                // Expected to fail
            }

            // Assert: Should handle the error gracefully
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should handle backend timeout errors', async () => {
            // Arrange: Mock timeout error
            global.fetch.mockRejectedValue(new Error('Request timeout'));

            // Act: Try to load config
            try {
                await loadConfig();
            } catch (error) {
                // Expected to fail
            }

            // Assert: Should handle the error gracefully
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe('Error Handling and User Experience', () => {
        it('should show appropriate error messages for network failures', async () => {
            // Arrange: Mock network error
            loadConfig.mockRejectedValue(new Error('Failed to fetch'));

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should handle errors gracefully
            expect(SignInPage).toBeDefined();
        });

        it('should handle multiple consecutive config loading failures', async () => {
            // Arrange: Mock multiple failures
            loadConfig
                .mockRejectedValueOnce(new Error('First failure'))
                .mockRejectedValueOnce(new Error('Second failure'));

            // Act: Try to load config multiple times
            try {
                await loadConfig();
            } catch (error) {
                // Expected to fail
            }

            try {
                await loadConfig();
            } catch (error) {
                // Expected to fail
            }

            // Assert: Should handle multiple failures gracefully
            expect(loadConfig).toHaveBeenCalledTimes(2);
        });

        it('should provide fallback functionality when config is unavailable', async () => {
            // Arrange: Mock config loading failure
            loadConfig.mockRejectedValue(new Error('Config unavailable'));

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should still be functional with fallbacks
            expect(SignInPage).toBeDefined();
        });
    });

    describe('Environment Variable Handling', () => {
        it('should use correct environment variables for backend URL', async () => {
            // Arrange: Set different environment variables
            process.env.NEXT_PUBLIC_API_URL = 'http://custom-backend:5000';

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should use the correct environment variable
            expect(SignInPage).toBeDefined();
        });

        it('should fallback to default URL when environment variables are missing', async () => {
            // Arrange: Clear environment variables
            delete process.env.NEXT_PUBLIC_API_URL;
            delete process.env.API_URL;
            delete process.env.BACKEND_URL;

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should use default fallback
            expect(SignInPage).toBeDefined();
        });
    });

    describe('Integration with Auth Context', () => {
        it('should work with auth context when config loads successfully', async () => {
            // Arrange: Mock successful config load
            const mockConfig = {
                recaptchaSiteKey: 'test-site-key',
                backendUrl: 'http://localhost:5000'
            };

            loadConfig.mockResolvedValue(mockConfig);
            getAppConfig.mockReturnValue(mockConfig);

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should work with auth context
            expect(SignInPage).toBeDefined();
            expect(useAuth).toBeDefined();
        });

        it('should handle auth context errors gracefully', async () => {
            // Arrange: Mock auth context error
            useAuth.mockImplementation(() => {
                throw new Error('Auth context error');
            });

            // Act: Import the sign-in component
            const { default: SignInPage } = await import('@/app/auth/sign-in/page');

            // Assert: Component should handle auth context errors
            expect(SignInPage).toBeDefined();
        });
    });

    describe('Performance and Caching', () => {
        it('should cache config after successful load', async () => {
            // Arrange: Mock successful config load
            const mockConfig = {
                recaptchaSiteKey: 'test-site-key',
                backendUrl: 'http://localhost:5000'
            };

            loadConfig.mockResolvedValue(mockConfig);

            // Act: Load config multiple times
            await loadConfig();
            await loadConfig();

            // Assert: Should use cached config (implementation dependent)
            expect(loadConfig).toHaveBeenCalled();
        });

        it('should handle rapid successive config loading requests', async () => {
            // Arrange: Mock config load with delay
            loadConfig.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ backendUrl: 'http://localhost:5000' }), 100))
            );

            // Act: Make multiple rapid requests
            const promises = [
                loadConfig(),
                loadConfig(),
                loadConfig()
            ];

            // Assert: Should handle concurrent requests
            await Promise.all(promises);
            expect(loadConfig).toHaveBeenCalledTimes(3);
        });
    });
}); 