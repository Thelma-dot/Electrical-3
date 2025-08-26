const express = require('express');
const app = express();

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

console.log('Testing route loading one by one...');

// Basic middleware
app.use(express.json());

// Test loading routes individually
const routes = [
  { name: 'auth', path: './routes/auth' },
  { name: 'reports', path: './routes/reports' },
  { name: 'inventory', path: './routes/inventory' },
  { name: 'toolbox', path: './routes/toolbox' },
  { name: 'settings', path: './routes/settings' },
  { name: 'tasks', path: './routes/tasks' },
  { name: 'admin', path: './routes/admin' }
];

routes.forEach(route => {
  try {
    console.log(`Testing ${route.name} route...`);
    const router = require(route.path);
    app.use(`/api/${route.name}`, router);
    console.log(`✅ ${route.name} route loaded successfully`);
  } catch (error) {
    console.error(`❌ Error loading ${route.name} route:`, error.message);
  }
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

console.log('All routes loaded. Starting server...');

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Test app started on port ${PORT}`);
  console.log('Test the app at: http://localhost:' + PORT + '/test');
});
