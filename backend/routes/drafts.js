const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

/**
 * TEMPORARY STUB ROUTES  (replace with real MySQL logic later)
 * -----------------------------------------------------------
 * These endpoints simply keep an in-memory map so the Next.js
 * frontend can proceed while the full Draft table / validation
 * layer is still under development.
 */
const DRAFT_CACHE = new Map();

// POST /api/proposals/drafts  →  create new draft
router.post('/proposals/drafts', (req, res) => {
    const draftId = uuidv4();
    DRAFT_CACHE.set(draftId, { draftId, payload: {}, createdAt: Date.now() });
    console.log('📝  Draft created:', draftId);
    res.json({ draftId });
});

// GET /api/proposals/drafts/:id  →  fetch a draft
router.get('/proposals/drafts/:id', (req, res) => {
    const draft = DRAFT_CACHE.get(req.params.id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    res.json(draft);
});

// PATCH /api/proposals/drafts/:id/:section  →  partial update
router.patch('/proposals/drafts/:id/:section', (req, res) => {
    const { id, section } = req.params;
    const draft = DRAFT_CACHE.get(id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    draft.payload[section] = req.body;
    draft.updatedAt = Date.now();
    DRAFT_CACHE.set(id, draft);
    res.json({ success: true });
});

// POST /api/proposals/drafts/:id/submit  →  final submit (stub)
router.post('/proposals/drafts/:id/submit', (req, res) => {
    const draft = DRAFT_CACHE.get(req.params.id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    draft.status = 'submitted';
    res.json({ success: true });
});

module.exports = router; 