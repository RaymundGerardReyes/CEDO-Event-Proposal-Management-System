/**
 * Form Data Recovery Utilities Tests
 * 
 * Purpose: Test the comprehensive form data recovery and validation system
 * Key approaches: TDD, edge case coverage, multi-source recovery, error handling
 */

import {
    consolidateFormData,
    createFormDataBackup,
    handleFormDataRecovery,
    recoverSection2Data,
    restoreFormDataBackup,
    validateCompleteFormData,
    validateSection2Data
} from '@/utils/form-data-recovery';

// Mock localStorage and sessionStorage
const mockLocalStorage = {
    data: {},
    getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
    setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
    removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; })
};

const mockSessionStorage = {
    data: {},
    getItem: jest.fn((key) => mockSessionStorage.data[key] || null),
    setItem: jest.fn((key, value) => { mockSessionStorage.data[key] = value; }),
    removeItem: jest.fn((key) => { delete mockSessionStorage.data[key]; })
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/main/student-dashboard/submit-event/test-draft-123'
    },
    writable: true
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
    value: 'cedo_token=mock-token-123',
    writable: true
});

describe('Form Data Recovery Utilities', () => {
    beforeEach(() => {
        // Clear all mocks and storage
        jest.clearAllMocks();
        mockLocalStorage.data = {};
        mockSessionStorage.data = {};

        // Setup global storage mocks
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        Object.defineProperty(window, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true
        });
    });

    describe('validateSection2Data', () => {
        it('should return valid for complete Section 2 data', () => {
            const validData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const result = validateSection2Data(validData);

            expect(result.isValid).toBe(true);
            expect(result.missingFields).toEqual([]);
            expect(result.validationErrors).toEqual({});
            expect(result.hasData).toBe(true);
        });

        it('should return invalid for missing required fields', () => {
            const invalidData = {
                organizationName: 'Test Organization',
                // Missing contactEmail, contactName, organizationType
            };

            const result = validateSection2Data(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('contactEmail');
            expect(result.missingFields).toContain('contactName');
            expect(result.missingFields).toContain('organizationType');
            expect(result.validationErrors.contactEmail).toBe('Contact Email is required');
        });

        it('should validate email format', () => {
            const invalidEmailData = {
                organizationName: 'Test Organization',
                contactEmail: 'invalid-email',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const result = validateSection2Data(invalidEmailData);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('contactEmail');
            expect(result.validationErrors.contactEmail).toBe('Please enter a valid email address');
        });

        it('should handle empty strings and whitespace', () => {
            const emptyData = {
                organizationName: '   ',
                contactEmail: '',
                contactName: null,
                organizationType: undefined
            };

            const result = validateSection2Data(emptyData);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('organizationName');
            expect(result.missingFields).toContain('contactEmail');
            expect(result.missingFields).toContain('contactName');
            expect(result.missingFields).toContain('organizationType');
        });

        it('should handle completely empty data', () => {
            const result = validateSection2Data({});

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toHaveLength(4);
            expect(result.hasData).toBe(false);
        });
    });

    describe('recoverSection2Data', () => {
        it('should return current data if already valid', async () => {
            const validData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const result = await recoverSection2Data(validData, {});

            expect(result.isValid).toBe(true);
            expect(result.source).toBe('current');
            expect(result.data).toEqual(validData);
        });

        it('should recover from localStorage', async () => {
            const localStorageData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            mockLocalStorage.setItem('eventProposalFormData', JSON.stringify(localStorageData));

            const result = await recoverSection2Data({}, localStorageData);

            expect(result.isValid).toBe(true);
            expect(result.source).toBe('localStorage');
            expect(result.data.organizationName).toBe('Test Organization');
        });

        it('should recover from sessionStorage', async () => {
            const sessionData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            mockSessionStorage.setItem('cedoFormData', JSON.stringify(sessionData));

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(true);
            expect(result.source).toBe('sessionStorage');
            expect(result.data.organizationName).toBe('Test Organization');
        });

        it('should try multiple localStorage keys', async () => {
            const formData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            mockLocalStorage.setItem('formData', JSON.stringify(formData));

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(true);
            expect(result.source).toBe('formData');
        });

        it('should recover from draft API', async () => {
            const draftResponse = {
                id: 'draft-123',
                payload: {
                    organization: {
                        organizationName: 'Test Organization',
                        contactEmail: 'test@example.com',
                        contactName: 'John Doe',
                        organizationType: 'school-based'
                    }
                }
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => draftResponse
            });

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(true);
            expect(result.source).toBe('draftAPI');
            expect(result.data.organizationName).toBe('Test Organization');
        });

        it('should handle API errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(false);
            expect(result.source).toBe('none');
        });

        it('should return invalid if no recovery sources work', async () => {
            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(false);
            expect(result.source).toBe('none');
            expect(result.missingFields).toHaveLength(4);
        });
    });

    describe('createFormDataBackup and restoreFormDataBackup', () => {
        it('should create and restore backup data', () => {
            const formData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            createFormDataBackup(formData);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'formDataBackup',
                expect.stringContaining('Test Organization')
            );

            const restored = restoreFormDataBackup();

            expect(restored.organizationName).toBe('Test Organization');
            expect(restored.backupTimestamp).toBeDefined();
            expect(restored.backupVersion).toBe('1.0');
        });

        it('should handle backup creation errors', () => {
            mockLocalStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => createFormDataBackup({ test: 'data' })).not.toThrow();
        });

        it('should handle backup restoration errors', () => {
            mockLocalStorage.setItem('formDataBackup', 'invalid-json');

            const result = restoreFormDataBackup();

            expect(result).toBeNull();
        });
    });

    describe('consolidateFormData', () => {
        it('should successfully consolidate form data', async () => {
            const localFormData = {
                schoolEventName: 'Test Event',
                schoolVenue: 'Test Venue'
            };

            const formData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const result = await consolidateFormData(localFormData, formData, {});

            expect(result.organizationName).toBe('Test Organization');
            expect(result.schoolEventName).toBe('Test Event');
            expect(result.schoolVenue).toBe('Test Venue');
        });

        it('should throw error if Section 2 data is missing', async () => {
            const localFormData = {
                schoolEventName: 'Test Event'
            };

            await expect(
                consolidateFormData(localFormData, {}, {})
            ).rejects.toThrow('Missing required Section 2 data');
        });

        it('should create backup during consolidation', async () => {
            const localFormData = { schoolEventName: 'Test Event' };
            const formData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            await consolidateFormData(localFormData, formData, {});

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'formDataBackup',
                expect.stringContaining('Test Organization')
            );
        });
    });

    describe('validateCompleteFormData', () => {
        it('should validate complete form data successfully', () => {
            const completeData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based',
                schoolEventName: 'Test Event',
                schoolVenue: 'Test Venue',
                schoolStartDate: '2024-01-01',
                schoolEndDate: '2024-01-02',
                schoolTimeStart: '09:00',
                schoolTimeEnd: '17:00',
                schoolEventType: 'workshop',
                schoolEventMode: 'in-person',
                schoolReturnServiceCredit: 'yes'
            };

            const result = validateCompleteFormData(completeData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.hasSection2Data).toBe(true);
            expect(result.hasSection3Data).toBe(true);
        });

        it('should detect missing Section 2 data', () => {
            const incompleteData = {
                schoolEventName: 'Test Event'
                // Missing Section 2 data
            };

            const result = validateCompleteFormData(incompleteData);

            expect(result.isValid).toBe(false);
            expect(result.hasSection2Data).toBe(false);
            expect(result.errors).toContain('Organization Name is required');
        });

        it('should detect missing Section 3 data', () => {
            const incompleteData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
                // Missing Section 3 data
            };

            const result = validateCompleteFormData(incompleteData);

            expect(result.isValid).toBe(true); // Section 2 is valid
            expect(result.hasSection2Data).toBe(true);
            expect(result.hasSection3Data).toBe(false);
            expect(result.warnings).toContain('Missing Section 3 fields: schoolEventName, schoolVenue, schoolStartDate, schoolEndDate, schoolTimeStart, schoolTimeEnd, schoolEventType, schoolEventMode, schoolReturnServiceCredit');
        });
    });

    describe('handleFormDataRecovery', () => {
        it('should handle successful recovery with toast', async () => {
            const mockToast = jest.fn();
            const localStorageData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const result = await handleFormDataRecovery({
                currentFormData: {},
                localStorageFormData: localStorageData,
                showUserMessage: true,
                toast: mockToast
            });

            expect(result.isValid).toBe(true);
            expect(mockToast).toHaveBeenCalledWith({
                title: "Data Recovered",
                description: expect.stringContaining("Successfully recovered organization data"),
                variant: "default",
            });
        });

        it('should handle failed recovery with toast', async () => {
            const mockToast = jest.fn();

            const result = await handleFormDataRecovery({
                currentFormData: {},
                localStorageFormData: {},
                showUserMessage: true,
                toast: mockToast
            });

            expect(result.isValid).toBe(false);
            expect(mockToast).toHaveBeenCalledWith({
                title: "Missing Organization Data",
                description: expect.stringContaining("Please complete Section 2"),
                variant: "destructive",
            });
        });

        it('should handle recovery errors gracefully', async () => {
            const mockToast = jest.fn();

            // Mock fetch to throw an error
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await handleFormDataRecovery({
                currentFormData: {},
                localStorageFormData: {},
                showUserMessage: true,
                toast: mockToast
            });

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Network error');
            expect(mockToast).toHaveBeenCalledWith({
                title: "Data Recovery Failed",
                description: expect.stringContaining("Unable to recover form data"),
                variant: "destructive",
            });
        });

        it('should not show toast when showUserMessage is false', async () => {
            const mockToast = jest.fn();

            await handleFormDataRecovery({
                currentFormData: {},
                localStorageFormData: {},
                showUserMessage: false,
                toast: mockToast
            });

            expect(mockToast).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle malformed JSON in storage', async () => {
            mockLocalStorage.setItem('eventProposalFormData', 'invalid-json');

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(false);
            expect(result.source).toBe('none');
        });

        it('should handle storage quota exceeded', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            expect(() => createFormDataBackup({ test: 'data' })).not.toThrow();
        });

        it('should handle missing window object (SSR)', () => {
            const originalWindow = global.window;
            delete global.window;

            expect(() => createFormDataBackup({ test: 'data' })).not.toThrow();
            expect(() => restoreFormDataBackup()).not.toThrow();

            global.window = originalWindow;
        });

        it('should handle very large form data', async () => {
            const largeData = {
                organizationName: 'A'.repeat(10000), // Very large string
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const result = validateSection2Data(largeData);

            expect(result.isValid).toBe(true);
        });

        it('should handle unicode characters in form data', async () => {
            const unicodeData = {
                organizationName: 'Test Organization 🚀',
                contactEmail: 'test@example.com',
                contactName: 'José María',
                organizationType: 'school-based'
            };

            const result = validateSection2Data(unicodeData);

            expect(result.isValid).toBe(true);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete recovery flow', async () => {
            // Setup multiple data sources
            const localStorageData = {
                organizationName: 'Test Organization',
                contactEmail: 'test@example.com',
                contactName: 'John Doe',
                organizationType: 'school-based'
            };

            const sessionData = {
                organizationName: 'Session Organization',
                contactEmail: 'session@example.com',
                contactName: 'Jane Doe',
                organizationType: 'community-based'
            };

            mockLocalStorage.setItem('eventProposalFormData', JSON.stringify(localStorageData));
            mockSessionStorage.setItem('cedoFormData', JSON.stringify(sessionData));

            // Test recovery
            const recoveryResult = await recoverSection2Data({}, {});
            expect(recoveryResult.isValid).toBe(true);
            expect(recoveryResult.source).toBe('localStorage');

            // Test consolidation
            const localFormData = { schoolEventName: 'Test Event' };
            const consolidatedData = await consolidateFormData(localFormData, {}, {});
            expect(consolidatedData.organizationName).toBe('Test Organization');
            expect(consolidatedData.schoolEventName).toBe('Test Event');

            // Test validation
            const validationResult = validateCompleteFormData(consolidatedData);
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.hasSection2Data).toBe(true);
        });

        it('should handle recovery with API fallback', async () => {
            const draftResponse = {
                id: 'draft-123',
                payload: {
                    organization: {
                        organizationName: 'API Organization',
                        contactEmail: 'api@example.com',
                        contactName: 'API User',
                        organizationType: 'school-based'
                    }
                }
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => draftResponse
            });

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(true);
            expect(result.source).toBe('draftAPI');
            expect(result.data.organizationName).toBe('API Organization');
        });

        it('should handle complete failure scenario', async () => {
            // Mock all recovery sources to fail
            global.fetch.mockRejectedValueOnce(new Error('API failed'));

            const result = await recoverSection2Data({}, {});

            expect(result.isValid).toBe(false);
            expect(result.source).toBe('none');
            expect(result.missingFields).toHaveLength(4);
        });
    });
}); 