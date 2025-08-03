/**
 * Draft Validation Utilities Tests
 * 
 * Purpose: Test the draft validation utilities for proper parameter handling
 * Key approaches: TDD, edge case coverage, type validation, error handling
 */

import {
    createReviewDraft,
    extractReviewInfo,
    handleDraftIdValidation,
    isReviewDraft,
    isValidDraftId,
    sanitizeDraftId,
    validateDraftId,
    validateDraftIdFormat
} from '@/utils/draft-validation';

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Draft Validation Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isValidDraftId', () => {
        it('should return true for valid draftId strings', () => {
            expect(isValidDraftId('draft-123')).toBe(true);
            expect(isValidDraftId('review-456')).toBe(true);
            expect(isValidDraftId('normal_draft')).toBe(true);
            expect(isValidDraftId('a')).toBe(true);
        });

        it('should return false for invalid draftId values', () => {
            expect(isValidDraftId(undefined)).toBe(false);
            expect(isValidDraftId(null)).toBe(false);
            expect(isValidDraftId('')).toBe(false);
            expect(isValidDraftId('   ')).toBe(false);
            expect(isValidDraftId(123)).toBe(false);
            expect(isValidDraftId({})).toBe(false);
            expect(isValidDraftId([])).toBe(false);
        });
    });

    describe('validateDraftId', () => {
        it('should not throw for valid draftId', () => {
            expect(() => validateDraftId('draft-123')).not.toThrow();
            expect(() => validateDraftId('review-456')).not.toThrow();
        });

        it('should throw error for invalid draftId', () => {
            expect(() => validateDraftId(undefined)).toThrow();
            expect(() => validateDraftId(null)).toThrow();
            expect(() => validateDraftId('')).toThrow();
            expect(() => validateDraftId(123)).toThrow();
        });

        it('should include context in error message', () => {
            expect(() => validateDraftId(undefined, 'TestContext')).toThrow('TestContext: Invalid draftId parameter');
        });
    });

    describe('isReviewDraft', () => {
        it('should return true for review draftIds', () => {
            expect(isReviewDraft('review-123')).toBe(true);
            expect(isReviewDraft('review-abc')).toBe(true);
            expect(isReviewDraft('review-')).toBe(true);
        });

        it('should return false for non-review draftIds', () => {
            expect(isReviewDraft('draft-123')).toBe(false);
            expect(isReviewDraft('normal-draft')).toBe(false);
            expect(isReviewDraft('')).toBe(false);
            expect(isReviewDraft(undefined)).toBe(false);
        });
    });

    describe('extractReviewInfo', () => {
        it('should extract review info for review draftIds', () => {
            const searchParams = {
                mode: 'review',
                proposalId: 'proposal-123',
                source: 'admin'
            };

            const result = extractReviewInfo('review-456', searchParams);

            expect(result).toEqual({
                isReviewMode: true,
                draftId: 'review-456',
                mode: 'review',
                proposalId: 'proposal-123',
                source: 'admin',
                reviewDraftId: 'review-456'
            });
        });

        it('should return null for non-review draftIds', () => {
            expect(extractReviewInfo('draft-123')).toBeNull();
            expect(extractReviewInfo('')).toBeNull();
            expect(extractReviewInfo(undefined)).toBeNull();
        });

        it('should use default mode when not provided', () => {
            const result = extractReviewInfo('review-123', {});
            expect(result.mode).toBe('review');
        });
    });

    describe('createReviewDraft', () => {
        it('should create valid review draft object', () => {
            const reviewInfo = {
                isReviewMode: true,
                draftId: 'review-123',
                mode: 'review',
                proposalId: 'proposal-456',
                source: 'admin'
            };

            const result = createReviewDraft(reviewInfo);

            expect(result).toEqual({
                id: 'review-123',
                form_data: {
                    id: 'proposal-456',
                    source: 'admin',
                    mode: 'review',
                    status: 'rejected',
                    isReviewMode: true,
                    proposalId: 'proposal-456',
                    currentSection: 'reporting'
                }
            });
        });

        it('should throw error for invalid review info', () => {
            expect(() => createReviewDraft(null)).toThrow('Invalid review info provided');
            expect(() => createReviewDraft({})).toThrow('Invalid review info provided');
            expect(() => createReviewDraft({ isReviewMode: false })).toThrow('Invalid review info provided');
        });
    });

    describe('sanitizeDraftId', () => {
        it('should sanitize dangerous characters', () => {
            expect(sanitizeDraftId('draft<123>')).toBe('draft123');
            expect(sanitizeDraftId('draft"123"')).toBe('draft123');
            expect(sanitizeDraftId('draft/123\\')).toBe('draft123');
            expect(sanitizeDraftId('draft|123?')).toBe('draft123');
            expect(sanitizeDraftId('draft:123*')).toBe('draft123');
        });

        it('should return empty string for invalid input', () => {
            expect(sanitizeDraftId('')).toBe('');
            expect(sanitizeDraftId(undefined)).toBe('');
            expect(sanitizeDraftId(null)).toBe('');
        });

        it('should preserve safe characters', () => {
            expect(sanitizeDraftId('draft-123_abc')).toBe('draft-123_abc');
            expect(sanitizeDraftId('review-456')).toBe('review-456');
        });
    });

    describe('validateDraftIdFormat', () => {
        it('should validate normal draft format', () => {
            const result = validateDraftIdFormat('draft-123');
            expect(result).toEqual({
                isValid: true,
                type: 'normal',
                reason: null
            });
        });

        it('should validate review draft format', () => {
            const result = validateDraftIdFormat('review-456');
            expect(result).toEqual({
                isValid: true,
                type: 'review',
                reason: null
            });
        });

        it('should reject invalid formats', () => {
            const result = validateDraftIdFormat('draft<123>');
            expect(result).toEqual({
                isValid: false,
                type: 'invalid',
                reason: 'Invalid character format'
            });
        });

        it('should handle invalid inputs', () => {
            expect(validateDraftIdFormat('')).toEqual({
                isValid: false,
                type: 'invalid',
                reason: 'Empty or non-string value'
            });

            expect(validateDraftIdFormat(undefined)).toEqual({
                isValid: false,
                type: 'invalid',
                reason: 'Empty or non-string value'
            });
        });
    });

    describe('handleDraftIdValidation', () => {
        it('should return success for valid draftId', () => {
            const result = handleDraftIdValidation('draft-123');

            expect(result).toEqual({
                success: true,
                draftId: 'draft-123',
                type: 'normal',
                isReviewMode: false
            });
        });

        it('should return success for valid review draftId', () => {
            const result = handleDraftIdValidation('review-456');

            expect(result).toEqual({
                success: true,
                draftId: 'review-456',
                type: 'review',
                isReviewMode: true
            });
        });

        it('should reject invalid draftId', () => {
            const result = handleDraftIdValidation('');

            expect(result).toEqual({
                success: false,
                error: 'Invalid draftId parameter',
                redirect: '/404'
            });
        });

        it('should reject draftId that is too long', () => {
            const longDraftId = 'a'.repeat(1001);
            const result = handleDraftIdValidation(longDraftId, { maxLength: 1000 });

            expect(result).toEqual({
                success: false,
                error: 'DraftId too long',
                redirect: '/404'
            });
        });

        it('should reject review mode when not allowed', () => {
            const result = handleDraftIdValidation('review-456', { allowReviewMode: false });

            expect(result).toEqual({
                success: false,
                error: 'Review mode not allowed',
                redirect: '/404'
            });
        });

        it('should reject special characters when not allowed', () => {
            const result = handleDraftIdValidation('draft<123>', { allowSpecialChars: false });

            expect(result).toEqual({
                success: false,
                error: 'Special characters not allowed',
                redirect: '/404'
            });
        });

        it('should allow special characters when configured', () => {
            const result = handleDraftIdValidation('draft<123>', { allowSpecialChars: true });

            expect(result.success).toBe(true);
            expect(result.draftId).toBe('draft123'); // Still sanitized
        });

        it('should handle exceptions gracefully', () => {
            // Test with an invalid input that should trigger an error
            const invalidResult = handleDraftIdValidation(null);
            expect(typeof invalidResult.success).toBe('boolean');
            expect(typeof invalidResult.error).toBe('string');
            expect(invalidResult.redirect).toBe('/404');
            expect(invalidResult.success).toBe(false);
            
            // Test with undefined input
            const undefinedResult = handleDraftIdValidation(undefined);
            expect(typeof undefinedResult.success).toBe('boolean');
            expect(typeof undefinedResult.error).toBe('string');
            expect(undefinedResult.redirect).toBe('/404');
            expect(undefinedResult.success).toBe(false);
            
            // Test with empty string
            const emptyResult = handleDraftIdValidation('');
            expect(typeof emptyResult.success).toBe('boolean');
            expect(typeof emptyResult.error).toBe('string');
            expect(emptyResult.redirect).toBe('/404');
            expect(emptyResult.success).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle unicode characters', () => {
            expect(isValidDraftId('draft-🚀-123')).toBe(true);
            expect(sanitizeDraftId('draft-🚀-123')).toBe('draft-🚀-123');
        });

        it('should handle very long valid draftIds', () => {
            const longDraftId = 'a'.repeat(1000);
            expect(isValidDraftId(longDraftId)).toBe(true);

            const result = handleDraftIdValidation(longDraftId);
            expect(result.success).toBe(true);
        });

        it('should handle mixed case draftIds', () => {
            expect(isValidDraftId('Draft-123')).toBe(true);
            expect(isValidDraftId('REVIEW-456')).toBe(true);
        });

        it('should handle draftIds with numbers only', () => {
            expect(isValidDraftId('123')).toBe(true);
            expect(isValidDraftId('456789')).toBe(true);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete validation flow for normal draft', () => {
            const draftId = 'draft-123';

            // Step 1: Basic validation
            expect(isValidDraftId(draftId)).toBe(true);

            // Step 2: Format validation
            const formatResult = validateDraftIdFormat(draftId);
            expect(formatResult.isValid).toBe(true);
            expect(formatResult.type).toBe('normal');

            // Step 3: Full validation
            const validationResult = handleDraftIdValidation(draftId);
            expect(validationResult.success).toBe(true);
            expect(validationResult.isReviewMode).toBe(false);
        });

        it('should handle complete validation flow for review draft', () => {
            const draftId = 'review-456';
            const searchParams = { mode: 'review', proposalId: 'proposal-123' };

            // Step 1: Basic validation
            expect(isValidDraftId(draftId)).toBe(true);

            // Step 2: Review detection
            expect(isReviewDraft(draftId)).toBe(true);

            // Step 3: Review info extraction
            const reviewInfo = extractReviewInfo(draftId, searchParams);
            expect(reviewInfo.isReviewMode).toBe(true);

            // Step 4: Review draft creation
            const reviewDraft = createReviewDraft(reviewInfo);
            expect(reviewDraft.id).toBe(draftId);
            expect(reviewDraft.form_data.isReviewMode).toBe(true);

            // Step 5: Full validation
            const validationResult = handleDraftIdValidation(draftId);
            expect(validationResult.success).toBe(true);
            expect(validationResult.isReviewMode).toBe(true);
        });

        it('should handle complete validation flow for invalid draft', () => {
            const draftId = '';

            // Step 1: Basic validation
            expect(isValidDraftId(draftId)).toBe(false);

            // Step 2: Format validation
            const formatResult = validateDraftIdFormat(draftId);
            expect(formatResult.isValid).toBe(false);

            // Step 3: Full validation
            const validationResult = handleDraftIdValidation(draftId);
            expect(validationResult.success).toBe(false);
            expect(validationResult.redirect).toBe('/404');
        });
    });
}); 