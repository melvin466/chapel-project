const Sermon = require('../models/Sermon');
const { recordAuditLog } = require('../utils/auditLogger');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryMedia');
const { getUploadedFilePath } = require('../utils/uploadedFile');

const parseList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const withUploadedSermonFiles = (body, files = {}) => {
  const data = { ...body };
  delete data.createdBy;
  delete data.createdAt;
  const thumbnail = getUploadedFilePath(files.thumbnail?.[0]);
  const audioUrl = getUploadedFilePath(files.sermonAudio?.[0]);
  const videoUrl = getUploadedFilePath(files.sermonVideo?.[0]);

  if (thumbnail) data.thumbnail = thumbnail;
  if (audioUrl) data.audioUrl = audioUrl;
  if (videoUrl) data.videoUrl = videoUrl;
  if (data.bibleVerses !== undefined) data.bibleVerses = parseList(data.bibleVerses);
  if (data.tags !== undefined) data.tags = parseList(data.tags);
  if (data.speaker === '') delete data.speaker;
  if (data.date === '') delete data.date;
  if (data.duration === '') delete data.duration;

  return data;
};

const getUserDisplayName = (user) => (
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Chapel Team'
);

const sermonMediaFields = [
  { field: 'thumbnail', resourceType: 'image' },
  { field: 'audioUrl', resourceType: 'video' },
  { field: 'videoUrl', resourceType: 'video' },
];

const cleanupReplacedSermonMedia = async (previousSermon, nextData) => {
  await Promise.all(sermonMediaFields.map(({ field, resourceType }) => {
    if (!Object.prototype.hasOwnProperty.call(nextData, field) || previousSermon[field] === nextData[field]) {
      return Promise.resolve();
    }
    return deleteCloudinaryAsset(previousSermon[field], resourceType);
  }));
};

const cleanupSermonMedia = async (sermon) => {
  await Promise.all(sermonMediaFields.map(({ field, resourceType }) => (
    deleteCloudinaryAsset(sermon[field], resourceType)
  )));
};

const getSermons = async (req, res) => {
  try {
    const { page = 1, limit = 10, speaker, series } = req.query;
    const filter = {};
    if (speaker) filter.speaker = speaker;
    if (series) filter.series = series;

    const sermons = await Sermon.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Sermon.countDocuments(filter);

    res.json({
      success: true,
      data: { sermons, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getManageSermons = async (req, res) => {
  try {
    const { page = 1, limit = 100, speaker, series } = req.query;
    const filter = {};
    if (speaker) filter.speaker = speaker;
    if (series) filter.series = series;

    const sermons = await Sermon.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Sermon.countDocuments(filter);

    res.json({
      success: true,
      data: { sermons, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getSermonById = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id).populate('createdBy', 'firstName lastName role');
    if (!sermon) return res.status(404).json({ success: false, message: 'Sermon not found' });
    sermon.views += 1;
    await sermon.save();
    res.json({ success: true, data: { sermon } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createSermon = async (req, res) => {
  try {
    const sermonData = withUploadedSermonFiles(req.body, req.files);
    if (!sermonData.speaker) sermonData.speaker = getUserDisplayName(req.user);

    const sermon = await Sermon.create({ ...sermonData, createdBy: req.user.id });
    await recordAuditLog(req, {
      action: 'sermon.create',
      resource: 'Sermon',
      resourceId: sermon._id,
      metadata: { title: sermon.title, speaker: sermon.speaker, date: sermon.date },
    });
    res.status(201).json({ success: true, data: { sermon } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updateSermon = async (req, res) => {
  try {
    const existingSermon = await Sermon.findById(req.params.id);
    if (!existingSermon) return res.status(404).json({ success: false, message: 'Sermon not found' });

    const updateData = withUploadedSermonFiles(req.body, req.files);
    const sermon = await Sermon.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    await cleanupReplacedSermonMedia(existingSermon, updateData);
    await recordAuditLog(req, {
      action: 'sermon.update',
      resource: 'Sermon',
      resourceId: sermon._id,
      metadata: { title: sermon.title, changedFields: Object.keys(updateData) },
    });
    res.json({ success: true, data: { sermon } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deleteSermon = async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndDelete(req.params.id);
    if (!sermon) return res.status(404).json({ success: false, message: 'Sermon not found' });
    await cleanupSermonMedia(sermon);
    await recordAuditLog(req, {
      action: 'sermon.delete',
      resource: 'Sermon',
      resourceId: sermon._id,
      metadata: { title: sermon.title, speaker: sermon.speaker },
    });
    res.json({ success: true, message: 'Sermon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const likeSermon = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ success: false, message: 'Sermon not found' });
    
    const liked = sermon.likes.includes(req.user.id);
    if (liked) {
      sermon.likes = sermon.likes.filter(id => id.toString() !== req.user.id);
    } else {
      sermon.likes.push(req.user.id);
    }
    await sermon.save();
    
    res.json({ success: true, liked: !liked, likesCount: sermon.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = { getSermons, getManageSermons, getSermonById, createSermon, updateSermon, deleteSermon, likeSermon };
