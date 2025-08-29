const crypto = require('crypto');

// Generate secure random token
exports.generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Validate password strength
exports.validatePassword = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};