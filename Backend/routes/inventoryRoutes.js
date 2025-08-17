const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const inventoryController = require('../controllers/inventoryController');

router.post('/', auth, inventoryController.createInventory);
router.get('/', auth, inventoryController.getUserInventory);
router.put('/:id', auth, inventoryController.updateInventory);
router.delete('/:id', auth, inventoryController.deleteInventory);
router.get('/search', auth, inventoryController.searchInventory);

module.exports = router;