const { run, get, all } = require('../config/db-sqlite');

class Toolbox {
  static async create(toolbox) {
    const { userId, workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy, status } = toolbox;
    const result = await run(
      `INSERT INTO toolbox 
      (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy, status]
    );
    return result.id;
  }

  static async findByUserId(userId) {
    console.log('🔍 Toolbox.findByUserId called with userId:', userId);
    try {
      const rows = await all('SELECT * FROM toolbox WHERE user_id = ?', [userId]);
      console.log('📋 Found toolbox rows:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in Toolbox.findByUserId:', error);
      throw error;
    }
  }

  static async findById(id) {
    const row = await get('SELECT * FROM toolbox WHERE id = ?', [id]);
    return row;
  }

  static async update(id, toolbox) {
    const { workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy, status } = toolbox;
    const result = await run(
      `UPDATE toolbox SET 
        work_activity = ?, date = ?, work_location = ?, name_company = ?, sign = ?, 
        ppe_no = ?, tools_used = ?, hazards = ?, circulars = ?, risk_assessment = ?, 
        permit = ?, remarks = ?, prepared_by = ?, verified_by = ?, status = ?
      WHERE id = ?`,
      [workActivity, date, workLocation, nameCompany, sign, ppeNo, toolsUsed, hazards, circulars, riskAssessment, permit, remarks, preparedBy, verifiedBy, status, id]
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