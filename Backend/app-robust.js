const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

// Load environment variables safely
try {
  require("dotenv").config({ path: path.join(__dirname, "config.env") });
  console.log("✅ Environment variables loaded");
} catch (error) {
  console.log("⚠️ Using default environment variables");
}

const app = express();

// ====================== Enhanced Middleware ======================
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://electrical-3.netlify.app",
      "https://electrical-3.netlify.app",
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:8080"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ====================== Static Files ======================
app.use(express.static(path.join(__dirname, "..", "Frontend")));

// ====================== Safe Route Loading ======================
// Load routes with error handling
const loadRoutes = () => {
  try {
    app.use("/api/auth", require("./routes/auth"));
    console.log("✅ Auth routes loaded");
  } catch (error) {
    console.log("⚠️ Auth routes not available:", error.message);
  }

  try {
    app.use("/api/reports", require("./routes/reports"));
    console.log("✅ Reports routes loaded");
  } catch (error) {
    console.log("⚠️ Reports routes not available:", error.message);
  }

  try {
    app.use("/api/inventory", require("./routes/inventory"));
    console.log("✅ Inventory routes loaded");
  } catch (error) {
    console.log("⚠️ Inventory routes not available:", error.message);
  }

  try {
    app.use("/api/toolbox", require("./routes/toolbox"));
    console.log("✅ Toolbox routes loaded");
  } catch (error) {
    console.log("⚠️ Toolbox routes not available:", error.message);
  }

  try {
    app.use("/api/settings", require("./routes/settings"));
    console.log("✅ Settings routes loaded");
  } catch (error) {
    console.log("⚠️ Settings routes not available:", error.message);
  }

  try {
    app.use("/api/tasks", require("./routes/tasks"));
    console.log("✅ Tasks routes loaded");
  } catch (error) {
    console.log("⚠️ Tasks routes not available:", error.message);
  }

  try {
    app.use("/api/admin", require("./routes/admin"));
    console.log("✅ Admin routes loaded");
  } catch (error) {
    console.log("⚠️ Admin routes not available:", error.message);
  }
};

// Load routes safely
loadRoutes();

// ====================== Core Endpoints ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    express: require('express/package.json').version,
    node: process.version,
    uptime: process.uptime()
  });
});

app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Backend is working!", 
    timestamp: new Date().toISOString(),
    status: "success"
  });
});

// ====================== Root Route ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "Frontend", "index.html"));
});

// ====================== Enhanced Error Handling ======================
// 404 Handler - only for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ 
    error: "API endpoint not found",
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints: ['/health', '/api/test']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
