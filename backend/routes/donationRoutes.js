const express = require('express');
const router = express.Router();
const {
  getDonations,
  getManageDonations,
  getDonationOptions,
  createDonation,
  getDonationStats,
  updateManagedDonation,
  handlePaymentCallback,
} = require('../controllers/donationController');
const { protect, admin } = require('../middleware/auth');

router.get('/manage/all', protect, admin, getManageDonations);
router.get('/', protect, getDonations);
router.get('/options', protect, getDonationOptions);
router.get('/stats', protect, admin, getDonationStats);
router.post('/', protect, createDonation);
router.put('/:id/manage', protect, admin, updateManagedDonation);
router.all('/callback', handlePaymentCallback);

module.exports = router;
