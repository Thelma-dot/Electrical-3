const express = require('express');
const app = express();
const PORT = 5001;

// Basic middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server working!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
