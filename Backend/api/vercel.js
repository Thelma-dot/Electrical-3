// Vercel serverless function handler - Lightweight version
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      message: "Electrical Management System API is running on Vercel!",
      version: '1.0.1 - Lightweight API Support'
    });
  }

  // Test endpoint
  if (req.url === '/api/test' || req.url === '/test') {
    return res.status(200).json({
      message: "✅ Vercel deployment is working!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.1 - Lightweight API Support'
    });
  }

  // Authentication endpoints
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { staffid, password } = data;

          // Basic validation
          if (!staffid || !password) {
            return res.status(400).json({
              error: 'Staff ID and password are required'
            });
          }

          // Mock authentication for testing
          if (staffid === 'admin' && password === 'admin') {
            return res.status(200).json({
              user: {
                id: 1,
                staffid: 'admin',
                fullName: 'Administrator',
                email: 'admin@example.com',
                role: 'admin'
              },
              token: 'mock-jwt-token-for-testing'
            });
          }

          // Invalid credentials
          return res.status(401).json({
            error: 'Invalid staff ID or password'
          });

        } catch (parseError) {
          return res.status(400).json({
            error: 'Invalid JSON in request body'
          });
        }
      });

      return;
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Password reset endpoints
  if (req.url === '/api/auth/request-reset' && req.method === 'POST') {
    return res.status(200).json({
      message: 'Password reset email sent! (Mock response)'
    });
  }

  if (req.url === '/api/auth/reset-password' && req.method === 'POST') {
    return res.status(200).json({
      message: 'Password updated successfully! (Mock response)'
    });
  }

  // Inventory endpoints
  if (req.url === '/api/inventory' && req.method === 'GET') {
    return res.status(200).json({
      message: 'Inventory endpoint working',
      data: []
    });
  }

  // Tasks endpoints
  if (req.url === '/api/tasks/my' && req.method === 'GET') {
    return res.status(200).json({
      message: 'Tasks endpoint working',
      data: []
    });
  }

  if (req.url.match(/^\/api\/tasks\/\d+$/) && req.method === 'PUT') {
    return res.status(200).json({
      message: 'Task updated successfully',
      id: req.url.split('/').pop()
    });
  }

  // Admin endpoints
  if (req.url === '/api/admin/inventory' && req.method === 'GET') {
    return res.status(200).json({
      message: 'Admin inventory endpoint working',
      data: []
    });
  }

  if (req.url === '/api/admin/dashboard' && req.method === 'GET') {
    return res.status(200).json({
      message: 'Admin dashboard endpoint working',
      data: {}
    });
  }

  // Root endpoint
  if (req.url === '/' || req.url === '/api') {
    return res.status(200).json({
      message: "🚀 Electrical Management System API",
      version: "1.0.1 - Lightweight API Support",
      status: "Deployed on Vercel",
      endpoints: [
        "/api/test - Test endpoint",
        "/health - Health check",
        "/api/auth/login - Login endpoint",
        "/api/auth/request-reset - Password reset request",
        "/api/auth/reset-password - Password reset",
        "/api/inventory - Inventory management",
        "/api/tasks/my - User tasks",
        "/api/tasks/:id - Update task",
        "/api/admin/inventory - Admin inventory",
        "/api/admin/dashboard - Admin dashboard"
      ],
      timestamp: new Date().toISOString()
    });
  }

  // 404 for unknown endpoints
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: [
      "/",
      "/health",
      "/api/test",
      "/api/auth/login",
      "/api/auth/request-reset",
      "/api/auth/reset-password",
      "/api/inventory",
      "/api/tasks/my",
      "/api/tasks/:id",
      "/api/admin/inventory",
      "/api/admin/dashboard"
    ],
    requestedUrl: req.url,
    method: req.method
  });
};
