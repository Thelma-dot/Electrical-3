const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const toolboxController = require('../controllers/toolboxController');

router.post('/', auth, toolboxController.createToolbox);
router.get('/', auth, toolboxController.getUserToolboxes);

module.exports = router;