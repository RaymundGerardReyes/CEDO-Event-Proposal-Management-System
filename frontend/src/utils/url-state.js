// frontend/src/utils/url-state.js

/**
 * URL state and saved views utilities for admin proposals
 */

const STORAGE_KEY = 'proposals:savedViews';

export function readUrlState(search) {
    const params = new URLSearchParams(typeof search === 'string' ? search : (typeof window !== 'undefined' ? window.location.search : ''));
    return {
        status: params.get('status') || 'all',
        page: Number(params.get('page') || '1'),
        q: params.get('q') || '',
        sort: params.get('sort') || '',
        uuid: params.get('uuid') || null,
    };
}

export function writeUrlState(state) {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (state.status && state.status !== 'all') params.set('status', state.status);
    if (state.page && state.page > 1) params.set('page', String(state.page));
    if (state.q) params.set('q', state.q);
    if (state.sort) params.set('sort', state.sort);
    if (state.uuid) params.set('uuid', state.uuid);
    const s = params.toString();
    const url = `${window.location.pathname}${s ? `?${s}` : ''}`;
    window.history.replaceState({}, '', url);
}

export function loadSavedViews() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveView(name, state) {
    if (!name) return;
    const views = loadSavedViews().filter(v => v.name !== name);
    const next = [{ name, state, savedAt: Date.now() }, ...views].slice(0, 20);
    try { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
    return next;
}

export function deleteView(name) {
    const next = loadSavedViews().filter(v => v.name !== name);
    try { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
    return next;
}

