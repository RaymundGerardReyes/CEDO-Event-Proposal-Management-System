import {
    decodeJwtResponse,
    initializeGoogleGIS,
    loadGoogleGIS,
    renderGoogleSignInButton,
    signInWithGooglePrompt,
} from '../src/lib/google-auth'; // Adjust path to your google-auth.js file

// --- Mocks and Setup ---
const MOCK_CLIENT_ID = 'test-google-client-id';
const MOCK_TOKEN = 'mock-jwt-token';
const MOCK_CREDENTIAL_PAYLOAD = {
    name: 'Test User',
    email: 'test@example.com',
    sub: '123456789',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
};

// Helper to create a valid JWT structure for decodeJwtResponse testing
const createMockJwt = (payload) => {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const newPayload = btoa(JSON.stringify(payload));
    const signature = 'mockSignature'; // Signature isn't validated client-side by decode
    return `${header}.${newPayload}.${signature}`;
};


let mockGoogleAccountsId;
let scriptLoadSuccess = true; // Control script loading outcome for tests
let scriptEl = null; // Hold the script element for simulation

const originalEnv = process.env;

// This function allows simulating the script's onload or onerror
function simulateScriptLoad(success = true) {
    if (scriptEl) {
        if (success) {
            // @ts-ignore
            window.google = {
                accounts: {
                    id: mockGoogleAccountsId,
                },
            };
            // @ts-ignore
            if (scriptEl.onload) scriptEl.onload();
        } else {
            // @ts-ignore
            if (scriptEl.onerror) scriptEl.onerror(new Error('Script loading failed'));
        }
    }
}

describe('Google Auth Library (google-auth.js)', () => {
    beforeEach(() => {
        jest.resetModules(); // Clears module cache, including module-level promises in google-auth.js
        // @ts-ignore
        delete window.google; // Ensure google is not defined from previous tests
        document.head.innerHTML = ''; // Clear scripts from head
        document.body.innerHTML = ''; // Clear elements from body
        scriptEl = null;

        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_GOOGLE_CLIENT_ID: MOCK_CLIENT_ID,
        };

        mockGoogleAccountsId = {
            initialize: jest.fn(),
            prompt: jest.fn(),
            renderButton: jest.fn(),
        };

        // Spy on console methods
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock document.createElement to capture the script element
        const originalCreateElement = document.createElement;
        jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
            const element = originalCreateElement.call(document, tagName);
            if (tagName === 'script' && element.src.includes('accounts.google.com/gsi/client')) {
                scriptEl = element; // Capture the script element
                // Prevent actual network request by not appending to head here;
                // simulateScriptLoad will trigger onload/onerror.
                // We'll manually call appendChild if we want to test that part.
            }
            return element;
        });
        // Mock appendChild to prevent actual script addition in some controlled tests
        // but allow it if needed for specific scenarios.
        jest.spyOn(document.head, 'appendChild').mockImplementation((node) => {
            if (node === scriptEl) {
                // console.log("Mock appendChild called for GSI script");
            }
            return node;
        });


    });

    afterEach(() => {
        jest.restoreAllMocks();
        process.env = originalEnv;
    });

    // --- loadGoogleGIS Tests ---
    describe('loadGoogleGIS', () => {
        test('LGG_001: Successfully loads the Google GIS script', async () => {
            const promise = loadGoogleGIS();
            expect(document.createElement).toHaveBeenCalledWith('script');
            // @ts-ignore
            expect(document.head.appendChild).toHaveBeenCalledWith(scriptEl);

            simulateScriptLoad(true); // Simulate successful load
            await expect(promise).resolves.toBeUndefined();
            // @ts-ignore
            expect(window.google.accounts.id).toBeDefined();
        });

        test('LGG_002: Handles script loading error', async () => {
            const promise = loadGoogleGIS();
            simulateScriptLoad(false); // Simulate failed load
            await expect(promise).rejects.toThrow('Failed to load Google GSI script.');
            // @ts-ignore
            expect(scriptEl.parentNode).toBeNull(); // Check if script tag was removed
        });

        test('LGG_003: Is idempotent (loads script only once on concurrent calls)', async () => {
            const promise1 = loadGoogleGIS();
            const promise2 = loadGoogleGIS(); // Call again before first resolves

            expect(document.createElement).toHaveBeenCalledTimes(1); // Script created once
            // @ts-ignore
            expect(document.head.appendChild).toHaveBeenCalledTimes(1);


            simulateScriptLoad(true);
            await expect(promise1).resolves.toBeUndefined();
            await expect(promise2).resolves.toBeUndefined(); // Should resolve with the same outcome
        });

        test('LGG_004: Resolves if script is already loaded (window.google.accounts.id exists)', async () => {
            // @ts-ignore
            window.google = { accounts: { id: mockGoogleAccountsId } };
            await expect(loadGoogleGIS()).resolves.toBeUndefined();
            expect(document.createElement).not.toHaveBeenCalledWith('script');
        });

        test('LGG_005: Rejects if script loads but window.google.accounts.id is not found', async () => {
            const promise = loadGoogleGIS();
            // @ts-ignore
            if (scriptEl && scriptEl.onload) { // Ensure scriptEl is captured and onload is set
                // @ts-ignore
                window.google = { accounts: {} }; // Simulate incomplete google object
                // @ts-ignore
                scriptEl.onload();
            } else {
                throw new Error("Script element or onload not set up for test LGG_005");
            }
            await expect(promise).rejects.toThrow('Google GSI script loaded but not correctly initialized by Google.');
        });
    });

    // --- initializeGoogleGIS Tests ---
    describe('initializeGoogleGIS', () => {
        test('IGG_001: Successfully initializes after script load', async () => {
            const initPromise = initializeGoogleGIS(); // This will call loadGoogleGIS internally
            simulateScriptLoad(true); // loadGoogleGIS resolves
            await expect(initPromise).resolves.toBeUndefined();
            expect(mockGoogleAccountsId.initialize).toHaveBeenCalledWith({
                client_id: MOCK_CLIENT_ID,
                callback: expect.any(Function), // handleCredentialResponse
                auto_select: false,
                cancel_on_tap_outside: true,
            });
        });

        test('IGG_002: Rejects if GOOGLE_CLIENT_ID is not configured', async () => {
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = ''; // Unset client ID
            // Reset modules to re-evaluate GOOGLE_CLIENT_ID at the top of google-auth.js
            jest.resetModules();
            const { initializeGoogleGIS: initFn } = require('../src/lib/google-auth');

            const initPromise = initFn();
            simulateScriptLoad(true); // loadGoogleGIS can resolve

            await expect(initPromise).rejects.toThrow('Google Client ID is not configured.');
            expect(mockGoogleAccountsId.initialize).not.toHaveBeenCalled();
        });

        test('IGG_003: Rejects if loadGoogleGIS fails', async () => {
            const initPromise = initializeGoogleGIS();
            simulateScriptLoad(false); // loadGoogleGIS rejects
            await expect(initPromise).rejects.toThrow('Failed to load Google GSI script.');
        });

        test('IGG_004: Handles errors from window.google.accounts.id.initialize', async () => {
            // @ts-ignore
            mockGoogleAccountsId.initialize.mockImplementation(() => {
                throw new Error('GIS init failed');
            });
            const initPromise = initializeGoogleGIS();
            simulateScriptLoad(true);
            await expect(initPromise).rejects.toThrow('GIS init failed');
        });
    });

    // --- handleCredentialResponse (tested indirectly) ---
    // These tests simulate Google calling the global handleCredentialResponse
    // by directly invoking it after setting up a promise via renderButton or prompt.

    describe('handleCredentialResponse (via signInWithGooglePrompt/renderGoogleSignInButton)', () => {
        let HCR_Module; // To import the module with its internal state

        beforeEach(async () => {
            HCR_Module = require('../src/lib/google-auth'); // Get a fresh instance for internal state
            // Ensure script is loaded and GIS initialized for these tests
            const initPromise = HCR_Module.initializeGoogleGIS();
            simulateScriptLoad(true);
            await initPromise; // Ensure this completes before tests relying on initialization
        });

        test('HCR_001: Resolves current sign-in promise with token on success', async () => {
            const signInPromise = HCR_Module.signInWithGooglePrompt(); // Sets up currentSignInPromiseActions
            // @ts-ignore
            global.handleCredentialResponse({ credential: MOCK_TOKEN }); // Simulate Google's call
            await expect(signInPromise).resolves.toEqual({ token: MOCK_TOKEN });
        });

        test('HCR_002: Rejects current sign-in promise on error response', async () => {
            const signInPromise = HCR_Module.signInWithGooglePrompt();
            // @ts-ignore
            global.handleCredentialResponse({ error: 'popup_closed_by_user', error_description: 'User closed popup' });
            await expect(signInPromise).rejects.toThrow('User closed popup');
        });

        test('HCR_003: Rejects if no credential and no detailed error in response', async () => {
            const signInPromise = HCR_Module.signInWithGooglePrompt();
            // @ts-ignore
            global.handleCredentialResponse({}); // Empty response
            await expect(signInPromise).rejects.toThrow('Google authentication failed: No credential in response and no error object.');
        });
    });

    // --- signInWithGooglePrompt Tests ---
    describe('signInWithGooglePrompt', () => {
        beforeEach(async () => {
            // Ensure script is loaded and GIS initialized for these tests for simplicity
            // Individual tests can override this if they need to test init failures
            const initPromise = initializeGoogleGIS();
            simulateScriptLoad(true);
            await initPromise;
        });

        test('SGP_001: Successfully initiates prompt and resolves on credential', async () => {
            // @ts-ignore
            mockGoogleAccountsId.prompt.mockImplementation((callback) => {
                // Simulate prompt display and then user selects account
                // @ts-ignore
                setTimeout(() => global.handleCredentialResponse({ credential: MOCK_TOKEN }), 0);
            });
            await expect(signInWithGooglePrompt()).resolves.toEqual({ token: MOCK_TOKEN });
            expect(mockGoogleAccountsId.prompt).toHaveBeenCalled();
        });

        test('SGP_002: Rejects if prompt is not displayed', async () => {
            // @ts-ignore
            mockGoogleAccountsId.prompt.mockImplementation((notificationCallback) => {
                notificationCallback({
                    isNotDisplayed: () => true,
                    getNotDisplayedReason: () => 'browser_not_supported',
                });
            });
            await expect(signInWithGooglePrompt()).rejects.toThrow('Google prompt not displayed: browser_not_supported.');
        });

        test('SGP_003: Rejects if prompt is dismissed by user', async () => {
            // @ts-ignore
            mockGoogleAccountsId.prompt.mockImplementation((notificationCallback) => {
                notificationCallback({
                    isDismissedMoment: () => true,
                    getDismissedReason: () => 'credential_returned', // Or 'user_cancel' etc.
                    isNotDisplayed: () => false,
                    isSkippedMoment: () => false,
                });
            });
            await expect(signInWithGooglePrompt()).rejects.toThrow('Google prompt dismissed by user: credential_returned.');
        });
    });

    // --- renderGoogleSignInButton Tests ---
    describe('renderGoogleSignInButton', () => {
        let buttonDiv;
        beforeEach(async () => {
            buttonDiv = document.createElement('div');
            buttonDiv.id = 'google-signin-button-test-container';
            document.body.appendChild(buttonDiv);

            // Ensure script is loaded and GIS initialized
            const initPromise = initializeGoogleGIS();
            simulateScriptLoad(true);
            await initPromise;
        });

        test('RGB_001: Renders button and resolves on credential', async () => {
            // @ts-ignore
            mockGoogleAccountsId.renderButton.mockImplementation(() => {
                // Simulate button render and then user clicks and selects account
                // @ts-ignore
                setTimeout(() => global.handleCredentialResponse({ credential: MOCK_TOKEN }), 0);
            });
            await expect(renderGoogleSignInButton(buttonDiv.id)).resolves.toEqual({ token: MOCK_TOKEN });
            expect(mockGoogleAccountsId.renderButton).toHaveBeenCalledWith(buttonDiv, expect.objectContaining({ theme: 'outline' }));
        });

        test('RGB_002: Rejects if HTML element for button not found', async () => {
            await expect(renderGoogleSignInButton('nonexistent-id')).rejects.toThrow("HTML element 'nonexistent-id' not found for Google Sign-In button.");
        });
    });

    // --- decodeJwtResponse Tests ---
    describe('decodeJwtResponse', () => {
        test('DJR_001: Successfully decodes a valid JWT', () => {
            const mockJwt = createMockJwt(MOCK_CREDENTIAL_PAYLOAD);
            const decoded = decodeJwtResponse(mockJwt);
            expect(decoded).not.toBeNull();
            expect(decoded?.email).toBe(MOCK_CREDENTIAL_PAYLOAD.email);
            expect(decoded?.name).toBe(MOCK_CREDENTIAL_PAYLOAD.name);
        });

        test('DJR_002: Returns null for an invalid JWT (wrong number of parts)', () => {
            expect(decodeJwtResponse('invalid.token')).toBeNull();
            expect(console.error).toHaveBeenCalledWith("Error decoding JWT:", expect.any(Error));
        });

        test('DJR_003: Returns null for non-string or empty token', () => {
            // @ts-ignore
            expect(decodeJwtResponse(null)).toBeNull();
            expect(decodeJwtResponse('')).toBeNull();
            // @ts-ignore
            expect(decodeJwtResponse(123)).toBeNull();
            expect(console.error).toHaveBeenCalledWith("Invalid token provided for decoding.");
        });
    });
});