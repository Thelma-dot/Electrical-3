const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting debug server...');
console.log('📦 Express version:', require('express/package.json').version);
console.log('📦 Node version:', process.version);

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple test routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    express: require('express/package.json').version,
    node: process.version
  });
});

app.get('/test/:id', (req, res) => {
  res.json({ 
    message: 'Parameter route works', 
    id: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Debug server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Test route: http://localhost:${PORT}/test/123`);
  console.log('✅ No path-to-regexp errors detected');
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
