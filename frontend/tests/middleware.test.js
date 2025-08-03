// tests/middleware.test.js
import { NextResponse } from 'next/server';
import { middleware, UserRoles } from '../src/middleware.js';

const mockRequest = (overrides = {}) => ({
  nextUrl: { pathname: '/', origin: 'http://localhost:3000', ...overrides.nextUrl },
  cookies: { get: jest.fn(() => null), ...overrides.cookies },
  headers: overrides.headers instanceof Headers ? overrides.headers : new Headers(overrides.headers),
  ...overrides,
});

const validUser = (role = UserRoles.STUDENT, extra = {}) => ({
  user: { id: '123', role, ...extra },
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const expiredUser = (role = UserRoles.STUDENT) => ({
  user: { id: '123', role },
  exp: Math.floor(Date.now() / 1000) - 3600,
});

const encodeToken = (payload) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

describe('middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET_DEV = 'a'.repeat(32);
  });

  const roles = [
    UserRoles.HEAD_ADMIN,
    UserRoles.MANAGER,
    UserRoles.STUDENT,
    UserRoles.PARTNER,
    UserRoles.REVIEWER,
  ];

  const dashboards = {
    [UserRoles.HEAD_ADMIN]: '/admin-dashboard',
    [UserRoles.MANAGER]: '/admin-dashboard',
    [UserRoles.STUDENT]: '/student-dashboard',
    [UserRoles.PARTNER]: '/student-dashboard',
    [UserRoles.REVIEWER]: '/student-dashboard',
  };

  it.each(roles)(
    'should redirect %s from /sign-in to correct dashboard',
    async (role) => {
      const token = encodeToken(validUser(role));
      const req = mockRequest({
        nextUrl: { pathname: '/sign-in' },
        cookies: { get: () => ({ value: token }) },
      });
      const res = await middleware(req);
      const location = res?.headers?.get?.('location');
      expect(location).not.toBeNull();
      expect(location).toContain(dashboards[role]);
    }
  );

  it.each([
    [UserRoles.STUDENT, '/admin-dashboard', '/student-dashboard'],
    [UserRoles.REVIEWER, '/admin-dashboard', '/student-dashboard'],
    [UserRoles.PARTNER, '/admin-dashboard', '/student-dashboard'],
    [UserRoles.HEAD_ADMIN, '/student-dashboard', '/admin-dashboard'],
    [UserRoles.MANAGER, '/student-dashboard', '/admin-dashboard'],
  ])('should redirect %s from %s to %s', async (role, from, to) => {
    const token = encodeToken(validUser(role));
    const req = mockRequest({
      nextUrl: { pathname: from },
      cookies: { get: () => ({ value: token }) },
    });
    const res = await middleware(req);
    const location = res?.headers?.get?.('location');
    expect(location).not.toBeNull();
    expect(location).toContain(to);
  });

  it.each([
    [UserRoles.HEAD_ADMIN, '/admin-dashboard'],
    [UserRoles.STUDENT, '/student-dashboard'],
  ])('should allow %s access to %s', async (role, path) => {
    const token = encodeToken(validUser(role));
    const req = mockRequest({
      nextUrl: { pathname: path },
      cookies: { get: () => ({ value: token }) },
    });
    const res = await middleware(req);
    expect(res).toEqual(NextResponse.next());
  });

  it('should redirect expired token to sign-in', async () => {
    const token = encodeToken(expiredUser());
    const req = mockRequest({ cookies: { get: () => ({ value: token }) } });
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should redirect if token format is invalid', async () => {
    const req = mockRequest({ cookies: { get: () => ({ value: 'invalid-token' }) } });
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should redirect if token has unknown role', async () => {
    const token = encodeToken(validUser('unknown'));
    const req = mockRequest({ cookies: { get: () => ({ value: token }) } });
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should set headers for /api/ route', async () => {
    const token = encodeToken(validUser(UserRoles.STUDENT));
    const req = mockRequest({
      nextUrl: { pathname: '/api/test' },
      cookies: { get: () => ({ value: token }) },
    });
    const res = await middleware(req);
    const id = res?.headers?.get?.('x-user-id');
    const role = res?.headers?.get?.('x-user-role');
    expect(id).not.toBeNull();
    expect(id).toBe('123');
    expect(role).not.toBeNull();
    expect(role).toBe(UserRoles.STUDENT);
  });

  it('should allow malformed request object', async () => {
    const res = await middleware(null);
    expect(res).toEqual(NextResponse.next());
  });

  it('should redirect if no token present', async () => {
    const req = mockRequest();
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should return 500 if JWT secret is missing', async () => {
    process.env.JWT_SECRET_DEV = '';
    const req = mockRequest();
    const res = await middleware(req);
    expect(res.status).toBe(500);
  });

  it('should return 500 if JWT secret is too short', async () => {
    process.env.JWT_SECRET_DEV = 'short';
    const req = mockRequest();
    const res = await middleware(req);
    expect(res.status).toBe(500);
  });

  it('should allow prefetch request', async () => {
    const req = mockRequest({ headers: { get: () => 'prefetch' } });
    const res = await middleware(req);
    expect(res).toEqual(NextResponse.next());
  });

  it('should allow static asset request', async () => {
    const req = mockRequest({ nextUrl: { pathname: '/next/static/file.js' } });
    const res = await middleware(req);
    expect(res).toEqual(NextResponse.next());
  });

  it('should allow public path request', async () => {
    const req = mockRequest({ nextUrl: { pathname: '/sign-in' } });
    const res = await middleware(req);
    expect(res).toEqual(NextResponse.next());
  });

  it('should fallback to sign-in on middleware error', async () => {
    const req = mockRequest();
    req.nextUrl = null;
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should redirect if token has no user object', async () => {
    const token = encodeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const req = mockRequest({ cookies: { get: () => ({ value: token }) } });
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should redirect if user has no role', async () => {
    const token = encodeToken({ user: { id: '123' }, exp: Math.floor(Date.now() / 1000) + 3600 });
    const req = mockRequest({ cookies: { get: () => ({ value: token }) } });
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/sign-in');
  });

  it('should use custom dashboard if provided', async () => {
    const token = encodeToken(validUser(UserRoles.STUDENT, { dashboard: '/custom-dashboard' }));
    const req = mockRequest({
      nextUrl: { pathname: '/' },
      cookies: { get: () => ({ value: token }) },
    });
    const res = await middleware(req);
    expect(res?.headers?.get?.('location')).toContain('/custom-dashboard');
  });
});
