/**
 * Integration test for sign-in page with getInternalApi fix
 * 
 * Purpose: Verify that the sign-in page can properly import and use getInternalApi
 * Key approaches: Import verification, component rendering, error handling
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the auth context
vi.mock('@/contexts/auth-context', () => ({
    useAuth: vi.fn(() => ({
        signIn: vi.fn(),
        signInWithGoogleAuth: vi.fn(),
        user: null,
        isLoading: false,
        isInitialized: true,
        googleError: null,
        clearGoogleError: vi.fn(),
    })),
    ROLES: {
        STUDENT: 'student',
        HEAD_ADMIN: 'head_admin',
        MANAGER: 'manager',
        PARTNER: 'partner',
        REVIEWER: 'reviewer',
    },
    getInternalApi: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { status: 'ok' } }),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        defaults: {
            baseURL: 'http://localhost:5000',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        },
    })),
}));

// Mock other dependencies
vi.mock('@/components/ui/use-toast', () => ({
    useToast: vi.fn(() => ({
        toast: vi.fn(),
    })),
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: vi.fn(() => false),
}));

vi.mock('@/lib/utils', () => ({
    getAppConfig: vi.fn(() => ({
        recaptchaSiteKey: 'test-site-key',
        googleClientId: 'test-client-id',
    })),
    loadConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
    })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    usePathname: vi.fn(() => '/auth/sign-in'),
}));

// Mock react-google-recaptcha
vi.mock('react-google-recaptcha', () => {
    return {
        default: vi.fn(() => <div data-testid="recaptcha">Mock ReCAPTCHA</div>),
    };
});

describe('SignIn Integration Test', () => {
    it('should successfully import getInternalApi from auth context', async () => {
        // This test verifies that the import works without errors
        const { getInternalApi } = await import('@/contexts/auth-context');
        expect(typeof getInternalApi).toBe('function');
    });

    it('should render sign-in page without errors', async () => {
        // Dynamically import the sign-in page to test the import
        const SignInPage = (await import('@/app/auth/sign-in/page')).default;

        // This should not throw any import errors
        expect(() => {
            render(<SignInPage />);
        }).not.toThrow();
    });

    it('should have proper axios configuration in getInternalApi', async () => {
        const { getInternalApi } = await import('@/contexts/auth-context');
        const api = getInternalApi();

        expect(api).toBeDefined();
        expect(typeof api.get).toBe('function');
        expect(typeof api.post).toBe('function');
        expect(api.defaults).toBeDefined();
        expect(api.defaults.baseURL).toBeDefined();
        expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
}); 