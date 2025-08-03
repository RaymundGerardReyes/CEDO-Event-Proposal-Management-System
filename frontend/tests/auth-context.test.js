import { _resetInternalApiInstanceForTests, AuthProvider, ROLES, useAuth } from '@/contexts/auth-context';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios;

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: mockBack,
    }),
    usePathname: () => '/test-path',
    useSearchParams: () => new URLSearchParams('?redirect=/dashboard'),
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
    process.env = {
        ...originalEnv,
        API_URL: 'http://localhost:5000/api',
        SESSION_TIMEOUT_MINUTES: '30',
        GOOGLE_CLIENT_ID: 'test-google-client-id',
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
    role: ROLES.STUDENT,
    organization: 'Test Org',
    dashboard: '/student-dashboard',
    ...overrides,
});

// Helper to wrap a callback in a test component for valid hook usage
function WithAuth({ callback }) {
    const auth = useAuth();
    callback && callback(auth);
    return null;
}

// Test component to access auth context
function TestComponent() {
    const auth = useAuth();
    return (
        <div>
            <div data-testid="user">{JSON.stringify(auth.user)}</div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="initialized">{auth.isInitialized.toString()}</div>
            <button onClick={() => auth.signIn('test@example.com', 'password')} data-testid="signin">
                Sign In
            </button>
            <button onClick={() => auth.signOut()} data-testid="signout">
                Sign Out
            </button>
            <button onClick={() => auth.clearAuthCache()} data-testid="clear-cache">
                Clear Cache
            </button>
        </div>
    );
}


describe('AuthContext', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });
    beforeEach(() => {
        _resetInternalApiInstanceForTests && _resetInternalApiInstanceForTests();
        jest.clearAllTimers && jest.clearAllTimers();
        mockAxios.create.mockReturnValue({
            post: jest.fn(),
            get: jest.fn(),
            put: jest.fn(),
            defaults: {
                headers: {
                    common: {},
                },
            },
        });
    });
    afterEach(() => {
        _resetInternalApiInstanceForTests && _resetInternalApiInstanceForTests();
        jest.clearAllTimers && jest.clearAllTimers();
    });

    describe('Initial State and Setup', () => {
        test('should provide initial auth state', async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
            // Wait for initial render, then check initial state before any async effect
            expect(screen.getByTestId('user')).toHaveTextContent('null');
            expect(screen.getByTestId('loading')).toHaveTextContent('true');
            expect(screen.getByTestId('initialized')).toHaveTextContent('false');
        });

        test('should initialize with correct ROLES constants', () => {
            expect(ROLES.HEAD_ADMIN).toBe('head_admin');
            expect(ROLES.MANAGER).toBe('manager');
            expect(ROLES.STUDENT).toBe('student');
            expect(ROLES.PARTNER).toBe('partner');
            expect(ROLES.REVIEWER).toBe('reviewer');
        });

        test('should create axios instance with correct base URL', async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
            // Wait for effect to trigger axios creation
            await waitFor(() => {
                expect(mockAxios.create).toHaveBeenCalledWith({
                    baseURL: 'http://localhost:5000/api',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });
            });
        });

        test('should handle missing environment variables gracefully', async () => {
            delete process.env.API_URL;
            delete process.env.SESSION_TIMEOUT_MINUTES;

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
            await waitFor(() => {
                expect(mockAxios.create).toHaveBeenCalledWith({
                    baseURL: 'http://localhost:5000/api',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });
            });
        });
    });

    describe('User Verification', () => {
        test('should verify user with valid token from cookie', async () => {
            const mockUser = createMockUser();
            const mockToken = 'valid-jwt-token';

            // Set up cookie
            document.cookie = `cedo_token=${mockToken}`;
            localStorage.setItem('cedo_user', JSON.stringify(mockUser));

            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });

        test('should verify user with valid token from localStorage', async () => {
            const mockUser = createMockUser();
            const mockToken = 'valid-jwt-token';

            localStorage.setItem('cedo_token', mockToken);
            localStorage.setItem('cedo_user', JSON.stringify(mockUser));

            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });

        test('should handle missing token gracefully', async () => {
            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('null');
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });

        test('should handle invalid token gracefully', async () => {
            const mockToken = 'invalid-token';
            document.cookie = `cedo_token=${mockToken}`;

            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn().mockRejectedValue(new Error('Invalid token')),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('null');
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });

        test('should fetch fresh user data when localStorage is empty', async () => {
            const mockToken = 'valid-token';
            const mockUser = createMockUser();
            document.cookie = `cedo_token=${mockToken}`;

            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me');
            });
        });
    });


    describe('Sign In Functionality', () => {
        test('should sign in user with valid credentials', async () => {
            const mockUser = createMockUser();
            const mockToken = 'valid-token';
            const mockAxiosInstance = {
                post: jest.fn().mockResolvedValue({
                    data: { token: mockToken, user: mockUser },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
            fireEvent.click(screen.getByTestId('signin'));
            await waitFor(() => {
                expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
                    email: 'test@example.com',
                    password: 'password',
                });
            });
        });

        test('should handle sign in with captcha token', async () => {
            const mockUser = createMockUser();
            const mockToken = 'valid-token';
            const mockAxiosInstance = {
                post: jest.fn().mockResolvedValue({
                    data: { token: mockToken, user: mockUser },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            let authRef;
            render(
                <AuthProvider>
                    <WithAuth callback={a => (authRef = a)} />
                </AuthProvider>
            );
            await waitFor(() => {
                expect(authRef).toBeDefined();
            });
            await authRef.signIn('test@example.com', 'password', false, 'captcha-token');
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password',
                captchaToken: 'captcha-token',
            });
        });

        test('should handle sign in errors gracefully', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue({
                    response: {
                        status: 401,
                        data: { message: 'Invalid credentials' },
                    },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            let authRef;
            render(
                <AuthProvider>
                    <WithAuth callback={a => (authRef = a)} />
                </AuthProvider>
            );
            await waitFor(() => expect(authRef).toBeDefined());
            await expect(authRef.signIn('test@example.com', 'password')).rejects.toThrow('An unexpected error occurred. Please try again.');
        });

        test('should handle pending approval error', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue({
                    response: {
                        status: 403,
                        data: { reason: 'USER_NOT_APPROVED' },
                    },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            let authRef;
            render(
                <AuthProvider>
                    <WithAuth callback={a => (authRef = a)} />
                </AuthProvider>
            );
            await waitFor(() => expect(authRef).toBeDefined());
            await expect(authRef.signIn('test@example.com', 'password')).rejects.toThrow('An unexpected error occurred. Please try again.');
        });
    });

    describe('Sign Out Functionality', () => {
        test('should sign out user successfully', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockResolvedValue({}),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });

            const signOutButton = screen.getByTestId('signout');
            fireEvent.click(signOutButton);

            await waitFor(() => {
                expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
            });
        });

        test('should clear localStorage and cookies on sign out', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockResolvedValue({}),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            // Set up initial state
            localStorage.setItem('cedo_user', JSON.stringify(createMockUser()));
            document.cookie = 'cedo_token=test-token';

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });

            const signOutButton = screen.getByTestId('signout');
            fireEvent.click(signOutButton);

            await waitFor(() => {
                expect(localStorage.getItem('cedo_user')).toBeNull();
                expect(document.cookie).not.toContain('cedo_token');
            });
        });

        test('should handle sign out errors gracefully', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue(new Error('Network error')),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });

            const signOutButton = screen.getByTestId('signout');
            fireEvent.click(signOutButton);

            await waitFor(() => {
                expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
            });
        });
    });


    describe('Google Sign In', () => {
        beforeEach(() => {
            // Mock Google Identity Services
            global.google = {
                accounts: {
                    id: {
                        initialize: jest.fn(),
                        renderButton: jest.fn(),
                        cancel: jest.fn(),
                    },
                },
            };
        });

        test('should initialize Google Sign In', async () => {
            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            let authRef;
            // Attach the element to the DOM so document.body.contains works
            const mockElement = document.createElement('div');
            mockElement.id = 'google-signin-button';
            document.body.appendChild(mockElement);
            render(
                <AuthProvider>
                    <WithAuth callback={a => (authRef = a)} />
                </AuthProvider>
            );
            await waitFor(() => {
                expect(authRef).toBeDefined();
            });
            await authRef.signInWithGoogleAuth(mockElement);
            expect(global.google.accounts.id.initialize).toHaveBeenCalledWith({
                client_id: 'test-google-client-id',
                callback: expect.any(Function),
                cancel_on_tap_outside: true,
                context: 'signin',
            });
            document.body.removeChild(mockElement);
        });

        test('should handle Google Sign In success', async () => {
            const mockUser = createMockUser();
            const mockToken = 'google-token';
            const mockAxiosInstance = {
                post: jest.fn().mockResolvedValue({
                    data: { token: mockToken, user: mockUser },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            let authRef;
            const mockElement = document.createElement('div');
            mockElement.id = 'google-signin-button';
            document.body.appendChild(mockElement);
            render(
                <AuthProvider>
                    <WithAuth callback={a => (authRef = a)} />
                </AuthProvider>
            );
            await waitFor(() => {
                expect(authRef).toBeDefined();
            });
            await authRef.signInWithGoogleAuth(mockElement);
            // Simulate Google credential response
            const callback = global.google.accounts.id.initialize.mock.calls[0][0].callback;
            await callback({ credential: 'google-credential-token' });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/google', {
                token: 'google-credential-token',
            });
            document.body.removeChild(mockElement);
        });

        test('should handle Google Sign In errors', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue(new Error('Google auth failed')),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            let authRef;
            const mockElement = document.createElement('div');
            mockElement.id = 'google-signin-button';
            document.body.appendChild(mockElement);
            render(
                <AuthProvider>
                    <WithAuth callback={a => (authRef = a)} />
                </AuthProvider>
            );
            await waitFor(() => {
                expect(authRef).toBeDefined();
            });
            await authRef.signInWithGoogleAuth(mockElement);
            // Simulate Google credential response with error
            const callback = global.google.accounts.id.initialize.mock.calls[0][0].callback;
            await callback({ error: 'access_denied' });
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
            document.body.removeChild(mockElement);
        });
    });

    describe('User Management Functions', () => {
        // Helper to get auth context with user set before admin actions
        async function getAuthRefWithUser(user) {
            let authRef;
            render(
                <AuthProvider>
                    <WithAuth callback={a => { authRef = a; }} />
                </AuthProvider>
            );
            await waitFor(() => expect(authRef).toBeDefined());
            if (authRef && typeof authRef.setUser === 'function') {
                authRef.setUser(user);
                await waitFor(() => expect(authRef.user).toEqual(user));
            } else {
                authRef.user = user;
            }
            return authRef;
        }

        test('should fetch all users for admin', async () => {
            const mockAdminUser = createMockUser({ role: ROLES.HEAD_ADMIN });
            const mockUsers = [createMockUser(), createMockUser({ id: 2 })];
            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn().mockResolvedValue({ data: { users: mockUsers } }),
                put: jest.fn(),
                defaults: { headers: { common: {} } },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            const authRef = await getAuthRefWithUser(mockAdminUser);
            const result = await authRef.fetchAllUsers();
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users');
            expect(result).toEqual({ users: mockUsers });
        });

        test('should deny access to fetch users for non-admin', async () => {
            const mockUser = createMockUser({ role: ROLES.STUDENT });

            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            let authRef;
            render(
                <AuthProvider>
                    <WithAuth callback={a => { a.user = mockUser; authRef = a; }} />
                </AuthProvider>
            );
            await waitFor(() => expect(authRef).toBeDefined());

            await expect(authRef.fetchAllUsers()).rejects.toThrow('Unauthorized to fetch users.');
        });

        test('should update user approval status', async () => {
            const mockAdminUser = createMockUser({ role: ROLES.HEAD_ADMIN });
            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn().mockResolvedValue({ data: { message: 'Updated' } }),
                defaults: { headers: { common: {} } },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            const authRef = await getAuthRefWithUser(mockAdminUser);
            await authRef.updateUserApproval(1, true);
            expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/1/approval', {
                is_approved: true,
            });
        });
    });

    describe('Cache Management', () => {
        test('should clear auth cache successfully', async () => {
            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            // Set up initial state
            localStorage.setItem('cedo_user', JSON.stringify(createMockUser()));
            document.cookie = 'cedo_token=test-token';

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });

            const clearCacheButton = screen.getByTestId('clear-cache');
            fireEvent.click(clearCacheButton);

            await waitFor(() => {
                expect(localStorage.getItem('cedo_user')).toBeNull();
                expect(document.cookie).not.toContain('cedo_token');
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors gracefully', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue(new Error('Network error')),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });

        test('should handle 401 errors appropriately', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue({
                    response: {
                        status: 401,
                        data: { message: 'Unauthorized' },
                    },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });

        test('should handle 403 errors appropriately', async () => {
            const mockAxiosInstance = {
                post: jest.fn().mockRejectedValue({
                    response: {
                        status: 403,
                        data: { message: 'Forbidden' },
                    },
                }),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('initialized')).toHaveTextContent('true');
            });
        });
    });

    describe('Session Management', () => {
        test('should set session timeout correctly', async () => {
            jest.useFakeTimers();
            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: { headers: { common: {} } },
            };
            mockAxios.create.mockReturnValue(mockAxiosInstance);
            // Set a user in localStorage so session timer is active
            localStorage.setItem('cedo_user', JSON.stringify(createMockUser()));
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
            await waitFor(() => expect(screen.getByTestId('initialized')).toHaveTextContent('true'));
            // Simulate user activity
            fireEvent.mouseMove(document);
            fireEvent.keyPress(document);
            jest.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
            // Wait for logout to be called
            await waitFor(() => {
                expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
            });
        });

        test('should reset session timeout on user activity', () => {
            jest.useFakeTimers();

            const mockAxiosInstance = {
                post: jest.fn(),
                get: jest.fn(),
                put: jest.fn(),
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            };

            mockAxios.create.mockReturnValue(mockAxiosInstance);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Simulate user activity
            fireEvent.mouseMove(document);
            fireEvent.keyPress(document);

            // Advance time but not enough to trigger timeout
            jest.advanceTimersByTime(15 * 60 * 1000); // 15 minutes

            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
    });

    describe('Context Provider', () => {
        test('should provide all required context values', () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(screen.getByTestId('user')).toBeInTheDocument();
            expect(screen.getByTestId('loading')).toBeInTheDocument();
            expect(screen.getByTestId('initialized')).toBeInTheDocument();
        });

        test('should throw error when useAuth is used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                render(<TestComponent />);
            }).toThrow('useAuth must be used within an AuthProvider');

            consoleSpy.mockRestore();
        });
    });
}); 