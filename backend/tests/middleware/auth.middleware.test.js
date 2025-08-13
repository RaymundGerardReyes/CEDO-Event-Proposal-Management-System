// tests/middleware/auth.middleware.test.js
const { validateToken, validateAdmin, validateFaculty, validateReviewer, validateApiKey } = require('../../middleware/auth');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const errorHandler = require('../../middleware/error-handler');

// Mock the database pool
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Auth Middleware', () => {
  let app;
  const mockPool = require('../../config/db').pool;
  const mockLogger = require('../../utils/logger');

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add error handler middleware to handle errors properly
    app.use(errorHandler);

    // Reset mocks
    jest.clearAllMocks();

    // Set up environment variables for testing
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.ADMIN_API_KEY;
  });

  describe('validateToken', () => {
    it('should allow access with valid JWT token', async () => {
      const token = jwt.sign({ id: 1, role: 'admin' }, 'test-secret', { expiresIn: '1h' });

      mockPool.query.mockResolvedValue([[
        { id: 1, email: 'test@example.com', role: 'admin', is_approved: 1 }
      ]]);

      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true, user: req.user });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(1);
    });

    it('should allow access with valid API key', async () => {
      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true, user: req.user });
      });

      const res = await request(app)
        .get('/test')
        .set('x-api-key', 'test-api-key');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('admin');
    });

    it('should return 401 when no token provided', async () => {
      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/no token provided/i);
    });

    it('should return 401 when token is invalid', async () => {
      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid token/i);
    });

    it('should return 401 when token is expired', async () => {
      const token = jwt.sign({ id: 1 }, 'test-secret', { expiresIn: '-1h' });

      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/token expired/i);
    });

    it('should return 401 when user not found in database', async () => {
      const token = jwt.sign({ id: 999 }, 'test-secret', { expiresIn: '1h' });

      mockPool.query.mockResolvedValue([[]]);

      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/user not found/i);
    });

    it('should return 401 when user is not approved', async () => {
      const token = jwt.sign({ id: 1 }, 'test-secret', { expiresIn: '1h' });

      mockPool.query.mockResolvedValue([[
        { id: 1, email: 'test@example.com', role: 'admin', is_approved: 0 }
      ]]);

      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/not approved/i);
    });

    it('should return 500 when JWT secret not configured', async () => {
      delete process.env.JWT_SECRET;

      const token = jwt.sign({ id: 1 }, 'test-secret', { expiresIn: '1h' });

      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/jwt secret not configured/i);
    });
  });

  describe('validateApiKey', () => {
    it('should allow access with valid API key', async () => {
      app.get('/test', validateApiKey, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('x-api-key', 'test-api-key');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 when no API key provided', async () => {
      app.get('/test', validateApiKey, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/api key required/i);
    });

    it('should return 401 when API key is invalid', async () => {
      app.get('/test', validateApiKey, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('x-api-key', 'wrong-key');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid api key/i);
    });

    it('should return 500 when ADMIN_API_KEY not configured', async () => {
      delete process.env.ADMIN_API_KEY;

      app.get('/test', validateApiKey, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('x-api-key', 'test-api-key');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/server configuration error/i);
    });
  });

  describe('validateAdmin', () => {
    it('should allow access for admin role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
      }, validateAdmin, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access for head_admin role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'head_admin' };
        next();
      }, validateAdmin, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access for manager role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'manager' };
        next();
      }, validateAdmin, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny access for non-admin role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      }, validateAdmin, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin privileges required/i);
    });

    it('should deny access when no user', async () => {
      app.get('/test', validateAdmin, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin privileges required/i);
    });
  });

  describe('validateFaculty', () => {
    it('should allow access for faculty role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'faculty' };
        next();
      }, validateFaculty, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access for admin role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
      }, validateFaculty, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny access for non-faculty role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'student' };
        next();
      }, validateFaculty, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/faculty privileges required/i);
    });
  });

  describe('validateReviewer', () => {
    it('should allow access for reviewer role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'reviewer' };
        next();
      }, validateReviewer, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access for admin role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
      }, validateReviewer, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny access for non-reviewer role', async () => {
      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'student' };
        next();
      }, validateReviewer, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/reviewer privileges required/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors gracefully', async () => {
      const token = jwt.sign({ id: 1 }, 'test-secret', { expiresIn: '1h' });

      mockPool.query.mockRejectedValue(new Error('Database connection failed'));

      app.get('/test', validateToken, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication failed/i);
    });

    it('should handle logger failures gracefully', async () => {
      mockLogger.warn.mockImplementation(() => {
        throw new Error('Logger failed');
      });

      app.get('/test', (req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
      }, validateAdmin, (req, res) => {
        res.status(200).json({ success: true });
      });

      const res = await request(app).get('/test');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin privileges required/i);
    });
  });
});
