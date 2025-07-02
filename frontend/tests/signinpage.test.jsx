import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from './page'; // Adjust path to your SignInPage component

// --- Mock Dependencies ---
const mockSignIn = jest.fn();
const mockSignInWithGoogleAuth = jest.fn();
const mockToast = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn(); // If you use push
const mockPathname = jest.fn();
const mockSearchParamsGet = jest.fn();
const mockRecaptchaReset = jest.fn();

jest.mock('@/contexts/auth-context', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signInWithGoogleAuth: mockSignInWithGoogleAuth,
        user: null,
        isLoading: false,
        isInitialized: true,
        ROLES: { // Make sure ROLES are defined as they are in your context
            STUDENT: "student",
            HEAD_ADMIN: "head_admin",
            MANAGER: "manager",
            PARTNER: "partner",
            REVIEWER: "reviewer",
        }
    }),
    ROLES: { // Export ROLES directly if your component imports it separately
        STUDENT: "student",
        HEAD_ADMIN: "head_admin",
        MANAGER: "manager",
        PARTNER: "partner",
        REVIEWER: "reviewer",
    }
}));

jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: mockRouterReplace,
        push: mockRouterPush,
    }),
    usePathname: () => mockPathname(),
    useSearchParams: () => ({
        get: mockSearchParamsGet,
    }),
}));

jest.mock('react-google-recaptcha', () => {
    const mockReact = require('react');

    // eslint-disable-next-line react/display-name
    return mockReact.forwardRef((props, ref) => {
        // @ts-ignore
        mockReact.useImperativeHandle(ref, () => ({
            reset: mockRecaptchaReset,
            // getValue: jest.fn().mockReturnValue('mock-captcha-token') // if needed directly
        }));
        return mockReact.createElement('div', {
            'data-testid': 'mock-recaptcha',
            onClick: () => props.onChange('mock-captcha-token')
        }, 'Mock ReCAPTCHA');
    });
});


jest.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false, // Default to not mobile for tests, can be overridden
}));

jest.mock('@/components/logo', () => {
    const mockReact = require('react');
    return {
        // @ts-ignore
        LogoSimple: () => mockReact.createElement('div', { 'data-testid': 'logo-simple' }, 'Mock Logo'),
    };
});

jest.mock('@/components/auth/loading-screen', () => {
    const mockReact = require('react');
    return {
        // @ts-ignore
        AuthLoadingScreen: ({ message }) => mockReact.createElement('div', { 'data-testid': 'auth-loading-screen' }, message),
    };
});

// Mock environment variables
const originalEnv = process.env;

describe('SignInPage', () => {
    beforeEach(() => {
        // Reset mocks and environment variables before each test
        jest.clearAllMocks();
        process.env = { ...originalEnv, RECAPTCHA_SITE_KEY: 'test-recaptcha-key' };
        // @ts-ignore
        mockPathname.mockReturnValue('/sign-in');
        // @ts-ignore
        mockSearchParamsGet.mockReturnValue(null);

        // Default auth state for most tests (not logged in, initialized)
        // @ts-ignore
        jest.spyOn(require('@/contexts/auth-context'), 'useAuth').mockReturnValue({
            signIn: mockSignIn,
            signInWithGoogleAuth: mockSignInWithGoogleAuth,
            user: null,
            isLoading: false,
            isInitialized: true,
            ROLES: { STUDENT: "student", HEAD_ADMIN: "head_admin", MANAGER: "manager", PARTNER: "partner", REVIEWER: "reviewer" },
        });
    });

    afterEach(() => {
        process.env = originalEnv; // Restore original environment variables
    });

    // --- Test Cases ---

    test('SIGNIN_RENDER_001: Renders all basic elements correctly', () => {
        render(<SignInPage />);
        expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
        expect(screen.getByText('Forgot password?')).toBeInTheDocument();
        expect(screen.getByTestId('mock-recaptcha')).toBeInTheDocument();
        expect(screen.getByTestId('logo-simple')).toBeInTheDocument();
        expect(screen.getByText('or continue with email')).toBeInTheDocument();
        // Google button container check
        expect(document.getElementById('google-signin-button-container')).toBeInTheDocument();
    });

    test('SIGNIN_RENDER_002: Password visibility toggle works', async () => {
        const user = userEvent.setup();
        render(<SignInPage />);
        const passwordInput = screen.getByPlaceholderText('Enter your password');

        await user.type(passwordInput, 'testpassword');
        expect(passwordInput).toHaveAttribute('type', 'password');

        // The button is only rendered if formData.password is truthy
        const toggleButton = screen.getByRole('button', { name: 'Show password' });
        expect(toggleButton).toBeInTheDocument();

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

        await user.click(toggleButton); // Actually, it will be a new button query now
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    });

    test('SIGNIN_EMAIL_SUCCESS_001: Successful email/password sign-in', async () => {
        const user = userEvent.setup();
        // @ts-ignore
        mockSignIn.mockResolvedValue({ name: 'Test User' });
        render(<SignInPage />);

        await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');

        // Simulate CAPTCHA completion
        fireEvent.click(screen.getByTestId('mock-recaptcha')); // This triggers onChange in our mock

        const signInButton = screen.getByRole('button', { name: 'Sign in' });
        await user.click(signInButton);

        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123', false, 'mock-captcha-token');
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Signed In Successfully!',
                variant: 'success',
            }));
        });
        // Redirect logic will be handled by useAuth context changing `user`
    });

    test('SIGNIN_EMAIL_FAIL_001: Failed email/password sign-in shows error dialog', async () => {
        const user = userEvent.setup();
        // @ts-ignore
        mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
        render(<SignInPage />);

        await user.type(screen.getByPlaceholderText('Enter your email address'), 'wrong@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
        fireEvent.click(screen.getByTestId('mock-recaptcha')); // Complete CAPTCHA

        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Sign In Failed')).toBeVisible();
            // Uses the error message from the rejected promise
            expect(screen.getByText('Invalid credentials')).toBeVisible();

        });
        expect(mockRecaptchaReset).toHaveBeenCalled();
    });

    test('SIGNIN_EMAIL_PENDING_APPROVAL_001: Sign-in with pending approval shows specific error', async () => {
        const user = userEvent.setup();
        const error = new Error("Your account is pending approval.");
        // @ts-ignore
        error.isPendingApproval = true; // Simulate the custom error property
        // @ts-ignore
        mockSignIn.mockRejectedValue(error);
        render(<SignInPage />);

        await user.type(screen.getByPlaceholderText('Enter your email address'), 'pending@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
        fireEvent.click(screen.getByTestId('mock-recaptcha'));
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Your account is currently pending approval. Please contact an administrator to activate your account.')).toBeVisible();
        });
    });

    test('SIGNIN_EMAIL_NOCAPTCHA_001: Sign-in attempt without CAPTCHA shows warning', async () => {
        const user = userEvent.setup();
        render(<SignInPage />);

        await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
        // Do NOT complete CAPTCHA

        const signInButton = screen.getByRole('button', { name: 'Sign in' });
        // Initially, button might be disabled due to no captcha token
        expect(signInButton).toBeDisabled();
        // If we try to click (though disabled), or if logic changes to enable then check on submit:
        // For this test, we assume the button becomes enabled and the check is on submit
        // To test the disabled state properly, you'd check its `disabled` attribute.
        // Let's assume the button is clicked for the sake of testing the handleSubmit logic path.
        // If the button is truly disabled by the `!captchaToken` condition, this click won't happen.
        // The component's `disabled` prop on the button is `(recaptchaSiteKey && !captchaToken)`
        // So, we'll test that the toast appears IF the button was somehow clicked or submit was triggered.
        // A better way: check the disabled state, then simulate captcha, then check enabled.

        // Click the button (assuming it's enabled for this test path, or the check is inside handleSubmit)
        // If the button is disabled by `!captchaToken`, this test needs to reflect that.
        // The current logic: button IS disabled. So, let's verify the toast when handleSubmit is called.
        // We can manually call the submit handler for this specific test if needed,
        // or ensure the button is enabled before clicking.

        // For this test, we assume the primary path inside handleSubmit is what we're testing.
        // If the button is disabled due to `!captchaToken`, this test is effectively testing that disabling.
        // To test the toast when CAPTCHA is required:
        // Manually trigger form submission if button is disabled.
        const form = screen.getByRole('button', { name: 'Sign in' }).closest('form');
        // @ts-ignore
        fireEvent.submit(form);


        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'CAPTCHA Required',
                variant: 'warning',
            }));
        });
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    test('SIGNIN_GOOGLE_INIT_001: Google Sign-In shows loading and calls signInWithGoogleAuth', async () => {
        // @ts-ignore
        mockSignInWithGoogleAuth.mockReturnValue(new Promise(() => { })); // Pending promise
        render(<SignInPage />);

        await waitFor(() => {
            // Check for the container where Google button or its loader would be
            const googleButtonContainer = document.getElementById('google-signin-button-container');
            // @ts-ignore
            expect(googleButtonContainer.textContent).toContain('Loading Google Sign-In...');
        });

        // The function should be called with the DOM element, not the string ID
        const expectedContainer = document.getElementById('google-signin-button-container');
        expect(mockSignInWithGoogleAuth).toHaveBeenCalledWith(expectedContainer);
    });

    test('SIGNIN_GOOGLE_FAIL_001: Failed Google Sign-In shows error dialog', async () => {
        // @ts-ignore
        mockSignInWithGoogleAuth.mockRejectedValue(new Error('Google auth failed'));
        render(<SignInPage />);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Google auth failed')).toBeVisible();
        });
    });


    test('SIGNIN_REDIRECT_STUDENT_001: Authenticated student user is redirected', async () => {
        // @ts-ignore
        jest.spyOn(require('@/contexts/auth-context'), 'useAuth').mockReturnValue({
            signIn: mockSignIn,
            signInWithGoogleAuth: mockSignInWithGoogleAuth,
            // @ts-ignore
            user: { name: 'Student User', role: 'student', dashboard: '/student-dashboard' },
            isLoading: false,
            isInitialized: true,
            ROLES: { STUDENT: "student", HEAD_ADMIN: "head_admin", MANAGER: "manager" },
        });

        render(<SignInPage />);

        expect(screen.getByTestId('auth-loading-screen')).toHaveTextContent('Already signed in, redirecting...');
        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith('/student-dashboard');
        });
    });

    test('SIGNIN_REDIRECT_ADMIN_QUERYPARAM_001: Authenticated admin redirected by query param', async () => {
        // @ts-ignore
        mockSearchParamsGet.mockImplementation((key) => key === 'redirect' ? '/custom-admin-path' : null);
        // @ts-ignore
        jest.spyOn(require('@/contexts/auth-context'), 'useAuth').mockReturnValue({
            signIn: mockSignIn,
            signInWithGoogleAuth: mockSignInWithGoogleAuth,
            // @ts-ignore
            user: { name: 'Admin User', role: 'head_admin', dashboard: '/admin-dashboard' },
            isLoading: false,
            isInitialized: true,
            ROLES: { STUDENT: "student", HEAD_ADMIN: "head_admin", MANAGER: "manager" },
        });

        render(<SignInPage />);

        expect(screen.getByTestId('auth-loading-screen')).toHaveTextContent('Already signed in, redirecting...');
        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith('/custom-admin-path');
        });
    });


    test('SIGNIN_ERROR_DIALOG_AUTOCLOSE_001: Error dialog auto-closes', async () => {
        jest.useFakeTimers();
        const user = userEvent.setup();
        // @ts-ignore
        mockSignIn.mockRejectedValue(new Error('Auto-close test error'));
        render(<SignInPage />);

        await user.type(screen.getByPlaceholderText('Enter your email address'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('Enter your password'), 'password');
        fireEvent.click(screen.getByTestId('mock-recaptcha'));
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());

        act(() => {
            jest.advanceTimersByTime(6000);
        });

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        jest.useRealTimers();
    });

    test('SIGNIN_RENDER_NORECAPTCHA_KEY_PROD_001: Shows config error if ReCAPTCHA key missing in prod', () => {
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '';
        process.env.NODE_ENV = 'production';
        render(<SignInPage />);
        expect(screen.getByText('Configuration Error')).toBeInTheDocument();
        expect(screen.getByText('The ReCAPTCHA service is not configured correctly. Please contact support.')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Enter your email address')).not.toBeInTheDocument();
    });
});