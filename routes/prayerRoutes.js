const express = require('express');
const router = express.Router();
const { getPrayerRequests, createPrayerRequest, prayForRequest, updatePrayerStatus } = require('../controllers/prayerController');
const { protect, admin } = require('../middleware/auth');
const { validatePrayerRequest } = require('../middleware/validation');

router.get('/', protect, getPrayerRequests);
router.post('/', protect, validatePrayerRequest, createPrayerRequest);
router.post('/:id/pray', protect, prayForRequest);
router.put('/:id/status', protect, admin, updatePrayerStatus);

module.exports = router;