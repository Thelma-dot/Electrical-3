const jwt = require("jsonwebtoken");
require("dotenv").config({ path: require("path").join(__dirname, "..", "config.env") });

function authenticateToken(req, res, next) {
  console.log('🔐 Auth middleware called');
  console.log('🔐 Headers:', req.headers);
  
  const authHeader = req.headers["authorization"];
  console.log('🔐 Authorization header:', authHeader);
  
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  console.log('🔐 Extracted token:', token ? 'Token exists' : 'No token');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret_key_here",
    (err, user) => {
      if (err) {
        console.log('❌ Token verification failed:', err.message);
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      console.log('✅ Token verified successfully, user:', user);
      req.user = user;
      next();
    }
  );
}

// Admin-only guard
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
};
