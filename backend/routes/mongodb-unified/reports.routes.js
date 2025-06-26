const express = require('express');
const { Binary } = require('mongodb');
const router = express.Router();

const {
    getDb,
    upload,
    toObjectId,
    uploadToGridFS,
    pool,
} = require('./helpers');

// 📊 SECTION 5: Save Accomplishment Report with File Metadata
router.post('/accomplishment-reports', upload.single('accomplishmentReport'), async (req, res) => {
    try {
        const fileMeta = {};
        if (req.file) {
            const orgName = req.body.organization_name || 'Unknown';
            fileMeta.accomplishmentReport = await uploadToGridFS(req.file, 'AR', orgName);
        }

        const db = await getDb();
        const reportData = {
            proposalId: toObjectId(req.body.proposal_id),
            description: req.body.description,
            attendanceCount: parseInt(req.body.attendance_count),
            eventStatus: req.body.event_status,
            files: fileMeta,
            digitalSignature: req.body.signature,
            reportStatus: 'pending',
            adminComments: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            submittedAt: new Date(),
        };

        const result = await db.collection('accomplishment_reports').insertOne(reportData);
        res.json({ success: true, id: result.insertedId, message: 'Report saved', files: fileMeta });
    } catch (err) {
        console.error('Error saving report:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ------------------------------------------------------------------
// UNIFIED SECTION 5 REPORTING (MySQL + MongoDB files)
// ------------------------------------------------------------------
const memoryUpload = upload; // Re-use same in-memory configuration

router.post('/section5-reporting', memoryUpload.fields([
    { name: 'accomplishment_report_file', maxCount: 1 },
    { name: 'pre_registration_file', maxCount: 1 },
    { name: 'final_attendance_file', maxCount: 1 },
]), async (req, res) => {
    const {
        proposal_id,
        event_status,
        event_venue,
        report_description,
        attendance_count,
        organization_name,
        event_start_date,
        event_end_date,
    } = req.body;

    if (!proposal_id) return res.status(400).json({ success: false, error: 'proposal_id is required' });

    let connection;
    try {
        connection = await pool.getConnection();
        // Verify proposal exists
        const [proposalRows] = await connection.query('SELECT id, organization_name FROM proposals WHERE id = ?', [proposal_id]);
        if (proposalRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Proposal not found' });
        }

        // Upload files to MongoDB
        const db = await getDb();
        const fileMetadata = {};
        if (req.files) {
            const fileUploadsCollection = db.collection('file_uploads');
            for (const [fieldName, files] of Object.entries(req.files)) {
                if (!files || !files[0]) continue;
                const file = files[0];
                const typeShort = fieldName.replace('_file', '').replace('_', '');
                const timestamp = Date.now();
                const orgSlug = (organization_name || proposalRows[0].organization_name || 'unknown').replace(/\s+/g, '_');
                const uniqueFilename = `${orgSlug}_${typeShort}_${timestamp}${require('path').extname(file.originalname)}`;

                const doc = {
                    filename: uniqueFilename,
                    originalName: file.originalname,
                    data: new Binary(file.buffer),
                    mimetype: file.mimetype,
                    size: file.size,
                    proposal_id: parseInt(proposal_id),
                    upload_type: typeShort,
                    created_at: new Date(),
                };
                const result = await fileUploadsCollection.insertOne(doc);
                fileMetadata[fieldName] = { mongoId: result.insertedId.toString(), originalName: file.originalname, size: file.size };
            }
        }

        // Update MySQL metadata
        const updateQuery = `UPDATE proposals SET event_status = ?, event_venue = ?, event_start_date = ?, event_end_date = ?, report_description = ?, attendance_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        await connection.query(updateQuery, [event_status || null, event_venue || null, event_start_date || null, event_end_date || null, report_description || null, attendance_count ? parseInt(attendance_count) : null, proposal_id]);

        res.json({ success: true, message: 'Section 5 data saved', files_uploaded: fileMetadata });
    } catch (err) {
        console.error('Section5 reporting error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// ------------------------------------------------------------------
// GET full proposal (MySQL + MongoDB files)
// ------------------------------------------------------------------
router.get('/proposal/:id', async (req, res) => {
    const proposalId = req.params.id;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Proposal not found' });

        const db = await getDb();
        const files = {};
        const fileUploads = await db.collection('file_uploads').find({ proposal_id: parseInt(proposalId) }).toArray();
        fileUploads.forEach((f) => {
            files[f.upload_type] = {
                id: f._id.toString(),
                filename: f.filename,
                originalName: f.originalName,
                size: f.size,
                mimetype: f.mimetype,
                created_at: f.created_at,
            };
        });

        res.json({ success: true, proposal: rows[0], files, has_files: Object.keys(files).length > 0 });
    } catch (err) {
        console.error('Error fetching proposal:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// ------------------------------------------------------------------
// Download file by fileId directly from MongoDB
// ------------------------------------------------------------------
router.get('/file/:fileId', async (req, res) => {
    try {
        const db = await getDb();
        const { ObjectId } = require('mongodb');
        const file = await db.collection('file_uploads').findOne({ _id: new ObjectId(req.params.fileId) });
        if (!file) return res.status(404).json({ success: false, error: 'File not found' });
        res.set({ 'Content-Type': file.mimetype, 'Content-Disposition': `attachment; filename="${file.originalName}"`, 'Content-Length': file.size });
        res.send(file.data.buffer);
    } catch (err) {
        console.error('File download error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router; 