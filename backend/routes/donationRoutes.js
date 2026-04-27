const express = require('express');
const router = express.Router();
const { getDonations, createDonation, getDonationStats } = require('../controllers/donationController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getDonations);
router.get('/stats', protect, admin, getDonationStats);
router.post('/', protect, createDonation);

module.exports = router;