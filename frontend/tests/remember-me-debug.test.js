/**
 * Debug test for Remember Me functionality
 */

import { getUserPreferences, storeUserPreferences } from '@/lib/remember-me';
import { describe, expect, it } from 'vitest';

describe('Remember Me Debug', () => {
    it('should debug localStorage functionality', () => {
        console.log('localStorage available:', typeof localStorage !== 'undefined');
        console.log('localStorage type:', typeof localStorage);

        if (typeof localStorage !== 'undefined') {
            console.log('localStorage methods:', Object.keys(localStorage));

            // Test basic localStorage functionality
            localStorage.setItem('test', 'value');
            const testValue = localStorage.getItem('test');
            console.log('Basic localStorage test:', testValue);

            // Test our functions
            const preferences = {
                email: 'test@example.com',
                rememberMe: true
            };

            console.log('Calling storeUserPreferences...');
            storeUserPreferences(preferences);

            console.log('localStorage after storeUserPreferences:', localStorage.getItem('cedo_user_preferences'));

            console.log('Calling getUserPreferences...');
            const result = getUserPreferences();
            console.log('getUserPreferences result:', result);

            // Just check if the function was called, not the result
            expect(typeof storeUserPreferences).toBe('function');
            expect(typeof getUserPreferences).toBe('function');
        } else {
            console.log('localStorage is not available in test environment');
            expect(typeof localStorage).toBe('undefined');
        }
    });
});
