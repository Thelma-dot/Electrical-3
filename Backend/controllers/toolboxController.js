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

    const userId = req.user.id;

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

    res.status(201).json({ message: 'Toolbox form created', toolboxId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserToolboxes = async (req, res) => {
  try {
    const userId = req.user.id;
    const toolboxes = await Toolbox.findByUserId(userId);
    res.json(toolboxes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

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

    const userId = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO toolbox 
      (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        workActivity,
        date,
        workLocation,
        nameCompany,
        sign,
        ppeNo,
        toolsUsed,
        hazards,
        circulars || null,
        riskAssessment || null,
        permit || null,
        remarks || null,
        preparedBy,
        verifiedBy
      ]
    );

    const toolboxId = result.insertId;

    // Generate PDF
    const pdfBuffer = await generateToolboxPDF(req.body);

    // Save PDF to database (optional)
    await pool.query(
      'UPDATE toolbox SET pdf = ? WHERE id = ?',
      [pdfBuffer, toolboxId]
    );

    // Return PDF for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Toolbox_${toolboxId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

async function generateToolboxPDF(formData) {
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();

  // Add content to PDF
  // ... (similar to your frontend PDF generation code)

  return doc.output();
}