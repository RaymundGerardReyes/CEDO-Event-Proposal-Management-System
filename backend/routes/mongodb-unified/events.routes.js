const express = require('express');
const router = express.Router();

const {
    getDb,
    upload,
    toObjectId,
    uploadToGridFS,
    pool,
} = require('./helpers');

// Import data sync service
const dataSyncService = require('../../services/data-sync.service');

// 🏫 SECTION 3: Save School Event with File Metadata
router.post(
    '/proposals/school-events',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            console.log('🏫 MONGODB SECTION 3: ==================== SCHOOL EVENT SAVE REQUEST ====================');
            console.log('🏫 MONGODB SECTION 3: Request method:', req.method);
            console.log('🏫 MONGODB SECTION 3: Request headers:', {
                'content-type': req.headers['content-type'],
                'content-length': req.headers['content-length'],
                'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
            });
            console.log('🏫 MONGODB SECTION 3: Request body keys:', Object.keys(req.body));
            console.log('🏫 MONGODB SECTION 3: Request body data:', {
                organization_name: req.body.organization_name,
                organization_id: req.body.organization_id,
                name: req.body.name,
                venue: req.body.venue,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                time_start: req.body.time_start,
                time_end: req.body.time_end,
                event_type: req.body.event_type,
                event_mode: req.body.event_mode,
                target_audience: req.body.target_audience,
                return_service_credit: req.body.return_service_credit
            });
            console.log('🏫 MONGODB SECTION 3: Request files:', req.files);
            console.log('🏫 MONGODB SECTION 3: Has files attached:', !!(req.files && Object.keys(req.files).length > 0));

            if (req.files && Object.keys(req.files).length > 0) {
                console.log('📎 MONGODB SECTION 3: FILE ATTACHMENTS DETECTED:');
                Object.entries(req.files).forEach(([fieldName, files]) => {
                    files.forEach((file, index) => {
                        console.log(`📎 MONGODB SECTION 3: - ${fieldName}[${index}]:`, {
                            originalname: file.originalname,
                            mimetype: file.mimetype,
                            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                            buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'No buffer',
                            fieldname: file.fieldname
                        });
                    });
                });
            } else {
                console.log('📄 MONGODB SECTION 3: No files attached');
            }

            const db = await getDb();
            console.log('🔗 MONGODB SECTION 3: Database connection established');

            // ENHANCED FIX: Use data sync service to get organization name
            let orgName = req.body.organization_name;
            if (!orgName && req.body.organization_id) {
                console.log('🔍 MONGODB SECTION 3: Organization name not provided, using data sync service...');
                try {
                    orgName = await dataSyncService.getOrganizationName(req.body.organization_id);
                    console.log('✅ MONGODB SECTION 3: Organization name from sync service:', orgName);
                } catch (syncError) {
                    console.error('❌ MONGODB SECTION 3: Error using sync service:', syncError);
                    orgName = 'Unknown';
                }
            } else if (!orgName) {
                orgName = 'Unknown';
            }

            console.log('🏢 MONGODB SECTION 3: Organization name for file metadata:', orgName);

            const fileMetadata = {};
            console.log('📁 MONGODB SECTION 3: Starting file upload process...');

            if (req.files.gpoaFile) {
                console.log('📎 MONGODB SECTION 3: Processing GPOA file upload...');
                try {
                    fileMetadata.gpoa = await uploadToGridFS(
                        req.files.gpoaFile[0],
                        'gpoa',
                        orgName,
                        req.body.organization_id
                    );
                    console.log('✅ MONGODB SECTION 3: GPOA file uploaded successfully:', {
                        filename: fileMetadata.gpoa.filename,
                        gridFsId: fileMetadata.gpoa.gridFsId,
                        size: fileMetadata.gpoa.size,
                        originalName: fileMetadata.gpoa.originalName
                    });
                } catch (gpoaError) {
                    console.error('❌ MONGODB SECTION 3: GPOA file upload failed:', gpoaError);
                    throw new Error(`GPOA file upload failed: ${gpoaError.message}`);
                }
            } else {
                console.log('📄 MONGODB SECTION 3: No GPOA file provided');
            }

            if (req.files.proposalFile) {
                console.log('📎 MONGODB SECTION 3: Processing Proposal file upload...');
                try {
                    fileMetadata.proposal = await uploadToGridFS(
                        req.files.proposalFile[0],
                        'proposal',
                        orgName,
                        req.body.organization_id
                    );
                    console.log('✅ MONGODB SECTION 3: Proposal file uploaded successfully:', {
                        filename: fileMetadata.proposal.filename,
                        gridFsId: fileMetadata.proposal.gridFsId,
                        size: fileMetadata.proposal.size,
                        originalName: fileMetadata.proposal.originalName
                    });
                } catch (proposalError) {
                    console.error('❌ MONGODB SECTION 3: Proposal file upload failed:', proposalError);
                    throw new Error(`Proposal file upload failed: ${proposalError.message}`);
                }
            } else {
                console.log('📄 MONGODB SECTION 3: No Proposal file provided');
            }

            console.log('📁 MONGODB SECTION 3: File upload process completed. File metadata:', fileMetadata);

            const proposalData = {
                organizationId: req.body.organization_id,
                organizationName: orgName,
                eventName: req.body.name,
                venue: req.body.venue,
                startDate: new Date(req.body.start_date),
                endDate: new Date(req.body.end_date),
                timeStart: req.body.time_start,
                timeEnd: req.body.time_end,
                eventType: req.body.event_type,
                eventMode: req.body.event_mode,
                targetAudience: JSON.parse(req.body.target_audience || '[]'),
                eventSpecificData: { returnServiceCredit: req.body.return_service_credit },
                proposalStatus: 'pending',
                adminComments: '',
                files: fileMetadata,
                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: new Date(),
            };

            console.log('💾 MONGODB SECTION 3: Prepared proposal data for MongoDB insertion:', {
                organizationId: proposalData.organizationId,
                organizationName: proposalData.organizationName,
                eventName: proposalData.eventName,
                venue: proposalData.venue,
                startDate: proposalData.startDate,
                endDate: proposalData.endDate,
                timeStart: proposalData.timeStart,
                timeEnd: proposalData.timeEnd,
                eventType: proposalData.eventType,
                eventMode: proposalData.eventMode,
                targetAudience: proposalData.targetAudience,
                returnServiceCredit: proposalData.eventSpecificData.returnServiceCredit,
                proposalStatus: proposalData.proposalStatus,
                filesCount: Object.keys(fileMetadata).length,
                files: Object.keys(fileMetadata)
            });

            console.log('💾 MONGODB SECTION 3: Inserting proposal data into MongoDB...');
            const result = await db.collection('proposals').insertOne(proposalData);
            console.log('✅ MONGODB SECTION 3: Proposal successfully inserted into MongoDB:', {
                insertedId: result.insertedId,
                acknowledged: result.acknowledged
            });

            // ENHANCED: Check data consistency after insertion
            try {
                const consistencyCheck = await dataSyncService.ensureProposalConsistency(req.body.organization_id);
                console.log('🔄 MONGODB SECTION 3: Data consistency check:', {
                    consistent: consistencyCheck.consistency.consistent,
                    recommendations: consistencyCheck.recommendations
                });
            } catch (consistencyError) {
                console.warn('⚠️ MONGODB SECTION 3: Consistency check failed:', consistencyError.message);
            }

            const responseData = {
                success: true,
                id: result.insertedId,
                message: 'School event proposal saved successfully',
                files: fileMetadata,
                fileUploads: Object.keys(fileMetadata).reduce((acc, key) => {
                    acc[key] = {
                        success: true,
                        filename: fileMetadata[key].filename,
                        mongoId: fileMetadata[key].gridFsId,
                        size: fileMetadata[key].size
                    };
                    return acc;
                }, {}),
                dataConsistency: {
                    organizationName: orgName,
                    filesStored: Object.keys(fileMetadata).length,
                    proposalLinked: !!req.body.organization_id
                }
            };

            console.log('🎉 MONGODB SECTION 3: Sending successful response:', responseData);
            res.json(responseData);
        } catch (error) {
            console.error('❌ MONGODB SECTION 3: Error saving school event:', {
                error: error.message,
                stack: error.stack,
                requestBody: req.body,
                files: req.files ? Object.keys(req.files) : [],
                hasFiles: !!(req.files && Object.keys(req.files).length > 0)
            });
            res.status(500).json({
                success: false,
                error: error.message,
                details: 'Check server logs for more information',
                timestamp: new Date().toISOString()
            });
        }
    },
);

// 🌍 SECTION 4: Save Community Event with File Metadata
router.post(
    '/proposals/community-events',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const db = await getDb();
            const orgName = req.body.organization_name || 'Unknown';

            const fileMetadata = {};
            if (req.files.gpoaFile) {
                fileMetadata.gpoa = await uploadToGridFS(req.files.gpoaFile[0], 'gpoa', orgName);
            }
            if (req.files.proposalFile) {
                fileMetadata.proposal = await uploadToGridFS(req.files.proposalFile[0], 'proposal', orgName);
            }

            const proposalData = {
                organizationId: toObjectId(req.body.organization_id),
                eventName: req.body.name,
                venue: req.body.venue,
                startDate: new Date(req.body.start_date),
                endDate: new Date(req.body.end_date),
                timeStart: req.body.time_start,
                timeEnd: req.body.time_end,
                eventType: req.body.event_type,
                eventMode: req.body.event_mode,
                targetAudience: JSON.parse(req.body.target_audience || '[]'),
                eventSpecificData: { sdpCredits: req.body.sdp_credits },
                proposalStatus: 'pending',
                files: fileMetadata,
                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: new Date(),
            };

            const result = await db.collection('proposals').insertOne(proposalData);

            res.json({ success: true, id: result.insertedId, message: 'Community event proposal saved successfully', files: fileMetadata });
        } catch (error) {
            console.error('Error saving community event:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
);

module.exports = router; 