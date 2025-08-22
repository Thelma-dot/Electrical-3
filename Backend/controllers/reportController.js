const Report = require('../models/Report');
const pool = require('../config/db');

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
    const reports = await pool.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const createdReport = reports[0][0]; // pool.query returns [rows], rows is array, so reports[0][0]

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
    const { title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status } = req.body;
    const userId = req.user.id;

    // Verify report belongs to user
    const reports = await Report.findByUserId(userId);
    const reportExists = reports.some(report => report.id == id);

    if (!reportExists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await Report.update(id, {
      title,
      jobDescription,
      location,
      remarks,
      reportDate,
      reportTime,
      toolsUsed,
      status
    });

    // Get the updated report to return
    const updatedReports = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    const updatedReport = updatedReports[0][0]; // pool.query returns [rows], rows is array, so updatedReports[0][0]

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