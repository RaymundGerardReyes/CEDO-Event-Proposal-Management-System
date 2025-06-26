const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const {
    getDb,
    upload,
    uploadToGridFS,
    path,
    fs,
    fsPromises,
    uploadsDir,
    pool,
} = require('./helpers');

// ------------------------------------------------------------------
// FILE UPLOAD – links files to MySQL proposal via proposalId field
// ------------------------------------------------------------------
router.post(
    '/proposals/files',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
        { name: 'accomplishmentReport', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const db = getDb();
            const { proposal_id, organization_name = 'Unknown' } = req.body;

            if (!proposal_id) {
                return res.status(400).json({ success: false, error: 'proposal_id is required' });
            }

            const fileMetadata = {};
            if (req.files.gpoaFile) {
                fileMetadata.gpoa = await uploadToGridFS(req.files.gpoaFile[0], 'gpoa', organization_name);
            }
            if (req.files.proposalFile) {
                fileMetadata.proposal = await uploadToGridFS(
                    req.files.proposalFile[0],
                    'proposal',
                    organization_name,
                );
            }
            if (req.files.accomplishmentReport) {
                fileMetadata.accomplishmentReport = await uploadToGridFS(
                    req.files.accomplishmentReport[0],
                    'AR',
                    organization_name,
                );
            }

            const record = {
                proposalId: proposal_id,
                organizationName: organization_name,
                files: fileMetadata,
                uploadedAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await db.collection('proposal_files').insertOne(record);

            res.json({ success: true, id: result.insertedId, message: 'Files uploaded', files: fileMetadata });
        } catch (err) {
            console.error('Error uploading files:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    },
);

// ------------------------------------------------------------------
// LEGACY STATIC DOWNLOAD (plain filesystem)
// ------------------------------------------------------------------
router.get('/files/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        return res.download(filePath);
    }
    return res.status(404).json({ success: false, error: 'File not found' });
});

// ------------------------------------------------------------------
// GRIDFS DOWNLOADS (hybrid – works with MySQL proposal IDs)
// ------------------------------------------------------------------
const validFileTypes = ['gpoa', 'proposal'];

router.get('/proposals/download/:proposalId/:fileType', async (req, res) => {
    try {
        const { proposalId, fileType } = req.params;
        if (!validFileTypes.includes(fileType)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        const db = await getDb();

        // First, try MongoDB GridFS
        let fileRecord = await db.collection('proposal_files').findOne({ proposalId: proposalId.toString() });

        if (!fileRecord) {
            // Fallback: look inside proposals.files (embedded metadata)
            const mainDoc = await db.collection('proposals').findOne({ organizationId: proposalId.toString() });
            if (mainDoc && mainDoc.files && mainDoc.files[fileType]) {
                fileRecord = { files: { [fileType]: mainDoc.files[fileType] } };
            }
        }

        // If found in MongoDB, stream from GridFS
        if (fileRecord && fileRecord.files && fileRecord.files[fileType]) {
            const meta = fileRecord.files[fileType];

            // Stream from GridFS
            const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'proposal_files' });
            const docArr = await bucket.find({ filename: meta.filename }).toArray();
            if (!docArr || docArr.length === 0) {
                return res.status(404).json({ success: false, error: 'File not found in GridFS storage' });
            }

            const fileDoc = docArr[0];
            res.set({
                'Content-Type': meta.mimeType || 'application/octet-stream',
                'Content-Length': fileDoc.length,
                'Content-Disposition': `attachment; filename="${meta.originalName || fileDoc.filename}"`,
            });

            bucket.openDownloadStreamByName(meta.filename)
                .on('error', (e) => {
                    console.error('GridFS stream error:', e);
                    if (!res.headersSent) res.status(500).json({ error: 'Error streaming file' });
                })
                .pipe(res);
            return;
        }

        // If not found in MongoDB, try MySQL file paths
        console.log(`🔍 File not found in MongoDB, checking MySQL for proposal ${proposalId}, file type ${fileType}`);

        const [mysqlRows] = await pool.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);
        if (mysqlRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Proposal not found' });
        }

        const proposal = mysqlRows[0];
        let filePath = null;
        let fileName = null;

        // Map file types to MySQL columns
        switch (fileType) {
            case 'gpoa':
                filePath = proposal.school_gpoa_file_path || proposal.community_gpoa_file_path;
                fileName = proposal.school_gpoa_file_name || proposal.community_gpoa_file_name;
                break;
            case 'proposal':
                filePath = proposal.school_proposal_file_path || proposal.community_proposal_file_path;
                fileName = proposal.school_proposal_file_name || proposal.community_proposal_file_name;
                break;
        }

        if (!filePath || !fileName) {
            return res.status(404).json({
                success: false,
                error: `No ${fileType} file found for this proposal. Files may not have been uploaded yet.`
            });
        }

        // Check if file exists on filesystem
        const fullPath = path.resolve(filePath);
        try {
            await fsPromises.access(fullPath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: `File not found on server. The file may have been moved or deleted.`
            });
        }

        // Send file
        res.download(fullPath, fileName);

    } catch (err) {
        console.error('Download error:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

// Simple file-info endpoint
router.get('/proposals/file-info/:proposalId/:fileType', async (req, res) => {
    const { proposalId, fileType } = req.params;
    const db = await getDb();
    const record = await db.collection('proposal_files').findOne({ proposalId: proposalId.toString() });
    if (!record) return res.status(404).json({ error: 'No files for proposal' });
    if (!record.files[fileType]) return res.status(404).json({ error: 'File type not found' });
    res.json({ success: true, fileInfo: record.files[fileType] });
});

// List files (lightweight)
router.get('/proposals/files/:proposalId', async (req, res) => {
    const db = await getDb();
    const record = await db.collection('proposal_files').findOne({ proposalId: req.params.proposalId.toString() });
    if (!record) return res.status(404).json({ error: 'No files found', files: {} });
    res.json({ success: true, files: record.files, proposalId: req.params.proposalId });
});

// Legacy alias to avoid 404s
router.get('/proposals/files/download-legacy/:proposalId/:fileType', (req, res, next) => {
    req.url = `/proposals/download/${req.params.proposalId}/${req.params.fileType}`;
    next();
});

module.exports = router; 