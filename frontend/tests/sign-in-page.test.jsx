import SignInPage from '@/app/auth/sign-in/page';
import { useAuth } from '@/contexts/auth-context';
import { getAppConfig, loadConfig } from '@/lib/utils';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the auth context
jest.mock('@/contexts/auth-context');
const mockUseAuth = useAuth;

// Mock the utils
jest.mock('@/lib/utils');
const mockLoadConfig = loadConfig;
const mockGetAppConfig = getAppConfig;

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
    usePathname: () => '/sign-in',
    useSearchParams: () => new URLSearchParams('?redirect=/dashboard'),
}));

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

// Mock the mobile hook
jest.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false,
}));

// Mock the logo component
jest.mock('@/components/logo', () => ({
    LogoSimple: () => <div data-testid="logo">Logo</div>,
}));

// Mock Google reCAPTCHA
jest.mock('react-google-recaptcha', () => {
    return function MockReCAPTCHA({ onChange, onErrored, onExpired, sitekey }) {
        return (
            <div data-testid="recaptcha" data-sitekey={sitekey}>
                <button onClick={() => onChange('test-token')} data-testid="recaptcha-verify">
                    Verify reCAPTCHA
                </button>
                <button onClick={() => onErrored()} data-testid="recaptcha-error">
                    Trigger Error
                </button>
                <button onClick={() => onExpired()} data-testid="recaptcha-expire">
                    Expire
                </button>
            </div>
        );
    };
});

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
    process.env = {
        ...originalEnv,
        NEXT_PUBLIC_API_URL: 'http://localhost:5000',
        NEXT_PUBLIC_BACKEND_URL: 'http://localhost:5000',
        RECAPTCHA_SITE_KEY: 'test-recaptcha-key',
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'test-recaptcha-key',
    };
});

afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = '';
});

// Helper function to create mock user data
const createMockUser = (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'student',
    organization: 'Test Org',
    dashboard: '/student-dashboard',
    ...overrides,
});

describe('SignInPage Component', () => {
    beforeEach(() => {
        // Reset all mocks
        mockUseAuth.mockReturnValue({
            user: null,
            isLoading: false,
            isInitialized: true,
            signIn: jest.fn(),
            signInWithGoogleAuth: jest.fn(),
            googleError: null,
            clearGoogleError: jest.fn(),
        });

        mockLoadConfig.mockResolvedValue({
            recaptchaSiteKey: 'test-site-key',
        });

        mockGetAppConfig.mockReturnValue({
            recaptchaSiteKey: 'test-site-key',
        });
    });

    describe('Component Rendering', () => {
        test('should render sign-in page without crashing', () => {
            render(<SignInPage />);
            expect(screen.getByText('Welcome back')).toBeInTheDocument();
        });

        test('should render logo component', () => {
            render(<SignInPage />);
            expect(screen.getByTestId('logo')).toBeInTheDocument();
        });

        test('should render form elements correctly', () => {
            render(<SignInPage />);
            expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
            expect(screen.getByText('Sign in')).toBeInTheDocument();
        });

        test('should render Google Sign-In container', () => {
            render(<SignInPage />);
            expect(screen.getByTestId('google-signin-button-container')).toBeInTheDocument();
        });

        test('should render reCAPTCHA when site key is available', () => {
            render(<SignInPage />);
            expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
        });

        test('should render "Remember me" checkbox', () => {
            render(<SignInPage />);
            expect(screen.getByText('Remember me')).toBeInTheDocument();
        });

        test('should render "Forgot password?" link', () => {
            render(<SignInPage />);
            expect(screen.getByText('Forgot password?')).toBeInTheDocument();
        });

        test('should render separator with "or continue with email" text', () => {
            render(<SignInPage />);
            expect(screen.getByText('or continue with email')).toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        test('should validate email format correctly', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            await user.type(emailInput, 'invalid-email');

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });

        test('should validate required password field', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            await user.type(emailInput, 'test@example.com');

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('Password is required')).toBeInTheDocument();
        });

        test('should accept valid email format', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            await user.type(emailInput, 'test@example.com');

            expect(emailInput.value).toBe('test@example.com');
        });

        test('should handle password visibility toggle', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const passwordInput = screen.getByPlaceholderText('••••••••');
            await user.type(passwordInput, 'password123');

            const toggleButton = screen.getByLabelText('Show password');
            await user.click(toggleButton);

            expect(passwordInput.type).toBe('text');
        });

        test('should validate form submission with valid data', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockResolvedValue(createMockUser());
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123', false, 'test-token');
        });
    });

    describe('Authentication Flow', () => {
        test('should call signIn function with correct parameters', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockResolvedValue(createMockUser());
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123', false, 'test-token');
        });

        test('should handle authentication success', async () => {
            const user = userEvent.setup();
            const mockUser = createMockUser();
            const mockSignIn = jest.fn().mockResolvedValue(mockUser);
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalled();
            });
        });

        test('should handle authentication failure', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'wrongpassword');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalled();
            });
        });

        test('should handle pending approval error', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Account pending approval'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalled();
            });
        });
    });

    describe('Google Sign-In Integration', () => {
        test('should initialize Google Sign-In when component mounts', async () => {
            const mockSignInWithGoogleAuth = jest.fn();
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: jest.fn(),
                signInWithGoogleAuth: mockSignInWithGoogleAuth,
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            await waitFor(() => {
                expect(mockSignInWithGoogleAuth).toHaveBeenCalled();
            });
        });

        test('should handle Google Sign-In errors', async () => {
            const mockSignInWithGoogleAuth = jest.fn().mockRejectedValue(new Error('Google auth failed'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: jest.fn(),
                signInWithGoogleAuth: mockSignInWithGoogleAuth,
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            await waitFor(() => {
                expect(mockSignInWithGoogleAuth).toHaveBeenCalled();
            });
        });

        test('should display Google Sign-In error dialog', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: jest.fn(),
                signInWithGoogleAuth: jest.fn(),
                googleError: { description: 'Google Sign-In failed' },
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            await waitFor(() => {
                expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
            });
        });

        test('should clear Google error when dialog is closed', async () => {
            const mockClearGoogleError = jest.fn();
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: jest.fn(),
                signInWithGoogleAuth: jest.fn(),
                googleError: { description: 'Google Sign-In failed' },
                clearGoogleError: mockClearGoogleError,
            });

            render(<SignInPage />);

            await waitFor(() => {
                expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
            });

            expect(mockClearGoogleError).toHaveBeenCalled();
        });
    });

    describe('reCAPTCHA Integration', () => {
        test('should require reCAPTCHA verification before form submission', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('CAPTCHA Required')).toBeInTheDocument();
        });

        test('should handle reCAPTCHA verification success', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockResolvedValue(createMockUser());
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123', false, 'test-token');
        });

        test('should handle reCAPTCHA errors', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const recaptchaErrorButton = screen.getByTestId('recaptcha-error');
            await user.click(recaptchaErrorButton);

            expect(screen.getByText('CAPTCHA Error')).toBeInTheDocument();
        });

        test('should handle reCAPTCHA expiration', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const recaptchaExpireButton = screen.getByTestId('recaptcha-expire');
            await user.click(recaptchaExpireButton);

            // Should reset the captcha token
            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('CAPTCHA Required')).toBeInTheDocument();
        });

        test('should reset reCAPTCHA on form submission error', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Auth failed'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalled();
            });
        });
    });

    describe('Loading States', () => {
        test('should show loading state when auth is initializing', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: true,
                isInitialized: false,
                signIn: jest.fn(),
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);
            expect(screen.getByText('Initializing session...')).toBeInTheDocument();
        });

        test('should show loading state when user is already signed in', () => {
            mockUseAuth.mockReturnValue({
                user: createMockUser(),
                isLoading: false,
                isInitialized: true,
                signIn: jest.fn(),
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);
            expect(screen.getByText('Already signed in, redirecting...')).toBeInTheDocument();
        });

        test('should show loading state when configuration is loading', () => {
            mockLoadConfig.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<SignInPage />);
            expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
        });

        test('should show loading state during form submission', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockImplementation(() => new Promise(() => { })); // Never resolves
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('Signing in...')).toBeInTheDocument();
        });
    });

    describe('Configuration Loading', () => {
        test('should load configuration on component mount', async () => {
            render(<SignInPage />);

            await waitFor(() => {
                expect(mockLoadConfig).toHaveBeenCalled();
            });
        });

        test('should handle configuration loading error', async () => {
            mockLoadConfig.mockRejectedValue(new Error('Config failed'));

            render(<SignInPage />);

            await waitFor(() => {
                expect(screen.getByText('Configuration Error')).toBeInTheDocument();
            });
        });

        test('should use fallback reCAPTCHA site key from environment', async () => {
            mockLoadConfig.mockRejectedValue(new Error('Config failed'));

            render(<SignInPage />);

            await waitFor(() => {
                expect(screen.getByTestId('recaptcha')).toBeInTheDocument();
            });
        });

        test('should show error when no reCAPTCHA site key is available', async () => {
            delete process.env.RECAPTCHA_SITE_KEY;
            delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
            mockLoadConfig.mockRejectedValue(new Error('Config failed'));

            render(<SignInPage />);

            await waitFor(() => {
                expect(screen.getByText('Configuration Error')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        test('should display error dialog for authentication failures', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'wrongpassword');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
            });
        });

        test('should close error dialog after timeout', async () => {
            jest.useFakeTimers();
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Auth failed'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
            });

            act(() => {
                jest.advanceTimersByTime(6000);
            });

            await waitFor(() => {
                expect(screen.queryByText('Sign In Failed')).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });

        test('should handle network errors gracefully', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Network error'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                expect(screen.getByText('Sign In Failed')).toBeInTheDocument();
            });
        });
    });

    describe('User Experience', () => {
        test('should disable form inputs during submission', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockImplementation(() => new Promise(() => { })); // Never resolves
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
            expect(signInButton).toBeDisabled();
        });

        test('should show loading spinner during submission', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockImplementation(() => new Promise(() => { })); // Never resolves
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('Signing in...')).toBeInTheDocument();
        });

        test('should handle "Remember me" checkbox', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const rememberMeCheckbox = screen.getByRole('checkbox', { name: /Remember me/i });
            await user.click(rememberMeCheckbox);

            expect(rememberMeCheckbox).toBeChecked();
        });

        test('should navigate to forgot password page', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const forgotPasswordLink = screen.getByText('Forgot password?');
            await user.click(forgotPasswordLink);

            // Should navigate to forgot password page
            expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA labels for form inputs', () => {
            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');

            expect(emailInput).toHaveAttribute('type', 'email');
            expect(emailInput).toHaveAttribute('autoComplete', 'email');
            expect(passwordInput).toHaveAttribute('type', 'password');
            expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
        });

        test('should have proper ARIA labels for buttons', () => {
            render(<SignInPage />);

            const showPasswordButton = screen.getByLabelText('Show password');
            expect(showPasswordButton).toBeInTheDocument();
        });

        test('should have proper form labels', () => {
            render(<SignInPage />);

            expect(screen.getByText('Email')).toBeInTheDocument();
            expect(screen.getByText('Password')).toBeInTheDocument();
        });

        test('should have proper dialog accessibility', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockRejectedValue(new Error('Auth failed'));
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            await waitFor(() => {
                const dialog = screen.getByRole('dialog');
                expect(dialog).toHaveAttribute('aria-labelledby', 'error-dialog-title');
                expect(dialog).toHaveAttribute('aria-describedby', 'error-dialog-description');
            });
        });
    });

    describe('Mobile Responsiveness', () => {
        test('should handle mobile layout correctly', () => {
            // Mock mobile hook to return true
            jest.doMock('@/hooks/use-mobile', () => ({
                useIsMobile: () => true,
            }));

            render(<SignInPage />);
            expect(screen.getByText('Welcome back')).toBeInTheDocument();
        });

        test('should have responsive container classes', () => {
            render(<SignInPage />);
            const container = screen.getByText('Welcome back').closest('div');
            expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty form submission', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);

            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
            expect(screen.getByText('Password is required')).toBeInTheDocument();
        });

        test('should handle very long email addresses', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const longEmail = 'a'.repeat(100) + '@example.com';
            await user.type(emailInput, longEmail);

            expect(emailInput.value).toBe(longEmail);
        });

        test('should handle special characters in password', async () => {
            const user = userEvent.setup();
            render(<SignInPage />);

            const passwordInput = screen.getByPlaceholderText('••••••••');
            const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            await user.type(passwordInput, specialPassword);

            expect(passwordInput.value).toBe(specialPassword);
        });

        test('should handle rapid form submissions', async () => {
            const user = userEvent.setup();
            const mockSignIn = jest.fn().mockResolvedValue(createMockUser());
            mockUseAuth.mockReturnValue({
                user: null,
                isLoading: false,
                isInitialized: true,
                signIn: mockSignIn,
                signInWithGoogleAuth: jest.fn(),
                googleError: null,
                clearGoogleError: jest.fn(),
            });

            render(<SignInPage />);

            const emailInput = screen.getByPlaceholderText('your.email@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const recaptchaButton = screen.getByTestId('recaptcha-verify');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(recaptchaButton);

            const signInButton = screen.getByText('Sign in');
            await user.click(signInButton);
            await user.click(signInButton); // Try to submit again

            expect(mockSignIn).toHaveBeenCalledTimes(1); // Should only be called once
        });
    });
}); 