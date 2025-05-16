// backend/tests/auth.test.js

const request = require('supertest');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For creating mock tokens
const app = require('../server'); // Correct path to your Express app exporting module
const { pool } = require('../config/db'); // MySQL connection pool

// Mock the google-auth-library client for /api/auth/google tests
jest.mock('google-auth-library', () => {
    const originalModule = jest.requireActual('google-auth-library');
    return {
        ...originalModule,
        OAuth2Client: jest.fn(() => ({
            verifyIdToken: jest.fn(), // This will be further mocked in specific tests
        })),
    };
});
const { OAuth2Client } = require('google-auth-library');

// Mock axios for reCAPTCHA to avoid external calls during unit tests
jest.mock('axios');
const axios = require('axios');


// Setup: Create the users table before all tests
beforeAll(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255), /* Allow NULL for Google-only users */
                role ENUM('student', 'head_admin', 'manager', 'partner', 'reviewer') NOT NULL DEFAULT 'student',
                organization VARCHAR(255),
                organization_type ENUM('internal', 'external'),
                google_id VARCHAR(255) UNIQUE, /* Google ID should be unique */
                avatar VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expires DATETIME,
                is_approved BOOLEAN DEFAULT FALSE,
                approved_by INT,
                approved_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS access_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                role VARCHAR(255),
                action VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
    } catch (error) {
        console.error("Error during beforeAll table creation:", error);
        process.exit(1);
    }
});

// Clean up: Clear the users and access_logs tables before each test
beforeEach(async () => {
    try {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('DELETE FROM access_logs');
        await pool.query('DELETE FROM users');
        await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');
        await pool.query('ALTER TABLE access_logs AUTO_INCREMENT = 1');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        jest.clearAllMocks(); // Clear all mocks before each test
    } catch (error) {
        console.error("Error during beforeEach cleanup:", error);
    }
});

// Teardown: Drop the tables and close the pool after all tests
afterAll(async () => {
    try {
        await pool.query('DROP TABLE IF EXISTS access_logs');
        await pool.query('DROP TABLE IF EXISTS users');
    } catch (error) {
        console.error("Error dropping tables in afterAll:", error);
    } finally {
        await pool.end();
    }
});

describe('POST /api/auth/register', () => {
    const validCaptchaToken = 'mock-captcha-token';

    // Mock successful reCAPTCHA verification
    beforeEach(() => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });
    });

    it('should register a new student user successfully', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'New Student',
                email: 'student@example.com',
                password: 'password123',
                role: 'student',
                captchaToken: validCaptchaToken,
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe('student@example.com');
        expect(response.body.user.name).toBe('New Student');
        expect(response.body.user.role).toBe('student');
        expect(response.body.user.is_approved).toBe(false);
        expect(response.body.user).not.toHaveProperty('password');

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['student@example.com']);
        expect(users.length).toBe(1);
        expect(users[0].is_approved).toBe(0);
    });

    it('should register a new partner user successfully with organization details', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'New Partner',
                email: 'partner@example.com',
                password: 'password123',
                role: 'partner',
                organization: 'Partner Org',
                organization_type: 'external',
                captchaToken: validCaptchaToken,
            });

        expect(response.status).toBe(201);
        expect(response.body.user.email).toBe('partner@example.com');
        expect(response.body.user.role).toBe('partner');
        expect(response.body.user.organization).toBe('Partner Org');
        expect(response.body.user.organization_type).toBe('external');
        expect(response.body.user.is_approved).toBe(false);
    });

    it('should return 400 if email already exists', async () => {
        await request(app) // First user
            .post('/api/auth/register')
            .send({ name: 'Existing User', email: 'existing@example.com', password: 'password123', role: 'student', captchaToken: validCaptchaToken });

        axios.post.mockResolvedValueOnce({ data: { success: true } }); // Mock reCAPTCHA for the second call

        const response = await request(app) // Attempt to register again
            .post('/api/auth/register')
            .send({ name: 'Another User', email: 'existing@example.com', password: 'password456', role: 'student', captchaToken: validCaptchaToken });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toBe('User already exists');
    });

    it('should return 400 if reCAPTCHA verification fails', async () => {
        axios.post.mockReset(); // Clear previous mock for successful reCAPTCHA
        axios.post.mockResolvedValueOnce({ data: { success: false, 'error-codes': ['timeout-or-duplicate'] } });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Captcha Fail User',
                email: 'captchafail@example.com',
                password: 'password123',
                role: 'student',
                captchaToken: 'invalid-captcha-token',
            });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toBe('CAPTCHA verification failed');
    });


    // Validation error tests (only one reCAPTCHA mock needed at the top of describe)
    const registrationErrorTestCases = [
        { field: 'name', payload: { email: 'n@g.com', password: 'password123', role: 'student', captchaToken: validCaptchaToken }, expectedMessage: 'Name is required' },
        { field: 'email', payload: { name: 'Test', password: 'password123', role: 'student', captchaToken: validCaptchaToken }, expectedMessage: 'Please include a valid email' },
        { field: 'email', payload: { name: 'Test', email: 'invalid', password: 'password123', role: 'student', captchaToken: validCaptchaToken }, expectedMessage: 'Please include a valid email' },
        { field: 'password', payload: { name: 'Test', email: 'p@g.com', role: 'student', captchaToken: validCaptchaToken }, expectedMessage: 'Please enter a password with 6 or more characters' }, // Password missing implies length check fail
        { field: 'password', payload: { name: 'Test', email: 'p@g.com', password: '123', role: 'student', captchaToken: validCaptchaToken }, expectedMessage: 'Please enter a password with 6 or more characters' },
        { field: 'role', payload: { name: 'Test', email: 'r@g.com', password: 'password123', captchaToken: validCaptchaToken }, expectedMessage: 'Invalid role for registration' }, // Role missing implies invalid
        { field: 'role', payload: { name: 'Test', email: 'r@g.com', password: 'password123', role: 'nonexistentrole', captchaToken: validCaptchaToken }, expectedMessage: 'Invalid role for registration' },
        { field: 'captchaToken', payload: { name: 'Test', email: 'c@g.com', password: 'password123', role: 'student' }, expectedMessage: 'CAPTCHA verification is required' },
        { field: 'organization', payload: { name: 'Partner', email: 'partner@co.com', password: 'password123', role: 'partner', captchaToken: validCaptchaToken /* organization missing */ }, expectedMessage: 'Organization is required for Partner role' },
    ];

    registrationErrorTestCases.forEach(({ field, payload, expectedMessage }) => {
        it(`should return 400 if ${field} is invalid or missing`, async () => {
            // No need to mock axios.post here as validation happens before reCAPTCHA call for missing fields
            const response = await request(app)
                .post('/api/auth/register')
                .send(payload);
            expect(response.status).toBe(400);
            expect(response.body.errors.some(err => err.param === field && err.msg === expectedMessage)).toBe(true);
        });
    });
});


describe('POST /api/auth/login', () => {
    it('should return 400 if email is not provided', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ password: 'password123' });
        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => e.param === 'email')).toBe(true);
    });

    it('should return 400 if password is not provided', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com' });
        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => e.param === 'password')).toBe(true);
    });

    it('should return 400 if user does not exist', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@example.com', password: 'password123' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 if password is incorrect', async () => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('correctpassword', salt);
        await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            ['Test User', 'test@example.com', hashedPassword, 'student', true]
        );

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 200 and a token if login is successful for an approved user', async () => {
        const salt = await bcrypt.genSalt(10);
        const plainPassword = 'password123';
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved, organization, organization_type, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['Approved User', 'approved@example.com', hashedPassword, 'student', true, 'Approved Org', 'external', 'avatar.png']
        );

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'approved@example.com', password: plainPassword });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        const token = response.body.token;
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        expect(decodedToken.user.id).toBeDefined();
        expect(decodedToken.user.email).toBe('approved@example.com');
        expect(decodedToken.user.role).toBe('student');

        expect(response.body.user).toBeDefined();
        expect(response.body.user).toHaveProperty('email', 'approved@example.com');
        expect(response.body.user.is_approved).toBe(true);
        expect(response.body.user).not.toHaveProperty('password');
        expect(response.body.user.organization).toBe('Approved Org');
        expect(response.body.user.organization_type).toBe('external');
        expect(response.body.user.avatar).toBe('avatar.png');
        expect(response.body.user).toHaveProperty('dashboard'); // Check if dashboard info is present
        expect(response.body.user).toHaveProperty('permissions'); // Check if permissions info is present
    });

    it('should return 403 if account is not approved', async () => {
        const salt = await bcrypt.genSalt(10);
        const plainPassword = 'password123';
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            ['Unapproved User', 'unapproved@example.com', hashedPassword, 'student', false]
        );

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'unapproved@example.com', password: plainPassword });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Account pending approval');
    });

    it('should return 400 if user exists but created via Google and tries password login without a password set', async () => {
        await pool.query(
            "INSERT INTO users (name, email, google_id, role, is_approved, password) VALUES (?, ?, ?, ?, ?, NULL)",
            ['Google User', 'googleuser@example.com', 'google123', 'student', true]
        );

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'googleuser@example.com', password: 'anypassword' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Please sign in using Google or reset your password if you wish to use email/password login.');
    });

    it('should log access on successful login', async () => {
        const salt = await bcrypt.genSalt(10);
        const plainPassword = 'password123';
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        const [insertResult] = await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            ['Log User', 'loguser@example.com', hashedPassword, 'student', true]
        );
        const userId = insertResult.insertId;

        await request(app)
            .post('/api/auth/login')
            .send({ email: 'loguser@example.com', password: plainPassword });

        const [logs] = await pool.query('SELECT * FROM access_logs WHERE user_id = ? AND action = ?', [userId, 'login']);
        expect(logs.length).toBe(1);
        expect(logs[0].role).toBe('student');
    });
});

// Using /api/users/me as it's the actual endpoint in users.js for fetching current user
describe('GET /api/users/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
        const salt = await bcrypt.genSalt(10);
        const plainPassword = 'password123';
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        const [insertResult] = await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved, organization, organization_type, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['Me User', 'me@example.com', hashedPassword, 'student', true, 'My Org', 'internal', 'myavatar.png']
        );
        userId = insertResult.insertId;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'me@example.com', password: plainPassword });
        token = loginResponse.body.token;
    });

    it('should return 401 if no token is provided', async () => {
        const response = await request(app).get('/api/users/me');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });

    it('should return user details if token is valid', async () => {
        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBe(userId);
        expect(response.body.user.email).toBe('me@example.com');
        expect(response.body.user.name).toBe('Me User');
        expect(response.body.user.role).toBe('student');
        expect(response.body.user.is_approved).toBe(true); // Check boolean conversion if necessary
        expect(response.body.user.organization).toBe('My Org');
        expect(response.body.user.organization_type).toBe('internal');
        expect(response.body.user.avatar).toBe('myavatar.png');
        expect(response.body.user).toHaveProperty('dashboard');
        expect(response.body.user).toHaveProperty('permissions');
        expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 if token is invalid/malformed', async () => {
        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer invalidtoken123`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should return 401 if token is expired', async () => {
        const expiredToken = jwt.sign({ user: { id: userId, email: 'me@example.com', role: 'student' } }, process.env.JWT_SECRET, { expiresIn: '1ms' });
        await new Promise(resolve => setTimeout(resolve, 50));

        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${expiredToken}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token expired');
    });

    it('should return 401 if user associated with token is deleted', async () => {
        await pool.query('DELETE FROM users WHERE email = ?', ['me@example.com']);

        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401); // auth middleware will call sessionManager.verifyToken
        // sessionManager.verifyToken checks if user exists and is approved.
        // if not, it throws 'User not found or not approved'
        // The error handler middleware should map this to an appropriate response.
        // Based on auth.js, it will fall to the generic error handler for this one.
        // It should ideally be a 401. Let's assume the error handler returns 500 if not specifically handled.
        // If verifyToken throws generic Error, error handler might pass it or give 500.
        // Let's assume 'Invalid token' is a good general catch if user details can't be verified.
        // This message depends on how error is propagated and handled by auth middleware + error handler
        // If sessionManager.verifyToken throws an error that auth middleware catches and returns as 'Invalid token':
        expect(response.body.message).toMatch(/User not found or not approved|Invalid token/);
    });

    it('should return 401 if user associated with token is no longer approved', async () => {
        await pool.query('UPDATE users SET is_approved = FALSE WHERE email = ?', ['me@example.com']);

        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/User not found or not approved|Invalid token/);
    });
});

describe('POST /api/auth/google', () => {
    const mockGoogleUserPayload = {
        email: 'google.newuser@example.com',
        name: 'Google New User',
        picture: 'http://example.com/avatar.jpg',
        sub: 'googleId12345',
        email_verified: true,
    };
    const mockGoogleToken = 'mockGoogleIdToken';

    beforeEach(() => {
        const mockVerifyIdToken = OAuth2Client.mock.results[0]?.value?.verifyIdToken;
        if (mockVerifyIdToken) {
            mockVerifyIdToken.mockReset();
        }
    });

    it('should register a new user via Google and return 403 (pending approval)', async () => {
        OAuth2Client.mock.results[0].value.verifyIdToken.mockResolvedValueOnce({
            getPayload: () => ({ ...mockGoogleUserPayload, email: 'fresh.google@example.com', sub: 'freshGoogle123' }),
        });

        const response = await request(app)
            .post('/api/auth/google')
            .send({ token: mockGoogleToken });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Account pending approval. Please contact an administrator.');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe('fresh.google@example.com');
        expect(response.body.user.is_approved).toBe(false);

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['fresh.google@example.com']);
        expect(users.length).toBe(1);
        expect(users[0].google_id).toBe('freshGoogle123');
        expect(users[0].is_approved).toBe(0); // Check DB value
        expect(users[0].password).toBeNull(); // Google registered users shouldn't have a password initially
    });

    it('should login an existing, approved user with Google token and update avatar/name', async () => {
        const existingUserEmail = 'google.existing.approved@example.com';
        const existingGoogleId = 'googleIdExistingApproved';
        await pool.query(
            'INSERT INTO users (name, email, google_id, role, is_approved, avatar, password) VALUES (?, ?, ?, ?, ?, ?, NULL)',
            ['Old Google Name', existingUserEmail, existingGoogleId, 'partner', true, 'oldavatar.jpg']
        );

        const updatedGooglePayload = {
            ...mockGoogleUserPayload,
            email: existingUserEmail,
            sub: existingGoogleId,
            name: 'Updated Google Name',
            picture: 'newavatar.jpg'
        };
        OAuth2Client.mock.results[0].value.verifyIdToken.mockResolvedValueOnce({
            getPayload: () => updatedGooglePayload,
        });

        const response = await request(app)
            .post('/api/auth/google')
            .send({ token: mockGoogleToken });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(existingUserEmail);
        expect(response.body.user.name).toBe(updatedGooglePayload.name);
        expect(response.body.user.avatar).toBe(updatedGooglePayload.picture);
        expect(response.body.user.role).toBe('partner');
        expect(response.body.user.is_approved).toBe(true);

        const [users] = await pool.query('SELECT name, avatar FROM users WHERE email = ?', [existingUserEmail]);
        expect(users[0].name).toBe(updatedGooglePayload.name);
        expect(users[0].avatar).toBe(updatedGooglePayload.picture);
    });

    it('should link Google ID to an existing email account (not approved) and return 403', async () => {
        const existingEmail = 'link.me.unapproved@example.com';
        const newGoogleId = 'googleToLinkUnapproved123';

        await pool.query( // User exists, but is_approved is FALSE
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            ['Link Me Unapproved', existingEmail, await bcrypt.hash('password123', 10), 'student', false]
        );

        OAuth2Client.mock.results[0].value.verifyIdToken.mockResolvedValueOnce({
            getPayload: () => ({ ...mockGoogleUserPayload, email: existingEmail, sub: newGoogleId }),
        });

        const response = await request(app)
            .post('/api/auth/google')
            .send({ token: mockGoogleToken });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Account pending approval. Please contact an administrator.');

        const [users] = await pool.query('SELECT google_id, is_approved FROM users WHERE email = ?', [existingEmail]);
        expect(users[0].google_id).toBe(newGoogleId); // Should still link
        expect(users[0].is_approved).toBe(0); // Remains unapproved
    });

    it('should return 403 if Google user exists and is not approved', async () => {
        const unapprovedEmail = 'google.unapproved.login@example.com';
        const unapprovedGoogleId = 'googleIdUnapprovedLogin';
        await pool.query(
            'INSERT INTO users (name, email, google_id, role, is_approved, password) VALUES (?, ?, ?, ?, ?, NULL)',
            ['Unapproved Google User Login', unapprovedEmail, unapprovedGoogleId, 'student', false]
        );

        OAuth2Client.mock.results[0].value.verifyIdToken.mockResolvedValueOnce({
            getPayload: () => ({ ...mockGoogleUserPayload, email: unapprovedEmail, sub: unapprovedGoogleId }),
        });

        const response = await request(app)
            .post('/api/auth/google')
            .send({ token: mockGoogleToken });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Account pending approval. Please contact an administrator.');
    });

    it('should return 400 if Google ID token is not provided', async () => {
        const response = await request(app)
            .post('/api/auth/google')
            .send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Google ID token is required');
    });

    it('should return 401 if Google ID token is invalid (e.g. "Token used too late")', async () => {
        OAuth2Client.mock.results[0].value.verifyIdToken.mockRejectedValueOnce(new Error("Token used too late"));

        const response = await request(app)
            .post('/api/auth/google')
            .send({ token: 'expiredGoogleToken' });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Google ID token is invalid or expired. Please try signing in again.');
    });

    it('should return 500 if Google ID token verification throws an unexpected error', async () => {
        OAuth2Client.mock.results[0].value.verifyIdToken.mockRejectedValueOnce(new Error("Some other unexpected error"));

        const response = await request(app)
            .post('/api/auth/google')
            .send({ token: 'problematicGoogleToken' });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('message', 'Server error during Google authentication.');
    });
});

describe('POST /api/auth/refresh-token', () => {
    let validToken;
    let userId;
    const userPayload = { email: 'refresh@example.com', role: 'student' };

    beforeEach(async () => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        const [insertResult] = await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            ['Refresh User', userPayload.email, hashedPassword, userPayload.role, true]
        );
        userId = insertResult.insertId;
        userPayload.id = userId;

        validToken = jwt.sign({ user: userPayload }, process.env.JWT_SECRET, { expiresIn: '15m' });
    });

    it('should refresh a token successfully', async () => {
        const response = await request(app)
            .post('/api/auth/refresh-token')
            .set('Authorization', `Bearer ${validToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.token).not.toBe(validToken);

        const decodedNewToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(decodedNewToken.user.id).toBe(userId);
        expect(decodedNewToken.user.email).toBe(userPayload.email);
        expect(decodedNewToken.exp > decodedNewToken.iat).toBe(true); // New token has valid expiry
    });

    it('should return 401 if no token is provided for refresh', async () => {
        const response = await request(app)
            .post('/api/auth/refresh-token');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });

    it('should return 401 if token is invalid for refresh', async () => {
        const response = await request(app)
            .post('/api/auth/refresh-token')
            .set('Authorization', 'Bearer invalidtoken');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should return 401 if token is expired for refresh', async () => {
        const expiredToken = jwt.sign({ user: userPayload }, process.env.JWT_SECRET, { expiresIn: '1ms' });
        await new Promise(resolve => setTimeout(resolve, 50));

        const response = await request(app)
            .post('/api/auth/refresh-token')
            .set('Authorization', `Bearer ${expiredToken}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Token expired');
    });

    it('should return 401 on refresh if user in token no longer exists or is not approved', async () => {
        // User 'refresh@example.com' is created and token is generated.
        // Now, delete the user.
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        const response = await request(app)
            .post('/api/auth/refresh-token')
            .set('Authorization', `Bearer ${validToken}`);

        expect(response.status).toBe(401);
        // The exact message depends on how sessionManager.verifyToken and the error handler work.
        // It might be "User not found or not approved" or "Invalid token".
        expect(response.body.message).toMatch(/User not found or not approved|Invalid token/);
    });
});


describe('POST /api/auth/logout', () => {
    let token;
    let userId;

    beforeEach(async () => {
        const salt = await bcrypt.genSalt(10);
        const plainPassword = 'logoutuserpass';
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        const [insertResult] = await pool.query(
            'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            ['Logout User', 'logout@example.com', hashedPassword, 'student', true]
        );
        userId = insertResult.insertId;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'logout@example.com', password: plainPassword });
        token = loginResponse.body.token;
    });

    it('should logout successfully and log the action', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Logged out successfully');

        const [logs] = await pool.query('SELECT * FROM access_logs WHERE user_id = ? AND action = ?', [userId, 'logout']);
        expect(logs.length).toBe(1);
        expect(logs[0].role).toBe('student'); // Role should be logged
    });

    it('should return 401 if no token is provided for logout', async () => {
        const response = await request(app)
            .post('/api/auth/logout');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });
});

describe('GET /api/auth/roles', () => {
    it('should return the defined ROLES object', async () => {
        const response = await request(app).get('/api/auth/roles');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            STUDENT: 'student',
            HEAD_ADMIN: 'head_admin',
            MANAGER: 'manager',
            PARTNER: 'partner',
            REVIEWER: 'reviewer'
        });
    });
});

// Example test for a role-protected dashboard route (if it existed directly in auth.js)
// These are typically tested in their respective route files (e.g. users.test.js for user dashboards)
// but including one here for completeness based on auth.js structure.
describe('GET /api/auth/student-dashboard (Example Protected Route in auth.js)', () => {
    let studentToken;
    let adminToken;

    beforeEach(async () => {
        // Create a student user and get token
        const salt = await bcrypt.genSalt(10);
        const studentPass = await bcrypt.hash('studentpass', salt);
        const [studentInsert] = await pool.query("INSERT INTO users (name, email, password, role, is_approved) VALUES ('Student Acc', 'studentdash@example.com', ?, 'student', TRUE)", [studentPass]);
        const studentLogin = await request(app).post('/api/auth/login').send({ email: 'studentdash@example.com', password: 'studentpass' });
        studentToken = studentLogin.body.token;

        // Create an admin user and get token
        const adminPass = await bcrypt.hash('adminpass', salt);
        await pool.query("INSERT INTO users (name, email, password, role, is_approved) VALUES ('Admin Acc', 'admindash@example.com', ?, 'head_admin', TRUE)", [adminPass]);
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admindash@example.com', password: 'adminpass' });
        adminToken = adminLogin.body.token;
    });

    it('should allow access to student dashboard for student role', async () => {
        const response = await request(app)
            .get('/api/auth/student-dashboard')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Student dashboard data placeholder');
    });

    it('should deny access to student dashboard for admin role', async () => {
        const response = await request(app)
            .get('/api/auth/student-dashboard')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
    });

    it('should deny access to student dashboard if no token', async () => {
        const response = await request(app)
            .get('/api/auth/student-dashboard');
        expect(response.status).toBe(401);
    });
});