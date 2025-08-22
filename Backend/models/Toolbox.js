const { run, get, all } = require('../config/database');

class Toolbox {
  static async create(toolbox) {
    const { userId, workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy } = toolbox;
    const result = await run(
      `INSERT INTO toolbox 
      (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy]
    );
    return result.id;
  }

  static async findByUserId(userId) {
    const rows = await all('SELECT * FROM toolbox WHERE user_id = ?', [userId]);
    return rows;
  }

  static async findById(id) {
    const row = await get('SELECT * FROM toolbox WHERE id = ?', [id]);
    return row;
  }

  static async update(id, toolbox) {
    const { workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy } = toolbox;
    const result = await run(
      `UPDATE toolbox SET 
        work_activity = ?, date = ?, work_location = ?, name_company = ?, sign = ?, 
        ppe_no = ?, tools_used = ?, hazards = ?, circulars = ?, risk_assessment = ?, 
        permit = ?, remarks = ?, prepared_by = ?, verified_by = ?
      WHERE id = ?`,
      [workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy, id]
    );
    return result.changes > 0;
  }

  static async delete(id) {
    const result = await run('DELETE FROM toolbox WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async findAll() {
    const rows = await all(`
      SELECT 
        t.*,
        u.staff_id as staffId,
        u.name as staffName
      FROM toolbox t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    return rows;
  }
}

module.exports = Toolbox;