// Tests for /api/auth/me endpoint
// Purpose: Ensure /api/auth/me returns user info for authenticated requests and 401 for unauthenticated requests.
// Approach: Use Vitest and supertest to simulate requests, mock cookies and JWT as needed.

import * as nextHeaders from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../src/app/api/auth/me/route.js';

vi.mock('next/headers');
vi.mock('jose', () => ({
    jwtVerify: async (token, secret) => {
        if (token === mockToken) {
            return { payload: { user: mockUser } };
        }
        throw new Error('Invalid token');
    },
}));

const mockUser = { id: '123', role: 'admin', email: 'test@example.com' };
const mockToken = 'mock.jwt.token';


describe('/api/auth/me', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns user info for valid token in cookie', async () => {
        // Mock cookies
        nextHeaders.cookies.mockReturnValue({
            get: (name) => (name === 'cedo_token' ? { value: mockToken } : undefined),
        });
        // Mock request headers
        const req = { headers: new Map() };
        const res = await GET(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.id).toBe(mockUser.id);
        expect(data.role).toBe(mockUser.role);
        expect(data.email).toBe(mockUser.email);
    });

    it('returns 401 if no token is present', async () => {
        nextHeaders.cookies.mockReturnValue({ get: () => undefined });
        const req = { headers: new Map() };
        const res = await GET(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/No authentication token/);
    });

    it('returns 401 for invalid token', async () => {
        nextHeaders.cookies.mockReturnValue({ get: () => ({ value: 'bad.token' }) });
        const req = { headers: new Map() };
        const res = await GET(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/Invalid authentication token/);
    });
}); 