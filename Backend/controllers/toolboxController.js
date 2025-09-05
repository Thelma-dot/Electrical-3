const Toolbox = require('../models/Toolbox');
const db = require('../config/db-sqlite'); // Correct import path for SQLite database
const fs = require('fs');
const path = require('path');

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
      console.log('🔌 Socket.IO instance available:', !!req.app.locals.io);
      console.log('🔌 Connected clients count:', req.app.locals.io.engine.clientsCount);

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
      console.log('✅ Events emitted: toolbox:created, admin:toolbox:created');
      console.log('✅ Event data sent:', {
        toolboxId,
        userId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Socket.IO not available for real-time updates');
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
    console.log('🔍 getAllToolboxes called - Admin request received');
    console.log('👤 User making request:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);

    // Check if database is available
    if (!db) {
      console.error('❌ Database instance not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    // Check if database is in a valid state
    console.log('📊 Database state check...');
    console.log('📊 Database open state:', db.open);
    console.log('📊 Database filename:', db.filename);

    // Check if database file exists and is readable
    const dbPath = path.join(__dirname, '..', 'electrical_management.db');
    console.log('📊 Database file path:', dbPath);

    try {
      const stats = fs.statSync(dbPath);
      console.log('📊 Database file exists, size:', stats.size, 'bytes');
      console.log('📊 Database file is readable:', fs.constants.R_OK);
    } catch (fileErr) {
      console.error('❌ Database file check failed:', fileErr.message);
      return res.status(500).json({ error: 'Database file not accessible' });
    }

    // First, let's test if the database is accessible with a simple query
    console.log('📊 Testing database connection...');

    // Add timeout to database operations
    const dbTimeout = setTimeout(() => {
      console.error('⏰ Database operation timed out after 10 seconds');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Database operation timed out' });
      }
    }, 10000);

    db.get('SELECT 1 as test', (testErr, testRow) => {
      clearTimeout(dbTimeout);

      if (testErr) {
        console.error('❌ Database connection test failed:', testErr);
        return res.status(500).json({ error: 'Database connection failed' });
      }
      console.log('✅ Database connection test successful:', testRow);

      // Now run the actual query with another timeout
      const queryTimeout = setTimeout(() => {
        console.error('⏰ Main query timed out after 10 seconds');
        if (!res.headersSent) {
          res.status(500).json({ error: 'Query timed out' });
        }
      }, 10000);

      const query = `
        SELECT t.*, u.name as user_name, u.email as user_email 
        FROM toolbox t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `;

      console.log('📊 Executing main query:', query);
      console.log('📊 Database instance:', !!db);

      db.all(query, (err, toolboxes) => {
        clearTimeout(queryTimeout);
        console.log('📊 Database query callback executed');
        console.log('📊 Error:', err);
        console.log('📊 Toolboxes found:', toolboxes ? toolboxes.length : 'null');

        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        console.log('✅ Query successful - Found toolboxes:', toolboxes.length);
        console.log('📋 Toolbox data:', toolboxes);

        res.json(toolboxes);
      });
    });
  } catch (err) {
    console.error('❌ getAllToolboxes error:', err);
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