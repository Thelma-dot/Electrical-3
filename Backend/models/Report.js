const { run, get, all } = require('../config/db-sqlite');

class Report {
  static async create(report) {
    // Handle both snake_case and camelCase field names
    const userId = report.userId || report.user_id;
    const title = report.title;
    const jobDescription = report.job_description || report.jobDescription;
    const location = report.location;
    const remarks = report.remarks;
    const reportDate = report.report_date || report.reportDate;
    const reportTime = report.report_time || report.reportTime;
    const toolsUsed = report.tools_used || report.toolsUsed;
    const status = report.status;

    const result = await run(
      'INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status]
    );
    return result.id; // SQLite returns {id, changes}
  }

  static async findByUserId(userId) {
    const rows = await all('SELECT * FROM reports WHERE user_id = ?', [userId]);
    return rows; // SQLite all() returns the rows directly
  }

  static async update(id, reportData) {
    // Handle both snake_case and camelCase field names
    const title = reportData.title;
    const jobDescription = reportData.job_description !== undefined ? reportData.job_description : reportData.jobDescription;
    const location = reportData.location;
    const remarks = reportData.remarks;
    const reportDate = reportData.report_date !== undefined ? reportData.report_date : reportData.reportDate;
    const reportTime = reportData.report_time !== undefined ? reportData.report_time : reportData.reportTime;
    const toolsUsed = reportData.tools_used !== undefined ? reportData.tools_used : reportData.toolsUsed;
    const status = reportData.status;

    console.log('🔧 Report model processing update data:', {
      id,
      title,
      jobDescription,
      location,
      remarks,
      reportDate,
      reportTime,
      toolsUsed,
      status
    });

    console.log('🔧 Raw reportData received:', reportData);
    console.log('🔧 Field mapping details:', {
      'reportData.report_date': reportData.report_date,
      'reportData.reportDate': reportData.reportDate,
      'reportData.report_time': reportData.report_time,
      'reportData.reportTime': reportData.reportTime,
      'reportData.tools_used': reportData.tools_used,
      'reportData.toolsUsed': reportData.toolsUsed
    });

    const sql = 'UPDATE reports SET title = ?, job_description = ?, location = ?, remarks = ?, report_date = ?, report_time = ?, tools_used = ?, status = ? WHERE id = ?';
    const params = [title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status, id];

    console.log('🔧 Executing SQL:', sql);
    console.log('🔧 SQL parameters:', params);

    await run(sql, params);

    // Verify the update by checking what's in the database
    const { get } = require('../config/db-sqlite');
    const verification = await get('SELECT report_date, report_time, tools_used FROM reports WHERE id = ?', [id]);
    console.log('🔧 Database verification after update:', verification);
  }

  static async delete(id) {
    await run('DELETE FROM reports WHERE id = ?', [id]);
  }
}

module.exports = Report;