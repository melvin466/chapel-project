const Announcement = require('../models/Announcement');
const { recordAuditLog } = require('../utils/auditLogger');
const { notifyAudience } = require('../utils/notificationDispatcher');
const { getUploadedFilePath } = require('../utils/uploadedFile');

const withUploadedAnnouncementFiles = (body, files = {}) => {
  const data = { ...body };
  delete data.createdBy;
  delete data.createdAt;
  const featuredImage = getUploadedFilePath(files.featuredImage?.[0]);
  const announcementVideo = getUploadedFilePath(files.announcementVideo?.[0]);

  if (featuredImage) data.featuredImage = featuredImage;
  if (announcementVideo) data.announcementVideo = announcementVideo;

  return data;
};

const getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const filter = { status: 'published' };
    if (type) filter.type = type;

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);

    res.json({
      success: true,
      data: { announcements, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'firstName lastName role');
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getManageAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 100, type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);

    res.json({
      success: true,
      data: { announcements, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    if (!['admin', 'chaplain'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin or Chaplain access required' });
    }

    const { type = 'general' } = req.body;
    const allowedTypes = ['general', 'urgent', 'event', 'ministry', 'prayer', 'administrative', 'pastoral'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}` });
    }

    const announcement = await Announcement.create({ ...withUploadedAnnouncementFiles({ ...req.body, type }, req.files), createdBy: req.user.id });
    if (announcement.status === 'published') {
      await notifyAudience(announcement.targetAudience, {
        type: 'announcement',
        title: announcement.title,
        message: announcement.summary || announcement.content.slice(0, 180),
        data: { announcementId: announcement._id, type: announcement.type, targetAudience: announcement.targetAudience },
      });
    }
    await recordAuditLog(req, {
      action: 'announcement.create',
      resource: 'Announcement',
      resourceId: announcement._id,
      metadata: { title: announcement.title, status: announcement.status, type: announcement.type },
    });
    res.status(201).json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const existingAnnouncement = await Announcement.findById(req.params.id);
    if (!existingAnnouncement) return res.status(404).json({ success: false, message: 'Announcement not found' });

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, withUploadedAnnouncementFiles(req.body, req.files), { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    if (existingAnnouncement.status !== 'published' && announcement.status === 'published') {
      await notifyAudience(announcement.targetAudience, {
        type: 'announcement',
        title: announcement.title,
        message: announcement.summary || announcement.content.slice(0, 180),
        data: { announcementId: announcement._id, type: announcement.type, targetAudience: announcement.targetAudience },
      });
    }
    await recordAuditLog(req, {
      action: 'announcement.update',
      resource: 'Announcement',
      resourceId: announcement._id,
      metadata: { title: announcement.title, status: announcement.status, changedFields: Object.keys(req.body || {}) },
    });
    res.json({ success: true, data: { announcement } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    await recordAuditLog(req, {
      action: 'announcement.delete',
      resource: 'Announcement',
      resourceId: announcement._id,
      metadata: { title: announcement.title, status: announcement.status },
    });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = { getAnnouncements, getManageAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement };
