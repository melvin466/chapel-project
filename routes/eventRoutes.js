const express = require('express');
const router = express.Router();
const { 
  getEvents, getEventById, createEvent, updateEvent, deleteEvent, 
  registerForEvent, getUpcomingEvents 
} = require('../controllers/eventController');
const { protect, admin, chaplain } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/:id', getEventById);
router.post('/', protect, chaplain, validateEvent, createEvent);
router.post('/:id/register', protect, registerForEvent);
router.put('/:id', protect, chaplain, validateEvent, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;