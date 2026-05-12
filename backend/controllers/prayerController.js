const PrayerRequest = require('../models/PrayerRequest');

const getPrayerRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.user.role !== 'admin') filter.status = { $in: ['active', 'answered'] };

    const prayerRequests = await PrayerRequest.find(filter)
      .populate('requestedBy', 'firstName lastName')
      .populate('answeredBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PrayerRequest.countDocuments(filter);

    res.json({
      success: true,
      data: { prayerRequests, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createPrayerRequest = async (req, res) => {
  try {
    const prayerRequest = await PrayerRequest.create({ ...req.body, requestedBy: req.user.id });
    res.status(201).json({ success: true, data: { prayerRequest } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const prayForRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findById(req.params.id);
    if (!prayer) return res.status(404).json({ success: false, message: 'Prayer request not found' });
    
    const alreadyPrayed = prayer.prayedBy.some(p => p.user.toString() === req.user.id);
    if (!alreadyPrayed) {
      prayer.prayerCount += 1;
      prayer.prayedBy.push({ user: req.user.id });
      await prayer.save();
    }
    
    res.json({ success: true, message: 'Prayer recorded', prayerCount: prayer.prayerCount });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updatePrayerStatus = async (req, res) => {
  try {
    const { status, adminResponse = '' } = req.body;
    if (!['active', 'answered', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid prayer status' });
    }

    const updateData = {
      status,
      adminResponse: status === 'answered' ? adminResponse : '',
      answeredBy: status === 'answered' ? req.user.id : null,
      answeredAt: status === 'answered' ? new Date() : null
    };

    const prayer = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('requestedBy', 'firstName lastName').populate('answeredBy', 'firstName lastName');
    if (!prayer) return res.status(404).json({ success: false, message: 'Prayer request not found' });
    res.json({ success: true, data: { prayer } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deletePrayerRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndDelete(req.params.id);
    if (!prayer) return res.status(404).json({ success: false, message: 'Prayer request not found' });
    res.json({ success: true, message: 'Prayer request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = { getPrayerRequests, createPrayerRequest, prayForRequest, updatePrayerStatus, deletePrayerRequest };
