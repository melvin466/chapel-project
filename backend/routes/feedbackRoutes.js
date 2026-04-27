const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, async (req, res) => {
  try {
    const feedback = await Feedback.find().populate('user', 'firstName lastName').sort({ createdAt: -1 });
    res.json({ success: true, data: { feedback } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const feedback = await Feedback.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: { feedback } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;