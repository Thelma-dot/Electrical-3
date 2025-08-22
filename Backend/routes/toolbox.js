const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { db, run, get, all } = require("../config/database");

// Get all toolbox items for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const toolbox = await all(
      "SELECT * FROM toolbox WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId]
    );
    res.json(toolbox);
  } catch (error) {
    console.error("Error fetching toolbox:", error);
    res.status(500).json({ error: "Failed to fetch toolbox" });
  }
});

// Create a new toolbox item
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      toolName,
      toolType,
      status,
      location,
      assignedTo,
      notes
    } = req.body;

    if (!toolName) {
      return res.status(400).json({ error: "Tool name is required" });
    }

    const result = await run(
      `INSERT INTO toolbox (user_id, tool_name, tool_type, status, location, assigned_to, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, toolName, toolType || '', status || 'Available', location || '', assignedTo || '', notes || '']
    );

    res.status(201).json({
      message: "Toolbox item created successfully",
      id: result.id
    });
  } catch (error) {
    console.error("Error creating toolbox item:", error);
    res.status(500).json({ error: "Failed to create toolbox item" });
  }
});

// Update toolbox item
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      toolName,
      toolType,
      status,
      location,
      assignedTo,
      notes
    } = req.body;

    await run(
      `UPDATE toolbox 
       SET tool_name = ?, tool_type = ?, status = ?, location = ?, assigned_to = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [toolName, toolType, status, location, assignedTo, notes, id, req.user.userId]
    );

    res.json({ message: "Toolbox item updated successfully" });
  } catch (error) {
    console.error("Error updating toolbox item:", error);
    res.status(500).json({ error: "Failed to update toolbox item" });
  }
});

// Delete toolbox item
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await run(
      "DELETE FROM toolbox WHERE id = ? AND user_id = ?",
      [id, req.user.userId]
    );

    res.json({ message: "Toolbox item deleted successfully" });
  } catch (error) {
    console.error("Error deleting toolbox item:", error);
    res.status(500).json({ error: "Failed to delete toolbox item" });
  }
});

// Get toolbox form data
router.post("/form", authenticateToken, async (req, res) => {
  try {
    const {
      workActivity,
      date,
      workLocation,
      nameCompany,
      sign,
      ppeNo,
      toolsUsed,
      hazards,
      circulars,
      riskAssessment,
      permit,
      remarks,
      preparedBy,
      verifiedBy
    } = req.body;

    // Store form data in toolbox table as a special entry
    const result = await run(
      `INSERT INTO toolbox (user_id, tool_name, tool_type, status, location, assigned_to, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        'Toolbox Form',
        'Form Submission',
        'Submitted',
        workLocation || '',
        preparedBy || '',
        JSON.stringify({
          workActivity,
          date,
          nameCompany,
          sign,
          ppeNo,
          toolsUsed,
          hazards,
          circulars,
          riskAssessment,
          permit,
          remarks,
          verifiedBy
        })
      ]
    );

    res.status(201).json({
      message: "Toolbox form submitted successfully",
      id: result.id
    });
  } catch (error) {
    console.error("Error submitting toolbox form:", error);
    res.status(500).json({ error: "Failed to submit toolbox form" });
  }
});

module.exports = router;
