const express = require('express');
const router = express.Router();
const { getBookings, getManageBookings, createBooking, cancelBooking, updateManagedBooking } = require('../controllers/bookingController');
const { protect, chaplain } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

router.get('/manage/all', protect, chaplain, getManageBookings);
router.get('/', protect, getBookings);
router.post('/', protect, validateBooking, createBooking);
router.put('/:id/manage', protect, chaplain, updateManagedBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
