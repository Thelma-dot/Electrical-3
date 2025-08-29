const app = require("./app-robust");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize SQLite database
    const sqlite3 = require("sqlite3").verbose();
    const dbPath = path.join(__dirname, "electrical_management.db");
    const db = new sqlite3.Database(dbPath);

    console.log("✅ SQLite database connection established");
    console.log(`📁 Database path: ${dbPath}`);

    // Start HTTP + Socket.IO server
    const http = require('http').createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(http, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
          'http://localhost:5500',
          'http://localhost:3000',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    // Expose io to routes via app locals
    app.locals.io = io;

    io.on('connection', (socket) => {
      console.log('🔌 Client connected', socket.id);

      // Log when admin pages connect
      socket.on('admin:connected', (data) => {
        console.log('👑 Admin connected:', data);
      });

      // Handle inventory-related events
      socket.on('inventory:update', (data) => {
        console.log('📦 Inventory update event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('inventory:update', data);
      });

      // Handle toolbox-related events
      socket.on('toolbox:update', (data) => {
        console.log('🛠️ Toolbox update event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('toolbox:update', data);
      });

      // Handle test events
      socket.on('test:event', (data) => {
        console.log('🧪 Test event received:', data);
        socket.emit('test:response', { message: 'Test event received successfully' });
      });

      // Handle test connection event
      socket.on('test:connection', (data) => {
        console.log('🧪 Test connection event received:', data);
        console.log('🔌 Client socket ID:', socket.id);
        console.log('🔌 Total connected clients:', io.engine.clientsCount);
        socket.emit('test:connection:response', {
          message: 'Connection test successful',
          socketId: socket.id,
          clientCount: io.engine.clientsCount,
          timestamp: new Date().toISOString()
        });
      });

      // Test inventory event emission
      socket.on('test:inventory:event', (data) => {
        console.log('🧪 Test inventory event received:', data);
        // Emit a test inventory event to verify Socket.IO is working
        io.emit('inventory:created', {
          inventoryId: 'test-123',
          userId: 'test-user',
          inventory: { productType: 'UPS', status: 'New', size: '3kva' },
          timestamp: new Date().toISOString(),
          action: 'test-created'
        });
        console.log('✅ Test inventory event emitted');
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected', socket.id);
      });
    });

    http.listen(PORT, () => {
      console.log("🚀 SQLite Server started successfully!");
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}`);
      console.log(`💾 Database: SQLite (${dbPath})`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log('🔌 Socket.IO enabled for real-time updates');
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// For production deployment, export the app
// For local development, start the server
if (process.env.NODE_ENV === 'production') {
  // Export for production deployment
  module.exports = app;
} else {
  // Start server locally
  startServer();
}
