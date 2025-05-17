// backend/tests/users.test.js

const request = require("supertest");
const express = require("express");

// Mock the auth and checkRole middleware before importing routes
jest.mock("../middleware/auth", () => {
    return jest.fn((req, res, next) => {
        // Add a mock authenticated user to the request
        req.user = { id: 1, role: "head_admin" };
        next();
    });
});

jest.mock("../middleware/roles", () => {
    return (...allowedRoles) => {
        return (req, res, next) => {
            // The middleware check is bypassed since we mock req.user.role as head_admin
            next();
        };
    };
});

// Mock the MySQL pool
jest.mock("../config/db", () => ({
    pool: {
        query: jest.fn()
    }
}));

// Import after setting up mocks
const app = express();
const { pool } = require("../config/db");
const usersRouter = require("../routes/users");

// Configure app
app.use(express.json());
app.use("/api/users", usersRouter);

describe("User Routes", () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    describe("GET /me", () => {
        it("should return the current user's details", async () => {
            const mockUser = {
                id: 1,
                name: "John Doe",
                email: "john@example.com",
                role: "student",
                organization: "Example Org",
                organization_type: "Non-Profit",
                avatar: "avatar.png",
                is_approved: true,
                created_at: new Date().toISOString(),
            };

            // Mock the database query
            pool.query.mockResolvedValue([[mockUser]]);

            const response = await request(app)
                .get("/api/users/me");

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty("id", mockUser.id);
            expect(response.body.user).toHaveProperty("name", mockUser.name);
            expect(response.body.user).toHaveProperty("email", mockUser.email);
        });

        it("should return 404 if user not found", async () => {
            pool.query.mockResolvedValue([[]]); // No user found

            const response = await request(app).get("/api/users/me");

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        it("should return 500 on server error", async () => {
            pool.query.mockRejectedValue(new Error("Database error"));

            const response = await request(app).get("/api/users/me");

            expect(response.status).toBe(500);
            expect(response.text).toBe("Server error");
        });
    });

    describe("POST /approve-student/:id", () => {
        it("should approve a student account", async () => {
            const studentId = 2;

            // Mock the database queries
            pool.query.mockResolvedValueOnce([[{ id: studentId, role: "student", is_approved: false }]]);
            pool.query.mockResolvedValueOnce({ affectedRows: 1 }); // Successful update

            const response = await request(app)
                .post(`/api/users/approve-student/${studentId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Student account approved successfully");
        });

        it("should return 404 if student not found", async () => {
            const studentId = 2;

            pool.query.mockResolvedValueOnce([[]]); // No student found

            const response = await request(app)
                .post(`/api/users/approve-student/${studentId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        it("should return 400 if user is not a student", async () => {
            const studentId = 2;

            pool.query.mockResolvedValueOnce([[{ id: studentId, role: "manager", is_approved: false }]]);

            const response = await request(app)
                .post(`/api/users/approve-student/${studentId}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("User is not a student account");
        });

        it("should return 400 if account is already approved", async () => {
            const studentId = 2;

            pool.query.mockResolvedValueOnce([[{ id: studentId, role: "student", is_approved: true }]]);

            const response = await request(app)
                .post(`/api/users/approve-student/${studentId}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Account is already approved");
        });

        it("should return 500 on server error", async () => {
            const studentId = 2;

            pool.query.mockRejectedValue(new Error("Database error"));

            const response = await request(app)
                .post(`/api/users/approve-student/${studentId}`);

            expect(response.status).toBe(500);
            expect(response.text).toBe("Server error");
        });
    });

    describe("GET /pending-students", () => {
        it("should return a list of pending students", async () => {
            const mockStudents = [
                { id: 1, name: "Student One", email: "student1@example.com" },
                { id: 2, name: "Student Two", email: "student2@example.com" },
            ];

            pool.query.mockResolvedValue([mockStudents]);

            const response = await request(app)
                .get("/api/users/pending-students");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockStudents);
        });

        it("should return 500 on server error", async () => {
            pool.query.mockRejectedValue(new Error("Database error"));

            const response = await request(app)
                .get("/api/users/pending-students");

            expect(response.status).toBe(500);
            expect(response.text).toBe("Server error");
        });
    });
});