const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { db, run, get, all } = require("../config/db-sqlite");

// Get all reports for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const reports = await all(
      "SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId]
    );
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Create a new report
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      jobDescription,
      location,
      remarks,
      reportDate,
      reportTime,
      toolsUsed,
      status
    } = req.body;

    if (!title || !jobDescription || !location) {
      return res.status(400).json({ error: "Title, job description, and location are required" });
    }

    const result = await run(
      `INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, title, jobDescription, location, remarks || '', reportDate || '', reportTime || '', toolsUsed || '', status || 'Pending']
    );

    // Get the created report to return full data
    const createdReport = await get('SELECT * FROM reports WHERE id = ?', [result.id]);

    // Emit realtime event
    try { req.app.locals.io.emit('report:created', { id: result.id, user_id: req.user.userId, title }); } catch { }

    res.status(201).json(createdReport);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// Get dashboard summary
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const total = await get(
      "SELECT COUNT(*) as count FROM reports WHERE user_id = ?",
      [req.user.userId]
    );

    const inProgress = await get(
      "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'In Progress'",
      [req.user.userId]
    );

    const completed = await get(
      "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'Completed'",
      [req.user.userId]
    );

    res.json({
      total: total?.count || 0,
      in_progress: inProgress?.count || 0,
      completed: completed?.count || 0
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Get chart data
router.get("/chart-data", authenticateToken, async (req, res) => {
  try {
    const reports = await all(
      `SELECT strftime('%m', created_at) as month, COUNT(*) as count, status 
       FROM reports 
       WHERE user_id = ? 
       GROUP BY strftime('%m', created_at), status`,
      [req.user.userId]
    );

    // Process data for charts
    const chartData = reports.map(report => ({
      month: report.month,
      count: report.count,
      status: report.status
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Update report
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      jobDescription,
      location,
      remarks,
      date,
      time,
      toolsUsed,
      status
    } = req.body;

    if (!title || !jobDescription || !location || !status) {
      return res.status(400).json({ error: "Title, job description, location, and status are required" });
    }

    await run(
      `UPDATE reports 
       SET title = ?, job_description = ?, location = ?, remarks = ?, 
           report_date = ?, report_time = ?, tools_used = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [title, jobDescription, location, remarks || '', date || '', time || '', toolsUsed || '', status, id, req.user.userId]
    );

    // Get the updated report
    const updatedReport = await get(
      "SELECT * FROM reports WHERE id = ? AND user_id = ?",
      [id, req.user.userId]
    );

    // Emit realtime event
    try { req.app.locals.io.emit('report:updated', { id, user_id: req.user.userId, status }); } catch { }

    res.json(updatedReport);
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
});

// Delete a report
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await run(
      "DELETE FROM reports WHERE id = ? AND user_id = ?",
      [id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Emit realtime event
    try { req.app.locals.io.emit('report:deleted', { id, user_id: req.user.userId }); } catch { }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

module.exports = router;
