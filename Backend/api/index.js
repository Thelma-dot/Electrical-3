// Minimal API function handler for Render deployment
module.exports = async (req, res) => {
  try {
    // Handle CORS for Render
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Simple test endpoint for debugging
    if (req.url === '/api/test' || req.url === '/test') {
      return res.status(200).json({ 
        message: '✅ Render deployment is working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        url: req.url,
        method: req.method,
        version: '1.0.1 - Auto-deploy test'
      });
    }

    // Health check endpoint
    if (req.url === '/health' || req.url === '/api/health') {
      return res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        message: "Electrical Management System API is running on Render!",
        version: '1.0.1 - Auto-deploy test'
      });
    }

    // Root endpoint
    if (req.url === '/' || req.url === '/api') {
      return res.status(200).json({
        message: "🚀 Electrical Management System API",
        version: "1.0.1 - Auto-deploy test",
        status: "Deployed on Render",
        endpoints: [
          "/api/test - Test endpoint",
          "/health - Health check",
          "/api/health - Health check (alternative)"
        ],
        timestamp: new Date().toISOString()
      });
    }

    // 404 for unknown endpoints
    res.status(404).json({ 
      error: "Endpoint not found",
      availableEndpoints: ["/", "/api", "/api/test", "/health", "/api/health"],
      url: req.url
    });
    
  } catch (error) {
    console.error('❌ API function error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
