// backend/tests/recaptchaAssessment.test.js
const { createAssessment } = require('../utils/recaptchaAssessment');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

jest.mock('@google-cloud/recaptcha-enterprise');

describe('createAssessment', () => {
    let mockClient, mockCreateAssessment;
    const defaultResponse = [
        {
            tokenProperties: { valid: true, action: 'login' },
            riskAnalysis: { score: 0.8, reasons: ['AUTOMATION'] },
        },
    ];

    beforeEach(() => {
        mockCreateAssessment = jest.fn();
        mockClient = {
            projectPath: jest.fn(() => 'projects/test-project'),
            createAssessment: mockCreateAssessment,
        };
        RecaptchaEnterpriseServiceClient.mockImplementation(() => mockClient);
        jest.clearAllMocks();
    });

    test('returns score if valid and action matches', async () => {
        mockCreateAssessment.mockResolvedValue([
            {
                tokenProperties: { valid: true, action: 'login' },
                riskAnalysis: { score: 0.9, reasons: ['AUTOMATION'] },
            },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBe(0.9);
    });

    test('returns null if tokenProperties.valid is false', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: false, invalidReason: 'MISSING' } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBeNull();
    });

    test('returns null if action does not match', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'other' }, riskAnalysis: { score: 0.5, reasons: [] } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBeNull();
    });

    test('calls projectPath with projectID', async () => {
        await createAssessment({ projectID: 'pid', token: 'tok', recaptchaAction: 'login' });
        expect(mockClient.projectPath).toHaveBeenCalledWith('pid');
    });

    test('calls createAssessment with correct request', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        await createAssessment({
            projectID: 'pid',
            recaptchaKey: 'sitekey',
            token: 'tok',
            recaptchaAction: 'login',
        });
        expect(mockCreateAssessment).toHaveBeenCalledWith({
            assessment: {
                event: { token: 'tok', siteKey: 'sitekey' },
            },
            parent: 'projects/test-project',
        });
    });

    test('returns null if createAssessment throws', async () => {
        mockCreateAssessment.mockRejectedValue(new Error('fail'));
        await expect(createAssessment({ token: 'tok', recaptchaAction: 'login' })).rejects.toThrow('fail');
    });

    test('logs score and reasons if action matches', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        mockCreateAssessment.mockResolvedValue([
            {
                tokenProperties: { valid: true, action: 'login' },
                riskAnalysis: { score: 0.7, reasons: ['AUTOMATION', 'SOCIAL_ENGINEERING'] },
            },
        ]);
        await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('The reCAPTCHA score is: 0.7'));
        expect(logSpy).toHaveBeenCalledWith('AUTOMATION');
        expect(logSpy).toHaveBeenCalledWith('SOCIAL_ENGINEERING');
        logSpy.mockRestore();
    });

    test('logs invalid reason if token invalid', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: false, invalidReason: 'MISSING' } },
        ]);
        await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('The CreateAssessment call failed'));
        logSpy.mockRestore();
    });

    test('logs action mismatch', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'other' }, riskAnalysis: { score: 0.5, reasons: [] } },
        ]);
        await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('does not match the action'));
        logSpy.mockRestore();
    });

    // Edge and parameter tests for coverage
    test('handles missing reasons array', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'login' }, riskAnalysis: { score: 0.5 } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBe(0.5);
    });

    test('handles empty reasons array', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'login' }, riskAnalysis: { score: 0.5, reasons: [] } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBe(0.5);
    });

    test('handles undefined riskAnalysis', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'login' } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBeUndefined();
    });

    test('handles undefined tokenProperties', async () => {
        mockCreateAssessment.mockResolvedValue([
            {},
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBeUndefined();
    });

    test('handles missing projectID (uses default)', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(mockClient.projectPath).toHaveBeenCalledWith('modern-vortex-455007-r2');
    });

    test('handles missing recaptchaKey (uses process.env)', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        process.env.RECAPTCHA_SITE_KEY = 'env-key';
        await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(mockCreateAssessment).toHaveBeenCalledWith(
            expect.objectContaining({
                assessment: expect.objectContaining({ event: expect.objectContaining({ siteKey: 'env-key' }) }),
            })
        );
    });

    test('handles missing token', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        const score = await createAssessment({ recaptchaAction: 'login' });
        expect(score).toBe(0.8);
    });

    test('handles missing recaptchaAction', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        const score = await createAssessment({ token: 'tok' });
        expect(score).toBeNull();
    });

    test('handles null token', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        const score = await createAssessment({ token: null, recaptchaAction: 'login' });
        expect(score).toBe(0.8);
    });

    test('handles null recaptchaAction', async () => {
        mockCreateAssessment.mockResolvedValue(defaultResponse);
        const score = await createAssessment({ token: 'tok', recaptchaAction: null });
        expect(score).toBeNull();
    });

    test('handles undefined response', async () => {
        mockCreateAssessment.mockResolvedValue([undefined]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBeUndefined();
    });

    test('handles empty response array', async () => {
        mockCreateAssessment.mockResolvedValue([]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBeUndefined();
    });

    test('handles multiple responses, uses first', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'login' }, riskAnalysis: { score: 0.1, reasons: [] } },
            { tokenProperties: { valid: true, action: 'login' }, riskAnalysis: { score: 0.2, reasons: [] } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBe(0.1);
    });

    test('handles riskAnalysis.score = 0', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'login' }, riskAnalysis: { score: 0, reasons: [] } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBe(0);
    });

    test('handles riskAnalysis.score = 1', async () => {
        mockCreateAssessment.mockResolvedValue([
            { tokenProperties: { valid: true, action: 'login' }, riskAnalysis: { score: 1, reasons: [] } },
        ]);
        const score = await createAssessment({ token: 'tok', recaptchaAction: 'login' });
        expect(score).toBe(1);
    });
});
