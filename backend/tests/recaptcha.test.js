// backend/tests/recaptcha.test.js
const { verifyRecaptchaToken } = require('../utils/recaptcha');
const axios = require('axios');

jest.mock('axios');

describe('verifyRecaptchaToken', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV, RECAPTCHA_SECRET_KEY: 'test-secret' };
    });
    afterEach(() => {
        process.env = OLD_ENV;
        jest.clearAllMocks();
    });

    test('returns false if secret key is missing', async () => {
        process.env.RECAPTCHA_SECRET_KEY = '';
        const result = await verifyRecaptchaToken('sometoken');
        expect(result).toBe(false);
    });

    test('returns false if token is missing', async () => {
        const result = await verifyRecaptchaToken();
        expect(result).toBe(false);
    });

    test('bypasses in development with test-token', async () => {
        process.env.NODE_ENV = 'development';
        const result = await verifyRecaptchaToken('test-token');
        expect(result).toBe(true);
    });

    test('bypasses in development with dev-bypass', async () => {
        process.env.NODE_ENV = 'development';
        const result = await verifyRecaptchaToken('dev-bypass');
        expect(result).toBe(true);
    });

    test('bypasses in development with remoteIp ::1', async () => {
        process.env.NODE_ENV = 'development';
        const result = await verifyRecaptchaToken('sometoken', '::1');
        expect(result).toBe(true);
    });

    test('bypasses in development with remoteIp 127.0.0.1', async () => {
        process.env.NODE_ENV = 'development';
        const result = await verifyRecaptchaToken('sometoken', '127.0.0.1');
        expect(result).toBe(true);
    });

    test('calls axios.post with correct params', async () => {
        axios.post.mockResolvedValue({ data: { success: true } });
        const result = await verifyRecaptchaToken('valid-token', '1.2.3.4');
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('recaptcha/api/siteverify'),
            null,
            expect.objectContaining({
                params: expect.objectContaining({
                    secret: 'test-secret',
                    response: 'valid-token',
                    remoteip: '1.2.3.4',
                }),
            })
        );
        expect(result).toBe(true);
    });

    test('returns false if axios returns success: false', async () => {
        axios.post.mockResolvedValue({ data: { success: false, 'error-codes': ['bad-request'] } });
        const result = await verifyRecaptchaToken('invalid-token');
        expect(result).toBe(false);
    });

    test('returns false if axios throws error', async () => {
        axios.post.mockRejectedValue(new Error('network error'));
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(false);
    });

    test('logs error if secret key is missing', async () => {
        process.env.RECAPTCHA_SECRET_KEY = '';
        const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
        await verifyRecaptchaToken('token');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('ReCAPTCHA secret key is not configured'));
        spy.mockRestore();
    });

    test('logs warning if token is missing', async () => {
        const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        await verifyRecaptchaToken();
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('No reCAPTCHA token provided'));
        spy.mockRestore();
    });

    test('logs debug info', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => { });
        axios.post.mockResolvedValue({ data: { success: true } });
        await verifyRecaptchaToken('valid-token', 'ip');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('--- reCAPTCHA Verification Debug ---'));
        spy.mockRestore();
    });

    test('logs error codes if verification fails', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
        axios.post.mockResolvedValue({ data: { success: false, 'error-codes': ['bad-request'] } });
        await verifyRecaptchaToken('invalid-token');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('reCAPTCHA verification failed'));
        spy.mockRestore();
    });

    test('logs axios error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
        axios.post.mockRejectedValue(new Error('fail'));
        await verifyRecaptchaToken('token');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Error verifying reCAPTCHA token'));
        spy.mockRestore();
    });

    test('logs end debug', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => { });
        axios.post.mockResolvedValue({ data: { success: true } });
        await verifyRecaptchaToken('token');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('--- reCAPTCHA Verification Debug End ---'));
        spy.mockRestore();
    });

    // Additional edge cases for coverage
    test('handles undefined remoteIp', async () => {
        axios.post.mockResolvedValue({ data: { success: true } });
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(true);
    });

    test('handles null token', async () => {
        const result = await verifyRecaptchaToken(null);
        expect(result).toBe(false);
    });

    test('handles null secretKey', async () => {
        process.env.RECAPTCHA_SECRET_KEY = null;
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(false);
    });

    test('handles empty token string', async () => {
        const result = await verifyRecaptchaToken('');
        expect(result).toBe(false);
    });

    test('handles empty secretKey string', async () => {
        process.env.RECAPTCHA_SECRET_KEY = '';
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(false);
    });

    test('handles axios response with missing data', async () => {
        axios.post.mockResolvedValue({});
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(undefined);
    });

    test('handles axios response with no success property', async () => {
        axios.post.mockResolvedValue({ data: {} });
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(undefined);
    });

    test('handles axios response with error-codes array', async () => {
        axios.post.mockResolvedValue({ data: { success: false, 'error-codes': ['timeout-or-duplicate'] } });
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(false);
    });

    test('handles axios response with challenge_ts and hostname', async () => {
        axios.post.mockResolvedValue({ data: { success: true, challenge_ts: 'ts', hostname: 'host', score: 0.9, action: 'action' } });
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(true);
    });

    test('handles axios response with score and action', async () => {
        axios.post.mockResolvedValue({ data: { success: true, score: 0.5, action: 'login' } });
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(true);
    });

    test('handles axios response with error-codes as string', async () => {
        axios.post.mockResolvedValue({ data: { success: false, 'error-codes': 'timeout-or-duplicate' } });
        const result = await verifyRecaptchaToken('token');
        expect(result).toBe(false);
    });
});
