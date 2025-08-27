// Railway-specific start script
console.log('🚀 Starting Electrical Management System on Railway...');
console.log('📁 Current working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || 5000);

// Load environment variables
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.log('⚠️ Using system environment variables');
}

// Set default environment variables for Railway
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || 5000;

// Initialize users for Railway deployment
async function initializeRailwayUsers() {
  try {
    console.log('🔧 Initializing users for Railway deployment...');
    const userInitPath = path.join(__dirname, 'Backend', 'railway-init-users.js');
    
    if (require('fs').existsSync(userInitPath)) {
      require(userInitPath);
      console.log('✅ User initialization completed');
    } else {
      console.log('⚠️ User initialization script not found, proceeding without it');
    }
  } catch (error) {
    console.log('⚠️ User initialization failed, proceeding without it:', error.message);
  }
  
  // Start the server after user initialization
  startProductionServer();
}

// Load and run the production server
function startProductionServer() {
  try {
    const path = require('path');
    const serverPath = path.join(__dirname, 'Backend', 'server-production.js');
    console.log('🔍 Loading server from:', serverPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server file not found at: ${serverPath}`);
    }
    
    require(serverPath);
    console.log('✅ Production server loaded successfully');
  } catch (error) {
    console.error('❌ Error loading production server:', error);
    console.error('❌ Stack trace:', error.stack);
    process.exit(1);
  }
}

// Start the initialization process
initializeRailwayUsers();
