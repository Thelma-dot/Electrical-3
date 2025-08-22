const Toolbox = require('../models/Toolbox');

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
      verifiedBy
    } = req.body;

    const userId = req.user.id; // Changed from req.user.userId

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
      verifiedBy
    });

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('tool:created', { toolboxId, userId });
    }

    res.status(201).json({ message: 'Toolbox form created successfully', toolboxId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserToolboxes = async (req, res) => {
  try {
    const userId = req.user.id; // Changed from req.user.userId
    const toolboxes = await Toolbox.findByUserId(userId);
    res.json(toolboxes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllToolboxes = async (req, res) => {
  try {
    const toolboxes = await Toolbox.findAll();
    res.json(toolboxes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getToolboxById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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
    const userId = req.user.id; // Changed from req.user.userId

    // Verify toolbox belongs to user
    const toolboxes = await Toolbox.findByUserId(userId);
    const itemExists = toolboxes.some(item => item.id == id);

    if (!itemExists) {
      return res.status(404).json({ error: 'Toolbox item not found' });
    }

    await Toolbox.update(id, {
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
    });

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('tool:updated', { toolboxId: id, userId });
    }

    res.json({ message: 'Toolbox item updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteToolbox = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Changed from req.user.userId

    // Verify toolbox belongs to user
    const toolboxes = await Toolbox.findByUserId(userId);
    const itemExists = toolboxes.some(item => item.id == id);

    if (!itemExists) {
      return res.status(404).json({ error: 'Toolbox item not found' });
    }

    await Toolbox.delete(id);

    // Emit real-time update to admin panels
    if (req.app.locals.io) {
      req.app.locals.io.emit('tool:deleted', { toolboxId: id, userId });
    }

    res.json({ message: 'Toolbox item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};