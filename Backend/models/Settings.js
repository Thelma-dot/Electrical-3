const pool = require('../config/db');

class Settings {
  static async getByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM settings WHERE user_id = ?', [userId]);
    return rows[0];
  }

  static async createOrUpdate(settings) {
    const { userId, darkMode, fontSize } = settings;
    const existing = await this.getByUserId(userId);

    if (existing) {
      await pool.query(
        'UPDATE settings SET dark_mode = ?, font_size = ? WHERE user_id = ?',
        [darkMode, fontSize, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO settings (user_id, dark_mode, font_size) VALUES (?, ?, ?)',
        [userId, darkMode, fontSize]
      );
    }
  }
}

module.exports = Settings;