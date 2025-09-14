/**
 * Vitest Demo Tests
 * Demonstrates Vitest's superior error distinction and testing capabilities
 * 
 * Key approaches: Better error messages, faster execution, and clearer test failures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Vitest Superior Error Distinction Demo', () => {
    let testData;

    beforeEach(() => {
        testData = {
            user: { id: 1, name: 'John Doe', email: 'john@example.com' },
            proposal: { uuid: '123e4567-e89b-12d3-a456-426614174000', status: 'draft' },
            numbers: [1, 2, 3, 4, 5]
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Object Comparison Tests', () => {
        it('should show detailed object differences', () => {
            const expected = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                role: 'admin'
            };

            const actual = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user' // Different value
            };

            // Vitest will show exactly which properties differ
            expect(actual).toEqual(expected);
        });

        it('should show array differences clearly', () => {
            const expected = [1, 2, 3, 4, 5, 6];
            const actual = [1, 2, 3, 4, 5]; // Missing 6

            // Vitest will show exactly which elements are missing
            expect(actual).toEqual(expected);
        });
    });

    describe('Async Error Handling', () => {
        it('should show clear async error messages', async () => {
            const asyncFunction = async () => {
                throw new Error('Database connection failed');
            };

            // Vitest will show the exact error with stack trace
            await expect(asyncFunction()).rejects.toThrow('Network timeout');
        });

        it('should handle promise rejections clearly', async () => {
            const promise = Promise.reject(new Error('API call failed'));

            // Vitest will show the exact rejection reason
            await expect(promise).resolves.toBe('success');
        });
    });

    describe('Mock Function Testing', () => {
        it('should show detailed mock call information', () => {
            const mockFunction = vi.fn();

            mockFunction('first call');
            mockFunction('second call');

            // Vitest will show exactly what was called and what was expected
            expect(mockFunction).toHaveBeenCalledWith('third call');
            expect(mockFunction).toHaveBeenCalledTimes(1);
        });

        it('should show mock return value differences', () => {
            const mockApi = vi.fn();
            mockApi.mockReturnValue({ status: 'error', message: 'Not found' });

            const result = mockApi();

            // Vitest will show exactly what was returned vs expected
            expect(result).toEqual({ status: 'success', data: 'user data' });
        });
    });

    describe('String Comparison Tests', () => {
        it('should show exact string differences', () => {
            const expected = 'Hello, World!';
            const actual = 'Hello, world!'; // Different case

            // Vitest will highlight the exact character differences
            expect(actual).toBe(expected);
        });

        it('should show regex match failures clearly', () => {
            const email = 'invalid-email';

            // Vitest will show what the regex expected vs what was provided
            expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });
    });

    describe('Type and Structure Tests', () => {
        it('should show type mismatches clearly', () => {
            const value = '123';

            // Vitest will show expected type vs actual type
            expect(typeof value).toBe('number');
        });

        it('should show property existence clearly', () => {
            const obj = { name: 'John' };

            // Vitest will show which properties exist vs expected
            expect(obj).toHaveProperty('email');
            expect(obj).toHaveProperty('age', 30);
        });
    });

    describe('Custom Error Messages', () => {
        it('should show custom error messages clearly', () => {
            const result = 2 + 2;

            // Vitest will show the custom message along with the failure
            expect(result).toBe(5, 'Basic arithmetic should work correctly');
        });

        it('should show context in error messages', () => {
            const user = { id: 1, name: 'John' };

            // Vitest will show the context of what was being tested
            expect(user).toHaveProperty('email', 'john@example.com');
        });
    });

    describe('Performance and Speed', () => {
        it('should run faster than Jest', () => {
            const start = performance.now();

            // Simple operation to demonstrate speed
            const result = Array.from({ length: 1000 }, (_, i) => i * 2);

            const end = performance.now();
            const duration = end - start;

            // Vitest should complete this quickly
            expect(duration).toBeLessThan(100); // Should complete in under 100ms
            expect(result.length).toBe(1000);
        });
    });

    describe('Snapshot Testing', () => {
        it('should show clear snapshot differences', () => {
            const component = {
                type: 'div',
                props: { className: 'container' },
                children: ['Hello World']
            };

            // Vitest will show exactly what changed in the snapshot
            expect(component).toMatchSnapshot();
        });
    });

    describe('Real-world API Testing Simulation', () => {
        it('should show clear API response differences', async () => {
            const mockApiResponse = {
                status: 200,
                data: {
                    user: {
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com'
                    },
                    proposals: [
                        { id: 1, title: 'Proposal 1', status: 'draft' },
                        { id: 2, title: 'Proposal 2', status: 'pending' }
                    ]
                }
            };

            const expectedResponse = {
                status: 200,
                data: {
                    user: {
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com',
                        role: 'admin' // Missing in actual
                    },
                    proposals: [
                        { id: 1, title: 'Proposal 1', status: 'approved' }, // Different status
                        { id: 2, title: 'Proposal 2', status: 'pending' },
                        { id: 3, title: 'Proposal 3', status: 'draft' } // Missing in actual
                    ]
                }
            };

            // Vitest will show exactly which fields differ in the API response
            expect(mockApiResponse).toEqual(expectedResponse);
        });
    });
});





















