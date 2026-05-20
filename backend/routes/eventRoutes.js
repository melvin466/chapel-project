const express = require('express');
const router = express.Router();
const {
  getEvents,
  getManageEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getUpcomingEvents,
  getEventsByMonth,
  getEventAttendees,
  checkInAttendee,
  addEventFeedback,
  getEventStats,
  exportEvents
} = require('../controllers/eventController');
const { protect, admin, chaplain } = require('../middleware/auth');
const upload = require('../middleware/upload');

const eventUpload = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'eventVideo', maxCount: 1 }
]);

// Public routes (anyone can view)
router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/calendar', getEventsByMonth);
router.get('/manage/all', protect, admin, getManageEvents);
router.get('/stats/summary', protect, admin, getEventStats);
router.get('/export/all', protect, admin, exportEvents);
router.get('/:id', getEventById);

// Protected routes (require login to register)
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);
router.post('/:id/feedback', protect, addEventFeedback);

// Admin only routes (create, update, delete events)
router.post('/', protect, admin, eventUpload, createEvent);
router.put('/:id', protect, admin, eventUpload, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);
router.get('/:id/attendees', protect, admin, getEventAttendees);
router.post('/:id/checkin', protect, admin, checkInAttendee);

module.exports = router;
