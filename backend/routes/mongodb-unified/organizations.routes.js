const express = require('express');
const router = express.Router();
const { getDb } = require('./helpers');

// 📝 SECTION 2: Save Organization Info
router.post('/organizations', async (req, res) => {
    try {
        const db = await getDb();
        const orgData = {
            name: req.body.organizationName,
            description: req.body.organizationDescription,
            organizationType: req.body.organizationType,
            contactPerson: req.body.contactName,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('organizations').insertOne(orgData);

        res.json({
            success: true,
            id: result.insertedId,
            message: 'Organization saved successfully',
        });
    } catch (error) {
        console.error('Error saving organization:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 