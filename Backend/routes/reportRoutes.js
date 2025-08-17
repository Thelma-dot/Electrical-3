const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const reportController = require('../controllers/reportController');

router.post('/', auth, reportController.createReport);
router.get('/', auth, reportController.getUserReports);
router.put('/:id', auth, reportController.updateReport);
router.delete('/:id', auth, reportController.deleteReport);

module.exports = router;