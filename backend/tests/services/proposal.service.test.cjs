/**
 * =============================================
 * PROPOSAL SERVICE UNIT TESTS (CommonJS)
 * =============================================
 * 
 * Comprehensive unit tests for proposal.service.js covering:
 * - CRUD operations
 * - Section-based functions
 * - Search and filtering
 * - Status management
 * - Validation and sanitization
 * - Error handling
 * 
 * @author CEDO Development Team
 * @version 1.0.0
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require('vitest');
const proposalService = require('../../services/proposal.service');

// Mock dependencies
vi.mock('../../config/database', () => ({
    query: vi.fn(),
    pool: {}
}));

vi.mock('../../utils/db', () => ({
    getDb: vi.fn()
}));

vi.mock('mongodb', () => ({
    Binary: vi.fn(),
    GridFSBucket: vi.fn()
}));

vi.mock('../../models/Proposal', () => ({
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn()
}));

vi.mock('../../models/User', () => ({
    find: vi.fn()
}));

vi.mock('../../config/nodemailer.config', () => ({
    sendMail: vi.fn()
}));

vi.mock('../../constants/roles', () => ({
    REVIEWER: 'reviewer',
    STUDENT: 'student',
    PARTNER: 'partner',
    HEAD_ADMIN: 'head_admin',
    MANAGER: 'manager'
}));

const { query } = require('../../config/database');
const { getDb } = require('../../utils/db');
const Proposal = require('../../models/Proposal');
const User = require('../../models/User');
const transporter = require('../../config/nodemailer.config');

describe('Proposal Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =============================================
    // TEST DATA SETUP
    // =============================================

    const mockProposalData = {
        organization_name: 'Test Organization',
        organization_type: 'school-based',
        organization_description: 'Test organization description',
        contact_name: 'John Doe',
        contact_email: 'john@example.com',
        contact_phone: '09123456789',
        event_name: 'Test Event',
        event_venue: 'Test Venue',
        event_mode: 'offline',
        event_start_date: '2025-01-15',
        event_end_date: '2025-01-16',
        event_start_time: '09:00:00',
        event_end_time: '17:00:00',
        school_event_type: 'workshop',
        community_event_type: 'seminar',
        proposal_status: 'draft',
        school_return_service_credit: '1',
        school_target_audience: ['1st Year', '2nd Year'],
        community_sdp_credits: '1',
        community_target_audience: ['Youth', 'Adults']
    };

    const mockProposal = {
        id: 1,
        ...mockProposalData,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01')
    };

    const mockQueryResult = {
        rows: [mockProposal],
        rowCount: 1
    };

    // =============================================
    // VALIDATION AND SANITIZATION TESTS
    // =============================================

    describe('validateProposalData', () => {
        it('should validate proposal data successfully', () => {
            const result = proposalService.validateProposalData(mockProposalData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail validation for missing required fields', () => {
            const invalidData = {
                organization_name: '',
                contact_email: 'invalid-email',
                event_start_date: '2025-01-16',
                event_end_date: '2025-01-15' // End date before start date
            };

            const result = proposalService.validateProposalData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Organization name is required');
            expect(result.errors).toContain('Contact person name is required');
            expect(result.errors).toContain('Contact email is required');
            expect(result.errors).toContain('Organization type is required');
            expect(result.errors).toContain('Event name is required');
            expect(result.errors).toContain('Event venue is required');
            expect(result.errors).toContain('Event start date is required');
            expect(result.errors).toContain('Event end date is required');
            expect(result.errors).toContain('Invalid email format');
            expect(result.errors).toContain('End date cannot be earlier than start date');
        });

        it('should validate email format correctly', () => {
            const dataWithInvalidEmail = {
                ...mockProposalData,
                contact_email: 'invalid-email-format'
            };

            const result = proposalService.validateProposalData(dataWithInvalidEmail);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid email format');
        });

        it('should validate date range correctly', () => {
            const dataWithInvalidDates = {
                ...mockProposalData,
                event_start_date: '2025-01-16',
                event_end_date: '2025-01-15'
            };

            const result = proposalService.validateProposalData(dataWithInvalidDates);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('End date cannot be earlier than start date');
        });
    });

    describe('sanitizeProposalData', () => {
        it('should sanitize proposal data correctly', () => {
            const rawData = {
                organization_name: '  Test Organization  ',
                contact_email: '  JOHN@EXAMPLE.COM  ',
                contact_phone: '  09123456789  ',
                organization_description: '',
                school_target_audience: ['1st Year', '2nd Year'],
                community_target_audience: ['Youth', 'Adults']
            };

            const result = proposalService.sanitizeProposalData(rawData);

            expect(result.organization_name).toBe('Test Organization');
            expect(result.contact_email).toBe('john@example.com');
            expect(result.contact_phone).toBe('09123456789');
            expect(result.organization_description).toBe('');
            expect(result.event_mode).toBe('offline');
            expect(result.proposal_status).toBe('draft');
            expect(result.school_return_service_credit).toBe('1');
            expect(result.community_sdp_credits).toBe('1');
            expect(result.school_target_audience).toEqual(['1st Year', '2nd Year']);
            expect(result.community_target_audience).toEqual(['Youth', 'Adults']);
            expect(result.created_at).toBeInstanceOf(Date);
            expect(result.updated_at).toBeInstanceOf(Date);
        });

        it('should handle legacy field mappings', () => {
            const legacyData = {
                event_type: 'workshop',
                return_service_credit: '2',
                target_audience: ['3rd Year', '4th Year']
            };

            const result = proposalService.sanitizeProposalData(legacyData);

            expect(result.school_event_type).toBe('workshop');
            expect(result.community_event_type).toBe('workshop');
            expect(result.school_return_service_credit).toBe('2');
            expect(result.school_target_audience).toEqual(['3rd Year', '4th Year']);
        });
    });

    // =============================================
    // CRUD OPERATIONS TESTS
    // =============================================

    describe('createProposal', () => {
        it('should create a new proposal successfully', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 1 }],
                rowCount: 1
            });

            const result = await proposalService.createProposal(mockProposalData);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO proposals'),
                expect.arrayContaining([
                    'Test Organization',
                    'school-based',
                    'Test organization description',
                    'John Doe',
                    'john@example.com',
                    '09123456789',
                    'Test Event',
                    'Test Venue',
                    'offline',
                    '2025-01-15',
                    '2025-01-16',
                    '09:00:00',
                    '17:00:00',
                    'workshop',
                    'seminar',
                    'draft',
                    '1',
                    JSON.stringify(['1st Year', '2nd Year']),
                    '1',
                    JSON.stringify(['Youth', 'Adults'])
                ])
            );

            expect(result.id).toBe(1);
            expect(result.organization_name).toBe('Test Organization');
        });

        it('should throw error for invalid proposal data', async () => {
            const invalidData = {
                organization_name: '',
                contact_email: 'invalid-email'
            };

            await expect(proposalService.createProposal(invalidData))
                .rejects
                .toThrow('Proposal validation failed');
        });

        it('should handle database errors', async () => {
            query.mockRejectedValueOnce(new Error('Database connection failed'));

            await expect(proposalService.createProposal(mockProposalData))
                .rejects
                .toThrow('Failed to create proposal: Database connection failed');
        });
    });

    describe('getProposalById', () => {
        it('should get proposal by ID successfully', async () => {
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockResolvedValueOnce({});

            const mockBucket = {
                find: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([])
                })
            };

            const { GridFSBucket } = require('mongodb');
            GridFSBucket.mockImplementationOnce(() => mockBucket);

            const result = await proposalService.getProposalById(1);

            expect(query).toHaveBeenCalledWith(
                'SELECT * FROM proposals WHERE id = $1',
                [1]
            );
            expect(result.id).toBe(1);
            expect(result.hasFiles).toBe(false);
        });

        it('should throw error when proposal not found', async () => {
            query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            await expect(proposalService.getProposalById(999))
                .rejects
                .toThrow('Failed to fetch proposal: Proposal not found');
        });

        it('should include file metadata when files exist', async () => {
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockResolvedValueOnce({});

            const mockFiles = [
                {
                    _id: 'file1',
                    filename: 'gpoa.pdf',
                    length: 1024,
                    uploadDate: new Date(),
                    metadata: {
                        fileType: 'gpoa',
                        originalName: 'GPOA.pdf'
                    }
                }
            ];

            const mockBucket = {
                find: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue(mockFiles)
                })
            };

            const { GridFSBucket } = require('mongodb');
            GridFSBucket.mockImplementationOnce(() => mockBucket);

            const result = await proposalService.getProposalById(1);

            expect(result.files).toHaveProperty('gpoa');
            expect(result.hasFiles).toBe(true);
        });
    });

    describe('updateProposal', () => {
        it('should update proposal successfully', async () => {
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockResolvedValueOnce({});

            const mockBucket = {
                find: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([])
                })
            };

            const { GridFSBucket } = require('mongodb');
            GridFSBucket.mockImplementationOnce(() => mockBucket);

            const updateData = {
                organization_name: 'Updated Organization',
                contact_email: 'updated@example.com'
            };

            const result = await proposalService.updateProposal(1, updateData);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE proposals SET'),
                expect.arrayContaining(['Updated Organization', 'updated@example.com', 1])
            );
            expect(result.id).toBe(1);
        });

        it('should throw error when proposal not found for update', async () => {
            query.mockResolvedValueOnce({ rowCount: 0 });

            await expect(proposalService.updateProposal(999, mockProposalData))
                .rejects
                .toThrow('Failed to update proposal: Proposal not found');
        });

        it('should validate update data before updating', async () => {
            const invalidUpdateData = {
                organization_name: '',
                contact_email: 'invalid-email'
            };

            await expect(proposalService.updateProposal(1, invalidUpdateData))
                .rejects
                .toThrow('Update validation failed');
        });
    });

    describe('deleteProposal', () => {
        it('should delete proposal successfully', async () => {
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            query.mockResolvedValueOnce({ rowCount: 1 });

            const result = await proposalService.deleteProposal(1);

            expect(query).toHaveBeenCalledWith(
                'SELECT id FROM proposals WHERE id = $1',
                [1]
            );
            expect(query).toHaveBeenCalledWith(
                'DELETE FROM proposals WHERE id = $1',
                [1]
            );
            expect(result).toBe(true);
        });

        it('should throw error when proposal not found for deletion', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            await expect(proposalService.deleteProposal(999))
                .rejects
                .toThrow('Failed to delete proposal: Proposal not found');
        });
    });

    // =============================================
    // SECTION-BASED FUNCTIONS TESTS
    // =============================================

    describe('saveSection2Data', () => {
        const section2Data = {
            title: 'Test Event Proposal',
            description: 'Test description',
            organizationType: 'school-based',
            contactPerson: 'John Doe',
            contactEmail: 'john@example.com',
            contactPhone: '09123456789',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            objectives: 'Test objectives',
            status: 'draft'
        };

        it('should save section 2 data for new proposal', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 1 }],
                rowCount: 1
            });

            const result = await proposalService.saveSection2Data(section2Data);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO proposals'),
                expect.arrayContaining([
                    'Test Event Proposal',
                    'Test description',
                    'school-based',
                    'John Doe',
                    'john@example.com',
                    '09123456789',
                    'Test Event Proposal Event',
                    'TBD',
                    '2025-01-15',
                    '2025-01-16',
                    'Test objectives',
                    'draft'
                ])
            );
            expect(result.id).toBe(1);
        });

        it('should update section 2 data for existing proposal', async () => {
            query.mockResolvedValueOnce({ rowCount: 1 });

            const result = await proposalService.saveSection2Data({
                ...section2Data,
                proposal_id: 1
            });

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE proposals'),
                expect.arrayContaining([1])
            );
            expect(result.id).toBe(1);
            expect(result.affectedRows).toBe(1);
        });

        it('should throw error for missing required fields', async () => {
            const invalidData = {
                title: '',
                contactPerson: '',
                contactEmail: ''
            };

            await expect(proposalService.saveSection2Data(invalidData))
                .rejects
                .toThrow('Missing required fields');
        });
    });

    describe('saveSection2OrgData', () => {
        const orgData = {
            title: 'Test Event Proposal',
            description: 'Test description',
            organizationType: 'school-based',
            contactPerson: 'John Doe',
            contactEmail: 'john@example.com',
            contactPhone: '09123456789',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            school_event_type: 'workshop',
            status: 'draft'
        };

        it('should save organization data for new proposal', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 1 }],
                rowCount: 1
            });

            const result = await proposalService.saveSection2OrgData(orgData);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO proposals'),
                expect.arrayContaining([
                    'Test Event Proposal',
                    'Test description',
                    'school-based',
                    'John Doe',
                    'john@example.com',
                    '09123456789',
                    'Test Event Proposal Event',
                    'TBD',
                    '2025-01-15',
                    '2025-01-16',
                    '09:00:00',
                    '17:00:00',
                    'workshop',
                    null, // community_event_type for school-based
                    'draft'
                ])
            );
            expect(result.id).toBe(1);
        });

        it('should handle community-based organization type', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 1 }],
                rowCount: 1
            });

            const communityData = {
                ...orgData,
                organizationType: 'community-based',
                community_event_type: 'seminar'
            };

            await proposalService.saveSection2OrgData(communityData);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO proposals'),
                expect.arrayContaining([
                    'Test Event Proposal',
                    'Test description',
                    'community-based',
                    'John Doe',
                    'john@example.com',
                    '09123456789',
                    'Test Event Proposal Event',
                    'TBD',
                    '2025-01-15',
                    '2025-01-16',
                    '09:00:00',
                    '17:00:00',
                    null, // school_event_type for community-based
                    'seminar',
                    'draft'
                ])
            );
        });

        it('should validate organization type and default to school-based', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 1 }],
                rowCount: 1
            });

            const invalidTypeData = {
                ...orgData,
                organizationType: 'invalid-type'
            };

            await proposalService.saveSection2OrgData(invalidTypeData);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO proposals'),
                expect.arrayContaining(['school-based']) // Should default to school-based
            );
        });
    });

    describe('saveSection3EventData', () => {
        const eventData = {
            proposal_id: 1,
            venue: 'Test Venue',
            start_date: '2025-01-15',
            end_date: '2025-01-16',
            time_start: '09:00:00',
            time_end: '17:00:00',
            event_type: 'workshop',
            event_mode: 'offline'
        };

        it('should save event data and transition status from draft to pending', async () => {
            query.mockResolvedValueOnce({
                rows: [{ proposal_status: 'draft' }]
            });
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce({
                rows: [{ proposal_status: 'pending' }]
            });

            const result = await proposalService.saveSection3EventData(eventData);

            expect(query).toHaveBeenCalledWith(
                'SELECT proposal_status FROM proposals WHERE id = $1',
                [1]
            );
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE proposals'),
                expect.arrayContaining([
                    'Test Venue',
                    '2025-01-15',
                    '2025-01-16',
                    '09:00:00',
                    '17:00:00',
                    'workshop',
                    'offline',
                    'pending', // Should transition to pending
                    1
                ])
            );

            expect(result.id).toBe(1);
            expect(result.previousStatus).toBe('draft');
            expect(result.newStatus).toBe('pending');
            expect(result.autoPromoted).toBe(true);
        });

        it('should not change status if already pending or higher', async () => {
            query.mockResolvedValueOnce({
                rows: [{ proposal_status: 'pending' }]
            });
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce({
                rows: [{ proposal_status: 'pending' }]
            });

            const result = await proposalService.saveSection3EventData(eventData);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE proposals'),
                expect.arrayContaining(['pending']) // Should remain pending
            );

            expect(result.previousStatus).toBe('pending');
            expect(result.newStatus).toBe('pending');
            expect(result.autoPromoted).toBe(false);
        });

        it('should throw error for missing proposal_id', async () => {
            const invalidData = {
                venue: 'Test Venue'
            };

            await expect(proposalService.saveSection3EventData(invalidData))
                .rejects
                .toThrow('Missing required field: proposal_id');
        });

        it('should throw error when proposal not found', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            await expect(proposalService.saveSection3EventData(eventData))
                .rejects
                .toThrow('Proposal not found');
        });
    });

    // =============================================
    // SEARCH AND FILTERING TESTS
    // =============================================

    describe('buildSearchQuery', () => {
        it('should build search query with all filters', () => {
            const searchCriteria = {
                organization_name: 'Test Org',
                contact_email: 'test@example.com',
                proposal_status: 'draft',
                organization_type: 'school-based',
                date_from: '2025-01-01',
                date_to: '2025-12-31'
            };

            const result = proposalService.buildSearchQuery(searchCriteria);

            expect(result.where).toContain('organization_name LIKE $1');
            expect(result.where).toContain('contact_email = $2');
            expect(result.where).toContain('proposal_status = $3');
            expect(result.where).toContain('organization_type = $4');
            expect(result.where).toContain('created_at >= $5');
            expect(result.where).toContain('created_at <= $6');
            expect(result.params).toEqual([
                '%Test Org%',
                'test@example.com',
                'draft',
                'school-based',
                '2025-01-01',
                '2025-12-31'
            ]);
        });

        it('should build search query with no filters', () => {
            const result = proposalService.buildSearchQuery({});

            expect(result.where).toBe('WHERE 1=1');
            expect(result.params).toEqual([]);
        });

        it('should trim and lowercase email in search criteria', () => {
            const searchCriteria = {
                contact_email: '  TEST@EXAMPLE.COM  '
            };

            const result = proposalService.buildSearchQuery(searchCriteria);

            expect(result.params).toContain('test@example.com');
        });
    });

    describe('searchProposals', () => {
        it('should search proposals successfully', async () => {
            query.mockResolvedValueOnce({
                rows: [mockProposal]
            });

            const searchCriteria = {
                organization_name: 'Test Org',
                proposal_status: 'draft'
            };

            const result = await proposalService.searchProposals(searchCriteria);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM proposals'),
                expect.arrayContaining(['%Test Org%', 'draft'])
            );
            expect(result).toEqual([mockProposal]);
        });

        it('should handle search errors', async () => {
            query.mockRejectedValueOnce(new Error('Database error'));

            await expect(proposalService.searchProposals({}))
                .rejects
                .toThrow('Failed to search proposals: Database error');
        });
    });

    describe('getProposalsByStatus', () => {
        it('should get proposals by status with pagination', async () => {
            query.mockResolvedValueOnce({
                rows: [mockProposal]
            });

            const result = await proposalService.getProposalsByStatus('draft', {
                page: 2,
                limit: 5
            });

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE proposal_status = $1'),
                ['draft', 5, 5] // limit=5, offset=(2-1)*5=5
            );
            expect(result).toEqual([mockProposal]);
        });

        it('should use default pagination options', async () => {
            query.mockResolvedValueOnce({
                rows: [mockProposal]
            });

            await proposalService.getProposalsByStatus('draft');

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE proposal_status = $1'),
                ['draft', 10, 0] // default limit=10, offset=0
            );
        });
    });

    describe('searchProposal', () => {
        it('should search proposal by organization and email', async () => {
            query.mockResolvedValueOnce({
                rows: [mockProposal]
            });

            const result = await proposalService.searchProposal('Test Org', 'test@example.com');

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE organization_name = $1 AND contact_email = $2'),
                ['Test Org', 'test@example.com']
            );
            expect(result).toEqual(mockProposal);
        });

        it('should return null when no proposal found', async () => {
            query.mockResolvedValueOnce({
                rows: []
            });

            const result = await proposalService.searchProposal('Non-existent', 'none@example.com');

            expect(result).toBeNull();
        });

        it('should throw error for missing search parameters', async () => {
            await expect(proposalService.searchProposal('', ''))
                .rejects
                .toThrow('Missing required search parameters');
        });
    });

    // =============================================
    // STATUS MANAGEMENT TESTS
    // =============================================

    describe('updateProposalStatus', () => {
        it('should update proposal status successfully', async () => {
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockResolvedValueOnce({});

            const mockBucket = {
                find: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([])
                })
            };

            const { GridFSBucket } = require('mongodb');
            GridFSBucket.mockImplementationOnce(() => mockBucket);

            const result = await proposalService.updateProposalStatus(1, 'approved');

            expect(query).toHaveBeenCalledWith(
                'UPDATE proposals SET proposal_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['approved', 1]
            );
            expect(result.id).toBe(1);
        });

        it('should throw error for invalid status', async () => {
            await expect(proposalService.updateProposalStatus(1, 'invalid_status'))
                .rejects
                .toThrow('Invalid status');
        });

        it('should throw error when proposal not found', async () => {
            query.mockResolvedValueOnce({ rowCount: 0 });

            await expect(proposalService.updateProposalStatus(999, 'approved'))
                .rejects
                .toThrow('Failed to update proposal status: Proposal not found');
        });
    });

    describe('getProposalStats', () => {
        it('should get proposal statistics successfully', async () => {
            const mockStats = {
                total: 10,
                drafts: 3,
                pending: 4,
                approved: 2,
                rejected: 1
            };

            query.mockResolvedValueOnce({
                rows: [mockStats]
            });

            const result = await proposalService.getProposalStats();

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('COUNT(*) as total')
            );
            expect(result).toEqual(mockStats);
        });

        it('should handle statistics query errors', async () => {
            query.mockRejectedValueOnce(new Error('Statistics query failed'));

            await expect(proposalService.getProposalStats())
                .rejects
                .toThrow('Failed to generate proposal statistics: Statistics query failed');
        });
    });

    // =============================================
    // DEBUG AND UTILITY TESTS
    // =============================================

    describe('getDebugProposalInfo', () => {
        it('should get debug info from PostgreSQL for numeric ID', async () => {
            query.mockResolvedValueOnce({
                rows: [mockProposal]
            });

            const result = await proposalService.getDebugProposalInfo('123');

            expect(result.postgresql.found).toBe(true);
            expect(result.postgresql.data.id).toBe(1);
            expect(result.postgresql.data.organization_name).toBe('Test Organization');
        });

        it('should get debug info from MongoDB for ObjectId', async () => {
            const mockMongoProposal = {
                _id: '507f1f77bcf86cd799439011',
                title: 'Test Proposal',
                contactEmail: 'test@example.com',
                status: 'draft'
            };

            Proposal.findById.mockResolvedValueOnce(mockMongoProposal);

            const result = await proposalService.getDebugProposalInfo('507f1f77bcf86cd799439011');

            expect(result.mongodb.found).toBe(true);
            expect(result.mongodb.data.id).toBe('507f1f77bcf86cd799439011');
            expect(result.mongodb.data.title).toBe('Test Proposal');
        });

        it('should return error when proposal not found in either database', async () => {
            query.mockResolvedValueOnce({ rows: [] });
            Proposal.findById.mockResolvedValueOnce(null);
            Proposal.findOne.mockResolvedValueOnce(null);

            const result = await proposalService.getDebugProposalInfo('999');

            expect(result.mongodb.found).toBe(false);
            expect(result.postgresql.found).toBe(false);
            expect(result.error).toBe('Proposal not found in either database. Please check your ID or complete Section 2 first.');
        });
    });

    // =============================================
    // ERROR HANDLING TESTS
    // =============================================

    describe('Error Handling', () => {
        it('should handle database connection errors gracefully', async () => {
            query.mockRejectedValueOnce(new Error('Connection timeout'));

            await expect(proposalService.createProposal(mockProposalData))
                .rejects
                .toThrow('Failed to create proposal: Connection timeout');
        });

        it('should handle validation errors with detailed messages', async () => {
            const invalidData = {
                organization_name: '',
                contact_email: 'invalid-email',
                event_start_date: '2025-01-16',
                event_end_date: '2025-01-15'
            };

            await expect(proposalService.createProposal(invalidData))
                .rejects
                .toThrow(/Proposal validation failed.*Organization name is required.*Invalid email format.*End date cannot be earlier than start date/);
        });

        it('should handle file metadata retrieval errors', async () => {
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockRejectedValueOnce(new Error('MongoDB connection failed'));

            const result = await proposalService.getProposalById(1);

            expect(result.files).toEqual({});
            expect(result.hasFiles).toBe(false);
        });
    });

    // =============================================
    // INTEGRATION SCENARIOS
    // =============================================

    describe('Integration Scenarios', () => {
        it('should handle complete proposal workflow', async () => {
            // 1. Create proposal
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            const createdProposal = await proposalService.createProposal(mockProposalData);
            expect(createdProposal.id).toBe(1);

            // 2. Update proposal
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockResolvedValueOnce({});

            const mockBucket = {
                find: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([])
                })
            };

            const { GridFSBucket } = require('mongodb');
            GridFSBucket.mockImplementationOnce(() => mockBucket);

            const updatedProposal = await proposalService.updateProposal(1, {
                organization_name: 'Updated Organization'
            });
            expect(updatedProposal.id).toBe(1);

            // 3. Change status
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce(mockQueryResult);
            getDb.mockResolvedValueOnce({});

            const mockBucket2 = {
                find: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([])
                })
            };

            GridFSBucket.mockImplementationOnce(() => mockBucket2);

            const statusUpdatedProposal = await proposalService.updateProposalStatus(1, 'approved');
            expect(statusUpdatedProposal.id).toBe(1);

            // 4. Search proposals
            query.mockResolvedValueOnce({ rows: [mockProposal] });
            const searchResults = await proposalService.searchProposals({
                organization_name: 'Updated Organization'
            });
            expect(searchResults).toHaveLength(1);

            // 5. Get statistics
            query.mockResolvedValueOnce({
                rows: [{ total: 1, drafts: 0, pending: 0, approved: 1, rejected: 0 }]
            });
            const stats = await proposalService.getProposalStats();
            expect(stats.approved).toBe(1);
        });

        it('should handle section-based proposal creation workflow', async () => {
            // 1. Save Section 2 data
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            const section2Result = await proposalService.saveSection2OrgData({
                title: 'Test Event',
                description: 'Test description',
                organizationType: 'school-based',
                contactPerson: 'John Doe',
                contactEmail: 'john@example.com',
                contactPhone: '09123456789',
                startDate: '2025-01-15',
                endDate: '2025-01-16',
                school_event_type: 'workshop',
                status: 'draft'
            });
            expect(section2Result.id).toBe(1);

            // 2. Save Section 3 event data
            query.mockResolvedValueOnce({ rows: [{ proposal_status: 'draft' }] });
            query.mockResolvedValueOnce({ rowCount: 1 });
            query.mockResolvedValueOnce({ rows: [{ proposal_status: 'pending' }] });

            const section3Result = await proposalService.saveSection3EventData({
                proposal_id: 1,
                venue: 'Test Venue',
                start_date: '2025-01-15',
                end_date: '2025-01-16',
                time_start: '09:00:00',
                time_end: '17:00:00',
                event_type: 'workshop',
                event_mode: 'offline'
            });

            expect(section3Result.id).toBe(1);
            expect(section3Result.autoPromoted).toBe(true);
            expect(section3Result.newStatus).toBe('pending');
        });
    });
});








