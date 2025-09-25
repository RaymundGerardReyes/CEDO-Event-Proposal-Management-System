#!/usr/bin/env node

/**
 * Simple Test Server for PostgreSQL Enum Fixes
 * 
 * This is a minimal Express server to test the enum mapping fixes
 * without the complexity of the full application.
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
};

// Mock database connection
const mockQuery = async (query, params) => {
    console.log('📝 Mock Query:', query);
    console.log('📝 Mock Params:', params);

    // Simulate successful database operation
    return {
        rows: [{
            id: 1,
            uuid: params[0] || 'test-uuid',
            organization_name: params[1] || 'Test Organization',
            organization_type: params[2] || 'school-based',
            current_section: params[3] || 'orgInfo',
            proposal_status: params[4] || 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }],
        rowCount: 1
    };
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Test server is running'
    });
});

// Mock proposal upsert endpoint
app.put('/api/proposals/:uuid', mockAuth, async (req, res) => {
    try {
        const { uuid } = req.params;
        const { proposal: proposalData, files, ...otherData } = req.body;

        console.log('📝 PUT /proposals/:uuid - Received data:', {
            uuid,
            hasProposal: !!proposalData,
            hasFiles: !!files,
            otherKeys: Object.keys(otherData)
        });

        // Use proposalData if available, otherwise use the entire body
        const updateData = proposalData || req.body;

        // Validate enum values
        const validOrganizationTypes = ['internal', 'external', 'school-based', 'community-based'];
        const validCurrentSections = ['overview', 'orgInfo', 'schoolEvent', 'communityEvent', 'reporting'];
        const validEventModes = ['offline', 'online', 'hybrid'];
        const validProposalStatuses = ['draft', 'pending', 'approved', 'denied', 'revision_requested'];

        // Check organization_type
        if (updateData.organization_type && !validOrganizationTypes.includes(updateData.organization_type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid organization_type: ${updateData.organization_type}. Valid values: ${validOrganizationTypes.join(', ')}`,
                message: 'Validation failed'
            });
        }

        // Check current_section
        if (updateData.current_section && !validCurrentSections.includes(updateData.current_section)) {
            return res.status(400).json({
                success: false,
                error: `Invalid current_section: ${updateData.current_section}. Valid values: ${validCurrentSections.join(', ')}`,
                message: 'Validation failed'
            });
        }

        // Check event_mode
        if (updateData.event_mode && !validEventModes.includes(updateData.event_mode)) {
            return res.status(400).json({
                success: false,
                error: `Invalid event_mode: ${updateData.event_mode}. Valid values: ${validEventModes.join(', ')}`,
                message: 'Validation failed'
            });
        }

        // Check proposal_status
        if (updateData.proposal_status && !validProposalStatuses.includes(updateData.proposal_status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid proposal_status: ${updateData.proposal_status}. Valid values: ${validProposalStatuses.join(', ')}`,
                message: 'Validation failed'
            });
        }

        // Simulate database operation
        const result = await mockQuery(
            'INSERT INTO proposals (uuid, organization_name, organization_type, current_section, proposal_status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (uuid) DO UPDATE SET organization_name = $2, organization_type = $3, current_section = $4, proposal_status = $5, updated_at = CURRENT_TIMESTAMP',
            [
                uuid,
                updateData.organization_name || 'Test Organization',
                updateData.organization_type || 'school-based',
                updateData.current_section || 'orgInfo',
                updateData.proposal_status || 'draft'
            ]
        );

        console.log('✅ Mock database operation successful');

        res.status(200).json({
            success: true,
            data: result.rows[0],
            message: 'Proposal created/updated successfully'
        });

    } catch (error) {
        console.error('❌ Error in proposal endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Test Server Started');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log('🧪 Ready for API testing');
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   PUT  http://localhost:${PORT}/api/proposals/:uuid`);
    console.log('');
    console.log('🧪 Test with cURL:');
    console.log(`curl -X GET http://localhost:${PORT}/api/health`);
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    process.exit(0);
});

module.exports = app;