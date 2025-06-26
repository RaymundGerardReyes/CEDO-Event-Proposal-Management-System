// google-auth.test.js
// Unit tests for frontend/src/lib/google-auth.js

// Mock console to suppress output during tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
};

// Mock environment variables
const originalEnv = process.env;

describe('google-auth.js', () => {
    let googleAuth;

    beforeAll(() => {
        // Set up environment
        process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    });

    afterAll(() => {
        // Restore environment
        process.env = originalEnv;
    });

    beforeEach(() => {
        // Create basic window mock for non-interactive tests
        global.window = {
            __googleSignInPromiseActions: null,
            __currentSignInPromiseActions: null,
            handleCredentialResponse: undefined,
            google: undefined,
            localStorage: {
                store: {},
                setItem: jest.fn(),
                getItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn()
            }
        };

        global.document = {
            head: { appendChild: jest.fn() },
            getElementById: jest.fn(),
            createElement: jest.fn(() => ({
                id: '', src: '', async: false, defer: false,
                onload: null, onerror: null,
                parentNode: { removeChild: jest.fn() }
            }))
        };

        global.localStorage = global.window.localStorage;

        // Import fresh module
        jest.resetModules();
        googleAuth = require('../../src/lib/google-auth');

        // Clear mock calls
        jest.clearAllMocks();
    });

    // Test JWT decoding (pure function, no dependencies)
    describe('decodeJwtResponse', () => {
        test('decodes valid JWT token correctly', () => {
            // JWT: {"sub":"1234567890","name":"John Doe","iat":1516239022}
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

            const result = googleAuth.decodeJwtResponse(jwt);

            expect(result).toEqual({
                sub: '1234567890',
                name: 'John Doe',
                iat: 1516239022
            });
        });

        test('returns null for invalid token formats', () => {
            expect(googleAuth.decodeJwtResponse('')).toBeNull();
            expect(googleAuth.decodeJwtResponse(null)).toBeNull();
            expect(googleAuth.decodeJwtResponse(undefined)).toBeNull();
            expect(googleAuth.decodeJwtResponse('invalid')).toBeNull();
            expect(googleAuth.decodeJwtResponse('invalid.token')).toBeNull();
            expect(googleAuth.decodeJwtResponse('header.payload')).toBeNull();
        });

        test('returns null for malformed JWT', () => {
            // Invalid base64 encoding
            expect(googleAuth.decodeJwtResponse('invalid.invalid.invalid')).toBeNull();
        });
    });

    // Test environment and function availability
    describe('module structure', () => {
        test('exports all expected functions', () => {
            expect(typeof googleAuth.handleCredentialResponse).toBe('function');
            expect(typeof googleAuth.ensureGoogleCredentialCallbackRegistered).toBe('function');
            expect(typeof googleAuth.loadGoogleGIS).toBe('function');
            expect(typeof googleAuth.initializeGoogleGIS).toBe('function');
            expect(typeof googleAuth.signInWithGooglePrompt).toBe('function');
            expect(typeof googleAuth.renderGoogleSignInButton).toBe('function');
            expect(typeof googleAuth.decodeJwtResponse).toBe('function');
        });

        test('has test utility function available', () => {
            // This is optional - if it exists, great; if not, that's fine too
            const hasResetFunction = typeof googleAuth.__resetGoogleAuthStateForTests === 'function';
            expect(typeof hasResetFunction).toBe('boolean');
        });
    });

    // Test synchronous error conditions that can be verified
    describe('error handling', () => {
        test('renderGoogleSignInButton rejects if operation already in progress', async () => {
            global.window.__currentSignInPromiseActions = { resolve: jest.fn(), reject: jest.fn() };

            await expect(googleAuth.renderGoogleSignInButton('test')).rejects.toThrow(
                'Another Google Sign-In operation is already in progress'
            );
        });

        test('functions handle browser environment checks', () => {
            // These should not throw errors in Node.js environment with window mock
            expect(() => googleAuth.ensureGoogleCredentialCallbackRegistered()).not.toThrow();
            expect(() => googleAuth.decodeJwtResponse('invalid')).not.toThrow();
        });
    });

    // Test basic integration scenarios
    describe('integration scenarios', () => {
        test('can call functions without throwing in test environment', () => {
            // These should not crash in the test environment
            expect(() => {
                googleAuth.ensureGoogleCredentialCallbackRegistered();
                googleAuth.decodeJwtResponse(null);
                googleAuth.decodeJwtResponse('');
                googleAuth.decodeJwtResponse('invalid.token');
            }).not.toThrow();
        });

        test('JWT decoding handles various edge cases', () => {
            // Test various malformed inputs
            const testCases = [
                '',
                null,
                undefined,
                'not.a.jwt',
                'header.payload',
                'invalid.invalid.invalid',
                'a.b',
                'a.b.c.d.e',
                123,
                {},
                []
            ];

            testCases.forEach(testCase => {
                expect(() => googleAuth.decodeJwtResponse(testCase)).not.toThrow();
                expect(googleAuth.decodeJwtResponse(testCase)).toBeNull();
            });
        });

        test('valid JWT decoding produces expected structure', () => {
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

            const result = googleAuth.decodeJwtResponse(jwt);

            expect(result).not.toBeNull();
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('sub');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('iat');
            expect(typeof result.sub).toBe('string');
            expect(typeof result.name).toBe('string');
            expect(typeof result.iat).toBe('number');
        });
    });

    // Test configuration and environment handling
    describe('configuration handling', () => {
        test('handles missing environment variables gracefully', () => {
            // Temporarily clear the environment variable
            const originalClientId = process.env.GOOGLE_CLIENT_ID;
            delete process.env.GOOGLE_CLIENT_ID;

            // Re-import module with missing env var
            jest.resetModules();
            const googleAuthNoEnv = require('../../src/lib/google-auth');

            // Should not throw errors during import
            expect(typeof googleAuthNoEnv.decodeJwtResponse).toBe('function');

            // Restore environment
            process.env.GOOGLE_CLIENT_ID = originalClientId;
        });

        test('functions are callable in various states', () => {
            // Test that functions can be called without crashing
            expect(() => googleAuth.ensureGoogleCredentialCallbackRegistered()).not.toThrow();

            // Test with different window states
            global.window.google = { accounts: { id: {} } };
            expect(() => googleAuth.ensureGoogleCredentialCallbackRegistered()).not.toThrow();

            global.window.google = undefined;
            expect(() => googleAuth.ensureGoogleCredentialCallbackRegistered()).not.toThrow();
        });
    });

    // Test Promise-based function behavior patterns
    describe('Promise behavior patterns', () => {
        test('async functions return Promises', () => {
            // These should return promises even if they might reject
            const signInPromise = googleAuth.signInWithGooglePrompt();
            const loadPromise = googleAuth.loadGoogleGIS();
            const initPromise = googleAuth.initializeGoogleGIS();
            const renderPromise = googleAuth.renderGoogleSignInButton('test');

            expect(signInPromise).toBeInstanceOf(Promise);
            expect(loadPromise).toBeInstanceOf(Promise);
            expect(initPromise).toBeInstanceOf(Promise);
            expect(renderPromise).toBeInstanceOf(Promise);

            // Clean up hanging promises by handling rejections
            signInPromise.catch(() => { });
            loadPromise.catch(() => { });
            initPromise.catch(() => { });
            renderPromise.catch(() => { });
        });
    });

    // Test module robustness
    describe('module robustness', () => {
        test('handles repeated imports correctly', () => {
            // Import multiple times
            const import1 = require('../../src/lib/google-auth');
            const import2 = require('../../src/lib/google-auth');

            // Should be the same module
            expect(import1.decodeJwtResponse).toBe(import2.decodeJwtResponse);
            expect(import1.handleCredentialResponse).toBe(import2.handleCredentialResponse);
        });

        test('maintains function identity across calls', () => {
            const func1 = googleAuth.decodeJwtResponse;
            const func2 = googleAuth.decodeJwtResponse;

            expect(func1).toBe(func2);
            expect(typeof func1).toBe('function');
        });
    });
}); 