const Event = require('../models/Event');

const getFilePath = (file) => {
  if (!file) return undefined;
  const normalizedPath = file.path.replace(/\\/g, '/');
  const uploadIndex = normalizedPath.indexOf('/uploads/');
  return uploadIndex >= 0 ? normalizedPath.slice(uploadIndex) : `/${normalizedPath}`;
};

const withUploadedEventFiles = (body, files = {}) => {
  const data = { ...body };
  const featuredImage = getFilePath(files.featuredImage?.[0]);
  const eventVideo = getFilePath(files.eventVideo?.[0]);

  if (featuredImage) data.featuredImage = featuredImage;
  if (eventVideo) data.eventVideo = eventVideo;

  return data;
};

const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const filter = { status: 'published' };
    if (type) filter.type = type;

    const events = await Event.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: { events, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('organizers', 'firstName lastName');
    
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: { event } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getManageEvents = async (req, res) => {
  try {
    const { page = 1, limit = 100, type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const events = await Event.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: { events, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...withUploadedEventFiles(req.body, req.files), createdBy: req.user.id });
    res.status(201).json({ success: true, data: { event } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, withUploadedEventFiles(req.body, req.files), { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: { event } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }
    
    event.attendees.push(req.user.id);
    event.registeredCount = event.attendees.length;
    await event.save();
    
    res.json({ success: true, message: 'Registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const events = await Event.find({ startDate: { $gte: new Date() }, status: 'published' })
      .sort({ startDate: 1 })
      .limit(limit);
    res.json({ success: true, data: { events } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const cancelRegistration = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

const getEventsByMonth = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

const getEventAttendees = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

const checkInAttendee = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

const addEventFeedback = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

const getEventStats = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

const exportEvents = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

module.exports = {
  getEvents,
  getManageEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getUpcomingEvents,
  cancelRegistration,
  getEventsByMonth,
  getEventAttendees,
  checkInAttendee,
  addEventFeedback,
  getEventStats,
  exportEvents
};
