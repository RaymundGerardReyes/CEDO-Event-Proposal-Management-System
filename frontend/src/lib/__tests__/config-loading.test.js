/**
 * Comprehensive test suite for config loading functionality
 * Tests the enhanced loadConfig function with retry logic and fallback mechanisms
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig, resetAppConfig } from '../utils.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Config Loading Tests', () => {
    beforeEach(() => {
        // Reset mocks and app config
        vi.clearAllMocks();
        resetAppConfig(); // Reset app config
        delete process.env.API_URL;
        delete process.env.BACKEND_URL;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Successful Config Loading', () => {
        it('should load config successfully from backend', async () => {
            const mockConfig = {
                recaptchaSiteKey: 'test-site-key',
                backendUrl: 'http://localhost:5000'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockConfig)
            });

            const result = await loadConfig();

            expect(result).toEqual({
                ...mockConfig,
                timestamp: expect.any(Number)
            });
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/config',
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'include'
                })
            );
        });

        it('should use cached config on subsequent calls', async () => {
            const mockConfig = {
                recaptchaSiteKey: 'test-site-key',
                backendUrl: 'http://localhost:5000'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockConfig)
            });

            // First call
            await loadConfig();
            // Second call should use cache
            const result = await loadConfig();

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expect.objectContaining(mockConfig));
        });
    });

    describe('Retry Logic', () => {
        it('should retry on network failures', async () => {
            const mockConfig = {
                recaptchaSiteKey: 'test-site-key',
                backendUrl: 'http://localhost:5000'
            };

            // First two calls fail, third succeeds
            global.fetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockConfig)
                });

            const result = await loadConfig(3);

            expect(global.fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual(expect.objectContaining(mockConfig));
        }, 15000);

        it('should use exponential backoff between retries', async () => {
            const startTime = Date.now();

            global.fetch.mockRejectedValue(new Error('Network error'));

            try {
                await loadConfig(3);
            } catch (error) {
                // Should have attempted 3 times
                expect(global.fetch).toHaveBeenCalledTimes(3);
            }

            // Should have waited at least 2 + 4 = 6 seconds (exponential backoff)
            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeGreaterThanOrEqual(6000);
        }, 15000);
    });

    describe('Fallback Mechanisms', () => {
        it('should fallback to environment variables when backend fails', async () => {
            process.env.RECAPTCHA_SITE_KEY = 'env-site-key';
            process.env.API_URL = 'http://localhost:5000';

            global.fetch.mockRejectedValue(new Error('Failed to fetch'));

            const result = await loadConfig();

            expect(result).toEqual({
                backendUrl: 'http://localhost:5000',
                recaptchaSiteKey: 'env-site-key',
                error: 'Failed to fetch',
                fallback: true,
                timestamp: expect.any(Number)
            });
        }, 10000);

        it('should handle timeout errors gracefully', async () => {
            process.env.RECAPTCHA_SITE_KEY = 'env-site-key';

            global.fetch.mockRejectedValue(new Error('The operation was aborted'));

            const result = await loadConfig();

            expect(result.fallback).toBe(true);
            expect(result.error).toContain('aborted');
        }, 10000);

        it('should handle CORS errors with specific messaging', async () => {
            process.env.RECAPTCHA_SITE_KEY = 'env-site-key';

            global.fetch.mockRejectedValue(new Error('CORS policy'));

            const result = await loadConfig();

            expect(result.fallback).toBe(true);
            expect(result.error).toContain('CORS');
        }, 10000);
    });

    describe('Error Classification', () => {
        it('should classify timeout errors correctly', async () => {
            global.fetch.mockRejectedValue(new Error('The operation was aborted'));

            const result = await loadConfig();

            expect(result.error).toContain('aborted');
        }, 10000);

        it('should classify network errors correctly', async () => {
            global.fetch.mockRejectedValue(new Error('Failed to fetch'));

            const result = await loadConfig();

            expect(result.error).toContain('Failed to fetch');
        }, 10000);

        it('should handle HTTP error responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: () => Promise.resolve('Server error')
            });

            const result = await loadConfig();

            expect(result.fallback).toBe(true);
            expect(result.error).toContain('HTTP 500');
        }, 10000);
    });

    describe('URL Construction', () => {
        it('should handle API_URL with trailing /api', async () => {
            process.env.API_URL = 'http://localhost:5000/api';

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ recaptchaSiteKey: 'test' })
            });

            await loadConfig();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/config',
                expect.any(Object)
            );
        });

        it('should handle BACKEND_URL without trailing slash', async () => {
            process.env.BACKEND_URL = 'http://localhost:5000';

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ recaptchaSiteKey: 'test' })
            });

            await loadConfig();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/config',
                expect.any(Object)
            );
        });

        it('should use default localhost:5000 when no env vars set', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ recaptchaSiteKey: 'test' })
            });

            await loadConfig();

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/config',
                expect.any(Object)
            );
        });
    });

    describe('Data Validation', () => {
        it('should reject invalid JSON responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve('invalid json')
            });

            const result = await loadConfig();

            expect(result.fallback).toBe(true);
            expect(result.error).toContain('Invalid config response format');
        }, 10000);

        it('should reject null responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(null)
            });

            const result = await loadConfig();

            expect(result.fallback).toBe(true);
            expect(result.error).toContain('Invalid config response format');
        }, 10000);
    });
});
