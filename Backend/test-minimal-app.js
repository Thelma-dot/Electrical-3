const express = require('express');
const app = express();

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

console.log('Testing minimal Express app...');

// Basic middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Minimal app started on port ${PORT}`);
  console.log('Test the app at: http://localhost:' + PORT + '/test');
});
