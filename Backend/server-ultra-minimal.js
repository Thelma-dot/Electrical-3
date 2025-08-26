const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

const app = express();

// ====================== Middleware ======================
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());

// ====================== Routes ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

app.get("/", (req, res) => {
  res.json({ message: "Ultra-minimal server running!" });
});

// ====================== Start Server ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Ultra-minimal server started successfully!");
  console.log(`📍 Port: ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
});
