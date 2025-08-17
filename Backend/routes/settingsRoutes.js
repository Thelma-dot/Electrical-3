const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const settingsController = require('../controllers/settingsController');

router.get('/', auth, settingsController.getSettings);
router.put('/', auth, settingsController.updateSettings);

module.exports = router;