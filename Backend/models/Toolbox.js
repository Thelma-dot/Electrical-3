const pool = require('../config/db');

class Toolbox {
  static async create(toolbox) {
    const { userId, workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy } = toolbox;
    const [result] = await pool.query(
      `INSERT INTO toolbox 
      (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM toolbox WHERE user_id = ?', [userId]);
    return rows;
  }
}

module.exports = Toolbox;