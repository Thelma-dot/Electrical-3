const express = require('express');
const cors = require('cors');

console.log('🚀 Starting minimal server...');
console.log('📦 Express version:', require('express/package.json').version);
console.log('📦 Node version:', process.version);

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        express: require('express/package.json').version,
        node: process.version,
        message: 'Minimal server is working!'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Electrical Management System - Minimal Server',
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Minimal server running on port ${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ Express version: ${require('express/package.json').version}`);
});

// Error handling
app.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    process.exit(1);
});
