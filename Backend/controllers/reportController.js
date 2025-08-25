const Report = require('../models/Report');
const { get, all } = require('../config/db-sqlite');

exports.createReport = async (req, res) => {
  try {
    const { title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status } = req.body;
    const userId = req.user.id;

    const reportId = await Report.create({
      userId,
      title,
      jobDescription,
      location,
      remarks,
      reportDate,
      reportTime,
      toolsUsed,
      status
    });

    // Get the created report to return
    const createdReport = await get('SELECT * FROM reports WHERE id = ?', [reportId]);

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('report:created', { reportId, userId });
    }

    res.status(201).json(createdReport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.findByUserId(userId);
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    // Handle both snake_case and camelCase field names from frontend
    const { 
      title, 
      jobDescription, 
      location, 
      remarks, 
      reportDate, 
      reportTime, 
      toolsUsed,
      report_date,
      report_time,
      tools_used,
      status 
    } = req.body;
    
    console.log('🔧 Backend received update request:', {
      id,
      title,
      jobDescription,
      location,
      remarks,
      reportDate,
      reportTime,
      toolsUsed,
      report_date,
      report_time,
      tools_used,
      status
    });
    
    const userId = req.user.id;

    // Verify report belongs to user
    const reports = await Report.findByUserId(userId);
    const reportExists = reports.some(report => report.id == id);

    if (!reportExists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updateData = {
      title,
      jobDescription,
      location,
      remarks,
      reportDate: report_date !== undefined ? report_date : reportDate,
      reportTime: report_time !== undefined ? report_time : reportTime,
      toolsUsed: tools_used !== undefined ? tools_used : toolsUsed,
      status
    };
    
    console.log('🔧 Sending data to Report.update:', updateData);
    
    await Report.update(id, updateData);

    // Get the updated report to return
    const updatedReport = await get('SELECT * FROM reports WHERE id = ?', [id]);
    
    console.log('🔧 Retrieved updated report from database:', updatedReport);

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('report:updated', { reportId: id, userId });
    }

    res.json(updatedReport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify report belongs to user
    const reports = await Report.findByUserId(userId);
    const reportExists = reports.some(report => report.id == id);

    if (!reportExists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await Report.delete(id);

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('report:deleted', { reportId: id, userId });
    }

    res.json({ message: 'Report deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get report summary for dashboard
exports.getReportSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(status = 'Completed') AS completed,
        SUM(status = 'In Progress') AS in_progress
      FROM reports
      WHERE user_id = ?
    `, [userId]);

    res.json(summary[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get reports by month for chart
exports.getReportsByMonth = async (req, res) => {
  try {
    const userId = req.user.id;

    const [results] = await pool.query(`
      SELECT 
        DATE_FORMAT(report_date, '%b') AS month,
        COUNT(*) AS count
      FROM reports
      WHERE user_id = ?
        AND report_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      GROUP BY DATE_FORMAT(report_date, '%m'), month
      ORDER BY DATE_FORMAT(report_date, '%m')
    `, [userId]);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};