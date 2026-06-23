const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const { recordAuditLog } = require('../utils/auditLogger');
const { getUploadedFilePath } = require('../utils/uploadedFile');

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const withUploadedEventFiles = (body, files = {}) => {
  const data = { ...body };
  delete data.createdBy;
  delete data.createdAt;
  const featuredImage = getUploadedFilePath(files.featuredImage?.[0]);
  const eventVideo = getUploadedFilePath(files.eventVideo?.[0]);

  if (featuredImage) data.featuredImage = featuredImage;
  if (eventVideo) data.eventVideo = eventVideo;

  return data;
};

const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const now = new Date();
    const filter = {
      status: 'published',
      endDate: { $gte: now },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: now } }
      ]
    };
    if (type) filter.type = type;

    const events = await Event.find(filter)
      .populate('createdBy', 'firstName lastName role')
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
      .populate('createdBy', 'firstName lastName role')
      .populate('organizers', 'firstName lastName role');
    
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
      .populate('createdBy', 'firstName lastName role')
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
    await recordAuditLog(req, {
      action: 'event.create',
      resource: 'Event',
      resourceId: event._id,
      metadata: { title: event.title, status: event.status, startDate: event.startDate },
    });
    res.status(201).json({ success: true, data: { event } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, withUploadedEventFiles(req.body, req.files), { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await recordAuditLog(req, {
      action: 'event.update',
      resource: 'Event',
      resourceId: event._id,
      metadata: { title: event.title, status: event.status, changedFields: Object.keys(req.body || {}) },
    });
    res.json({ success: true, data: { event } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await recordAuditLog(req, {
      action: 'event.delete',
      resource: 'Event',
      resourceId: event._id,
      metadata: { title: event.title, status: event.status },
    });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Registration is only available for published events' });
    }

    if (!event.registrationRequired) {
      return res.status(400).json({ success: false, message: 'Registration is not required for this event' });
    }

    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    const userId = req.user.id.toString();
    if (event.attendees.some((attendee) => attendee.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    if (event.capacity > 0 && event.attendees.length >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
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
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user.id.toString();
    if (!event.attendees.some((attendee) => attendee.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'You are not registered for this event' });
    }

    event.attendees = event.attendees.filter((attendee) => attendee.toString() !== userId);
    event.checkedInAttendees = (event.checkedInAttendees || []).filter((attendee) => attendee.toString() !== userId);
    event.registeredCount = event.attendees.length;
    await event.save();

    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getEventsByMonth = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const status = req.query.status || 'published';

    const results = await Event.aggregate([
      { $match: { status, startDate: { $exists: true } } },
      { $project: {
          title: 1,
          type: 1,
          status: 1,
          location: 1,
          startDate: 1,
          endDate: 1,
          month: { $month: '$startDate' },
          year: { $year: '$startDate' }
        }
      },
      { $match: { year } },
      { $sort: { startDate: 1 } },
      { $group: {
          _id: '$month',
          events: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = results.map((group) => ({
      month: group._id,
      monthName: monthNames[group._id - 1] || 'Unknown',
      count: group.count,
      events: group.events
    }));

    res.json({ success: true, data: { year, months } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendees', 'firstName lastName email role');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({
      success: true,
      data: {
        event: { id: event._id, _id: event._id, title: event.title, startDate: event.startDate, checkedInAttendees: event.checkedInAttendees || [] },
        attendees: event.attendees,
        attendeeCount: event.attendees.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const checkInAttendee = async (req, res) => {
  try {
    const { attendeeId } = req.body;
    if (!attendeeId) {
      return res.status(400).json({ success: false, message: 'attendeeId is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (!event.attendees.some((attendee) => attendee.toString() === attendeeId.toString())) {
      return res.status(400).json({ success: false, message: 'Attendee is not registered for this event' });
    }

    event.checkedInAttendees = event.checkedInAttendees || [];
    if (event.checkedInAttendees.some((attendee) => attendee.toString() === attendeeId.toString())) {
      return res.status(400).json({ success: false, message: 'Attendee is already checked in' });
    }

    event.checkedInAttendees.push(attendeeId);
    await event.save();

    await recordAuditLog(req, {
      action: 'event.checkin',
      resource: 'Event',
      resourceId: event._id,
      metadata: { attendeeId, title: event.title }
    });

    res.json({ success: true, message: 'Attendee checked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const addEventFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const { subject, message, rating, isAnonymous } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      type: 'event',
      subject,
      message,
      rating,
      isAnonymous: Boolean(isAnonymous)
    });

    res.status(201).json({ success: true, data: { feedback } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getEventStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    const upcomingEvents = await Event.countDocuments({ status: 'published', startDate: { $gte: new Date() } });

    const attendeeAggregate = await Event.aggregate([
      { $group: { _id: null, totalAttendees: { $sum: '$registeredCount' } } }
    ]);
    const totalAttendees = attendeeAggregate[0]?.totalAttendees || 0;

    const eventsByType = await Event.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const eventsByStatus = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const topEvents = await Event.find()
      .sort({ registeredCount: -1 })
      .limit(5)
      .select('title registeredCount status startDate');

    res.json({
      success: true,
      data: {
        totals: {
          totalEvents,
          publishedEvents,
          upcomingEvents,
          totalAttendees
        },
        eventsByType,
        eventsByStatus,
        topEvents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const exportEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ startDate: 1 });

    const escapeCsv = (value) => {
      if (value === undefined || value === null) return '';
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Event ID',
      'Title',
      'Type',
      'Status',
      'Start Date',
      'End Date',
      'Start Time',
      'End Time',
      'Location',
      'Capacity',
      'Registration Required',
      'Registered Count',
      'Checked In Count',
      'Created By',
      'Created At'
    ];

    const rows = events.map((event) => [
      event._id,
      event.title,
      event.type,
      event.status,
      event.startDate?.toISOString() || '',
      event.endDate?.toISOString() || '',
      event.startTime || '',
      event.endTime || '',
      event.location || '',
      event.capacity ?? 0,
      event.registrationRequired ? 'Yes' : 'No',
      event.registeredCount ?? event.attendees.length,
      (event.checkedInAttendees || []).length,
      event.createdBy ? `${event.createdBy.firstName || ''} ${event.createdBy.lastName || ''} <${event.createdBy.email || ''}>`.trim() : '',
      event.createdAt?.toISOString() || ''
    ]);

    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events_export.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
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
