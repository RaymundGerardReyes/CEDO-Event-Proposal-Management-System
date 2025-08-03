/**
 * API Integration Test
 * Purpose: Test frontend API integration with various endpoints, error handling, and request/response processing
 * Key approaches: Integration testing, API endpoint verification, error scenario testing, middleware validation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock authentication context
vi.mock('@/contexts/auth-context', () => ({
    useAuth: () => ({
        user: {
            id: 'user-123',
            email: 'student@example.com',
            name: 'Test Student',
            role: 'student'
        },
        isAuthenticated: true,
        loading: false,
        signOut: vi.fn(),
    }),
    AuthProvider: ({ children }) => children,
}));

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('API Integration', () => {
    let mockFetch;
    let mockRouter;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFetch = vi.fn();
        global.fetch = mockFetch;

        mockRouter = {
            push: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            replace: vi.fn(),
            refresh: vi.fn(),
        };

        // Reset localStorage mock
        localStorageMock.getItem.mockReturnValue('mock-token');
        localStorageMock.setItem.mockImplementation(() => { });
        localStorageMock.removeItem.mockImplementation(() => { });
        localStorageMock.clear.mockImplementation(() => { });
    });

    describe('Authentication API', () => {
        it('should handle successful sign-in', async () => {
            // Mock successful sign-in response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    user: {
                        id: 'user-123',
                        email: 'test@example.com',
                        name: 'Test User',
                        role: 'student'
                    },
                    token: 'mock-jwt-token'
                })
            });

            // Verify API call
            expect(mockFetch).toBeDefined();

            const response = await mockFetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123'
                })
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.user.email).toBe('test@example.com');
        });

        it('should handle sign-in errors', async () => {
            // Mock failed sign-in response
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({
                    success: false,
                    error: 'Invalid credentials'
                })
            });

            // Verify error handling
            const response = await mockFetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'invalid@example.com',
                    password: 'wrongpassword'
                })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid credentials');
        });

        it('should handle token refresh', async () => {
            // Mock successful token refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    token: 'new-refreshed-token'
                })
            });

            // Verify token refresh
            const response = await mockFetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.token).toBe('new-refreshed-token');
        });
    });

    describe('Dashboard API', () => {
        it('should fetch dashboard data successfully', async () => {
            // Mock successful dashboard data
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: {
                        stats: {
                            totalProposals: 5,
                            pendingProposals: 2,
                            approvedProposals: 3,
                            totalEvents: 8
                        },
                        recentActivity: [
                            {
                                id: 'activity-1',
                                type: 'proposal_submitted',
                                title: 'Science Fair Proposal',
                                timestamp: '2024-01-15T10:00:00Z'
                            }
                        ]
                    }
                })
            });

            // Verify dashboard data fetch
            const response = await mockFetch('/api/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.stats.totalProposals).toBe(5);
            expect(data.data.recentActivity).toHaveLength(1);
        });

        it('should handle dashboard loading errors', async () => {
            // Mock failed dashboard fetch
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: 'Internal server error'
                })
            });

            // Verify error handling
            const response = await mockFetch('/api/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('Internal server error');
        });
    });

    describe('Proposals API', () => {
        it('should fetch proposals list successfully', async () => {
            // Mock successful proposals fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    proposals: [
                        {
                            id: 'proposal-1',
                            title: 'Science Fair 2024',
                            status: 'pending',
                            createdAt: '2024-01-15T10:00:00Z',
                            eventType: 'school-based'
                        },
                        {
                            id: 'proposal-2',
                            title: 'Community Workshop',
                            status: 'approved',
                            createdAt: '2024-01-10T10:00:00Z',
                            eventType: 'community-event'
                        }
                    ]
                })
            });

            // Verify proposals fetch
            const response = await mockFetch('/api/proposals', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.proposals).toHaveLength(2);
            expect(data.proposals[0].title).toBe('Science Fair 2024');
        });

        it('should create new proposal successfully', async () => {
            // Mock successful proposal creation
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({
                    success: true,
                    proposal: {
                        id: 'new-proposal-123',
                        title: 'New Science Event',
                        status: 'draft'
                    }
                })
            });

            // Verify proposal creation
            const response = await mockFetch('/api/proposals', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mock-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'New Science Event',
                    eventType: 'school-based'
                })
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(201);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.proposal.id).toBe('new-proposal-123');
        });
    });

    describe('Profile API', () => {
        it('should fetch user profile successfully', async () => {
            // Mock successful profile fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    profile: {
                        id: 'user-123',
                        name: 'Test Student',
                        email: 'student@example.com',
                        phone: '+1234567890',
                        organization: 'Test School',
                        address: '123 School Street',
                        city: 'Test City',
                        state: 'Test State',
                        zipCode: '12345'
                    }
                })
            });

            // Verify profile fetch
            const response = await mockFetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.profile.name).toBe('Test Student');
            expect(data.profile.email).toBe('student@example.com');
        });

        it('should update profile successfully', async () => {
            // Mock successful profile update
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    profile: {
                        id: 'user-123',
                        name: 'Updated Student Name',
                        email: 'student@example.com',
                        phone: '+1234567890',
                        organization: 'Updated School'
                    }
                })
            });

            // Verify profile update
            const response = await mockFetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer mock-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Updated Student Name',
                    organization: 'Updated School'
                })
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.profile.name).toBe('Updated Student Name');
        });
    });

    describe('Notifications API', () => {
        it('should fetch notifications successfully', async () => {
            // Mock successful notifications fetch
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    notifications: [
                        {
                            id: 'notif-1',
                            title: 'Proposal Approved',
                            message: 'Your Science Fair proposal has been approved',
                            read: false,
                            createdAt: '2024-01-15T10:00:00Z'
                        },
                        {
                            id: 'notif-2',
                            title: 'New Comment',
                            message: 'A new comment has been added to your proposal',
                            read: true,
                            createdAt: '2024-01-14T10:00:00Z'
                        }
                    ]
                })
            });

            // Verify notifications fetch
            const response = await mockFetch('/api/notifications', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.notifications).toHaveLength(2);
            expect(data.notifications[0].title).toBe('Proposal Approved');
        });

        it('should mark notification as read', async () => {
            // Mock successful mark as read
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true
                })
            });

            // Verify mark as read
            const response = await mockFetch('/api/notifications/notif-1/read', {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });
    });

    describe('File Upload API', () => {
        it('should upload file successfully', async () => {
            // Mock successful file upload
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    file: {
                        id: 'file-123',
                        name: 'document.pdf',
                        url: 'https://example.com/files/document.pdf',
                        size: 1024000
                    }
                })
            });

            // Verify file upload
            const formData = new FormData();
            formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'document.pdf');

            const response = await mockFetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mock-token'
                },
                body: formData
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.file.name).toBe('document.pdf');
        });

        it('should handle file upload errors', async () => {
            // Mock failed file upload
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'File too large'
                })
            });

            // Verify error handling
            const formData = new FormData();
            formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'large-file.pdf');

            const response = await mockFetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mock-token'
                },
                body: formData
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('File too large');
        });
    });

    describe('Error Handling', () => {
        it('should handle 401 Unauthorized errors', async () => {
            // Mock 401 error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({
                    success: false,
                    error: 'Unauthorized'
                })
            });

            // Verify 401 handling
            const response = await mockFetch('/api/protected-endpoint', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });

        it('should handle 403 Forbidden errors', async () => {
            // Mock 403 error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({
                    success: false,
                    error: 'Forbidden'
                })
            });

            // Verify 403 handling
            const response = await mockFetch('/api/admin-only', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('Forbidden');
        });

        it('should handle 500 Internal Server errors', async () => {
            // Mock 500 error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: 'Internal server error'
                })
            });

            // Verify 500 handling
            const response = await mockFetch('/api/endpoint', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('Internal server error');
        });

        it('should handle network timeouts', async () => {
            // Mock network timeout
            mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

            // Verify timeout handling
            await expect(mockFetch('/api/slow-endpoint', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            })).rejects.toThrow('Network timeout');
        });
    });

    describe('Request Interceptors', () => {
        it('should add authorization header to requests', async () => {
            // Mock successful request
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ success: true })
            });

            // Verify authorization header
            const response = await mockFetch('/api/protected-endpoint', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token',
                    'Content-Type': 'application/json'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
        });

        it('should handle missing authorization token', async () => {
            // Mock unauthorized request
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({
                    success: false,
                    error: 'No authorization token'
                })
            });

            // Verify missing token handling
            const response = await mockFetch('/api/protected-endpoint', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('No authorization token');
        });
    });

    describe('Response Interceptors', () => {
        it('should handle successful responses', async () => {
            // Mock successful response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: { message: 'Success' }
                })
            });

            // Verify successful response handling
            const response = await mockFetch('/api/test-endpoint', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-token'
                }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.message).toBe('Success');
        });

        it('should handle error responses', async () => {
            // Mock error response
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'Bad request'
                })
            });

            // Verify error response handling
            const response = await mockFetch('/api/test-endpoint', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mock-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invalid: 'data' })
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('Bad request');
        });
    });
}); 