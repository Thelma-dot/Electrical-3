const { db, run, get, all } = require('../config/database');

class Inventory {
  static async create(inventory) {
    const { userId, productType, status, size, serialNumber, date, location, issuedBy } = inventory;
    const result = await run(
      'INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, productType, status, size, serialNumber, date, location, issuedBy]
    );
    return result.id;
  }

  static async findByUserId(userId) {
    const rows = await all('SELECT * FROM inventory WHERE user_id = ?', [userId]);
    return rows;
  }

  static async findById(id) {
    const row = await get('SELECT * FROM inventory WHERE id = ?', [id]);
    return row;
  }

  static async update(id, inventoryData) {
    const { productType, status, size, serialNumber, date, location, issuedBy } = inventoryData;
    const result = await run(
      'UPDATE inventory SET product_type = ?, status = ?, size = ?, serial_number = ?, date = ?, location = ?, issued_by = ? WHERE id = ?',
      [productType, status, size, serialNumber, date, location, issuedBy, id]
    );
    return result.changes > 0;
  }

  static async delete(id) {
    const result = await run('DELETE FROM inventory WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async search(userId, query) {
    const rows = await all(
      `SELECT * FROM inventory 
       WHERE user_id = ? AND 
       (product_type LIKE ? OR status LIKE ? OR size LIKE ? OR serial_number LIKE ? OR location LIKE ? OR issued_by LIKE ?)`,
      [userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }

  static async findAll() {
    const rows = await all('SELECT * FROM inventory');
    return rows;
  }
}

module.exports = Inventory;