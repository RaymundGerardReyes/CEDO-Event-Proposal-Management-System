// frontend/tests/auth/sign-in.test.jsx

import SignInPage from '@/app/(auth)/sign-in/page';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

// --- MOCKS ---
jest.mock('@/contexts/auth-context', () => ({
    useAuth: jest.fn(),
    ROLES: {
        STUDENT: 'student',
        HEAD_ADMIN: 'head_admin',
        MANAGER: 'manager',
        PARTNER: 'partner',
        REVIEWER: 'reviewer',
    },
}));
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
}));
jest.mock('@/components/ui/use-toast', () => ({ useToast: jest.fn() }));
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: jest.fn() }));
jest.mock('@/components/logo', () => ({
    LogoSimple: () => <div data-testid="logo-simple">Logo</div>,
}));
jest.mock('@/components/auth/loading-screen', () => ({
    AuthLoadingScreen: ({ message }) => <div data-testid="loading-screen">{message}</div>,
}));

// Create a mock object that can be accessed from tests
const recaptchaMockInstance = {
    triggerChange: null,
    triggerError: null,
    triggerExpired: null
};

const recaptchaMock = React.forwardRef((props, ref) => {
    React.useEffect(() => {
        if (ref) {
            ref.current = { reset: jest.fn(), execute: jest.fn() };
        }
    }, [ref]);

    // Store the callback functions in the mock instance
    recaptchaMockInstance.triggerChange = props.onChange;
    recaptchaMockInstance.triggerError = props.onErrored;
    recaptchaMockInstance.triggerExpired = props.onExpired;

    return <div data-testid="recaptcha" />;
});

// Expose trigger methods on the component for easy access in tests
recaptchaMock.triggerChange = (token) => {
    return recaptchaMockInstance.triggerChange?.(token);
};
recaptchaMock.triggerError = () => {
    return recaptchaMockInstance.triggerError?.();
};
recaptchaMock.triggerExpired = () => {
    return recaptchaMockInstance.triggerExpired?.();
};

jest.mock('react-google-recaptcha', () => recaptchaMock);

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// --- END MOCKS ---

describe('SignInPage Exhaustive Stress Tests', () => {
    let mockSignIn, mockSignInWithGoogleAuth, mockRouter, mockToast, user;
    let defaultAuthValue;

    beforeEach(() => {
        jest.useFakeTimers();
        user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        jest.clearAllMocks();

        mockSignIn = jest.fn();
        mockSignInWithGoogleAuth = jest.fn().mockResolvedValue({});
        mockRouter = { push: jest.fn(), replace: jest.fn() };
        mockToast = jest.fn();

        defaultAuthValue = {
            signIn: mockSignIn,
            signInWithGoogleAuth: mockSignInWithGoogleAuth,
            user: null,
            isLoading: false,
            isInitialized: true,
        };

        useAuth.mockReturnValue(defaultAuthValue);
        useRouter.mockReturnValue(mockRouter);
        useSearchParams.mockReturnValue(new URLSearchParams());
        usePathname.mockReturnValue('/sign-in');
        useToast.mockReturnValue({ toast: mockToast });
        useIsMobile.mockReturnValue(false);
        process.env.RECAPTCHA_SITE_KEY = 'mock-site-key';
    });

    afterEach(() => {
        jest.useRealTimers();
        delete process.env.RECAPTCHA_SITE_KEY;
    });

    // Helper function to submit form properly
    const submitForm = async (user) => {
        await user.type(screen.getByPlaceholderText('your.email@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));
    };

    // --- Group 1: Accessibility & Keyboard Navigation (5 tests) ---
    describe('Accessibility & Keyboard Navigation', () => {
        test('1. Form fields have accessible labels', () => {
            render(<SignInPage />);
            expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
            expect(screen.getByRole('checkbox')).toBeInTheDocument();
        });

        test('2. User can tab through interactive elements in order', async () => {
            render(<SignInPage />);
            await user.tab();
            expect(screen.getByPlaceholderText('your.email@example.com')).toHaveFocus();
            await user.tab();
            expect(screen.getByPlaceholderText('••••••••')).toHaveFocus();
        });

        test('3. Can submit form by pressing Enter in password field', async () => {
            render(<SignInPage />);
            await user.type(screen.getByPlaceholderText('your.email@example.com'), 'test@example.com');
            await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
            act(() => recaptchaMock.triggerChange('mock-token'));
            await user.keyboard('{Enter}');
            await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
        });

        test('4. Password visibility button has correct ARIA label', async () => {
            render(<SignInPage />);
            await user.type(screen.getByPlaceholderText('••••••••'), 'p');
            const button = await screen.findByRole('button', { name: /show password/i });
            expect(button).toBeInTheDocument();
            await user.click(button);
            expect(await screen.findByRole('button', { name: /hide password/i })).toBeInTheDocument();
        });

        test('5. Error dialog receives focus when opened', async () => {
            mockSignIn.mockRejectedValue(new Error('fail'));
            render(<SignInPage />);
            act(() => recaptchaMock.triggerChange('mock-token'));
            await submitForm(user);
            const dialog = await screen.findByRole('dialog');
            await waitFor(() => expect(dialog).toHaveFocus(), { timeout: 3000 });
        });
    });

    // --- Group 2: UI States & Interactions (13 tests) ---
    describe('UI States & Interactions', () => {
        test('6. Renders the full sign-in form correctly', () => {
            render(<SignInPage />);
            expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
        });
        test('7. Renders "Forgot password?" link', () => {
            render(<SignInPage />);
            expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
        });
        test('8. Toggles password visibility', async () => {
            render(<SignInPage />);
            const passwordInput = screen.getByPlaceholderText('••••••••');
            await user.type(passwordInput, 'p');
            const visibilityButton = await screen.findByLabelText(/show password/i);
            await user.click(visibilityButton);
            expect(passwordInput).toHaveAttribute('type', 'text');
        });
        test('9. Shows "Initializing session..." screen', () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, isInitialized: false, isLoading: true });
            render(<SignInPage />);
            expect(screen.getByTestId('loading-screen')).toHaveTextContent(/initializing session/i);
        });
        test('10. Shows "Already signed in..." screen', () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'student' }, isInitialized: true });
            render(<SignInPage />);
            expect(screen.getByTestId('loading-screen')).toHaveTextContent(/already signed in, redirecting/i);
        });
        test('11. Renders with mobile-specific classes', () => {
            useIsMobile.mockReturnValue(true);
            const { container } = render(<SignInPage />);
            expect(container.firstChild).toHaveClass('h-[100dvh]');
        });
        test('12. Shows configuration error for missing reCAPTCHA key in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '';
            render(<SignInPage />);
            expect(screen.getByText(/configuration error/i)).toBeInTheDocument();
            process.env.NODE_ENV = originalEnv;
        });
        test('13. Form fields are disabled during Google auth processing', async () => {
            mockSignInWithGoogleAuth.mockImplementation(() => new Promise(() => { }));
            render(<SignInPage />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('your.email@example.com')).toBeDisabled();
                expect(screen.getByPlaceholderText('••••••••')).toBeDisabled();
            });
        });
        test('14. Password toggle is disabled during submission', async () => {
            mockSignIn.mockImplementation(() => new Promise(() => { }));
            render(<SignInPage />);
            await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
            const visibilityButton = await screen.findByLabelText(/show password/i);
            act(() => recaptchaMock.triggerChange('mock-token'));
            await submitForm(user);
            await waitFor(() => expect(visibilityButton).toBeDisabled());
        });
        test('15. Error dialog can be closed by clicking the close button', async () => {
            mockSignIn.mockRejectedValue(new Error('fail'));
            render(<SignInPage />);
            act(() => recaptchaMock.triggerChange('mock-token'));
            await submitForm(user);
            await screen.findByRole('dialog');
            // Use a more robust query for the close button
            const closeButton = screen.getAllByRole('button', { name: /close/i }).find(btn => btn.textContent?.toLowerCase().includes('close'));
            await user.click(closeButton);
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });
        test('16. Renders "or continue with email" separator', () => {
            render(<SignInPage />);
            expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
        });
        test('17. Renders Google Sign-In container', () => {
            render(<SignInPage />);
            expect(document.getElementById('google-signin-button-container')).toBeInTheDocument();
        });
        test('18. Renders correctly if `useToast` returns null', () => {
            useToast.mockReturnValue(null);
            expect(() => render(<SignInPage />)).not.toThrow();
        });
    });

    // --- Group 3: Validation, reCAPTCHA & State (12 tests) ---
    describe('Validation, reCAPTCHA & State', () => {
        test('19. Shows validation for invalid email', async () => {
            render(<SignInPage />);
            await user.type(screen.getByPlaceholderText('your.email@example.com'), 'invalid-email');
            await user.click(screen.getByPlaceholderText('••••••••')); // Trigger blur
            await waitFor(() => {
                expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });
        });
        test('20. Shows validation for empty password', async () => {
            render(<SignInPage />);
            await user.click(screen.getByPlaceholderText('••••••••'));
            await user.click(screen.getByPlaceholderText('your.email@example.com')); // Trigger blur
            await waitFor(() => {
                expect(screen.getByText(/password is required/i)).toBeInTheDocument();
            });
        });
        test('21. Sign-in button disabled without reCAPTCHA token', () => {
            render(<SignInPage />);
            expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
        });
        test('22. Sign-in button enabled after reCAPTCHA solve', async () => {
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            // Wait for Google auth processing to complete
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
            });
        });
        test('23. Fields disabled during email submission', async () => {
            mockSignIn.mockImplementation(() => new Promise(() => { }));
            render(<SignInPage />);
            act(() => recaptchaMock.triggerChange('mock-token'));
            await submitForm(user);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('your.email@example.com')).toBeDisabled();
                expect(screen.getByPlaceholderText('••••••••')).toBeDisabled();
            });
        });
        test('24. Prevents double submission', async () => {
            mockSignIn.mockImplementation(() => new Promise(() => { }));
            render(<SignInPage />);
            act(() => recaptchaMock.triggerChange('mock-token'));
            await submitForm(user);
            // Instead of looking for 'Signing in...', click the submit button again
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);
            await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
        });
        test('25. Shows toast if submitting without reCAPTCHA token', async () => {
            render(<SignInPage />);
            await submitForm(user);
            // Wait for the toast to be called
            await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: "CAPTCHA Required",
            })));
        });
        test('26. Handles reCAPTCHA `onErrored` callback', () => {
            render(<SignInPage />);
            act(() => recaptchaMock.triggerError());
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: "CAPTCHA Error",
            }));
        });
        test('27. Handles reCAPTCHA `onExpired` callback', () => {
            render(<SignInPage />);
            act(() => recaptchaMock.triggerChange('mock-token'));
            expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
            act(() => recaptchaMock.triggerExpired());
            expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
        });
        test('28. Button becomes disabled again after reCAPTCHA expires', () => {
            render(<SignInPage />);
            act(() => recaptchaMock.triggerChange('mock-token'));
            expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
            act(() => recaptchaMock.triggerExpired());
            expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
        });
        test('29. Resets captcha token state if verification returns null', async () => {
            render(<SignInPage />);
            // Wait for Google auth processing to complete
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
            });
            await act(async () => {
                recaptchaMock.triggerChange(null);
            });
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
            });
        });
        test('30. Does not require reCAPTCHA if site key is not set', async () => {
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '';
            render(<SignInPage />);
            // Wait for Google auth processing to complete  
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
            });
            expect(screen.queryByTestId('recaptcha')).not.toBeInTheDocument();
        });
    });

    // --- Group 4: Authentication Logic & Error States (17 tests) ---
    describe('Authentication Logic & Error States', () => {
        test('31. Handles successful email sign-in', async () => {
            mockSignIn.mockResolvedValue({ name: 'Test User' });
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
        });
        test('32. Shows "Signing in..." text on button', async () => {
            mockSignIn.mockImplementation(() => new Promise(() => { }));
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument());
        });
        test('33. Displays "Account not found" error', async () => {
            mockSignIn.mockRejectedValue({ isUserNotFound: true });
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/account not found/i)).toBeVisible());
        });
        test('34. Displays "Pending approval" error', async () => {
            mockSignIn.mockRejectedValue({ isPendingApproval: true });
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/pending approval/i)).toBeVisible());
        });
        test('35. Displays generic error for other failures', async () => {
            mockSignIn.mockRejectedValue(new Error('Network Error'));
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/network error/i)).toBeVisible());
        });
        test('36. Displays default error message if error has no message property', async () => {
            mockSignIn.mockRejectedValue({});
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/failed to sign in/i)).toBeVisible());
        });
        test('37. Passes `rememberMe: true` when checked', async () => {
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            const checkbox = screen.getByRole('checkbox');
            await user.click(checkbox);
            // Wait for checkbox state to update
            await waitFor(() => {
                expect(checkbox).toBeChecked();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("credentials", expect.objectContaining({
                rememberMe: true,
                captchaToken: 'mock-token'
            })));
        });
        test('38. Calls `signInWithGoogleAuth` on mount', async () => {
            render(<SignInPage />);
            await waitFor(() => expect(mockSignInWithGoogleAuth).toHaveBeenCalled());
        });
        test('39. Shows loading indicator for Google Sign-In', async () => {
            mockSignInWithGoogleAuth.mockImplementation(() => new Promise(() => { }));
            render(<SignInPage />);
            await waitFor(() => expect(screen.getByText(/loading google sign-in/i)).toBeVisible());
        });
        test('40. Shows error dialog if Google Sign-In fails', async () => {
            mockSignInWithGoogleAuth.mockRejectedValue(new Error('Failed to sign in with Google. Please try again.'));
            render(<SignInPage />);
            await waitFor(() => expect(screen.getByText(/failed to sign in with google/i)).toBeVisible());
        });
        test('41. Shows "pending approval" dialog for Google Sign-In', async () => {
            mockSignInWithGoogleAuth.mockRejectedValue({ isPendingApproval: true });
            render(<SignInPage />);
            await waitFor(() => expect(screen.getByText(/pending approval/i)).toBeVisible());
        });
        test('42. Error dialog closes after timeout', async () => {
            mockSignIn.mockRejectedValue(new Error('An error'));
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await screen.findByRole('dialog');
            act(() => jest.advanceTimersByTime(6000));
            await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        });
        test('43. Resets Google button state after an error', async () => {
            mockSignInWithGoogleAuth.mockRejectedValueOnce(new Error('fail'));
            const { rerender } = render(<SignInPage />);
            await waitFor(() => expect(mockSignInWithGoogleAuth).toHaveBeenCalledTimes(1));

            // Reset the mock to succeed on second call and force a rerender
            mockSignInWithGoogleAuth.mockResolvedValueOnce({});
            // Reset the auth state to trigger effect again
            useAuth.mockReturnValue({
                ...defaultAuthValue,
                signInWithGoogleAuth: mockSignInWithGoogleAuth,
                isInitialized: true,
                user: null,
            });
            rerender(<SignInPage />);
            // Wait for the Google button state to reset and the effect to re-run
            await waitFor(() => expect(mockSignInWithGoogleAuth).toHaveBeenCalledTimes(2), { timeout: 3000 });
        });
        test('44. Handles `signIn` resolving with a falsy value (e.g., null)', async () => {
            mockSignIn.mockResolvedValue(null);
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/authentication failed/i)).toBeVisible());
        });
        test('45. Handles lower-case "account not found" message from server', async () => {
            mockSignIn.mockRejectedValue(new Error('some message about account not found'));
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/account not found\. please contact an administrator/i)).toBeVisible());
        });
        test('46. Handles lower-case "pending approval" message from server', async () => {
            mockSignIn.mockRejectedValue(new Error('user is pending approval'));
            render(<SignInPage />);
            // Wait for the reCAPTCHA component to render
            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
            await act(async () => {
                recaptchaMock.triggerChange('mock-token');
            });
            await submitForm(user);
            await waitFor(() => expect(screen.getByText(/your account is currently pending approval/i)).toBeVisible());
        });
        test('47. Unmounts cleanly without errors', () => {
            const { unmount } = render(<SignInPage />);
            expect(() => unmount()).not.toThrow();
        });
    });

    // --- Group 5: Redirect Logic (15 tests) ---
    describe('Authenticated User Redirects', () => {
        test('48. Redirects STUDENT to /student-dashboard', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'student' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/student-dashboard'));
        });
        test('49. Redirects HEAD_ADMIN to /admin-dashboard', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'head_admin' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/admin-dashboard'));
        });
        test('50. Redirects MANAGER to /admin-dashboard', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'manager' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/admin-dashboard'));
        });
        test('51. Redirects PARTNER to /student-dashboard (default)', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'partner' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/student-dashboard'));
        });
        test('52. Redirects REVIEWER to /admin-dashboard (default)', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'reviewer' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/admin-dashboard'));
        });
        test('53. Redirects PARTNER to user.dashboard if defined', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'partner', dashboard: '/partner-portal' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/partner-portal'));
        });
        test('54. Redirects based on query param, overriding role', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'manager' }, isInitialized: true });
            useSearchParams.mockReturnValue(new URLSearchParams('redirect=/special-offer'));
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/special-offer'));
        });
        test('55. Redirects based on user.dashboard, overriding role', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'manager', dashboard: '/manager-desk' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/manager-desk'));
        });
        test('56. Query param redirect has priority over user.dashboard', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'manager', dashboard: '/manager-desk' }, isInitialized: true });
            useSearchParams.mockReturnValue(new URLSearchParams('redirect=/query-param-wins'));
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/query-param-wins'));
        });
        test('57. STUDENT redirect has priority over query param', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'student' }, isInitialized: true });
            useSearchParams.mockReturnValue(new URLSearchParams('redirect=/should-be-ignored'));
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/student-dashboard'));
        });
        test('58. Redirects to `/` for unknown user role', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'some_future_role' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
        });
        test('59. Avoids redirect loop from query param', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'manager' }, isInitialized: true });
            useSearchParams.mockReturnValue(new URLSearchParams('redirect=/sign-in'));
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/admin-dashboard'));
        });
        test('60. Avoids redirect loop from user.dashboard', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'manager', dashboard: '/sign-in' }, isInitialized: true });
            render(<SignInPage />);
            await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
        });
        test('61. No redirect if user is on target page', async () => {
            useAuth.mockReturnValue({ ...defaultAuthValue, user: { role: 'student' }, isInitialized: true });
            usePathname.mockReturnValue('/student-dashboard');
            render(<SignInPage />);
            await act(() => jest.advanceTimersByTime(100));
            expect(mockRouter.replace).not.toHaveBeenCalled();
        });
        test('62. No redirect if user is null', async () => {
            render(<SignInPage />);
            await act(() => jest.advanceTimersByTime(100));
            expect(mockRouter.replace).not.toHaveBeenCalled();
        });
    });
});