/**
 * Test Setup File for Backend Tests
 * 
 * This file sets up the testing environment for all backend tests.
 * It includes global configurations, mocks, and utilities.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests
global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

// Global test utilities
global.testUtils = {
    createMockProposal: (overrides = {}) => ({
        id: 1,
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
        community_target_audience: ['Youth', 'Adults'],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
        ...overrides
    }),

    createMockUser: (overrides = {}) => ({
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        organization: 'Test Organization',
        ...overrides
    }),

    createMockQueryResult: (rows = [], rowCount = 0) => ({
        rows,
        rowCount
    })
};

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_USER = 'test_user';
process.env.POSTGRES_PASSWORD = 'test_password';
process.env.POSTGRES_DATABASE = 'test_db';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.GOOGLE_CLIENT_ID = 'test_google_client_id';
process.env.postgresql_URI = 'postgresql://localhost:27017/test_db';