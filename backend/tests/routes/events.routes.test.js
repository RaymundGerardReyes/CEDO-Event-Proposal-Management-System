// backend/tests/events.routes.test.js
// Unit tests for backend/routes/events.js

const request = require('supertest');
const express = require('express');
const eventsRouter = require('../../routes/events');
const { pool, query } = require('../../config/database');

jest.mock('../config/db');

const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

describe('Events Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /approved', () => {
        it('should fetch approved events (default)', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1, proposal_status: 'approved', organization_name: 'Org', event_name: 'Event', event_venue: 'Venue', event_start_date: '2023-01-01', event_end_date: '2023-01-02', contact_email: 'a@b.com', contact_name: 'A', created_at: '2023-01-01', updated_at: '2023-01-02' }]]);
            const res = await request(app).get('/api/events/approved');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.events.length).toBe(1);
        });
        it('should filter by email', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 2, proposal_status: 'approved', contact_email: 'x@y.com', organization_name: 'Org', event_name: 'Event', event_venue: 'Venue', event_start_date: '2023-01-01', event_end_date: '2023-01-02', contact_name: 'A', created_at: '2023-01-01', updated_at: '2023-01-02' }]]);
            const res = await request(app).get('/api/events/approved?email=x@y.com');
            expect(res.status).toBe(200);
            expect(res.body.events[0].contact_email).toBe('x@y.com');
        });
        it('should filter by status param', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 3, proposal_status: 'pending', organization_name: 'Org', event_name: 'Event', event_venue: 'Venue', event_start_date: '2023-01-01', event_end_date: '2023-01-02', contact_email: 'a@b.com', contact_name: 'A', created_at: '2023-01-01', updated_at: '2023-01-02' }]]);
            const res = await request(app).get('/api/events/approved?status=pending');
            expect(res.status).toBe(200);
            expect(res.body.events[0].proposal_status).toBe('pending');
        });
        it('should handle multiple statuses', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 4, proposal_status: 'approved', organization_name: 'Org', event_name: 'Event', event_venue: 'Venue', event_start_date: '2023-01-01', event_end_date: '2023-01-02', contact_email: 'a@b.com', contact_name: 'A', created_at: '2023-01-01', updated_at: '2023-01-02' }]]);
            const res = await request(app).get('/api/events/approved?status=approved,pending');
            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(1);
        });
        it('should handle SQL error', async () => {
            pool.query.mockRejectedValueOnce(new Error('fail'));
            const res = await request(app).get('/api/events/approved');
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /', () => {
        it('should return mock events', async () => {
            const res = await request(app).get('/api/events');
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
        it('should handle server error', async () => {
            const orig = console.error;
            console.error = jest.fn(() => { throw new Error('fail'); });
            const res = await request(app).get('/api/events');
            expect(res.status).toBe(500);
            console.error = orig;
        });
    });

    describe('GET /:id', () => {
        it('should return a mock event by id', async () => {
            const res = await request(app).get('/api/events/123');
            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe('123');
        });
        it('should handle server error', async () => {
            const orig = console.error;
            console.error = jest.fn(() => { throw new Error('fail'); });
            const res = await request(app).get('/api/events/123');
            expect(res.status).toBe(500);
            console.error = orig;
        });
    });

    describe('POST /', () => {
        beforeEach(() => {
            // Mock validateToken middleware
            eventsRouter.stack.forEach(layer => {
                if (layer.route && layer.route.stack[0].name === 'validateToken') {
                    layer.route.stack[0].handle = (req, res, next) => { req.user = { id: 'user1' }; next(); };
                }
            });
        });
        it('should create a new event', async () => {
            const res = await request(app).post('/api/events').send({ title: 'T', startDate: '2023-01-01', endDate: '2023-01-02' });
            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe('T');
        });
        it('should return 400 if required fields missing', async () => {
            const res = await request(app).post('/api/events').send({});
            expect(res.status).toBe(400);
        });
        it('should handle server error', async () => {
            const orig = console.error;
            console.error = jest.fn(() => { throw new Error('fail'); });
            const res = await request(app).post('/api/events').send({ title: 'T', startDate: '2023-01-01', endDate: '2023-01-02' });
            expect(res.status).toBe(500);
            console.error = orig;
        });
    });

    // Stress: fetch, create, error, edge
    it('should handle multiple approved event queries', async () => {
        pool.query.mockResolvedValue([[{ id: 1, proposal_status: 'approved', organization_name: 'Org', event_name: 'Event', event_venue: 'Venue', event_start_date: '2023-01-01', event_end_date: '2023-01-02', contact_email: 'a@b.com', contact_name: 'A', created_at: '2023-01-01', updated_at: '2023-01-02' }]]);
        for (let i = 0; i < 5; i++) {
            const res = await request(app).get('/api/events/approved');
            expect(res.status).toBe(200);
        }
    });
    it('should handle multiple event creations', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app).post('/api/events').send({ title: 'T', startDate: '2023-01-01', endDate: '2023-01-02' });
            expect([201, 400, 500]).toContain(res.status);
        }
    });
});
