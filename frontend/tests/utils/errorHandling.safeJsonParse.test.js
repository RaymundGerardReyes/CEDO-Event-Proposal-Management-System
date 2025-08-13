/**
 * Tests for safeJsonParse in submit-event utils
 * Ensures HTML responses and malformed JSON are handled gracefully
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the logger to avoid dependency issues
vi.mock('@/utils/logger', () => ({
    default: {
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Import after mocking
import { safeJsonParse } from '../../src/app/student-dashboard/submit-event/[draftId]/utils/errorHandling.js';

function createResponseMock({ ok = true, status = 200, statusText = 'OK', body = '', contentType = 'application/json', jsonThrows, textReturns }) {
    const headers = new Map();
    headers.set('content-type', contentType);
    return {
        ok,
        status,
        statusText,
        headers: { get: (k) => headers.get(k.toLowerCase()) },
        json: vi.fn().mockImplementation(async () => {
            if (jsonThrows) throw jsonThrows;
            return JSON.parse(body || '{}');
        }),
        text: vi.fn().mockResolvedValue(textReturns ?? body),
        clone: vi.fn().mockReturnValue({
            text: vi.fn().mockResolvedValue(textReturns ?? body)
        })
    };
}

describe('safeJsonParse', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns JSON when response is valid application/json', async () => {
        const resp = createResponseMock({ body: JSON.stringify({ ok: true }) });
        const data = await safeJsonParse(resp, 'debug-info', {});
        expect(data).toEqual({ ok: true });
    });

    it('throws HTML error when Content-Type is text/html (200 OK)', async () => {
        const html = '<!DOCTYPE html><html><body>Some HTML</body></html>';
        const resp = createResponseMock({ contentType: 'text/html; charset=utf-8', body: html, status: 200, statusText: 'OK' });
        await expect(safeJsonParse(resp, 'debug-info', {})).rejects.toThrow('Server returned HTML error page (200 OK)');
    });

    it('re-throws original JSON error when it is not "Unexpected token <"', async () => {
        const resp = createResponseMock({
            contentType: 'application/json',
            status: 200,
            statusText: 'OK',
            jsonThrows: new Error('Unexpected token x in JSON at position 0'),
            textReturns: 'not html content'
        });
        await expect(safeJsonParse(resp, 'debug-info', {})).rejects.toThrow('Unexpected token x in JSON at position 0');
    });
});
