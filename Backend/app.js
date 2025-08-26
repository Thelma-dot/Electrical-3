const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const app = express();

// ====================== Middleware ======================
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://127.0.0.1:5500",
      "https://super-paprenjak-d9ab2f.netlify.app",
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:8080"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ====================== Static Files ======================
// Serve frontend files for Railway deployment
app.use(express.static(path.join(__dirname, "..", "Frontend")));

// ====================== Routes ======================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/toolbox", require("./routes/toolbox"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/admin", require("./routes/admin"));

// ====================== Health Check ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ====================== Test Endpoint ======================
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// ====================== Root Route ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "Frontend", "index.html"));
});

// ====================== Error Handling ======================
// 404 Handler - only for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
