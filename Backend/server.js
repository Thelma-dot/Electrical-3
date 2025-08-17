const app = require("./app");
const { initializeDatabase } = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log("🚀 Server started successfully!");
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔗 Frontend URL: ${
          process.env.FRONTEND_URL || "http://127.0.0.1:5500"
        }`
      );
      console.log(`💾 Database: SQLite (electrical_management.db)`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
