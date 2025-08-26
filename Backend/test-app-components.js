const express = require('express');
const app = express();

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

console.log('Testing app components gradually...');

// Test 1: Basic Express app
console.log('\n1️⃣ Testing basic Express app...');
app.use(express.json());

// Test 2: Add helmet middleware
console.log('\n2️⃣ Testing with helmet middleware...');
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  console.log('✅ Helmet middleware added successfully');
} catch (error) {
  console.error('❌ Error adding helmet:', error.message);
}

// Test 3: Add compression middleware
console.log('\n3️⃣ Testing with compression middleware...');
try {
  const compression = require('compression');
  app.use(compression());
  console.log('✅ Compression middleware added successfully');
} catch (error) {
  console.error('❌ Error adding compression:', error.message);
}

// Test 4: Add CORS middleware
console.log('\n4️⃣ Testing with CORS middleware...');
try {
  const cors = require('cors');
  app.use(cors({
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
  }));
  console.log('✅ CORS middleware added successfully');
} catch (error) {
  console.error('❌ Error adding CORS:', error.message);
}

// Test 5: Add static file serving
console.log('\n5️⃣ Testing with static file serving...');
try {
  const path = require('path');
  app.use(express.static(path.join(__dirname, "..", "Frontend")));
  console.log('✅ Static file serving added successfully');
} catch (error) {
  console.error('❌ Error adding static file serving:', error.message);
}

// Test 6: Add routes
console.log('\n6️⃣ Testing with routes...');
try {
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/reports", require("./routes/reports"));
  app.use("/api/inventory", require("./routes/inventory"));
  app.use("/api/toolbox", require("./routes/toolbox"));
  app.use("/api/settings", require("./routes/settings"));
  app.use("/api/tasks", require("./routes/tasks"));
  app.use("/api/admin", require("./routes/admin"));
  console.log('✅ All routes added successfully');
} catch (error) {
  console.error('❌ Error adding routes:', error.message);
}

// Test 7: Add core endpoints
console.log('\n7️⃣ Testing with core endpoints...');
try {
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });
  console.log('✅ Core endpoints added successfully');
} catch (error) {
  console.error('❌ Error adding core endpoints:', error.message);
}

// Test 8: Add error handling
console.log('\n8️⃣ Testing with error handling...');
try {
  app.use("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "API endpoint not found",
      message: `Route ${req.method} ${req.originalUrl} does not exist`
    });
  });
  
  app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
  });
  console.log('✅ Error handling added successfully');
} catch (error) {
  console.error('❌ Error adding error handling:', error.message);
}

console.log('\n🎯 All components tested. Starting server...');

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Test app started on port ${PORT}`);
  console.log('Test the app at: http://localhost:' + PORT + '/health');
});
