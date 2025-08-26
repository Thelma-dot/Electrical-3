const app = require("./app-minimal");
const db = require("./config/database-switcher");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Database is already initialized in db-sqlite.js
        console.log("✅ Database connection established");

        // Start HTTP server
        const http = require('http').createServer(app);

        http.listen(PORT, () => {
            console.log("🚀 Server started successfully!");
            console.log(`📍 Port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}`);
            console.log(`💾 Database: ${process.env.DB_TYPE === 'postgresql' ? 'PostgreSQL' : 'SQLite'} (${process.env.DB_TYPE === 'postgresql' ? process.env.DB_NAME : process.env.DB_PATH || "electrical_management.db"})`);
            console.log(`📊 Health Check: http://localhost:${PORT}/health`);
            console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Start server
startServer();
