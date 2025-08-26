// Root start script - explicitly runs the backend production server
console.log('🚀 Starting Electrical Management System...');
console.log('📁 Changing to Backend directory...');

// Change to backend directory and run production server
process.chdir('./Backend');
console.log('✅ Changed to Backend directory');

// Load and run the production server
try {
  require('./server-production.js');
  console.log('✅ Production server loaded successfully');
} catch (error) {
  console.error('❌ Error loading production server:', error);
  process.exit(1);
}
