import axios from 'axios';
import {
    authApi,
    complianceApi,
    proposalsApi,
    reportsApi,
    reviewsApi,
} from '../src/lib/api'; // Adjust path to your api.js file

// --- Mocks ---
jest.mock('axios', () => {
    const mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
        defaults: { headers: { common: {} } } // Mock defaults if accessed
    };
    return {
        create: jest.fn(() => mockAxiosInstance), // mock axios.create to return our mock instance
    };
});

// Mock localStorage
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location for redirect tests
const originalWindowLocation = window.location;
beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { href: '', pathname: '/' };
});
afterAll(() => {
    window.location = originalWindowLocation;
});


const mockApiInstance = axios.create(); // This will now be our mocked instance
const originalEnv = process.env;

describe('API Service (api.js)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();
        window.location.href = '';
        window.location.pathname = '/some-page'; // Default pathname for tests
        process.env = { ...originalEnv, NEXT_PUBLIC_API_URL: 'http://test-api.com/api' };

        // Simulate interceptor setup
        // The actual api.js file calls use() on import. We need to capture those.
        // If api.js is imported, its top-level code runs, including interceptor setup.
        // We need to get the callbacks passed to `use`.
        // This is a bit tricky as they are set up when the module initializes.
        // For simplicity in this example, we'll test functions and assume interceptors are applied by axios.
        // A more advanced setup might involve re-importing the module or directly testing the interceptor functions.
    });
    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Axios Instance Configuration', () => {
        test('AIC_001: Creates axios instance with default API_URL', () => {
            // We need to re-import or re-run the module logic to test create with different env
            jest.resetModules();
            process.env.NEXT_PUBLIC_API_URL = ''; // Force fallback
            require('./api'); // Re-run the module to call axios.create
            expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
                baseURL: "http://localhost:5000/api",
            }));
        });

        test('AIC_002: Creates axios instance with process.env.NEXT_PUBLIC_API_URL', () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.com/v1';
            require('./api');
            expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
                baseURL: "https://custom-api.com/v1",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }));
        });
    });

    // To directly test interceptors, you'd need access to the callbacks registered.
    // The mock for axios.create() should capture the instance, and then you can
    // capture the arguments to instance.interceptors.request.use and response.use.
    // For now, we'll test the *effects* of interceptors through the API calls.

    describe('Request Interceptor', () => {
        test('REQINT_001: Adds Authorization header if token exists in localStorage', async () => {
            mockLocalStorage.setItem('cedo_token', 'test-jwt-token');
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: { profile: 'user' } });

            await authApi.getProfile(); // Make any call that uses the instance

            // Check the config passed to the actual axios method (get, post, etc.)
            // This requires our api.js to use the *exact* instance we're testing.
            // The current mock structure: axios.create() returns mockApiInstance.
            // The api.js creates its own instance. For this test to work as intended,
            // we'd need to ensure api.js uses the `mockApiInstance` or spy on `axios.create`
            // and then spy on the `get` method of the *returned* instance from the *actual* module.

            // Simpler approach: If the interceptors are set on the 'mockApiInstance' directly
            // during the mock setup, we can test. But api.js does its own `axios.create`.
            // Let's assume the interceptors were correctly registered.
            // The first argument to `mockApiInstance.get` (or post, etc.) is the URL,
            // the second is data (for post/put), and the third is config.
            // We need to ensure our `authApi.getProfile()` call uses an instance whose
            // interceptors are being tested.

            // This test will implicitly verify it if `mockApiInstance.get` shows the header.
            // However, this depends on `authApi.getProfile` using the `api` instance from `api.js`,
            // which internally should have had its `mockApiInstance.get` called.
            expect(mockApiInstance.get).toHaveBeenCalledWith(
                "/auth/me",
                // Axios combines default config with call-specific config.
                // The request interceptor modifies the config object *before* it hits the adapter.
                // So, the config object received by the mock `get` should have the Authorization header.
                // The exact shape of the config arg depends on if it's a GET/POST etc.
                // For GET, the second arg is config.
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
                })
            );
        });

        test('REQINT_002: Does NOT add Authorization header if token does not exist', async () => {
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: { profile: 'user' } });
            await authApi.getProfile();
            // @ts-ignore
            const calledConfig = mockApiInstance.get.mock.calls[0][1]; // Config for GET
            expect(calledConfig.headers.Authorization).toBeUndefined();
        });
    });

    describe('Response Interceptor (401 Error Handling)', () => {
        test('RESINT_001: Clears localStorage and redirects on 401 if not on /sign-in', async () => {
            const error = { response: { status: 401, data: { message: 'Unauthorized' } } };
            // @ts-ignore
            mockApiInstance.get.mockRejectedValue(error);
            window.location.pathname = '/dashboard'; // Not on sign-in

            await expect(authApi.getProfile()).rejects.toEqual(error); // Error should still be propagated

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cedo_token');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cedo_user');
            expect(window.location.href).toBe('/sign-in');
        });

        test('RESINT_002: Clears localStorage but does NOT redirect on 401 if already on /sign-in', async () => {
            const error = { response: { status: 401 } };
            // @ts-ignore
            mockApiInstance.get.mockRejectedValue(error);
            window.location.pathname = '/sign-in'; // Already on sign-in

            await expect(authApi.getProfile()).rejects.toEqual(error);
            expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2); // For token and user
            expect(window.location.href).toBe(''); // Should not have changed
        });

        test('RESINT_003: Does not trigger 401 logic for other error statuses', async () => {
            const error = { response: { status: 500, data: { message: 'Server Error' } } };
            // @ts-ignore
            mockApiInstance.get.mockRejectedValue(error);

            await expect(authApi.getProfile()).rejects.toEqual(error);
            expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
            expect(window.location.href).toBe('');
        });
    });


    // --- authApi Tests ---
    describe('authApi', () => {
        test('AUTH_LOGIN_001: login calls POST /auth/login and returns data', async () => {
            const loginData = { token: 'user-token', user: { id: 1, name: 'Test' } };
            // @ts-ignore
            mockApiInstance.post.mockResolvedValue({ data: loginData });
            const result = await authApi.login('test@example.com', 'password');
            expect(mockApiInstance.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password' });
            expect(result).toEqual(loginData);
        });

        test('AUTH_VERIFYOTP_001: verifyOtp calls POST /auth/verify-otp, sets token, returns data', async () => {
            const otpResponse = { success: true, token: 'new-user-token', user: { id: 1 } };
            // @ts-ignore
            mockApiInstance.post.mockResolvedValue({ data: otpResponse });
            const result = await authApi.verifyOtp('test@example.com', '123456');
            expect(mockApiInstance.post).toHaveBeenCalledWith('/auth/verify-otp', { email: 'test@example.com', otp: '123456' });
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cedo_token', 'new-user-token');
            expect(result).toEqual(otpResponse);
        });

        test('AUTH_GETPROFILE_001: getProfile calls GET /auth/me', async () => {
            const profileData = { user: { id: 1, name: 'Test User' } };
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: profileData });
            const result = await authApi.getProfile();
            expect(mockApiInstance.get).toHaveBeenCalledWith("/auth/me", expect.anything()); // expect.anything for config
            expect(result).toEqual(profileData);
        });
    });

    // --- proposalsApi Tests ---
    describe('proposalsApi', () => {
        test('PROP_GETALL_001: getAll calls GET /proposals with filters', async () => {
            const mockProposals = [{ id: 1, title: 'Proposal 1' }];
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: mockProposals });
            const filters = { status: 'pending', category: 'tech' };
            const result = await proposalsApi.getAll(filters);
            // URLSearchParams can order differently, check for parts
            const expectedUrlPattern = /\/proposals\?status=pending&category=tech|\/proposals\?category=tech&status=pending/;
            expect(mockApiInstance.get.mock.calls[0][0]).toMatch(expectedUrlPattern);
            expect(result).toEqual(mockProposals);
        });

        test('PROP_CREATE_001: create calls POST /proposals with data', async () => {
            const proposalData = { title: 'New Proposal', description: '...' };
            const createdProposal = { id: 2, ...proposalData };
            // @ts-ignore
            mockApiInstance.post.mockResolvedValue({ data: createdProposal });
            const result = await proposalsApi.create(proposalData);
            expect(mockApiInstance.post).toHaveBeenCalledWith('/proposals', proposalData, undefined); // POST data is second arg
            expect(result).toEqual(createdProposal);
        });

        test('PROP_ADDDOCS_001: addDocuments calls POST with multipart/form-data header', async () => {
            const formData = new FormData();
            // @ts-ignore
            formData.append('document', new Blob(['test']), 'test.pdf');
            const responseData = { message: 'Documents added' };
            // @ts-ignore
            mockApiInstance.post.mockResolvedValue({ data: responseData });

            const result = await proposalsApi.addDocuments('proposal123', formData);
            expect(mockApiInstance.post).toHaveBeenCalledWith(
                '/proposals/proposal123/documents',
                formData,
                expect.objectContaining({
                    headers: { "Content-Type": "multipart/form-data" },
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    // --- reviewsApi Tests ---
    describe('reviewsApi', () => {
        test('REV_GETPENDING_001: getPending calls GET /reviews/pending', async () => {
            const pendingReviews = [{ id: 1, proposalId: 'p1' }];
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: pendingReviews });
            const result = await reviewsApi.getPending();
            expect(mockApiInstance.get).toHaveBeenCalledWith("/reviews/pending", expect.anything());
            expect(result).toEqual(pendingReviews);
        });
    });

    // --- complianceApi Tests ---
    describe('complianceApi', () => {
        test('COMP_GETALL_001: getAll calls GET /compliance with filters', async () => {
            const complianceData = [{ proposalId: 'p1', status: 'compliant' }];
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: complianceData });
            const result = await complianceApi.getAll({ year: '2023' });
            expect(mockApiInstance.get).toHaveBeenCalledWith("/compliance?year=2023", expect.anything());
            expect(result).toEqual(complianceData);
        });
    });

    // --- reportsApi Tests ---
    describe('reportsApi', () => {
        test('REP_GETPROPOSALS_001: getProposalsReport calls GET /reports/proposals with filters', async () => {
            const reportData = { total: 10, approved: 5 };
            // @ts-ignore
            mockApiInstance.get.mockResolvedValue({ data: reportData });
            const result = await reportsApi.getProposalsReport({ fromDate: '2023-01-01' });
            expect(mockApiInstance.get).toHaveBeenCalledWith("/reports/proposals?fromDate=2023-01-01", expect.anything());
            expect(result).toEqual(reportData);
        });
    });
});