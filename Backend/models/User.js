const sqliteDb = require("../config/db-sqlite");

class User {
  static async findByStaffId(staffId) {
    const user = await sqliteDb.get("SELECT * FROM users WHERE staff_id = ?", [
      staffId,
    ]);
    return user;
  }

  static async create(user) {
    const { staff_id, password, email } = user;
    const result = await sqliteDb.run(
      "INSERT INTO users (staff_id, password) VALUES (?, ?)",
      [staff_id, password]
    );
    return result.id;
  }

  static async updatePassword(staffId, newPassword) {
    await sqliteDb.run("UPDATE users SET password = ? WHERE staff_id = ?", [
      newPassword,
      staffId,
    ]);
  }

  static async setResetToken(staffId, token, expiry) {
    await sqliteDb.run(
      "UPDATE users SET reset_token = ?, token_expiry = ? WHERE staff_id = ?",
      [token, expiry, staffId]
    );
  }

  static async findByResetToken(token) {
    const user = await sqliteDb.get(
      'SELECT * FROM users WHERE reset_token = ? AND token_expiry > datetime("now")',
      [token]
    );
    return user;
  }

  static async clearResetToken(staffId) {
    await sqliteDb.run(
      "UPDATE users SET reset_token = NULL, token_expiry = NULL WHERE staff_id = ?",
      [staffId]
    );
  }

  static async updateEmail(staffId, email) {
    await sqliteDb.run("UPDATE users SET email = ? WHERE staff_id = ?", [
      email,
      staffId,
    ]);
  }
}

module.exports = User;
