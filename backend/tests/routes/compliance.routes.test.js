// backend/tests/compliance.routes.test.js

const request = require('supertest');
const express = require('express');
const Proposal = require('../../models/Proposal');
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const complianceRouter = require('../../routes/compliance');

jest.mock('../../models/Proposal');
jest.mock('../../models/User');
jest.mock('nodemailer');

// Mock middleware
jest.mock('../../middleware/auth', () => ({
    validateToken: jest.fn((req, res, next) => {
        req.user = { id: 'user1', role: 'admin' };
        next();
    })
}));

jest.mock('../../middleware/checkRole', () => {
    return jest.fn(() => (req, res, next) => next());
});

nodemailer.createTransport.mockReturnValue({
    sendMail: jest.fn((opts, cb) => cb(null, { response: 'ok' }))
});

const app = express();
app.use(express.json());
app.use('/api/compliance', complianceRouter);

describe('Compliance Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/compliance', () => {
        it('should return proposals for admin', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ id: 1 }])
            });

            const res = await request(app).get('/api/compliance');
            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(1);
        });

        it('should filter by complianceStatus', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ id: 2, complianceStatus: 'pending' }])
            });

            const res = await request(app).get('/api/compliance?complianceStatus=pending');
            expect(res.status).toBe(200);
            expect(res.body[0].complianceStatus).toBe('pending');
        });

        it('should filter by partner user', async () => {
            const auth = require('../../middleware/auth');
            auth.validateToken = (req, res, next) => {
                req.user = { id: 'partner1', role: 'partner' };
                next();
            };

            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ id: 3, submitter: 'partner1' }])
            });

            const res = await request(app).get('/api/compliance');
            expect(res.status).toBe(200);
            expect(res.body[0].submitter).toBe('partner1');
        });

        it('should handle server error', async () => {
            Proposal.find.mockImplementation(() => { throw new Error('fail'); });

            const res = await request(app).get('/api/compliance');
            expect(res.status).toBe(500);
        });
    });

    describe('POST /api/compliance/:proposalId/documents', () => {
        it('should return 404 if proposal not found', async () => {
            Proposal.findById.mockResolvedValue(null);
            const res = await request(app).post('/api/compliance/123/documents').send();
            expect(res.status).toBe(404);
        });

        it('should return 403 if partner not owner', async () => {
            const auth = require('../../middleware/auth');
            auth.validateToken = (req, res, next) => {
                req.user = { id: 'p2', role: 'partner' };
                next();
            };

            Proposal.findById.mockResolvedValue({
                id: '123',
                submitter: 'p1',
                status: 'approved',
                complianceDocuments: []
            });

            const res = await request(app).post('/api/compliance/123/documents').send();
            expect(res.status).toBe(403);
        });

        it('should return 400 if proposal not approved', async () => {
            Proposal.findById.mockResolvedValue({
                id: '123',
                submitter: 'user1',
                status: 'pending',
                complianceDocuments: []
            });

            const res = await request(app).post('/api/compliance/123/documents').send();
            expect(res.status).toBe(400);
        });

        it('should return 400 if documentTypes length mismatch', async () => {
            Proposal.findById.mockResolvedValue({
                id: '123',
                submitter: 'user1',
                status: 'approved',
                complianceDocuments: []
            });

            const req = request(app).post('/api/compliance/123/documents');
            req.attach('documents', Buffer.from('file'), 'file1.pdf');
            req.field('documentTypes', JSON.stringify(['type1', 'type2']));
            const res = await req;
            expect(res.status).toBe(400);
        });

        it('should update complianceDocuments and notify reviewers', async () => {
            const save = jest.fn();
            Proposal.findById.mockResolvedValue({
                id: '123',
                submitter: 'user1',
                status: 'approved',
                complianceDocuments: [],
                save
            });

            User.find.mockResolvedValue([{ email: 'r@r.com', name: 'R' }]);

            const req = request(app).post('/api/compliance/123/documents');
            req.attach('documents', Buffer.from('file'), 'file1.pdf');
            req.field('documentTypes', JSON.stringify(['type1']));
            const res = await req;
            expect(res.status).toBe(200);
            expect(save).toHaveBeenCalled();
        });

        it('should set complianceStatus to compliant if all required submitted', async () => {
            const save = jest.fn();
            Proposal.findById.mockResolvedValue({
                id: '123',
                submitter: 'user1',
                status: 'approved',
                complianceDocuments: [{ name: 'type1', required: true, submitted: true }],
                save
            });

            User.find.mockResolvedValue([{ email: 'r@r.com', name: 'R' }]);

            const req = request(app).post('/api/compliance/123/documents');
            req.attach('documents', Buffer.from('file'), 'file1.pdf');
            req.field('documentTypes', JSON.stringify(['type1']));
            const res = await req;
            expect(res.status).toBe(200);
        });

        it('should handle server error', async () => {
            Proposal.findById.mockImplementation(() => { throw new Error('fail'); });
            const res = await request(app).post('/api/compliance/123/documents').send();
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /api/compliance/:proposalId/status', () => {
        it('should return 400 if status is invalid', async () => {
            const res = await request(app).put('/api/compliance/123/status').send({ status: 'bad' });
            expect(res.status).toBe(400);
        });

        it('should return 404 if proposal not found', async () => {
            Proposal.findById.mockResolvedValue(null);
            const res = await request(app).put('/api/compliance/123/status').send({ status: 'pending' });
            expect(res.status).toBe(404);
        });

        it('should update complianceStatus and add comment', async () => {
            const save = jest.fn();
            Proposal.findById.mockResolvedValue({
                id: '123',
                submitter: 'user1',
                complianceStatus: 'pending',
                reviewComments: [],
                save
            });

            User.findById.mockResolvedValue({ email: 's@s.com', name: 'S' });

            const res = await request(app).put('/api/compliance/123/status').send({ status: 'compliant', comment: 'ok' });
            expect(res.status).toBe(200);
            expect(save).toHaveBeenCalled();
        });

        it('should handle server error', async () => {
            Proposal.findById.mockImplementation(() => { throw new Error('fail'); });
            const res = await request(app).put('/api/compliance/123/status').send({ status: 'pending' });
            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/compliance/overdue', () => {
        it('should return overdue proposals', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ id: 1, complianceStatus: 'overdue' }])
            });

            User.findById.mockResolvedValue({ email: 's@s.com', name: 'S' });

            const res = await request(app).get('/api/compliance/overdue');
            expect(res.status).toBe(200);
            expect(res.body[0].complianceStatus).toBe('overdue');
        });

        it('should handle server error', async () => {
            Proposal.find.mockImplementation(() => { throw new Error('fail'); });
            const res = await request(app).get('/api/compliance/overdue');
            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/compliance/stats', () => {
        it('should return compliance stats', async () => {
            Proposal.countDocuments = jest.fn()
                .mockResolvedValueOnce(5) // compliant
                .mockResolvedValueOnce(3) // pending
                .mockResolvedValueOnce(2) // overdue
                .mockResolvedValueOnce(10); // total

            const res = await request(app).get('/api/compliance/stats');
            expect(res.status).toBe(200);
            expect(res.body.compliant).toBe(5);
            expect(res.body.complianceRate).toBe('50.00');
        });

        it('should handle server error', async () => {
            Proposal.countDocuments = jest.fn(() => { throw new Error('fail'); });
            const res = await request(app).get('/api/compliance/stats');
            expect(res.status).toBe(500);
        });
    });
});
