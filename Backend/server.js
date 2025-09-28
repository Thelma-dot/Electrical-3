const app = require("./app-robust");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Use the database instance from db-sqlite.js instead of creating a new one
    const { db } = require("./config/db-sqlite");

    console.log("✅ Using shared SQLite database connection");
    console.log("📁 Database will be initialized by db-sqlite.js");

    // Start HTTP + Socket.IO server
    const http = require('http').createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(http, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://127.0.0.1:5501',
          'http://localhost:5501',
          'http://localhost:3000',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080',
          'null' // Allow null origin for file:// protocol
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true
      }
    });

    // Expose io to routes via app locals
    app.locals.io = io;

    io.on('connection', (socket) => {
      console.log('🔌 Client connected', socket.id);
      console.log('🔌 Total connected clients:', io.engine.clientsCount);

      // Log when admin pages connect
      socket.on('admin:connected', (data) => {
        console.log('👑 Admin connected:', data);
      });

      // Log all events for debugging
      socket.onAny((eventName, ...args) => {
        console.log('🔍 Server received event:', eventName, args);
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

      // Handle toolbox creation events
      socket.on('toolbox:created', (data) => {
        console.log('🛠️ Toolbox created event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('toolbox:created', data);
      });

      // Handle toolbox update events
      socket.on('toolbox:updated', (data) => {
        console.log('🛠️ Toolbox updated event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('toolbox:updated', data);
      });

      // Handle toolbox deletion events
      socket.on('toolbox:deleted', (data) => {
        console.log('🛠️ Toolbox deleted event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('toolbox:deleted', data);
      });

      // Handle admin toolbox events
      socket.on('admin:toolbox:created', (data) => {
        console.log('👑 Admin toolbox created event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('admin:toolbox:created', data);
      });

      socket.on('admin:toolbox:updated', (data) => {
        console.log('👑 Admin toolbox updated event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('admin:toolbox:updated', data);
      });

      socket.on('admin:toolbox:deleted', (data) => {
        console.log('👑 Admin toolbox deleted event received:', data);
        // Broadcast to all other clients
        socket.broadcast.emit('admin:toolbox:deleted', data);
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

      // Test toolbox event emission
      socket.on('test:toolbox:event', (data) => {
        console.log('🧪 Test toolbox event received:', data);
        // Emit test toolbox events to verify Socket.IO is working
        io.emit('toolbox:created', {
          toolboxId: 'test-toolbox-123',
          userId: 'test-user',
          timestamp: new Date().toISOString(),
          action: 'test-created'
        });
        io.emit('admin:toolbox:created', {
          toolboxId: 'test-toolbox-123',
          userId: 'test-user',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Test toolbox events emitted');
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
      console.log(`💾 Database: SQLite (electrical_management.db)`);
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
