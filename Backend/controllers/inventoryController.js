const Inventory = require('../models/Inventory');

// Input validation helper
function validateInventoryInput(data) {
  const errors = [];

  if (!data.productType || !['UPS', 'AVR'].includes(data.productType)) {
    errors.push('Product type must be either UPS or AVR');
  }

  if (!data.status || !['New', 'Replaced'].includes(data.status)) {
    errors.push('Status must be either New or Replaced');
  }

  if (!data.size || !['1.5kva', '3kva', '6kva', '10kva', '20kva', '30kva', '40kva', '60kva'].includes(data.size)) {
    errors.push('Invalid size value');
  }

  if (!data.serialNumber || data.serialNumber.trim().length === 0) {
    errors.push('Serial number is required');
  }

  if (!data.date || data.date.trim().length === 0) {
    errors.push('Date is required');
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.push('Location is required');
  }

  if (!data.issuedBy || data.issuedBy.trim().length === 0) {
    errors.push('Issued by is required');
  }

  return errors;
}

exports.createInventory = async (req, res) => {
  try {
    const { productType, status, size, serialNumber, date, location, issuedBy } = req.body;
    const userId = req.user.userId;

    // Validate input
    const validationErrors = validateInventoryInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    const inventoryId = await Inventory.create({
      userId,
      productType,
      status,
      size,
      serialNumber,
      date,
      location,
      issuedBy
    });

    // Get the newly created inventory item to return full data
    const newInventory = await Inventory.findById(inventoryId);

    // Emit real-time update to all connected clients
    if (req.app.locals.io) {
      console.log('🔌 Emitting inventory:created event');
      
      // Emit to all connected clients for dashboard updates
      req.app.locals.io.emit('inventory:created', { 
        inventoryId, 
        userId,
        inventory: newInventory,
        timestamp: new Date().toISOString(),
        action: 'created'
      });

      // Emit to admin clients for inventory management updates
      req.app.locals.io.emit('admin:inventory:created', {
        inventoryId,
        userId,
        inventory: newInventory,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Real-time events emitted successfully');
    }

    res.status(201).json(newInventory);
  } catch (err) {
    console.error('Error creating inventory:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Serial number already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

exports.getUserInventory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit (must be between 1 and 100)' });
    }

    const inventory = await Inventory.findByUserId(userId);

    // Simple pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedInventory = inventory.slice(startIndex, endIndex);

    const totalPages = Math.ceil(inventory.length / limitNum);

    res.json({
      data: paginatedInventory,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: inventory.length,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    console.error('Error getting user inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log('🔍 getInventoryById called with:', { id, userId });
    console.log('🔍 User object:', req.user);

    // Get all user's inventory and find the specific item
    const inventory = await Inventory.findByUserId(userId);
    console.log('🔍 Found inventory items:', inventory.length);

    const item = inventory.find(item => item.id == id);
    console.log('🔍 Looking for item with ID:', id);
    console.log('🔍 Found item:', item);

    if (!item) {
      console.log('❌ Item not found');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    console.log('✅ Item found, sending response');
    res.json(item);
  } catch (err) {
    console.error('❌ Error in getInventoryById:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { productType, status, size, serialNumber, date, location, issuedBy } = req.body;
    const userId = req.user.userId;

    // Validate input
    const validationErrors = validateInventoryInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Verify inventory belongs to user
    const inventory = await Inventory.findByUserId(userId);
    const itemExists = inventory.some(item => item.id == id);

    if (!itemExists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const success = await Inventory.update(id, {
      productType,
      status,
      size,
      serialNumber,
      date,
      location,
      issuedBy
    });

    if (!success) {
      return res.status(500).json({ error: 'Failed to update inventory item' });
    }

    // Get updated inventory item
    const updatedInventory = await Inventory.findById(id);

    // Emit real-time update to all connected clients
    if (req.app.locals.io) {
      console.log('🔌 Emitting inventory:updated event');
      
      // Emit to all connected clients for dashboard updates
      req.app.locals.io.emit('inventory:updated', { 
        inventoryId: id, 
        userId,
        inventory: updatedInventory,
        timestamp: new Date().toISOString(),
        action: 'updated'
      });

      // Emit to admin clients for inventory management updates
      req.app.locals.io.emit('admin:inventory:updated', {
        inventoryId: id,
        userId,
        inventory: updatedInventory,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Real-time events emitted successfully');
    }

    res.json({ message: 'Inventory item updated successfully' });
  } catch (err) {
    console.error('Error updating inventory:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Serial number already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify inventory belongs to user
    const inventory = await Inventory.findByUserId(userId);
    const itemExists = inventory.some(item => item.id == id);

    if (!itemExists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const success = await Inventory.delete(id);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete inventory item' });
    }

    // Emit real-time update to all connected clients
    if (req.app.locals.io) {
      console.log('🔌 Emitting inventory:deleted event');
      
      // Emit to all connected clients for dashboard updates
      req.app.locals.io.emit('inventory:deleted', { 
        inventoryId: id, 
        userId,
        timestamp: new Date().toISOString(),
        action: 'deleted'
      });

      // Emit to admin clients for inventory management updates
      req.app.locals.io.emit('admin:inventory:deleted', {
        inventoryId: id,
        userId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Real-time events emitted successfully');
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error('Error deleting inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchInventory = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    // Validate query parameters
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit (must be between 1 and 100)' });
    }

    const results = await Inventory.search(userId, query.trim());

    // Simple pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedResults = results.slice(startIndex, endIndex);

    const totalPages = Math.ceil(results.length / limitNum);

    res.json({
      data: paginatedResults,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: results.length,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    console.error('Error searching inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
};