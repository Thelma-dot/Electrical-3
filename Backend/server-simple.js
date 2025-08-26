const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    express: require('express/package.json').version,
    node: process.version
  });
});

// Test route with parameter
app.get("/test/:id", (req, res) => {
  res.json({ 
    message: "Parameter route works", 
    id: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Electrical Management System Backend",
    status: "Running",
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Simple server started successfully!");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📦 Express version: ${require('express/package.json').version}`);
  console.log(`📦 Node version: ${process.version}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
