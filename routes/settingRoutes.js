const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, admin } = require('../middleware/auth');

router.get('/public', async (req, res) => {
  try {
    const settings = await Setting.find({ isPublic: true });
    res.json({ success: true, data: { settings } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json({ success: true, data: { settings } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:key', protect, admin, async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value, updatedBy: req.user.id, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: { setting } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;