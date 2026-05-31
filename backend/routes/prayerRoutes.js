const express = require('express');
const router = express.Router();
const { getPrayerRequests, createPrayerRequest, prayForRequest, updatePrayerStatus, deletePrayerRequest } = require('../controllers/prayerController');
const { protect, admin, chaplain } = require('../middleware/auth');
const { validatePrayerRequest } = require('../middleware/validation');

router.get('/', protect, getPrayerRequests);
router.post('/', protect, validatePrayerRequest, createPrayerRequest);
router.post('/:id/pray', protect, prayForRequest);
router.put('/:id/status', protect, chaplain, updatePrayerStatus);
router.delete('/:id', protect, admin, deletePrayerRequest);

module.exports = router;
