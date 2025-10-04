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
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.FRONTEND_URL || "https://electrical-3.netlify.app",
        "https://electrical-3.netlify.app",
        "https://gphaelectricalmanagementsystem.netlify.app",
        "https://electrical-3-2.onrender.com",
        "https://electrical-management-system.onrender.com",
        "http://localhost:5501",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5501",
        "null" // Allow null origin for file:// protocol
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Additional CORS headers for file:// protocol support
app.use((req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');

  next();
});

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
    console.log("🔧 Loading admin routes...");
    app.use("/api/admin", require("./routes/admin"));
    console.log("✅ Admin routes loaded successfully");
  } catch (error) {
    console.log("❌ Admin routes failed to load:", error.message);
    console.log("❌ Error details:", error);
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

app.get("/api/admin-test", (req, res) => {
  res.json({
    message: "Admin test endpoint working!",
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
app.use("/api/:path", (req, res) => {
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
