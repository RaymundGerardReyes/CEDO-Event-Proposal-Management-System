const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { query } = require('../config/database-postgresql-only');

/**
 * ENHANCED DRAFT MANAGEMENT ROUTES
 * --------------------------------
 * UUID-based draft system with proper postgresql/postgresql integration
 * Handles both UUID and descriptive draft IDs with migration
 */
const DRAFT_CACHE = new Map();

// POST /api/proposals/drafts  →  create new UUID-based draft
router.post('/proposals/drafts', (req, res) => {
    const { eventType = 'school-based', originalDescriptiveId } = req.body;
    const draftId = uuidv4();

    const newDraft = {
        draftId,
        form_data: {
            proposalStatus: 'draft',
            organizationType: eventType,
            eventType: eventType,
            selectedEventType: eventType,
            validationErrors: {},
            currentSection: 'overview',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            // Store original descriptive ID for migration tracking
            originalDescriptiveId: originalDescriptiveId || null
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'draft'
    };

    DRAFT_CACHE.set(draftId, newDraft);
    console.log('📝 UUID Draft created:', { draftId, eventType, originalDescriptiveId });

    res.json({
        success: true,
        draftId,
        eventType,
        status: 'draft',
        message: 'UUID-based draft created successfully'
    });
});

// GET /api/proposals/drafts/:id  →  fetch a draft (handles both UUID and descriptive IDs)
router.get('/proposals/drafts/:id', (req, res) => {
    const draftId = req.params.id;
    let draft = DRAFT_CACHE.get(draftId);

    // Check if it's a UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draftId);

    if (!draft) {
        console.log('❌ Draft not found:', draftId);

        // Handle descriptive draft IDs by creating UUID-based drafts
        if (!isUUID && (draftId.includes('-event') || draftId.includes('community') || draftId.includes('school'))) {
            console.log('🔧 Creating UUID-based draft for descriptive ID:', draftId);

            // Determine event type from the descriptive ID
            const isSchoolEvent = draftId.includes('school') || draftId.includes('school-event');
            const isCommunityEvent = draftId.includes('community') || draftId.includes('community-event');
            const eventType = isSchoolEvent ? 'school-based' : 'community-based';

            // Create a proper UUID-based draft
            const newDraftId = uuidv4();
            draft = {
                draftId: newDraftId,
                form_data: {
                    proposalStatus: 'draft',
                    organizationType: eventType,
                    eventType: eventType,
                    selectedEventType: eventType,
                    validationErrors: {},
                    currentSection: 'overview',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    originalDescriptiveId: draftId // Track the original descriptive ID
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'draft'
            };

            // Store the new UUID-based draft
            DRAFT_CACHE.set(newDraftId, draft);
            console.log('✅ UUID-based draft created from descriptive ID:', { originalId: draftId, newId: newDraftId });

            // Return the new UUID-based draft
            return res.json({
                ...draft,
                migratedFrom: draftId,
                message: 'Draft migrated from descriptive ID to UUID'
            });
        } else if (!isUUID) {
            // For non-descriptive, non-UUID IDs, return 404
            return res.status(404).json({
                error: 'Draft not found',
                message: 'Invalid draft ID format. Expected UUID or descriptive event ID.'
            });
        } else {
            // For UUIDs that don't exist, return 404
            return res.status(404).json({
                error: 'Draft not found',
                message: 'UUID-based draft not found'
            });
        }
    }

    console.log('📖 Draft fetched:', { draftId, isUUID, status: draft.status });
    res.json(draft);
});

// PATCH /api/proposals/drafts/:id/:section  →  partial update with UUID validation
router.patch('/proposals/drafts/:id/:section', (req, res) => {
    const { id, section } = req.params;
    let draft = DRAFT_CACHE.get(id);

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (!draft) {
        console.log('❌ Draft not found for update:', id);

        // Handle descriptive draft IDs by creating UUID-based drafts
        if (!isUUID && (id.includes('-event') || id.includes('community') || id.includes('school'))) {
            console.log('🔧 Creating UUID-based draft for descriptive ID during update:', id);

            const isSchoolEvent = id.includes('school') || id.includes('school-event');
            const isCommunityEvent = id.includes('community') || id.includes('community-event');
            const eventType = isSchoolEvent ? 'school-based' : 'community-based';

            const newDraftId = uuidv4();
            draft = {
                draftId: newDraftId,
                form_data: {
                    proposalStatus: 'draft',
                    organizationType: eventType,
                    eventType: eventType,
                    selectedEventType: eventType,
                    validationErrors: {},
                    currentSection: section,
                    originalDescriptiveId: id
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'draft'
            };

            DRAFT_CACHE.set(newDraftId, draft);
            console.log('✅ New UUID-based draft created for update:', { originalId: id, newId: newDraftId });
        } else {
            return res.status(404).json({
                error: 'Draft not found',
                message: 'Invalid draft ID format or draft does not exist'
            });
        }
    }

    // Ensure form_data exists
    if (!draft.form_data) {
        draft.form_data = {
            proposalStatus: 'draft',
            validationErrors: {},
            currentSection: section
        };
    }

    // Update the section data
    draft.form_data[section] = req.body;
    draft.updatedAt = Date.now();
    DRAFT_CACHE.set(id, draft);

    console.log(`✅ Draft section updated: ${id}/${section}`);
    res.json({
        success: true,
        draft,
        message: 'Section updated successfully'
    });
});

// POST /api/proposals/drafts/:id/event-type  →  save event type selection (enhanced for UUIDs)
router.post('/proposals/drafts/:id/event-type', (req, res) => {
    const { id } = req.params;
    const { eventType } = req.body;

    console.log('🎯 Saving event type selection for draft:', { id, eventType });

    if (!eventType || !['school-based', 'community-based'].includes(eventType)) {
        return res.status(400).json({
            error: 'Invalid event type. Must be "school-based" or "community-based"'
        });
    }

    let draft = DRAFT_CACHE.get(id);

    if (!draft) {
        console.log('🔧 Creating new UUID-based draft for event type selection:', id);

        const newDraftId = uuidv4();
        draft = {
            draftId: newDraftId,
            form_data: {
                proposalStatus: 'draft',
                organizationType: eventType,
                eventType: eventType,
                selectedEventType: eventType,
                validationErrors: {},
                currentSection: 'event-type',
                originalDescriptiveId: id
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'draft'
        };

        DRAFT_CACHE.set(newDraftId, draft);
        console.log('✅ New UUID-based draft created for event type selection:', newDraftId);
    } else {
        // Update existing draft
        if (!draft.form_data) {
            draft.form_data = {
                proposalStatus: 'draft',
                organizationType: eventType,
                eventType: eventType,
                selectedEventType: eventType,
                validationErrors: {},
                currentSection: 'event-type'
            };
        } else {
            draft.form_data.eventType = eventType;
            draft.form_data.selectedEventType = eventType;
            draft.form_data.organizationType = eventType;
        }

        draft.updatedAt = Date.now();
        DRAFT_CACHE.set(id, draft);
        console.log('✅ Existing draft updated with event type:', id);
    }

    console.log('✅ Event type selection saved successfully:', {
        draftId: draft.draftId,
        eventType: eventType,
        status: draft.status
    });

    res.json({
        success: true,
        eventType,
        draftId: draft.draftId,
        status: draft.status,
        message: 'Event type saved successfully'
    });
});

// PATCH /api/proposals/drafts/:id  →  full draft update (enhanced for UUIDs)
router.patch('/proposals/drafts/:id', (req, res) => {
    const { id } = req.params;
    const draft = DRAFT_CACHE.get(id);

    if (!draft) {
        console.log('❌ Draft not found for full update:', id);
        return res.status(404).json({
            error: 'Draft not found',
            message: 'UUID-based draft not found for full update'
        });
    }

    // Update the entire draft
    Object.assign(draft, req.body);
    draft.updatedAt = Date.now();
    DRAFT_CACHE.set(id, draft);

    console.log(`✅ Draft fully updated: ${id}`);
    res.json({
        success: true,
        draft,
        message: 'Draft updated successfully'
    });
});

// POST /api/proposals/drafts/:id/submit  →  final submit (simplified)
router.post('/proposals/drafts/:id/submit', (req, res) => {
    const draftId = req.params.id;
    const draft = DRAFT_CACHE.get(draftId);

    if (!draft) {
        console.log('❌ Draft not found for submission:', draftId);
        return res.status(404).json({
            error: 'Draft not found',
            message: 'Draft not found for submission'
        });
    }

    // Draft exists in cache, proceed with submission
    draft.status = 'submitted';
    draft.submittedAt = Date.now();
    DRAFT_CACHE.set(draftId, draft);

    console.log(`✅ Draft submitted: ${draftId}`);
    res.json({
        success: true,
        draft,
        message: 'Draft submitted successfully'
    });
});

// DELETE /api/proposals/drafts/:id  →  delete draft (enhanced for UUIDs)
router.delete('/proposals/drafts/:id', (req, res) => {
    const { id } = req.params;
    const deleted = DRAFT_CACHE.delete(id);

    if (!deleted) {
        console.log('❌ Draft not found for deletion:', id);
        return res.status(404).json({
            error: 'Draft not found',
            message: 'UUID-based draft not found for deletion'
        });
    }

    console.log(`🗑️ UUID-based draft deleted: ${id}`);
    res.json({
        success: true,
        message: 'Draft deleted successfully'
    });
});

// GET /api/proposals/drafts  →  list all drafts (enhanced for UUIDs)
router.get('/proposals/drafts', (req, res) => {
    const drafts = Array.from(DRAFT_CACHE.values());
    const uuidDrafts = drafts.filter(d => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.draftId));
    const descriptiveDrafts = drafts.filter(d => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.draftId));

    console.log(`📋 Listing drafts: ${uuidDrafts.length} UUID-based, ${descriptiveDrafts.length} descriptive`);
    res.json({
        drafts,
        count: drafts.length,
        uuidCount: uuidDrafts.length,
        descriptiveCount: descriptiveDrafts.length,
        message: 'Drafts listed successfully'
    });
});

module.exports = router;
module.exports = router;