const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { db, run, get, all } = require("../config/db-sqlite");

// Get user settings
router.get("/", authenticateToken, async (req, res) => {
  try {
    const settings = await all(
      "SELECT setting_key, setting_value FROM settings WHERE user_id = ?",
      [req.user.userId]
    );

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update user settings
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { darkMode, notifications, language } = req.body;

    // Update or insert settings
    if (darkMode !== undefined) {
      await run(
        `INSERT OR REPLACE INTO settings (user_id, setting_key, setting_value, updated_at) 
         VALUES (?, 'darkMode', ?, datetime('now'))`,
        [req.user.userId, darkMode.toString()]
      );
    }

    if (notifications !== undefined) {
      await run(
        `INSERT OR REPLACE INTO settings (user_id, setting_key, setting_value, updated_at) 
         VALUES (?, 'notifications', ?, datetime('now'))`,
        [req.user.userId, notifications.toString()]
      );
    }

    if (language !== undefined) {
      await run(
        `INSERT OR REPLACE INTO settings (user_id, setting_key, setting_value, updated_at) 
         VALUES (?, 'language', ?, datetime('now'))`,
        [req.user.userId, language]
      );
    }

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Get specific setting
router.get("/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await get(
      "SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = ?",
      [req.user.userId, key]
    );

    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json({ key, value: setting.setting_value });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// Update specific setting
router.put("/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }

    await run(
      `INSERT OR REPLACE INTO settings (user_id, setting_key, setting_value, updated_at) 
       VALUES (?, ?, ?, datetime('now'))`,
      [req.user.userId, key, value.toString()]
    );

    res.json({ message: "Setting updated successfully" });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// Delete setting
router.delete("/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;

    await run(
      "DELETE FROM settings WHERE user_id = ? AND setting_key = ?",
      [req.user.userId, key]
    );

    res.json({ message: "Setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting setting:", error);
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

module.exports = router;
