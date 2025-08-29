const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = await Settings.getByUserId(userId);
    
    // Default settings if not found
    const defaultSettings = { 
      dark_mode: false, 
      font_size: 'medium' 
    };
    
    res.json(settings || defaultSettings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { darkMode, fontSize } = req.body;

    await Settings.createOrUpdate({ 
      userId, 
      darkMode, 
      fontSize 
    });

    res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};