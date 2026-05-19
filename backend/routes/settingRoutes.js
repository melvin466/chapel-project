const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, admin } = require('../middleware/auth');
const { recordAuditLog } = require('../utils/auditLogger');

router.get('/public', async (req, res) => {
  try {
    const settings = await Setting.find({ isPublic: true });
    res.json({ success: true, data: { settings } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json({ success: true, data: { settings } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
});

router.put('/:key', protect, admin, async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value, updatedBy: req.user.id, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    await recordAuditLog(req, {
      action: 'setting.update',
      resource: 'Setting',
      resourceId: setting._id,
      metadata: { key: setting.key, category: setting.category, isPublic: setting.isPublic },
    });
    res.json({ success: true, data: { setting } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
});

module.exports = router;
