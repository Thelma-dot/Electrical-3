const Toolbox = require('../models/Toolbox');
const db = require('../config/db-sqlite'); // Correct import path for SQLite database

exports.createToolbox = async (req, res) => {
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
      verifiedBy,
      status
    } = req.body;

    const userId = req.user.userId; // Fixed: use userId from JWT token

    const toolboxId = await Toolbox.create({
      userId,
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
      verifiedBy,
      status: status || 'draft'
    });

    // Emit real-time update to all connected clients
    if (req.app.locals.io) {
      console.log('🔌 Emitting toolbox:created event');

      // Emit to all connected clients for dashboard updates
      req.app.locals.io.emit('toolbox:created', {
        toolboxId,
        userId,
        timestamp: new Date().toISOString(),
        action: 'created'
      });

      // Emit to admin clients for toolbox management updates
      req.app.locals.io.emit('admin:toolbox:created', {
        toolboxId,
        userId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Real-time events emitted successfully');
    }

    res.status(201).json({ message: 'Toolbox form created successfully', toolboxId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserToolboxes = async (req, res) => {
  try {
    const userId = req.user.userId; // Fixed: use userId from JWT token
    console.log('🔍 Getting toolboxes for user:', userId);

    const toolboxes = await Toolbox.findByUserId(userId);
    console.log('📋 Found toolboxes:', toolboxes);

    res.json(toolboxes);
  } catch (err) {
    console.error('❌ Error in getUserToolboxes:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllToolboxes = async (req, res) => {
  try {
    const query = `
      SELECT t.*, u.name as user_name, u.email as user_email 
      FROM toolbox t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `;

    db.all(query, (err, toolboxes) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(toolboxes);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin endpoint to get a single toolbox by ID
exports.getAdminToolboxById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT t.*, u.name as user_name, u.email as user_email 
      FROM toolbox t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `;

    db.get(query, [id], (err, toolbox) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!toolbox) {
        return res.status(404).json({ error: 'Toolbox not found' });
      }

      res.json(toolbox);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getToolboxById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // Fixed: use userId from JWT token

    // Get toolbox by ID
    const toolbox = await Toolbox.findById(id);

    if (!toolbox) {
      return res.status(404).json({ error: 'Toolbox not found' });
    }

    // Verify toolbox belongs to user
    if (toolbox.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(toolbox);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateToolbox = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // Fixed: use userId from JWT token
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
      verifiedBy,
      status
    } = req.body;

    // Get toolbox by ID first to verify ownership
    const existingToolbox = await Toolbox.findById(id);

    if (!existingToolbox) {
      return res.status(404).json({ error: 'Toolbox not found' });
    }

    // Verify toolbox belongs to user
    if (existingToolbox.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update toolbox
    const success = await Toolbox.update(id, {
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
      verifiedBy,
      status
    });

    if (success) {
      // Emit real-time update to all connected clients
      if (req.app.locals.io) {
        console.log('🔌 Emitting toolbox:updated event');
        console.log('🔌 Event data:', { toolboxId: id, userId, timestamp: new Date().toISOString(), action: 'updated' });

        // Emit to all connected clients for dashboard updates
        req.app.locals.io.emit('toolbox:updated', {
          toolboxId: id,
          userId,
          timestamp: new Date().toISOString(),
          action: 'updated'
        });

        // Emit to admin clients for toolbox management updates
        req.app.locals.io.emit('admin:toolbox:updated', {
          toolboxId: id,
          userId,
          timestamp: new Date().toISOString(),
          action: 'updated'
        });

        console.log('✅ Real-time events emitted successfully');
      } else {
        console.log('⚠️ Socket.IO not available, skipping real-time updates');
      }

      res.json({ message: 'Toolbox form updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update toolbox form' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteToolbox = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // Fixed: use userId from JWT token

    // Get toolbox by ID first to verify ownership
    const existingToolbox = await Toolbox.findById(id);

    if (!existingToolbox) {
      return res.status(404).json({ error: 'Toolbox not found' });
    }

    // Verify toolbox belongs to user
    if (existingToolbox.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete toolbox
    const success = await Toolbox.delete(id);

    if (success) {
      // Emit real-time update to all connected clients
      if (req.app.locals.io) {
        console.log('🔌 Emitting toolbox:deleted event');

        // Emit to all connected clients for dashboard updates
        req.app.locals.io.emit('toolbox:deleted', {
          toolboxId: id,
          userId,
          timestamp: new Date().toISOString(),
          action: 'deleted'
        });

        // Emit to admin clients for toolbox management updates
        req.app.locals.io.emit('admin:toolbox:deleted', {
          toolboxId: id,
          userId,
          timestamp: new Date().toISOString()
        });

        console.log('✅ Real-time events emitted successfully');
      }

      res.json({ message: 'Toolbox form deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete toolbox form' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};