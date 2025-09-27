/**
 * Integration Tests for Remember Me Functionality
 * 
 * Uses Vitest with jsdom for browser-like testing
 * Covers the same scenarios as E2E tests but runs faster
 */

import RememberMeToggle from '@/components/auth/remember-me-toggle';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { useEnhancedRememberMe } from '@/hooks/use-enhanced-remember-me';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the auth context
const mockAuthContext = {
    signIn: vi.fn(),
    signOut: vi.fn(),
    user: null,
    isLoading: false,
    isInitialized: true
};

vi.mock('@/contexts/auth-context', () => ({
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }) => children
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({ toast: mockToast })
}));

// Mock fetch
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

// Mock document.cookie
let mockCookie = '';
Object.defineProperty(document, 'cookie', {
    get: () => mockCookie,
    set: (value) => {
        mockCookie = value;
    },
    writable: true
});

// Test wrapper component
const TestWrapper = ({ children }) => (
    <BrowserRouter>
        <AuthProvider>
            {children}
            <Toaster />
        </AuthProvider>
    </BrowserRouter>
);

describe('Remember Me Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCookie = '';
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockImplementation(() => { });
        localStorageMock.removeItem.mockImplementation(() => { });
    });

    describe('RememberMeToggle Component', () => {
        it('should render with default state', () => {
            render(
                <TestWrapper>
                    <RememberMeToggle
                        value={false}
                        onChange={vi.fn()}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Remember me')).toBeInTheDocument();
            expect(screen.getByText('Save your email for faster future logins. Your password is never saved.')).toBeInTheDocument();
        });

        it('should show security information when enabled', () => {
            render(
                <TestWrapper>
                    <RememberMeToggle
                        value={true}
                        onChange={vi.fn()}
                        showSecurityInfo={true}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Security Features')).toBeInTheDocument();
            expect(screen.getByText('Your password is never stored')).toBeInTheDocument();
            expect(screen.getByText('Only your email is saved')).toBeInTheDocument();
        });

        it('should handle checkbox changes', () => {
            const mockOnChange = vi.fn();
            render(
                <TestWrapper>
                    <RememberMeToggle
                        value={false}
                        onChange={mockOnChange}
                    />
                </TestWrapper>
            );

            const checkbox = screen.getByRole('checkbox');
            fireEvent.click(checkbox);

            expect(mockOnChange).toHaveBeenCalledWith(true);
        });
    });

    describe('Remember Me Hook Integration', () => {
        it('should handle Remember Me login flow', async () => {
            const TestComponent = () => {
                const { handleRememberMeLogin } = useEnhancedRememberMe();

                const handleLogin = async () => {
                    await handleRememberMeLogin({
                        token: 'test-token',
                        email: 'test@example.com'
                    }, true);
                };

                return (
                    <button onClick={handleLogin}>
                        Login with Remember Me
                    </button>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            const button = screen.getByText('Login with Remember Me');
            fireEvent.click(button);

            await waitFor(() => {
                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'cedo_user_preferences',
                    expect.stringContaining('"email":"test@example.com"')
                );
            });

            expect(mockToast).toHaveBeenCalledWith({
                title: "Remember Me Enabled",
                description: "Your login information has been saved securely.",
                variant: "default"
            });
        });

        it('should handle Remember Me logout flow', async () => {
            // Set up initial state
            mockCookie = 'cedo_auth_token=test-token; cedo_remember_me=true';
            localStorageMock.getItem.mockReturnValue(JSON.stringify({
                value: { email: 'test@example.com', rememberMe: true },
                timestamp: Date.now(),
                expires: Date.now() + 30 * 24 * 60 * 60 * 1000
            }));

            const TestComponent = () => {
                const { handleRememberMeLogout } = useEnhancedRememberMe();

                const handleLogout = async () => {
                    await handleRememberMeLogout();
                };

                return (
                    <button onClick={handleLogout}>
                        Logout and Clear Remember Me
                    </button>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            const button = screen.getByText('Logout and Clear Remember Me');
            fireEvent.click(button);

            await waitFor(() => {
                expect(localStorageMock.removeItem).toHaveBeenCalledWith('cedo_user_preferences');
            });

            expect(mockCookie).toContain('cedo_auth_token=; expires=');
            expect(mockCookie).toContain('cedo_remember_me=; expires=');
        });

        it('should handle auto-login when valid token exists', async () => {
            // Set up valid token
            mockCookie = 'cedo_auth_token=valid-token; cedo_remember_me=true';

            // Mock successful token validation
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    user: {
                        email: 'test@example.com',
                        name: 'Test User'
                    }
                })
            });

            const TestComponent = () => {
                const { attemptAutoLogin } = useEnhancedRememberMe();

                const handleAutoLogin = async () => {
                    await attemptAutoLogin();
                };

                return (
                    <button onClick={handleAutoLogin}>
                        Attempt Auto Login
                    </button>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            const button = screen.getByText('Attempt Auto Login');
            fireEvent.click(button);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/auth/validate-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer valid-token'
                    },
                    credentials: 'include'
                });
            });

            expect(mockToast).toHaveBeenCalledWith({
                title: "Welcome back!",
                description: "You've been automatically signed in.",
                variant: "default"
            });
        });

        it('should handle localStorage quota exceeded gracefully', async () => {
            // Mock quota exceeded error
            localStorageMock.setItem.mockImplementation(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });

            const TestComponent = () => {
                const { handleRememberMeLogin } = useEnhancedRememberMe();

                const handleLogin = async () => {
                    await handleRememberMeLogin({
                        token: 'test-token',
                        email: 'test@example.com'
                    }, true);
                };

                return (
                    <button onClick={handleLogin}>
                        Login with Full Storage
                    </button>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            const button = screen.getByText('Login with Full Storage');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: "Remember Me Failed",
                    description: "Could not save your login preferences. Please try again.",
                    variant: "destructive"
                });
            });
        });

        it('should show browser support warning for unsupported browsers', () => {
            // Mock unsupported browser (no localStorage)
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Not supported');
            });

            render(
                <TestWrapper>
                    <RememberMeToggle
                        value={false}
                        onChange={vi.fn()}
                        showSecurityInfo={true}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('Limited Browser Support')).toBeInTheDocument();
            expect(screen.getByText("Your browser doesn't support secure storage. Remember Me is disabled.")).toBeInTheDocument();
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle network errors during token validation', async () => {
            mockCookie = 'cedo_auth_token=test-token; cedo_remember_me=true';

            // Mock network error
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const TestComponent = () => {
                const { attemptAutoLogin } = useEnhancedRememberMe();

                const handleAutoLogin = async () => {
                    await attemptAutoLogin();
                };

                return (
                    <button onClick={handleAutoLogin}>
                        Test Network Error
                    </button>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            const button = screen.getByText('Test Network Error');
            fireEvent.click(button);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/auth/validate-token', expect.any(Object));
            });
        });

        it('should handle expired tokens gracefully', async () => {
            mockCookie = 'cedo_auth_token=expired-token; cedo_remember_me=true';

            // Mock failed token validation
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Token expired' })
            });

            const TestComponent = () => {
                const { attemptAutoLogin } = useEnhancedRememberMe();

                const handleAutoLogin = async () => {
                    await attemptAutoLogin();
                };

                return (
                    <button onClick={handleAutoLogin}>
                        Test Expired Token
                    </button>
                );
            };

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            );

            const button = screen.getByText('Test Expired Token');
            fireEvent.click(button);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/auth/validate-token', expect.any(Object));
            });

            // Should clear invalid cookies
            expect(mockCookie).toContain('cedo_auth_token=; expires=');
        });
    });
});


