const express = require('express');
const router = express.Router();

const { getDb, pool } = require('./helpers');

// 📋 Get user proposals + embedded files
router.get('/user-proposals/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        const db = await getDb();

        const proposals = await db
            .collection('proposals')
            .aggregate([
                {
                    $lookup: {
                        from: 'organizations',
                        localField: 'organizationId',
                        foreignField: '_id',
                        as: 'organization',
                    },
                },
                {
                    $lookup: {
                        from: 'accomplishment_reports',
                        localField: '_id',
                        foreignField: 'proposalId',
                        as: 'reports',
                    },
                },
                { $match: { 'organization.contactEmail': userEmail } },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        _id: 1,
                        eventName: 1,
                        proposalStatus: 1,
                        eventType: 1,
                        startDate: 1,
                        endDate: 1,
                        files: 1,
                        organization: { $arrayElemAt: ['$organization', 0] },
                        reportStatus: {
                            $ifNull: [{ $arrayElemAt: ['$reports.reportStatus', 0] }, 'not_submitted'],
                        },
                        createdAt: 1,
                    },
                },
            ])
            .toArray();

        res.json({ success: true, proposals });
    } catch (err) {
        console.error('Error fetching user proposals:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 📝 List draft proposals stored in MySQL (status = draft)
router.get('/proposals/drafts/:email', async (req, res) => {
    try {
        const contactEmail = req.params.email;
        if (!contactEmail) return res.status(400).json({ success: false, error: 'email param required' });

        const query = `
      SELECT id, organization_name, contact_email, organization_type, updated_at, created_at, proposal_status
      FROM proposals
      WHERE contact_email = ? AND proposal_status = 'draft'
      ORDER BY updated_at DESC
    `;

        const [rows] = await pool.query(query, [contactEmail]);

        const drafts = rows.map((row) => ({
            id: row.id,
            name: row.organization_name || 'Untitled Draft',
            lastEdited: row.updated_at || row.created_at,
            step: 'orgInfo',
            progress: 40,
            data: {
                organizationName: row.organization_name,
                organizationTypes: [row.organization_type || 'school-based'],
                contactEmail: row.contact_email,
            },
        }));

        res.json({ success: true, drafts });
    } catch (err) {
        console.error('Error fetching drafts:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router; 