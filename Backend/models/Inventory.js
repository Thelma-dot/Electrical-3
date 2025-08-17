const pool = require('../config/db');

class Inventory {
  static async create(inventory) {
    const { userId, productType, status, size, serialNumber, date, location, issuedBy } = inventory;
    const [result] = await pool.query(
      'INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, productType, status, size, serialNumber, date, location, issuedBy]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM inventory WHERE user_id = ?', [userId]);
    return rows;
  }

  static async update(id, inventoryData) {
    const { productType, status, size, serialNumber, date, location, issuedBy } = inventoryData;
    await pool.query(
      'UPDATE inventory SET product_type = ?, status = ?, size = ?, serial_number = ?, date = ?, location = ?, issued_by = ? WHERE id = ?',
      [productType, status, size, serialNumber, date, location, issuedBy, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM inventory WHERE id = ?', [id]);
  }

  static async search(userId, query) {
    const [rows] = await pool.query(
      `SELECT * FROM inventory 
       WHERE user_id = ? AND 
       (product_type LIKE ? OR status LIKE ? OR size LIKE ? OR serial_number LIKE ? OR location LIKE ? OR issued_by LIKE ?)`,
      [userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = Inventory;