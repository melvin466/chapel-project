const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, admin } = require('../middleware/auth');
const { recordAuditLog } = require('../utils/auditLogger');

router.get('/public', async (req, res) => {
  try {
    const settings = await Setting.find({ isPublic: true });
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json({ success: true, data: { settings: settingsObj } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json({ success: true, data: { settings: settingsObj } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
});

router.put('/', protect, admin, async (req, res) => {
  try {
    const settingsObj = req.body || {};
    const updatedSettings = {};

    for (const [key, value] of Object.entries(settingsObj)) {
      const setting = await Setting.findOneAndUpdate(
        { key },
        { value, updatedBy: req.user.id, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      updatedSettings[key] = setting.value;
    }

    await recordAuditLog(req, {
      action: 'setting.bulk_update',
      resource: 'Setting',
      metadata: { keys: Object.keys(settingsObj) },
    });

    res.json({ success: true, data: { settings: updatedSettings } });
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
