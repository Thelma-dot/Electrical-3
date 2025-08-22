const Inventory = require('../models/Inventory');

exports.createInventory = async (req, res) => {
  try {
    const { productType, status, size, serialNumber, date, location, issuedBy } = req.body;
    const userId = req.user.id;

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

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('inventory:created', { inventoryId, userId });
    }

    res.status(201).json({ message: 'Inventory item created', inventoryId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const inventory = await Inventory.findByUserId(userId);
    res.json(inventory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { productType, status, size, serialNumber, date, location, issuedBy } = req.body;
    const userId = req.user.id;

    // Verify inventory belongs to user
    const inventory = await Inventory.findByUserId(userId);
    const itemExists = inventory.some(item => item.id == id);
    
    if (!itemExists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await Inventory.update(id, {
      productType,
      status,
      size,
      serialNumber,
      date,
      location,
      issuedBy
    });

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('inventory:updated', { inventoryId: id, userId });
    }

    res.json({ message: 'Inventory item updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify inventory belongs to user
    const inventory = await Inventory.findByUserId(userId);
    const itemExists = inventory.some(item => item.id == id);
    
    if (!itemExists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await Inventory.delete(id);
    
    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('inventory:deleted', { inventoryId: id, userId });
    }
    
    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchInventory = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = await Inventory.search(userId, query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search inventory with pagination
exports.searchInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build search query
    const searchQuery = `
      SELECT * FROM inventory 
      WHERE user_id = ?
        AND (
          product_type LIKE ? 
          OR status LIKE ? 
          OR size LIKE ? 
          OR serial_number LIKE ? 
          OR location LIKE ? 
          OR issued_by LIKE ?
        )
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;
    
    const searchPattern = `%${query}%`;
    
    const [results] = await pool.query(searchQuery, [
      userId,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
      offset
    ]);
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory 
       WHERE user_id = ? AND (
          product_type LIKE ? 
          OR status LIKE ? 
          OR size LIKE ? 
          OR serial_number LIKE ? 
          OR location LIKE ? 
          OR issued_by LIKE ?
       )`,
      [
        userId,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      ]
    );
    
    res.json({
      data: results,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};