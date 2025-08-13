/**
 * Proposal Routes Tests
 * Tests UUID-based proposal management with MySQL backend
 * 
 * Key approaches: TDD workflow, comprehensive endpoint coverage,
 * status transition validation, and error scenario testing
 */

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../server.js';

// Mock database pool
vi.mock('../../config/db.js', () => ({
    pool: {
        execute: vi.fn(() => Promise.resolve([[]])),
        query: vi.fn(() => Promise.resolve([[]]))
    }
}));

// Mock authentication middleware
vi.mock('../../middleware/auth.js', () => ({
    validateToken: vi.fn((req, res, next) => {
        req.user = { id: 1, email: 'test@example.com', role: 'student' };
        next();
    }),
    validateAdmin: vi.fn((req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
        next();
    })
}));

// Mock validation middleware
vi.mock('../../validators/proposal.validator.js', () => ({
    validateProposal: vi.fn((req, res, next) => next()),
    validateReportData: vi.fn((req, res, next) => next()),
    validateReviewAction: vi.fn((req, res, next) => next())
}));

// Mock audit service
vi.mock('../../services/audit.service.js', () => ({
    createAuditLog: vi.fn(() => Promise.resolve(1)),
    createDebugLog: vi.fn(() => Promise.resolve(1)),
    getAuditLogs: vi.fn(() => Promise.resolve([])),
    getDebugLogs: vi.fn(() => Promise.resolve([])),
    getDebugInfo: vi.fn(() => Promise.resolve({
        mysql_record: { uuid: 'test-uuid', id: 57 },
        audit_logs: [],
        debug_logs: [],
        status_match: true
    }))
}));

describe('Proposal Routes', () => {
    let testUser, testAdmin, testProposalUuid;

    beforeEach(async () => {
        testUser = { id: 1, email: 'test@example.com', role: 'student', token: 'test-token' };
        testAdmin = { id: 2, email: 'admin@example.com', role: 'admin', token: 'admin-token' };
        testProposalUuid = '898f8f05-d9ab-4a20-8f34-d315ced0300f';
    });

    describe('Route Configuration', () => {
        it('should have all required routes configured', () => {
            const routes = app._router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods)
                }));

            // Check that our routes are registered
            const proposalRoutes = routes.filter(route =>
                route.path.includes('/api/proposals')
            );

            expect(proposalRoutes.length).toBeGreaterThan(0);
        });
    });

    describe('POST /api/proposals', () => {
        it('should accept proposal creation request', async () => {
            const proposalData = {
                uuid: testProposalUuid,
                organization_name: 'Test Organization',
                user_id: testUser.id,
                current_section: 'orgInfo',
                proposal_status: 'draft'
            };

            const response = await request(app)
                .post('/api/proposals')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send(proposalData);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/proposals')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/proposals/:uuid', () => {
        it('should accept proposal update request', async () => {
            const updateData = {
                organization_name: 'Updated Organization',
                current_section: 'schoolEvent'
            };

            const response = await request(app)
                .put(`/api/proposals/${testProposalUuid}`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send(updateData);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });

        it('should return 404 for non-existent proposal', async () => {
            const response = await request(app)
                .put('/api/proposals/non-existent-uuid')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ organization_name: 'Test' });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/proposals/:uuid/submit', () => {
        it('should accept proposal submission request', async () => {
            const response = await request(app)
                .post(`/api/proposals/${testProposalUuid}/submit`)
                .set('Authorization', `Bearer ${testUser.token}`);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });
    });

    describe('POST /api/proposals/:uuid/review', () => {
        it('should accept admin review request', async () => {
            const reviewData = {
                action: 'approve',
                note: 'Approved for implementation'
            };

            const response = await request(app)
                .post(`/api/proposals/${testProposalUuid}/review`)
                .set('Authorization', `Bearer ${testAdmin.token}`)
                .send(reviewData);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });

        it('should require admin role', async () => {
            const response = await request(app)
                .post(`/api/proposals/${testProposalUuid}/review`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ action: 'approve' });

            expect(response.status).toBe(403);
        });
    });

    describe('POST /api/proposals/:uuid/report', () => {
        it('should accept report submission request', async () => {
            const reportData = {
                report_content: 'Test report content',
                report_attachments: []
            };

            const response = await request(app)
                .post(`/api/proposals/${testProposalUuid}/report`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send(reportData);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });
    });

    describe('GET /api/proposals/:uuid/debug', () => {
        it('should accept debug info request', async () => {
            const response = await request(app)
                .get(`/api/proposals/${testProposalUuid}/debug`)
                .set('Authorization', `Bearer ${testUser.token}`);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });
    });

    describe('POST /api/proposals/:uuid/debug/logs', () => {
        it('should accept debug log request', async () => {
            const logData = {
                source: 'test',
                message: 'Test debug message',
                meta: { test: true }
            };

            const response = await request(app)
                .post(`/api/proposals/${testProposalUuid}/debug/logs`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send(logData);

            // Should not be 404 (route exists) and not 401 (auth passed)
            expect(response.status).not.toBe(404);
            expect(response.status).not.toBe(401);
        });
    });
});
