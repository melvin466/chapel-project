const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const filter = { status: 'published' };
    if (type) filter.type = type;

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);

    res.json({
      success: true,
      data: { announcements, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { type } = req.body;
    if (!['event', 'general', 'prayer'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Allowed types: event, general, prayer' });
    }

    const announcement = await Announcement.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement };