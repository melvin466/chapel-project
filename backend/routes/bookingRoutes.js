const express = require('express');
const router = express.Router();
const { getBookings, createBooking, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

router.get('/', protect, getBookings);
router.post('/', protect, validateBooking, createBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;