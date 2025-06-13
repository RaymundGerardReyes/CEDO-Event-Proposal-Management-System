// Browser Test for Admin Dashboard
// This script helps test the admin dashboard with API key authentication

const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 3333;

// Serve a simple proxy page that adds the API key header
app.get('/', async (req, res) => {
    try {
        const response = await fetch('http://localhost:5000/api/admin', {
            headers: {
                'x-api-key': process.env.ADMIN_API_KEY || 'CEDO_@admin-Database'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json(error);
        }

        const html = await response.text();
        res.send(html);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch admin dashboard',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🎯 Admin Dashboard Browser Test Server`);
    console.log(`📍 Open in browser: http://localhost:${PORT}`);
    console.log(`🔑 Using API Key: ${process.env.ADMIN_API_KEY || 'CEDO_@admin-Database'}`);
    console.log(`🚀 This proxies to: http://localhost:5000/api/admin with proper authentication\n`);
}); 