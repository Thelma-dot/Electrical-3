const pool = require('../config/db');

class Report {
  static async create(report) {
    const { userId, title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status } = report;
    const [result] = await pool.query(
      'INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM reports WHERE user_id = ?', [userId]);
    return rows;
  }

  static async update(id, reportData) {
    const { title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status } = reportData;
    await pool.query(
      'UPDATE reports SET title = ?, job_description = ?, location = ?, remarks = ?, report_date = ?, report_time = ?, tools_used = ?, status = ? WHERE id = ?',
      [title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM reports WHERE id = ?', [id]);
  }
}

module.exports = Report;