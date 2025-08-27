// Root start script - directly runs the backend production server
console.log('🚀 Starting Electrical Management System...');
console.log('📁 Current working directory:', process.cwd());

// Load and run the production server directly
try {
  const path = require('path');
  const serverPath = path.join(__dirname, 'Backend', 'server-production.js');
  console.log('🔍 Loading server from:', serverPath);
  require(serverPath);
  console.log('✅ Production server loaded successfully');
} catch (error) {
  console.error('❌ Error loading production server:', error);
  console.error('❌ Stack trace:', error.stack);
  process.exit(1);
}
