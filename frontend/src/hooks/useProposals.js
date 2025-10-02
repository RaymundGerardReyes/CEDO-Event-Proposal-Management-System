// frontend/src/hooks/useProposals.js

/**
 * useProposals
 * Client-side data orchestration for admin proposals:
 * - caching and stale time
 * - pagination, filters, search, sort
 * - optional focused uuid
 * - modal controls for details
 * - URL state sync (tab/search/page/sort/filters)
 */

import { approveProposal, bulkApprove, bulkDeny, denyProposal, fetchProposalByUuid, fetchProposals as svcFetch } from '@/services/admin-proposals.service';
import { normalizeProposal } from '@/utils/proposals';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_LIMIT = 10;
const STALE_MS = 30_000;

function useStableRef(value) {
    const ref = useRef(value);
    useEffect(() => void (ref.current = value), [value]);
    return ref;
}

function parseUrlState(searchParams) {
    const params = new URLSearchParams(searchParams);
    return {
        status: params.get('status') || 'all',
        page: Number(params.get('page') || '1'),
        search: params.get('q') || '',
        sort: params.get('sort') || '',
        uuid: params.get('uuid') || null,
    };
}

function serializeUrlState({ status, page, search, sort, uuid }) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (page && page > 1) params.set('page', String(page));
    if (search) params.set('q', search);
    if (sort) params.set('sort', sort);
    if (uuid) params.set('uuid', uuid);
    const s = params.toString();
    return s ? `?${s}` : '';
}

export function useProposals(initial = {}) {
    const [status, setStatus] = useState(initial.status || 'all');
    const [page, setPage] = useState(initial.page || 1);
    const [limit, setLimit] = useState(initial.limit || DEFAULT_LIMIT);
    const [search, setSearch] = useState(initial.search || '');
    const [sort, setSort] = useState(initial.sort || '');
    const [uuid, setUuid] = useState(initial.uuid || null);

    const [proposals, setProposals] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetchedAt, setLastFetchedAt] = useState(0);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const cacheRef = useRef(new Map());
    const isFetchingRef = useRef(false);

    // URL sync (client only)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const state = parseUrlState(window.location.search);
        setStatus(state.status);
        setPage(state.page);
        setSearch(state.search);
        setSort(state.sort);
        setUuid(state.uuid);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const s = serializeUrlState({ status, page, search, sort, uuid });
        const newUrl = `${window.location.pathname}${s}`;
        window.history.replaceState({}, '', newUrl);
    }, [status, page, search, sort, uuid]);

    const cacheKey = useMemo(() => JSON.stringify({ status, page, limit, search, sort, uuid }), [status, page, limit, search, sort, uuid]);

    const refetch = useCallback(async (force = false) => {
        if (isFetchingRef.current) return;
        const now = Date.now();
        const cached = cacheRef.current.get(cacheKey);
        if (!force && cached && now - cached.fetchedAt < STALE_MS) {
            setProposals(cached.data.proposals);
            setPagination(cached.data.pagination);
            return;
        }

        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const resp = await svcFetch({ page, limit, status: status === 'all' ? undefined : status, search, sort, uuid });
            if (!resp.success) throw new Error(resp.error || 'Failed to fetch proposals');
            setProposals(resp.proposals.map(normalizeProposal));
            setPagination(resp.pagination || { currentPage: page, totalPages: 1, totalCount: resp.proposals.length, limit });
            setLastFetchedAt(now);
            cacheRef.current.set(cacheKey, { data: resp, fetchedAt: now });
        } catch (e) {
            setError(e.message || String(e));
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [cacheKey, page, limit, status, search, sort, uuid]);

    useEffect(() => { refetch(false); }, [refetch]);

    const openDetailsModal = useCallback(async (target) => {
        const id = typeof target === 'string' ? target : target?.uuid || target?.id;
        if (!id) return;
        setUuid(String(id));
        setDetailsOpen(true);
        try {
            const resp = await fetchProposalByUuid(id);
            if (resp?.proposal) setSelected(resp.proposal);
        } catch {
            // ignore; UI already has list data
        }
    }, []);

    const closeDetailsModal = useCallback(() => {
        setDetailsOpen(false);
        setUuid(null);
        setSelected(null);
    }, []);

    const updateStatus = useCallback(async (idOrUuid, nextStatus, adminComments) => {
        const prev = proposals;
        // optimistic update
        setProposals(prev.map(p => (p.uuid === idOrUuid || String(p.id) === String(idOrUuid)) ? { ...p, status: nextStatus } : p));
        try {
            const resp = nextStatus === 'approved' ? await approveProposal(idOrUuid, adminComments) : await denyProposal(idOrUuid, adminComments);
            if (!resp.success) throw new Error(resp.error || 'Status update failed');
            // merge server version
            setProposals(list => list.map(p => (p.uuid === idOrUuid || String(p.id) === String(idOrUuid)) ? resp.proposal || p : p));
        } catch (e) {
            // rollback on error
            setProposals(prev);
            throw e;
        }
    }, [proposals]);

    const updateStatusBulk = useCallback(async (idsOrUuids = [], nextStatus, adminComments) => {
        const prev = proposals;
        setProposals(prev.map(p => idsOrUuids.includes(p.uuid) || idsOrUuids.includes(String(p.id)) ? { ...p, status: nextStatus } : p));
        try {
            const resp = nextStatus === 'approved' ? await bulkApprove(idsOrUuids, adminComments) : await bulkDeny(idsOrUuids, adminComments);
            if (!resp.success) throw new Error(resp.error || 'Bulk status update failed');
            // merge server versions by uuid
            const byId = new Map((resp.results || []).map(p => [p.uuid, p]));
            setProposals(list => list.map(p => byId.get(p.uuid) || p));
        } catch (e) {
            setProposals(prev);
            throw e;
        }
    }, [proposals]);

    return {
        // state
        proposals,
        pagination,
        loading,
        error,
        status,
        page,
        limit,
        search,
        sort,
        uuid,
        detailsOpen,
        selected,

        // actions
        setStatus,
        setPage,
        setLimit,
        setSearch,
        setSort,
        refetch,
        openDetailsModal,
        closeDetailsModal,
        approve: (id, comments) => updateStatus(id, 'approved', comments),
        deny: (id, comments) => updateStatus(id, 'denied', comments),
        bulkApprove: (ids, comments) => updateStatusBulk(ids, 'approved', comments),
        bulkDeny: (ids, comments) => updateStatusBulk(ids, 'denied', comments),
        lastFetchedAt,
    };
}

export default useProposals;

