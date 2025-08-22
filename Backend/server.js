const app = require("./app");
const { initializeDatabase } = require("./config/database");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start HTTP + Socket.IO server
    const http = require('http').createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(http, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    // Expose io to routes via app locals
    app.locals.io = io;

    io.on('connection', (socket) => {
      console.log('🔌 Client connected', socket.id);
      socket.on('disconnect', () => console.log('🔌 Client disconnected', socket.id));
    });

    http.listen(PORT, () => {
      console.log("🚀 Server started successfully!");
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}`);
      console.log(`💾 Database: SQLite (${process.env.DB_PATH || "electrical_management.db"})`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
