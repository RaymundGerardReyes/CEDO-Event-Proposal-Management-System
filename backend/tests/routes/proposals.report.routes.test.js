// backend/tests/proposals.report.routes.test.js
const request = require('supertest');
const express = require('express');
const router = require('../../routes/proposals/report.routes');

jest.mock('../../controllers/report.controller', () => ({
    getOrganizations: jest.fn((req, res) => res.json({ success: true, data: 'orgs' })),
    getAnalytics: jest.fn((req, res) => res.json({ success: true, data: 'analytics' })),
    getOrganizationAnalytics: jest.fn((req, res) => res.json({ success: true, data: 'org-analytics', org: req.params.organizationName })),
    getDashboardStats: jest.fn((req, res) => res.json({ success: true, stats: [1, 2, 3] })),
    getLiveStats: jest.fn((req, res) => res.json({ success: true, live: true })),
    generateReport: jest.fn((req, res) => res.json({ success: true, report: req.body })),
}));

const app = express();
app.use(express.json());
app.use('/api/proposals/reports', router);

describe('Proposals Report Routes', () => {
    describe('GET /organizations', () => {
        it('should return organizations', async () => {
            const res = await request(app).get('/api/proposals/reports/organizations');
            expect(res.status).toBe(200);
            expect(res.body.data).toBe('orgs');
        });
        it('should call getOrganizations controller', async () => {
            const ctrl = require('../../controllers/report.controller');
            await request(app).get('/api/proposals/reports/organizations');
            expect(ctrl.getOrganizations).toHaveBeenCalled();
        });
    });

    describe('GET /analytics', () => {
        it('should return analytics', async () => {
            const res = await request(app).get('/api/proposals/reports/analytics');
            expect(res.status).toBe(200);
            expect(res.body.data).toBe('analytics');
        });
        it('should call getAnalytics controller', async () => {
            const ctrl = require('../../controllers/report.controller');
            await request(app).get('/api/proposals/reports/analytics');
            expect(ctrl.getAnalytics).toHaveBeenCalled();
        });
    });

    describe('GET /organizations/:organizationName/analytics', () => {
        it('should return org analytics for given org', async () => {
            const res = await request(app).get('/api/proposals/reports/organizations/OrgA/analytics');
            expect(res.status).toBe(200);
            expect(res.body.data).toBe('org-analytics');
            expect(res.body.org).toBe('OrgA');
        });
        it('should call getOrganizationAnalytics controller', async () => {
            const ctrl = require('../../controllers/report.controller');
            await request(app).get('/api/proposals/reports/organizations/OrgB/analytics');
            expect(ctrl.getOrganizationAnalytics).toHaveBeenCalled();
        });
        it('should handle special characters in org name', async () => {
            const res = await request(app).get('/api/proposals/reports/organizations/Org%20Special%20%26%20Co/analytics');
            expect(res.status).toBe(200);
            expect(res.body.org).toBe('Org Special & Co');
        });
    });

    describe('GET /stats', () => {
        it('should return dashboard stats', async () => {
            const res = await request(app).get('/api/proposals/reports/stats');
            expect(res.status).toBe(200);
            expect(res.body.stats).toEqual([1, 2, 3]);
        });
        it('should call getDashboardStats controller', async () => {
            const ctrl = require('../../controllers/report.controller');
            await request(app).get('/api/proposals/reports/stats');
            expect(ctrl.getDashboardStats).toHaveBeenCalled();
        });
    });

    describe('GET /live', () => {
        it('should return live stats', async () => {
            const res = await request(app).get('/api/proposals/reports/live');
            expect(res.status).toBe(200);
            expect(res.body.live).toBe(true);
        });
        it('should call getLiveStats controller', async () => {
            const ctrl = require('../../controllers/report.controller');
            await request(app).get('/api/proposals/reports/live');
            expect(ctrl.getLiveStats).toHaveBeenCalled();
        });
    });

    describe('POST /generate', () => {
        it('should generate report with body', async () => {
            const res = await request(app)
                .post('/api/proposals/reports/generate')
                .send({ type: 'summary', filters: { year: 2024 } });
            expect(res.status).toBe(200);
            expect(res.body.report).toEqual({ type: 'summary', filters: { year: 2024 } });
        });
        it('should call generateReport controller', async () => {
            const ctrl = require('../../controllers/report.controller');
            await request(app).post('/api/proposals/reports/generate').send({});
            expect(ctrl.generateReport).toHaveBeenCalled();
        });
        it('should handle empty body', async () => {
            const res = await request(app).post('/api/proposals/reports/generate').send();
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        it('should handle large payload', async () => {
            const big = { data: 'x'.repeat(10000) };
            const res = await request(app).post('/api/proposals/reports/generate').send(big);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // Edge and stress cases
    it('should handle unknown route with 404', async () => {
        const res = await request(app).get('/api/proposals/reports/unknown');
        expect(res.status).toBe(404);
    });
    it('should handle GET with query params', async () => {
        const res = await request(app).get('/api/proposals/reports/organizations?filter=active');
        expect(res.status).toBe(200);
        expect(res.body.data).toBe('orgs');
    });
    it('should handle GET /organizations with no data', async () => {
        const ctrl = require('../../controllers/report.controller');
        ctrl.getOrganizations.mockImplementationOnce((req, res) => res.json({ success: true, data: [] }));
        const res = await request(app).get('/api/proposals/reports/organizations');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });
    it('should handle GET /analytics with no data', async () => {
        const ctrl = require('../../controllers/report.controller');
        ctrl.getAnalytics.mockImplementationOnce((req, res) => res.json({ success: true, data: [] }));
        const res = await request(app).get('/api/proposals/reports/analytics');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });
    it('should handle GET /organizations/:organizationName/analytics with no data', async () => {
        const ctrl = require('../../controllers/report.controller');
        ctrl.getOrganizationAnalytics.mockImplementationOnce((req, res) => res.json({ success: true, data: null }));
        const res = await request(app).get('/api/proposals/reports/organizations/None/analytics');
        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
    });
    it('should handle GET /stats with no stats', async () => {
        const ctrl = require('../../controllers/report.controller');
        ctrl.getDashboardStats.mockImplementationOnce((req, res) => res.json({ success: true, stats: [] }));
        const res = await request(app).get('/api/proposals/reports/stats');
        expect(res.status).toBe(200);
        expect(res.body.stats).toEqual([]);
    });
    it('should handle GET /live with no live data', async () => {
        const ctrl = require('../../controllers/report.controller');
        ctrl.getLiveStats.mockImplementationOnce((req, res) => res.json({ success: true, live: false }));
        const res = await request(app).get('/api/proposals/reports/live');
        expect(res.status).toBe(200);
        expect(res.body.live).toBe(false);
    });
    it('should handle POST /generate with error', async () => {
        const ctrl = require('../../controllers/report.controller');
        ctrl.generateReport.mockImplementationOnce((req, res) => res.status(500).json({ success: false, error: 'fail' }));
        const res = await request(app).post('/api/proposals/reports/generate').send({});
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('fail');
    });
});
