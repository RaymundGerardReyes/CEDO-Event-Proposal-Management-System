import {
    cn,
    formatCurrency,
    formatDate,
    generateId,
    truncateText,
} from './utils'; // Adjust the path to your utils.js file

describe('Utility Functions', () => {
    // --- cn (className utility) Tests ---
    describe('cn', () => {
        test('CN_001: Combines multiple string class names', () => {
            expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
        });

        test('CN_002: Filters out falsy values (false, null, undefined, empty string)', () => {
            expect(cn('foo', false, 'bar', null, undefined, '', 'baz')).toBe('foo bar baz');
        });

        test('CN_003: Handles an empty array/no arguments', () => {
            expect(cn()).toBe('');
        });

        test('CN_004: Handles conditional classes effectively', () => {
            const isActive = true;
            const hasError = false;
            expect(cn('base', isActive && 'active', hasError && 'error', 'another')).toBe('base active another');
        });

        test('CN_005: Handles numbers (should be filtered out or converted if intended)', () => {
            // Current implementation filters out non-string truthy values if not explicitly handled.
            // If numbers should be class names, they need to be strings.
            // Based on `classes.filter(Boolean)`, numbers would be true, but join might not be what's expected unless they are strings.
            // The typical use case is for string class names.
            // This test clarifies that non-string truthy values are joined if not filtered by other means.
            // However, the common usage for `cn` implies string inputs or falsy values.
            // Let's assume it's meant for strings and falsy values.
            // If you intend to pass objects or arrays, `filter(Boolean)` might keep them.
            // Sticking to common use:
            expect(cn('class1', 0 && 'class0', 1 && 'class1-active', 'class2')).toBe('class1 class1-active class2');
        });
    });

    // --- formatDate Tests ---
    describe('formatDate', () => {
        test('FD_001: Formats a Date object with default options', () => {
            const date = new Date(2023, 0, 15); // Jan 15, 2023
            expect(formatDate(date)).toBe('Jan 15, 2023');
        });

        test('FD_002: Formats a date string with default options', () => {
            expect(formatDate('2024-03-10T10:00:00.000Z')).toBe('Mar 10, 2024');
        });

        test('FD_003: Formats a date with custom options', () => {
            const date = new Date(2023, 4, 5); // May 5, 2023
            const options = { year: 'numeric', month: 'long', day: '2-digit' };
            expect(formatDate(date, options)).toBe('May 05, 2023');
        });

        test('FD_004: Returns an empty string if date is null or undefined', () => {
            // @ts-ignore
            expect(formatDate(null)).toBe('');
            // @ts-ignore
            expect(formatDate(undefined)).toBe('');
        });

        test('FD_005: Handles an invalid date string', () => {
            // The behavior of toLocaleDateString with an invalid date can vary slightly
            // or throw, but typically results in "Invalid Date" or similar.
            expect(formatDate('not-a-date')).toBe('Invalid Date');
        });

        test('FD_006: Formats a date with only year and month', () => {
            const date = new Date(2023, 11, 1); // Dec 1, 2023
            const options = { year: 'numeric', month: 'long' };
            expect(formatDate(date, options)).toBe('December 2023');
        });
    });

    // --- formatCurrency Tests ---
    describe('formatCurrency', () => {
        test('FC_001: Formats a number with default currency "PHP"', () => {
            // Note: The actual output can vary slightly based on Node's Intl version & OS.
            // It's better to check for essential parts.
            const formatted = formatCurrency(1234.56);
            expect(formatted).toContain('₱'); // PHP symbol
            expect(formatted).toMatch(/1,234\.56/);
        });

        test('FC_002: Formats a number with specified currency "USD"', () => {
            const formatted = formatCurrency(500.75, 'USD');
            expect(formatted).toContain('$'); // USD symbol
            expect(formatted).toMatch(/500\.75/);
        });

        test('FC_003: Handles zero value', () => {
            const formatted = formatCurrency(0, 'EUR');
            expect(formatted).toContain('€'); // EUR symbol
            expect(formatted).toMatch(/0\.00/);
        });

        test('FC_004: Handles negative values', () => {
            const formatted = formatCurrency(-750.25, 'JPY');
            expect(formatted).toContain('¥'); // JPY symbol
            // Note: Negative currency format can vary, e.g., "-¥750" or "¥-750" or "(¥750)"
            // This regex is more flexible for common negative formats.
            expect(formatted).toMatch(/-?¥?-?750/); // JPY has no minor units by default in Intl
        });
    });

    // --- truncateText Tests ---
    describe('truncateText', () => {
        test('TT_001: Returns original text if shorter than or equal to length', () => {
            expect(truncateText('short text', 20)).toBe('short text');
            expect(truncateText('exact length', 12)).toBe('exact length');
        });

        test('TT_002: Truncates text longer than specified length and adds "..."', () => {
            expect(truncateText('This is a very long text that needs truncation', 20)).toBe('This is a very long ...');
        });

        test('TT_003: Returns an empty string if input text is null or undefined', () => {
            // @ts-ignore
            expect(truncateText(null, 10)).toBe('');
            // @ts-ignore
            expect(truncateText(undefined, 10)).toBe('');
        });

        test('TT_004: Handles truncation at length 0 (edge case)', () => {
            // Based on current logic `text.substring(0, 0)` is `""`, so it becomes "..."
            expect(truncateText('Any text', 0)).toBe('...');
        });

        test('TT_005: Uses default length of 50 if no length is provided', () => {
            const longText = 'This is a very long text that definitely exceeds the default fifty characters limit for sure.';
            const expectedShortened = 'This is a very long text that definitely exceeds t...';
            expect(truncateText(longText).length).toBe(50 + 3); // 50 chars + "..."
            expect(truncateText(longText)).toBe(expectedShortened);
        });
    });

    // --- generateId Tests ---
    describe('generateId', () => {
        test('GI_001: Generates a string ID', () => {
            const id = generateId();
            expect(typeof id).toBe('string');
        });

        test('GI_002: Generated ID has the expected length (7 characters)', () => {
            // Math.random().toString(36).substring(2, 9) gives 7 characters
            const id = generateId();
            expect(id.length).toBe(7);
        });

        test('GI_003: Generates different IDs on subsequent calls (probabilistic)', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });

        test('GI_004: Generated ID contains alphanumeric characters (from base36)', () => {
            const id = generateId();
            expect(id).toMatch(/^[a-z0-9]+$/);
        });
    });
});