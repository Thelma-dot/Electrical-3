// Root start script - explicitly runs the backend production server
console.log('🚀 Starting Electrical Management System...');
console.log('📁 Changing to Backend directory...');

// Change to backend directory and run production server
process.chdir('./Backend');
console.log('✅ Changed to Backend directory');

// List files to debug
const fs = require('fs');
console.log('📁 Files in Backend directory:', fs.readdirSync('.'));

// Load and run the production server
try {
  const path = require('path');
  const serverPath = path.join(__dirname, 'Backend', 'server-production.js');
  console.log('📁 Server path:', serverPath);
  require(serverPath);
  console.log('✅ Production server loaded successfully');
} catch (error) {
  console.error('❌ Error loading production server:', error);
  process.exit(1);
}
