// Simple server for testing Section 2 form without database dependencies
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Simple server running', port: PORT });
});

// Mock Section 2 endpoint
app.post('/api/proposals/section2-mock', (req, res) => {
    console.log('📥 MOCK: Received Section 2 organization data:', req.body);

    // Debug the specific required fields
    console.log('🔍 MOCK: Required field values:');
    console.log(`  title: "${req.body.title}" (type: ${typeof req.body.title}, length: ${req.body.title?.length || 0})`);
    console.log(`  contactPerson: "${req.body.contactPerson}" (type: ${typeof req.body.contactPerson}, length: ${req.body.contactPerson?.length || 0})`);
    console.log(`  contactEmail: "${req.body.contactEmail}" (type: ${typeof req.body.contactEmail}, length: ${req.body.contactEmail?.length || 0})`);

    const {
        title, description, category, organizationType,
        contactPerson, contactEmail, contactPhone,
        startDate, endDate, location, budget, objectives, volunteersNeeded,
        status = 'draft',
        proposal_id
    } = req.body;

    // Basic validation
    if (!title || !contactPerson || !contactEmail) {
        console.log('❌ MOCK: Missing required fields');
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['title', 'contactPerson', 'contactEmail'],
            received: {
                title: title || 'missing',
                contactPerson: contactPerson || 'missing',
                contactEmail: contactEmail || 'missing'
            }
        });
    }

    console.log('✅ MOCK: All required fields provided');

    // Simulate successful save
    const mockId = proposal_id || 'mock_' + Date.now();

    const mockResult = {
        id: mockId,
        message: 'MOCK: Section 2 data saved successfully (no database)',
        data: {
            title,
            description,
            category,
            organizationType,
            contactPerson,
            contactEmail,
            contactPhone,
            status
        },
        timestamp: new Date().toISOString()
    };

    console.log('✅ MOCK: Returning successful response:', mockResult);

    res.status(201).json(mockResult);
});

app.listen(PORT, () => {
    console.log(`🚀 Simple server running on http://localhost:${PORT}`);
    console.log(`✅ Mock endpoint available at http://localhost:${PORT}/api/proposals/section2-mock`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
}); 