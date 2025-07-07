// backend/tests/reports.routes.test.js
const request = require('supertest');
const express = require('express');
const router = require('../routes/reports');

jest.mock('../models/Proposal', () => ({
    find: jest.fn(() => ({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
    })),
}));
const Proposal = require('../models/Proposal');

jest.mock('../models/User', () => ({}));

jest.mock('json-2-csv', () => ({
    Parser: jest.fn().mockImplementation(() => ({
        parse: jest.fn(() => 'csv-content'),
    })),
}));

jest.mock('../middleware/auth', () => ({
    validateToken: (req, res, next) => { req.user = { id: 'u1', role: 'admin' }; next(); },
    validateAdmin: (req, res, next) => next(),
    validateFaculty: (req, res, next) => next(),
}));
jest.mock('../middleware/checkRole', () => () => (req, res, next) => next());

const app = express();
app.use(express.json());
app.use('/api/reports', router);

describe('Reports Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/reports/proposals', () => {
        it('should return CSV with no filters', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([{ _id: '1', title: 'T1' }]),
            });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
            expect(res.text).toBe('csv-content');
            expect(res.headers['content-type']).toContain('text/csv');
        });
        it('should filter by status', async () => {
            const sort = jest.fn().mockResolvedValue([]);
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort });
            await request(app).get('/api/reports/proposals?status=approved');
            expect(Proposal.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
        });
        it('should filter by category', async () => {
            const sort = jest.fn().mockResolvedValue([]);
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort });
            await request(app).get('/api/reports/proposals?category=catA');
            expect(Proposal.find).toHaveBeenCalledWith(expect.objectContaining({ category: 'catA' }));
        });
        it('should filter by organizationType', async () => {
            const sort = jest.fn().mockResolvedValue([]);
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort });
            await request(app).get('/api/reports/proposals?organizationType=typeA');
            expect(Proposal.find).toHaveBeenCalledWith(expect.objectContaining({ organizationType: 'typeA' }));
        });
        it('should filter by date range', async () => {
            const sort = jest.fn().mockResolvedValue([]);
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort });
            await request(app).get('/api/reports/proposals?startDate=2024-01-01&endDate=2024-12-31');
            expect(Proposal.find).toHaveBeenCalledWith(expect.objectContaining({ createdAt: expect.any(Object) }));
        });
        it('should call populate and sort', async () => {
            const populate = jest.fn().mockReturnThis();
            const sort = jest.fn().mockResolvedValue([]);
            Proposal.find.mockReturnValue({ populate, sort });
            await request(app).get('/api/reports/proposals');
            expect(populate).toHaveBeenCalledWith('submitter', 'name email organization');
            expect(populate).toHaveBeenCalledWith('assignedTo', 'name');
            expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        });
        it('should handle empty proposals', async () => {
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
            expect(res.text).toBe('csv-content');
        });
        it('should handle multiple proposals', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([
                    { _id: '1', title: 'T1', submitter: { name: 'A', organization: 'O' } },
                    { _id: '2', title: 'T2', submitter: { name: 'B', organization: 'P' } },
                ]),
            });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
            expect(res.text).toBe('csv-content');
        });
        it('should handle proposals with missing submitter', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([
                    { _id: '1', title: 'T1', submitter: null },
                ]),
            });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
        });
        it('should handle proposals with missing fields', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([
                    { _id: '1' },
                ]),
            });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
        });
        it('should handle proposals with various date formats', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([
                    { _id: '1', startDate: '2024-01-01', endDate: '2024-12-31', submitter: { name: 'A', organization: 'O' } },
                ]),
            });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
        });
        it('should set attachment header', async () => {
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.headers['content-disposition']).toContain('attachment');
        });
        it('should handle server error', async () => {
            Proposal.find.mockImplementationOnce(() => { throw new Error('fail'); });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(500);
            expect(res.text).toMatch(/server error/i);
        });
        // Edge/stress
        it('should handle large number of proposals', async () => {
            Proposal.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(Array(1000).fill({ _id: 'x', title: 'T' })),
            });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
        });
        it('should handle missing query params', async () => {
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) });
            const res = await request(app).get('/api/reports/proposals');
            expect(res.status).toBe(200);
        });
        it('should handle invalid date params', async () => {
            Proposal.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) });
            const res = await request(app).get('/api/reports/proposals?startDate=bad&endDate=bad');
            expect(res.status).toBe(200);
        });
        it('should handle missing Proposal model', async () => {
            jest.resetModules();
            jest.doMock('../models/Proposal', () => null);
            const app2 = express();
            app2.use(express.json());
            app2.use('/api/reports', require('../routes/reports'));
            const res = await request(app2).get('/api/reports/proposals');
            expect(res.status).toBe(500);
        });
    });
});
