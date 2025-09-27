/**
 * Simple Test to Verify Test Setup
 */

import { describe, expect, it, vi } from 'vitest';

describe('Simple Test Setup Verification', () => {
    it('should run basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have vi available', () => {
        expect(vi).toBeDefined();
    });

    it('should have global fetch mocked', () => {
        expect(global.fetch).toBeDefined();
    });
});
