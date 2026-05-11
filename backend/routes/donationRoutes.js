const express = require('express');
const router = express.Router();
const { getDonations, getDonationOptions, createDonation, getDonationStats, handlePaymentCallback } = require('../controllers/donationController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getDonations);
router.get('/options', protect, getDonationOptions);
router.get('/stats', protect, admin, getDonationStats);
router.post('/', protect, createDonation);
router.post('/callback', handlePaymentCallback);

module.exports = router;
