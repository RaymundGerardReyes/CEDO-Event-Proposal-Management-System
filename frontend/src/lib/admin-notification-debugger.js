/**
 * Admin Notification Debugger
 * Purpose: Trace why admin sees "No notifications" by checking token, role, and API responses.
 * Auto-runs in development on admin dashboard routes without changing app behavior.
 */

function getToken() {
    try {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('cedo_token='))
            ?.split('=')[1] || null;
    } catch (_) { return null; }
}

function decodeJwt(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload || {};
    } catch (_) { return {}; }
}

async function getBackendUrl() {
    try {
        const { getAppConfig } = await import('@/lib/utils');
        const cfg = getAppConfig();
        let url = cfg?.backendUrl || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        if (url.endsWith('/api')) url = url.replace(/\/api$/, '');
        return url;
    } catch (_) {
        return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    }
}

async function fetchJson(url, token) {
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        cache: 'no-store'
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* keep text */ }
    return { status: res.status, ok: res.ok, data, text };
}

export default class AdminNotificationDebugger {
    async run() {
        try {
            console.group('[AdminNotificationDebugger]');
            const token = getToken();
            console.log('token present:', !!token);
            if (!token) { console.warn('No token found'); console.groupEnd(); return; }

            const payload = decodeJwt(token);
            console.log('jwt payload (subset):', {
                sub: payload.sub || payload.userId,
                role: payload.role,
                exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
            });

            const base = await getBackendUrl();
            console.log('backend base:', base);

            // Try main endpoints in sequence
            const urls = [
                `${base}/api/notifications?`,
                `${base}/api/notifications?unreadOnly=true`,
                `${base}/api/notifications/unread-count`,
                `${base}/api/notifications/stats`
            ];

            for (const url of urls) {
                const res = await fetchJson(url, token);
                console.log('GET', url.replace(base, ''), '→', { status: res.status, ok: res.ok, hasData: !!res.data });
                if (res.data && res.data.success) {
                    if (Array.isArray(res.data.data)) {
                        console.log('items:', res.data.data.length, 'first:', res.data.data[0] || null);
                    } else {
                        console.log('payload:', res.data.data);
                    }
                } else if (res.text) {
                    console.warn('body:', res.text);
                }
            }

            // Heuristics
            console.log('heuristic checks:');
            console.log('- If arrays are empty but stats/unread show >0 → filtering on client/UI.');
            console.log('- If everything is empty with 200/304 → role mismatch or all notifications hidden/expired.');
            console.log('- Ensure target_role matches users.role and excluded_user_ids is null for admin user.');

            console.groupEnd();
        } catch (e) {
            console.error('[AdminNotificationDebugger] error:', e);
        }
    }
}

// Auto-run in development on admin dashboard routes
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    try {
        if (location.pathname.startsWith('/admin-dashboard')) {
            const dbg = new AdminNotificationDebugger();
            dbg.run();
        }
    } catch (_) { }
}


