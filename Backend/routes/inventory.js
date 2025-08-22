const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { db, run, get, all } = require("../config/database");

// Get all inventory items for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const inventory = await all(
      "SELECT * FROM inventory WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId]
    );
    res.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Create a new inventory item
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      productType,
      status,
      size,
      serialNumber,
      date,
      location,
      issuedBy
    } = req.body;

    if (!productType) {
      return res.status(400).json({ error: "Product type is required" });
    }

    const result = await run(
      `INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, productType, status || 'New', size || '', serialNumber || '', date || '', location || '', issuedBy || '']
    );

    // Emit realtime event
    try { req.app.locals.io.emit('inventory:created', { id: result.id, user_id: req.user.userId, productType }); } catch { }

    res.status(201).json({
      message: "Inventory item created successfully",
      id: result.id
    });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// Update inventory item
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productType,
      status,
      size,
      serialNumber,
      date,
      location,
      issuedBy
    } = req.body;

    await run(
      `UPDATE inventory 
       SET product_type = ?, status = ?, size = ?, serial_number = ?, date = ?, location = ?, issued_by = ?
       WHERE id = ? AND user_id = ?`,
      [productType, status, size, serialNumber, date, location, issuedBy, id, req.user.userId]
    );

    // Emit realtime event
    try { req.app.locals.io.emit('inventory:updated', { id, user_id: req.user.userId, status }); } catch { }

    res.json({ message: "Inventory item updated successfully" });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// Delete inventory item
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await run(
      "DELETE FROM inventory WHERE id = ? AND user_id = ?",
      [id, req.user.userId]
    );

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

// Search inventory
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const inventory = await all(
      `SELECT * FROM inventory 
       WHERE user_id = ? AND (
         product_type LIKE ? OR 
         status LIKE ? OR 
         location LIKE ? OR 
         serial_number LIKE ?
       )`,
      [req.user.userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json(inventory);
  } catch (error) {
    console.error("Error searching inventory:", error);
    res.status(500).json({ error: "Failed to search inventory" });
  }
});

module.exports = router;
