const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve media files
app.use('/media', express.static(path.join(__dirname, '../media')));

// Handle SPA routing - serve main.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/landing.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Hell Hustl server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, '../frontend')}`);
});

module.exports = app;