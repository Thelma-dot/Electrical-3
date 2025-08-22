const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes - require authentication
router.get('/me', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;